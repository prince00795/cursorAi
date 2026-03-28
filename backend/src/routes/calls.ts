import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { generateCallScript, scheduleFollowUpCall, logCallOutcome, getFarmersForOutboundCalls } from '../services/callService';
import { computeEligibleSchemes } from '../services/eligibilityEngine';

const router = Router();

// Get pending/scheduled calls (admin)
router.get('/pending', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response): void => {
  const calls = db.prepare(`
    SELECT cl.*, f.name as farmer_name, f.phone as farmer_phone, f.preferred_language
    FROM call_logs cl
    JOIN farmers f ON cl.farmer_id = f.id
    WHERE cl.status IN ('pending', 'scheduled')
    ORDER BY cl.scheduled_at ASC
  `).all();
  res.json(calls);
});

// Get call history (admin)
router.get('/history', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response): void => {
  const calls = db.prepare(`
    SELECT cl.*, f.name as farmer_name, f.phone as farmer_phone
    FROM call_logs cl
    JOIN farmers f ON cl.farmer_id = f.id
    ORDER BY cl.created_at DESC
    LIMIT 100
  `).all();
  res.json(calls);
});

// Get farmers eligible for outbound calls
router.get('/outbound-queue', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response): void => {
  const farmers = getFarmersForOutboundCalls();
  res.json(farmers);
});

// Generate call script for a farmer
router.get('/script/:farmerId', authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(req.params.farmerId) as
    | (Parameters<typeof computeEligibleSchemes>[0] & {
        name: string;
        phone: string;
        preferred_language: string;
        smartphone_proficiency: string;
      })
    | undefined;

  if (!farmer) {
    res.status(404).json({ error: 'Farmer not found' });
    return;
  }

  const matches = computeEligibleSchemes(farmer);
  const eligibleSchemes = matches.filter(m => m.eligible).slice(0, 5).map(m => m.scheme);

  const script = generateCallScript(
    { id: farmer.id, name: farmer.name, phone: farmer.phone, preferred_language: farmer.preferred_language, smartphone_proficiency: farmer.smartphone_proficiency },
    eligibleSchemes as Parameters<typeof generateCallScript>[1],
    farmer.preferred_language || 'hindi',
  );

  res.json({ farmer, script, eligible_schemes: eligibleSchemes });
});

// Log a new outbound call attempt
router.post('/initiate', authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  const { farmer_id, schemes_discussed } = req.body;

  const farmer = db.prepare('SELECT id, name, phone FROM farmers WHERE id = ?').get(farmer_id);
  if (!farmer) {
    res.status(404).json({ error: 'Farmer not found' });
    return;
  }

  const callId = uuidv4();
  db.prepare(`
    INSERT INTO call_logs (id, farmer_id, call_type, status, schemes_discussed, scheduled_at)
    VALUES (?, ?, 'initial', 'in_progress', ?, CURRENT_TIMESTAMP)
  `).run(callId, farmer_id, JSON.stringify(schemes_discussed || []));

  // Twilio integration hook (when credentials provided)
  let twilioMessage = null;
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_PHONE_NUMBER) {
    twilioMessage = 'Twilio call would be initiated here';
    // In production: use twilio SDK to make call
  }

  res.json({ call_id: callId, message: 'Call logged', twilio_status: twilioMessage });
});

// Record call outcome / follow-up
router.post('/outcome', authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  const { call_id, outcome, notes, application_number, schedule_followup, followup_days } = req.body;

  logCallOutcome(call_id, outcome, notes, application_number);

  let followupId = null;
  if (schedule_followup) {
    const call = db.prepare('SELECT farmer_id FROM call_logs WHERE id = ?').get(call_id) as { farmer_id: string } | undefined;
    if (call) {
      followupId = scheduleFollowUpCall(call.farmer_id, followup_days || 7);
    }
  }

  res.json({ message: 'Outcome recorded', followup_call_id: followupId });
});

// Twilio webhook - call status callback
router.post('/webhook/twilio', (req: Request, res: Response): void => {
  const { CallSid, CallStatus, CallDuration, To } = req.body;

  if (CallSid) {
    db.prepare(`
      UPDATE call_logs
      SET twilio_call_sid = ?, status = ?, duration_seconds = ?, called_at = CURRENT_TIMESTAMP
      WHERE twilio_call_sid = ? OR (farmer_id IN (
        SELECT id FROM farmers WHERE phone = ?
      ) AND status = 'in_progress')
    `).run(CallSid, CallStatus === 'completed' ? 'completed' : 'failed', CallDuration || 0, CallSid, To);
  }

  res.status(200).send('<Response></Response>');
});

export default router;
