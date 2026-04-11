import { getDb } from '../_db.js';
import { requireAuth } from '../_auth.js';

async function handler(req, res) {
  const sql = getDb();
  const { id } = req.query;

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM drivers WHERE id = ${id} AND is_deleted = FALSE`;
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    return res.json(rows[0]);
  }

  if (req.method === 'PUT') {
    if (req.user.role !== 'Administrator') return res.status(403).json({ error: 'Admin only' });
    const d = req.body;
    const rows = await sql`
      UPDATE drivers SET
        full_name = COALESCE(${d.full_name||null}, full_name),
        depot = COALESCE(${d.depot||null}, depot),
        nationality = COALESCE(${d.nationality||null}, nationality),
        contractor = COALESCE(${d.contractor||null}, contractor),
        real_time_status = COALESCE(${d.real_time_status||null}, real_time_status),
        id_card_status = COALESCE(${d.id_card_status||null}, id_card_status),
        reason_for_leaving = COALESCE(${d.reason_for_leaving||null}, reason_for_leaving),
        date_of_resignation = COALESCE(${d.date_of_resignation||null}, date_of_resignation),
        updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `;
    return res.json(rows[0]);
  }

  if (req.method === 'DELETE') {
    if (req.user.role !== 'Administrator') return res.status(403).json({ error: 'Admin only' });
    // Soft delete only — never hard delete
    await sql`UPDATE drivers SET is_deleted = TRUE, updated_at = NOW() WHERE id = ${id}`;
    return res.json({ ok: true });
  }

  res.status(405).end();
}

export default requireAuth(handler);