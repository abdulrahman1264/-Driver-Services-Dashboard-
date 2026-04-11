import { initDb } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  // Simple secret check so random people can't call this
  if (req.headers['x-init-secret'] !== process.env.JWT_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const result = await initDb();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}