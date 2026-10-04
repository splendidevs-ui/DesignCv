import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db, now, purgeSessions } from './db.js';

const SESSION_DAYS = 30;
export const COOKIE_NAME = 'cv_session';

/* ---------------------------------------------------------------- mots de passe */

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  const [scheme, salt, hash] = String(stored).split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(expected, actual);
}

/* -------------------------------------------------------------------- sessions */

export function createSession(userId) {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(token, userId, now(), expires);
  purgeSessions();
  return { token, expires };
}

export function destroySession(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

/** Renvoie l'utilisateur lié au cookie de session, ou null. */
export function userFromRequest(req) {
  const token = parseCookies(req.headers.cookie).get(COOKIE_NAME);
  if (!token) return null;

  const row = db.prepare(`
    SELECT u.id, u.email, u.full_name, u.role, u.created_at, s.expires_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ?
  `).get(token);

  if (!row) return null;
  if (row.expires_at < now()) {
    destroySession(token);
    return null;
  }
  return {
    id: row.id, email: row.email, fullName: row.full_name,
    role: row.role || 'user', createdAt: row.created_at, token,
  };
}

export function sessionCookie(token, expires) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(expires).toUTCString()}`;
}

export function clearCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function parseCookies(header = '') {
  const map = new Map();
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) map.set(part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim()));
  }
  return map;
}
