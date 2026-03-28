#!/usr/bin/env node
/**
 * First-time setup script for Kisan Sahayak.
 * Run with: node scripts/setup.js   OR   npm run setup
 *
 * What it does:
 *  1. Copies backend/.env.example → backend/.env  (if .env doesn't exist)
 *  2. Creates backend/data/ directory
 *  3. Runs database seed (15 agricultural schemes)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const backendDir = path.join(root, 'backend');
const envSrc = path.join(backendDir, '.env.example');
const envDst = path.join(backendDir, '.env');
const dataDir = path.join(backendDir, 'data');

console.log('\n🌾  Kisan Sahayak — First-time Setup\n');

// 1. Copy .env
if (fs.existsSync(envDst)) {
  console.log('✅  backend/.env already exists — skipping copy.');
} else {
  fs.copyFileSync(envSrc, envDst);
  console.log('✅  Copied backend/.env.example → backend/.env');
  console.log('    ⚠️   Edit backend/.env to set a strong JWT_SECRET before going to production.');
}

// 2. Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅  Created backend/data/ directory');
}

// 3. Seed the database
console.log('\n📦  Seeding database with agricultural schemes...');
try {
  execSync('npm --prefix backend run seed', { cwd: root, stdio: 'inherit' });
  console.log('\n✅  Seed complete!\n');
} catch (e) {
  console.error('\n❌  Seed failed. Make sure you ran "npm run install:all" first.\n');
  process.exit(1);
}

console.log('─────────────────────────────────────────────────');
console.log('🚀  Setup complete! Next steps:');
console.log('');
console.log('  Start both servers (recommended):');
console.log('    npm run dev');
console.log('');
console.log('  Or start separately:');
console.log('    npm run dev:backend    → http://localhost:5000');
console.log('    npm run dev:frontend   → http://localhost:3000');
console.log('');
console.log('  Create the first admin account:');
console.log('    Open http://localhost:3000/setup');
console.log('    Default setup key: kisan_setup_2024');
console.log('─────────────────────────────────────────────────\n');
