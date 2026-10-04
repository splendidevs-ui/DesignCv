/* =====================================================================
   Choix de la couleur dominante.

   Les deux écrans qui la proposent — la galerie et l'éditeur — montaient
   la même rangée de pastilles chacun de son côté. Elle est ici, avec en
   plus le choix libre : une pastille qui ouvre le sélecteur du système,
   et une pipette pour prélever une couleur à l'écran.
   ===================================================================== */

import { h, debounce } from '../lib/dom.js';
import { holdFocusVeil } from '../lib/guard.js';
import { ACCENTS } from '../cv/templates.js';

/* Le dégradé de la pastille « couleur du modèle », repris pour celle du
   choix libre tant qu'aucune couleur n'a été prélevée. */
const WHEEL = 'conic-gradient(#4f46e5,#0369a1,#047857,#b45309,#9f1239,#7e22ce,#4f46e5)';

const isPreset = (value) => ACCENTS.some((a) => a.value === value);

/** Icône de pipette, dessinée plutôt qu'écrite : aucun emoji n'en offre. */
const dropperIcon = () => h('svg', {
  viewBox: '0 0 24 24', width: '14', height: '14', fill: 'none',
  stroke: 'currentColor', 'stroke-width': '2',
  'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true',
},
  h('path', { d: 'M15 3.5a2.5 2.5 0 0 1 3.5 3.5l-2 2 1.5 1.5-2 2-1.5-1.5-6.8 6.8a2 2 0 0 1-1 .55l-2.9.6.6-2.9a2 2 0 0 1 .55-1L11.75 7.75 10.25 6.25l2-2 1.5 1.5z' }),
);

/**
 * Rangée de pastilles de couleur.
 *
 * `value`  : la couleur courante, ou null pour « celle du modèle ».
 * `onPick` : reçoit la nouvelle valeur, ou null pour revenir au modèle.
 *
 * Le sélecteur du système émet un événement à chaque mouvement de souris :
 * l'aperçu suivrait la pipette au prix d'un redessin par pixel parcouru.
 * On espace donc les répercussions, sans rien perdre à la validation.
 */
export function accentPicker({ value = null, onPick }) {
  let current = value;

  const row = h('div.swatches');

  const mark = (el) => {
    for (const s of row.querySelectorAll('.swatch')) s.classList.toggle('is-on', s === el);
  };

  const choose = (next, el) => {
    current = next;
    mark(el);
    onPick(next);
  };

  /* --- la couleur d'origine du modèle --- */

  const defaultSwatch = h('button.swatch', {
    type: 'button', title: 'Couleur d’origine du modèle',
    'aria-label': 'Couleur d’origine du modèle',
    class: current ? null : 'is-on',
    style: { background: WHEEL },
    onclick: (e) => choose(null, e.currentTarget),
  });

  /* --- la palette proposée --- */

  const presets = ACCENTS.map((a) => h('button.swatch', {
    type: 'button', title: a.label, 'aria-label': a.label,
    style: { background: a.value },
    class: current === a.value ? 'is-on' : null,
    onclick: (e) => choose(a.value, e.currentTarget),
  }));

  /* --- le choix libre --- */

  const custom = current && !isPreset(current) ? current : null;

  const input = h('input.swatch__input', {
    type: 'color',
    value: custom || ACCENTS[0].value,
    'aria-label': 'Choisir une couleur personnalisée',
  });

  const customSwatch = h('label.swatch.swatch--custom', {
    title: 'Couleur personnalisée — ouvre le sélecteur du système',
    class: custom ? 'is-on' : null,
    style: { background: custom || WHEEL },
  }, input, h('span.swatch__plus', { 'aria-hidden': 'true' }, '+'));

  const applyCustom = (hex) => {
    customSwatch.style.background = hex;
    customSwatch.classList.add('has-color');
    choose(hex, customSwatch);
  };

  // `input` pendant que l'on déplace le curseur, `change` à la validation.
  const live = debounce((hex) => applyCustom(hex), 160);
  input.oninput = (e) => live(e.target.value);
  input.onchange = (e) => { live.cancel(); applyCustom(e.target.value); };

  /* Le sélecteur du système est une fenêtre à part : l'ouvrir fait perdre
     le focus à la page, ce que la protection du contenu interprète comme
     une tentative de capture. On lui demande de patienter jusqu'au retour. */
  let release = null;
  const hold = () => {
    if (release) return;
    release = holdFocusVeil();
    const done = () => {
      release?.();
      release = null;
      window.removeEventListener('focus', done);
      clearTimeout(filet);
    };
    // Le retour du focus referme la parenthèse ; le minuteur est le filet,
    // pour le cas où l'événement n'arriverait jamais.
    window.addEventListener('focus', done);
    const filet = setTimeout(done, 180000);
  };

  input.onclick = hold;
  input.onfocus = hold;

  if (custom) customSwatch.classList.add('has-color');

  row.append(defaultSwatch, ...presets, customSwatch);

  /* --- la pipette, quand le navigateur la propose --- */

  if (typeof window.EyeDropper === 'function') {
    row.append(h('button.swatch.swatch--dropper', {
      type: 'button',
      title: 'Prélever une couleur à l’écran',
      'aria-label': 'Prélever une couleur à l’écran',
      onclick: async () => {
        // Le prélèvement prend la main sur tout l'écran : même parenthèse.
        const resume = holdFocusVeil();
        try {
          const { sRGBHex } = await new window.EyeDropper().open();
          input.value = sRGBHex;
          applyCustom(sRGBHex);
        } catch {
          /* prélèvement abandonné : rien à signaler */
        } finally {
          resume();
        }
      },
    }, dropperIcon()));
  }

  return row;
}
