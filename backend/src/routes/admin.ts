import { Router, Response } from 'express';
import db from '../models/database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Dashboard stats
router.get('/stats', authenticateToken, requireAdmin, (_req: AuthRequest, res: Response): void => {
  const totalFarmers = (db.prepare('SELECT COUNT(*) as cnt FROM farmers').get() as { cnt: number }).cnt;
  const totalSchemes = (db.prepare('SELECT COUNT(*) as cnt FROM schemes WHERE is_active = 1').get() as { cnt: number }).cnt;
  const totalApplications = (db.prepare('SELECT COUNT(*) as cnt FROM applications').get() as { cnt: number }).cnt;
  const appliedCount = (db.prepare("SELECT COUNT(*) as cnt FROM applications WHERE status = 'applied'").get() as { cnt: number }).cnt;
  const pendingCalls = (db.prepare("SELECT COUNT(*) as cnt FROM call_logs WHERE status IN ('pending','scheduled')").get() as { cnt: number }).cnt;
  const completedCalls = (db.prepare("SELECT COUNT(*) as cnt FROM call_logs WHERE status = 'completed'").get() as { cnt: number }).cnt;

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM applications GROUP BY status
  `).all();

  const schemesByCategory = db.prepare(`
    SELECT category, COUNT(*) as count FROM schemes WHERE is_active = 1 GROUP BY category
  `).all();

  const topSchemes = db.prepare(`
    SELECT s.name, COUNT(a.id) as applications
    FROM schemes s
    LEFT JOIN applications a ON s.id = a.scheme_id
    GROUP BY s.id
    ORDER BY applications DESC
    LIMIT 5
  `).all();

  const recentFarmers = db.prepare(`
    SELECT id, name, phone, state, district, smartphone_proficiency, created_at
    FROM farmers ORDER BY created_at DESC LIMIT 10
  `).all();

  res.json({
    summary: { totalFarmers, totalSchemes, totalApplications, appliedCount, pendingCalls, completedCalls },
    byStatus,
    schemesByCategory,
    topSchemes,
    recentFarmers,
  });
});

// Create admin user (only from existing admin)
router.post('/create-admin', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) {
    res.status(400).json({ error: 'Name, phone and password required' });
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  db.prepare('INSERT INTO users (id, name, phone, password_hash, role) VALUES (?, ?, ?, ?, \'admin\')').run(id, name, phone, hash);
  res.status(201).json({ id, message: 'Admin created' });
});

// Seed initial admin (one-time setup endpoint, disabled after first admin exists)
router.post('/setup', async (req: AuthRequest, res: Response): Promise<void> => {
  const adminCount = (db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'").get() as { cnt: number }).cnt;
  if (adminCount > 0) {
    res.status(403).json({ error: 'Setup already completed' });
    return;
  }

  const { name, phone, password, setup_key } = req.body;
  if (setup_key !== (process.env.SETUP_KEY || 'kisan_setup_2024')) {
    res.status(403).json({ error: 'Invalid setup key' });
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  db.prepare('INSERT INTO users (id, name, phone, password_hash, role) VALUES (?, ?, ?, ?, \'admin\')').run(id, name, phone, hash);
  res.status(201).json({ id, message: 'Admin setup complete' });
});

export default router;
