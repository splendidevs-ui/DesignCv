/* =====================================================================
   Fabrication du document HTML autonome d'un CV (aperçu, miniature, impression).
   ===================================================================== */

import { DENSITIES, getTemplate } from './templates.js';

export const PAGE_W = 794;   // A4 à 96 ppp
export const PAGE_H = 1123;
export const PAGE_MARGIN = 45;   // 12 mm : marge haute et basse des pages 2 et suivantes

/**
 * Où tombent les coupures de page dans le flux continu de l'aperçu.
 * La première page est pleine hauteur, les suivantes perdent deux marges.
 */
export function paginate(contentHeight) {
  const rest = PAGE_H - 2 * PAGE_MARGIN;
  const breaks = [];
  let y = PAGE_H;
  while (contentHeight > y + 2 && breaks.length < 40) { breaks.push(y); y += rest; }
  return { pages: breaks.length + 1, breaks, height: y };
}

const FONTS_URL = 'https://fonts.googleapis.com/css2'
  + '?family=Inter:wght@300;400;500;600;700;800'
  + '&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700'
  + '&family=JetBrains+Mono:wght@400;600&display=swap';

const FONT_PAIRS = {
  sans: { title: 'var(--font-sans)', body: 'var(--font-sans)' },
  serif: { title: 'var(--font-serif)', body: 'var(--font-serif)' },
  mixte: { title: 'var(--font-serif)', body: 'var(--font-sans)' },
};

/* --------------------------------------------------------------- socle CSS */

const BASE_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

body {
  font-family: var(--font-body);
  font-size: var(--fs);
  line-height: 1.5;
  color: var(--ink);
  background: #fff;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

h1, h2, h3, h4 { font-family: var(--font-title); line-height: 1.2; font-weight: 700; }
a { color: inherit; text-decoration: none; }
ul { list-style: none; }

.page {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  background: transparent;
  position: relative;
}

/* --- rubriques --- */
.sec { margin-top: 19px; }
.sec:first-child, .sec:first-of-type { margin-top: 0; }
.sec__title {
  font-size: .86em; font-weight: 700; letter-spacing: .12em;
  text-transform: uppercase; color: var(--accent); margin-bottom: 9px;
  break-after: avoid;
}

/* Pastille de titre : neutre par défaut, chaque modèle lui donne sa forme.
   Les modèles qui n'en demandent pas n'en émettent jamais le balisage. */
.sec__ico { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* --- accroche --- */
.lead { color: var(--ink-2); line-height: 1.6; text-align: justify; hyphens: auto; }

/* --- entrées (expérience, formation, projet) --- */
.entry { display: grid; grid-template-columns: 124px 1fr; gap: 0 16px; margin-bottom: 15px; break-inside: avoid; }
.entry:last-child { margin-bottom: 0; }
.entry__period { font-size: .85em; color: var(--muted); font-weight: 600; display: block; }
.entry__dur { font-size: .78em; color: var(--muted-2); display: block; margin-top: 1px; }
.entry__title { font-size: 1.05em; font-weight: 700; color: var(--ink); }
.entry__org { font-size: .93em; color: var(--muted); margin-top: 1px; }
.entry__note { font-size: .88em; color: var(--muted-2); margin-top: 2px; font-style: italic; }

.bullets { margin-top: 6px; padding-left: 14px; list-style: disc; }
.bullets li { margin-bottom: 3px; padding-left: 2px; break-inside: avoid; }
.bullets li::marker { color: var(--accent); font-size: .9em; }
.bullets--tight { margin-top: 5px; }

.dot { display: inline-block; margin: 0 6px; opacity: .45; }

/* --- étiquettes --- */
.chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 7px; }
.chip {
  font-size: .78em; line-height: 1.5; padding: 1px 8px; border-radius: 99px;
  background: var(--accent-wash); color: var(--accent-deep); white-space: nowrap;
}

/* --- coordonnées --- */
.contact { display: grid; gap: 6px; }
.contact__item { display: flex; align-items: flex-start; gap: 8px; font-size: .88em; color: var(--muted); line-height: 1.4; }
.contact__item .ico { flex-shrink: 0; margin-top: 2px; opacity: .85; }

.contact-inline { display: flex; flex-wrap: wrap; gap: 4px 15px; font-size: .86em; color: var(--muted); }
.contact-inline__item { display: inline-flex; align-items: center; gap: 5px; }
.contact-inline__item .ico { opacity: .7; }

/* --- compétences --- */
.grp { margin-bottom: 11px; }
.grp:last-child { margin-bottom: 0; }
.grp__title {
  font-size: .8em; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
  color: var(--muted-2); margin-bottom: 5px;
}
.skill__name { font-size: .95em; color: var(--ink-2); }

.skills--bars .skill { display: grid; gap: 5px; margin-bottom: 8px; }
.skills--dots .skill, .skills--list .skill {
  display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 4px;
}
.skill__lvl { font-size: .82em; color: var(--muted-2); white-space: nowrap; }

.bar { display: block; width: 100%; height: 4px; border-radius: 99px; background: var(--track); overflow: hidden; }
.bar__fill { display: block; height: 100%; border-radius: 99px; background: var(--accent); }

.dots { display: inline-flex; gap: 3px; flex-shrink: 0; }
.dot-i { width: 7px; height: 7px; border-radius: 50%; background: var(--track); }
.dot-i.is-on { background: var(--accent); }

/* --- langues --- */
.langs { display: grid; gap: 11px; }
.langs--list { gap: 5px; }
.lang { display: grid; gap: 5px; }
.langs--list .lang { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.lang__name { font-size: .95em; color: var(--ink-2); font-weight: 500; line-height: 1.35; }
.lang__lvl { font-size: .82em; color: var(--muted-2); white-space: nowrap; }
.lang__note { font-size: .78em; color: var(--muted-2); font-style: italic; flex-basis: 100%; }

/* --- certifications --- */
.certs { display: grid; gap: 7px; }
.cert { display: grid; gap: 1px; break-inside: avoid; }
.cert__name { font-size: .96em; font-weight: 600; color: var(--ink); }
.cert__meta { font-size: .85em; color: var(--muted); }
.cert__link { font-size: .8em; color: var(--accent); }

/* --- références --- */
.refs { display: grid; gap: 8px; }
.ref { display: grid; gap: 1px; break-inside: avoid; }
.ref__name { font-weight: 600; font-size: .96em; }
.ref__role { font-size: .86em; color: var(--muted); }
.ref__contact { font-size: .84em; color: var(--muted-2); }

.inline-list { font-size: .93em; color: var(--muted); }

/* --- impression ---
   Aucune marge @page : la mise en pages est faite en amont par __cvLayout(),
   qui insère des cales dans le flux. L'impression se contente donc de couper
   toutes les 297 mm — exactement là où l'aperçu affiche ses repères. */
@page { size: A4; margin: 0; }

/* Cales insérées par __cvLayout() pour repousser un bloc à la page suivante.
   La seconde force la coupure à l'impression : sans cela le moteur écarte
   les blocs vides tombant sur une coupure, et le bloc remonte d'une page. */
.cv-gap { display: block; width: 100%; }
@media print { .cv-gap--break { break-before: page; } }

@media print {
  html, body { width: 210mm; }
  .page { min-height: auto; }
  /* Filet de sécurité : si une mesure dérive d'un pixel, on préfère déplacer
     le bloc entier plutôt que de le trancher en deux. */
  .entry, .cert, .ref, .grp { break-inside: avoid; }
  .langs, .certs, .refs, .contact, .chips, .duo, .two-col { break-inside: avoid; }
}
`;

/* ------------------------------------------------------------- assemblage */

/** Construit le document HTML complet d'un CV. */
/* ------------------------------------------------------- aperçu protégé */

/**
 * Verrouillage appliqué au document du CV à l'écran.
 *
 * L'iframe a son propre document : ni la feuille de style de
 * l'application ni ses écouteurs ne l'atteignent. Sans ces règles, le
 * texte du CV resterait sélectionnable et copiable dans l'aperçu alors
 * que le reste de la page ne l'est pas.
 *
 * Le document destiné à l'impression, lui, n'en reçoit rien : le PDF que
 * l'on a payé doit sortir net et son texte rester sélectionnable.
 */
const PROTECT_CSS = `
/* --- aperçu protégé --- */
body { position: relative; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
img { -webkit-user-drag: none; }
`;

/* ------------------------------------------------------------- filigrane */

/* La marque est fixe et neutre : elle dit d'où vient le document, elle ne
   désigne personne. */
const WATERMARK_TEXT = 'DESIGN CV';

/**
 * Tuile du filigrane : deux mentions inclinées, décalées en quinconce pour
 * que la répétition ne dessine pas de lignes. Le halo clair derrière les
 * lettres (paint-order) la garde lisible sur le papier blanc comme sur une
 * bande latérale sombre.
 *
 * Le motif voyage dans une URL de données : aucune requête réseau, donc
 * rien à bloquer pour s'en débarrasser.
 */
function watermarkTile() {
  // Le réglage tient dans ces trois nombres : l'opacité du remplissage, la
  // taille des lettres et celle de la tuile — plus la tuile est grande,
  // plus la marque est espacée. Le parti pris est la discrétion : la
  // marque doit se voir sur une capture sans gêner la lecture du CV.
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="380" height="215">'
    + '<g transform="rotate(-27 190 107)" fill="rgba(23, 26, 43, .085)"'
    // Le halo clair est ce qui porte la marque sur une bande latérale
    // sombre, où le remplissage foncé ne se voit pas. Le monter n'alourdit
    // rien sur le papier blanc, où c'est le remplissage qui parle.
    + ' stroke="rgba(255, 255, 255, .28)" stroke-width="2.5" paint-order="stroke"'
    + ' text-anchor="middle" font-family="Inter, Arial, sans-serif"'
    + ' font-size="24" font-weight="700" letter-spacing="1.5">'
    + `<text x="95" y="70">${WATERMARK_TEXT}</text>`
    + `<text x="285" y="168">${WATERMARK_TEXT}</text></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/* Le calque couvre toute la hauteur du document, pages suivantes comprises. */
const WATERMARK_CSS = `
/* --- filigrane de l'aperçu --- */
.wm {
  position: absolute; inset: 0; z-index: 60; pointer-events: none;
  background-image: ${watermarkTile()};
  background-repeat: repeat;
}
`;

/**
 * Construit le document autonome du CV.
 *
 * `protect` : verrouille la sélection et le glissement des images dans le
 * document produit. Vrai pour tout ce qui s'affiche à l'écran — aperçu de
 * l'éditeur, miniatures — et faux pour l'impression, où le PDF doit sortir
 * net et sélectionnable.
 *
 * `watermark` : appose la marque en diagonale. Demandé pour l'aperçu d'un CV
 * non réglé — c'est ce qui empêche qu'une capture de l'écran tienne lieu du
 * livrable payant. Le document d'impression n'en reçoit jamais.
 *
 * `autoLayout` : déclenche la mise en pages au chargement. Dans l'application,
 * c'est l'appelant qui invoque `__cvLayout()` au bon moment ; le serveur, lui,
 * confie le document à un navigateur qu'il ne pilote pas — il faut donc que la
 * page se cale toute seule avant l'impression.
 */
export function renderDocument(cv, { protect = true, watermark = false, autoLayout = false } = {}) {
  const tpl = getTemplate(cv.template);
  const theme = cv.theme || {};
  const accent = theme.accent || tpl.accent;
  const pair = FONT_PAIRS[theme.font || tpl.font] || FONT_PAIRS.sans;
  const scale = DENSITIES.find((d) => d.id === (theme.density || 'normal'))?.scale ?? 1;

  const vars = `
    :root {
      --font-sans: "Inter", -apple-system, "Helvetica Neue", Arial, sans-serif;
      --font-serif: "Source Serif 4", Georgia, "Times New Roman", serif;
      --font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
      --font-title: ${pair.title};
      --font-body: ${pair.body};
      --fs: ${(13.4 * scale).toFixed(2)}px;
      /* hauteur d'une bande latérale : une page, pas une ligne de plus */
      --band-h: 1122px;
      --head-h: 208px;

      --accent: ${accent};
      --accent-deep: color-mix(in srgb, ${accent} 82%, #000);
      --accent-light: color-mix(in srgb, ${accent} 55%, #fff);
      --accent-soft: color-mix(in srgb, ${accent} 26%, #fff);
      --accent-wash: color-mix(in srgb, ${accent} 9%, #fff);

      --ink: #16181d;
      --ink-2: #33363f;
      --muted: #5b6070;
      --muted-2: #858a99;
      --line: #dfe2ea;
      --track: color-mix(in srgb, ${accent} 16%, #e9ebf1);

      --side-bg: color-mix(in srgb, ${accent} 88%, #05070d);
      --side-ink: rgba(255, 255, 255, .88);
      --dark: color-mix(in srgb, ${accent} 14%, #14161c);
    }`;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${escapeAttr(cv.title || 'CV')}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS_URL}">
<style>${vars}${BASE_CSS}${tpl.css}${protect ? PROTECT_CSS : ''}${watermark ? WATERMARK_CSS : ''}</style>
</head>
<body class="tpl-${tpl.id}">
<div class="page">${tpl.layout(cv.data || {})}</div>
${watermark ? '<div class="wm" aria-hidden="true"></div>' : ''}
<script>
/* =====================================================================
   Mise en pages : insère des cales pour qu'aucun bloc ne chevauche une
   coupure, et pour que le texte garde une marge en haut et en bas de
   chaque page. L'aperçu affiche ce résultat, l'impression le découpe
   au même endroit : les deux sont identiques par construction.
   ===================================================================== */
window.__cvLayout = function () {
  var STEP = 1122.5;   // hauteur d'une page A4 à 96 ppp
  var GAP = 45;        // 12 mm de respiration en haut et en bas
  var USABLE = STEP - 2 * GAP;      // hauteur de texte utile sur une page
  var HOLE_FLAT = USABLE * 0.25;    // blanc toléré sur une rubrique ordinaire
  var HOLE_CARD = USABLE / 3;       // idem sur une rubrique encadrée, plus tolérant

  var stale = document.querySelectorAll('.cv-gap');
  for (var i = 0; i < stale.length; i++) stale[i].parentNode.removeChild(stale[i]);

  var scroll = window.scrollY || 0;
  var top = function (el) { return el.getBoundingClientRect().top + scroll; };
  var bottom = function (el) { return el.getBoundingClientRect().bottom + scroll; };

  function mkGap(h, forceBreak) {
    var g = document.createElement('div');
    g.className = 'cv-gap' + (forceBreak ? ' cv-gap--break' : '');
    g.style.height = h + 'px';
    return g;
  }

  /* Repousse un bloc au début de la page suivante s'il déborde de la sienne.
     Deux cales : la première comble la fin de la page courante, la seconde
     porte la coupure et la marge haute de la page suivante. */
  function fit(y0, y1, before, parent) {
    var page = Math.floor(y0 / STEP);
    if (y1 <= (page + 1) * STEP - GAP) return;
    var toEnd = (page + 1) * STEP - y0 - 2;   // 2 px de garde sous la coupure
    if (toEnd > 0) parent.insertBefore(mkGap(toEnd, false), before);
    parent.insertBefore(mkGap(GAP, true), before);
  }

  function children(el) {
    var out = [];
    for (var i = 0; i < el.children.length; i++) {
      if (!el.children[i].classList.contains('cv-gap')) out.push(el.children[i]);
    }
    return out;
  }

  /* Une rubrique qui déborde a deux issues : la déplacer entière sur la page
     suivante, ou la couper entre deux entrées.

     Déplacer évite la coupure mais laisse un blanc en bas de page ; couper
     remplit la page mais fend la rubrique. On tranche sur la taille du blanc :
     en dessous d'un quart de page il passe inaperçu, au-delà il se voit et on
     préfère couper. La coupure reste propre — jamais un titre seul en bas de
     page, jamais au milieu d'une entrée : le titre part toujours avec au moins
     sa première entrée, et une entrée au moins reste pour la page suivante. */
  /* Une rubrique dessinée comme une carte — fond propre ou cadre complet —
     coûte plus cher à couper qu'une rubrique ordinaire : on exige donc un
     blanc plus grand avant de s'y résoudre. Pas d'interdiction pour autant,
     sans quoi un pavé de blanc s'installerait dès qu'une carte ne tient plus.

     Un simple filet de séparation (le border-top qui souligne un titre) n'est
     pas une carte : le confondre avec une carte rendrait la moitié des
     modèles quasi incoupables. D'où l'exigence des quatre côtés. */
  function boxed(el) {
    var st = getComputedStyle(el);
    if (st.backgroundImage !== 'none') return true;
    if (st.backgroundColor && st.backgroundColor !== 'rgba(0, 0, 0, 0)'
      && st.backgroundColor !== 'transparent') return true;
    return parseFloat(st.borderTopWidth) > 0 && parseFloat(st.borderBottomWidth) > 0
      && parseFloat(st.borderLeftWidth) > 0 && parseFloat(st.borderRightWidth) > 0;
  }

  function place(container) {
    var blocks = children(container);
    for (var b = 0; b < blocks.length; b++) {
      var el = blocks[b];
      var y0 = top(el), y1 = bottom(el);
      var limit = (Math.floor(y0 / STEP) + 1) * STEP - GAP;   // bas utile de sa page

      if (y1 <= limit) continue;   // la rubrique tient : rien à faire

      var body = el.querySelector('.sec__body');
      var items = body ? children(body) : [];
      if (!items.length) { fit(y0, y1, el, container); continue; }

      // Coupure possible seulement si le titre et la première entrée tiennent
      // encore sur la page courante, et qu'il reste au moins une entrée pour
      // la page suivante.
      var clean = items.length > 1 && bottom(items[0]) <= limit;
      // Plus haute qu'une page entière : la déplacer ne servirait à rien.
      var tall = (y1 - y0) > USABLE;
      var maxHole = boxed(el) ? HOLE_CARD : HOLE_FLAT;

      if (!tall && !(clean && limit - y0 > maxHole)) {
        fit(y0, y1, el, container);   // on déplace la rubrique entière
        continue;
      }

      for (var k = 0; k < items.length; k++) {
        if (k === 0) fit(top(el), bottom(items[0]), el, container);
        else fit(top(items[k]), bottom(items[k]), items[k], body);
      }
    }
  }

  var flow = document.querySelector('.main, .col-main, .page-body');
  if (flow) place(flow);

  /* Colonne latérale : uniquement quand c'est un bloc ordinaire — les
     colonnes en flex répartissent leur hauteur et n'admettent pas de cale. */
  var side = document.querySelector('.col-side, .side');
  if (side && getComputedStyle(side).display === 'block') place(side);

  /* Bas réel de l'encre : le rembourrage final ne doit pas créer une page
     de plus, l'impression n'en crée pas pour du vide. */
  function inkBottom() {
    var max = STEP, els = document.querySelectorAll('.page *');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.classList.contains('cv-gap')) continue;
      var painted = el.tagName === 'IMG';
      if (!painted) {
        for (var n = 0; n < el.childNodes.length; n++) {
          var c = el.childNodes[n];
          if (c.nodeType === 3 && c.textContent.trim()) { painted = true; break; }
        }
      }
      if (!painted) {
        var st = getComputedStyle(el);
        painted = (st.backgroundColor && st.backgroundColor !== 'rgba(0, 0, 0, 0)')
          || st.backgroundImage !== 'none'
          || parseFloat(st.borderTopWidth) > 0 || parseFloat(st.borderBottomWidth) > 0;
      }
      if (!painted) continue;
      var b = el.getBoundingClientRect().bottom + scroll;
      if (b > max) max = b;
    }
    return max;
  }

  var height = inkBottom();
  var pages = Math.max(1, Math.ceil(height / STEP - 0.02));
  var breaks = [];
  for (var pg = 1; pg < pages; pg++) breaks.push(Math.round(pg * STEP));
  return { pages: pages, breaks: breaks, height: pages * STEP };
};
${autoLayout ? `
/* Le calage attend les polices : mesurer avant leur chargement donnerait
   une pagination faite sur les métriques de secours, et le PDF n'aurait
   pas le même nombre de pages que l'aperçu. */
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve())
  .then(function () { try { window.__cvLayout(); } catch (e) {} });
` : ''}
<\/script>
</body>
</html>`;
}

const escapeAttr = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ------------------------------------------------------------- aperçu live */

/**
 * Injecte un CV dans une iframe et ajuste sa hauteur au contenu.
 * Renvoie { pages, breaks, height } : la pagination estimée.
 */
export function paintFrame(frame, cv, opts = {}) {
  return new Promise((resolve) => {
    let tries = 0;

    const attempt = () => {
      // Une iframe hors du document n'a pas encore de contentDocument :
      // on attend son insertion avant d'écrire dedans.
      const doc = frame.isConnected ? frame.contentDocument : null;
      if (!doc) {
        if (tries++ > 240) { resolve({ pages: 1, breaks: [], height: PAGE_H }); return; }
        requestAnimationFrame(attempt);
        return;
      }

      doc.open();
      doc.write(renderDocument(cv, opts));
      doc.close();

      // L'iframe a son propre document : les protections de l'application ne
      // l'atteignent pas. On les rebranche ici (même origine, donc permis).
      doc.addEventListener('contextmenu', (e) => e.preventDefault());
      doc.addEventListener('dragstart', (e) => e.preventDefault());

      const settle = () => {
        const layout = doc.defaultView?.__cvLayout?.()
          ?? paginate(Math.max(doc.body.scrollHeight, PAGE_H));
        frame.style.height = `${Math.max(doc.body.scrollHeight, layout.height)}px`;
        resolve(layout);
      };

      if (doc.fonts?.ready) doc.fonts.ready.then(() => requestAnimationFrame(settle)).catch(settle);
      else requestAnimationFrame(settle);
    };

    attempt();
  });
}

/* ------------------------------------------------------------ téléchargement */

/**
 * Télécharge le PDF du CV.
 *
 * Le fichier est fabriqué par le serveur : aucune interface du navigateur
 * ne produit un PDF sans montrer la boîte d'impression. On passe par
 * `fetch` plutôt que par un lien direct pour pouvoir présenter une erreur
 * — commande non réglée, navigateur absent du serveur — au lieu de laisser
 * l'utilisateur devant une page de JSON.
 */
export async function downloadPdf(cv) {
  let res;
  try {
    res = await fetch(`/api/cvs/${cv.id}/pdf`, { credentials: 'same-origin' });
  } catch {
    throw new Error('Serveur injoignable. Vérifiez que l’application est bien démarrée.');
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    const err = new Error(payload.error || `Erreur ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filenameOf(res.headers.get('Content-Disposition')) || fallbackName(cv.title);
  link.style.display = 'none';

  document.body.append(link);
  link.click();
  link.remove();

  // Révoquer tout de suite couperait le téléchargement dans certains
  // navigateurs : on laisse le temps au transfert de démarrer.
  setTimeout(() => URL.revokeObjectURL(url), 20000);
}

/** Le nom de fichier annoncé par le serveur, `filename*` d'abord. */
function filenameOf(disposition) {
  if (!disposition) return '';
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8) { try { return decodeURIComponent(utf8[1]); } catch { /* en-tête douteux */ } }
  return /filename="([^"]+)"/i.exec(disposition)?.[1] || '';
}

const fallbackName = (title) => `${String(title || 'CV').replace(/[^\w \-]+/g, ' ').trim() || 'CV'}.pdf`;
