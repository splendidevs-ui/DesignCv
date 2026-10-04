/* Écrans de connexion et de création de compte. */

import { h, mount, toast } from '../lib/dom.js';
import { api } from '../lib/api.js';

const ARGUMENTS = [
  ['17 modèles professionnels', 'Changez de design à tout moment, vos données sont conservées.'],
  ['Un formulaire guidé', 'Dix rubriques, une étape à la fois, avec sauvegarde automatique.'],
  ['Aperçu en direct', 'Votre CV se met à jour pendant que vous écrivez.'],
  ['Export PDF prêt à envoyer', 'Paiement unique par carte ou mobile money, téléchargements illimités.'],
];

/* =====================================================================
   Banc d'essai — TEMPORAIRE.
   Des boutons qui remplissent les champs avec un compte de test. Le
   serveur décide de la liste : si DEMO_LOGINS=0, elle est vide et rien
   ne s'affiche. À retirer avec server/demo.js le moment venu.
   ===================================================================== */

function demoPanel(fields) {
  const host = h('div.demo-fill.hidden');

  api.demoAccounts().then(({ accounts }) => {
    if (!accounts.length) return;

    host.append(
      h('p.demo-fill__title',
        h('span.demo-fill__tag', 'Test'),
        'Remplir avec un compte de démonstration',
      ),
      h('div.demo-fill__row', accounts.map((a) => h('button.btn.btn--sm.demo-fill__btn', {
        type: 'button',
        title: `${a.email} · ${a.password}`,
        onclick: () => {
          fields.email.value = a.email;
          fields.password.value = a.password;
          // Les champs sont remplis par programme : sans cet événement, un
          // navigateur qui écoute la saisie ne verrait rien changer.
          for (const el of [fields.email, fields.password]) el.dispatchEvent(new Event('input', { bubbles: true }));
          host.querySelectorAll('.demo-fill__btn').forEach((b) => b.classList.remove('is-on'));
          host.querySelector(`[data-email="${a.email}"]`)?.classList.add('is-on');
        },
        dataset: { email: a.email },
      },
        h('span.demo-fill__role', a.role === 'admin' ? '⚙' : '👤'),
        h('span',
          h('span.strong', a.label),
          h('span.demo-fill__mail', a.email),
        ),
      ))),
      h('p.demo-fill__note', 'Comptes de test — à supprimer avant mise en ligne (DEMO_LOGINS=0).'),
    );
    host.classList.remove('hidden');
  }).catch(() => { /* pas de banc d'essai : la page reste normale */ });

  return host;
}

export function authView({ mode = 'login', onAuth, navigate }) {
  const root = h('div.auth');

  const aside = h('aside.auth__aside',
    h('div',
      h('div.logo', { style: { color: '#fff', marginBottom: '46px' } },
        h('span.logo__mark', { style: { background: 'rgba(255,255,255,.2)' } }, 'DC'),
        'DESIGN CV',
      ),
      h('h2', 'Votre CV professionnel, prêt en quelques minutes.'),
      h('p', 'Choisissez un modèle, remplissez le formulaire rubrique par rubrique, exportez en PDF.'),
      h('ul.auth__points', ARGUMENTS.map(([title, desc]) =>
        h('li', h('span.auth__check', '✓'), h('div', h('b', title), h('span', desc))))),
    ),
    h('p', { style: { fontSize: '13px', opacity: '.6' } },
      'Vos données restent sur votre machine — l’application s’exécute en local.'),
  );

  const main = h('main.auth__main');
  mount(root, aside, main);

  const paint = (current) => {
    const isLogin = current === 'login';
    const alert = h('div.alert.hidden');
    const submit = h('button.btn.btn--primary.btn--lg.btn--block', { type: 'submit' },
      isLogin ? 'Se connecter' : 'Créer mon compte');

    const fields = {
      fullName: h('input.input', { type: 'text', id: 'fullName', placeholder: 'Ibrahim Fofana', autocomplete: 'name', required: true }),
      email: h('input.input', { type: 'email', id: 'email', placeholder: 'vous@email.com', autocomplete: 'email', required: true }),
      password: h('input.input', {
        type: 'password', id: 'password', placeholder: '••••••••',
        autocomplete: isLogin ? 'current-password' : 'new-password', required: true, minLength: 8,
      }),
    };

    const form = h('form.auth__form', {
      novalidate: true,
      onsubmit: async (e) => {
        e.preventDefault();
        alert.classList.add('hidden');

        const payload = {
          email: fields.email.value.trim(),
          password: fields.password.value,
          ...(isLogin ? {} : { fullName: fields.fullName.value.trim() }),
        };

        if (!isLogin && !payload.fullName) return fail('Indiquez votre nom complet.');
        if (!payload.email) return fail('Indiquez votre adresse e-mail.');
        if (!isLogin && payload.password.length < 8) return fail('Le mot de passe doit contenir au moins 8 caractères.');

        submit.disabled = true;
        submit.textContent = isLogin ? 'Connexion…' : 'Création…';
        try {
          const { user } = isLogin ? await api.login(payload) : await api.register(payload);
          toast(isLogin ? `Bonjour ${user.fullName.split(' ')[0]} !` : 'Compte créé, bienvenue !', 'ok');
          onAuth(user);
        } catch (err) {
          fail(err.message);
          submit.disabled = false;
          submit.textContent = isLogin ? 'Se connecter' : 'Créer mon compte';
        }
      },
    },
      h('div',
        h('p.eyebrow', isLogin ? 'Content de vous revoir' : 'Bienvenue'),
        h('h1.auth__title', { style: { marginTop: '6px' } },
          isLogin ? 'Connexion à votre espace' : 'Créer votre compte'),
      ),
      alert,
      isLogin ? null : h('div.field',
        h('label.field__label', { for: 'fullName' }, 'Nom complet'),
        fields.fullName,
      ),
      h('div.field',
        h('label.field__label', { for: 'email' }, 'Adresse e-mail'),
        fields.email,
      ),
      h('div.field',
        h('label.field__label', { for: 'password' }, 'Mot de passe'),
        fields.password,
        isLogin ? null : h('p.field__help', '8 caractères minimum.'),
      ),
      submit,
      isLogin ? demoPanel(fields) : null,
      h('p.small.muted', { style: { textAlign: 'center' } },
        isLogin ? 'Pas encore de compte ? ' : 'Vous avez déjà un compte ? ',
        h('a', {
          href: isLogin ? '/inscription' : '/connexion',
          onclick: (e) => { e.preventDefault(); navigate(isLogin ? '/inscription' : '/connexion'); },
        }, isLogin ? 'Créer un compte' : 'Se connecter'),
      ),
    );

    const fail = (message) => {
      alert.textContent = message;
      alert.classList.remove('hidden');
    };

    mount(main, form);
    (isLogin ? fields.email : fields.fullName).focus();
  };

  paint(mode);
  return root;
}
