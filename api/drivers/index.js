import { getDb } from '../_db.js';
import { requireAuth, requireAdmin } from '../_auth.js';

async function handler(req, res) {
  const sql = getDb();

  if (req.method === 'GET') {
    const { status, depot, nationality, contractor, page = 1, limit = 200, search } = req.query;
    let conditions = ['is_deleted = FALSE'];
    let params = [];
    let i = 1;

    if (status)      { conditions.push(`real_time_status = $${i++}`); params.push(status); }
    if (depot)       { conditions.push(`depot = $${i++}`); params.push(depot); }
    if (nationality) { conditions.push(`nationality = $${i++}`); params.push(nationality); }
    if (contractor)  { conditions.push(`contractor = $${i++}`); params.push(contractor); }
    if (search)      { conditions.push(`(LOWER(full_name) LIKE $${i} OR rta_id LIKE $${i})`); params.push('%'+search.toLowerCase()+'%'); i++; }

    const where = conditions.join(' AND ');
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Neon tagged template literal doesn't support dynamic params like this
    // Use raw query via sql.query for complex filters
    const countRes = await sql.query(`SELECT COUNT(*) FROM drivers WHERE ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const dataRes = await sql.query(
      `SELECT * FROM drivers WHERE ${where} ORDER BY id DESC LIMIT $${i} OFFSET $${i+1}`,
      [...params, parseInt(limit), offset]
    );

    return res.json({ data: dataRes.rows, total, page: parseInt(page), limit: parseInt(limit) });
  }

  if (req.method === 'POST') {
    if (req.user.role !== 'Administrator') return res.status(403).json({ error: 'Admin only' });
    const d = req.body;
    const result = await sql`
      INSERT INTO drivers (
        rta_id, full_name, depot, nationality, contractor, real_time_status,
        license_number, license_expired, passport_number, passport_expired,
        visa_expired, medical_expired, date_of_hire, date_of_birth, id_card_status
      ) VALUES (
        ${d.rta_id||null}, ${d.full_name||null}, ${d.depot||null}, ${d.nationality||null},
        ${d.contractor||null}, ${d.real_time_status||'Active'},
        ${d.license_number||null}, ${d.license_expired||null},
        ${d.passport_number||null}, ${d.passport_expired||null},
        ${d.visa_expired||null}, ${d.medical_expired||null},
        ${d.date_of_hire||null}, ${d.date_of_birth||null}, ${d.id_card_status||null}
      ) RETURNING *
    `;
    return res.status(201).json(result[0]);
  }

  res.status(405).end();
}

export default requireAuth(handler);