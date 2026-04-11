import { getDb } from '../_db.js';
import { requireAuth } from '../_auth.js';

async function handler(req, res) {
  const sql = getDb();

  if (req.method === 'GET') {
    const { status, company, nationality, road_test, page = 1, limit = 200 } = req.query;
    let conditions = ['is_deleted = FALSE'];
    let params = [];
    let i = 1;

    if (status)      { conditions.push(`LOWER(status) = LOWER($${i++})`); params.push(status); }
    if (company)     { conditions.push(`LOWER(company) = LOWER($${i++})`); params.push(company); }
    if (nationality) { conditions.push(`nationality = $${i++}`); params.push(nationality); }
    if (road_test)   { conditions.push(`LOWER(road_test_result) = LOWER($${i++})`); params.push(road_test); }

    const where = conditions.join(' AND ');
    const offset = (parseInt(page)-1)*parseInt(limit);

    const countRes = await sql.query(`SELECT COUNT(*) FROM recruitment WHERE ${where}`, params);
    const total = parseInt(countRes.rows[0].count);
    const dataRes = await sql.query(
      `SELECT * FROM recruitment WHERE ${where} ORDER BY id DESC LIMIT $${i} OFFSET $${i+1}`,
      [...params, parseInt(limit), offset]
    );

    return res.json({ data: dataRes.rows, total });
  }

  res.status(405).end();
}

export default requireAuth(handler);