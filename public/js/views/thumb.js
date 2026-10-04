/* Miniature d'un CV : rendu réel dans une iframe, mise à l'échelle du conteneur. */

import { h } from '../lib/dom.js';
import { PAGE_W, paintFrame } from '../cv/render.js';

/**
 * Insère une miniature vivante dans `host` (qui doit être positionné).
 * Le premier rendu attend que l'hôte ait une largeur, donc qu'il soit
 * réellement dans la page.
 */
export function attachThumb(host, cv, { veil = true } = {}) {
  const frame = h('iframe', { tabindex: '-1', 'aria-hidden': 'true', title: '' });
  const inner = h('div.thumb__inner', frame);
  const box = h('div.thumb', inner, veil ? h('div.thumb__veil') : null);
  host.append(box);

  let model = cv;
  let painted = false;

  const fit = () => {
    const width = host.clientWidth;
    if (width) inner.style.transform = `scale(${width / PAGE_W})`;
  };

  const paint = () => { paintFrame(frame, model).then(fit); };

  const observer = new ResizeObserver(() => {
    if (!host.clientWidth) return;
    fit();
    if (!painted) { painted = true; paint(); }
  });
  observer.observe(host);

  return {
    refresh(next) {
      model = next ?? model;
      if (painted) paint();
    },
    destroy() { observer.disconnect(); box.remove(); },
  };
}
