import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

/**
 * Sign a JWT token for a user
 * @param {object} user - User object with id, email, role
 * @returns {string} JWT token
 */
export function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {object|null} Decoded payload or null
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Verify authentication from request headers
 * Returns the decoded user or sends 401 and returns null
 * @param {object} req - Next.js request
 * @param {object} res - Next.js response
 * @returns {object|null} Decoded token payload or null
 */
export function verifyAuth(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token manquant' });
    return null;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Token invalide ou expiré' });
    return null;
  }

  return decoded;
}

/**
 * Require specific role(s) for an API route
 * Returns the decoded user or sends 401/403 and returns null
 * @param {object} req
 * @param {object} res
 * @param  {...string} roles - Allowed roles
 * @returns {object|null}
 */
export function requireRole(req, res, ...roles) {
  const auth = verifyAuth(req, res);
  if (!auth) return null;

  if (!roles.includes(auth.role)) {
    res.status(403).json({ error: 'Accès interdit' });
    return null;
  }

  return auth;
}
