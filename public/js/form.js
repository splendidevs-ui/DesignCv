/* =====================================================================
   Rendu des contrôles de formulaire à partir du schéma des rubriques.
   Chaque type de champ sait s'afficher et remonter sa valeur.
   ===================================================================== */

import { h, toast } from './lib/dom.js';
import { SKILL_LEVELS } from './schema.js';

/**
 * Construit un champ complet (libellé + contrôle + aide).
 * @param {object} field   description issue du schéma
 * @param {object} values  toutes les valeurs de l'élément courant
 * @param {(name:string, value:any)=>void} onChange
 */
export function renderField(field, values, onChange) {
  const value = values[field.name];
  const set = (v) => onChange(field.name, v);
  const disabled = Boolean(field.disabledBy && values[field.disabledBy]);

  const control = CONTROLS[field.type] ? CONTROLS[field.type](field, value, set, { disabled, values }) : CONTROLS.text(field, value, set, { disabled, values });

  // La case à cocher porte déjà son libellé : pas de doublon.
  if (field.type === 'checkbox') {
    return h(`div.field${field.width === 'full' ? '.span-2' : ''}`, control);
  }

  return h(`div.field${field.width === 'full' ? '.span-2' : ''}`,
    h('label.field__label', { for: controlId(field) },
      field.label,
      field.required ? h('span.req', { title: 'Champ recommandé' }, '*') : null,
    ),
    control,
    field.help ? h('p.field__help', field.help) : null,
  );
}

const controlId = (field) => `f-${field.name}-${idSeed}`;
let idSeed = 0;
export const nextFieldScope = () => { idSeed += 1; };

/* ===================================================================== */

const CONTROLS = {
  /* --- champs texte simples --- */
  text: (field, value, set, { disabled }) => {
    const listId = field.suggestions ? `${controlId(field)}-list` : null;
    const input = h('input.input', {
      id: controlId(field),
      type: field.type === 'text' ? 'text' : field.type,
      value: value ?? '',
      placeholder: field.placeholder || '',
      autocomplete: field.autocomplete || 'off',
      disabled,
      list: listId,
      oninput: (e) => set(e.target.value),
    });

    if (!listId) return input;
    return h('div', { style: { display: 'contents' } },
      input,
      h('datalist', { id: listId }, field.suggestions.map((s) => h('option', { value: s }))),
    );
  },

  /* --- zone de texte, avec compteur si `max` --- */
  textarea: (field, value, set) => {
    const counter = field.max ? h('div.counter') : null;
    const area = h('textarea.textarea', {
      id: controlId(field),
      rows: field.rows || 5,
      value: value ?? '',
      placeholder: field.placeholder || '',
      oninput: (e) => { set(e.target.value); refresh(e.target.value); },
    });

    const refresh = (v) => {
      autogrow(area);
      if (!counter) return;
      const len = String(v || '').length;
      counter.textContent = `${len} / ${field.max}`;
      counter.classList.toggle('counter--over', len > field.max);
    };

    queueMicrotask(() => refresh(value));
    return h('div.stack.gap-4', area, counter);
  },

  /* --- multiligne « une ligne = une puce » --- */
  lines: (field, value, set) => {
    const area = h('textarea.textarea', {
      id: controlId(field),
      rows: field.rows || 5,
      value: value ?? '',
      placeholder: field.placeholder || '',
      oninput: (e) => { set(e.target.value); autogrow(area); },
      onkeydown: (e) => {
        // Entrée insère une nouvelle puce, jamais de soumission implicite.
        if (e.key === 'Enter') e.stopPropagation();
      },
    });
    queueMicrotask(() => autogrow(area));
    return area;
  },

  /* --- mois / année --- */
  month: (field, value, set, { disabled }) => h('input.input', {
    id: controlId(field),
    type: 'month',
    value: value ?? '',
    disabled,
    onchange: (e) => set(e.target.value),
    oninput: (e) => set(e.target.value),
  }),

  /* --- liste déroulante --- */
  select: (field, value, set, { disabled }) => h('select.select', {
    id: controlId(field),
    disabled,
    onchange: (e) => set(e.target.value),
  },
    h('option', { value: '' }, '— Sélectionner —'),
    (field.options || []).map((opt) =>
      h('option', { value: opt, selected: (value ?? '') === opt }, opt)),
  ),

  /* --- case à cocher --- */
  checkbox: (field, value, set) => h('label.checkbox',
    h('input', {
      id: controlId(field),
      type: 'checkbox',
      checked: Boolean(value),
      onchange: (e) => set(e.target.checked),
    }),
    field.label,
  ),

  /* --- niveau à 5 pastilles --- */
  level: (field, value, set) => {
    const current = Math.min(5, Math.max(1, Number(value) || 3));
    const label = h('span.level__name', SKILL_LEVELS[current - 1]);

    const dots = Array.from({ length: 5 }, (_, i) => h('button.level__dot', {
      type: 'button',
      class: i < current ? 'is-on' : null,
      'aria-label': `${SKILL_LEVELS[i]} (${i + 1}/5)`,
      onclick: () => set(i + 1),
    }));

    return h('div.level', h('div.level__dots', dots), label);
  },

  /* --- étiquettes libres --- */
  tags: (field, value, set) => {
    const list = Array.isArray(value) ? [...value] : [];
    const wrap = h('div.tags');

    const input = h('input.tags__input', {
      id: controlId(field),
      type: 'text',
      placeholder: list.length ? 'Ajouter…' : (field.placeholder || 'Saisir puis Entrée'),
      onkeydown: (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          commit(e.target.value);
          e.target.value = '';
        } else if (e.key === 'Backspace' && !e.target.value && list.length) {
          list.pop();
          set([...list]);
          paint();
        }
      },
      onblur: (e) => { commit(e.target.value); e.target.value = ''; },
    });

    const commit = (raw) => {
      const added = String(raw || '').split(',').map((s) => s.trim()).filter(Boolean);
      let changed = false;
      for (const item of added) {
        if (!list.some((x) => x.toLowerCase() === item.toLowerCase())) { list.push(item); changed = true; }
      }
      if (changed) { set([...list]); paint(); }
    };

    const paint = () => {
      wrap.replaceChildren(
        ...list.map((tag, i) => h('span.tag', tag, h('button', {
          type: 'button', 'aria-label': `Retirer ${tag}`,
          onclick: () => { list.splice(i, 1); set([...list]); paint(); input.focus(); },
        }, '×'))),
        input,
      );
      input.placeholder = list.length ? 'Ajouter…' : (field.placeholder || 'Saisir puis Entrée');
    };

    paint();
    wrap.addEventListener('click', (e) => { if (e.target === wrap) input.focus(); });
    return wrap;
  },

  /* --- photo, redimensionnée côté navigateur --- */
  photo: (field, value, set) => {
    const preview = h('div.photo-picker__preview');
    const paint = (src) => {
      preview.replaceChildren(src ? h('img', { src, alt: '' }) : document.createTextNode('👤'));
      removeBtn.classList.toggle('hidden', !src);
    };

    const file = h('input', {
      type: 'file', accept: 'image/*', class: 'hidden',
      onchange: async (e) => {
        const picked = e.target.files?.[0];
        e.target.value = '';
        if (!picked) return;
        if (picked.size > 8 * 1024 * 1024) { toast('Image trop lourde (8 Mo maximum).', 'err'); return; }
        try {
          const dataUrl = await shrinkImage(picked);
          set(dataUrl);
          paint(dataUrl);
        } catch {
          toast('Impossible de lire cette image.', 'err');
        }
      },
    });

    const removeBtn = h('button.btn.btn--sm.hidden', {
      type: 'button',
      onclick: () => { set(''); paint(''); },
    }, 'Retirer');

    paint(value);

    return h('div.photo-picker',
      preview,
      h('div.stack.gap-8',
        h('div.row.gap-8',
          h('button.btn.btn--sm', { type: 'button', onclick: () => file.click() },
            value ? 'Changer la photo' : 'Choisir une photo'),
          removeBtn,
        ),
        h('p.field__help', 'JPEG ou PNG. L’image est redimensionnée automatiquement.'),
        file,
      ),
    );
  },
};

CONTROLS.email = CONTROLS.text;
CONTROLS.tel = CONTROLS.text;
CONTROLS.url = CONTROLS.text;

/* ------------------------------------------------------------- utilitaires */

function autogrow(area) {
  area.style.height = 'auto';
  area.style.height = `${Math.max(area.scrollHeight + 2, 90)}px`;
}

/** Redimensionne et recompresse une image en data-URL (côté client). */
function shrinkImage(file, maxSize = 640) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * ratio);
        const h2 = Math.round(img.height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h2;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h2);
        ctx.drawImage(img, 0, 0, w, h2);

        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
