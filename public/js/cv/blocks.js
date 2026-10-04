/* =====================================================================
   Blocs de contenu réutilisés par tous les modèles de CV.
   Chaque bloc renvoie du HTML — ou une chaîne vide si la rubrique est
   vide, ce qui fait disparaître automatiquement la section du rendu.
   ===================================================================== */

import { icon } from './icons.js';
import { LANG_LEVELS, SKILL_LEVELS, durationLabel, periodLabel } from '../schema.js';

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]);

/** Découpe un champ multiligne en puces exploitables. */
export const toLines = (text) =>
  String(text || '').split('\n').map((l) => l.replace(/^[-–•*]\s*/, '').trim()).filter(Boolean);

export const bullets = (text) => {
  const items = toLines(text);
  return items.length ? `<ul class="bullets">${items.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : '';
};

export const chips = (list) => {
  const items = (list || []).filter(Boolean);
  return items.length ? `<div class="chips">${items.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</div>` : '';
};

/**
 * Enveloppe une rubrique dans son titre. Renvoie '' si le corps est vide.
 * `ico` ajoute une pastille devant l'intitulé (voir icons.js) ; les modèles
 * qui ne la demandent pas ne voient aucun changement de balisage.
 */
export const sec = (title, body, cls = '', ico = '') =>
  body
    ? `<section class="sec ${cls}"><h2 class="sec__title">`
      + (ico ? `<span class="sec__ico">${icon(ico, 12)}</span>` : '')
      + `<span>${esc(title)}</span></h2><div class="sec__body">${body}</div></section>`
    : '';

const href = (url) => {
  const value = String(url || '').trim();
  if (!value) return '';
  return /^(https?:|mailto:|tel:)/i.test(value) ? value : `https://${value}`;
};
const pretty = (url) => String(url || '').replace(/^https?:\/\//i, '').replace(/\/$/, '');

/* ------------------------------------------------------------------ contact */

/** Liste normalisée des coordonnées : [{ key, icon, text, href }] */
export function contactItems(d, { withCivil = true } = {}) {
  const p = d.identite || {};
  const out = [];
  const push = (key, ico, text, link) => { if (text) out.push({ key, icon: ico, text: String(text), href: link || '' }); };

  push('email', 'mail', p.email, `mailto:${p.email}`);
  push('telephone', 'phone', p.telephone, `tel:${String(p.telephone || '').replace(/\s/g, '')}`);
  push('adresse', 'pin', [p.adresse, p.ville, p.pays].filter(Boolean).join(', '));
  push('linkedin', 'linkedin', pretty(p.linkedin), href(p.linkedin));
  push('github', 'github', pretty(p.github), href(p.github));
  push('portfolio', 'globe', pretty(p.portfolio), href(p.portfolio));

  if (withCivil) {
    push('dateNaissance', 'cal', p.dateNaissance);
    push('nationalite', 'id', p.nationalite);
    push('permis', 'car', p.permis);
  }
  return out;
}

export function contactList(d, opts = {}) {
  const items = contactItems(d, opts);
  if (!items.length) return '';
  return `<ul class="contact">${items.map((i) => `
    <li class="contact__item">${icon(i.icon)}<span>${esc(i.text)}</span></li>`).join('')}</ul>`;
}

/** Coordonnées sur une seule ligne, séparées par des points médians. */
export function contactInline(d, opts = {}) {
  const items = contactItems(d, opts);
  if (!items.length) return '';
  return `<div class="contact-inline">${items.map((i) =>
    `<span class="contact-inline__item">${icon(i.icon, 12)}${esc(i.text)}</span>`).join('')}</div>`;
}

export const fullName = (d) => [d.identite?.prenom, d.identite?.nom].filter(Boolean).join(' ') || 'Votre nom';

export function photo(d, cls = 'photo') {
  const src = d.identite?.photo;
  return src ? `<div class="${cls}"><img src="${esc(src)}" alt=""></div>` : '';
}

/* ------------------------------------------------------------------- profil */

export function profil(d) {
  const text = String(d.profil?.accroche || '').trim();
  if (!text) return '';
  return `<p class="lead">${esc(text).replace(/\n+/g, '<br>')}</p>`;
}

/* -------------------------------------------------------------- expériences */

export function experiences(d, { showDuration = true, showTechs = true } = {}) {
  const items = d.experiences || [];
  if (!items.length) return '';

  return items.map((x) => {
    const period = periodLabel(x.debut, x.fin, x.enPoste);
    const duration = showDuration ? durationLabel(x.debut, x.fin, x.enPoste) : '';
    const org = [x.entreprise, x.ville, x.contrat].filter(Boolean);

    return `<article class="entry">
      <div class="entry__side">
        ${period ? `<span class="entry__period">${esc(period)}</span>` : ''}
        ${duration ? `<span class="entry__dur">${esc(duration)}</span>` : ''}
      </div>
      <div class="entry__main">
        <h3 class="entry__title">${esc(x.poste || '')}</h3>
        ${org.length ? `<div class="entry__org">${org.map(esc).join('<span class="dot">·</span>')}</div>` : ''}
        ${bullets(x.description)}
        ${showTechs ? chips(x.technos) : ''}
      </div>
    </article>`;
  }).join('');
}

/* ---------------------------------------------------------------- formation */

export function formations(d) {
  const items = d.formations || [];
  if (!items.length) return '';

  return items.map((x) => {
    const period = periodLabel(x.debut, x.fin, x.enCours);
    const org = [x.etablissement, x.ville].filter(Boolean);

    return `<article class="entry">
      <div class="entry__side">${period ? `<span class="entry__period">${esc(period)}</span>` : ''}</div>
      <div class="entry__main">
        <h3 class="entry__title">${esc(x.diplome || '')}</h3>
        ${org.length ? `<div class="entry__org">${org.map(esc).join('<span class="dot">·</span>')}</div>` : ''}
        ${x.mention ? `<div class="entry__note">${esc(x.mention)}</div>` : ''}
        ${bullets(x.description)}
      </div>
    </article>`;
  }).join('');
}

/* -------------------------------------------------------------- compétences */

function groupSkills(items) {
  const groups = new Map();
  for (const skill of items) {
    if (!skill.nom) continue;
    const key = (skill.categorie || '').trim() || '—';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(skill);
  }
  return groups;
}

/**
 * style : 'bars' | 'dots' | 'chips' | 'list'
 * grouped : affiche les intitulés de catégorie
 */
export function competences(d, { style = 'bars', grouped = true } = {}) {
  const items = (d.competences || []).filter((s) => s.nom);
  if (!items.length) return '';

  const groups = grouped ? groupSkills(items) : new Map([['—', items]]);

  return [...groups].map(([category, skills]) => {
    const head = grouped && category !== '—' ? `<h4 class="grp__title">${esc(category)}</h4>` : '';
    return `<div class="grp">${head}${renderSkills(skills, style)}</div>`;
  }).join('');
}

function renderSkills(skills, style) {
  if (style === 'chips') {
    return `<div class="chips">${skills.map((s) => `<span class="chip">${esc(s.nom)}</span>`).join('')}</div>`;
  }

  return `<ul class="skills skills--${style}">${skills.map((s) => {
    const level = Math.min(5, Math.max(1, Number(s.niveau) || 3));
    let meter = '';
    if (style === 'bars') {
      meter = `<span class="bar"><span class="bar__fill" style="width:${level * 20}%"></span></span>`;
    } else if (style === 'dots') {
      meter = `<span class="dots">${Array.from({ length: 5 }, (_, i) =>
        `<span class="dot-i${i < level ? ' is-on' : ''}"></span>`).join('')}</span>`;
    } else {
      meter = `<span class="skill__lvl">${esc(SKILL_LEVELS[level - 1])}</span>`;
    }
    return `<li class="skill"><span class="skill__name">${esc(s.nom)}</span>${meter}</li>`;
  }).join('')}</ul>`;
}

/* ------------------------------------------------------------------ langues */

const langRatio = (niveau) => {
  const i = LANG_LEVELS.indexOf(niveau);
  return i < 0 ? 0.6 : (i + 1) / LANG_LEVELS.length;
};

/** style : 'bars' | 'list' | 'chips' */
export function langues(d, { style = 'list' } = {}) {
  const items = (d.langues || []).filter((l) => l.langue);
  if (!items.length) return '';

  if (style === 'chips') {
    return `<div class="chips">${items.map((l) =>
      `<span class="chip">${esc(l.langue)}${l.niveau ? ` · ${esc(String(l.niveau).split(' —')[0])}` : ''}</span>`).join('')}</div>`;
  }

  return `<ul class="langs langs--${style}">${items.map((l) => {
    const short = String(l.niveau || '').split(' —')[0];
    const meter = style === 'bars'
      ? `<span class="bar"><span class="bar__fill" style="width:${Math.round(langRatio(l.niveau) * 100)}%"></span></span>`
      : '';
    return `<li class="lang">
      <span class="lang__name">${esc(l.langue)}</span>
      ${meter}
      <span class="lang__lvl">${esc(style === 'bars' ? short : (l.niveau || ''))}</span>
      ${l.precision ? `<span class="lang__note">${esc(l.precision)}</span>` : ''}
    </li>`;
  }).join('')}</ul>`;
}

/* ----------------------------------------------------------- certifications */

export function certifications(d) {
  const items = (d.certifications || []).filter((c) => c.intitule);
  if (!items.length) return '';

  return `<ul class="certs">${items.map((c) => `<li class="cert">
    <span class="cert__name">${esc(c.intitule)}</span>
    ${[c.organisme, c.annee].filter(Boolean).length
      ? `<span class="cert__meta">${[c.organisme, c.annee].filter(Boolean).map(esc).join('<span class="dot">·</span>')}</span>` : ''}
    ${c.url ? `<span class="cert__link">${esc(pretty(c.url))}</span>` : ''}
  </li>`).join('')}</ul>`;
}

/* ------------------------------------------------------------------ projets */

export function projets(d) {
  const items = (d.projets || []).filter((p) => p.nom);
  if (!items.length) return '';

  return items.map((p) => `<article class="entry entry--project">
    <div class="entry__side">${p.annee ? `<span class="entry__period">${esc(p.annee)}</span>` : ''}</div>
    <div class="entry__main">
      <h3 class="entry__title">${esc(p.nom)}</h3>
      ${[p.role, pretty(p.url)].filter(Boolean).length
        ? `<div class="entry__org">${[p.role, pretty(p.url)].filter(Boolean).map(esc).join('<span class="dot">·</span>')}</div>` : ''}
      ${bullets(p.description)}
      ${chips(p.technos)}
    </div>
  </article>`).join('');
}

/* -------------------------------------------------------- centres d'intérêt */

export function interets(d, { style = 'chips' } = {}) {
  const list = (d.interets?.liste || []).filter(Boolean);
  const engagements = toLines(d.interets?.benevolat);
  if (!list.length && !engagements.length) return '';

  const tags = list.length
    ? (style === 'chips'
      ? chips(list)
      : `<p class="inline-list">${list.map(esc).join('<span class="dot">·</span>')}</p>`)
    : '';

  const vol = engagements.length
    ? `<ul class="bullets bullets--tight">${engagements.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`
    : '';

  return tags + vol;
}

/* --------------------------------------------------------------- références */

export function references(d) {
  const items = (d.references || []).filter((r) => r.nom);
  if (!items.length) return '';

  return `<ul class="refs">${items.map((r) => `<li class="ref">
    <span class="ref__name">${esc(r.nom)}</span>
    ${[r.poste, r.entreprise].filter(Boolean).length
      ? `<span class="ref__role">${[r.poste, r.entreprise].filter(Boolean).map(esc).join('<span class="dot">·</span>')}</span>` : ''}
    ${[r.email, r.telephone].filter(Boolean).length
      ? `<span class="ref__contact">${[r.email, r.telephone].filter(Boolean).map(esc).join('<span class="dot">·</span>')}</span>` : ''}
  </li>`).join('')}</ul>`;
}
