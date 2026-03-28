import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Register / create account (farmer self-registration via website)
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { name, phone, password } = req.body;

  if (!name || !phone || !password) {
    res.status(400).json({ error: 'Name, phone and password are required' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existing) {
    res.status(409).json({ error: 'Phone number already registered' });
    return;
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (id, name, phone, password_hash, role)
      VALUES (?, ?, ?, ?, 'farmer')
    `).run(userId, name, phone, hash);

    const secret = process.env.JWT_SECRET || 'fallback_dev_secret';
    const token = jwt.sign({ id: userId, role: 'farmer', phone }, secret, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: userId, name, phone, role: 'farmer' } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    res.status(400).json({ error: 'Phone and password required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as
    | { id: string; name: string; phone: string; password_hash: string; role: string }
    | undefined;

  if (!user || !user.password_hash) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  const secret = process.env.JWT_SECRET || 'fallback_dev_secret';
  const token = jwt.sign({ id: user.id, role: user.role, phone: user.phone }, secret, { expiresIn: '7d' });

  res.json({ token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role } });
});

// Get current user profile
router.get('/me', authenticateToken, (req: AuthRequest, res: Response): void => {
  const user = db.prepare('SELECT id, name, phone, aadhar, role, created_at, last_login FROM users WHERE id = ?').get(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

// OTP-less phone login (for keypad phone users accessed by agent)
router.post('/agent-login', (req: Request, res: Response): void => {
  const { phone, agent_secret } = req.body;

  if (agent_secret !== (process.env.AGENT_SECRET || 'agent_dev_secret')) {
    res.status(403).json({ error: 'Unauthorized' });
    return;
  }

  const user = db.prepare('SELECT id, name, phone, role FROM users WHERE phone = ?').get(phone) as
    | { id: string; name: string; phone: string; role: string }
    | undefined;

  if (!user) {
    res.status(404).json({ error: 'Farmer not found' });
    return;
  }

  const secret = process.env.JWT_SECRET || 'fallback_dev_secret';
  const token = jwt.sign({ id: user.id, role: user.role, phone: user.phone }, secret, { expiresIn: '1h' });

  res.json({ token, user });
});

export default router;
