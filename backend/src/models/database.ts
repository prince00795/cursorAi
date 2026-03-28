import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/kisan_sahayak.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db: DatabaseType = new Database(DB_PATH);

export function initDatabase(): void {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      aadhar TEXT UNIQUE,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'farmer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS farmers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      aadhar TEXT,
      state TEXT NOT NULL,
      district TEXT NOT NULL,
      village TEXT,
      pincode TEXT,
      land_area_acres REAL NOT NULL,
      land_type TEXT DEFAULT 'owned',
      caste TEXT NOT NULL,
      annual_income REAL NOT NULL,
      crops TEXT NOT NULL,
      irrigation_type TEXT DEFAULT 'rain-fed',
      bank_account INTEGER DEFAULT 0,
      smartphone_proficiency TEXT DEFAULT 'none',
      preferred_language TEXT DEFAULT 'hindi',
      previously_allotted_schemes TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schemes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_hindi TEXT,
      ministry TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      description_hindi TEXT,
      benefits TEXT NOT NULL,
      benefits_hindi TEXT,
      eligibility_criteria TEXT NOT NULL,
      required_documents TEXT NOT NULL,
      application_url TEXT,
      helpline TEXT,
      deadline TEXT,
      is_active INTEGER DEFAULT 1,
      min_land_acres REAL DEFAULT 0,
      max_land_acres REAL,
      min_income REAL DEFAULT 0,
      max_income REAL,
      eligible_castes TEXT DEFAULT '["all"]',
      eligible_states TEXT DEFAULT '["all"]',
      eligible_crops TEXT DEFAULT '["all"]',
      land_type_required TEXT DEFAULT 'any',
      requires_bank_account INTEGER DEFAULT 0,
      priority_score INTEGER DEFAULT 50,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
      scheme_id TEXT NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
      application_number TEXT,
      status TEXT DEFAULT 'interested',
      applied_at DATETIME,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      feedback TEXT,
      applied_via TEXT DEFAULT 'self',
      csc_center TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
      call_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      twilio_call_sid TEXT,
      scheduled_at DATETIME,
      called_at DATETIME,
      duration_seconds INTEGER DEFAULT 0,
      outcome TEXT,
      notes TEXT,
      schemes_discussed TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scheme_eligibility_cache (
      farmer_id TEXT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
      scheme_id TEXT NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
      eligible INTEGER DEFAULT 0,
      priority_rank INTEGER,
      computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (farmer_id, scheme_id)
    );
  `);

  console.log('Database initialized successfully');
}

export default db;
