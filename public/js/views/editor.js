/* =====================================================================
   Éditeur de CV : une rubrique à la fois, aperçu A4 en direct,
   sauvegarde automatique.
   ===================================================================== */

import { confirmDialog, debounce, h, mount, toast } from '../lib/dom.js';
import { api } from '../lib/api.js';
import { nextFieldScope, renderField } from '../form.js';
import {
  SECTIONS, completion, isSectionFilled, normalizeCvData, sectionCount,
} from '../schema.js';
import { DENSITIES, FONT_CHOICES, catalog, getTemplate } from '../cv/templates.js';
import { accentPicker } from './swatches.js';
import { PAGE_H, PAGE_W, downloadPdf, paintFrame } from '../cv/render.js';
import { ensurePaid } from './payment.js';

const STEP_KEY = (id) => `cv:${id}:step`;

export async function editorView({ navigate, id, user }) {
  const { cv } = await api.getCv(id);

  const state = {
    cv: { ...cv, data: normalizeCvData(cv.data), theme: { density: 'normal', ...(cv.theme || {}) } },
    step: clampStep(Number(localStorage.getItem(STEP_KEY(id))) || 0),
    openItem: new Map(),   // rubrique → index de la fiche dépliée
    layout: { pages: 1, breaks: [], height: PAGE_H },
  };

  /* ------------------------------------------------------------ sauvegarde */

  const saveState = h('div.save-state', h('span.save-state__dot'), h('span', 'Enregistré'));

  const setSaveState = (kind) => {
    saveState.classList.toggle('is-dirty', kind === 'dirty');
    saveState.classList.toggle('is-saving', kind === 'saving');
    saveState.lastChild.textContent =
      kind === 'saving' ? 'Enregistrement…' : kind === 'dirty' ? 'Modifications non enregistrées' : 'Enregistré';
  };

  let inFlight = null;
  async function save() {
    if (inFlight) return inFlight;
    setSaveState('saving');
    inFlight = api.updateCv(state.cv.id, {
      title: state.cv.title,
      template: state.cv.template,
      theme: state.cv.theme,
      data: state.cv.data,
    }).then(() => setSaveState('saved'))
      .catch((err) => { setSaveState('dirty'); toast(err.message, 'err'); })
      .finally(() => { inFlight = null; });
    return inFlight;
  }

  const scheduleSave = debounce(save, 900);

  /* ------------------------------------------------------------ aperçu A4 */

  const frame = h('iframe', { title: 'Aperçu du CV' });
  const paper = h('div.preview__paper', frame);
  const stage = h('div.preview__stage', paper);
  const scroller = h('div.preview__scroll', stage);
  const pageBadge = h('span.badge', '1 page A4');
  const payBadge = h('span.badge.badge--lock', '🔒 PDF payant');

  async function paintPayBadge() {
    if (state.cv.paid) {
      payBadge.className = 'badge badge--ok';
      payBadge.textContent = '✓ Téléchargement débloqué';
      return;
    }
    payBadge.className = 'badge badge--lock';
    try {
      const { pricing } = await api.pricing();
      payBadge.textContent = `🔒 PDF · ${pricing.label}`;
    } catch { payBadge.textContent = '🔒 PDF payant'; }
  }

  const fitPreview = () => {
    const available = scroller.clientWidth - 40;
    if (available <= 0) return;
    const scale = Math.min(1, available / PAGE_W);
    paper.style.transform = `scale(${scale})`;
    stage.style.width = `${PAGE_W * scale}px`;
    stage.style.height = `${state.layout.height * scale}px`;
  };

  /** Trait rouge à chaque coupure de page réelle (les pages 2+ ont des marges). */
  const paintBreaks = () => {
    const stops = state.layout.breaks.flatMap((y) =>
      [`transparent ${y - 1}px`, `var(--danger) ${y - 1}px`, `var(--danger) ${y}px`, `transparent ${y}px`]);
    paper.style.setProperty('--breaks', stops.length
      ? `linear-gradient(to bottom, ${stops.join(', ')})`
      : 'none');
  };

  async function refreshPreview() {
    // L'aperçu est toujours verrouillé (sélection, copie, glissement), et
    // marqué tant que la commande n'est pas réglée : sans cela, une capture
    // d'écran tiendrait lieu du livrable payant. Le filigrane tombe dès le
    // paiement, et le document d'impression n'en reçoit jamais.
    state.layout = await paintFrame(frame, state.cv, { watermark: !state.cv.paid });
    const n = state.layout.pages;
    // Plus d'approximation : l'aperçu applique la même mise en pages que le PDF.
    pageBadge.textContent = `${n} page${n > 1 ? 's' : ''} A4`;
    pageBadge.classList.toggle('badge--ok', n <= 2);
    paintBreaks();
    fitPreview();
  }

  const schedulePreview = debounce(refreshPreview, 300);

  /* --------------------------------------------------- réaction aux saisies */

  function onEdit({ structural = false } = {}) {
    setSaveState('dirty');
    scheduleSave();
    schedulePreview();
    paintRail();
    if (structural) paintStep();
  }

  /* ----------------------------------------------------------------- rail */

  const railSteps = h('div.stack.gap-4');
  const railPct = h('span');
  const railBar = h('div.progress__bar');

  function paintRail() {
    const pct = completion(state.cv.data);
    railPct.textContent = `${pct} %`;
    railBar.style.width = `${pct}%`;

    railSteps.replaceChildren(...SECTIONS.map((section, index) => {
      const done = isSectionFilled(section, state.cv.data);
      const count = sectionCount(section, state.cv.data);
      return h('button.step', {
        type: 'button',
        class: [index === state.step ? 'is-active' : null, done ? 'is-done' : null],
        onclick: () => goTo(index),
      },
        h('span.step__num', done && index !== state.step ? '✓' : String(index + 1)),
        h('span.step__label', section.short || section.label),
        count ? h('span.step__count', String(count)) : null,
      );
    }));

    mobileSteps.value = String(state.step);
  }

  const mobileSteps = h('select.select.mobile-steps', {
    onchange: (e) => goTo(Number(e.target.value)),
  }, SECTIONS.map((s, i) => h('option', { value: String(i) }, `${i + 1}. ${s.label}`)));

  /* ------------------------------------------------------ formulaire courant */

  const formHost = h('div.editor__main-inner');

  function goTo(index) {
    const next = clampStep(index);
    if (next === state.step) return;
    state.step = next;
    localStorage.setItem(STEP_KEY(state.cv.id), String(next));
    scheduleSave.flush();
    paintRail();
    paintStep();
    document.querySelector('.editor__main')?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function paintStep() {
    const section = SECTIONS[state.step];
    const isLast = state.step === SECTIONS.length - 1;

    mount(formHost,
      h('header.section-head',
        h('div.section-head__row',
          h('div.section-head__icon', section.icon),
          h('div',
            h('p.tiny.dim', `Rubrique ${state.step + 1} sur ${SECTIONS.length}`),
            h('h2.section-head__title', section.label),
          ),
        ),
        section.hint ? h('p.section-head__hint', section.hint) : null,
      ),

      section.kind === 'repeatable' ? renderRepeatable(section) : renderSingle(section),

      h('nav.editor__nav',
        h('button.btn', {
          type: 'button', disabled: state.step === 0,
          onclick: () => goTo(state.step - 1),
        }, '← Précédent'),

        h('div.row.gap-8',
          isLast
            ? h('button.btn.btn--soft', {
              type: 'button',
              onclick: async () => { await save(); navigate('/tableau-de-bord'); },
            }, 'Terminer')
            : null,
          isLast
            ? h('button.btn.btn--primary', { type: 'button', 'data-export-pdf': '', onclick: exportPdf }, '⬇ Télécharger le PDF')
            : h('button.btn.btn--primary', {
              type: 'button',
              onclick: () => goTo(state.step + 1),
            }, `Suivant : ${SECTIONS[state.step + 1].short || SECTIONS[state.step + 1].label} →`),
        ),
      ),
    );
  }

  /* --- rubrique à valeur unique --- */

  function renderSingle(section) {
    const values = state.cv.data[section.id];
    nextFieldScope();

    return h('div.card.card--pad',
      h('div.grid-fields', section.fields.map((field) =>
        renderField(field, values, (fname, value) => {
          values[fname] = value;
          onEdit();
        }))),
    );
  }

  /* --- rubrique répétable --- */

  function renderRepeatable(section) {
    const items = state.cv.data[section.id];
    const listEl = h('div.repeat-list');

    items.forEach((item, index) => listEl.append(itemCard(section, item, index)));

    const addBtn = h('button.add-btn', {
      type: 'button',
      onclick: () => {
        items.push(section.newItem());
        state.openItem.set(section.id, items.length - 1);
        onEdit({ structural: true });
        requestAnimationFrame(() => {
          const cards = formHost.querySelectorAll('.item-card');
          cards[cards.length - 1]?.querySelector('input, textarea, select')?.focus();
        });
      },
    }, `＋ Ajouter une ${section.itemLabel}`);

    return h('div.stack.gap-16',
      items.length
        ? listEl
        : h('div.empty', { style: { padding: '38px 24px' } },
          h('div.empty__icon', section.icon),
          h('p', `Aucune ${section.itemLabel} pour l’instant.`),
          h('p.tiny', 'Cette rubrique n’apparaîtra pas sur le CV tant qu’elle est vide.'),
        ),
      addBtn,
    );
  }

  function itemCard(section, item, index) {
    const isOpen = state.openItem.get(section.id) === index;

    const titleEl = h('div.item-card__title', section.summary(item));
    const metaEl = h('div.item-card__meta', section.subtitle?.(item) || '');
    const refreshHead = () => {
      titleEl.textContent = section.summary(item);
      metaEl.textContent = section.subtitle?.(item) || '';
    };

    const body = h('div.item-card__body');

    const buildBody = () => {
      nextFieldScope();
      mount(body, h('div.grid-fields', section.fields.map((field) =>
        renderField(field, item, (fname, value) => {
          item[fname] = value;
          refreshHead();
          onEdit();
          // Une case comme « poste actuel » verrouille le champ de fin.
          if (section.fields.some((f) => f.disabledBy === fname)) {
            buildBody();
            body.querySelector(`input[type="checkbox"]`)?.focus();
          }
        }))));
    };

    const move = (delta) => {
      const target = index + delta;
      const items = state.cv.data[section.id];
      if (target < 0 || target >= items.length) return;
      [items[index], items[target]] = [items[target], items[index]];
      state.openItem.set(section.id, target);
      onEdit({ structural: true });
    };

    const card = h('article.item-card', {
      class: isOpen ? 'is-open' : null,
      draggable: 'true',
      ondragstart: (e) => {
        e.dataTransfer.setData('text/plain', String(index));
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('is-dragging');
      },
      ondragend: () => card.classList.remove('is-dragging'),
      ondragover: (e) => { e.preventDefault(); card.classList.add('is-drop-target'); },
      ondragleave: () => card.classList.remove('is-drop-target'),
      ondrop: (e) => {
        e.preventDefault();
        card.classList.remove('is-drop-target');
        const from = Number(e.dataTransfer.getData('text/plain'));
        if (Number.isNaN(from) || from === index) return;
        const items = state.cv.data[section.id];
        const [moved] = items.splice(from, 1);
        items.splice(index, 0, moved);
        state.openItem.set(section.id, index);
        onEdit({ structural: true });
      },
    },
      h('div.item-card__head', {
        onclick: () => {
          const current = state.openItem.get(section.id);
          state.openItem.set(section.id, current === index ? -1 : index);
          paintStep();
        },
      },
        h('span.item-card__grip', { title: 'Glisser pour réordonner' }, '⠿'),
        h('div.item-card__titles', titleEl, metaEl),
        h('button.btn.btn--ghost.btn--sm.btn--icon', {
          type: 'button', title: 'Monter', disabled: index === 0,
          onclick: (e) => { e.stopPropagation(); move(-1); },
        }, '↑'),
        h('button.btn.btn--ghost.btn--sm.btn--icon', {
          type: 'button', title: 'Descendre', disabled: index === state.cv.data[section.id].length - 1,
          onclick: (e) => { e.stopPropagation(); move(1); },
        }, '↓'),
        h('button.btn.btn--ghost.btn--sm.btn--icon', {
          type: 'button', title: 'Supprimer',
          onclick: async (e) => {
            e.stopPropagation();
            const ok = await confirmDialog({
              title: `Supprimer cette ${section.itemLabel} ?`,
              message: section.summary(item),
              confirmLabel: 'Supprimer',
              danger: true,
            });
            if (!ok) return;
            state.cv.data[section.id].splice(index, 1);
            state.openItem.set(section.id, -1);
            onEdit({ structural: true });
          },
        }, '🗑'),
        h('span.item-card__chevron', '▾'),
      ),
      isOpen ? body : null,
    );

    if (isOpen) buildBody();
    return card;
  }

  /* ------------------------------------------------------- barre d'aperçu */

  /* Le modèle du CV peut avoir été retiré du catalogue depuis sa création :
     on le garde dans la liste, sinon changer une couleur suffirait à le
     faire basculer en douce sur un autre design. */
  const choices = catalog();
  const models = choices.some((t) => t.id === state.cv.template)
    ? choices
    : [{ ...getTemplate(state.cv.template), id: state.cv.template }, ...choices];

  const templateSelect = h('select.select', {
    style: { width: 'auto', minWidth: '132px' },
    onchange: (e) => { state.cv.template = e.target.value; onEdit(); },
  }, models.map((t) => h('option', { value: t.id, selected: t.id === state.cv.template }, t.name)));

  const accentSwatches = accentPicker({
    value: state.cv.theme.accent ?? null,
    onPick: (next) => {
      if (next) state.cv.theme.accent = next;
      else delete state.cv.theme.accent;
      onEdit();
    },
  });

  const fontSelect = h('select.select', {
    style: { width: 'auto' },
    onchange: (e) => { state.cv.theme.font = e.target.value || undefined; onEdit(); },
  },
    h('option', { value: '' }, 'Police du modèle'),
    FONT_CHOICES.map((f) => h('option', { value: f.id, selected: state.cv.theme.font === f.id }, f.label)),
  );

  const densitySeg = h('div.seg', DENSITIES.map((d) => h('button', {
    type: 'button',
    class: (state.cv.theme.density || 'normal') === d.id ? 'is-on' : null,
    onclick: (e) => {
      state.cv.theme.density = d.id;
      densitySeg.querySelectorAll('button').forEach((b) => b.classList.toggle('is-on', b === e.currentTarget));
      onEdit();
    },
  }, d.label)));

  /* ------------------------------------------------------------- export PDF */

  let exporting = false;

  async function exportPdf() {
    if (exporting) return;
    scheduleSave.flush();

    // Le PDF net est le livrable payant : rien n'est fabriqué avant l'accord
    // du serveur. `ensurePaid` renvoie tout de suite si le CV est déjà réglé.
    if (!await ensurePaid(state.cv)) return;

    paintPayBadge();
    refreshPreview();   // l'aperçu perd son filigrane

    // Le serveur met quelques secondes à composer le document : sans ce
    // retour, le bouton semblerait ne rien faire.
    exporting = true;
    const restore = markExporting(true);
    toast('Préparation de votre PDF…');
    try {
      await downloadPdf(state.cv);
      toast('PDF téléchargé.', 'ok');
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      exporting = false;
      restore();
    }
  }

  /** Passe les boutons d'export en attente, et renvoie de quoi les rétablir. */
  function markExporting(on) {
    const buttons = [...document.querySelectorAll('[data-export-pdf]')];
    const before = buttons.map((b) => b.textContent);
    for (const b of buttons) {
      b.disabled = on;
      if (on) b.textContent = 'Préparation…';
    }
    return () => buttons.forEach((b, i) => { b.disabled = false; b.textContent = before[i]; });
  }

  /* ------------------------------------------------------------ assemblage */

  const titleInput = h('input.editor-bar__title', {
    type: 'text', value: state.cv.title, 'aria-label': 'Nom du CV',
    oninput: (e) => { state.cv.title = e.target.value; setSaveState('dirty'); scheduleSave(); },
  });

  const previewToggle = h('button.btn.btn--sm', { type: 'button' }, '👁 Aperçu');

  const editor = h('div.editor',
    h('aside.editor__rail',
      h('div.rail__head',
        h('div.rail__progress-label', h('span', 'Progression'), railPct),
        h('div.progress', railBar),
      ),
      railSteps,
    ),

    h('main.editor__main', formHost),

    h('section.editor__preview',
      h('div.preview__bar',
        h('span.tiny.dim.strong', 'Modèle'),
        templateSelect,
        fontSelect,
        densitySeg,
        h('div.grow'),
        payBadge,
        pageBadge,
      ),
      h('div.preview__bar', { style: { paddingTop: '8px', paddingBottom: '8px' } },
        h('span.tiny.dim.strong', 'Couleur'),
        accentSwatches,
        h('div.grow'),
        h('button.btn.btn--sm.btn--primary', { type: 'button', 'data-export-pdf': '', onclick: exportPdf }, '⬇ PDF'),
      ),
      scroller,
    ),
  );

  previewToggle.onclick = () => {
    const on = editor.classList.toggle('is-preview');
    previewToggle.textContent = on ? '✎ Formulaire' : '👁 Aperçu';
    if (on) requestAnimationFrame(fitPreview);
  };

  const root = h('div.editor-wrap',
    h('div.editor-bar',
      h('button.btn.btn--ghost.btn--sm', {
        type: 'button', onclick: () => navigate('/tableau-de-bord'),
      }, '← Mes CV'),
      titleInput,
      saveState,
      h('div.grow'),
      mobileSteps,
      previewToggle,
      h('button.btn.btn--sm.btn--primary', { type: 'button', 'data-export-pdf': '', onclick: exportPdf }, '⬇ Télécharger le PDF'),
    ),
    editor,
  );

  /* --------------------------------------------------------------- cycle de vie */

  const observer = new ResizeObserver(fitPreview);
  observer.observe(scroller);

  const onKeydown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') { e.preventDefault(); exportPdf(); }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); scheduleSave.flush(); }
  };
  document.addEventListener('keydown', onKeydown);

  const onBeforeUnload = (e) => {
    if (!saveState.classList.contains('is-dirty')) return;
    scheduleSave.flush();
    e.preventDefault();
    e.returnValue = '';
  };
  window.addEventListener('beforeunload', onBeforeUnload);

  root._onLeave = () => {
    scheduleSave.flush();
    observer.disconnect();
    document.removeEventListener('keydown', onKeydown);
    window.removeEventListener('beforeunload', onBeforeUnload);
  };

  paintRail();
  paintStep();
  paintPayBadge();
  refreshPreview();

  return root;
}

const clampStep = (n) => Math.min(SECTIONS.length - 1, Math.max(0, Number.isFinite(n) ? n : 0));
