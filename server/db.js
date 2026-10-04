import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'data');

mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(join(DATA_DIR, 'cv.sqlite'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    full_name     TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user',
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cvs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    template   TEXT NOT NULL,
    theme      TEXT NOT NULL,
    data       TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  /* Une commande = le droit de télécharger un CV en PDF.
     Aucune donnée de carte n'est stockée : seuls la marque et les quatre
     derniers chiffres, qui suffisent à identifier le moyen de paiement sur
     un reçu et ne permettent pas de rejouer une transaction. */
  CREATE TABLE IF NOT EXISTS orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    reference   TEXT NOT NULL UNIQUE,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cv_id       INTEGER NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    method      TEXT NOT NULL,
    detail      TEXT NOT NULL,
    amount      INTEGER NOT NULL,
    currency    TEXT NOT NULL,
    status      TEXT NOT NULL,
    otp         TEXT,
    attempts    INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL,
    expires_at  TEXT NOT NULL,
    paid_at     TEXT
  );

  /* Le catalogue des modèles proposés dans la galerie.
     Une ligne ne porte que des métadonnées : sa colonne « base » désigne
     la mise en page (le code, dans public/js/cv/templates.js) qu'elle habille.
     L'administrateur compose ainsi de nouveaux modèles sans écrire une
     ligne de code, et masquer une ligne n'efface jamais la mise en page :
     les CV déjà créés continuent de s'afficher. */
  CREATE TABLE IF NOT EXISTS templates (
    id         TEXT PRIMARY KEY,
    base       TEXT NOT NULL,
    name       TEXT NOT NULL,
    descr      TEXT NOT NULL DEFAULT '',
    tags       TEXT NOT NULL DEFAULT '[]',
    accent     TEXT,
    font       TEXT,
    position   INTEGER NOT NULL,
    visible    INTEGER NOT NULL DEFAULT 1,
    builtin    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_cvs_user ON cvs(user_id);
  CREATE INDEX IF NOT EXISTS idx_orders_cv ON orders(cv_id, status);
  CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
`);

/* ------------------------------------------------------------- migrations */

/* Les bases créées avant l'arrivée du rôle administrateur n'ont pas la
   colonne : on l'ajoute au démarrage plutôt que d'exiger une remise à zéro. */
const columnsOf = (table) => db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);

if (!columnsOf('users').includes('role')) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
}

export const now = () => new Date().toISOString();

/** Purge les sessions expirées (appelé au démarrage et à chaque connexion). */
export function purgeSessions() {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now());
}

/** Abandonne les commandes restées en attente au-delà de leur délai. */
export function expireOrders() {
  db.prepare(
    "UPDATE orders SET status = 'expired', otp = NULL WHERE status = 'pending' AND expires_at < ?",
  ).run(now());
}

purgeSessions();
expireOrders();
