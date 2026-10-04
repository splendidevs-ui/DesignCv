/* =====================================================================
   Administration du catalogue des modèles.

   Trois gestes : composer un modèle à partir d'une mise en page, le
   retirer de la galerie (ou le supprimer s'il n'a jamais servi), et
   ordonner la galerie au glisser-déposer.
   ===================================================================== */

import { confirmDialog, debounce, h, mount, toast } from '../lib/dom.js';
import { api } from '../lib/api.js';
import {
  ACCENTS, FONT_CHOICES, LAYOUTS, registerTemplates, setCatalog,
} from '../cv/templates.js';
import { sampleData } from '../cv/sample.js';
import { PLACEHOLDER_AVATAR } from '../cv/avatar.js';
import { attachThumb } from './thumb.js';

/** Le CV d'exemple qui sert d'aperçu à un modèle. */
function previewFor(row) {
  const data = sampleData();
  data.identite.photo = PLACEHOLDER_AVATAR;
  return { title: row.name || 'Aperçu', template: row.id, theme: {}, data };
}

export async function adminView({ navigate }) {
  const root = h('div.page');
  const grid = h('div.tpl-grid.admin-grid');
  const count = h('p.page__sub');

  let rows = [];
  let layouts = [];
  const thumbs = new Map();

  /* Redessiner détache les cartes, donc le champ de rang qui avait le
     focus — et un champ détaché émet un dernier « change », avec l'index
     qu'il avait avant le déplacement. Sans cette garde, cet écho rejouait
     un second déplacement : la base partait d'un côté, l'affichage de
     l'autre. */
  let repainting = false;

  /* ------------------------------------------------------------ données */

  const load = async () => {
    const payload = await api.adminTemplates();
    rows = payload.templates;
    layouts = payload.layouts;
    // Les modèles masqués doivent tout de même se dessiner ici.
    registerTemplates(rows);
  };

  /** Le reste de l'application ne voit que les modèles publiés. */
  const republish = async () => {
    try {
      const { templates } = await api.templates();
      setCatalog(templates);
      registerTemplates(rows);
    } catch { /* la galerie se rechargera au prochain démarrage */ }
  };

  try {
    await load();
  } catch (err) {
    mount(root, h('div.container', h('div.alert', err.message)));
    return root;
  }

  /* ------------------------------------------------------------- cartes */

  /* -------------------------------------------------------------------
     Glisser-déposer, en événements pointeur.

     Le glisser-déposer natif du HTML n'est pas utilisé : il ne fonctionne
     pas au tactile, et déplacer une carte dans le DOM en plein geste
     rechargerait l'iframe de son aperçu. Ici rien ne bouge pendant le
     glissement — un repère montre où la carte va tomber, et la grille
     n'est redessinée qu'au relâchement.
     ------------------------------------------------------------------- */

  const REPRISE = 6;   // pixels à parcourir avant qu'un clic devienne un geste

  const clearMarks = () => {
    for (const el of grid.querySelectorAll('.is-drop-before, .is-drop-after')) {
      el.classList.remove('is-drop-before', 'is-drop-after');
    }
  };

  /** La carte survolée et le côté par lequel on l'aborde. */
  const dropSpot = (x, y) => {
    let best = null;
    let bestDist = Infinity;
    [...grid.children].forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d < bestDist) { bestDist = d; best = { index: i, after: x > cx }; }
    });
    return best;
  };

  /** Où la carte partie de `from` atterrit si on la lâche sur ce repère. */
  const landing = (spot, from) => {
    const at = spot.index + (spot.after ? 1 : 0);
    return at > from ? at - 1 : at;
  };

  function startDrag(event, row, from, node) {
    const origin = { x: event.clientX, y: event.clientY };
    let active = false;
    let ghost = null;
    let target = from;

    const move = (e) => {
      if (!active) {
        if (Math.hypot(e.clientX - origin.x, e.clientY - origin.y) < REPRISE) return;
        active = true;
        node.classList.add('is-dragging');
        document.body.classList.add('is-sorting');
        ghost = h('div.drag-ghost', h('b', row.name), h('span.drag-ghost__rank', ''));
        document.body.append(ghost);
      }
      e.preventDefault();
      // Décalée franchement : l'étiquette ne doit pas recouvrir le liseré
      // qu'elle commente.
      ghost.style.transform = `translate(${e.clientX + 22}px, ${e.clientY + 20}px)`;

      const spot = dropSpot(e.clientX, e.clientY);
      clearMarks();
      target = spot ? landing(spot, from) : from;
      if (spot && target !== from) {
        grid.children[spot.index].classList.add(spot.after ? 'is-drop-after' : 'is-drop-before');
      }
      ghost.querySelector('.drag-ghost__rank').textContent =
        target === from ? 'position inchangée' : `→ rang ${target + 1}`;
    };

    const finish = (commit) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', key, true);
      if (!active) return;

      node.classList.remove('is-dragging');
      document.body.classList.remove('is-sorting');
      ghost?.remove();
      clearMarks();

      if (!commit || target === from) return;
      const next = [...rows];
      const [moved] = next.splice(from, 1);
      next.splice(target, 0, moved);
      rows = next;
      paint();
      persistOrder();
    };

    const up = () => finish(true);
    const cancel = () => finish(false);
    const key = (e) => { if (e.key === 'Escape') { e.preventDefault(); finish(false); } };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key, true);
  }

  const card = (row, index) => {
    const thumbHost = h('div.tpl-card__thumb');

    /* Le rang saisi est une insertion, pas un échange : taper « 1 » sur la
       douzième carte l'amène en tête et décale les autres d'un cran, ce qui
       est ce qu'on attend en écrivant un numéro d'ordre. */
    const moveTo = (value) => {
      if (repainting) return false;
      const to = Math.min(rows.length, Math.max(1, Math.round(Number(value))));
      if (!Number.isFinite(to) || to === index + 1) return false;
      const next = [...rows];
      const [moved] = next.splice(index, 1);
      next.splice(to - 1, 0, moved);
      rows = next;
      paint(row.id);
      persistOrder();
      return true;
    };

    /* Un rang refusé revient à sa valeur d'origine plutôt que de laisser
       le champ mentir sur la position réelle de la carte. */
    const commitRank = (el) => { if (!moveTo(el.value)) el.value = String(index + 1); };

    const rankInput = h('input.admin-card__num', {
      type: 'number', min: '1', max: String(rows.length), step: '1',
      value: String(index + 1),
      'aria-label': `Rang de ${row.name} dans la galerie`,
      title: 'Saisissez un rang, puis Entrée',
      onfocus: (e) => e.currentTarget.select(),
      onkeydown: (e) => {
        // Hors formulaire, Entrée ne déclenche pas `change` : sans ce cas
        // explicite, il faudrait quitter le champ pour que la saisie prenne.
        if (e.key === 'Enter') { e.preventDefault(); commitRank(e.currentTarget); }
        if (e.key === 'Escape') { e.currentTarget.value = String(index + 1); e.currentTarget.blur(); }
      },
      // Reste `change` pour la validation par sortie du champ.
      onchange: (e) => commitRank(e.currentTarget),
    });

    const node = h('article.tpl-card.admin-card', {
      dataset: { id: row.id },
      class: row.visible ? null : 'is-hidden',

      onpointerdown: (e) => {
        if (e.button !== 0) return;
        // Les commandes se cliquent et le rang se saisit : un geste parti de
        // là n'emporte pas la carte.
        if (e.target.closest('button, input, select, textarea, a')) return;
        // Au doigt, seule la poignée déclenche le tri — ailleurs, le geste
        // vertical doit continuer de faire défiler la page.
        if (e.pointerType !== 'mouse' && !e.target.closest('.admin-card__grip')) return;
        startDrag(e, row, index, node);
      },
    },
      h('div.admin-card__rank',
        h('span.admin-card__grip', { title: 'Maintenez et glissez pour déplacer' }, '⠿'),
        rankInput,
      ),
      thumbHost,
      h('div.tpl-card__body',
        h('div.tpl-card__name',
          h('span.grow', row.name),
          row.visible ? null : h('span.badge.badge--lock', 'Masqué'),
        ),
        h('p.tpl-card__desc', row.desc || '—'),
        h('div.tpl-card__tags', row.tags.map((t) => h('span.tpl-card__tag', t))),
        h('div.admin-card__meta',
          h('span', row.builtin ? '⚙ Intégré' : '✎ Composé'),
          h('span.dot-sep', '·'),
          h('span', `base : ${layoutName(row.base)}`),
          h('span.dot-sep', '·'),
          h('span', row.usage ? `${row.usage} CV` : 'jamais utilisé'),
        ),
        h('div.admin-card__actions',
          h('button.btn.btn--sm.btn--soft', {
            type: 'button', onclick: () => openForm(row),
          }, 'Modifier'),
          h('button.btn.btn--sm', {
            type: 'button',
            title: row.visible ? 'Retirer de la galerie' : 'Remettre dans la galerie',
            onclick: (e) => setVisible(row, !row.visible, e.currentTarget),
          }, row.visible ? 'Masquer' : 'Afficher'),
          row.builtin ? null : h('button.btn.btn--sm.btn--icon.btn--danger', {
            type: 'button', title: 'Supprimer définitivement',
            onclick: () => remove(row),
          }, '🗑'),
        ),
      ),
    );

    thumbs.set(row.id, attachThumb(thumbHost, previewFor(row), { veil: false }));
    return node;
  };

  const layoutName = (id) => LAYOUTS.find((l) => l.id === id)?.name || id;

  /**
   * Redessine la grille. `focusId` rend la main au champ de rang de la
   * carte déplacée : après une saisie, on veut voir où la carte a atterri
   * sans avoir à la chercher.
   */
  const paint = (focusId = null) => {
    repainting = true;
    try {
      for (const thumb of thumbs.values()) thumb.destroy();
      thumbs.clear();
      grid.replaceChildren(...rows.map(card));

      if (focusId) {
        const input = grid.querySelector(`[data-id="${focusId}"] .admin-card__num`);
        input?.focus();
        input?.closest('.admin-card')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    } finally {
      repainting = false;
    }

    count.textContent = `${rows.length} modèle${rows.length > 1 ? 's' : ''} au catalogue, `
      + `dont ${rows.filter((r) => r.visible).length} visible${rows.filter((r) => r.visible).length > 1 ? 's' : ''} dans la galerie.`;
  };

  /* ------------------------------------------------------------- actions */

  const persistOrder = async () => {
    try {
      await api.reorderTemplates(rows.map((r) => r.id));
      await republish();
      toast('Ordre enregistré.', 'ok');
    } catch (err) {
      toast(err.message, 'err');
      await refresh();
    }
  };

  const setVisible = async (row, visible, btn) => {
    btn.disabled = true;
    try {
      const { template } = await api.updateTemplate(row.id, { visible });
      rows = rows.map((r) => (r.id === row.id ? { ...r, ...template } : r));
      paint();
      await republish();
      toast(visible ? 'Modèle affiché dans la galerie.' : 'Modèle masqué.', 'ok');
    } catch (err) {
      toast(err.message, 'err');
      btn.disabled = false;
    }
  };

  const remove = async (row) => {
    const ok = await confirmDialog({
      title: `Supprimer « ${row.name} » ?`,
      message: 'Ce modèle disparaîtra définitivement du catalogue. Les mises en page intégrées, elles, ne sont jamais touchées.',
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.deleteTemplate(row.id);
      rows = rows.filter((r) => r.id !== row.id);
      paint();
      await republish();
      toast('Modèle supprimé.');
    } catch (err) {
      toast(err.message, 'err');
    }
  };

  const refresh = async () => {
    try {
      await load();
      paint();
      await republish();
    } catch (err) { toast(err.message, 'err'); }
  };

  /* -------------------------------------------------------- formulaire */

  const openForm = (row = null) => {
    templateForm({
      row, layouts,
      onSaved: async (saved, created) => {
        await refresh();
        toast(created ? `« ${saved.name} » ajouté au catalogue.` : 'Modèle mis à jour.', 'ok');
      },
    });
  };

  /* ------------------------------------------------------------- montage */

  mount(root, h('div.container',
    h('div.page__head',
      h('div',
        h('p.eyebrow', 'Administration'),
        h('h1.page__title', { style: { marginTop: '6px' } }, 'Catalogue des modèles'),
        count,
      ),
      h('div.row.gap-8',
        h('a.btn', {
          href: '/modeles',
          onclick: (e) => { e.preventDefault(); navigate('/modeles'); },
        }, 'Voir la galerie'),
        h('button.btn.btn--primary.btn--lg', {
          type: 'button', onclick: () => openForm(null),
        }, '＋ Ajouter un modèle'),
      ),
    ),
    h('div.admin-hint',
      h('span.admin-hint__ico', '⠿'),
      h('span',
        'Pour changer l’ordre de la galerie : ',
        h('b', 'maintenez une carte et glissez-la'),
        ', ou ',
        h('b', 'saisissez son rang'),
        ' dans la pastille en haut à gauche, puis Entrée. ',
        h('span.dim', 'Masquer retire un modèle de la galerie sans toucher aux CV déjà créés.'),
      ),
    ),
    grid,
  ));

  paint();

  root._onLeave = () => { for (const t of thumbs.values()) t.destroy(); thumbs.clear(); };
  return root;
}

/* =====================================================================
   Le formulaire — un modèle se compose en choisissant une mise en page
   puis en l'habillant. L'aperçu à droite est le rendu réel, pas une image.
   ===================================================================== */

function templateForm({ row, layouts, onSaved }) {
  const creating = !row;
  const draft = {
    base: row?.base || layouts[0]?.id,
    name: row?.name || '',
    desc: row?.desc || '',
    tags: [...(row?.tags || [])],
    accent: row?.accent || null,
    font: row?.font || null,
  };

  const meta = (id) => layouts.find((l) => l.id === id);

  /* --- aperçu --- */

  const previewHost = h('div.admin-form__preview');
  let thumb = null;

  const previewModel = () => {
    const data = sampleData();
    data.identite.photo = PLACEHOLDER_AVATAR;
    return {
      title: draft.name || 'Aperçu',
      // La mise en page suffit à dessiner : le modèle n'existe pas encore
      // en base, on emprunte donc l'identifiant de sa base.
      template: draft.base,
      theme: { accent: draft.accent || undefined, font: draft.font || undefined },
      data,
    };
  };

  const repaint = debounce(() => thumb?.refresh(previewModel()), 180);

  /* --- champs --- */

  const baseSelect = h('select.select', {
    disabled: Boolean(row?.builtin),
    onchange: (e) => {
      draft.base = e.target.value;
      if (creating) applyLayoutDefaults();
      repaint();
    },
  }, layouts.map((l) => h('option', { value: l.id, selected: l.id === draft.base }, l.name)));

  const nameInput = h('input.input', {
    type: 'text', value: draft.name, maxlength: 60,
    placeholder: 'Moderne Émeraude',
    oninput: (e) => { draft.name = e.target.value; repaint(); },
  });

  const descInput = h('textarea.textarea', {
    maxlength: 240, style: { minHeight: '76px' },
    placeholder: 'En une phrase : à qui ce modèle s’adresse et ce qui le distingue.',
    oninput: (e) => { draft.desc = e.target.value; },
  }, draft.desc);

  const tagsInput = h('input.input', {
    type: 'text', value: draft.tags.join(', '),
    placeholder: 'Polyvalent, Bandeau latéral',
    oninput: (e) => {
      draft.tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 4);
    },
  });

  /* Couleur : « d'origine » laisse la mise en page décider. */
  const swatches = h('div.swatches',
    h('button.swatch', {
      type: 'button', title: 'Couleur d’origine de la mise en page',
      class: draft.accent ? null : 'is-on',
      style: { background: 'conic-gradient(#4f46e5,#0369a1,#047857,#b45309,#9f1239,#7e22ce,#4f46e5)' },
      onclick: (e) => { draft.accent = null; markSwatch(e.currentTarget); repaint(); },
    }),
    ACCENTS.map((a) => h('button.swatch', {
      type: 'button', title: a.label, style: { background: a.value },
      class: draft.accent === a.value ? 'is-on' : null,
      onclick: (e) => { draft.accent = a.value; markSwatch(e.currentTarget); repaint(); },
    })),
  );

  const markSwatch = (btn) =>
    swatches.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('is-on', s === btn));

  const fontSeg = h('div.seg',
    h('button', {
      type: 'button', class: draft.font ? null : 'is-on',
      onclick: (e) => setFont(null, e.currentTarget),
    }, 'D’origine'),
    FONT_CHOICES.map((f) => h('button', {
      type: 'button', class: draft.font === f.id ? 'is-on' : null,
      onclick: (e) => setFont(f.id, e.currentTarget),
    }, f.label)),
  );

  const setFont = (id, btn) => {
    draft.font = id;
    fontSeg.querySelectorAll('button').forEach((b) => b.classList.toggle('is-on', b === btn));
    repaint();
  };

  /** À la création, changer de base réamorce les textes tant qu'on n'y a pas touché. */
  const applyLayoutDefaults = () => {
    const l = meta(draft.base);
    if (!l) return;
    if (!nameInput.value.trim() || nameInput.dataset.auto === '1') {
      draft.name = l.name;
      nameInput.value = l.name;
      nameInput.dataset.auto = '1';
    }
    if (!descInput.value.trim() || descInput.dataset.auto === '1') {
      draft.desc = l.desc;
      descInput.value = l.desc;
      descInput.dataset.auto = '1';
    }
    if (!tagsInput.value.trim() || tagsInput.dataset.auto === '1') {
      draft.tags = [...l.tags];
      tagsInput.value = l.tags.join(', ');
      tagsInput.dataset.auto = '1';
    }
  };

  for (const el of [nameInput, descInput, tagsInput]) {
    el.addEventListener('input', () => { el.dataset.auto = '0'; });
  }
  if (creating) applyLayoutDefaults();

  /* --- enveloppe --- */

  const alert = h('div.alert.hidden');
  const saveBtn = h('button.btn.btn--primary', { type: 'button' },
    creating ? 'Créer le modèle' : 'Enregistrer');

  const close = () => {
    thumb?.destroy();
    backdrop.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };

  saveBtn.onclick = async () => {
    alert.classList.add('hidden');
    saveBtn.disabled = true;
    const payload = {
      base: draft.base,
      name: draft.name.trim(),
      desc: draft.desc.trim(),
      tags: draft.tags,
      accent: draft.accent || '',
      font: draft.font || '',
    };
    try {
      const { template } = creating
        ? await api.createTemplate(payload)
        : await api.updateTemplate(row.id, payload);
      close();
      await onSaved(template, creating);
    } catch (err) {
      alert.textContent = err.message;
      alert.classList.remove('hidden');
      saveBtn.disabled = false;
    }
  };

  const field = (label, control, help) => h('div.field',
    h('label.field__label', label),
    control,
    help ? h('p.field__help', help) : null,
  );

  const backdrop = h('div.modal-backdrop',
    { onclick: (e) => { if (e.target === backdrop) close(); } },
    h('div.modal.modal--wide', { role: 'dialog', 'aria-modal': 'true' },
      h('h3.modal__title', creating ? 'Ajouter un modèle' : `Modifier « ${row.name} »`),
      h('p.muted.small',
        'Un modèle reprend la mise en page d’un design existant et l’habille : nom, description, étiquettes, couleur et police.'),
      alert,
      h('div.admin-form',
        h('div.admin-form__fields',
          field('Mise en page', baseSelect, row?.builtin
            ? 'La mise en page d’un modèle intégré ne se change pas : les CV qui l’utilisent gardent leur dessin.'
            : 'Le dessin de base. Le reste des champs ne fait que l’habiller.'),
          field('Nom', nameInput),
          field('Description', descInput),
          field('Étiquettes', tagsInput, 'Séparées par des virgules, quatre au maximum.'),
          field('Couleur dominante', swatches),
          field('Police', fontSeg),
        ),
        h('div.admin-form__side',
          h('p.field__label', 'Aperçu'),
          previewHost,
        ),
      ),
      h('div.modal__actions',
        h('button.btn', { type: 'button', onclick: close }, 'Annuler'),
        saveBtn,
      ),
    ),
  );

  document.body.append(backdrop);
  document.addEventListener('keydown', onKey);
  thumb = attachThumb(previewHost, previewModel(), { veil: false });
  nameInput.focus();
}
