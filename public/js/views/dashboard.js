/* Tableau de bord — la liste des CV de l'utilisateur. */

import { confirmDialog, h, mount, timeAgo, toast } from '../lib/dom.js';
import { api } from '../lib/api.js';
import { completion, normalizeCvData } from '../schema.js';
import { getTemplate } from '../cv/templates.js';
import { downloadPdf } from '../cv/render.js';
import { attachThumb } from './thumb.js';
import { ensurePaid } from './payment.js';

export async function dashboardView({ navigate, user }) {
  const root = h('div.page');
  const body = h('div');

  const newCvBtn = h('a.btn.btn--primary.btn--lg', {
    href: '/modeles',
    onclick: (e) => { e.preventDefault(); navigate('/modeles'); },
  }, '＋ Nouveau CV');

  mount(root, h('div.container',
    h('div.page__head',
      h('div',
        h('h1.page__title', `Bonjour ${user.fullName.split(' ')[0]}`),
        h('p.page__sub', 'Retrouvez vos CV, reprenez-les où vous les avez laissés ou exportez-les en PDF.'),
      ),
      newCvBtn,
    ),
    body,
  ));

  let cvs = [];
  try {
    ({ cvs } = await api.listCvs());
  } catch (err) {
    mount(body, h('div.alert', err.message));
    return root;
  }

  const paint = () => {
    if (!cvs.length) {
      mount(body, h('div.empty',
        h('div.empty__icon', '📄'),
        h('h3', { style: { color: 'var(--ink)' } }, 'Aucun CV pour le moment'),
        h('p', { style: { maxWidth: '420px' } },
          'Créez votre premier CV : choisissez un modèle, puis laissez-vous guider rubrique par rubrique.'),
        h('a.btn.btn--primary', {
          href: '/modeles', style: { marginTop: '6px' },
          onclick: (e) => { e.preventDefault(); navigate('/modeles'); },
        }, 'Créer mon premier CV'),
      ));
      return;
    }

    mount(body, h('div.cv-grid', cvs.map(card)));
  };

  const card = (cv) => {
    const data = normalizeCvData(cv.data);
    const pct = completion(data);
    const tpl = getTemplate(cv.template);
    const open = () => navigate(`/cv/${cv.id}`);

    const thumbHost = h('div.cv-card__thumb', { onclick: open, title: 'Ouvrir ce CV' });

    const node = h('article.cv-card',
      thumbHost,
      h('div.cv-card__body',
        h('div',
          h('div.cv-card__name', { title: cv.title }, cv.title),
          h('p.tiny.dim', `${tpl.name} · modifié ${timeAgo(cv.updatedAt)}`),
          cv.paid
            ? h('span.chip-paid', '✓ PDF débloqué')
            : h('span.chip-lock', '🔒 PDF à débloquer'),
        ),
        h('div',
          h('div.row.between.tiny.dim', { style: { marginBottom: '5px' } },
            h('span', 'Complété'),
            h('span.strong', `${pct} %`),
          ),
          h('div.progress', h('div.progress__bar', { style: { width: `${pct}%` } })),
        ),
        h('div.cv-card__foot',
          h('button.btn.btn--sm.btn--soft', { type: 'button', onclick: open }, 'Ouvrir'),
          h('button.btn.btn--sm', {
            type: 'button', title: 'Exporter en PDF',
            onclick: async (e) => {
              const btn = e.currentTarget;
              const label = btn.textContent;
              btn.disabled = true;
              try {
                // `cv` porte le drapeau `paid` renvoyé par /api/cvs ; s'il
                // manque, ensurePaid interroge le serveur avant d'ouvrir
                // la fenêtre de paiement.
                if (!await ensurePaid(cv)) return;
                paint();
                // Le serveur compose le document : quelques secondes, qu'il
                // faut annoncer plutôt que de laisser le bouton muet.
                btn.textContent = '…';
                await downloadPdf(cv);
                toast('PDF téléchargé.', 'ok');
              } catch (err) {
                toast(err.message, 'err');
              } finally { btn.disabled = false; btn.textContent = label; }
            },
          }, 'PDF'),
          h('div.grow'),
          h('button.btn.btn--sm.btn--icon', {
            type: 'button', title: 'Dupliquer',
            onclick: async (e) => {
              e.currentTarget.disabled = true;
              try {
                const { cv: copy } = await api.duplicateCv(cv.id);
                cvs = [copy, ...cvs];
                paint();
                toast('CV dupliqué.', 'ok');
              } catch (err) { toast(err.message, 'err'); }
            },
          }, '⧉'),
          h('button.btn.btn--sm.btn--icon', {
            type: 'button', title: 'Supprimer',
            onclick: async () => {
              const ok = await confirmDialog({
                title: `Supprimer « ${cv.title} » ?`,
                message: 'Cette action est définitive : le contenu de ce CV sera perdu.',
                confirmLabel: 'Supprimer',
                danger: true,
              });
              if (!ok) return;
              try {
                await api.deleteCv(cv.id);
                cvs = cvs.filter((x) => x.id !== cv.id);
                paint();
                toast('CV supprimé.');
              } catch (err) { toast(err.message, 'err'); }
            },
          }, '🗑'),
        ),
      ),
    );

    attachThumb(thumbHost, { ...cv, data });
    return node;
  };

  paint();
  return root;
}
