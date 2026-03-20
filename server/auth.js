/**
 * Auth: AUTH_PASSWORD (legacy) or user-based (email/password).
 * User auth returns JWT with userId, role.
 */
import crypto from 'crypto';
import { findByEmail, findById, verifyPassword as verifyUserPassword, touchLastActive } from './users.js';

const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
const AUTH_SECRET = process.env.AUTH_SECRET || AUTH_PASSWORD || 'deal-engine-default';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export const authRequired = () => !!AUTH_PASSWORD;

export const verifyPassword = (password) => AUTH_PASSWORD && password === AUTH_PASSWORD;

export const createToken = () => {
  const payload = JSON.stringify({ t: Date.now() });
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ p: payload, s: sig })).toString('base64url');
};

export const createUserToken = (userId, role) => {
  const payload = JSON.stringify({ userId, role, t: Date.now() });
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ p: payload, s: sig })).toString('base64url');
};

function verifyTokenPayload(token) {
  if (!token) return null;
  try {
    const raw = JSON.parse(Buffer.from(token, 'base64url').toString());
    const sig = crypto.createHmac('sha256', AUTH_SECRET).update(raw.p).digest('hex');
    if (sig !== raw.s) return null;
    const parsed = JSON.parse(raw.p);
    if (Date.now() - parsed.t > TOKEN_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const verifyToken = (token) => {
  const p = verifyTokenPayload(token);
  if (p?.userId) return { userId: p.userId, role: p.role };
  if (p) return { legacy: true };
  return null;
};

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.query?.token;
  const auth = verifyToken(token);
  if (auth) {
    req.auth = auth;
    if (auth.userId) touchLastActive(auth.userId);
    return next();
  }
  if (authRequired()) return res.status(401).json({ error: 'Authentication required' });
  next();
};

export const requireAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.query?.token;
  const auth = verifyToken(token);
  if (!auth) return res.status(401).json({ error: 'Authentication required' });
  req.auth = auth;
  if (auth.userId) touchLastActive(auth.userId);
  next();
};

export const adminMiddleware = (req, res, next) => {
  if (req.auth?.role === 'admin') return next();
  if (req.auth?.legacy && AUTH_PASSWORD) return next();
  res.status(403).json({ error: 'Admin required' });
};

export async function loginUser(email, password) {
  const user = findByEmail(email);
  if (!user || !verifyUserPassword(user.passwordHash, password)) return { error: 'Invalid email or password' };
  if (user.status !== 'active' && user.role !== 'admin') return { error: 'Account pending approval' };
  touchLastActive(user.id);
  return { token: createUserToken(user.id, user.role), user: { id: user.id, email: user.email, role: user.role } };
}
