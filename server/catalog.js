/* =====================================================================
   Catalogue des modèles — la partie administrable des designs.

   Une *mise en page* est du code : elle vit dans public/js/cv/templates.js
   et fournit une feuille de style et une fonction d'assemblage. Un
   *modèle* du catalogue n'est qu'une ligne de base de données qui désigne
   une mise en page et l'habille : un nom, une description, des étiquettes,
   une couleur, une police, un rang dans la galerie.

   D'où deux propriétés utiles : l'administrateur crée des modèles sans
   écrire de code, et retirer un modèle du catalogue n'efface aucune mise
   en page — les CV déjà créés continuent de s'afficher exactement pareil.
   ===================================================================== */

import { db, now } from './db.js';
import { HttpError } from './errors.js';
import { FONT_CHOICES, TEMPLATES as LAYOUTS } from '../public/js/cv/templates.js';

/* Seules les métadonnées des mises en page nous intéressent ici ; le CSS
   et la fonction `layout` restent côté navigateur, où ils sont utilisés. */
export const LAYOUT_META = LAYOUTS.map((t) => ({
  id: t.id, name: t.name, desc: t.desc, tags: t.tags, accent: t.accent, font: t.font,
}));

const LAYOUT_IDS = new Set(LAYOUT_META.map((l) => l.id));
const FONT_IDS = new Set(FONT_CHOICES.map((f) => f.id));

const MAX = { name: 60, desc: 240, tag: 24, tags: 4 };

/* ------------------------------------------------------------- validation */

const str = (v) => (typeof v === 'string' ? v.trim() : '');

/** Un identifiant lisible tiré du nom, unique en base. */
function newId(name) {
  const slug = name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 40) || 'modele';

  if (!exists(slug)) return slug;
  for (let i = 2; i < 500; i++) {
    if (!exists(`${slug}-${i}`)) return `${slug}-${i}`;
  }
  throw new HttpError(500, 'Impossible de générer un identifiant de modèle.');
}

const exists = (id) => Boolean(db.prepare('SELECT 1 FROM templates WHERE id = ?').get(id));

function checkTags(value) {
  if (value === undefined) return undefined;
  const list = (Array.isArray(value) ? value : String(value).split(','))
    .map((t) => str(t)).filter(Boolean);
  if (list.length > MAX.tags) throw new HttpError(400, `Pas plus de ${MAX.tags} étiquettes par modèle.`);
  if (list.some((t) => t.length > MAX.tag)) {
    throw new HttpError(400, `Une étiquette ne dépasse pas ${MAX.tag} caractères.`);
  }
  return list;
}

/** Couleur : soit une valeur hexadécimale, soit rien (= celle de la mise en page). */
function checkAccent(value) {
  if (value === undefined) return undefined;
  const v = str(value);
  if (!v) return null;
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) throw new HttpError(400, 'Couleur invalide (format attendu : #1a2b3c).');
  return v.toLowerCase();
}

function checkFont(value) {
  if (value === undefined) return undefined;
  const v = str(value);
  if (!v) return null;
  if (!FONT_IDS.has(v)) throw new HttpError(400, 'Police inconnue.');
  return v;
}

function checkBase(value) {
  const v = str(value);
  if (!LAYOUT_IDS.has(v)) throw new HttpError(400, 'Mise en page inconnue.');
  return v;
}

function checkName(value) {
  const v = str(value);
  if (!v) throw new HttpError(400, 'Le nom du modèle est obligatoire.');
  if (v.length > MAX.name) throw new HttpError(400, `Le nom ne dépasse pas ${MAX.name} caractères.`);
  return v;
}

function checkDesc(value) {
  const v = str(value);
  if (v.length > MAX.desc) throw new HttpError(400, `La description ne dépasse pas ${MAX.desc} caractères.`);
  return v;
}

/* ------------------------------------------------------------------ lecture */

function serialize(row, usage = 0) {
  return {
    id: row.id,
    base: row.base,
    name: row.name,
    desc: row.descr,
    tags: JSON.parse(row.tags || '[]'),
    accent: row.accent || null,
    font: row.font || null,
    position: row.position,
    visible: Boolean(row.visible),
    builtin: Boolean(row.builtin),
    usage,
    updatedAt: row.updated_at,
  };
}

/** Nombre de CV créés avec chaque modèle — l'admin voit ce qu'il déplace. */
function usageMap() {
  const rows = db.prepare('SELECT template, COUNT(*) AS n FROM cvs GROUP BY template').all();
  return new Map(rows.map((r) => [r.template, r.n]));
}

/** Le catalogue tel que le voit un visiteur : les modèles publiés, dans l'ordre. */
export function publicCatalog() {
  return db.prepare('SELECT * FROM templates WHERE visible = 1 ORDER BY position, name')
    .all().map((row) => serialize(row));
}

/** Le catalogue complet, masqués compris — réservé à l'administration. */
export function fullCatalog() {
  const usage = usageMap();
  return db.prepare('SELECT * FROM templates ORDER BY position, name')
    .all().map((row) => serialize(row, usage.get(row.id) || 0));
}

function requireRow(id) {
  const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
  if (!row) throw new HttpError(404, 'Modèle introuvable.');
  return row;
}

const nextPosition = () =>
  (db.prepare('SELECT COALESCE(MAX(position), 0) AS p FROM templates').get().p || 0) + 1;

/* ------------------------------------------------------------------ écriture */

export function createTemplate(body = {}) {
  const base = checkBase(body.base);
  const layout = LAYOUT_META.find((l) => l.id === base);
  const name = checkName(body.name);

  const id = newId(name);
  const ts = now();

  db.prepare(`
    INSERT INTO templates (id, base, name, descr, tags, accent, font, position, visible, builtin, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    id, base, name,
    body.desc === undefined ? layout.desc : checkDesc(body.desc),
    JSON.stringify(checkTags(body.tags) ?? layout.tags),
    checkAccent(body.accent) ?? null,
    checkFont(body.font) ?? null,
    nextPosition(),
    body.visible === false ? 0 : 1,
    ts, ts,
  );

  return serialize(requireRow(id));
}

export function updateTemplate(id, body = {}) {
  const row = requireRow(id);

  // La mise en page d'un modèle intégré ne change pas : ce serait renommer
  // « Moderne » en gardant sa fiche mais en changeant son dessin sous les
  // pieds des CV qui l'utilisent déjà.
  const base = body.base === undefined ? row.base
    : (row.builtin ? row.base : checkBase(body.base));

  const name = body.name === undefined ? row.name : checkName(body.name);
  const descr = body.desc === undefined ? row.descr : checkDesc(body.desc);
  const tags = body.tags === undefined ? row.tags : JSON.stringify(checkTags(body.tags));
  const accent = body.accent === undefined ? row.accent : checkAccent(body.accent);
  const font = body.font === undefined ? row.font : checkFont(body.font);
  const visible = body.visible === undefined ? row.visible : (body.visible ? 1 : 0);

  db.prepare(`
    UPDATE templates SET base = ?, name = ?, descr = ?, tags = ?, accent = ?, font = ?, visible = ?, updated_at = ?
    WHERE id = ?
  `).run(base, name, descr, tags, accent, font, visible, now(), id);

  const usage = usageMap();
  return serialize(requireRow(id), usage.get(id) || 0);
}

/**
 * Supprime définitivement un modèle composé par l'administrateur.
 * Un modèle intégré ne se supprime pas — il se masque : sa mise en page
 * fait partie du code. Un modèle utilisé par des CV non plus, sans quoi
 * ces CV changeraient de design à l'insu de leur propriétaire.
 */
export function deleteTemplate(id) {
  const row = requireRow(id);

  if (row.builtin) {
    throw new HttpError(409,
      'Un modèle intégré ne peut pas être supprimé — masquez-le pour le retirer de la galerie.');
  }

  const used = db.prepare('SELECT COUNT(*) AS n FROM cvs WHERE template = ?').get(id).n;
  if (used > 0) {
    throw new HttpError(409,
      `Ce modèle est utilisé par ${used} CV. Masquez-le : il disparaîtra de la galerie sans toucher aux CV existants.`);
  }

  db.prepare('DELETE FROM templates WHERE id = ?').run(id);
  return { ok: true };
}

/** Applique un nouvel ordre. Les identifiants absents gardent leur rang, à la suite. */
export function reorderTemplates(ids) {
  if (!Array.isArray(ids) || !ids.length) throw new HttpError(400, 'Ordre invalide.');

  const known = new Set(db.prepare('SELECT id FROM templates').all().map((r) => r.id));
  const seen = new Set();
  const ordered = [];
  for (const raw of ids) {
    const id = str(raw);
    if (!known.has(id) || seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
  }
  if (!ordered.length) throw new HttpError(400, 'Aucun modèle reconnu dans l’ordre transmis.');

  const rest = db.prepare('SELECT id FROM templates ORDER BY position, name').all()
    .map((r) => r.id).filter((id) => !seen.has(id));

  const stmt = db.prepare('UPDATE templates SET position = ?, updated_at = ? WHERE id = ?');
  const ts = now();
  [...ordered, ...rest].forEach((id, i) => stmt.run(i + 1, ts, id));

  return fullCatalog();
}

/* --------------------------------------------------------------- amorçage */

/**
 * Inscrit au catalogue les mises en page intégrées qui n'y figurent pas
 * encore — au premier démarrage, elles y entrent toutes dans leur ordre
 * d'origine ; plus tard, une mise en page ajoutée au code s'ajoute à la
 * suite sans perturber l'ordre choisi par l'administrateur.
 */
export function seedCatalog() {
  const known = new Set(db.prepare('SELECT id FROM templates').all().map((r) => r.id));
  const missing = LAYOUT_META.filter((l) => !known.has(l.id));
  if (!missing.length) return 0;

  const ts = now();
  let position = nextPosition();
  const stmt = db.prepare(`
    INSERT INTO templates (id, base, name, descr, tags, accent, font, position, visible, builtin, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, 1, 1, ?, ?)
  `);

  for (const l of missing) {
    stmt.run(l.id, l.id, l.name, l.desc, JSON.stringify(l.tags), position++, ts, ts);
  }
  return missing.length;
}
