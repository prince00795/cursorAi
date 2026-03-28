import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db, { runTransaction } from '../models/database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { computeEligibleSchemes, cacheEligibility } from '../services/eligibilityEngine';

const router = Router();

// node:sqlite rejects undefined; use this to coerce optional fields to null
function n(v: unknown): string | number | null {
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return v as string | number;
}

// Create/update farmer profile (authenticated user)
router.post('/profile', authenticateToken, (req: AuthRequest, res: Response): void => {
  const userId = req.user!.id;
  const {
    name, phone, aadhar,
    state, district, village, pincode,
    land_area_acres, land_type, caste, annual_income,
    crops, irrigation_type, bank_account,
    smartphone_proficiency, preferred_language,
    previously_allotted_schemes,
  } = req.body;

  if (!state || !district || !land_area_acres || !caste || !annual_income || !crops) {
    res.status(400).json({ error: 'Required fields: state, district, land_area_acres, caste, annual_income, crops' });
    return;
  }

  const existing = db.prepare('SELECT id FROM farmers WHERE user_id = ?').get(userId) as { id: string } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE farmers SET
        name=?, phone=?, aadhar=?,
        state=?, district=?, village=?, pincode=?,
        land_area_acres=?, land_type=?, caste=?, annual_income=?,
        crops=?, irrigation_type=?, bank_account=?,
        smartphone_proficiency=?, preferred_language=?,
        previously_allotted_schemes=?, updated_at=CURRENT_TIMESTAMP
      WHERE user_id=?
    `).run(
      n(name), n(phone), n(aadhar),
      n(state), n(district), n(village), n(pincode),
      n(land_area_acres), land_type || 'owned', n(caste), n(annual_income),
      JSON.stringify(crops), irrigation_type || 'rain-fed', bank_account ? 1 : 0,
      smartphone_proficiency || 'medium', preferred_language || 'hindi',
      JSON.stringify(previously_allotted_schemes || []),
      userId,
    );
    cacheEligibility(existing.id);
    res.json({ message: 'Profile updated', farmer_id: existing.id });
  } else {
    const farmerId = uuidv4();
    const userRow = db.prepare('SELECT name, phone FROM users WHERE id = ?').get(userId) as
      | { name: string; phone: string }
      | undefined;

    db.prepare(`
      INSERT INTO farmers (
        id, user_id, name, phone, aadhar,
        state, district, village, pincode,
        land_area_acres, land_type, caste, annual_income,
        crops, irrigation_type, bank_account,
        smartphone_proficiency, preferred_language, previously_allotted_schemes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      farmerId, userId,
      n(name) ?? n(userRow?.name), n(phone) ?? n(userRow?.phone), n(aadhar),
      n(state), n(district), n(village), n(pincode),
      n(land_area_acres), land_type || 'owned', n(caste), n(annual_income),
      JSON.stringify(crops), irrigation_type || 'rain-fed', bank_account ? 1 : 0,
      smartphone_proficiency || 'medium', preferred_language || 'hindi',
      JSON.stringify(previously_allotted_schemes || []),
    );
    cacheEligibility(farmerId);
    res.status(201).json({ message: 'Profile created', farmer_id: farmerId });
  }
});

// Get own farmer profile
router.get('/profile', authenticateToken, (req: AuthRequest, res: Response): void => {
  const farmer = db.prepare('SELECT * FROM farmers WHERE user_id = ?').get(req.user!.id);
  if (!farmer) {
    res.status(404).json({ error: 'Farmer profile not found. Please complete your profile.' });
    return;
  }
  res.json(farmer);
});

// Get eligible schemes for logged-in farmer
router.get('/my-schemes', authenticateToken, (req: AuthRequest, res: Response): void => {
  const farmer = db.prepare('SELECT * FROM farmers WHERE user_id = ?').get(req.user!.id) as
    | Parameters<typeof computeEligibleSchemes>[0]
    | undefined;

  if (!farmer) {
    res.status(404).json({ error: 'Farmer profile not found' });
    return;
  }

  const matches = computeEligibleSchemes(farmer);
  const eligible = matches.filter(m => m.eligible);
  const ineligible = matches.filter(m => !m.eligible).slice(0, 5);

  res.json({
    eligible_schemes: eligible,
    other_schemes: ineligible,
    total_eligible: eligible.length,
  });
});

// Admin: get all farmers
router.get('/', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response): void => {
  const farmers = db.prepare('SELECT * FROM farmers ORDER BY created_at DESC').all();
  res.json(farmers);
});

// Admin: get single farmer by id
router.get('/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(req.params.id);
  if (!farmer) {
    res.status(404).json({ error: 'Farmer not found' });
    return;
  }
  res.json(farmer);
});

// Admin: add farmer from survey data (bulk import)
router.post('/survey-import', authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  const farmers: Record<string, unknown>[] = req.body.farmers;
  if (!Array.isArray(farmers)) {
    res.status(400).json({ error: 'Expected array of farmers' });
    return;
  }

  const created: string[] = [];
  const findUserByPhone = db.prepare('SELECT id FROM users WHERE phone = ?');
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, name, phone, role) VALUES (?, ?, ?, 'farmer')
  `);
  const insertFarmer = db.prepare(`
    INSERT OR IGNORE INTO farmers (
      id, user_id, name, phone, aadhar,
      state, district, village, pincode,
      land_area_acres, land_type, caste, annual_income,
      crops, irrigation_type, bank_account,
      smartphone_proficiency, preferred_language, previously_allotted_schemes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  type SV = string | number | null;
  runTransaction(() => {
    for (const f of farmers) {
      const phone = f.phone as string;
      // Try to insert user; if phone already exists, reuse the existing user id
      const newUserId = uuidv4();
      insertUser.run(newUserId, f.name as SV, phone);
      const existingUser = findUserByPhone.get(phone) as { id: string } | undefined;
      const userId = existingUser?.id ?? newUserId;

      const farmerId = uuidv4();
      insertFarmer.run(
        farmerId, userId,
        f.name as SV, phone, (f.aadhar as SV) || null,
        f.state as SV, f.district as SV, (f.village as SV) || null, (f.pincode as SV) || null,
        f.land_area_acres as SV, (f.land_type as SV) || 'owned', f.caste as SV, f.annual_income as SV,
        JSON.stringify(f.crops || []),
        (f.irrigation_type as SV) || 'rain-fed',
        f.bank_account ? 1 : 0,
        (f.smartphone_proficiency as SV) || 'none',
        (f.preferred_language as SV) || 'hindi',
        JSON.stringify(f.previously_allotted_schemes || []),
      );
      created.push(farmerId);
    }
  });

  // Cache eligibility for all imported farmers
  created.forEach(id => cacheEligibility(id));

  res.status(201).json({ message: `Imported ${created.length} farmers`, farmer_ids: created });
});

export default router;
