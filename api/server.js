import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { parse } from 'csv-parse/sync';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET;

function parseDate(s) {
  if (!s || !s.trim()) return null;
  const mo = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
  const p = s.trim().split('-');
  if (p.length === 3) {
    let d = parseInt(p[0]), m = mo[p[1]?.toLowerCase()], y = parseInt(p[2]);
    if (!isNaN(d) && m !== undefined && !isNaN(y)) {
      if (y < 100) y += y > 30 ? 1900 : 2000;
      return new Date(y, m, d).toISOString().split('T')[0];
    }
  }
  const t = Date.parse(s);
  return isNaN(t) ? null : new Date(t).toISOString().split('T')[0];
}

function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(h.slice(7), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'Administrator') return res.status(403).json({ error: 'Admin only' });
  next();
}

// AUTH
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const rows = await sql`SELECT * FROM users WHERE username = ${username} LIMIT 1`;
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// USERS
app.get('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const rows = await sql`SELECT id, username, email, role, created_at FROM users ORDER BY id`;
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !password || password.length < 6) return res.status(400).json({ error: 'Invalid input' });
    const hash = await bcrypt.hash(password, 10);
    const rows = await sql`INSERT INTO users (username, email, password_hash, role) VALUES (${username}, ${email||null}, ${hash}, ${role||'Viewer'}) RETURNING id, username, email, role`;
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.message.includes('unique')) return res.status(400).json({ error: 'Username already exists' });
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', auth, adminOnly, async (req, res) => {
  try {
    await sql`DELETE FROM users WHERE id = ${req.params.id} AND username != 'admin'`;
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DRIVERS
app.get('/api/drivers', auth, async (req, res) => {
  try {
    const { status, depot, nationality, contractor, search, page = 1, limit = 100 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const lim = parseInt(limit);
    let rows, countRow;

    if (search) {
      const q = '%' + search.toLowerCase() + '%';
      countRow = await sql`SELECT COUNT(*)::int as c FROM drivers WHERE is_deleted=FALSE AND (LOWER(full_name) LIKE ${q} OR rta_id LIKE ${q})`;
      rows     = await sql`SELECT * FROM drivers WHERE is_deleted=FALSE AND (LOWER(full_name) LIKE ${q} OR rta_id LIKE ${q}) ORDER BY id DESC LIMIT ${lim} OFFSET ${offset}`;
    } else if (status && depot) {
      countRow = await sql`SELECT COUNT(*)::int as c FROM drivers WHERE is_deleted=FALSE AND real_time_status=${status} AND depot=${depot}`;
      rows     = await sql`SELECT * FROM drivers WHERE is_deleted=FALSE AND real_time_status=${status} AND depot=${depot} ORDER BY id DESC LIMIT ${lim} OFFSET ${offset}`;
    } else if (status && nationality) {
      countRow = await sql`SELECT COUNT(*)::int as c FROM drivers WHERE is_deleted=FALSE AND real_time_status=${status} AND nationality=${nationality}`;
      rows     = await sql`SELECT * FROM drivers WHERE is_deleted=FALSE AND real_time_status=${status} AND nationality=${nationality} ORDER BY id DESC LIMIT ${lim} OFFSET ${offset}`;
    } else if (status && contractor) {
      countRow = await sql`SELECT COUNT(*)::int as c FROM drivers WHERE is_deleted=FALSE AND real_time_status=${status} AND contractor=${contractor}`;
      rows     = await sql`SELECT * FROM drivers WHERE is_deleted=FALSE AND real_time_status=${status} AND contractor=${contractor} ORDER BY id DESC LIMIT ${lim} OFFSET ${offset}`;
    } else if (status) {
      countRow = await sql`SELECT COUNT(*)::int as c FROM drivers WHERE is_deleted=FALSE AND real_time_status=${status}`;
      rows     = await sql`SELECT * FROM drivers WHERE is_deleted=FALSE AND real_time_status=${status} ORDER BY id DESC LIMIT ${lim} OFFSET ${offset}`;
    } else if (depot) {
      countRow = await sql`SELECT COUNT(*)::int as c FROM drivers WHERE is_deleted=FALSE AND depot=${depot}`;
      rows     = await sql`SELECT * FROM drivers WHERE is_deleted=FALSE AND depot=${depot} ORDER BY id DESC LIMIT ${lim} OFFSET ${offset}`;
    } else if (nationality) {
      countRow = await sql`SELECT COUNT(*)::int as c FROM drivers WHERE is_deleted=FALSE AND nationality=${nationality}`;
      rows     = await sql`SELECT * FROM drivers WHERE is_deleted=FALSE AND nationality=${nationality} ORDER BY id DESC LIMIT ${lim} OFFSET ${offset}`;
    } else if (contractor) {
      countRow = await sql`SELECT COUNT(*)::int as c FROM drivers WHERE is_deleted=FALSE AND contractor=${contractor}`;
      rows     = await sql`SELECT * FROM drivers WHERE is_deleted=FALSE AND contractor=${contractor} ORDER BY id DESC LIMIT ${lim} OFFSET ${offset}`;
    } else {
      countRow = await sql`SELECT COUNT(*)::int as c FROM drivers WHERE is_deleted=FALSE`;
      rows     = await sql`SELECT * FROM drivers WHERE is_deleted=FALSE ORDER BY id DESC LIMIT ${lim} OFFSET ${offset}`;
    }

    res.json({ data: rows, total: countRow[0]?.c || 0, page: parseInt(page), limit: lim });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/api/drivers/:id', auth, async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM drivers WHERE id=${req.params.id} AND is_deleted=FALSE`;
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/drivers', auth, adminOnly, async (req, res) => {
  try {
    const d = req.body;
    const rows = await sql`INSERT INTO drivers (rta_id,full_name,depot,nationality,contractor,real_time_status,license_number,license_expired,passport_number,passport_expired,visa_expired,medical_expired,date_of_hire,date_of_birth,id_card_status,license_class,contact) VALUES (${d.rta_id||null},${d.full_name||null},${d.depot||null},${d.nationality||null},${d.contractor||null},${d.real_time_status||'Active'},${d.license_number||null},${d.license_expired||null},${d.passport_number||null},${d.passport_expired||null},${d.visa_expired||null},${d.medical_expired||null},${d.date_of_hire||null},${d.date_of_birth||null},${d.id_card_status||null},${d.license_class||null},${d.contact||null}) RETURNING *`;
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/drivers/:id', auth, adminOnly, async (req, res) => {
  try {
    const d = req.body;
    const rows = await sql`UPDATE drivers SET full_name=COALESCE(${d.full_name||null},full_name),depot=COALESCE(${d.depot||null},depot),nationality=COALESCE(${d.nationality||null},nationality),contractor=COALESCE(${d.contractor||null},contractor),real_time_status=COALESCE(${d.real_time_status||null},real_time_status),id_card_status=COALESCE(${d.id_card_status||null},id_card_status),reason_for_leaving=COALESCE(${d.reason_for_leaving||null},reason_for_leaving),date_of_resignation=COALESCE(${d.date_of_resignation||null},date_of_resignation),updated_at=NOW() WHERE id=${req.params.id} AND is_deleted=FALSE RETURNING *`;
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/drivers/:id', auth, adminOnly, async (req, res) => {
  try {
    await sql`UPDATE drivers SET is_deleted=TRUE,updated_at=NOW() WHERE id=${req.params.id}`;
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// RECRUITMENT
app.get('/api/recruitment', auth, async (req, res) => {
  try {
    const { status, company, road_test, page = 1, limit = 100 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const lim = parseInt(limit);
    let rows, countRow;

    if (status) {
      countRow = await sql`SELECT COUNT(*)::int as c FROM recruitment WHERE is_deleted=FALSE AND LOWER(status)=LOWER(${status})`;
      rows     = await sql`SELECT * FROM recruitment WHERE is_deleted=FALSE AND LOWER(status)=LOWER(${status}) ORDER BY id DESC LIMIT ${lim} OFFSET ${offset}`;
    } else if (company) {
      countRow = await sql`SELECT COUNT(*)::int as c FROM recruitment WHERE is_deleted=FALSE AND LOWER(company)=LOWER(${company})`;
      rows     = await sql`SELECT * FROM recruitment WHERE is_deleted=FALSE AND LOWER(company)=LOWER(${company}) ORDER BY id DESC LIMIT ${lim} OFFSET ${offset}`;
    } else if (road_test) {
      countRow = await sql`SELECT COUNT(*)::int as c FROM recruitment WHERE is_deleted=FALSE AND LOWER(road_test_result)=LOWER(${road_test})`;
      rows     = await sql`SELECT * FROM recruitment WHERE is_deleted=FALSE AND LOWER(road_test_result)=LOWER(${road_test}) ORDER BY id DESC LIMIT ${lim} OFFSET ${offset}`;
    } else {
      countRow = await sql`SELECT COUNT(*)::int as c FROM recruitment WHERE is_deleted=FALSE`;
      rows     = await sql`SELECT * FROM recruitment WHERE is_deleted=FALSE ORDER BY id DESC LIMIT ${lim} OFFSET ${offset}`;
    }

    res.json({ data: rows, total: countRow[0]?.c || 0, page: parseInt(page) });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ANALYTICS
app.get('/api/analytics', auth, async (req, res) => {
  try {
    const s1 = await sql`SELECT real_time_status as label, COUNT(*)::int as count FROM drivers WHERE is_deleted=FALSE GROUP BY real_time_status`;
    const s2 = await sql`SELECT depot as label, COUNT(*)::int as count FROM drivers WHERE is_deleted=FALSE AND depot IS NOT NULL GROUP BY depot ORDER BY count DESC`;
    const s3 = await sql`SELECT nationality as label, COUNT(*)::int as count FROM drivers WHERE is_deleted=FALSE AND nationality IS NOT NULL GROUP BY nationality ORDER BY count DESC LIMIT 10`;
    const s4 = await sql`SELECT contractor as label, COUNT(*)::int as count FROM drivers WHERE is_deleted=FALSE AND contractor IS NOT NULL GROUP BY contractor ORDER BY count DESC`;
    const s5 = await sql`SELECT id_card_status as label, COUNT(*)::int as count FROM drivers WHERE is_deleted=FALSE AND id_card_status IS NOT NULL GROUP BY id_card_status`;
    const s6 = await sql`SELECT EXTRACT(YEAR FROM date_of_hire)::int as year, COUNT(*)::int as count FROM drivers WHERE is_deleted=FALSE AND date_of_hire IS NOT NULL GROUP BY year ORDER BY year`;
    const s7 = await sql`SELECT
      (SELECT COUNT(*)::int FROM drivers WHERE is_deleted=FALSE AND license_expired < NOW()) AS lic_expired,
      (SELECT COUNT(*)::int FROM drivers WHERE is_deleted=FALSE AND license_expired BETWEEN NOW() AND NOW()+INTERVAL'30 days') AS lic_30,
      (SELECT COUNT(*)::int FROM drivers WHERE is_deleted=FALSE AND license_expired BETWEEN NOW()+INTERVAL'30 days' AND NOW()+INTERVAL'90 days') AS lic_90,
      (SELECT COUNT(*)::int FROM drivers WHERE is_deleted=FALSE AND license_expired > NOW()+INTERVAL'90 days') AS lic_valid,
      (SELECT COUNT(*)::int FROM drivers WHERE is_deleted=FALSE AND passport_expired < NOW()) AS pass_expired,
      (SELECT COUNT(*)::int FROM drivers WHERE is_deleted=FALSE AND passport_expired BETWEEN NOW() AND NOW()+INTERVAL'30 days') AS pass_30,
      (SELECT COUNT(*)::int FROM drivers WHERE is_deleted=FALSE AND passport_expired > NOW()+INTERVAL'30 days') AS pass_valid,
      (SELECT COUNT(*)::int FROM drivers WHERE is_deleted=FALSE AND visa_expired < NOW()) AS visa_expired,
      (SELECT COUNT(*)::int FROM drivers WHERE is_deleted=FALSE AND visa_expired BETWEEN NOW() AND NOW()+INTERVAL'30 days') AS visa_30,
      (SELECT COUNT(*)::int FROM drivers WHERE is_deleted=FALSE AND visa_expired > NOW()+INTERVAL'30 days') AS visa_valid,
      (SELECT COUNT(*)::int FROM drivers WHERE is_deleted=FALSE AND medical_expired < NOW()) AS med_expired,
      (SELECT COUNT(*)::int FROM drivers WHERE is_deleted=FALSE AND medical_expired BETWEEN NOW() AND NOW()+INTERVAL'30 days') AS med_30,
      (SELECT COUNT(*)::int FROM drivers WHERE is_deleted=FALSE AND medical_expired > NOW()+INTERVAL'30 days') AS med_valid,
      (SELECT COUNT(*)::int FROM drivers WHERE is_deleted=FALSE) AS total`;
    const s8 = await sql`SELECT COALESCE(status,'Unknown') as label, COUNT(*)::int as count FROM recruitment WHERE is_deleted=FALSE GROUP BY status ORDER BY count DESC`;
    const s9 = await sql`SELECT COALESCE(company,'Unknown') as label, COUNT(*)::int as count FROM recruitment WHERE is_deleted=FALSE GROUP BY company ORDER BY count DESC LIMIT 8`;
    const s10 = await sql`SELECT LOWER(COALESCE(road_test_result,'unknown')) as label, COUNT(*)::int as count FROM recruitment WHERE is_deleted=FALSE AND road_test_result IS NOT NULL GROUP BY LOWER(COALESCE(road_test_result,'unknown'))`;

    const toObj = arr => Object.fromEntries(arr.map(r => [r.label, r.count]));
    res.json({
      drivers: {
        status: toObj(s1), depot: toObj(s2), nationality: toObj(s3),
        contractor: toObj(s4), idCard: toObj(s5),
        hireByYear: Object.fromEntries(s6.map(r => [r.year, r.count])),
        total: s1.reduce((a,r) => a+r.count, 0)
      },
      documents: s7[0],
      recruitment: {
        status: toObj(s8), company: toObj(s9), roadTest: toObj(s10),
        total: s8.reduce((a,r) => a+r.count, 0)
      }
    });
  } catch (err) { console.error('Analytics error:', err.message); res.status(500).json({ error: err.message }); }
});

// CSV UPLOAD
app.post('/api/upload/csv', auth, adminOnly, async (req, res) => {
  try {
    const { type, csvData } = req.body;
    if (!csvData) return res.status(400).json({ error: 'No CSV data' });
    const records = parse(csvData, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true });
    if (!records.length) return res.status(400).json({ error: 'CSV is empty' });
    let inserted = 0, skipped = 0;

    if (type === 'payroll') {
      const BATCH = 200;
      const validRows = [];
      for (const r of records) {
        const rtaId = (r['RTA ID'] || '').trim();
        if (!rtaId) { skipped++; continue; }
        validRows.push([
          rtaId,
          r['Full Name']||null,
          r['Depot']||null,
          r['Nationality']||null,
          r['License Number']||null,
          parseDate(r['Date of issued']),
          parseDate(r['Date of  Expired'])||parseDate(r['Date of Expired'])||null,
          r['Place of issue']||null,
          r['Traffic File']||null,
          r['class of license']||null,
          r['Contractor']||null,
          parseDate(r['Date Of Birth']),
          parseDate(r['Date of Hire']),
          (r['Contact ']||r['Contact']||'').trim()||null,
          r['Passport #']||null,
          parseDate(r['Passport Expired']),
          (r['Emirates ID ']||r['Emirates ID']||'').trim()||null,
          r['visa #']||null,
          parseDate(r['Issue Date']),
          parseDate(r['Visa Expired']),
          parseDate(r['RTA ID Card Expired']),
          r['ID Card Status']||null,
          r['Assignment Status']||null,
          (r['Real time Status']||'Active').trim(),
          parseDate(r['Date of Resignation']),
          r['Reason for Leaving']||null,
          parseDate(r['Occupational Medical Expired']),
          r['Accomodation']||null,
          r['Vendor Number']||null
        ]);
      }
      const batches = []
      for (let i = 0; i < validRows.length; i += BATCH) batches.push(validRows.slice(i, i + BATCH))
      const CONCURRENCY = 3
      for (let i = 0; i < batches.length; i += CONCURRENCY) {
        const chunk = batches.slice(i, i + CONCURRENCY)
        await Promise.all(chunk.map(async batch => {
        try {
          const placeholders = batch.map((_, bi) => {
            const b = bi * 29;
            return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8},$${b+9},$${b+10},$${b+11},$${b+12},$${b+13},$${b+14},$${b+15},$${b+16},$${b+17},$${b+18},$${b+19},$${b+20},$${b+21},$${b+22},$${b+23},$${b+24},$${b+25},$${b+26},$${b+27},$${b+28},$${b+29})`;
          }).join(',');
          const values = batch.flat();
          await sql(
            `INSERT INTO drivers (rta_id,full_name,depot,nationality,license_number,license_issued,license_expired,place_of_issue,traffic_file,license_class,contractor,date_of_birth,date_of_hire,contact,passport_number,passport_expired,emirates_id,visa_number,visa_issued,visa_expired,id_card_expired,id_card_status,assignment_status,real_time_status,date_of_resignation,reason_for_leaving,medical_expired,accommodation,vendor_number) VALUES ${placeholders}
            ON CONFLICT (rta_id) DO UPDATE SET
              full_name=EXCLUDED.full_name,depot=EXCLUDED.depot,nationality=EXCLUDED.nationality,
              real_time_status=EXCLUDED.real_time_status,license_expired=EXCLUDED.license_expired,
              passport_expired=EXCLUDED.passport_expired,visa_expired=EXCLUDED.visa_expired,
              medical_expired=EXCLUDED.medical_expired,id_card_status=EXCLUDED.id_card_status,
              contractor=EXCLUDED.contractor,updated_at=NOW()`,
            values
          );
          inserted += batch.length;
        } catch(e) { console.error('batch error:', e.message); skipped += batch.length; }
        }))
      }
      return res.json({ ok: true, inserted, skipped, total: records.length });
    }

    if (type === 'recruitment') {
      await sql`DELETE FROM recruitment WHERE is_deleted=FALSE`;
      const BATCH = 200;
      const validRows = [];
      for (const r of records) {
        const name = (r['Name as per Driving License'] || '').trim();
        if (!name) { skipped++; continue; }
        validRows.push([
          r['RTA ID']||null,
          r['License No.']||null,
          name,
          r['Nationality']||null,
          parseDate(r['DOB']),
          parseDate(r['Date of issued']),
          parseDate(r['Date of expired']),
          r['Place of issue']||null,
          r['Class of License']||null,
          r['Traffic file no']||null,
          r['Contact']||null,
          isNaN(parseFloat(r['Age']))?null:parseFloat(r['Age']),
          r['Company']||null,
          parseDate(r['Date of Road test']),
          (r['Road test result ']||r['Road test result']||'').trim()||null,
          parseDate(r['Date of Interview']),
          (r['Interview Result']||'').trim()||null,
          (r['Remarks ']||r['Remarks']||'').trim()||null,
          (r['Status 1']||'').trim()||null,
          r['Training Batch #']||null,
          parseDate(r['Date of join Training']),
          parseDate(r['Date of Graduation']),
          parseDate(r['Date of Transfer operation'])
        ]);
      }
      const batches = []
      for (let i = 0; i < validRows.length; i += BATCH) batches.push(validRows.slice(i, i + BATCH))
      const CONCURRENCY = 3
      for (let i = 0; i < batches.length; i += CONCURRENCY) {
        const chunk = batches.slice(i, i + CONCURRENCY)
        await Promise.all(chunk.map(async batch => {
        try {
          const placeholders = batch.map((_, bi) => {
            const base = bi * 23;
            return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10},$${base+11},$${base+12},$${base+13},$${base+14},$${base+15},$${base+16},$${base+17},$${base+18},$${base+19},$${base+20},$${base+21},$${base+22},$${base+23})`;
          }).join(',');
          const values = batch.flat();
          await sql(`INSERT INTO recruitment (rta_id,license_number,full_name,nationality,dob,license_issued,license_expired,place_of_issue,license_class,traffic_file,contact,age,company,road_test_date,road_test_result,interview_date,interview_result,remarks,status,training_batch,training_start,training_end,transfer_date) VALUES ${placeholders}`, values);
          inserted += batch.length;
        } catch(e) { console.error('batch error:', e.message); skipped += batch.length; }
        }))
      }
      return res.json({ ok: true, inserted, skipped, total: records.length });
    }

    res.status(400).json({ error: 'type must be payroll or recruitment' });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));