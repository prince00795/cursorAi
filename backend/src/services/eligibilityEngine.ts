import db, { runTransaction } from '../models/database';

export interface FarmerProfile {
  id: string;
  land_area_acres: number;
  land_type: string;
  caste: string;
  annual_income: number;
  crops: string; // JSON array string
  state: string;
  district: string;
  bank_account: number;
  previously_allotted_schemes: string; // JSON array string
}

export interface SchemeMatch {
  scheme: Scheme;
  eligible: boolean;
  priority_score: number;
  match_reasons: string[];
  missing_criteria: string[];
}

interface Scheme {
  id: string;
  name: string;
  name_hindi: string;
  ministry: string;
  category: string;
  description: string;
  description_hindi: string;
  benefits: string;
  benefits_hindi: string;
  eligibility_criteria: string;
  required_documents: string;
  application_url: string;
  helpline: string;
  deadline: string;
  min_land_acres: number;
  max_land_acres: number | null;
  min_income: number;
  max_income: number | null;
  eligible_castes: string;
  eligible_states: string;
  eligible_crops: string;
  land_type_required: string;
  requires_bank_account: number;
  priority_score: number;
  is_active: number;
}

export function computeEligibleSchemes(farmer: FarmerProfile): SchemeMatch[] {
  const schemes = db.prepare('SELECT * FROM schemes WHERE is_active = 1').all() as unknown as Scheme[];
  const farmerCrops: string[] = JSON.parse(farmer.crops || '[]');
  const previousSchemes: string[] = JSON.parse(farmer.previously_allotted_schemes || '[]');
  const results: SchemeMatch[] = [];

  for (const scheme of schemes) {
    const eligibleCastes: string[] = JSON.parse(scheme.eligible_castes || '["all"]');
    const eligibleStates: string[] = JSON.parse(scheme.eligible_states || '["all"]');
    const eligibleCrops: string[] = JSON.parse(scheme.eligible_crops || '["all"]');

    const matchReasons: string[] = [];
    const missingCriteria: string[] = [];
    let eligible = true;
    let score = scheme.priority_score;

    // Land area check
    if (farmer.land_area_acres < scheme.min_land_acres) {
      eligible = false;
      missingCriteria.push(`Minimum ${scheme.min_land_acres} acres required`);
    } else {
      matchReasons.push(`Land area ${farmer.land_area_acres} acres qualifies`);
      if (farmer.land_area_acres <= 2) score += 20; // Small farmers get priority
    }

    if (scheme.max_land_acres !== null && farmer.land_area_acres > scheme.max_land_acres) {
      eligible = false;
      missingCriteria.push(`Maximum ${scheme.max_land_acres} acres allowed`);
    }

    // Income check
    if (farmer.annual_income < scheme.min_income) {
      eligible = false;
      missingCriteria.push(`Minimum income ₹${scheme.min_income} required`);
    }

    if (scheme.max_income !== null && farmer.annual_income > scheme.max_income) {
      eligible = false;
      missingCriteria.push(`Income must be below ₹${scheme.max_income}`);
    } else if (scheme.max_income !== null) {
      matchReasons.push('Income within eligible range');
      score += 10;
    }

    // Caste check
    if (!eligibleCastes.includes('all')) {
      const casteNormalized = farmer.caste.toLowerCase();
      const castesNormalized = eligibleCastes.map(c => c.toLowerCase());
      if (!castesNormalized.includes(casteNormalized)) {
        eligible = false;
        missingCriteria.push(`Eligible castes: ${eligibleCastes.join(', ')}`);
      } else {
        matchReasons.push(`${farmer.caste} category eligible`);
        score += 15;
      }
    } else {
      matchReasons.push('Open to all castes');
    }

    // State check
    if (!eligibleStates.includes('all')) {
      const stateNormalized = farmer.state.toLowerCase();
      const statesNormalized = eligibleStates.map(s => s.toLowerCase());
      if (!statesNormalized.includes(stateNormalized)) {
        eligible = false;
        missingCriteria.push(`Available in: ${eligibleStates.join(', ')}`);
      } else {
        matchReasons.push(`Available in ${farmer.state}`);
        score += 5;
      }
    }

    // Crop check
    if (!eligibleCrops.includes('all')) {
      const farmerCropsLower = farmerCrops.map(c => c.toLowerCase());
      const eligibleCropsLower = eligibleCrops.map(c => c.toLowerCase());
      const hasMatchingCrop = farmerCropsLower.some(c => eligibleCropsLower.includes(c));
      if (!hasMatchingCrop) {
        eligible = false;
        missingCriteria.push(`For crops: ${eligibleCrops.join(', ')}`);
      } else {
        matchReasons.push('Grows eligible crops');
        score += 10;
      }
    }

    // Bank account check
    if (scheme.requires_bank_account && !farmer.bank_account) {
      eligible = false;
      missingCriteria.push('Bank account required for DBT');
    }

    // Land type check
    if (scheme.land_type_required !== 'any' && farmer.land_type !== scheme.land_type_required) {
      eligible = false;
      missingCriteria.push(`${scheme.land_type_required} land required`);
    }

    // Boost score if not previously received
    if (!previousSchemes.includes(scheme.id)) {
      score += 5;
    } else {
      score -= 20; // Deprioritize already received schemes
    }

    results.push({
      scheme,
      eligible,
      priority_score: score,
      match_reasons: matchReasons,
      missing_criteria: missingCriteria,
    });
  }

  // Sort: eligible first (by score desc), then ineligible
  results.sort((a, b) => {
    if (a.eligible && !b.eligible) return -1;
    if (!a.eligible && b.eligible) return 1;
    return b.priority_score - a.priority_score;
  });

  return results;
}

export function cacheEligibility(farmerId: string): void {
  const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(farmerId) as FarmerProfile | undefined;
  if (!farmer) return;

  const matches = computeEligibleSchemes(farmer);
  const upsert = db.prepare(`
    INSERT OR REPLACE INTO scheme_eligibility_cache (farmer_id, scheme_id, eligible, priority_rank, computed_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  runTransaction(() => {
    matches.forEach((item, index) => {
      upsert.run(farmerId, item.scheme.id, item.eligible ? 1 : 0, index + 1);
    });
  });
}
