import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function init() {
  console.log('Creating tables...');

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100),
      password_hash VARCHAR(100) NOT NULL,
      role VARCHAR(20) DEFAULT 'Viewer',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('✓ users table');

  await sql`
    CREATE TABLE IF NOT EXISTS drivers (
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
    )
  `;
  console.log('✓ drivers table');

  await sql`
    CREATE TABLE IF NOT EXISTS recruitment (
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
    )
  `;
  console.log('✓ recruitment table');

  // Seed admin user (password: admin123)
  const hash = await bcrypt.hash('admin123', 10);
  await sql`
    INSERT INTO users (username, email, password_hash, role)
    VALUES ('admin', 'admin@ds.ae', ${hash}, 'Administrator')
    ON CONFLICT (username) DO NOTHING
  `;
  const hash2 = await bcrypt.hash('view2025', 10);
  await sql`
    INSERT INTO users (username, email, password_hash, role)
    VALUES ('viewer', 'viewer@ds.ae', ${hash2}, 'Viewer')
    ON CONFLICT (username) DO NOTHING
  `;
  console.log('✓ default users seeded (admin/admin123, viewer/view2025)');

  console.log('\n✅ Database ready!');
  process.exit(0);
}

init().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });