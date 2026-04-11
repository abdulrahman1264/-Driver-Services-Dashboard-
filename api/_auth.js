import jwt from 'jsonwebtoken';

export function requireAuth(handler) {
  return async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    try {
      req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
      return handler(req, res);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

export function requireAdmin(handler) {
  return requireAuth(async (req, res) => {
    if (req.user.role !== 'Administrator') return res.status(403).json({ error: 'Admin only' });
    return handler(req, res);
  });
}