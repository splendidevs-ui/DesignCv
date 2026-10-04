/* Micro-couche DOM : construction d'éléments, notifications, boîtes de dialogue. */

const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_TAGS = new Set(['svg', 'g', 'path', 'rect', 'circle', 'line', 'text', 'defs', 'linearGradient', 'stop', 'polygon', 'ellipse']);

/**
 * h('div.card', { onclick, class: [...], dataset: {...} }, ...enfants)
 * Le sélecteur accepte les raccourcis `tag.classe1.classe2#id`.
 */
export function h(selector, props = null, ...children) {
  const [, tag = 'div', rest = ''] = /^([a-zA-Z0-9]*)(.*)$/.exec(selector);
  const node = SVG_TAGS.has(tag)
    ? document.createElementNS(SVG_NS, tag)
    : document.createElement(tag);

  const classes = [...rest.matchAll(/\.([^.#]+)/g)].map((m) => m[1]);
  const id = /#([^.#]+)/.exec(rest)?.[1];
  if (id) node.id = id;

  if (props && (props.nodeType || Array.isArray(props) || typeof props === 'string')) {
    children.unshift(props);
    props = null;
  }

  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;

    if (key === 'class' || key === 'className') {
      classes.push(...(Array.isArray(value) ? value : [value]).filter(Boolean));
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(node.style, value);
    } else if (key === 'dataset') {
      Object.assign(node.dataset, value);
    } else if (key === 'html') {
      node.innerHTML = value;
    } else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key in node && !SVG_TAGS.has(tag) && key !== 'list') {
      node[key] = value;
    } else {
      node.setAttribute(key, value === true ? '' : value);
    }
  }

  if (classes.length) node.setAttribute('class', classes.join(' '));
  append(node, children);
  return node;
}

function append(node, children) {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) append(node, child);
    else node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
}

export const frag = (...children) => {
  const f = document.createDocumentFragment();
  append(f, children);
  return f;
};

export function clear(node) {
  while (node.firstChild) node.firstChild.remove();
  return node;
}

export function mount(node, ...children) {
  clear(node);
  append(node, children);
  return node;
}

/* -------------------------------------------------------------- notifications */

export function toast(message, kind = '') {
  const host = document.getElementById('toasts');
  const el = h(`div.toast${kind ? `.toast--${kind}` : ''}`, message);
  host.append(el);
  setTimeout(() => {
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 220);
  }, kind === 'err' ? 4600 : 2800);
}

/* ------------------------------------------------------------------- dialogue */

/** Boîte de confirmation. Résout avec true/false. */
export function confirmDialog({ title, message, confirmLabel = 'Confirmer', danger = false }) {
  return new Promise((resolve) => {
    const close = (result) => { backdrop.remove(); document.removeEventListener('keydown', onKey); resolve(result); };
    const onKey = (e) => { if (e.key === 'Escape') close(false); };

    const confirmBtn = h(`button.btn.${danger ? 'btn--danger' : 'btn--primary'}`,
      { type: 'button', onclick: () => close(true) }, confirmLabel);

    const backdrop = h('div.modal-backdrop',
      { onclick: (e) => { if (e.target === backdrop) close(false); } },
      h('div.modal', { role: 'dialog', 'aria-modal': 'true' },
        h('h3.modal__title', title),
        message ? h('p.muted', message) : null,
        h('div.modal__actions',
          h('button.btn', { type: 'button', onclick: () => close(false) }, 'Annuler'),
          confirmBtn,
        ),
      ),
    );

    document.body.append(backdrop);
    document.addEventListener('keydown', onKey);
    confirmBtn.focus();
  });
}

/* ------------------------------------------------------------------ utilitaires */

export function debounce(fn, delay = 400) {
  let timer;
  const wrapped = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
  wrapped.cancel = () => clearTimeout(timer);
  wrapped.flush = (...args) => { clearTimeout(timer); fn(...args); };
  return wrapped;
}

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  return formatDate(iso);
}
