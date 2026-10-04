/* Galerie des modèles — première étape de la création d'un CV. */

import { h, toast } from '../lib/dom.js';
import { api } from '../lib/api.js';
import { catalog } from '../cv/templates.js';
import { accentPicker } from './swatches.js';
import { sampleData } from '../cv/sample.js';
import { PLACEHOLDER_AVATAR } from '../cv/avatar.js';
import { emptyCvData } from '../schema.js';
import { attachThumb } from './thumb.js';

function emptyGallery(navigate) {
  return h('div.page', h('div.container.container--narrow',
    h('div.empty',
      h('div.empty__icon', '🗂'),
      h('h2', { style: { color: 'var(--ink)' } }, 'Aucun modèle disponible'),
      h('p', 'Le catalogue est vide pour le moment. Revenez plus tard, ou contactez l’administrateur du site.'),
      h('button.btn', {
        type: 'button', onclick: () => navigate('/tableau-de-bord'),
      }, 'Retour au tableau de bord'),
    ),
  ));
}

export function galleryView({ navigate }) {
  const models = catalog();

  // L'administration peut avoir tout masqué : mieux vaut le dire que
  // laisser l'utilisateur devant une grille vide et un bouton inerte.
  if (!models.length) return emptyGallery(navigate);

  const state = {
    template: models[0].id,
    accent: null,          // null = couleur par défaut du modèle
    prefill: false,
    title: 'Mon CV',
  };

  const thumbs = new Map();
  const grid = h('div.tpl-grid');
  const cta = h('button.btn.btn--primary.btn--lg', { type: 'button' }, 'Continuer');

  /* Le bouton suit l'écran : avec dix-sept aperçus en pleine hauteur, le
     faire chercher en bas de page reviendrait à imposer un long défilement
     après chaque changement d'avis. */
  const chosenName = h('b.gallery-bar__name', models[0].name);

  const bar = h('div.gallery-bar',
    h('div.gallery-bar__inner',
      h('div.gallery-bar__pick',
        h('span.gallery-bar__label', 'Modèle choisi'),
        chosenName,
      ),
      h('div.grow'),
      h('a.btn.hide-sm', {
        href: '/tableau-de-bord',
        onclick: (e) => { e.preventDefault(); navigate('/tableau-de-bord'); },
      }, 'Annuler'),
      cta,
    ),
  );

  /* --- barre d'options --- */

  const titleInput = h('input.input', {
    type: 'text', value: state.title, placeholder: 'Intitulé de votre CV',
    oninput: (e) => { state.title = e.target.value; },
  });

  const swatches = accentPicker({
    value: state.accent,
    onPick: (next) => { state.accent = next; repaintAll(); },
  });

  const contentSeg = h('div.seg',
    h('button', { type: 'button', class: 'is-on', onclick: (e) => setPrefill(false, e.currentTarget) }, 'CV vierge'),
    h('button', { type: 'button', onclick: (e) => setPrefill(true, e.currentTarget) }, 'Exemple pré-rempli'),
  );

  const setPrefill = (value, btn) => {
    state.prefill = value;
    contentSeg.querySelectorAll('button').forEach((b) => b.classList.toggle('is-on', b === btn));
  };

  /* --- cartes de modèles --- */

  const buildCards = () => {
    grid.replaceChildren(...models.map((tpl) => {
      const thumbHost = h('div.tpl-card__thumb');
      const card = h('button.tpl-card', {
        type: 'button',
        class: tpl.id === state.template ? 'is-active' : null,
        'aria-pressed': tpl.id === state.template,
        onclick: () => select(tpl.id),
      },
        thumbHost,
        h('div.tpl-card__body',
          h('div.tpl-card__name',
            tpl.name,
            tpl.id === state.template ? h('span.badge.badge--brand', '✓ Choisi') : null,
          ),
          h('p.tpl-card__desc', tpl.desc),
          h('div.tpl-card__tags', tpl.tags.map((t) => h('span.tpl-card__tag', t))),
        ),
      );

      card.dataset.template = tpl.id;
      thumbs.set(tpl.id, attachThumb(thumbHost, previewCv(tpl.id), { veil: false }));
      return card;
    }));
  };

  // Les aperçus portent un avatar générique : l'utilisateur voit où sa
  // photo se placera. Le CV réellement créé, lui, part sans photo.
  const previewCv = (templateId) => {
    const data = sampleData();
    data.identite.photo = PLACEHOLDER_AVATAR;
    return {
      title: 'Aperçu',
      template: templateId,
      theme: { accent: state.accent || undefined },
      data,
    };
  };

  const repaintAll = () => {
    for (const [id, thumb] of thumbs) thumb.refresh(previewCv(id));
  };

  const select = (id) => {
    state.template = id;
    chosenName.textContent = models.find((m) => m.id === id)?.name || '';
    for (const card of grid.querySelectorAll('.tpl-card')) {
      const active = card.dataset.template === id;
      card.classList.toggle('is-active', active);
      card.setAttribute('aria-pressed', String(active));
      const nameEl = card.querySelector('.tpl-card__name');
      const badge = nameEl.querySelector('.badge');
      if (active && !badge) nameEl.append(h('span.badge.badge--brand', '✓ Choisi'));
      if (!active && badge) badge.remove();
    }
  };

  /* --- création --- */

  cta.onclick = async () => {
    cta.disabled = true;
    cta.textContent = 'Création…';
    try {
      const { cv } = await api.createCv({
        title: state.title.trim() || 'Mon CV',
        template: state.template,
        theme: { accent: state.accent || undefined, density: 'normal' },
        data: state.prefill ? sampleData() : emptyCvData(),
      });
      navigate(`/cv/${cv.id}`);
    } catch (err) {
      toast(err.message, 'err');
      cta.disabled = false;
      cta.textContent = 'Continuer';
    }
  };

  buildCards();

  return h('div.page.page--cta-bar',
    h('div.container',
      h('div.page__head',
        h('div',
          h('p.eyebrow', 'Étape 1 sur 2'),
          h('h1.page__title', { style: { marginTop: '6px' } }, 'Choisissez votre modèle'),
          h('p.page__sub', 'Les aperçus utilisent un CV d’exemple. Tous les modèles acceptent une photo — celle affichée ici n’est qu’un repère, et elle reste facultative. Modèle et couleur se changent à tout moment.'),
        ),
        h('a.btn', { href: '/tableau-de-bord', onclick: (e) => { e.preventDefault(); navigate('/tableau-de-bord'); } }, 'Annuler'),
      ),

    ),

    /* Le réglage reste sous la main pendant qu'on parcourt les aperçus :
       changer de couleur redessine les dix-sept miniatures, autant pouvoir
       le faire sans remonter. La bande occupe toute la largeur, sinon les
       cartes défileraient dans les gouttières, de part et d'autre. */
    h('div.gallery-tools',
      h('div.container',
        h('div.card.card--pad',
          h('div.row.wrap.gap-24',
            h('div.field.grow', { style: { minWidth: '220px' } },
              h('label.field__label', 'Nom de ce CV'),
              titleInput,
              h('p.field__help', 'Pour vous y retrouver : « CV développeur », « Candidature Orange »…'),
            ),
            h('div.field',
              h('label.field__label', 'Couleur dominante'),
              swatches,
            ),
            h('div.field',
              h('label.field__label', 'Contenu de départ'),
              contentSeg,
            ),
          ),
        ),
      ),
    ),

    h('div.container', grid),
    bar,
  );
}
