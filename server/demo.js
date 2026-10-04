/* =====================================================================
   Banc d'essai — TEMPORAIRE.

   Des comptes connus, et une route qui les décrit, pour que la page de
   connexion puisse proposer un remplissage en un clic pendant les tests.

   Ces identifiants sont volontairement publics : ce sont des comptes de
   démonstration, sans valeur. Aucun compte réel ne passe par ici — la
   liste est écrite ci-dessous, jamais lue depuis la table des
   utilisateurs.

   Pour éteindre le banc d'essai : DEMO_LOGINS=0 npm start.
   Pour le retirer définitivement, voir le README, section « Banc d'essai ».
   ===================================================================== */

import { db, now } from './db.js';
import { hashPassword } from './auth.js';

export const DEMO_ENABLED = process.env.DEMO_LOGINS !== '0';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@designcv.local').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@DesignCV2026';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@DesignCV2026';

/* Deux utilisateurs plutôt qu'un : de quoi vérifier qu'un compte ne voit
   jamais les CV de l'autre. */
const USERS = [
  { email: 'demo@designcv.local', fullName: 'Aminata Traoré', label: 'Utilisatrice' },
  { email: 'demo2@designcv.local', fullName: 'Koffi Mensah', label: 'Utilisateur' },
];

/** Crée les comptes de démonstration manquants. Ne réécrit jamais un mot de passe. */
export function seedDemoUsers() {
  if (!DEMO_ENABLED) return 0;

  const insert = db.prepare(`
    INSERT INTO users (email, full_name, password_hash, role, created_at)
    VALUES (?, ?, ?, 'user', ?)
  `);

  let created = 0;
  for (const u of USERS) {
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(u.email)) continue;
    insert.run(u.email, u.fullName, hashPassword(DEMO_PASSWORD), now());
    created++;
  }
  return created;
}

/**
 * Ce que la page de connexion affiche. Le mot de passe de l'administrateur
 * est celui de la configuration : si le compte a été créé avec un autre
 * puis changé à la main, le bouton remplira une valeur périmée.
 */
export function demoAccounts() {
  if (!DEMO_ENABLED) return [];
  return [
    { label: 'Administrateur', name: 'Administration DESIGN CV', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' },
    ...USERS.map((u) => ({
      label: u.label, name: u.fullName, email: u.email, password: DEMO_PASSWORD, role: 'user',
    })),
  ];
}
