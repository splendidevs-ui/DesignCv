import { randomBytes } from 'node:crypto';
import { db, expireOrders, now } from './db.js';
import {
  clearCookie, createSession, destroySession, hashPassword,
  sessionCookie, userFromRequest, verifyPassword,
} from './auth.js';
import { HttpError } from './errors.js';
import { demoAccounts } from './demo.js';
import { pdfFilename, renderPdf } from './pdf.js';
import {
  LAYOUT_META, createTemplate, deleteTemplate, fullCatalog,
  publicCatalog, reorderTemplates, updateTemplate,
} from './catalog.js';
import {
  MODE as PAYMENT_MODE, PRICE, formatAmount, pricing, provider, validateCard, validateMobile,
} from './payments.js';

const MAX_BODY = 12 * 1024 * 1024; // 12 Mo — laisse la place à une photo en base64
const ORDER_TTL = 10 * 60 * 1000;  // une commande en attente vaut dix minutes
const MAX_ATTEMPTS = 3;            // codes de confirmation erronés tolérés

/* ------------------------------------------------------------------ utilitaires */

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new HttpError(413, 'Contenu trop volumineux (12 Mo maximum).'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); }
      catch { reject(new HttpError(400, 'JSON invalide.')); }
    });
    req.on('error', reject);
  });
}

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

function requireUser(req) {
  const user = userFromRequest(req);
  if (!user) throw new HttpError(401, 'Session expirée, veuillez vous reconnecter.');
  return user;
}

function requireAdmin(req) {
  const user = requireUser(req);
  if (user.role !== 'admin') throw new HttpError(403, 'Espace réservé à l’administration.');
  return user;
}

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name ?? row.fullName,
    role: row.role || 'user',
  };
}

function serializeCv(row) {
  return {
    id: row.id,
    title: row.title,
    template: row.template,
    theme: JSON.parse(row.theme),
    data: JSON.parse(row.data),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function ownedCv(userId, id) {
  const row = db.prepare('SELECT * FROM cvs WHERE id = ? AND user_id = ?').get(id, userId);
  if (!row) throw new HttpError(404, 'CV introuvable.');
  return row;
}

/* ------------------------------------------------------------------ commandes */

function serializeOrder(row) {
  return {
    reference: row.reference,
    cvId: row.cv_id,
    method: row.method,
    detail: row.detail,
    amount: row.amount,
    currency: row.currency,
    label: formatAmount(row.amount, row.currency),
    status: row.status,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - row.attempts),
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };
}

/** La commande réglée qui débloque ce CV, s'il y en a une. */
const paidOrder = (cvId) => db.prepare(
  "SELECT * FROM orders WHERE cv_id = ? AND status = 'paid' ORDER BY paid_at DESC LIMIT 1",
).get(cvId) || null;

function ownedOrder(userId, reference) {
  const row = db.prepare('SELECT * FROM orders WHERE reference = ? AND user_id = ?').get(reference, userId);
  if (!row) throw new HttpError(404, 'Commande introuvable.');
  return row;
}

/** Référence lisible et non devinable, unique en base. */
function newReference() {
  for (let i = 0; i < 8; i++) {
    const ref = `DCV-${randomBytes(5).toString('hex').toUpperCase()}`;
    if (!db.prepare('SELECT 1 FROM orders WHERE reference = ?').get(ref)) return ref;
  }
  throw new HttpError(500, 'Impossible de générer une référence de commande.');
}

/* ---------------------------------------------------------------------- routes */

const routes = [
  /* -- authentification -------------------------------------------------- */

  ['POST', /^\/api\/auth\/register$/, async (req, res) => {
    const body = await readBody(req);
    const email = str(body.email).toLowerCase();
    const fullName = str(body.fullName);
    const password = typeof body.password === 'string' ? body.password : '';

    if (!fullName) throw new HttpError(400, 'Le nom complet est obligatoire.');
    if (!isEmail(email)) throw new HttpError(400, 'Adresse e-mail invalide.');
    if (password.length < 8) throw new HttpError(400, 'Le mot de passe doit contenir au moins 8 caractères.');

    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) throw new HttpError(409, 'Un compte existe déjà avec cette adresse e-mail.');

    const info = db.prepare(
      'INSERT INTO users (email, full_name, password_hash, created_at) VALUES (?, ?, ?, ?)',
    ).run(email, fullName, hashPassword(password), now());

    const userId = Number(info.lastInsertRowid);
    const { token, expires } = createSession(userId);
    res.setHeader('Set-Cookie', sessionCookie(token, expires));
    return { user: { id: userId, email, fullName, role: 'user' } };
  }],

  ['POST', /^\/api\/auth\/login$/, async (req, res) => {
    const body = await readBody(req);
    const email = str(body.email).toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';

    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!row || !verifyPassword(password, row.password_hash)) {
      throw new HttpError(401, 'E-mail ou mot de passe incorrect.');
    }

    const { token, expires } = createSession(row.id);
    res.setHeader('Set-Cookie', sessionCookie(token, expires));
    return { user: publicUser(row) };
  }],

  ['POST', /^\/api\/auth\/logout$/, (req, res) => {
    const user = userFromRequest(req);
    if (user) destroySession(user.token);
    res.setHeader('Set-Cookie', clearCookie());
    return { ok: true };
  }],

  ['GET', /^\/api\/auth\/me$/, (req) => {
    const user = userFromRequest(req);
    return { user: user ? publicUser(user) : null };
  }],

  /* Banc d'essai — TEMPORAIRE. Les comptes de démonstration proposés sur
     la page de connexion. Liste vide si DEMO_LOGINS=0. */
  ['GET', /^\/api\/demo-accounts$/, () => ({ accounts: demoAccounts() })],

  /* -- CV ---------------------------------------------------------------- */

  ['GET', /^\/api\/cvs$/, (req) => {
    const user = requireUser(req);
    const rows = db.prepare(
      'SELECT * FROM cvs WHERE user_id = ? ORDER BY updated_at DESC',
    ).all(user.id);
    // Une seule requête pour tous les CV : le tableau de bord affiche la
    // pastille « payé » sans interroger l'API une fois par carte.
    const paid = new Set(db.prepare(
      "SELECT DISTINCT cv_id FROM orders WHERE user_id = ? AND status = 'paid'",
    ).all(user.id).map((r) => r.cv_id));
    return { cvs: rows.map((row) => ({ ...serializeCv(row), paid: paid.has(row.id) })) };
  }],

  ['POST', /^\/api\/cvs$/, async (req) => {
    const user = requireUser(req);
    const body = await readBody(req);
    const title = str(body.title) || 'Mon CV';
    const template = str(body.template) || 'moderne';
    const theme = JSON.stringify(body.theme ?? {});
    const data = JSON.stringify(body.data ?? {});
    const ts = now();

    const info = db.prepare(`
      INSERT INTO cvs (user_id, title, template, theme, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(user.id, title, template, theme, data, ts, ts);

    return { cv: serializeCv(ownedCv(user.id, Number(info.lastInsertRowid))) };
  }],

  ['GET', /^\/api\/cvs\/(\d+)$/, (req, res, [id]) => {
    const user = requireUser(req);
    const row = ownedCv(user.id, Number(id));
    return { cv: { ...serializeCv(row), paid: Boolean(paidOrder(row.id)) } };
  }],

  ['PATCH', /^\/api\/cvs\/(\d+)$/, async (req, res, [id]) => {
    const user = requireUser(req);
    const current = ownedCv(user.id, Number(id));
    const body = await readBody(req);

    const title = body.title !== undefined ? (str(body.title) || 'Mon CV') : current.title;
    const template = body.template !== undefined ? str(body.template) : current.template;
    const theme = body.theme !== undefined ? JSON.stringify(body.theme) : current.theme;
    const data = body.data !== undefined ? JSON.stringify(body.data) : current.data;

    db.prepare(`
      UPDATE cvs SET title = ?, template = ?, theme = ?, data = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(title, template, theme, data, now(), current.id, user.id);

    return { cv: serializeCv(ownedCv(user.id, current.id)) };
  }],

  ['POST', /^\/api\/cvs\/(\d+)\/duplicate$/, (req, res, [id]) => {
    const user = requireUser(req);
    const src = ownedCv(user.id, Number(id));
    const ts = now();
    const info = db.prepare(`
      INSERT INTO cvs (user_id, title, template, theme, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(user.id, `${src.title} (copie)`, src.template, src.theme, src.data, ts, ts);
    return { cv: serializeCv(ownedCv(user.id, Number(info.lastInsertRowid))) };
  }],

  ['DELETE', /^\/api\/cvs\/(\d+)$/, (req, res, [id]) => {
    const user = requireUser(req);
    const cv = ownedCv(user.id, Number(id));
    db.prepare('DELETE FROM cvs WHERE id = ? AND user_id = ?').run(cv.id, user.id);
    return { ok: true };
  }],

  /* -- catalogue des modèles --------------------------------------------- */

  /* Ce que la galerie affiche : les modèles publiés, dans l'ordre choisi
     par l'administration. */
  ['GET', /^\/api\/templates$/, (req) => {
    requireUser(req);
    return { templates: publicCatalog() };
  }],

  /* -- administration ---------------------------------------------------- */

  /* Le catalogue complet, masqués compris, avec le nombre de CV qui
     s'appuient sur chaque modèle, et la liste des mises en page
     disponibles comme base d'un nouveau modèle. */
  ['GET', /^\/api\/admin\/templates$/, (req) => {
    requireAdmin(req);
    return { templates: fullCatalog(), layouts: LAYOUT_META };
  }],

  ['POST', /^\/api\/admin\/templates$/, async (req) => {
    requireAdmin(req);
    return { template: createTemplate(await readBody(req)) };
  }],

  /* L'ordre est envoyé en bloc : un glisser-déposer déplace une carte mais
     renumérote toute la galerie, autant l'enregistrer d'un seul coup. */
  ['POST', /^\/api\/admin\/templates\/ordre$/, async (req) => {
    requireAdmin(req);
    const body = await readBody(req);
    return { templates: reorderTemplates(body.ids) };
  }],

  ['PATCH', /^\/api\/admin\/templates\/([A-Za-z0-9_-]{1,60})$/, async (req, res, [id]) => {
    requireAdmin(req);
    return { template: updateTemplate(id, await readBody(req)) };
  }],

  ['DELETE', /^\/api\/admin\/templates\/([A-Za-z0-9_-]{1,60})$/, (req, res, [id]) => {
    requireAdmin(req);
    return deleteTemplate(id);
  }],

  /* Le PDF, fabriqué par le serveur et servi en téléchargement direct :
     l'utilisateur n'a pas à passer par la boîte d'impression du navigateur.
     C'est le livrable payant, donc la commande est vérifiée ici, en base,
     et non sur la foi de ce que dit le navigateur. */
  ['GET', /^\/api\/cvs\/(\d+)\/pdf$/, async (req, res, [id]) => {
    const user = requireUser(req);
    const row = ownedCv(user.id, Number(id));

    if (!paidOrder(row.id)) {
      throw new HttpError(402, 'Le téléchargement de ce CV n’a pas encore été réglé.');
    }

    const pdf = await renderPdf(serializeCv(row));
    const name = pdfFilename(row.title);

    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': pdf.length,
      // `filename*` porte les accents ; `filename` reste là pour les
      // clients qui ne lisent que lui.
      'Content-Disposition':
        `attachment; filename="${name.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      'Cache-Control': 'no-store',
    });
    res.end(pdf);
  }],

  /* -- paiement ---------------------------------------------------------- */

  /* Le tarif, les pays et leurs opérateurs de paiement mobile : de quoi
     peindre le formulaire sans coder le prix en dur côté navigateur. */
  ['GET', /^\/api\/pricing$/, () => ({ pricing: pricing() })],

  /* Le droit de télécharger s'achète une fois par CV : une fois la commande
     réglée, le PDF reste exportable indéfiniment, y compris après
     modification. Un CV dupliqué est un nouveau CV, donc à régler. */
  ['GET', /^\/api\/cvs\/(\d+)\/access$/, (req, res, [id]) => {
    const user = requireUser(req);
    const cv = ownedCv(user.id, Number(id));
    const order = paidOrder(cv.id);
    return { paid: Boolean(order), order: order ? serializeOrder(order) : null, price: pricing() };
  }],

  ['POST', /^\/api\/cvs\/(\d+)\/checkout$/, async (req, res, [id]) => {
    const user = requireUser(req);
    const cv = ownedCv(user.id, Number(id));
    expireOrders();

    const settled = paidOrder(cv.id);
    if (settled) return { paid: true, order: serializeOrder(settled) };

    const body = await readBody(req);
    const method = str(body.method);
    if (method !== 'card' && method !== 'mobile-money') {
      throw new HttpError(400, 'Moyen de paiement inconnu.');
    }

    // validateCard / validateMobile renvoient aussi le numéro en clair pour
    // que le prestataire puisse l'utiliser ; il ne franchit pas cette
    // fonction : seul `detail`, déjà masqué, part en base.
    const card = method === 'card' ? validateCard(body.card) : null;
    const phone = method === 'card' ? null : validateMobile(body);
    const detail = card
      ? `${card.brandLabel} •••• ${card.last4}`
      : `${phone.operatorLabel} ${phone.masked}`;

    const auth = provider.authorize({ method, card, phone });

    const reference = newReference();
    const createdAt = now();
    const expiresAt = new Date(Date.now() + ORDER_TTL).toISOString();

    db.prepare(`
      INSERT INTO orders
        (reference, user_id, cv_id, method, detail, amount, currency, status, otp, attempts, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, 0, ?, ?)
    `).run(reference, user.id, cv.id, method, detail,
      PRICE.amount, PRICE.currency, auth.otp, createdAt, expiresAt);

    return {
      paid: false,
      order: serializeOrder(ownedOrder(user.id, reference)),
      challenge: auth.challenge,
      instruction: auth.instruction,
      expiresAt,
      // En mode démonstration il n'y a ni banque ni passerelle SMS : le code
      // est renvoyé pour que le parcours reste testable. En mode « live »,
      // ce champ n'existe pas.
      ...(PAYMENT_MODE === 'demo' ? { demoCode: auth.otp } : {}),
    };
  }],

  ['POST', /^\/api\/orders\/([A-Za-z0-9-]{6,40})\/confirm$/, async (req, res, [reference]) => {
    const user = requireUser(req);
    expireOrders();

    const row = ownedOrder(user.id, reference);
    if (row.status === 'paid') return { paid: true, order: serializeOrder(row) };
    if (row.status !== 'pending') {
      throw new HttpError(409, row.status === 'failed'
        ? 'Cette commande a été annulée. Relancez le paiement.'
        : 'Cette commande a expiré. Relancez le paiement.');
    }

    const body = await readBody(req);
    const code = str(body.code).replace(/\D+/g, '');
    if (!code) throw new HttpError(400, 'Saisissez le code de confirmation.');

    if (!provider.confirm(row, code)) {
      const attempts = row.attempts + 1;
      const dead = attempts >= MAX_ATTEMPTS;
      db.prepare('UPDATE orders SET attempts = ?, status = ?, otp = ? WHERE id = ?')
        .run(attempts, dead ? 'failed' : 'pending', dead ? null : row.otp, row.id);
      throw new HttpError(402, dead
        ? 'Trop de codes erronés : la commande a été annulée, aucun montant n’a été prélevé.'
        : `Code incorrect. Il vous reste ${MAX_ATTEMPTS - attempts} essai${MAX_ATTEMPTS - attempts > 1 ? 's' : ''}.`);
    }

    db.prepare("UPDATE orders SET status = 'paid', paid_at = ?, otp = NULL WHERE id = ?")
      .run(now(), row.id);

    return { paid: true, order: serializeOrder(ownedOrder(user.id, reference)) };
  }],

  /* Historique des paiements — sert de justificatif à l'utilisateur. */
  ['GET', /^\/api\/orders$/, (req) => {
    const user = requireUser(req);
    const rows = db.prepare(`
      SELECT o.*, c.title AS cv_title FROM orders o
      LEFT JOIN cvs c ON c.id = o.cv_id
      WHERE o.user_id = ? AND o.status = 'paid'
      ORDER BY o.paid_at DESC LIMIT 100
    `).all(user.id);
    return { orders: rows.map((r) => ({ ...serializeOrder(r), cvTitle: r.cv_title })) };
  }],
];

/* --------------------------------------------------------------- dispatcher */

/** Traite une requête /api/*. Renvoie true si la route a été prise en charge. */
export async function handleApi(req, res, pathname) {
  const method = req.method === 'HEAD' ? 'GET' : req.method;
  const match = routes.find(([m, re]) => m === method && re.test(pathname));

  if (!match) {
    const pathExists = routes.some(([, re]) => re.test(pathname));
    send(res, pathExists ? 405 : 404, { error: pathExists ? 'Méthode non autorisée.' : 'Route inconnue.' });
    return;
  }

  const params = pathname.match(match[1]).slice(1);
  try {
    const payload = await match[2](req, res, params);
    send(res, 200, payload ?? { ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      send(res, err.status, { error: err.message });
    } else {
      console.error('[api]', err);
      send(res, 500, { error: 'Erreur interne du serveur.' });
    }
  }
}

function send(res, status, payload) {
  if (res.writableEnded) return;
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}
