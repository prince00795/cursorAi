import db from '../models/database';
import { v4 as uuidv4 } from 'uuid';

interface CallableFarmer {
  id: string;
  name: string;
  phone: string;
  preferred_language: string;
  smartphone_proficiency: string;
}

interface SchemeForCall {
  id: string;
  name: string;
  name_hindi: string;
  benefits: string;
  benefits_hindi: string;
  required_documents: string;
  deadline: string;
  helpline: string;
  application_url: string;
}

export interface CallScript {
  greeting: string;
  scheme_summaries: Array<{
    name: string;
    benefits: string;
    deadline: string;
    documents: string[];
    where_to_apply: string;
    approximate_charges: string;
  }>;
  followup_questions: string[];
  closing: string;
}

export function generateCallScript(farmer: CallableFarmer, schemes: SchemeForCall[], language: string = 'hindi'): CallScript {
  const isHindi = language === 'hindi';

  const greeting = isHindi
    ? `नमस्ते ${farmer.name} जी! मैं किसान सहायक से बोल रहा हूँ। हमारे पास आपके लिए कुछ सरकारी योजनाओं की जानकारी है जिनके लिए आप पात्र हैं।`
    : `Hello ${farmer.name}! I am calling from Kisan Sahayak. We have information about government schemes you are eligible for.`;

  const schemeSummaries = schemes.slice(0, 3).map(scheme => {
    const docs: string[] = JSON.parse(scheme.required_documents || '[]');
    const benefits = isHindi && scheme.benefits_hindi ? scheme.benefits_hindi : scheme.benefits;
    const name = isHindi && scheme.name_hindi ? scheme.name_hindi : scheme.name;

    return {
      name,
      benefits: benefits.substring(0, 200),
      deadline: scheme.deadline || (isHindi ? 'कोई अंतिम तिथि नहीं' : 'No specific deadline'),
      documents: docs.slice(0, 5),
      where_to_apply: scheme.application_url
        ? (isHindi ? `ऑनलाइन: ${scheme.application_url} या नजदीकी CSC केंद्र पर जाएं` : `Online: ${scheme.application_url} or nearest CSC center`)
        : (isHindi ? 'नजदीकी CSC केंद्र या साइबर कैफे पर जाएं' : 'Visit nearest CSC center or cyber cafe'),
      approximate_charges: isHindi ? 'CSC केंद्र पर ₹30-₹100 शुल्क लग सकता है' : 'CSC center may charge ₹30-₹100',
    };
  });

  const followupQuestions = isHindi
    ? [
        'क्या आपने कोई आवेदन किया है?',
        'यदि हाँ, तो आवेदन नंबर बताएं ताकि हम ट्रैक कर सकें।',
        'यदि नहीं, तो कोई समस्या है जिसमें हम मदद कर सकते हैं?',
      ]
    : [
        'Have you applied for any scheme?',
        'If yes, please share the application number for tracking.',
        'If no, is there any difficulty we can help with?',
      ];

  const closing = isHindi
    ? `${farmer.name} जी, यदि कोई सहायता चाहिए तो हमारे हेल्पलाइन पर कॉल करें। कुछ दिनों में हम दोबारा आपसे संपर्क करेंगे। धन्यवाद!`
    : `${farmer.name}, if you need any help, please call our helpline. We will follow up with you in a few days. Thank you!`;

  return {
    greeting,
    scheme_summaries: schemeSummaries,
    followup_questions: followupQuestions,
    closing,
  };
}

export function scheduleFollowUpCall(farmerId: string, daysFromNow: number = 7): string {
  const callId = uuidv4();
  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + daysFromNow);

  db.prepare(`
    INSERT INTO call_logs (id, farmer_id, call_type, status, scheduled_at)
    VALUES (?, ?, 'follow_up', 'scheduled', ?)
  `).run(callId, farmerId, scheduledAt.toISOString());

  return callId;
}

export function logCallOutcome(callId: string, outcome: string, notes: string, applicationNumber?: string): void {
  db.prepare(`
    UPDATE call_logs 
    SET outcome = ?, notes = ?, status = 'completed', called_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(outcome, notes, callId);

  if (applicationNumber) {
    // Find the farmer and create/update application record
    const callLog = db.prepare('SELECT farmer_id, schemes_discussed FROM call_logs WHERE id = ?').get(callId) as
      | { farmer_id: string; schemes_discussed: string }
      | undefined;

    if (callLog) {
      const schemesDiscussed: string[] = JSON.parse(callLog.schemes_discussed || '[]');
      if (schemesDiscussed.length > 0) {
        const appId = uuidv4();
        db.prepare(`
          INSERT OR IGNORE INTO applications (id, farmer_id, scheme_id, application_number, status, applied_via, applied_at)
          VALUES (?, ?, ?, ?, 'applied', 'call_assistant', CURRENT_TIMESTAMP)
        `).run(appId, callLog.farmer_id, schemesDiscussed[0], applicationNumber);
      }
    }
  }
}

export function getFarmersForOutboundCalls(): CallableFarmer[] {
  return db.prepare(`
    SELECT f.id, f.name, f.phone, f.preferred_language, f.smartphone_proficiency
    FROM farmers f
    WHERE f.smartphone_proficiency IN ('none', 'low')
    AND f.id NOT IN (
      SELECT farmer_id FROM call_logs 
      WHERE status = 'scheduled' OR (status = 'completed' AND called_at > datetime('now', '-7 days'))
    )
    ORDER BY f.created_at DESC
    LIMIT 50
  `).all() as CallableFarmer[];
}
