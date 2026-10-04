import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApi } from './api.js';
import { seedCatalog } from './catalog.js';
import { ensureAdmin } from './admin.js';
import { DEMO_ENABLED, demoAccounts, seedDemoUsers } from './demo.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = join(ROOT, 'public');
const PORT = Number(process.env.PORT) || 4173;
const HOST = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || HOST}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname.startsWith('/api/')) {
    await handleApi(req, res, pathname);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end();
    return;
  }

  // Résolution du fichier statique, avec garde anti-traversée de répertoire.
  const rel = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(PUBLIC_DIR, rel);
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + sep)) {
    res.writeHead(403).end('Accès refusé');
    return;
  }

  let info = await stat(filePath).catch(() => null);
  if (info?.isDirectory()) {
    filePath = join(filePath, 'index.html');
    info = await stat(filePath).catch(() => null);
  }

  // Fallback SPA : toute route inconnue sans extension renvoie l'app.
  if (!info && !extname(pathname)) {
    filePath = join(PUBLIC_DIR, 'index.html');
    info = await stat(filePath).catch(() => null);
  }

  if (!info) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 — Introuvable');
    return;
  }

  const type = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': info.size,
    'Cache-Control': 'no-cache',
  });

  if (req.method === 'HEAD') { res.end(); return; }
  createReadStream(filePath).pipe(res);
});

/* Le catalogue rattrape les mises en page ajoutées au code, puis on
   s'assure qu'il reste un administrateur pour l'ordonner. */
const seeded = seedCatalog();
const admin = ensureAdmin();
const demoCreated = seedDemoUsers();

server.listen(PORT, HOST, () => {
  console.log(`\n  ✦ DESIGN CV — serveur prêt`);
  console.log(`    http://${HOST}:${PORT}\n`);

  if (seeded) console.log(`    ${seeded} modèle(s) ajouté(s) au catalogue.`);
  if (admin.promoted) console.log(`    ${admin.promoted} compte(s) promu(s) administrateur.`);
  if (demoCreated) console.log(`    ${demoCreated} compte(s) de démonstration créé(s).`);
  if (DEMO_ENABLED) {
    console.log('    ⚠ Banc d’essai actif : la page de connexion affiche des');
    console.log('      identifiants de test. Éteindre avec DEMO_LOGINS=0.');
    for (const a of demoAccounts()) console.log(`      · ${a.label.padEnd(14)} ${a.email}  ${a.password}`);
    console.log('');
  }
  if (admin.created) {
    console.log('    ┌─ Compte d’administration créé ────────────────');
    console.log(`    │  ${admin.email}`);
    console.log(`    │  ${admin.password}`);
    console.log('    │  Changez ce mot de passe : ADMIN_PASSWORD=… npm start');
    console.log('    └───────────────────────────────────────────────\n');
  }
});
