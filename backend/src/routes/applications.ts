import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get my applications
router.get('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  const farmer = db.prepare('SELECT id FROM farmers WHERE user_id = ?').get(req.user!.id) as { id: string } | undefined;
  if (!farmer) {
    res.status(404).json({ error: 'Farmer profile not found' });
    return;
  }

  const applications = db.prepare(`
    SELECT a.*, s.name as scheme_name, s.name_hindi, s.ministry, s.category, s.benefits, s.helpline, s.application_url
    FROM applications a
    JOIN schemes s ON a.scheme_id = s.id
    WHERE a.farmer_id = ?
    ORDER BY a.created_at DESC
  `).all(farmer.id);

  res.json(applications);
});

// Mark interest / start application
router.post('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  const { scheme_id } = req.body;
  const farmer = db.prepare('SELECT id FROM farmers WHERE user_id = ?').get(req.user!.id) as { id: string } | undefined;

  if (!farmer) {
    res.status(404).json({ error: 'Farmer profile not found' });
    return;
  }

  const scheme = db.prepare('SELECT id FROM schemes WHERE id = ?').get(scheme_id);
  if (!scheme) {
    res.status(404).json({ error: 'Scheme not found' });
    return;
  }

  const existing = db.prepare('SELECT id FROM applications WHERE farmer_id = ? AND scheme_id = ?').get(farmer.id, scheme_id);
  if (existing) {
    res.status(409).json({ error: 'Already tracking this application' });
    return;
  }

  const appId = uuidv4();
  db.prepare(`
    INSERT INTO applications (id, farmer_id, scheme_id, status)
    VALUES (?, ?, ?, 'interested')
  `).run(appId, farmer.id, scheme_id);

  res.status(201).json({ id: appId, message: 'Scheme added to your tracker' });
});

// Update application status / add application number
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  const farmer = db.prepare('SELECT id FROM farmers WHERE user_id = ?').get(req.user!.id) as { id: string } | undefined;
  if (!farmer) {
    res.status(404).json({ error: 'Farmer profile not found' });
    return;
  }

  const app = db.prepare('SELECT * FROM applications WHERE id = ? AND farmer_id = ?').get(req.params.id, farmer.id) as
    | { id: string; farmer_id: string; scheme_id: string; status: string }
    | undefined;

  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  const { status, application_number, notes, feedback, applied_via, csc_center } = req.body;
  const updates: string[] = [];
  const values: unknown[] = [];

  if (status) { updates.push('status = ?'); values.push(status); }
  if (application_number) {
    updates.push('application_number = ?');
    updates.push('applied_at = CURRENT_TIMESTAMP');
    values.push(application_number);
  }
  if (notes) { updates.push('notes = ?'); values.push(notes); }
  if (feedback) { updates.push('feedback = ?'); values.push(feedback); }
  if (applied_via) { updates.push('applied_via = ?'); values.push(applied_via); }
  if (csc_center) { updates.push('csc_center = ?'); values.push(csc_center); }

  updates.push('last_updated = CURRENT_TIMESTAMP');
  values.push(req.params.id);

  db.prepare(`UPDATE applications SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json({ message: 'Application updated' });
});

// Admin: get all applications with filters
router.get('/admin/all', authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  const { status, scheme_id, farmer_id } = req.query;
  let query = `
    SELECT a.*, f.name as farmer_name, f.phone as farmer_phone,
           s.name as scheme_name, s.ministry
    FROM applications a
    JOIN farmers f ON a.farmer_id = f.id
    JOIN schemes s ON a.scheme_id = s.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (status) { query += ' AND a.status = ?'; params.push(status); }
  if (scheme_id) { query += ' AND a.scheme_id = ?'; params.push(scheme_id); }
  if (farmer_id) { query += ' AND a.farmer_id = ?'; params.push(farmer_id); }

  query += ' ORDER BY a.last_updated DESC';
  const apps = db.prepare(query).all(...params);
  res.json(apps);
});

export default router;
