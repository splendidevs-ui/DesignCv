/* =====================================================================
   Point d'entrée : session, routage et barre de navigation.
   ===================================================================== */

import { api } from './lib/api.js';
import { h, initials, mount } from './lib/dom.js';
import { authView } from './views/auth.js';
import { dashboardView } from './views/dashboard.js';
import { galleryView } from './views/gallery.js';
import { editorView } from './views/editor.js';
import { adminView } from './views/admin.js';
import { setCatalog } from './cv/templates.js';
import { installGuard } from './lib/guard.js';

const app = document.getElementById('app');

let user = null;
let currentNode = null;

/* ------------------------------------------------------------------ routes */

const ROUTES = [
  { re: /^\/connexion\/?$/, public: true, view: () => authView({ mode: 'login', onAuth, navigate }) },
  { re: /^\/inscription\/?$/, public: true, view: () => authView({ mode: 'register', onAuth, navigate }) },
  { re: /^\/tableau-de-bord\/?$/, view: () => dashboardView({ navigate, user }) },
  { re: /^\/modeles\/?$/, view: () => galleryView({ navigate }) },
  { re: /^\/cv\/(\d+)\/?$/, view: (m) => editorView({ navigate, id: m[1], user }) },
  { re: /^\/administration\/?$/, admin: true, view: () => adminView({ navigate }) },
];

const isAdmin = () => user?.role === 'admin';

/**
 * Le catalogue des modèles vient du serveur : la galerie, l'éditeur et
 * les miniatures doivent le connaître avant de dessiner quoi que ce soit.
 * En cas d'échec, les mises en page intégrées servent de repli — mieux
 * vaut une galerie non ordonnée qu'une page vide.
 */
export async function loadCatalog() {
  try {
    const { templates } = await api.templates();
    setCatalog(templates);
  } catch { /* repli sur les mises en page intégrées */ }
}

export function navigate(path, { replace = false } = {}) {
  if (path === location.pathname) return;
  history[replace ? 'replaceState' : 'pushState']({}, '', path);
  render();
}

async function onAuth(nextUser) {
  user = nextUser;
  await loadCatalog();
  navigate('/tableau-de-bord', { replace: true });
}

async function logout() {
  try { await api.logout(); } catch { /* la session locale est de toute façon abandonnée */ }
  user = null;
  navigate('/connexion', { replace: true });
}

/* -------------------------------------------------------------- rendu global */

async function render() {
  currentNode?._onLeave?.();
  currentNode = null;

  const path = location.pathname;

  if (path === '/' || path === '') {
    navigate(user ? '/tableau-de-bord' : '/connexion', { replace: true });
    return;
  }

  const match = ROUTES.map((r) => ({ r, m: r.re.exec(path) })).find((x) => x.m);

  if (!match) return mountPage(notFound(), Boolean(user));
  if (!match.r.public && !user) return navigate('/connexion', { replace: true });
  if (match.r.public && user) return navigate('/tableau-de-bord', { replace: true });
  if (match.r.admin && !isAdmin()) return mountPage(notFound(), true);

  mount(app, match.r.public ? null : appbar(), loading());

  try {
    const node = await match.r.view(match.m);
    currentNode = node;
    mountPage(node, !match.r.public);
  } catch (err) {
    if (err.status === 401) { user = null; return navigate('/connexion', { replace: true }); }
    mountPage(errorPage(err.message), Boolean(user));
  }
}

function mountPage(node, withBar = true) {
  mount(app, withBar ? appbar() : null, node);
  document.title = `${pageTitle()} — DESIGN CV`;
}

const pageTitle = () => ({
  '/connexion': 'Connexion',
  '/inscription': 'Créer un compte',
  '/tableau-de-bord': 'Mes CV',
  '/modeles': 'Choisir un modèle',
  '/administration': 'Administration',
}[location.pathname] || (location.pathname.startsWith('/cv/') ? 'Éditeur' : 'Page introuvable'));

/* --------------------------------------------------------------- fragments */

function appbar() {
  const link = (href, label, cls = 'btn btn--ghost btn--sm') => h('a', {
    href, class: cls,
    onclick: (e) => { e.preventDefault(); navigate(href); },
  }, label);

  const panel = h('div.menu__panel.hidden',
    h('div', { style: { padding: '8px 11px 10px' } },
      h('div.strong', user?.fullName || ''),
      h('div.tiny.dim', user?.email || ''),
    ),
    h('div.menu__sep'),
    h('a.menu__item', {
      href: '/tableau-de-bord',
      onclick: (e) => { e.preventDefault(); close(); navigate('/tableau-de-bord'); },
    }, '📄 Mes CV'),
    h('a.menu__item', {
      href: '/modeles',
      onclick: (e) => { e.preventDefault(); close(); navigate('/modeles'); },
    }, '✨ Nouveau CV'),
    isAdmin() ? h('div.menu__sep') : null,
    isAdmin() ? h('a.menu__item', {
      href: '/administration',
      onclick: (e) => { e.preventDefault(); close(); navigate('/administration'); },
    }, '⚙ Administration') : null,
    h('div.menu__sep'),
    h('button.menu__item', { type: 'button', onclick: () => { close(); logout(); } }, '⇥ Se déconnecter'),
  );

  const close = () => {
    panel.classList.add('hidden');
    document.removeEventListener('click', onOutside, true);
  };
  const onOutside = (e) => { if (!panel.parentElement.contains(e.target)) close(); };

  const trigger = h('button.btn.btn--ghost', {
    type: 'button', 'aria-haspopup': 'menu',
    onclick: (e) => {
      e.stopPropagation();
      const opening = panel.classList.contains('hidden');
      panel.classList.toggle('hidden', !opening);
      if (opening) setTimeout(() => document.addEventListener('click', onOutside, true), 0);
      else close();
    },
  },
    h('span.avatar', initials(user?.fullName)),
    h('span.small.hide-sm', user?.fullName?.split(' ')[0] || ''),
  );

  return h('header.appbar',
    h('div.appbar__inner',
      h('a.logo', {
        href: '/tableau-de-bord',
        onclick: (e) => { e.preventDefault(); navigate('/tableau-de-bord'); },
      }, h('span.logo__mark', 'DC'), 'DESIGN CV'),
      h('div.grow'),
      link('/modeles', '＋ Nouveau CV', 'btn btn--soft btn--sm'),
      h('div.menu', trigger, panel),
    ),
  );
}

const loading = () => h('div.boot', h('div.boot__spinner'), h('p', 'Chargement…'));

const notFound = () => h('div.page', h('div.container.container--narrow',
  h('div.empty',
    h('div.empty__icon', '🧭'),
    h('h2', { style: { color: 'var(--ink)' } }, 'Page introuvable'),
    h('p', 'Le lien que vous avez suivi ne correspond à aucune page.'),
    h('button.btn.btn--primary', {
      type: 'button', onclick: () => navigate(user ? '/tableau-de-bord' : '/connexion'),
    }, 'Revenir à l’accueil'),
  ),
));

const errorPage = (message) => h('div.page', h('div.container.container--narrow',
  h('div.empty',
    h('div.empty__icon', '⚠️'),
    h('h2', { style: { color: 'var(--ink)' } }, 'Une erreur est survenue'),
    h('p', message),
    h('button.btn', { type: 'button', onclick: () => render() }, 'Réessayer'),
  ),
));

/* ------------------------------------------------------------------ démarrage */

window.addEventListener('popstate', render);

(async function boot() {
  installGuard();
  try {
    ({ user } = await api.me());
  } catch (err) {
    mount(app, errorPage(err.message));
    return;
  }
  if (user) await loadCatalog();
  render();
})();
