import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');

try {
  const envFile = readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  });
} catch(e) {
  console.error('Could not read .env:', e.message);
}

// Fix for Node.js 24 + Neon SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL;
console.log('DB URL found:', !!url);
console.log('URL preview:', url ? url.substring(0, 50) + '...' : 'MISSING');

const sql = neon(url);

async function init() {
  console.log('Connecting to Neon...');

  await sql`SELECT 1`;
  console.log('Connection OK!');

  await sql`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'Viewer',
    created_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log('OK users table');

  await sql`CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    rta_id VARCHAR(20) UNIQUE,
    full_name VARCHAR(150),
    depot VARCHAR(60),
    nationality VARCHAR(60),
    license_number VARCHAR(40),
    license_issued DATE,
    license_expired DATE,
    place_of_issue VARCHAR(60),
    traffic_file VARCHAR(40),
    license_class VARCHAR(40),
    contractor VARCHAR(60),
    date_of_birth DATE,
    date_of_hire DATE,
    contact VARCHAR(40),
    passport_number VARCHAR(40),
    passport_expired DATE,
    emirates_id VARCHAR(40),
    visa_number VARCHAR(40),
    visa_issued DATE,
    visa_expired DATE,
    id_card_expired DATE,
    id_card_status VARCHAR(40),
    assignment_status VARCHAR(40),
    real_time_status VARCHAR(40) DEFAULT 'Active',
    date_of_resignation DATE,
    reason_for_leaving VARCHAR(150),
    medical_expired DATE,
    accommodation VARCHAR(80),
    vendor_number VARCHAR(30),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log('OK drivers table');

  await sql`CREATE TABLE IF NOT EXISTS recruitment (
    id SERIAL PRIMARY KEY,
    rta_id VARCHAR(20),
    license_number VARCHAR(40),
    full_name VARCHAR(150),
    nationality VARCHAR(60),
    dob DATE,
    license_issued DATE,
    license_expired DATE,
    place_of_issue VARCHAR(60),
    license_class VARCHAR(60),
    traffic_file VARCHAR(40),
    contact VARCHAR(40),
    age NUMERIC(4,1),
    company VARCHAR(60),
    road_test_date DATE,
    road_test_result VARCHAR(20),
    interview_date DATE,
    interview_result VARCHAR(40),
    remarks VARCHAR(150),
    status VARCHAR(40),
    training_batch VARCHAR(40),
    training_start DATE,
    training_end DATE,
    transfer_date DATE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log('OK recruitment table');

  const hash1 = await bcrypt.hash('admin123', 10);
  await sql`
    INSERT INTO users (username, email, password_hash, role)
    VALUES ('admin', 'admin@ds.ae', ${hash1}, 'Administrator')
    ON CONFLICT (username) DO NOTHING
  `;

  const hash2 = await bcrypt.hash('view2025', 10);
  await sql`
    INSERT INTO users (username, email, password_hash, role)
    VALUES ('viewer', 'viewer@ds.ae', ${hash2}, 'Viewer')
    ON CONFLICT (username) DO NOTHING
  `;

  console.log('OK users seeded (admin/admin123, viewer/view2025)');
  console.log('');
  console.log('Database ready!');
  process.exit(0);
}

init().catch(err => {
  console.error('ERROR:', err.message);
  console.error('Full error:', err);
  process.exit(1);
});