import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all active schemes (public)
router.get('/', (_req: Request, res: Response): void => {
  const { category, search } = _req.query;
  let query = 'SELECT * FROM schemes WHERE is_active = 1';
  const params: unknown[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY priority_score DESC';
  const schemes = db.prepare(query).all(...params);
  res.json(schemes);
});

// Get single scheme
router.get('/:id', (req: Request, res: Response): void => {
  const scheme = db.prepare('SELECT * FROM schemes WHERE id = ?').get(req.params.id);
  if (!scheme) {
    res.status(404).json({ error: 'Scheme not found' });
    return;
  }
  res.json(scheme);
});

// Get scheme categories
router.get('/meta/categories', (_req: Request, res: Response): void => {
  const cats = db.prepare('SELECT DISTINCT category FROM schemes WHERE is_active = 1').all();
  res.json(cats);
});

// Admin: create scheme
router.post('/', authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  const {
    name, name_hindi, ministry, category, description, description_hindi,
    benefits, benefits_hindi, eligibility_criteria, required_documents,
    application_url, helpline, deadline,
    min_land_acres, max_land_acres, min_income, max_income,
    eligible_castes, eligible_states, eligible_crops,
    land_type_required, requires_bank_account, priority_score,
  } = req.body;

  if (!name || !ministry || !category || !description || !benefits || !eligibility_criteria || !required_documents) {
    res.status(400).json({ error: 'Required fields missing' });
    return;
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO schemes (
      id, name, name_hindi, ministry, category, description, description_hindi,
      benefits, benefits_hindi, eligibility_criteria, required_documents,
      application_url, helpline, deadline,
      min_land_acres, max_land_acres, min_income, max_income,
      eligible_castes, eligible_states, eligible_crops,
      land_type_required, requires_bank_account, priority_score
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, name, name_hindi, ministry, category, description, description_hindi,
    benefits, benefits_hindi, eligibility_criteria,
    JSON.stringify(required_documents),
    application_url, helpline, deadline,
    min_land_acres || 0, max_land_acres || null, min_income || 0, max_income || null,
    JSON.stringify(eligible_castes || ['all']),
    JSON.stringify(eligible_states || ['all']),
    JSON.stringify(eligible_crops || ['all']),
    land_type_required || 'any', requires_bank_account ? 1 : 0, priority_score || 50,
  );

  res.status(201).json({ id, message: 'Scheme created' });
});

// Admin: update scheme
router.put('/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM schemes WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Scheme not found' });
    return;
  }

  const fields = req.body;
  const setClauses: string[] = [];
  const values: unknown[] = [];

  const allowedFields = [
    'name', 'name_hindi', 'ministry', 'category', 'description', 'description_hindi',
    'benefits', 'benefits_hindi', 'eligibility_criteria', 'application_url',
    'helpline', 'deadline', 'min_land_acres', 'max_land_acres', 'min_income', 'max_income',
    'land_type_required', 'requires_bank_account', 'priority_score', 'is_active',
  ];
  const jsonFields = ['required_documents', 'eligible_castes', 'eligible_states', 'eligible_crops'];

  for (const [key, val] of Object.entries(fields)) {
    if (allowedFields.includes(key)) {
      setClauses.push(`${key} = ?`);
      values.push(val);
    } else if (jsonFields.includes(key)) {
      setClauses.push(`${key} = ?`);
      values.push(JSON.stringify(val));
    }
  }

  if (setClauses.length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }

  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`UPDATE schemes SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  res.json({ message: 'Scheme updated' });
});

export default router;
