/* =====================================================================
   Fabrication du PDF.

   Aucune interface du navigateur ne produit un PDF sans passer par la
   boîte d'impression : `window.print()` la montre toujours. Pour que le
   téléchargement soit direct, le PDF est donc fabriqué ici, en confiant
   le document du CV au Chrome installé sur la machine.

   C'est le même moteur que celui qui affichait l'aperçu : le fichier
   obtenu est vectoriel, son texte reste sélectionnable, et il est
   rigoureusement identique à ce que donnait « Enregistrer au format PDF ».

   En contrepartie, Chrome (ou Chromium) doit être présent là où tourne le
   serveur. Voir README, section « Export PDF ».
   ===================================================================== */

import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { HttpError } from './errors.js';
import { renderDocument } from '../public/js/cv/render.js';

/* Chrome met quelques secondes ; au-delà, c'est qu'il ne rendra pas la main. */
const TIMEOUT = Number(process.env.PDF_TIMEOUT_MS) || 25_000;

/* Le temps laissé aux polices distantes et à la mise en pages avant le tirage. */
const SETTLE_MS = Number(process.env.PDF_SETTLE_MS) || 4000;

const CANDIDATES = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ],
  linux: [
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/snap/bin/chromium', '/usr/bin/microsoft-edge',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
};

let cachedPath = null;

/** Le navigateur qui fabriquera les PDF, ou null s'il n'y en a pas. */
export function findBrowser() {
  if (cachedPath !== null) return cachedPath || null;

  const configured = (process.env.CHROME_PATH || '').trim();
  if (configured) {
    cachedPath = existsSync(configured) ? configured : '';
    return cachedPath || null;
  }

  cachedPath = (CANDIDATES[process.platform] || []).find((p) => existsSync(p)) || '';
  return cachedPath || null;
}

/** Un nom de fichier sûr, tiré du titre du CV. */
export function pdfFilename(title) {
  const base = String(title || 'CV')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 _-]+/g, ' ')
    .trim().replace(/\s+/g, '-')
    .slice(0, 60) || 'CV';
  return `${base}.pdf`;
}

/**
 * Rend le CV en PDF. Renvoie le contenu du fichier.
 *
 * Le document est écrit sur disque plutôt que passé par une URL de
 * données : celles-ci sont plafonnées en longueur, et un CV avec photo
 * dépasse allègrement la limite.
 */
export async function renderPdf(cv) {
  const browser = findBrowser();
  if (!browser) {
    throw new HttpError(503,
      'La génération du PDF est indisponible : aucun navigateur Chrome ou Chromium '
      + 'n’a été trouvé sur le serveur. Renseignez CHROME_PATH pour en désigner un.');
  }

  const dir = await mkdtemp(join(tmpdir(), 'designcv-pdf-'));
  const source = join(dir, 'cv.html');
  const target = join(dir, 'cv.pdf');

  try {
    // Ni verrouillage ni filigrane : le PDF est le livrable payé.
    // `autoLayout` cale les pages, personne n'étant là pour le demander.
    await writeFile(source, renderDocument(cv, { protect: false, autoLayout: true }), 'utf8');

    const args = [
      '--headless',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      // Un profil jetable : sans lui, un Chrome déjà ouvert sur la machine
      // refuserait de démarrer une seconde instance sur le même profil.
      `--user-data-dir=${join(dir, 'profil')}`,
      '--no-pdf-header-footer',
      `--virtual-time-budget=${SETTLE_MS}`,
      `--print-to-pdf=${target}`,
      `file://${source}`,
    ];
    // Les conteneurs tournent souvent en root, où le bac à sable de Chrome
    // refuse de démarrer. À n'activer que là, et en connaissance de cause.
    if (process.env.CHROME_NO_SANDBOX === '1') args.unshift('--no-sandbox');

    await run(browser, args, target);

    const pdf = await readFile(target);
    if (!pdf.length || !pdf.subarray(0, 4).equals(Buffer.from('%PDF'))) {
      throw new HttpError(500, 'Le PDF produit est illisible. Réessayez dans un instant.');
    }
    return pdf;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    console.error('[pdf]', err);
    throw new HttpError(500, 'La génération du PDF a échoué. Réessayez dans un instant.');
  } finally {
    rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Lance le navigateur et attend le PDF.
 *
 * On n'attend pas la sortie du processus : avec un profil dédié, Chrome
 * écrit bien le fichier puis reste en vie indéfiniment sur certaines
 * plateformes. C'est donc le fichier qui fait foi. On le guette, et dès
 * qu'il est complet — un PDF se termine par `%%EOF` — on rend la main et
 * on coupe le navigateur.
 */
function run(command, args, target) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });

    let stderr = '';
    let done = false;
    child.stderr.on('data', (c) => { if (stderr.length < 4000) stderr += c; });

    const finish = (err) => {
      if (done) return;
      done = true;
      clearInterval(poll);
      clearTimeout(timer);
      child.kill('SIGKILL');
      err ? reject(err) : resolve();
    };

    const poll = setInterval(() => { isComplete(target).then((ok) => { if (ok) finish(); }); }, 150);

    const timer = setTimeout(
      () => finish(new Error(`délai dépassé (${TIMEOUT} ms)`)),
      TIMEOUT,
    );

    child.on('error', (err) => finish(err));
    child.on('close', async (code) => {
      // Chrome écrit des avertissements sans conséquence sur stderr : c'est
      // la présence du fichier qui tranche, pas le code de sortie.
      if (await isComplete(target)) finish();
      else finish(new Error(`sortie ${code} — ${stderr.slice(0, 500)}`));
    });
  });
}

/** Un PDF entièrement écrit se termine par sa marque de fin. */
async function isComplete(file) {
  try {
    const { size } = await stat(file);
    if (size < 400) return false;
    const tail = await readFile(file);
    return tail.subarray(-1024).includes('%%EOF');
  } catch {
    return false;   // pas encore là
  }
}
