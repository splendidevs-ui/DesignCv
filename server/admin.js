/* =====================================================================
   Le compte d'administration.

   Il n'existe pas d'écran pour se nommer administrateur : le rôle
   s'attribue au démarrage, depuis l'environnement. Un compte dédié est
   créé au premier lancement, et ADMIN_EMAILS permet d'élever des comptes
   existants sans toucher au code ni à la base à la main.
   ===================================================================== */

import { db, now } from './db.js';
import { hashPassword } from './auth.js';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@designcv.local').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@DesignCV2026';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administration DESIGN CV';

const promote = (email) =>
  db.prepare("UPDATE users SET role = 'admin' WHERE email = ? AND role <> 'admin'").run(email).changes;

/**
 * Garantit qu'un administrateur existe. Renvoie de quoi l'annoncer au
 * démarrage — le mot de passe n'est affiché qu'à la création du compte,
 * jamais aux lancements suivants.
 */
export function ensureAdmin() {
  const extra = String(process.env.ADMIN_EMAILS || '')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

  let promoted = 0;
  for (const email of extra) promoted += promote(email);

  const existing = db.prepare('SELECT id, role FROM users WHERE email = ?').get(ADMIN_EMAIL);

  if (existing) {
    // Le mot de passe d'un compte déjà là n'est jamais réécrit : un
    // redémarrage ne doit pas rendre à l'ancien mot de passe sa validité.
    promoted += promote(ADMIN_EMAIL);
    return { email: ADMIN_EMAIL, created: false, promoted };
  }

  db.prepare(`
    INSERT INTO users (email, full_name, password_hash, role, created_at)
    VALUES (?, ?, ?, 'admin', ?)
  `).run(ADMIN_EMAIL, ADMIN_NAME, hashPassword(ADMIN_PASSWORD), now());

  return { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, created: true, promoted };
}
