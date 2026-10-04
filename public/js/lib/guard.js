/* =====================================================================
   Protection du contenu affiché.

   Ce que ce module peut faire — et ce qu'il ne peut pas.

   Aucun navigateur n'expose d'interface permettant d'empêcher une capture
   d'écran. Ni une page web, ni une extension, ni le HTTPS n'arrêtent
   Cmd+Maj+3, l'outil Capture de Windows, un enregistreur vidéo ou un
   téléphone braqué sur l'écran. Promettre l'inverse serait mentir : ce
   module rend la capture difficile et souvent inutilisable, il ne
   l'interdit pas.

   Ce qui est réellement obtenu :

     1. Le paiement. Le livrable — le PDF net, imprimable — n'est produit
        qu'une fois la commande réglée. C'est la seule barrière
        infranchissable, parce qu'elle est côté serveur.
     2. Le masquage. L'écran se voile dès que la fenêtre perd le focus ou
        que l'onglet passe en arrière-plan. Toute capture lancée depuis
        une autre application — outil de capture différée, enregistreur,
        fenêtre de sélection de Windows — photographie le voile.
     3. L'interception. Les raccourcis de capture connus lèvent un voile
        qui reste en place jusqu'à ce qu'on le referme explicitement, et
        le presse-papiers est écrasé. Une sélection de zone lancée par
        Cmd+Maj+4 cadre donc le voile, quel que soit le temps qu'on y met.
     4. La gêne. Sélection, copie, glisser-déposer, menu contextuel,
        impression de la page, partage d'écran demandé par la page et
        raccourcis d'outils de développement sont neutralisés.

   Reste hors de portée, et il faut le savoir : une capture plein écran
   instantanée (Cmd+Maj+3) peut devancer l'affichage du voile, un second
   appareil photographiant l'écran ne laisse aucune trace, et rien de tout
   ceci ne s'applique à un navigateur dont on a désactivé JavaScript — mais
   sans JavaScript, l'application ne s'affiche pas du tout.
   ===================================================================== */

import { toast } from './dom.js';

const NOTICE = 'Contenu protégé — DESIGN CV. Téléchargez le PDF depuis l’application.';

let installed = false;
let lastWarn = 0;

const isEditable = (node) => {
  const el = node instanceof Element ? node : null;
  return Boolean(el && (el.closest('input, textarea, select, [contenteditable="true"]')));
};

/** Un seul avertissement toutes les trois secondes : sinon c'est un mitraillage. */
function warn(message) {
  const t = Date.now();
  if (t - lastWarn < 3000) return;
  lastWarn = t;
  toast(message, 'err');
}

/* ---------------------------------------------------------- filigrane */

/* L'aperçu reste net tant qu'on se contente de le regarder. Le filigrane
   n'apparaît qu'au moment d'une tentative de capture, et il le fait par
   surimpression dans la page — pas en redessinant le document du CV, qui
   prendrait des centaines de millisecondes alors qu'il faut y être en une
   image. */

/* La marque est fixe et neutre, comme celle de l'aperçu : elle rappelle
   l'origine du document sans désigner de compte. */
const STAMP_TEXT = 'DESIGN CV';
let stamp = null;

/**
 * Tuile de la surimpression : la même marque que l'aperçu, en plus dense,
 * puisqu'elle doit rester lisible sur toute la surface de l'application.
 */
function watermarkTile(text) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="170">'
    + '<g transform="rotate(-27 150 85)" fill="rgba(17, 20, 33, .26)"'
    + ' stroke="rgba(255, 255, 255, .42)" stroke-width="3" paint-order="stroke"'
    + ' text-anchor="middle" font-family="Inter, Arial, sans-serif"'
    + ' font-size="26" font-weight="800" letter-spacing="1.5">'
    + `<text x="75" y="56">${text}</text>`
    + `<text x="225" y="130">${text}</text></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function ensureStamp() {
  if (stamp) return stamp;
  stamp = document.createElement('div');
  stamp.id = 'guard-watermark';
  stamp.setAttribute('aria-hidden', 'true');
  document.body.append(stamp);
  return stamp;
}

/* Plusieurs situations peuvent réclamer le filigrane en même temps — la
   fenêtre perd le focus pendant qu'un délai de capture court encore. On
   compte les raisons plutôt que d'empiler des minuteries qui s'annulent. */
const stampReasons = new Set();
const stampTimers = new Map();

/**
 * Appose le filigrane pour une raison donnée. `seconds` retire cette
 * raison-là au bout du délai ; sans délai, elle tient jusqu'à `unstamp`.
 */
function stampOn(reason, seconds = 0) {
  clearTimeout(stampTimers.get(reason));
  stampTimers.delete(reason);
  stampReasons.add(reason);

  const el = ensureStamp();
  if (!el.style.backgroundImage) el.style.backgroundImage = watermarkTile(STAMP_TEXT);
  el.classList.add('is-on');

  if (seconds) stampTimers.set(reason, setTimeout(() => stampOff(reason), seconds * 1000));
}

/** Retire une raison. Le filigrane ne tombe que lorsqu'il n'en reste aucune. */
function stampOff(reason, afterSeconds = 0) {
  if (afterSeconds) {
    clearTimeout(stampTimers.get(reason));
    stampTimers.set(reason, setTimeout(() => stampOff(reason), afterSeconds * 1000));
    return;
  }
  clearTimeout(stampTimers.get(reason));
  stampTimers.delete(reason);
  stampReasons.delete(reason);
  if (!stampReasons.size) stamp?.classList.remove('is-on');
}

/* --------------------------------------------------------------- voile */

/* Deux voiles pour deux situations : celui de la perte de focus se lève
   tout seul au retour, celui d'une tentative de capture reste en place
   tant qu'on ne l'a pas refermé — sans quoi une sélection de zone n'aurait
   qu'à patienter que le voile retombe. */

let shield = null;
let shieldTitle = null;
let shieldText = null;
let shieldClose = null;
let veilMode = null;   // null | 'focus' | 'capture'

function ensureShield() {
  if (shield) return shield;

  shieldTitle = document.createElement('p');
  shieldTitle.className = 'guard-shield__title';

  shieldText = document.createElement('p');
  shieldText.className = 'guard-shield__text';

  shieldClose = document.createElement('button');
  shieldClose.type = 'button';
  shieldClose.className = 'btn btn--primary guard-shield__close';
  shieldClose.textContent = 'Revenir au CV';
  shieldClose.addEventListener('click', () => {
    hideVeil('capture');
    stampOff('capture', STAMP_LINGER);
  });

  const icon = document.createElement('div');
  icon.className = 'guard-shield__icon';
  icon.textContent = '🔒';

  const box = document.createElement('div');
  box.className = 'guard-shield__box';
  box.append(icon, shieldTitle, shieldText, shieldClose);

  shield = document.createElement('div');
  shield.id = 'guard-shield';
  shield.setAttribute('aria-hidden', 'true');
  shield.append(box);
  document.body.append(shield);
  return shield;
}

/** Lève un voile. Un voile de capture n'est jamais remplacé par un voile de focus. */
function showVeil(mode, title, text) {
  if (veilMode === 'capture' && mode !== 'capture') return;
  ensureShield();
  veilMode = mode;
  shieldTitle.textContent = title;
  shieldText.textContent = text;
  shieldClose.hidden = mode !== 'capture';
  shield.classList.add('is-on');
  if (mode === 'capture') shieldClose.focus();
}

/** Retire le voile, mais seulement celui qu'on prétend retirer. */
function hideVeil(mode) {
  if (!shield || veilMode === null) return;
  if (veilMode === 'capture' && mode !== 'capture') return;
  veilMode = null;
  shield.classList.remove('is-on');
}

/* Le filigrane accompagne le voile de focus : si une capture lancée depuis
   une autre application devance l'affichage du voile, elle emporte au moins
   la marque. */
/* Certaines fenêtres légitimes vivent hors de la page — le sélecteur de
   couleurs du système, la pipette de prélèvement — et leur ouverture fait
   perdre le focus au document. Sans cette parenthèse, le voile tomberait
   pendant qu'on choisit sa couleur, ce qui reviendrait à interdire la
   fonction. La suspension ne concerne que le voile de focus : celui d'une
   tentative de capture reste, lui, inconditionnel. */
let veilHolds = 0;

/**
 * Suspend le voile de perte de focus. Renvoie la fonction qui le rétablit ;
 * elle est sans effet si on l'appelle deux fois.
 */
export function holdFocusVeil() {
  veilHolds++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    veilHolds = Math.max(0, veilHolds - 1);
  };
}

const veilFocus = (on) => {
  if (on && veilHolds) return;
  if (on) {
    stampOn('focus');
    showVeil('focus', 'Contenu masqué', 'Revenez sur cette fenêtre pour afficher à nouveau votre CV.');
  } else {
    stampOff('focus');
    hideVeil('focus');
  }
};

/**
 * Réaction à une tentative de capture : filigrane, voile persistant et
 * presse-papiers écrasé.
 *
 * Les deux se complètent. Le voile est le plus efficace, mais il peut se
 * faire devancer par une capture instantanée ; le filigrane, lui, reste en
 * place après que le voile a été refermé, si bien qu'une seconde tentative
 * — y compris une que l'on ne sait pas détecter — cadre du contenu marqué.
 */
function captureBlocked(text) {
  stampOn('capture');
  scrubClipboard();
  showVeil('capture', 'Capture bloquée', text);
}

/* Le filigrane survit un moment à la fermeture du voile : l'insistance est
   précisément le cas qu'il faut couvrir. */
const STAMP_LINGER = 15;

/* Ctrl/Cmd+S sert aussi à enregistrer dans l'éditeur : la marque y est
   brève, juste de quoi couvrir un « Enregistrer la page » du navigateur. */
const SAVE_STAMP_SECONDS = 5;

/* ------------------------------------------------------------ installation */

/** Active la protection sur toute l'application. Idempotent. */
export function installGuard() {
  if (installed) return;
  installed = true;

  document.documentElement.classList.add('is-guarded');

  /* — sélection, copie, glisser-déposer, menu contextuel — */

  document.addEventListener('contextmenu', (e) => {
    if (isEditable(e.target)) return;
    e.preventDefault();
    warn('Clic droit désactivé sur le contenu protégé.');
  });

  document.addEventListener('selectstart', (e) => {
    if (!isEditable(e.target)) e.preventDefault();
  });

  document.addEventListener('dragstart', (e) => {
    // Le glisser-déposer des fiches de l'éditeur reste autorisé :
    // il réordonne, il n'exporte rien.
    if (e.target instanceof Element && e.target.closest('.item-card')) return;
    e.preventDefault();
  });

  for (const type of ['copy', 'cut']) {
    document.addEventListener(type, (e) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
      // Mieux vaut un presse-papiers qui explique qu'un presse-papiers muet.
      e.clipboardData?.setData('text/plain', NOTICE);
      warn('La copie du contenu est désactivée.');
    });
  }

  /* — raccourcis clavier — */

  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    const key = (e.key || '').toLowerCase();

    if (isCaptureShortcut(e, key)) {
      // Le système a déjà pris la main : on ne peut pas annuler le geste,
      // seulement s'assurer qu'il ne rapporte rien d'exploitable.
      e.preventDefault();
      captureBlocked('Une capture d’écran a été détectée. Le contenu a été masqué et le presse-papiers effacé.');
      return;
    }

    if (!mod) {
      if (e.key === 'F12') { e.preventDefault(); warn('Outils de développement désactivés.'); }
      return;
    }

    // Ctrl/Cmd+P et Ctrl/Cmd+S : l'éditeur écoute aussi ces touches pour
    // lancer l'export et l'enregistrement. On coupe la fonction du
    // navigateur sans interrompre la propagation, sinon on casserait
    // ces deux raccourcis-là.
    if (['p', 's', 'u'].includes(key)) {
      e.preventDefault();
      // « Enregistrer la page » emporterait le CV tel qu'il est affiché :
      // on le marque le temps que le geste se joue. Bref, parce que Ctrl+S
      // est aussi l'enregistrement de l'éditeur — le filigrane ne doit pas
      // s'installer à demeure sur un geste que l'on encourage.
      if (key === 's') stampOn('save', SAVE_STAMP_SECONDS);
      return;
    }

    if (['c', 'x', 'a'].includes(key) && !isEditable(e.target)) {
      e.preventDefault();
      return;
    }

    if (e.shiftKey && ['i', 'j', 'c'].includes(key)) {
      e.preventDefault();
      warn('Outils de développement désactivés.');
    }
  }, true);

  /* Sous Windows, Impr. écran n'émet parfois que le keyup : on écrase le
     presse-papiers une seconde fois, après que le système l'a rempli. */
  document.addEventListener('keyup', (e) => {
    if ((e.key || '').toLowerCase() === 'printscreen') {
      captureBlocked('Une capture d’écran a été détectée. Le contenu a été masqué et le presse-papiers effacé.');
      setTimeout(scrubClipboard, 250);
    }
  }, true);

  /* — voile à la perte de focus — */

  // Attention : donner le focus à l'iframe d'aperçu déclenche « blur » sur
  // la fenêtre parente. document.hasFocus() reste vrai dans ce cas, ce qui
  // évite de voiler l'écran à chaque clic dans l'aperçu.
  window.addEventListener('blur', () => {
    setTimeout(() => { if (!document.hasFocus()) veilFocus(true); }, 120);
  });
  window.addEventListener('focus', () => veilFocus(false));

  document.addEventListener('visibilitychange', () => {
    veilFocus(document.visibilityState !== 'visible');
  });

  blockDisplayCapture();
}

/* ------------------------------------------------- raccourcis de capture */

/**
 * Les combinaisons qui déclenchent une capture sur les systèmes courants.
 * Windows n'en laisse pas passer toutes — Win+Maj+S est traitée avant la
 * page — mais celles-là provoquent une perte de focus, donc le voile.
 */
function isCaptureShortcut(e, key) {
  if (key === 'printscreen') return true;                       // Windows, Linux
  if (e.metaKey && e.shiftKey && ['3', '4', '5', '6'].includes(key)) return true;  // macOS
  if (e.metaKey && e.shiftKey && key === 's') return true;       // Windows : outil Capture
  if (e.ctrlKey && e.shiftKey && key === 's') return true;       // Linux : plusieurs outils
  // Rien de plus : le voile ne se referme qu'à la main, un faux positif
  // coûterait donc un clic à chaque fois. Les raccourcis douteux — Cmd+Maj+P
  // et consorts, qui servent surtout aux palettes de commandes — sont
  // volontairement laissés de côté.
  return false;
}

/* --------------------------------------------- partage d'écran demandé par la page */

/**
 * Neutralise la capture d'écran lancée depuis la page elle-même. Cela ne
 * concerne pas les outils du système, qui ne passent pas par là : c'est
 * une porte de moins, pas une protection à soi seule.
 */
function blockDisplayCapture() {
  const media = navigator.mediaDevices;
  if (!media) return;

  const refuse = (message) => {
    captureBlocked(message);
    return Promise.reject(new DOMException('Partage d’écran désactivé sur DESIGN CV.', 'NotAllowedError'));
  };

  if (typeof media.getDisplayMedia === 'function') {
    media.getDisplayMedia = () => refuse('Le partage d’écran est désactivé sur cette application.');
  }

  // getUserMedia sait lui aussi filmer un écran sur certaines plateformes.
  const original = media.getUserMedia?.bind(media);
  if (original) {
    media.getUserMedia = (constraints = {}) => {
      const video = constraints.video;
      const surface = video && typeof video === 'object'
        && (video.mandatory?.chromeMediaSource || video.displaySurface);
      return surface
        ? refuse('La capture d’écran est désactivée sur cette application.')
        : original(constraints);
    };
  }
}

/** Remplace le contenu du presse-papiers par un avertissement. */
function scrubClipboard() {
  try { navigator.clipboard?.writeText(NOTICE).catch(() => {}); } catch { /* permission refusée */ }
}
