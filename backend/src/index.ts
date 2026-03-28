import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './models/database';
import authRoutes from './routes/auth';
import farmerRoutes from './routes/farmers';
import schemeRoutes from './routes/schemes';
import applicationRoutes from './routes/applications';
import callRoutes from './routes/calls';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/admin', adminRoutes);

// Initialize DB then start server
initDatabase();

app.listen(PORT, () => {
  console.log(`Kisan Sahayak API running on port ${PORT}`);
});

export default app;
