/* =====================================================================
   Catalogue des modèles de CV.
   Un modèle = une palette par défaut, une feuille de style et une
   fonction de mise en page qui assemble les blocs communs.
   ===================================================================== */

import * as B from './blocks.js';

const name = (d) => B.esc(B.fullName(d));
const role = (d) => (d.identite?.titre ? `<p class="role">${B.esc(d.identite.titre)}</p>` : '');

/** Nom en deux tons : prénom mis en avant, patronyme à la suite. */
const duoName = (d) => {
  const parts = B.fullName(d).split(' ');
  const first = B.esc(parts.shift() || '');
  const last = B.esc(parts.join(' '));
  return `<b>${first}</b>${last ? ` ${last}` : ''}`;
};

/**
 * Repasse en clair tous les textes d'une zone sombre.
 * Les blocs communs (blocks.js) portent des couleurs foncées explicites :
 * sans cela, un intitulé se retrouve invisible sur un bandeau coloré.
 * À placer en tête du CSS d'un modèle, pour rester surchargeable ensuite.
 */
const onDark = (...scopes) => {
  const rule = (classes, color) =>
    `${scopes.flatMap((s) => classes.map((c) => `${s} ${c}`)).join(', ')} { color: ${color}; }`;
  return [
    rule(['.lead', '.entry__title', '.cert__name', '.ref__name', '.skill__name', '.lang__name'], '#fff'),
    rule(['.entry__org', '.entry__period', '.entry__dur', '.entry__note', '.cert__meta',
      '.ref__role', '.ref__contact', '.contact__item', '.contact-inline',
      '.skill__lvl', '.lang__lvl', '.lang__note', '.grp__title', '.inline-list',
      // Les puces n'ont pas de couleur propre : elles héritaient de l'encre
      // du corps, donc du texte sombre sur un fond sombre.
      '.bullets', '.bullets li'], 'rgba(255, 255, 255, .8)'),
    rule(['.cert__link'], 'rgba(255, 255, 255, .92)'),
  ].join('\n      ');
};

/** Enveloppe un fragment, ou rien du tout s'il est vide. */
const box = (html, cls) => (html ? `<div class="${cls}">${html}</div>` : '');

/* Couleurs proposées dans l'éditeur. */
export const ACCENTS = [
  { id: 'indigo', label: 'Indigo', value: '#4f46e5' },
  { id: 'ardoise', label: 'Ardoise', value: '#334155' },
  { id: 'emeraude', label: 'Émeraude', value: '#047857' },
  { id: 'ocean', label: 'Océan', value: '#0369a1' },
  { id: 'bordeaux', label: 'Bordeaux', value: '#9f1239' },
  { id: 'ambre', label: 'Ambre', value: '#b45309' },
  { id: 'prune', label: 'Prune', value: '#7e22ce' },
  { id: 'graphite', label: 'Graphite', value: '#1f2937' },
];

export const FONT_CHOICES = [
  { id: 'sans', label: 'Sans-serif' },
  { id: 'serif', label: 'Serif' },
  { id: 'mixte', label: 'Mixte' },
];

export const DENSITIES = [
  { id: 'aere', label: 'Aéré', scale: 1.07 },
  { id: 'normal', label: 'Normal', scale: 1 },
  { id: 'compact', label: 'Compact', scale: 0.93 },
];

/* ===================================================================== */

export const TEMPLATES = [
  /* ------------------------------------------------------------ 1. Moderne */
  {
    id: 'moderne',
    name: 'Moderne',
    desc: 'Bandeau latéral coloré, coordonnées et compétences bien séparées du parcours.',
    tags: ['Polyvalent', 'Bandeau latéral'],
    accent: '#4f46e5',
    font: 'sans',
    css: `
      ${onDark('.side__hero', '.side__panel')}
      ${onDark('.side')}
      .page { padding: 0; }
      .page::after { content: ""; display: block; clear: both; }
      /* Barre latérale flottante : elle occupe exactement la première page,
         puis le contenu reprend toute la largeur — pas de bande vide page 2. */
      .side { float: left; width: 264px; min-height: var(--band-h); margin-right: 34px;
        background: var(--side-bg); padding: 34px 24px 40px; color: var(--side-ink); }
      .side .photo { width: 132px; height: 132px; border-radius: 50%; overflow: hidden; margin: 0 auto 22px; border: 3px solid rgba(255,255,255,.35); }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; }
      .side .sec { margin-top: 24px; }
      .side .sec__title { color: #fff; font-size: .92em; letter-spacing: .13em; padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,.28); }
      .side .contact__item { color: var(--side-ink); word-break: break-word; }
      .side .skill__name { color: #fff; font-weight: 500; }
      .side .dot-i { background: rgba(255,255,255,.28); }
      .side .dot-i.is-on { background: #fff; }
      .side .bar { background: rgba(255,255,255,.24); }
      .side .bar__fill { background: #fff; }
      .side .lang__lvl, .side .lang__note { color: rgba(255,255,255,.72); }
      .side .grp__title { color: rgba(255,255,255,.66); }
      .side .chip { background: rgba(255,255,255,.16); color: #fff; }
      .side .bullets li::marker { color: rgba(255,255,255,.6); }

      .main { padding: 40px 42px 44px 40px; }
      /* flow-root : l'en-tête garde son filet à sa largeur, sans passer sous la barre */
      .head { display: flow-root; padding-bottom: 16px; margin-bottom: 4px; border-bottom: 2px solid var(--accent); }
      .name { font-size: 2.35em; font-weight: 800; letter-spacing: -.025em; line-height: 1.05; }
      .role { font-size: 1.06em; color: var(--accent); font-weight: 600; margin-top: 5px; }
    `,
    layout: (d) => `
      <aside class="side">
        ${B.photo(d)}
        ${B.contactList(d)}
        ${B.sec('Compétences', B.competences(d, { style: 'dots' }))}
        ${B.sec('Langues', B.langues(d, { style: 'bars' }))}
        ${B.sec("Centres d'intérêt", B.interets(d))}
      </aside>
      <main class="main">
        <header class="head"><h1 class="name">${name(d)}</h1>${role(d)}</header>
        ${B.sec('Profil', B.profil(d))}
        ${B.sec('Expériences professionnelles', B.experiences(d))}
        ${B.sec('Formation', B.formations(d))}
        ${B.sec('Projets', B.projets(d))}
        ${B.sec('Certifications', B.certifications(d))}
        ${B.sec('Références', B.references(d))}
      </main>`,
  },

  /* ----------------------------------------------------------- 2. Classique */
  {
    id: 'classique',
    name: 'Classique',
    desc: 'Une colonne, en-tête centré et filets fins. La valeur sûre des secteurs traditionnels.',
    tags: ['Sobre', 'ATS'],
    accent: '#1f2937',
    font: 'serif',
    css: `
      .page { padding: 52px 62px 56px; }
      .head { text-align: center; padding-bottom: 18px; border-bottom: 2px solid var(--ink); margin-bottom: 6px; }
      .head .photo { width: 96px; height: 96px; border-radius: 50%; overflow: hidden; margin: 0 auto 14px; }
      .head .photo img { width: 100%; height: 100%; object-fit: cover; }
      .name { font-size: 2.3em; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
      .role { font-size: 1.05em; color: var(--muted); margin-top: 4px; font-style: italic; }
      .contact-inline { justify-content: center; margin-top: 12px; }

      .sec { margin-top: 20px; }
      .sec__title { text-align: center; font-size: .95em; letter-spacing: .18em; color: var(--ink); border-bottom: 1px solid var(--line); padding-bottom: 5px; margin-bottom: 11px; }
      /* période alignée sur la ligne du titre, à droite */
      .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 14px; }
      .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .entry__main { grid-column: 1; grid-row: 1; }
      .entry__title { font-size: 1.08em; }
      .entry__period { font-size: .88em; font-style: italic; }
      .entry__org { font-style: italic; }
      .skills--list .skill { border-bottom: 1px dotted var(--line); padding-bottom: 3px; }
      .grp { margin-bottom: 9px; }
    `,
    layout: (d) => `
      <main class="page-body">
        <header class="head">
          ${B.photo(d)}
          <h1 class="name">${name(d)}</h1>${role(d)}
          ${B.contactInline(d)}
        </header>
        ${B.sec('Profil', B.profil(d))}
        ${B.sec('Expérience professionnelle', B.experiences(d))}
        ${B.sec('Formation', B.formations(d))}
        ${B.sec('Compétences', B.competences(d, { style: 'list' }))}
        ${B.sec('Langues', B.langues(d, { style: 'list' }))}
        ${B.sec('Certifications', B.certifications(d))}
        ${B.sec('Projets', B.projets(d))}
        ${B.sec("Centres d'intérêt", B.interets(d, { style: 'inline' }))}
        ${B.sec('Références', B.references(d))}
      </main>`,
  },

  /* ------------------------------------------------------------ 3. Élégant */
  {
    id: 'elegant',
    name: 'Élégant',
    desc: 'Large bandeau d’en-tête coloré, puis deux colonnes équilibrées. Très lisible.',
    tags: ['Deux colonnes', 'Lisible'],
    accent: '#0369a1',
    font: 'mixte',
    css: `
      ${onDark('.banner')}
      .page { padding: 0; }
      .banner { background: var(--accent); color: #fff; padding: 34px 46px; display: flex; align-items: center; gap: 26px; }
      .banner .photo { width: 108px; height: 108px; border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 3px solid rgba(255,255,255,.4); }
      .banner .photo img { width: 100%; height: 100%; object-fit: cover; }
      .banner .name { font-size: 2.3em; font-weight: 700; letter-spacing: -.02em; line-height: 1.08; }
      .banner .role { font-size: 1.08em; color: rgba(255,255,255,.86); margin-top: 4px; font-weight: 500; }
      .banner .contact-inline { margin-top: 12px; color: rgba(255,255,255,.94); font-size: .84em; }
      .banner .contact-inline__item { opacity: .95; }

      .cols { display: grid; grid-template-columns: 1fr 258px; gap: 34px; padding: 30px 46px 42px; }
      .sec__title { color: var(--accent); border-bottom: 2px solid var(--accent-soft); padding-bottom: 4px; }
      .col-side .sec:first-child { margin-top: 0; }
      .col-side .sec__title { font-size: .88em; }
      .entry { grid-template-columns: 1fr; gap: 2px; }
      .entry__side { display: flex; align-items: baseline; gap: 9px; }
      .entry__period { color: var(--accent); font-weight: 600; }
      .entry__dur { color: var(--muted-2); }
    `,
    layout: (d) => `
      <header class="banner">
        ${B.photo(d)}
        <div>
          <h1 class="name">${name(d)}</h1>${role(d)}
          ${B.contactInline(d, { withCivil: false })}
        </div>
      </header>
      <div class="cols">
        <main class="col-main">
          ${B.sec('Profil', B.profil(d))}
          ${B.sec('Expériences professionnelles', B.experiences(d))}
          ${B.sec('Formation', B.formations(d))}
          ${B.sec('Projets', B.projets(d))}
        </main>
        <aside class="col-side">
          ${B.sec('Informations', B.contactList(d))}
          ${B.sec('Compétences', B.competences(d, { style: 'bars' }))}
          ${B.sec('Langues', B.langues(d, { style: 'list' }))}
          ${B.sec('Certifications', B.certifications(d))}
          ${B.sec("Centres d'intérêt", B.interets(d))}
          ${B.sec('Références', B.references(d))}
        </aside>
      </div>`,
  },

  /* ------------------------------------------------------------- 4. Créatif */
  {
    id: 'creatif',
    name: 'Créatif',
    desc: 'Parcours en frise chronologique et colonne de droite colorée. Pour se démarquer.',
    tags: ['Frise', 'Original'],
    accent: '#7e22ce',
    font: 'sans',
    css: `
      .page { padding: 0; }
      .page::after { content: ""; display: block; clear: both; }
      /* Barre latérale flottante : elle occupe exactement la première page,
         puis le contenu reprend toute la largeur — pas de bande vide page 2. */
      .side { float: right; width: 270px; min-height: var(--band-h); margin-left: 26px;
        background: var(--accent-wash); }

      .main { padding: 40px 34px 44px 46px; }
      .head { margin-bottom: 22px; }
      .name { font-size: 2.4em; font-weight: 800; letter-spacing: -.03em; line-height: 1.02; }
      .name span { color: var(--accent); }
      .role { font-size: 1.04em; color: var(--muted); font-weight: 500; margin-top: 6px; }

      .sec__title { display: flex; align-items: center; gap: 9px; color: var(--accent); }
      .sec__title::before { content: ""; width: 9px; height: 9px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }

      /* la frise ne s'affiche que sur les rubriques faites d'entrées datées */
      .main .sec__body { position: relative; padding-left: 17px; }
      .main .sec__body:has(.entry)::before { content: ""; position: absolute; left: 4px; top: 6px; bottom: 6px; width: 2px; background: var(--accent-soft); }
      .main .entry { grid-template-columns: 1fr; gap: 2px; position: relative; }
      .main .entry::before { content: ""; position: absolute; left: -17px; top: 5px; width: 10px; height: 10px; border-radius: 50%; background: #fff; border: 2.5px solid var(--accent); }
      .entry__side { display: flex; align-items: baseline; gap: 9px; }
      .entry__period { color: var(--accent); font-weight: 700; font-size: .84em; letter-spacing: .03em; text-transform: uppercase; }

      .side { padding: 40px 30px 44px; }
      .side .photo { width: 124px; height: 124px; border-radius: 22px; overflow: hidden; margin-bottom: 20px; border: 3px solid #fff; box-shadow: 0 4px 14px rgba(0,0,0,.12); }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; }
      .side .sec:first-of-type { margin-top: 0; }
      .side .sec__body { padding-left: 0; }
      .side .chip { background: var(--accent); color: #fff; }
    `,
    layout: (d) => {
      const parts = B.fullName(d).split(' ');
      const first = B.esc(parts.shift() || '');
      const last = B.esc(parts.join(' '));
      return `
      <aside class="side">
        ${B.photo(d)}
        ${B.sec('Contact', B.contactList(d))}
        ${B.sec('Compétences', B.competences(d, { style: 'bars' }))}
        ${B.sec('Langues', B.langues(d, { style: 'list' }))}
        ${B.sec('Certifications', B.certifications(d))}
        ${B.sec('Intérêts', B.interets(d))}
        ${B.sec('Références', B.references(d))}
      </aside>
      <main class="main">
        <header class="head">
          <h1 class="name">${first}${last ? ` <span>${last}</span>` : ''}</h1>${role(d)}
        </header>
        ${B.sec('Profil', B.profil(d))}
        ${B.sec('Parcours professionnel', B.experiences(d))}
        ${B.sec('Formation', B.formations(d))}
        ${B.sec('Projets', B.projets(d))}
      </main>`;
    },
  },

  /* ------------------------------------------------------------- 5. Minimal */
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Beaucoup de blanc, typographie soignée, aucune fioriture. Le contenu d’abord.',
    tags: ['Épuré', 'ATS'],
    accent: '#334155',
    font: 'sans',
    css: `
      .page { padding: 62px 68px 60px; }
      .head { margin-bottom: 34px; display: flex; align-items: flex-start;
        justify-content: space-between; gap: 30px; }
      .head .photo { width: 106px; height: 106px; border-radius: 50%; overflow: hidden; flex-shrink: 0; }
      .head .photo img { width: 100%; height: 100%; object-fit: cover; }
      .name { font-size: 2.7em; font-weight: 300; letter-spacing: -.03em; line-height: 1; }
      .role { font-size: 1em; color: var(--muted); margin-top: 10px; letter-spacing: .04em; }
      .contact-inline { margin-top: 16px; font-size: .84em; color: var(--muted); gap: 4px 18px; }

      .sec { margin-top: 26px; display: grid; grid-template-columns: 116px 1fr; gap: 22px; }
      .sec__title { font-size: .78em; letter-spacing: .14em; color: var(--muted-2); font-weight: 600; padding-top: 3px; }
      .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 1px 16px; margin-bottom: 17px; }
      .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .entry__main { grid-column: 1; grid-row: 1; }
      .entry__title { font-weight: 600; font-size: 1.02em; }
      .entry__period { font-size: .84em; color: var(--muted-2); }
      .lead { font-size: 1.02em; line-height: 1.65; }
      .chip { background: transparent; color: var(--muted); border: 1px solid var(--line); }
      .skills--list .skill { margin-bottom: 3px; }
      .grp { margin-bottom: 10px; }
      .grp__title { font-weight: 600; color: var(--ink); letter-spacing: 0; text-transform: none; font-size: .9em; }
    `,
    layout: (d) => `
      <main class="page-body">
        <header class="head">
          <div>
            <h1 class="name">${name(d)}</h1>${role(d)}
            ${B.contactInline(d)}
          </div>
          ${B.photo(d)}
        </header>
        ${B.sec('Profil', B.profil(d))}
        ${B.sec('Expérience', B.experiences(d, { showDuration: false }))}
        ${B.sec('Formation', B.formations(d))}
        ${B.sec('Compétences', B.competences(d, { style: 'list' }))}
        ${B.sec('Langues', B.langues(d, { style: 'list' }))}
        ${B.sec('Projets', B.projets(d))}
        ${B.sec('Certifications', B.certifications(d))}
        ${B.sec('Intérêts', B.interets(d, { style: 'inline' }))}
        ${B.sec('Références', B.references(d))}
      </main>`,
  },

  /* ----------------------------------------------------------- 6. Exécutif */
  {
    id: 'executif',
    name: 'Exécutif',
    desc: 'En-tête sombre et typographie serif. Pensé pour les profils seniors et l’encadrement.',
    tags: ['Senior', 'Premium'],
    accent: '#9f1239',
    font: 'mixte',
    css: `
      ${onDark('.banner')}
      .page { padding: 0; }
      .banner { background: var(--dark); color: #fff; padding: 38px 54px 32px; display: flex; align-items: center; gap: 26px; }
      .banner .photo { width: 104px; height: 104px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 2px solid var(--accent); }
      .banner .photo img { width: 100%; height: 100%; object-fit: cover; }
      .name { font-size: 2.25em; font-weight: 700; letter-spacing: .01em; }
      .role { font-size: .86em; color: var(--accent-light); margin-top: 6px; letter-spacing: .06em; text-transform: uppercase; font-weight: 600; }
      .banner .rule { width: 54px; height: 3px; background: var(--accent); margin: 12px 0; }
      .banner .contact-inline { color: rgba(255,255,255,.78); font-size: .82em; }

      .page-body { padding: 30px 54px 46px; }
      .sec__title { color: var(--dark); border-bottom: 1px solid var(--line); padding-bottom: 5px; letter-spacing: .16em; font-size: .84em; }
      .sec__title span { border-bottom: 2px solid var(--accent); padding-bottom: 5px; }
      .entry { grid-template-columns: 132px 1fr; }
      .entry__period { color: var(--accent); font-weight: 600; font-size: .84em; }
      .entry__title { font-size: 1.08em; }
      .entry__org { font-weight: 500; }
      .lead { font-size: 1.03em; line-height: 1.66; }
      /* les deux colonnes doivent démarrer à la même hauteur */
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0 34px; margin-top: 19px; }
      .two-col > .sec { margin-top: 0; }
      .chip { background: var(--accent-wash); color: var(--accent); }
    `,
    layout: (d) => `
      <header class="banner">
        ${B.photo(d)}
        <div>
          <h1 class="name">${name(d)}</h1>${role(d)}
          <div class="rule"></div>
          ${B.contactInline(d, { withCivil: false })}
        </div>
      </header>
      <main class="page-body">
        ${B.sec('Synthèse', B.profil(d))}
        ${B.sec('Parcours professionnel', B.experiences(d))}
        ${B.sec('Formation', B.formations(d))}
        <div class="two-col">
          ${B.sec('Compétences clés', B.competences(d, { style: 'list' }))}
          ${B.sec('Langues', B.langues(d, { style: 'list' }))}
        </div>
        ${B.sec('Certifications', B.certifications(d))}
        ${B.sec('Projets', B.projets(d))}
        ${B.sec("Centres d'intérêt", B.interets(d, { style: 'inline' }))}
        ${B.sec('Références', B.references(d))}
      </main>`,
  },

  /* ----------------------------------------------------------- 7. Technique */
  {
    id: 'technique',
    name: 'Technique',
    desc: 'Dense et structuré, environnement technique mis en avant. Idéal profils IT et ingénierie.',
    tags: ['Dense', 'IT'],
    accent: '#047857',
    font: 'sans',
    css: `
      .page { padding: 34px 40px 40px; }
      .head { display: flex; align-items: flex-start; gap: 20px; padding-bottom: 14px; border-bottom: 3px solid var(--accent); }
      .head .photo { width: 84px; height: 84px; border-radius: 6px; overflow: hidden; flex-shrink: 0; }
      .head .photo img { width: 100%; height: 100%; object-fit: cover; }
      .name { font-size: 2em; font-weight: 700; letter-spacing: -.02em; }
      .role { font-family: var(--font-mono); font-size: .88em; color: var(--accent); margin-top: 3px; font-weight: 600; }
      .head .contact-inline { margin-top: 9px; font-size: .8em; }

      .cols { display: grid; grid-template-columns: 1fr 232px; gap: 28px; }
      .sec { margin-top: 15px; }
      .sec__title { font-family: var(--font-mono); font-size: .78em; letter-spacing: .08em; color: var(--accent); background: var(--accent-wash); padding: 3px 8px; border-radius: 4px; display: inline-block; }
      .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 1px 12px; margin-bottom: 12px; }
      .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .entry__main { grid-column: 1; grid-row: 1; }
      .entry__title { font-size: 1.02em; }
      .entry__period { font-family: var(--font-mono); font-size: .78em; color: var(--muted-2); }
      .entry__dur { font-family: var(--font-mono); font-size: .76em; }
      .bullets li { margin-bottom: 2px; }
      .chip { font-family: var(--font-mono); font-size: .74em; background: var(--accent-wash); color: var(--accent); border-radius: 3px; }
      .skills--bars .skill { margin-bottom: 6px; }
      .skill__name { font-size: .92em; }
      .grp__title { font-family: var(--font-mono); font-size: .74em; }
      .col-side .contact__item { font-size: .84em; }
    `,
    layout: (d) => `
      <header class="head">
        ${B.photo(d)}
        <div>
          <h1 class="name">${name(d)}</h1>${role(d)}
          ${B.contactInline(d, { withCivil: false })}
        </div>
      </header>
      <div class="cols">
        <main class="col-main">
          ${B.sec('Profil', B.profil(d))}
          ${B.sec('Expériences', B.experiences(d))}
          ${B.sec('Projets', B.projets(d))}
          ${B.sec('Formation', B.formations(d))}
        </main>
        <aside class="col-side">
          ${B.sec('Contact', B.contactList(d))}
          ${B.sec('Stack & compétences', B.competences(d, { style: 'bars' }))}
          ${B.sec('Langues', B.langues(d, { style: 'list' }))}
          ${B.sec('Certifications', B.certifications(d))}
          ${B.sec('Intérêts', B.interets(d))}
          ${B.sec('Références', B.references(d))}
        </aside>
      </div>`,
  },

  /* -------------------------------------------------------------- 8. Suisse */
  {
    id: 'suisse',
    name: 'Suisse',
    desc: 'Grille typographique stricte, rubriques numérotées et filets marqués. Très structuré.',
    tags: ['Grille', 'Affirmé'],
    accent: '#dc2626',
    font: 'sans',
    css: `
      .page { padding: 46px 52px 50px; counter-reset: sec; }

      .head { display: flex; align-items: flex-end; justify-content: space-between; gap: 26px;
        padding-bottom: 15px; border-bottom: 4px solid var(--ink); }
      .head .photo { width: 90px; height: 90px; overflow: hidden; flex-shrink: 0; }
      .head .photo img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) contrast(1.05); }
      .name { font-size: 2.5em; font-weight: 800; text-transform: uppercase; letter-spacing: -.02em; line-height: .95; }
      .role { font-size: .82em; font-weight: 700; color: var(--accent); margin-top: 9px;
        text-transform: uppercase; letter-spacing: .1em; }
      .contact-inline { margin-top: 13px; font-size: .8em; gap: 3px 16px; }

      /* rubrique = numéro + intitulé en gouttière, contenu à droite */
      .sec { display: grid; grid-template-columns: 128px minmax(0, 1fr); gap: 0 26px;
        margin-top: 17px; padding-top: 14px; border-top: 1px solid var(--line); }
      .sec__title { display: flex; flex-direction: column; align-items: flex-start; gap: 7px;
        font-size: .76em; letter-spacing: .11em; color: var(--ink); margin-bottom: 0; }
      .sec__title::before { counter-increment: sec; content: counter(sec, decimal-leading-zero);
        font-size: 2.3em; line-height: .9; font-weight: 800; color: var(--accent); letter-spacing: -.03em; }

      .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 16px; }
      .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .entry__main { grid-column: 1; grid-row: 1; }
      .entry__period { text-transform: uppercase; letter-spacing: .05em; font-size: .78em; }
      .entry__title { font-size: 1.04em; font-weight: 700; }
      .chip { border-radius: 0; background: var(--ink); color: #fff; font-weight: 500; }
      .grp__title { color: var(--accent); }
      .bar { border-radius: 0; height: 5px; }
      .bar__fill { border-radius: 0; }
    `,
    layout: (d) => `
      <main class="page-body">
        <header class="head">
          <div>
            <h1 class="name">${name(d)}</h1>${role(d)}
            ${B.contactInline(d)}
          </div>
          ${B.photo(d)}
        </header>
        ${B.sec('Profil', B.profil(d))}
        ${B.sec('Expérience', B.experiences(d))}
        ${B.sec('Formation', B.formations(d))}
        ${B.sec('Compétences', B.competences(d, { style: 'bars' }))}
        ${B.sec('Langues', B.langues(d, { style: 'list' }))}
        ${B.sec('Projets', B.projets(d))}
        ${B.sec('Certifications', B.certifications(d))}
        ${B.sec('Intérêts', B.interets(d))}
        ${B.sec('Références', B.references(d))}
      </main>`,
  },

  /* ---------------------------------------------------------- 9. Académique */
  {
    id: 'academique',
    name: 'Académique',
    desc: 'Dates en gouttière et serif sobre. Pour les parcours longs, la recherche et l’enseignement.',
    tags: ['Sobre', 'Recherche'],
    accent: '#334155',
    font: 'serif',
    css: `
      .page { padding: 54px 62px 56px; }

      .head { padding-bottom: 15px; border-bottom: 1px solid var(--line);
        display: flex; align-items: flex-start; justify-content: space-between; gap: 28px; }
      .head .photo { width: 94px; height: 94px; border-radius: 4px; overflow: hidden; flex-shrink: 0; }
      .head .photo img { width: 100%; height: 100%; object-fit: cover; }
      .name { font-size: 2.15em; font-weight: 700; letter-spacing: .01em; }
      .role { font-size: 1.02em; font-style: italic; color: var(--muted); margin-top: 4px; }
      .contact-inline { margin-top: 12px; font-size: .84em; gap: 3px 17px; }

      .sec { margin-top: 21px; }
      .sec__title { font-size: .8em; letter-spacing: .15em; color: var(--ink);
        border-bottom: 1px solid var(--line); padding-bottom: 4px; margin-bottom: 11px; }

      /* dates dans la gouttière gauche, à la manière d'un CV universitaire */
      .entry { grid-template-columns: 102px minmax(0, 1fr); gap: 0 18px; margin-bottom: 13px; }
      .entry__period { font-size: .84em; font-weight: 600; color: var(--muted); }
      .entry__dur { font-size: .76em; }
      .entry__title { font-size: 1.03em; }
      .entry__org { font-style: italic; }

      .lead { text-align: justify; }
      .chips { gap: 2px 13px; margin-top: 5px; }
      .chip { background: transparent; color: var(--muted); padding: 0; border-radius: 0;
        font-size: .84em; font-style: italic; }
      .skills--list .skill { margin-bottom: 3px; }
      .grp__title { letter-spacing: .04em; font-size: .82em; }
      .certs, .refs { gap: 6px; }
    `,
    layout: (d) => `
      <main class="page-body">
        <header class="head">
          <div>
            <h1 class="name">${name(d)}</h1>${role(d)}
            ${B.contactInline(d)}
          </div>
          ${B.photo(d)}
        </header>
        ${B.sec('Présentation', B.profil(d))}
        ${B.sec('Formation', B.formations(d))}
        ${B.sec('Expérience professionnelle', B.experiences(d, { showDuration: false }))}
        ${B.sec('Travaux & projets', B.projets(d))}
        ${B.sec('Certifications', B.certifications(d))}
        ${B.sec('Compétences', B.competences(d, { style: 'list' }))}
        ${B.sec('Langues', B.langues(d, { style: 'list' }))}
        ${B.sec('Activités', B.interets(d, { style: 'inline' }))}
        ${B.sec('Références', B.references(d))}
      </main>`,
  },

  /* ------------------------------------------------------------- 10. Cartes */
  {
    id: 'cartes',
    name: 'Cartes',
    desc: 'Chaque rubrique dans un bloc arrondi sur fond teinté. Lecture aérée et très lisible.',
    tags: ['Aéré', 'Deux colonnes'],
    accent: '#0d9488',
    font: 'sans',
    css: `
      body { background: #eef1f6; }
      .page { padding: 22px; }

      .head { background: #fff; border: 1px solid #e2e7f0; border-radius: 16px;
        padding: 21px 24px; display: flex; align-items: center; gap: 21px; }
      .head .photo { width: 94px; height: 94px; border-radius: 15px; overflow: hidden; flex-shrink: 0; }
      .head .photo img { width: 100%; height: 100%; object-fit: cover; }
      .name { font-size: 2em; font-weight: 800; letter-spacing: -.025em; }
      .role { font-size: 1em; color: var(--accent); font-weight: 600; margin-top: 3px; }
      .head .contact-inline { margin-top: 10px; font-size: .82em; }

      .cols { display: grid; grid-template-columns: minmax(0, 1fr) 244px; gap: 13px; align-items: start; margin-top: 13px; }
      /* Colonnes en flux normal, pas en grille : une grille ajoute son écart
         autour des cales de pagination et fait diverger l'aperçu du PDF. */
      .col-main > .sec, .col-side > .sec { margin-top: 13px; }
      .col-main > .sec:first-child, .col-side > .sec:first-child { margin-top: 0; }

      /* la carte, c'est la rubrique elle-même */
      /* Pas de break-inside ici : c'est __cvLayout() qui décide des coupures,
         une règle concurrente ferait diverger l'aperçu du PDF. */
      .sec { background: #fff; border: 1px solid #e2e7f0; border-radius: 16px;
        padding: 15px 18px 17px; margin-top: 0; }
      .sec__title { color: var(--accent); font-size: .8em; margin-bottom: 10px; }
      .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 14px; margin-bottom: 13px;
        padding-bottom: 13px; border-bottom: 1px solid #eef1f6; }
      .entry:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: 0; }
      .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .entry__main { grid-column: 1; grid-row: 1; }
      .entry__period { font-size: .82em; }
      .chip { background: var(--accent-wash); color: var(--accent-deep); }
      .col-side .sec { padding: 14px 16px 16px; }
      .col-side .contact__item { font-size: .85em; }
    `,
    layout: (d) => `
      <header class="head">
        ${B.photo(d)}
        <div>
          <h1 class="name">${name(d)}</h1>${role(d)}
          ${B.contactInline(d, { withCivil: false })}
        </div>
      </header>
      <div class="cols">
        <main class="col-main">
          ${B.sec('Profil', B.profil(d))}
          ${B.sec('Expériences professionnelles', B.experiences(d))}
          ${B.sec('Formation', B.formations(d))}
          ${B.sec('Projets', B.projets(d))}
        </main>
        <aside class="col-side">
          ${B.sec('Coordonnées', B.contactList(d))}
          ${B.sec('Compétences', B.competences(d, { style: 'dots' }))}
          ${B.sec('Langues', B.langues(d, { style: 'list' }))}
          ${B.sec('Certifications', B.certifications(d))}
          ${B.sec("Centres d'intérêt", B.interets(d))}
          ${B.sec('Références', B.references(d))}
        </aside>
      </div>`,
  },

  /* ---------------------------------------------------------- 11. Corporate */
  {
    id: 'corporate',
    name: 'Corporate',
    desc: 'Bandeau nominatif plein, bande de coordonnées puis une colonne large. Ton institutionnel.',
    tags: ['Institutionnel', 'Une colonne'],
    accent: '#1d4ed8',
    font: 'mixte',
    css: `
      ${onDark('.banner')}
      .page { padding: 0; }

      .banner { background: var(--accent); color: #fff; padding: 28px 46px 26px;
        display: flex; align-items: center; gap: 24px; }
      .banner .photo { width: 96px; height: 96px; border-radius: 50%; overflow: hidden;
        flex-shrink: 0; order: 2; margin-left: auto; border: 3px solid rgba(255, 255, 255, .45); }
      .banner .photo img { width: 100%; height: 100%; object-fit: cover; }
      .name { font-size: 2.15em; font-weight: 700; letter-spacing: -.01em; }
      .role { font-size: 1em; color: rgba(255, 255, 255, .86); margin-top: 5px; font-weight: 500; }

      /* bande de coordonnées, pleine largeur, sous le bandeau */
      .strip { background: var(--accent-wash); border-bottom: 1px solid var(--accent-soft); padding: 11px 46px; }
      .strip .contact-inline { font-size: .82em; color: var(--accent-deep); gap: 3px 18px; }
      .strip .ico { opacity: .85; }

      .page-body { padding: 26px 46px 44px; }
      .sec__title { position: relative; padding-left: 13px; color: var(--ink); font-size: .84em; }
      .sec__title::before { content: ""; position: absolute; left: 0; top: 1px; bottom: 1px;
        width: 4px; background: var(--accent); border-radius: 2px; }

      .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 16px; }
      .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .entry__main { grid-column: 1; grid-row: 1; }
      .entry__period { color: var(--accent); font-weight: 600; font-size: .84em; }
      .entry__title { font-size: 1.05em; }
      /* les deux colonnes doivent démarrer à la même hauteur */
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0 32px; margin-top: 19px; }
      .two-col > .sec { margin-top: 0; }
      .chip { background: var(--accent-wash); color: var(--accent-deep); }
    `,
    layout: (d) => `
      <header class="banner">
        ${B.photo(d)}
        <div>
          <h1 class="name">${name(d)}</h1>${role(d)}
        </div>
      </header>
      <div class="strip">${B.contactInline(d)}</div>
      <main class="page-body">
        ${B.sec('Profil', B.profil(d))}
        ${B.sec('Expériences professionnelles', B.experiences(d))}
        ${B.sec('Formation', B.formations(d))}
        <div class="two-col">
          ${B.sec('Compétences', B.competences(d, { style: 'bars' }))}
          ${B.sec('Langues', B.langues(d, { style: 'list' }))}
        </div>
        ${B.sec('Certifications', B.certifications(d))}
        ${B.sec('Projets', B.projets(d))}
        ${B.sec("Centres d'intérêt", B.interets(d))}
        ${B.sec('Références', B.references(d))}
      </main>`,
  },
  /* ----------------------------------------------------------- 12. Émeraude */
  {
    id: 'emeraude',
    name: 'Émeraude',
    desc: 'Colonne verte à blocs arrondis et titres à pastilles. Contact, formation et références réunis à gauche.',
    tags: ['Bandeau latéral', 'Pastilles'],
    accent: '#4a8b5c',
    font: 'sans',
    css: `
      body {
        --band: color-mix(in srgb, var(--accent) 32%, #fff);
        --deep: color-mix(in srgb, var(--accent) 96%, #06180f);
      }
      .page { padding: 0; }
      .page::after { content: ""; display: block; clear: both; }

      /* Barre latérale flottante : elle occupe exactement la première page,
         puis le contenu reprend toute la largeur — pas de bande vide page 2. */
      .side { float: left; width: 268px; min-height: var(--band-h); margin-right: 30px;
        background: var(--band); display: flex; flex-direction: column; }
      .side__hero { background: var(--deep); color: #fff; text-align: center;
        padding: 26px 20px 30px; border-radius: 0 0 130px 130px; }
      .side__hero .name { font-size: 1.68em; font-weight: 800; text-transform: uppercase; line-height: 1.08; }
      .side__hero .role { font-size: .76em; letter-spacing: .16em; text-transform: uppercase;
        color: rgba(255, 255, 255, .78); margin-top: 6px; }
      .side__hero .photo { width: 156px; height: 156px; border-radius: 50%; overflow: hidden;
        margin: 20px auto 0; border: 3px solid rgba(255, 255, 255, .5); }
      .side__hero .photo img { width: 100%; height: 100%; object-fit: cover; }

      .side__mid { padding: 26px 22px 30px; }
      .side__panel { background: var(--deep); color: #fff; border-radius: 130px 130px 0 0;
        padding: 34px 22px 30px; flex: 1; }

      .sec__title { display: flex; align-items: center; gap: 9px; font-size: .95em;
        font-weight: 800; letter-spacing: .05em; }
      .sec__ico { width: 23px; height: 23px; border-radius: 50%; }

      .side__mid .sec__title { color: var(--deep); }
      .side__mid .sec__ico { background: var(--deep); color: #fff; }
      .side__mid .contact__item { color: #1b3527; font-weight: 500; }

      .side__panel .sec { margin-top: 24px; }
      .side__panel .sec__title { color: #fff; }
      .side__panel .sec__ico { background: #fff; color: var(--deep); }
      .side__panel .entry { grid-template-columns: 1fr; gap: 0; margin-bottom: 13px; }
      .side__panel .entry__main { grid-column: 1; grid-row: 1; }
      .side__panel .entry__side { grid-column: 1; grid-row: 2; text-align: left; }
      .side__panel .entry__note { color: rgba(255, 255, 255, .75); }
      .side__panel .bullets { padding-left: 13px; font-size: .84em; }
      .side__panel .bullets li::marker { color: rgba(255, 255, 255, .55); }
      .side__panel .entry__title, .side__panel .ref__name { color: #fff; font-size: .92em; text-transform: uppercase; }
      .side__panel .entry__org, .side__panel .entry__period,
      .side__panel .ref__role, .side__panel .ref__contact { color: rgba(255, 255, 255, .8); font-size: .82em; }

      .main { padding: 34px 38px 44px 40px; }
      .main .sec { margin-top: 26px; }
      .main .sec__title { color: #1c1c1c; font-size: 1.04em; }
      .main .sec__ico { background: #2b2b2b; color: #fff; }
      .main .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 14px; }
      .main .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .main .entry__main { grid-column: 1; grid-row: 1; }
      .main .entry__title { text-transform: uppercase; font-size: 1em; }
      .main .entry__org { font-style: italic; }

      .main .skills { display: grid; grid-template-columns: 1fr 1fr; gap: 0 22px; }
      .main .skills--bars .skill { grid-template-columns: 1fr 66px; align-items: center; gap: 8px; margin-bottom: 6px; }
      .main .skill__name { font-size: .78em; font-weight: 700; }
      .main .bar { height: 6px; background: #d9d9d9; }
      .main .bar__fill { background: #2b2b2b; }

      .duo { display: grid; grid-template-columns: 1fr 1fr; gap: 0 26px; margin-top: 26px; }
      .duo > .sec { margin-top: 0; }
      .duo .chips { display: grid; gap: 5px; margin-top: 0; }
      .duo .chip { background: none; color: #1c1c1c; padding: 0; font-size: .82em;
        font-weight: 700; text-transform: uppercase; white-space: normal; }
      .duo .chip::before { content: "● "; color: var(--accent); }
    `,
    layout: (d) => `
      <aside class="side">
        <div class="side__hero">
          <h1 class="name">${name(d)}</h1>${role(d)}
          ${B.photo(d)}
        </div>
        <div class="side__mid">
          ${B.sec('Contact', B.contactList(d), '', 'user')}
        </div>
        <div class="side__panel">
          ${B.sec('Formation', B.formations(d), '', 'cap')}
          ${B.sec('Références', B.references(d), '', 'users')}
        </div>
      </aside>
      <main class="main">
        ${B.sec('À propos', B.profil(d), '', 'user')}
        ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
        <div class="duo">
          ${B.sec('Langues', B.langues(d, { style: 'chips' }), '', 'globe')}
          ${B.sec('Intérêts', B.interets(d), '', 'flag')}
        </div>
        ${B.sec('Projets', B.projets(d), '', 'spark')}
        ${B.sec('Certifications', B.certifications(d), '', 'award')}
      </main>`,
  },

  /* ------------------------------------------------------------ 13. Encadré */
  {
    id: 'encadre',
    name: 'Encadré',
    desc: 'Panneaux bordés, marqueurs carrés et nom en deux tons. Un rendu net et très ordonné.',
    tags: ['Panneaux', 'Frise'],
    accent: '#6faa3a',
    font: 'sans',
    css: `
      ${onDark('.sec--fill')}
      .page { padding: 30px 32px 36px; }
      .page::after { content: ""; display: block; clear: both; }

      /* Colonne flottante : elle s'arrête au bas de la première page, le
         contenu reprend ensuite toute la largeur au lieu de laisser un vide. */
      .side { float: left; width: 244px; margin-right: 28px;
        min-height: calc(var(--band-h) - 30px); }

      .side .name { font-size: 1.85em; font-weight: 800; text-transform: uppercase;
        letter-spacing: -.02em; line-height: 1.02; }
      .side .name b { color: var(--accent); display: block; font-weight: 800; }
      .side .role { font-size: .74em; letter-spacing: .12em; text-transform: uppercase; color: var(--muted);
        margin-top: 7px; border-top: 1px solid var(--line); padding-top: 7px; }
      .side .photo { width: 100%; aspect-ratio: 1; overflow: hidden; margin-top: 16px;
        border-radius: 50% 50% 44% 44%; border: 3px solid var(--accent); }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; }

      .side .sec { margin-top: 16px; border: 1px solid var(--line); border-radius: 11px; padding: 12px 14px 14px; }
      .side .sec__title { text-align: center; color: var(--ink); font-size: .86em; letter-spacing: .1em;
        border-bottom: 1px solid var(--accent); padding-bottom: 6px; margin-bottom: 10px; }
      .side .sec--fill { background: var(--accent); border-color: var(--accent); }
      .side .sec--fill .sec__title { color: #fff; border-bottom-color: rgba(255, 255, 255, .5); }
      .side .sec--fill .lang__name, .side .sec--fill .lang__lvl { color: #fff; }
      .side .sec--fill .bar { background: rgba(255, 255, 255, .35); }
      .side .sec--fill .bar__fill { background: #fff; }
      .side .chips { display: grid; gap: 6px; margin-top: 0; }
      .side .chip { background: none; color: var(--ink); padding: 0; font-size: .84em; white-space: normal; }
      .side .chip::before { content: "● "; color: var(--accent); }
      .side .ref { padding-bottom: 7px; border-bottom: 1px solid var(--line); }
      .side .ref:last-child { padding-bottom: 0; border-bottom: 0; }

      /* flow-root : cf. Jalons — le trait de liaison et les marqueurs carrés
         doivent se caler sur une boîte placée à côté de la colonne. */
      .main .sec { display: flow-root; margin-top: 20px; }
      .main .sec__title { display: flex; align-items: center; gap: 9px; color: var(--ink); font-size: .96em; }
      .main .sec__ico { color: var(--accent); }

      /* marqueur carré et trait de liaison le long du parcours */
      .main .sec__body:has(.entry) { position: relative; padding-left: 18px; }
      .main .sec__body:has(.entry)::before { content: ""; position: absolute; left: 3px; top: 9px; bottom: 9px;
        width: 1px; background: var(--line); }
      .main .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 14px; position: relative; }
      .main .entry::before { content: ""; position: absolute; left: -18px; top: 3px;
        width: 7px; height: 15px; background: var(--accent); border-radius: 2px; }
      .main .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .main .entry__main { grid-column: 1; grid-row: 1; }
      .main .entry__title { text-transform: uppercase; font-size: 1em; }

      .contact-grid { border: 1px solid var(--line); border-radius: 11px; overflow: hidden; }
      .contact-grid .contact { gap: 0; }
      .contact-grid .contact__item { padding: 8px 13px; border-bottom: 1px solid var(--line); align-items: center; }
      .contact-grid .contact__item:last-child { border-bottom: 0; }
      .contact-grid .ico { color: var(--accent); margin-top: 0; }
    `,
    layout: (d) => `
      <aside class="side">
        <h1 class="name">${duoName(d)}</h1>${role(d)}
        ${B.photo(d)}
        ${B.sec('Langues', B.langues(d, { style: 'bars' }), 'sec--fill')}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }))}
        ${B.sec('Intérêts', B.interets(d))}
        ${B.sec('Références', B.references(d))}
      </aside>
      <main class="main">
        ${B.sec('À propos', B.profil(d), '', 'user')}
        ${B.sec('Contact', box(B.contactList(d), 'contact-grid'), '', 'pin')}
        ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
        ${B.sec('Formation', B.formations(d), '', 'cap')}
        ${B.sec('Projets', B.projets(d), '', 'spark')}
        ${B.sec('Certifications', B.certifications(d), '', 'award')}
      </main>`,
  },

  /* ------------------------------------------------------------- 14. Agrume */
  {
    id: 'agrume',
    name: 'Agrume',
    desc: 'Colonne noire à droite, panneau orange arrondi et titres à pastilles. Contraste marqué.',
    tags: ['Colonne droite', 'Contrasté'],
    accent: '#f2711c',
    font: 'sans',
    css: `
      ${onDark('.side')}
      body { --panel: #1d1d1f; }
      .page { padding: 0; }
      .page::after { content: ""; display: block; clear: both; }
      /* Barre latérale flottante : elle occupe exactement la première page,
         puis le contenu reprend toute la largeur — pas de bande vide page 2. */
      .side { float: right; width: 268px; min-height: var(--band-h); margin-left: 26px;
        background: var(--panel); }

      .sec__title { display: flex; align-items: center; gap: 9px; font-weight: 800; font-size: 1.02em; }
      .sec__ico { width: 23px; height: 23px; border-radius: 50%; background: var(--accent); color: #fff; }

      .main { padding: 34px 28px 44px 40px; }
      /* flow-root : le filet de séparation s'arrête avant la barre latérale */
      .main .sec { display: flow-root; margin-top: 20px; padding-top: 17px; border-top: 1px solid #dadada; }
      .main .sec:first-of-type { margin-top: 0; padding-top: 0; border-top: 0; }
      .main .sec__title { color: #1c1c1c; }
      .main .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 14px; }
      .main .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .main .entry__main { grid-column: 1; grid-row: 1; }
      .main .entry__title { text-transform: uppercase; font-size: 1em; }
      .main .entry__org { font-style: italic; }
      .main .entry__period { color: var(--accent); font-weight: 700; }

      .main .skills { display: grid; grid-template-columns: 1fr 1fr; gap: 0 22px; }
      .main .skills--bars .skill { grid-template-columns: 1fr 68px; align-items: center; gap: 8px; margin-bottom: 6px; }
      .main .skill__name { font-size: .78em; }
      .main .bar { height: 8px; border: 1px solid var(--accent); background: #fff; }
      .main .bar__fill { background: var(--accent); }

      .duo { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px;
        margin-top: 20px; padding-top: 17px; border-top: 1px solid #dadada; }
      .duo > .sec { margin-top: 0; padding-top: 0; border-top: 0; }
      .duo .chips { display: grid; gap: 5px; margin-top: 0; }
      .duo .chip { background: none; color: #1c1c1c; padding: 0; font-size: .82em;
        font-weight: 700; text-transform: uppercase; white-space: normal; }
      .duo .chip::before { content: "● "; color: var(--accent); }

      .side { color: #fff; display: flex; flex-direction: column; }
      .side__hero { padding: 30px 24px 4px; text-align: center; }
      .side__hero .name { font-size: 1.58em; font-weight: 800; text-transform: uppercase;
        color: var(--accent); line-height: 1.1; }
      .side__hero .role { font-size: .74em; letter-spacing: .16em; text-transform: uppercase;
        color: rgba(255, 255, 255, .72); margin-top: 5px; }
      .side__hero .photo { width: 150px; height: 150px; border-radius: 50%; overflow: hidden;
        margin: 18px auto 0; border: 4px solid #fff; }
      .side__hero .photo img { width: 100%; height: 100%; object-fit: cover; }
      .side__mid { padding: 22px 24px 26px; }
      .side .sec__title { color: #fff; font-size: .95em; }
      .side .contact__item { color: rgba(255, 255, 255, .9); }

      .side__panel { background: var(--accent); border-radius: 148px 148px 0 0; padding: 34px 24px 30px; flex: 1; }
      .side__panel .sec { margin-top: 24px; }
      .side__panel .sec__ico { background: #fff; color: var(--accent); }
      .side__panel .entry { grid-template-columns: 1fr; gap: 0; margin-bottom: 13px; }
      .side__panel .entry__main { grid-column: 1; grid-row: 1; }
      .side__panel .entry__side { grid-column: 1; grid-row: 2; text-align: left; }
      .side__panel .entry__note { color: rgba(255, 255, 255, .75); }
      .side__panel .bullets { padding-left: 13px; font-size: .84em; }
      .side__panel .bullets li::marker { color: rgba(255, 255, 255, .7); }
      .side__panel .entry__title, .side__panel .ref__name { color: #fff; font-size: .92em; text-transform: uppercase; }
      .side__panel .entry__org, .side__panel .entry__period,
      .side__panel .ref__role, .side__panel .ref__contact { color: rgba(255, 255, 255, .88); font-size: .82em; }
    `,
    layout: (d) => `
      <aside class="side">
        <div class="side__hero">
          <h1 class="name">${name(d)}</h1>${role(d)}
          ${B.photo(d)}
        </div>
        <div class="side__mid">
          ${B.sec('Contact', B.contactList(d), '', 'user')}
        </div>
        <div class="side__panel">
          ${B.sec('Formation', B.formations(d), '', 'cap')}
          ${B.sec('Références', B.references(d), '', 'users')}
        </div>
      </aside>
      <main class="main">
        ${B.sec('À propos', B.profil(d), '', 'user')}
        ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
        <div class="duo">
          ${B.sec('Langues', B.langues(d, { style: 'chips' }), '', 'globe')}
          ${B.sec('Intérêts', B.interets(d), '', 'flag')}
        </div>
        ${B.sec('Projets', B.projets(d), '', 'spark')}
        ${B.sec('Certifications', B.certifications(d), '', 'award')}
      </main>`,
  },

  /* -------------------------------------------------------------- 15. Lagon */
  {
    id: 'lagon',
    name: 'Lagon',
    desc: 'Colonne turquoise détachée du bord, badges carrés et jauges fines sur deux colonnes.',
    tags: ['Bandeau détaché', 'Frais'],
    accent: '#1f8a80',
    font: 'sans',
    css: `
      ${onDark('.side')}
      body { --deep: color-mix(in srgb, var(--accent) 96%, #04211f); }
      .page { padding: 0; }
      .page::after { content: ""; display: block; clear: both; }
      /* Barre latérale flottante : elle occupe exactement la première page,
         puis le contenu reprend toute la largeur — pas de bande vide page 2. */
      .side { float: left; width: 262px; min-height: var(--band-h); margin-right: 28px;
        background: linear-gradient(to right, #fff 0 18px, var(--deep) 18px);
        color: #fff; padding: 0 22px 34px 40px; }
      .side .photo { width: 148px; height: 148px; border-radius: 50%; overflow: hidden;
        margin: 30px auto 6px; border: 4px solid rgba(255, 255, 255, .45); }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; }
      .side .sec { margin-top: 24px; }
      .side .sec__title { display: flex; align-items: center; gap: 9px; color: #fff;
        font-size: .92em; font-weight: 700; letter-spacing: .1em; }
      .side .sec__ico { width: 20px; height: 20px; border-radius: 4px; background: #fff; color: var(--deep); }
      .side .contact__item { color: rgba(255, 255, 255, .9); font-size: .82em; }
      .side .entry { grid-template-columns: 1fr; gap: 0; margin-bottom: 12px; }
      .side .entry__main { grid-column: 1; grid-row: 1; }
      .side .entry__side { grid-column: 1; grid-row: 2; text-align: left; }
      .side .entry__note { color: rgba(255, 255, 255, .72); }
      .side .bullets { padding-left: 13px; font-size: .84em; }
      .side .bullets li::marker { color: rgba(255, 255, 255, .6); }
      .side .entry__title, .side .ref__name { color: #fff; font-size: .88em; text-transform: uppercase; }
      .side .entry__org, .side .entry__period,
      .side .ref__role, .side .ref__contact { color: rgba(255, 255, 255, .8); font-size: .8em; }

      .main { padding: 40px 40px 44px 40px; }
      .head { margin-bottom: 24px; }
      .name { font-size: 2.05em; font-weight: 800; text-transform: uppercase; letter-spacing: -.01em; }
      .name b { color: var(--accent); font-weight: 800; }
      .role { font-size: .78em; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); margin-top: 5px; }
      .main .sec { margin-top: 22px; }
      .main .sec__title { display: flex; align-items: center; gap: 9px; color: #1c1c1c; font-size: .98em; }
      .main .sec__ico { width: 20px; height: 20px; border-radius: 4px; background: var(--accent); color: #fff; }
      .main .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 14px; }
      .main .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .main .entry__main { grid-column: 1; grid-row: 1; }
      .main .entry__title { text-transform: uppercase; font-size: .98em; }
      .main .entry__org { font-style: italic; }

      .main .skills { display: grid; grid-template-columns: 1fr 1fr; gap: 0 22px; }
      .main .skills--bars .skill { grid-template-columns: 1fr 72px; align-items: center; gap: 8px; margin-bottom: 5px; }
      .main .skill__name { font-size: .76em; }
      .main .bar { height: 5px; background: #dee4e5; }
    `,
    layout: (d) => `
      <aside class="side">
        ${B.photo(d)}
        ${B.sec('Contact', B.contactList(d), '', 'user')}
        ${B.sec('Références', B.references(d), '', 'users')}
        ${B.sec('Formation', B.formations(d), '', 'cap')}
        ${B.sec('Langues', B.langues(d, { style: 'list' }), '', 'globe')}
      </aside>
      <main class="main">
        <header class="head"><h1 class="name">${duoName(d)}</h1>${role(d)}</header>
        ${B.sec('À propos', B.profil(d), '', 'user')}
        ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
        ${B.sec('Projets', B.projets(d), '', 'spark')}
        ${B.sec('Certifications', B.certifications(d), '', 'award')}
        ${B.sec('Intérêts', B.interets(d), '', 'flag')}
      </main>`,
  },

  /* ------------------------------------------------------------ 16. Affiche */
  {
    id: 'affiche',
    name: 'Affiche',
    desc: 'Titres en bandeaux pleins, colonne sombre à droite et grandes jauges. Très graphique.',
    tags: ['Graphique', 'Aplats'],
    accent: '#f28c12',
    font: 'sans',
    css: `
      ${onDark('.col-side', '.head__band')}
      body { --panel: #2c2c2e; }
      .page { padding: 0; }

      .head { height: var(--head-h); background: #fff; display: flex; align-items: center;
        gap: 22px; padding: 0 0 0 34px; }
      .head .photo { width: 146px; height: 146px; border-radius: 50%; overflow: hidden;
        flex-shrink: 0; border: 6px solid var(--panel); }
      .head .photo img { width: 100%; height: 100%; object-fit: cover; }
      .head__band { background: var(--accent); color: #fff; padding: 17px 26px; flex: 1; }
      .name { font-size: 2em; font-weight: 700; }
      .role { font-size: .94em; color: rgba(255, 255, 255, .92); margin-top: 2px; }

      /* Colonne sombre flottante : une page moins l'en-tête, donc rien
         ne déborde sur les pages suivantes. */
      .cols::after { content: ""; display: block; clear: both; }
      .col-side { float: right; width: 286px; min-height: calc(var(--band-h) - var(--head-h));
        margin-left: 22px; background: var(--panel); }

      .col-main { padding: 4px 32px 40px 34px; }
      /* flow-root : les bandeaux de titre s'arrêtent avant la colonne sombre */
      .col-main .sec__title { display: flow-root; }
      .col-main .sec { margin-top: 22px; }
      .col-main .sec__title { background: var(--accent); color: #1c1c1c; text-align: center;
        padding: 7px 12px; letter-spacing: .22em; font-size: .8em; font-weight: 700; margin-bottom: 15px; }
      .col-main .entry { grid-template-columns: 90px minmax(0, 1fr); gap: 0 14px;
        position: relative; padding-left: 21px; margin-bottom: 15px; }
      .col-main .entry::before { content: ""; position: absolute; left: 0; top: 3px;
        width: 13px; height: 13px; background: var(--accent); }
      .col-main .entry__period { text-transform: uppercase; font-weight: 700; font-size: .8em; color: #1c1c1c; }
      .col-main .entry__dur { font-size: .74em; }
      .col-main .entry__title { text-transform: uppercase; font-size: .95em; }

      .col-side { color: #fff; padding: 24px 30px 40px; }
      .col-side .sec { margin-top: 28px; }
      .col-side .sec:first-of-type { margin-top: 4px; }
      .col-side .sec__title { border: 2px solid var(--accent); color: #fff; text-align: center;
        padding: 8px; letter-spacing: .12em; font-size: .86em; margin-bottom: 15px; }
      .col-side .contact__item { color: rgba(255, 255, 255, .9); }
      .col-side .contact__item .ico { color: var(--accent); opacity: 1; }
      .col-side .skills--bars .skill { gap: 6px; margin-bottom: 13px; }
      .col-side .skill__name { color: #fff; font-size: .8em; font-weight: 700;
        text-transform: uppercase; text-align: center; }
      .col-side .bar { height: 14px; border: 2px solid var(--accent); background: transparent; border-radius: 0; }
      .col-side .bar__fill { background: var(--accent); border-radius: 0; }
      .col-side .lang__name { color: #fff; }
      .col-side .lang__lvl, .col-side .lang__note { color: rgba(255, 255, 255, .72); }
      .col-side .chip { background: var(--accent); color: #1c1c1c; }
      .col-side .ref__name { color: #fff; }
      .col-side .ref__role, .col-side .ref__contact { color: rgba(255, 255, 255, .72); }
    `,
    layout: (d) => `
      <header class="head">
        ${B.photo(d)}
        <div class="head__band">
          <h1 class="name">${name(d)}</h1>${role(d)}
        </div>
      </header>
      <div class="cols">
        <aside class="col-side">
          ${B.sec('Contact', B.contactList(d))}
          ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }))}
          ${B.sec('Langues', B.langues(d, { style: 'list' }))}
          ${B.sec('Certifications', B.certifications(d))}
          ${B.sec('Intérêts', B.interets(d))}
          ${B.sec('Références', B.references(d))}
        </aside>
        <main class="col-main">
          ${B.sec('Profil', B.profil(d))}
          ${B.sec('Formation', B.formations(d))}
          ${B.sec('Expérience', B.experiences(d))}
          ${B.sec('Projets', B.projets(d))}
        </main>
      </div>`,
  },

  /* ------------------------------------------------------------- 17. Jalons */
  {
    id: 'jalons',
    name: 'Jalons',
    desc: 'Colonne sombre, repères jaunes et frise verticale sur le parcours. Dynamique et lisible.',
    tags: ['Frise', 'Sombre'],
    accent: '#efb01f',
    font: 'sans',
    css: `
      ${onDark('.side')}
      body { --panel: #333335; }
      .page { padding: 0; }
      .page::after { content: ""; display: block; clear: both; }
      /* Barre latérale flottante : elle occupe exactement la première page,
         puis le contenu reprend toute la largeur — pas de bande vide page 2. */
      .side { float: left; width: 262px; min-height: var(--band-h); margin-right: 22px;
        background: var(--panel); color: #fff; padding: 0 24px 36px; position: relative; }
      .side__corner { position: absolute; top: 0; left: 0; width: 0; height: 0;
        border-top: 92px solid var(--accent); border-right: 92px solid transparent; }
      .side .photo { width: 148px; height: 148px; border-radius: 50%; overflow: hidden;
        margin: 28px auto 4px; border: 5px solid #fff; position: relative; }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; }
      .side .sec { margin-top: 22px; }
      .side .sec + .sec { border-top: 1px dashed rgba(255, 255, 255, .3); padding-top: 20px; }
      .side .sec__title { display: flex; align-items: center; gap: 9px; color: #fff; font-size: .95em; font-weight: 700; }
      .side .sec__ico { color: var(--accent); }
      .side .contact__item { color: rgba(255, 255, 255, .88); font-size: .84em; }
      .side .contact__item .ico { color: var(--accent); opacity: 1; }
      .side .entry { grid-template-columns: 1fr; gap: 0; margin-bottom: 12px; }
      .side .entry__main { grid-column: 1; grid-row: 1; }
      .side .entry__side { grid-column: 1; grid-row: 2; text-align: left; }
      .side .entry__note { color: rgba(255, 255, 255, .72); }
      .side .bullets { padding-left: 13px; font-size: .84em; }
      .side .bullets li::marker { color: var(--accent); }
      .side .entry__title, .side .ref__name { color: #fff; font-size: .88em; text-transform: uppercase; }
      .side .entry__org, .side .entry__period,
      .side .ref__role, .side .ref__contact { color: rgba(255, 255, 255, .78); font-size: .8em; }

      .main { padding: 0 38px 44px 40px; }
      /* flow-root : le bandeau gris s'arrête avant la colonne sombre */
      .head { display: flow-root; background: #efefef; padding: 18px 26px; margin-bottom: 26px; position: relative; }
      .head::before { content: ""; position: absolute; left: 0; top: 13px; bottom: 13px; width: 7px; background: var(--accent); }
      .name { font-size: 1.9em; font-weight: 800; text-transform: uppercase; letter-spacing: -.01em; }
      .name b { color: var(--accent); font-weight: 800; }
      .role { font-size: .76em; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); margin-top: 3px; }

      /* flow-root : la rubrique se place À CÔTÉ du flottant. Sans cela sa boîte
         commence sous la colonne sombre et ses repères absolus s'y dessinent. */
      .main .sec { display: flow-root; margin-top: 24px; padding-left: 34px; position: relative; }
      .main .sec::before { content: ""; position: absolute; left: 8px; top: 3px;
        width: 8px; height: 17px; background: var(--accent); border-radius: 2px; }
      .main .sec__title { display: flex; align-items: center; gap: 9px; color: #1c1c1c; font-size: 1em; }
      .main .sec__ico { color: var(--accent); }
      .main .sec__body:has(.entry) { position: relative; }
      .main .sec__body:has(.entry)::before { content: ""; position: absolute; left: -22px; top: 5px; bottom: 6px;
        width: 1.5px; background: #d9d9d9; }
      .main .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 14px; position: relative; }
      .main .entry::before { content: ""; position: absolute; left: -25px; top: 5px;
        width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
      .main .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .main .entry__main { grid-column: 1; grid-row: 1; }
      .main .entry__title { text-transform: uppercase; font-size: 1em; }
      .main .entry__org { font-style: italic; }

      .main .skills { display: grid; grid-template-columns: 1fr 1fr; gap: 0 22px; }
      .main .skills--bars .skill { grid-template-columns: 1fr 76px; align-items: center; gap: 8px; margin-bottom: 6px; }
      .main .skill__name { font-size: .76em; }
      .main .bar { height: 6px; background: #dcdcdc; }
    `,
    layout: (d) => `
      <aside class="side">
        <span class="side__corner"></span>
        ${B.photo(d)}
        ${B.sec('Contact', B.contactList(d), '', 'user')}
        ${B.sec('Références', B.references(d), '', 'users')}
        ${B.sec('Formation', B.formations(d), '', 'cap')}
        ${B.sec('Langues', B.langues(d, { style: 'list' }), '', 'globe')}
      </aside>
      <main class="main">
        <header class="head"><h1 class="name">${duoName(d)}</h1>${role(d)}</header>
        ${B.sec('À propos', B.profil(d), '', 'user')}
        ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
        ${B.sec('Projets', B.projets(d), '', 'spark')}
        ${B.sec('Certifications', B.certifications(d), '', 'award')}
        ${B.sec('Intérêts', B.interets(d), '', 'flag')}
      </main>`,
  },

  /* ---------------------------------------------------------- 18. Améthyste */
  {
    id: 'amethyste',
    name: 'Améthyste',
    desc: 'Bandeau violet en biais, photo ronde débordante, parcours en frise à pastilles.',
    tags: ['Violet', 'Frise'],
    accent: '#7c3aed',
    font: 'sans',
    css: `
      ${onDark('.hero')}
      .page { padding: 0; }
      .hero { background: linear-gradient(115deg, var(--accent-deep) 62%, var(--dark) 62%);
        padding: 34px 40px 30px 250px; position: relative; min-height: 224px; }
      /* Sans photo, la colonne qui lui est réservée avalerait le texte : on
         retombe alors sur une seule colonne. */
      .hero:not(:has(.photo)) { padding-left: 40px; }
      .hero .photo { position: absolute; left: 40px; top: 26px; width: 168px; height: 168px;
        border-radius: 50%; overflow: hidden; border: 6px solid #fff; box-shadow: 0 6px 22px rgba(0,0,0,.28); }
      .hero .photo img { width: 100%; height: 100%; object-fit: cover; }
      .name { font-size: 2.5em; font-weight: 800; text-transform: uppercase; letter-spacing: .01em; line-height: 1.02; color: #fff; }
      .role { font-size: 1.02em; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
        color: var(--accent-light); margin-top: 4px; }
      .hero .lead { color: rgba(255,255,255,.86); font-size: .88em; margin-top: 12px; }

      /* La colonne flotte au lieu d'occuper une cellule de grille : une grille
         garderait sa position sur toutes les pages, laissant un tiers de page
         vide dès que la colonne est épuisée. Le flottant, lui, tient la
         première page, puis le parcours reprend toute la largeur. */
      .cols { padding: 26px 40px 40px; }
      .side { float: left; width: 264px; margin-right: 30px; padding-top: 4px;
        /* Fond opaque : le filet des rubriques passe derrière lui page 1. */
        background: #fff; min-height: calc(var(--band-h) - 250px); }
      .side .sec__title { background: var(--accent-deep); color: #fff; border-radius: 99px;
        padding: 6px 18px; text-align: center; font-size: .82em; }
      .main .sec__title { display: flex; align-items: center; gap: 12px; font-size: 1.02em;
        letter-spacing: .05em; color: var(--accent-deep); }
      .main .sec__ico { width: 30px; height: 30px; border-radius: 50%; background: var(--accent-deep); color: #fff; }
      /* Le filet est dessiné entrée par entrée, et non d'un trait sur la
         rubrique. Une rubrique qui enjambe la coupure resterait sinon collée
         au flottant sur toute sa hauteur, donc étroite jusqu'en bas de la
         page 2 ; les entrées, elles, sont des grilles — chacune se replace
         pour son propre compte. */
      .main .sec__body { padding-left: 30px; }
      .main .sec__title { padding-right: 10px; }

      .entry { grid-template-columns: 150px minmax(0, 1fr); gap: 0 16px; position: relative; }
      .entry::before { content: ""; position: absolute; left: -27px; top: 5px; width: 10px; height: 10px;
        border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 3px var(--accent-wash); z-index: 1; }
      /* Le segment déborde sous l'entrée pour rejoindre la suivante : mises
         bout à bout, les entrées dessinent un filet continu. */
      .entry::after { content: ""; position: absolute; left: -23px; top: 18px; bottom: -17px;
        border-left: 2px dotted var(--accent-soft); }
      .entry:last-child::after { display: none; }
      .entry__title { text-transform: uppercase; color: var(--accent-deep); }
      .entry__org { font-weight: 700; text-transform: uppercase; font-size: .88em; color: var(--ink); }
      .entry__period { font-weight: 800; color: var(--ink); }
      .bar { height: 9px; border-radius: 99px; }
      .bar__fill { background: linear-gradient(90deg, var(--accent-deep), var(--accent-light)); }
      .contact__item { align-items: center; gap: 11px; }
      .contact__item .ico { color: var(--accent-deep); }
    `,
    layout: (d) => `
      <header class="hero">
        ${B.photo(d)}
        <h1 class="name">${name(d)}</h1>${role(d)}
        ${B.profil(d)}
      </header>
      <div class="cols">
        <aside class="side">
          ${B.sec('Langues', B.langues(d, { style: 'bars' }))}
          ${B.sec('Contact', B.contactList(d))}
          ${B.sec('Intérêts', B.interets(d))}
        </aside>
        <main class="main">
          ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
          ${B.sec('Formation', B.formations(d), '', 'cap')}
          ${B.sec('Compétences', B.competences(d, { style: 'bars' }), '', 'chart')}
          ${B.sec('Projets', B.projets(d), '', 'spark')}
          ${B.sec('Certifications', B.certifications(d), '', 'award')}
          ${B.sec('Références', B.references(d), '', 'users')}
        </main>
      </div>`,
  },

  /* ------------------------------------------------------------ 19. Écarlate */
  {
    id: 'ecarlate',
    name: 'Écarlate',
    desc: 'Colonne sombre à droite, médaillon coloré pour l’accroche, jauges fines.',
    tags: ['Contrasté', 'Colonne'],
    accent: '#e11d48',
    font: 'sans',
    css: `
      ${onDark('.side')}
      .page { padding: 0; }
      .side { float: right; width: 252px; min-height: var(--band-h); background: var(--dark);
        color: rgba(255,255,255,.82); padding: 26px 20px 40px; margin-left: 26px; }
      .side .sec__title { color: #fff; font-size: .96em; letter-spacing: .1em;
        padding-bottom: 7px; border-bottom: 2px solid rgba(255,255,255,.22); }
      .side .about { background: var(--accent); border-radius: 96px / 52px; padding: 24px 20px; text-align: center; margin-bottom: 6px; }
      .side .about .lead { font-size: .8em; line-height: 1.5; }
      .side .about .sec__title { border: 0; color: #fff; text-align: center; }
      .side .about .lead { color: #fff; font-size: .85em; text-align: center; }
      .side .bar { height: 4px; background: rgba(255,255,255,.24); }
      .side .bar__fill { background: var(--accent); position: relative; }
      .side .skill__name { color: #fff; font-weight: 600; font-size: .88em; }
      .side .lang__name { color: #fff; }

      .main { padding: 36px 34px 40px 40px; }
      .head .photo { width: 132px; height: 132px; border-radius: 50%; overflow: hidden;
        border: 4px solid var(--accent); float: right; margin-left: 18px; }
      .head .photo img { width: 100%; height: 100%; object-fit: cover; }
      .name { font-size: 2.7em; font-weight: 800; text-transform: uppercase; line-height: .96; letter-spacing: -.02em; }
      .role { display: inline-block; background: var(--accent); color: #fff; border-radius: 99px;
        padding: 5px 20px; font-size: .8em; font-style: italic; letter-spacing: .14em; margin-top: 10px; }
      .head { display: flow-root; margin-bottom: 16px; }
      .contact-inline { margin-top: 14px; gap: 6px 12px; }
      .contact-inline__item { background: var(--ink); color: #fff; border-radius: 99px; padding: 5px 14px; font-size: .92em; }
      .contact-inline__item .ico { color: var(--accent); opacity: 1; }

      .main .sec__title { font-size: .92em; color: var(--ink); border-bottom: 1px solid var(--line); padding-bottom: 5px; }
      .entry { position: relative; padding-left: 20px; }
      .entry::before { content: ""; position: absolute; left: 0; top: 6px; width: 9px; height: 9px;
        border-radius: 50%; background: var(--accent); }
      .entry__org { font-style: italic; }
      .entry__period { position: static; }
      .main .entry__side { order: 2; }
    `,
    layout: (d) => `
      <aside class="side">
        <div class="about">${B.sec('À propos', B.profil(d))}</div>
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }))}
        ${B.sec('Intérêts', B.interets(d))}
        ${B.sec('Langues', B.langues(d, { style: 'bars' }))}
      </aside>
      <main class="main">
        <header class="head">
          ${B.photo(d)}
          <h1 class="name">${duoName(d)}</h1>${role(d)}
          ${B.contactInline(d)}
        </header>
        ${B.sec('Formation', B.formations(d))}
        ${B.sec('Expériences', B.experiences(d))}
        ${B.sec('Projets', B.projets(d))}
        ${B.sec('Certifications', B.certifications(d))}
        ${B.sec('Références', B.references(d))}
      </main>`,
  },

  /* --------------------------------------------------------------- 20. Rubis */
  {
    id: 'rubis',
    name: 'Rubis',
    desc: 'Blocs rouges et anthracite, nom sur bandeau sombre, rubriques sur deux colonnes.',
    tags: ['Blocs', 'Affirmé'],
    accent: '#dc2626',
    font: 'sans',
    css: `
      ${onDark('.ident')}
      .page { padding: 0; }
      .top { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 0 26px;
        padding: 26px 34px 0; position: relative; }
      /* Sans photo, la colonne qui lui est réservée avalerait le texte : on
         retombe alors sur une seule colonne. */
      .top:not(:has(.photo)) { grid-template-columns: minmax(0, 1fr); }
      .top::before { content: ""; position: absolute; left: 0; top: 0; width: 210px; height: 74px; background: var(--accent); }
      .top .photo { position: relative; width: 100%; aspect-ratio: 1 / 1; overflow: hidden; border: 5px solid #fff; }
      .top .photo img { width: 100%; height: 100%; object-fit: cover; }
      .about { border: 2px solid var(--accent); padding: 20px 22px; }
      .about .sec__title { display: flex; align-items: center; gap: 9px; color: var(--ink); font-size: 1em; }
      .about .sec__ico { width: 24px; height: 24px; color: var(--accent); }
      .about .lead { text-align: center; }

      .ident { background: var(--ink); color: #fff; padding: 18px 24px; margin: 0; position: relative; z-index: 2; }
      .name { font-size: 2.1em; font-weight: 300; line-height: 1.02; }
      .name b { display: block; font-weight: 800; }
      .role { font-size: .76em; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.72); margin-top: 5px; }

      .band { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 0 26px; padding: 0 34px; }
      .band { align-items: start; padding-top: 16px; }
      .band .contact { padding-top: 6px; }
      .band .sec__title { display: flex; align-items: center; gap: 9px; color: var(--ink); font-size: 1.05em; }
      .band .sec__ico { width: 26px; height: 26px; border-radius: 50%; background: var(--accent); color: #fff; }

      .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px; padding: 22px 34px 40px; }
      .main .sec__title, .col-side .sec__title { color: var(--accent); font-size: 1.15em;
        letter-spacing: .01em; border-bottom: 2px solid var(--ink); padding-bottom: 4px; }
      .entry { position: relative; padding-left: 18px; }
      .entry::before { content: ""; position: absolute; left: 0; top: 7px; width: 7px; height: 7px; background: var(--ink); }
      .entry__title { text-transform: uppercase; color: var(--accent-deep); font-size: .98em; }
      .bar { height: 4px; }
      .bar__fill { position: relative; }
      .skill__name { font-weight: 700; font-size: .86em; }
    `,
    layout: (d) => `
      <div class="top">
        ${B.photo(d)}
        <div class="about">${B.sec('À propos', B.profil(d), '', 'user')}</div>
      </div>
      <div class="band">
        <header class="ident"><h1 class="name">${duoName(d)}</h1>${role(d)}</header>
        ${B.sec('Contact', B.contactList(d), '', 'phone')}
      </div>
      <div class="cols">
        <main class="main">
          ${B.sec('Expériences', B.experiences(d))}
          ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }))}
          ${B.sec('Langues', B.langues(d, { style: 'list' }))}
        </main>
        <aside class="col-side">
          ${B.sec('Références', B.references(d))}
          ${B.sec('Formation', B.formations(d))}
          ${B.sec('Projets', B.projets(d))}
          ${B.sec('Certifications', B.certifications(d))}
          ${B.sec('Intérêts', B.interets(d))}
        </aside>
      </div>`,
  },

  /* -------------------------------------------------------------- 21. Safran */
  {
    id: 'safran',
    name: 'Safran',
    desc: 'Colonne jaune arrondie à droite, panneau d’accroche coloré, titres à pastilles carrées.',
    tags: ['Chaleureux', 'Colonne'],
    accent: '#f59e0b',
    font: 'sans',
    css: `
      ${onDark('.about')}
      .page { padding: 0; }
      .side { float: right; width: 274px; min-height: var(--band-h); background: var(--accent);
        padding: 30px 24px 40px; margin-left: 28px; border-radius: 40px 0 0 40px; }
      .side .sec__title { display: flex; align-items: center; gap: 10px; color: var(--ink); font-size: 1em; letter-spacing: .02em; }
      .side .sec__ico { width: 26px; height: 26px; border-radius: 7px; background: var(--dark); color: var(--accent); }
      .side .photo { width: 100%; aspect-ratio: 4 / 5; border-radius: 22px; overflow: hidden; border: 4px solid #fff; margin-bottom: 20px; }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; }
      .side .contact__item { color: var(--ink); font-weight: 500; }
      .side .contact__item .ico { color: var(--dark); }
      .side .bar { background: rgba(255,255,255,.5); height: 8px; }
      .side .bar__fill { background: var(--dark); }
      .side .skill__name, .side .entry__title, .side .lang__name { color: var(--dark); font-weight: 700; }
      .side .entry__period, .side .entry__org { color: rgba(31,25,0,.7); }
      .side .chip { background: var(--dark); color: #fff; }

      .main { padding: 38px 30px 40px 40px; }
      .name { font-size: 2.6em; font-weight: 800; text-transform: uppercase; line-height: .98; letter-spacing: -.01em; }
      .role { font-size: .84em; letter-spacing: .1em; text-transform: uppercase; color: var(--muted);
        margin-top: 6px; display: flex; align-items: center; gap: 12px; }
      .role::after { content: ""; flex: 1; height: 1px; background: var(--line); }
      .about { background: var(--accent-deep); color: #fff; border-radius: 26px; padding: 24px 26px; margin-top: 20px; }
      .about .sec__title { color: #fff; display: flex; align-items: center; gap: 10px; }
      .about .sec__ico { width: 26px; height: 26px; border-radius: 7px; background: var(--accent); color: var(--dark); }
      .main .sec__title { display: flex; align-items: center; gap: 10px; color: var(--ink); font-size: 1.08em; }
      .main .sec__ico { width: 26px; height: 26px; border-radius: 7px; background: var(--accent); color: var(--dark); }
      .entry__period { color: var(--accent-deep); font-weight: 700; }
      .entry__org { font-style: italic; }
    `,
    layout: (d) => `
      <aside class="side">
        ${B.contactList(d)}
        ${B.photo(d)}
        ${B.sec('Formation', B.formations(d), '', 'cap')}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
        ${B.sec('Langues', B.langues(d, { style: 'chips' }), '', 'globe')}
      </aside>
      <main class="main">
        <header class="head"><h1 class="name">${duoName(d)}</h1>${role(d)}</header>
        <div class="about">${B.sec('À propos', B.profil(d), '', 'user')}</div>
        ${B.sec('Références', B.references(d), '', 'users')}
        ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
        ${B.sec('Projets', B.projets(d), '', 'spark')}
        ${B.sec('Certifications', B.certifications(d), '', 'award')}
        ${B.sec('Intérêts', B.interets(d), '', 'flag')}
      </main>`,
  },

  /* --------------------------------------------------------------- 22. Ambre */
  {
    id: 'ambre',
    name: 'Ambre',
    desc: 'Intitulés sur bandeaux sombres, dates en onglets latéraux, photo cerclée.',
    tags: ['Bandeaux', 'Dynamique'],
    accent: '#f59e0b',
    font: 'sans',
    css: `
      .page { padding: 38px 40px 42px; }
      .head { display: grid; grid-template-columns: minmax(0, 1fr) 190px; gap: 0 30px; align-items: start; }
      /* Sans photo, la colonne qui lui est réservée avalerait le texte : on
         retombe alors sur une seule colonne. */
      .head:not(:has(.photo)) { grid-template-columns: minmax(0, 1fr); }
      .head .photo { width: 176px; height: 176px; border-radius: 50%; overflow: hidden;
        border: 6px solid var(--accent); justify-self: end; }
      .head .photo img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); }
      .name { font-size: 2.5em; font-weight: 300; text-transform: uppercase; line-height: 1; }
      .name b { font-weight: 800; }
      .role { display: block; background: var(--accent); color: var(--dark); border-radius: 99px;
        padding: 5px 18px; font-size: .74em; letter-spacing: .28em; text-transform: uppercase;
        font-weight: 600; margin-top: 12px; }
      .head .lead { margin-top: 14px; }
      .head .contact { margin-top: 16px; gap: 8px; }
      .head .contact__item { background: var(--accent); color: var(--dark); border-radius: 99px;
        padding: 7px 16px; font-weight: 600; }
      .head .contact__item .ico { color: var(--dark); opacity: 1; }

      .cols { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 0 30px; margin-top: 24px; }
      .sec__title { display: flex; align-items: center; gap: 12px; background: var(--dark); color: #fff;
        border-radius: 99px; padding: 7px 18px; font-size: .88em; letter-spacing: .1em; }
      .sec__ico { width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: var(--dark); }
      .entry { grid-template-columns: 74px minmax(0, 1fr); gap: 0 16px; }
      .entry__side { background: var(--accent); border-radius: 99px; padding: 10px 6px; text-align: center;
        writing-mode: vertical-rl; transform: rotate(180deg); justify-self: start; }
      .entry__period { color: var(--dark); font-weight: 700; font-size: .74em; }
      .entry__dur { display: none; }
      .entry__title { text-transform: uppercase; }
      .entry__org { font-style: italic; font-weight: 600; color: var(--ink); }
      .skills { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; }
      .bar { height: 5px; }
      .bar__fill { position: relative; }
      .bar__fill::after { content: ""; position: absolute; right: -6px; top: 50%; width: 12px; height: 12px;
        transform: translateY(-50%); border-radius: 50%; background: var(--accent); border: 2px solid #fff; }
      .interets .chip { border: 1px solid var(--line); background: #fff; }
    `,
    layout: (d) => `
      <main class="page-body">
        <header class="head">
          <div>
            <h1 class="name">${duoName(d)}</h1>${role(d)}
            ${B.profil(d)}
          </div>
          ${B.photo(d)}
        </header>
        ${B.sec('Formation', B.formations(d), '', 'cap')}
        ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
        <div class="cols">
          <div>
            ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
            ${B.sec('Projets', B.projets(d), '', 'spark')}
          </div>
          <div>
            ${B.sec('Références', B.references(d), '', 'users')}
            ${B.sec('Certifications', B.certifications(d), '', 'award')}
            ${B.sec('Intérêts', B.interets(d), 'interets', 'flag')}
            ${B.sec('Langues', B.langues(d, { style: 'bars' }), '', 'globe')}
          </div>
        </div>
      </main>`,
  },

  /* ---------------------------------------------------------- 23. Clémentine */
  {
    id: 'clementine',
    name: 'Clémentine',
    desc: 'Filet orange en bordure, en-tête compact, compétences et langues sur trois colonnes.',
    tags: ['Dense', 'Trois colonnes'],
    accent: '#f97316',
    font: 'sans',
    css: `
      .page { padding: 34px 38px 40px 52px; position: relative; }
      .page::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 14px; background: var(--accent); }
      .page::after { content: ""; position: absolute; left: 22px; top: 0; bottom: 0; width: 3px; background: var(--ink); }

      .head { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 0 18px; align-items: center; }
      /* Sans photo, la colonne qui lui est réservée avalerait le texte : on
         retombe alors sur une seule colonne. */
      .head:not(:has(.photo)) { grid-template-columns: minmax(0, 1fr); }
      .head .photo { width: 120px; height: 120px; overflow: hidden; }
      .head .photo img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); }
      .name { font-size: 2.4em; font-weight: 800; text-transform: uppercase; letter-spacing: -.01em; line-height: 1; }
      .name b { color: var(--accent); }
      .role { font-size: .68em; letter-spacing: .42em; text-transform: uppercase; color: var(--muted); margin-top: 3px; }
      .head .contact-inline { margin-top: 10px; font-size: .82em; gap: 4px 18px; }
      .head .contact-inline__item .ico { color: var(--accent); opacity: 1; }

      .sec__title { display: flex; align-items: center; gap: 9px; color: var(--ink); font-size: .92em; }
      .sec__ico { width: 18px; height: 18px; color: var(--accent); }
      .sec__title::after { content: ""; flex: 1; height: 3px; background: var(--line); border-radius: 99px; }

      .cols { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 0 26px; }
      .trio { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 22px; }
      .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 14px; }
      .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .entry__main { grid-column: 1; grid-row: 1; }
      .entry__title { font-size: 1em; }
      .entry__org { font-size: .84em; font-weight: 600; }
      .entry__dur { display: none; }

      .skills--bars .bar { height: 9px; background: none; display: flex; gap: 2px; }
      .bar__fill { background: none; display: flex; gap: 2px; }
      .skill__name { font-size: .8em; text-transform: uppercase; font-weight: 700; letter-spacing: .04em; }
      .lang__name { font-weight: 700; font-size: .86em; text-transform: uppercase; }
      .bullets li::marker { color: var(--accent); }
    `,
    layout: (d) => `
      <main class="page-body">
        <header class="head">
          ${B.photo(d)}
          <div>
            <h1 class="name">${duoName(d)}</h1>${role(d)}
            ${B.contactInline(d)}
          </div>
        </header>
        ${B.sec('À propos', B.profil(d), '', 'user')}
        <div class="cols">
          <div>
            ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
            ${B.sec('Projets', B.projets(d), '', 'spark')}
          </div>
          <div>
            ${B.sec('Formation', B.formations(d), '', 'cap')}
            ${B.sec('Certifications', B.certifications(d), '', 'award')}
          </div>
        </div>
        <div class="trio">
          ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
          ${B.sec('Intérêts', B.interets(d), '', 'flag')}
          ${B.sec('Langues', B.langues(d, { style: 'bars' }), '', 'globe')}
        </div>
        ${B.sec('Références', B.references(d), '', 'users')}
      </main>`,
  },

  /* ------------------------------------------------------------ 24. Mandarine */
  {
    id: 'mandarine',
    name: 'Mandarine',
    desc: 'Bandeau sombre en salutation, rubriques posées dans des cartes encadrées.',
    tags: ['Cartes', 'Accueillant'],
    accent: '#ea580c',
    font: 'sans',
    css: `
      ${onDark('.hello')}
      .page { padding: 0; background: #f4f5f7; }
      .hello { background: var(--ink); color: #fff; padding: 22px 40px; text-align: center; }
      .name { font-size: 2.2em; font-weight: 300; }
      .name b { color: var(--accent); font-weight: 800; }
      .role { font-size: .72em; letter-spacing: .34em; text-transform: uppercase;
        color: rgba(255,255,255,.72); margin-top: 3px; }

      .intro { display: grid; grid-template-columns: 190px minmax(0, 1fr); gap: 0 26px;
        align-items: center; padding: 24px 40px 18px; }
      /* Sans photo, la colonne qui lui est réservée avalerait le texte : on
         retombe alors sur une seule colonne. */
      .intro:not(:has(.photo)) { grid-template-columns: minmax(0, 1fr); }
      .intro .photo { width: 148px; height: 148px; border-radius: 50%; overflow: hidden;
        border: 3px solid var(--ink); justify-self: center; }
      .intro .photo img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); }
      .intro .sec__title { display: flex; align-items: center; gap: 9px; color: var(--ink); font-size: 1em; }
      .intro .sec__ico { width: 24px; height: 24px; border-radius: 6px; background: var(--accent); color: #fff; }
      .intro .sec { border-bottom: 3px solid var(--accent); padding-bottom: 12px; }
      .intro .contact-inline { margin-top: 12px; gap: 6px 22px; }
      .intro .contact-inline__item .ico { color: var(--accent); opacity: 1; }

      .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 0 40px 40px; align-items: start; }
      .cols .sec { background: #fff; border: 1px solid #dcdfe6; padding: 18px 20px 20px; margin-top: 0; }
      /* Le parcours a besoin de toute la largeur : à mi-page, les intitulés
         se briseraient sur trois lignes. */
      .cols .sec--large { grid-column: 1 / -1; }
      .sec--large .entry { grid-template-columns: 132px minmax(0, 1fr); }
      .sec__title { display: flex; align-items: center; gap: 9px; color: var(--ink); font-size: .96em; letter-spacing: .04em; }
      .sec__ico { width: 22px; height: 22px; border-radius: 6px; background: var(--accent); color: #fff; }
      .entry { position: relative; padding-left: 18px; }
      .entry::before { content: ""; position: absolute; left: 0; top: 6px; width: 9px; height: 9px;
        border-radius: 50%; background: var(--accent); }
      .entry__main::before { content: ""; position: absolute; left: 4px; top: 18px; bottom: -8px; width: 1px; background: var(--line); }
      .entry:last-child .entry__main::before { display: none; }
      .entry__title { font-size: .95em; text-transform: uppercase; }
      .bar { height: 7px; }
      .lang__lvl { font-size: .78em; }
    `,
    layout: (d) => `
      <header class="hello">
        <h1 class="name">Bonjour. Je suis <b>${name(d)}</b></h1>${role(d)}
      </header>
      <section class="intro">
        ${B.photo(d)}
        <div>
          ${B.sec('À propos', B.profil(d), '', 'user')}
          ${B.contactInline(d)}
        </div>
      </section>
      <main class="cols">
        ${B.sec('Expériences', B.experiences(d), 'sec--large', 'briefcase')}
        ${B.sec('Formation', B.formations(d), 'sec--large', 'cap')}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
        ${B.sec('Langues', B.langues(d, { style: 'bars' }), '', 'globe')}
        ${B.sec('Projets', B.projets(d), '', 'spark')}
        ${B.sec('Certifications', B.certifications(d), '', 'award')}
        ${B.sec('Intérêts', B.interets(d), '', 'flag')}
        ${B.sec('Références', B.references(d), '', 'users')}
      </main>`,
  },

  /* ---------------------------------------------------------------- 25. Azur */
  {
    id: 'azur',
    name: 'Azur',
    desc: 'Bandes claires pleine largeur, salutation en titre, colonnes appariées.',
    tags: ['Aéré', 'Bandes'],
    accent: '#2563eb',
    font: 'sans',
    css: `
      .page { padding: 0; }
      .hello { background: #f3f4f6; padding: 26px 40px 24px; }
      .mono { display: inline-block; background: var(--accent); color: #fff; border-radius: 6px;
        padding: 3px 10px; font-size: .74em; font-weight: 800; letter-spacing: .06em; margin-bottom: 8px; }
      .name { font-size: 2.3em; font-weight: 800; text-transform: uppercase; line-height: 1.02; }
      .name b { color: var(--accent); }
      .role { font-size: .74em; letter-spacing: .3em; text-transform: uppercase; color: var(--muted); margin-top: 2px; }
      .hello .cols2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 0 34px; align-items: start; }
      .hello .sec__title { display: flex; align-items: center; gap: 9px; color: var(--ink); font-size: .95em; }
      .hello .sec__ico { width: 22px; height: 22px; border-radius: 6px; background: var(--accent); color: #fff; }
      .hello .sec { border-bottom: 3px solid var(--accent); padding-bottom: 12px; margin-top: 0; }
      .hello .contact-inline { margin-top: 16px; gap: 6px 26px; font-size: .84em; }
      .hello .contact-inline__item .ico { color: var(--accent); opacity: 1; }

      .band { background: #f3f4f6; padding: 12px 40px; margin-top: 22px; }
      .band .sec { margin-top: 0; }
      .band .sec__title { margin-bottom: 0; }
      .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 0 34px; padding: 18px 40px 0; }
      .foot { padding: 0 40px 40px; }
      .sec__title { display: flex; align-items: center; gap: 9px; color: var(--ink); font-size: .95em; letter-spacing: .03em; }
      .sec__ico { width: 22px; height: 22px; border-radius: 6px; background: var(--accent); color: #fff; }

      .entry { position: relative; padding-left: 22px; }
      .entry::before { content: ""; position: absolute; left: 0; top: 9px; width: 13px; height: 3px; background: var(--accent); }
      .entry__main::after { content: ""; position: absolute; left: 6px; top: 20px; bottom: -6px; width: 1px; background: var(--line); }
      .entry:last-child .entry__main::after { display: none; }
      .entry__title { font-size: .95em; text-transform: uppercase; }
      .entry__org { letter-spacing: .1em; font-size: .8em; text-transform: uppercase; }
      .bar { height: 5px; }
      .bar__fill { position: relative; }
      .bar__fill::after { content: ""; position: absolute; right: -5px; top: 50%; width: 10px; height: 10px;
        transform: translateY(-50%); border-radius: 50%; background: var(--accent); }
      .skill__name { font-size: .84em; font-weight: 700; }
    `,
    layout: (d) => `
      <header class="hello">
        <div class="cols2">
          <div>
            <span class="mono">CV</span>
            <h1 class="name">${duoName(d)}</h1>${role(d)}
            ${B.contactInline(d)}
          </div>
          ${B.sec('À propos', B.profil(d), '', 'user')}
        </div>
      </header>
      <main class="page-body">
        <div class="band">${B.sec('Parcours', '', '', 'briefcase')}</div>
        <div class="cols">
          ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
          ${B.sec('Formation', B.formations(d), '', 'cap')}
        </div>
        <div class="cols">
          ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
          ${B.sec('Certifications', B.certifications(d), '', 'award')}
        </div>
        <div class="cols">
          ${B.sec('Projets', B.projets(d), '', 'spark')}
          ${B.sec('Langues', B.langues(d, { style: 'bars' }), '', 'globe')}
        </div>
        <div class="foot">
          ${B.sec('Intérêts', B.interets(d), '', 'flag')}
          ${B.sec('Références', B.references(d), '', 'users')}
        </div>
      </main>`,
  },

  /* -------------------------------------------------------------- 26. Cobalt */
  {
    id: 'cobalt',
    name: 'Cobalt',
    desc: 'Colonne grise à gauche, nom sur cartouche bleu, rubriques à pastilles rondes.',
    tags: ['Sobre', 'Colonne'],
    accent: '#2b8bea',
    font: 'sans',
    css: `
      ${onDark('.ident')}
      .page { padding: 0; }
      .side { float: left; width: 252px; min-height: var(--band-h); background: #eceff3;
        margin-right: 28px; padding: 0 22px 36px; }
      .side .cap { display: block; background: var(--accent); color: #fff; text-align: center;
        font-size: .8em; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; padding: 8px; margin: 0 -22px; }
      .side .photo { width: 100%; aspect-ratio: 1 / 1; overflow: hidden; margin: 0 -22px; width: calc(100% + 44px); }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); }
      .ident { background: var(--accent); color: #fff; margin: 0 -22px 18px; padding: 14px 22px 16px; text-align: center; }
      .name { font-size: 1.55em; font-weight: 800; text-transform: uppercase; line-height: 1.06; }
      .role { font-size: .78em; color: rgba(255,255,255,.86); margin-top: 2px; }
      .side .sec__title { color: var(--ink); font-size: .96em; letter-spacing: .06em; }
      .side .contact__item .ico { color: var(--accent); }

      .main { padding: 30px 34px 40px 0; }
      .main .sec__title { display: flex; align-items: center; gap: 10px; color: var(--ink); font-size: 1.02em; letter-spacing: .04em; }
      .main .sec__ico { width: 26px; height: 26px; border-radius: 50%; background: var(--accent); color: #fff; }
      .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 16px; }
      .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .entry__main { grid-column: 1; grid-row: 1; }
      .entry__title { text-transform: uppercase; font-size: .96em; }
      .entry__org { color: var(--accent); font-weight: 600; }
      .lead { text-align: justify; }
      .skills { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
      .bar { height: 7px; border-radius: 0; }
      .bar__fill { border-radius: 0; }
      .side .lang__name { font-weight: 600; }
    `,
    layout: (d) => `
      <aside class="side">
        <span class="cap">Curriculum vitae</span>
        ${B.photo(d)}
        <header class="ident"><h1 class="name">${name(d)}</h1>${role(d)}</header>
        ${B.sec('Contact', B.contactList(d))}
        ${B.sec('Langues', B.langues(d, { style: 'list' }))}
        ${B.sec('Intérêts', B.interets(d))}
        ${B.sec('Certifications', B.certifications(d))}
      </aside>
      <main class="main">
        ${B.sec('Résumé', B.profil(d), '', 'user')}
        ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
        ${B.sec('Formation', B.formations(d), '', 'cap')}
        ${B.sec('Projets', B.projets(d), '', 'spark')}
        ${B.sec('Références', B.references(d), '', 'users')}
      </main>`,
  },

  /* --------------------------------------------------------------- 27. Vague */
  {
    id: 'vague',
    name: 'Vague',
    desc: 'En-tête bleu clair fermé par une courbe, titres serif, deux colonnes équilibrées.',
    tags: ['Courbe', 'Doux'],
    accent: '#38a3e8',
    font: 'sans',
    css: `
      ${onDark('.hero')}
      .page { padding: 0; }
      .hero { background: var(--accent); padding: 30px 40px 56px; position: relative;
        display: grid; grid-template-columns: 196px minmax(0, 1fr); gap: 0 28px; align-items: center; }
      /* Sans photo, la colonne qui lui est réservée avalerait le texte : on
         retombe alors sur une seule colonne. */
      .hero:not(:has(.photo)) { grid-template-columns: minmax(0, 1fr); }
      /* La courbe reste dans la page : débordant sur les côtés, elle
         provoquait un défilement horizontal. */
      .hero::after { content: ""; position: absolute; left: 0; right: 0; bottom: -54px; height: 110px;
        background: #fff; border-radius: 50% 50% 0 0; }
      .hero .photo { width: 172px; height: 172px; border-radius: 50%; overflow: hidden; border: 6px solid #fff; }
      .hero .photo img { width: 100%; height: 100%; object-fit: cover; }
      .name { font-size: 2.3em; font-weight: 300; color: #fff; letter-spacing: -.01em; }
      .name b { font-weight: 800; }
      .role { font-size: 1.05em; color: rgba(255,255,255,.9); margin-top: 2px; }
      .hero .sec__title { color: #fff; font-size: 1.15em; letter-spacing: 0; text-transform: none; font-weight: 700; }
      .hero .lead { color: rgba(255,255,255,.92); text-align: justify; }

      .cols { display: grid; grid-template-columns: 246px minmax(0, 1fr); gap: 0 30px; padding: 20px 40px 40px; position: relative; }
      .cols::before { content: ""; position: absolute; left: 282px; top: 10px; bottom: 30px; width: 2px; background: var(--accent-soft); }
      .sec__title { color: var(--accent-deep); font-size: 1.3em; font-weight: 700; text-transform: none;
        letter-spacing: 0; font-family: var(--font-title); }
      .skills--dots .dot-i { width: 10px; height: 10px; }
      .entry__title { font-size: 1em; }
      .entry__org { color: var(--accent-deep); font-weight: 600; }
      .entry { position: relative; padding-left: 16px; }
      .entry::before { content: ""; position: absolute; left: 0; top: 8px; width: 7px; height: 7px;
        border-radius: 50%; background: var(--accent); }
      .contact__item .ico { color: var(--accent); }
      .chip { border-radius: 4px; }
    `,
    layout: (d) => `
      <header class="hero">
        ${B.photo(d)}
        <div>
          <h1 class="name">${duoName(d)}</h1>${role(d)}
          ${B.sec('À propos', B.profil(d))}
        </div>
      </header>
      <div class="cols">
        <aside class="side">
          ${B.sec('Compétences', B.competences(d, { style: 'dots', grouped: false }))}
          ${B.sec('Intérêts', B.interets(d))}
          ${B.sec('Langues', B.langues(d, { style: 'list' }))}
          ${B.sec('Contact', B.contactList(d))}
        </aside>
        <main class="main">
          ${B.sec('Formation', B.formations(d))}
          ${B.sec('Expériences', B.experiences(d))}
          ${B.sec('Projets', B.projets(d))}
          ${B.sec('Certifications', B.certifications(d))}
          ${B.sec('Références', B.references(d))}
        </main>
      </div>`,
  },

  /* --------------------------------------------------------------- 28. Marée */
  {
    id: 'maree',
    name: 'Marée',
    desc: 'Colonne bleu nuit fermée par des arrondis, jauges chiffrées, titres serif clairs.',
    tags: ['Arrondi', 'Colonne'],
    accent: '#28b6f6',
    font: 'sans',
    css: `
      ${onDark('.side', '.hero')}
      .page { padding: 0; }
      .side { float: left; width: 250px; min-height: var(--band-h); background: var(--dark);
        margin-right: 28px; padding: 0 22px 40px; position: relative; }
      .side::before { content: ""; display: block; height: 150px; margin: 0 -22px;
        background: var(--accent); border-radius: 0 0 130px 130px; }
      .side .photo { width: 168px; height: 168px; border-radius: 50%; overflow: hidden;
        border: 6px solid #fff; margin: -130px auto 16px; position: relative; }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; }
      .side .sec__title { color: var(--accent); font-size: 1.28em; font-weight: 700; text-transform: none;
        letter-spacing: 0; font-family: var(--font-title); }
      .side .bar { height: 13px; border-radius: 99px; background: rgba(255,255,255,.16); }
      .side .bar__fill { border-radius: 99px; }
      .side .skill__name { color: #fff; }
      .side .contact__item { align-items: center; gap: 11px; }
      .side .contact__item .ico { color: var(--accent); }

      .hero { background: var(--accent); padding: 26px 34px 24px 0; margin-bottom: 6px; }
      .name { font-size: 2.35em; font-weight: 300; color: #fff; }
      .name b { font-weight: 800; }
      .role { font-size: 1.05em; color: rgba(255,255,255,.92); margin-top: 1px; }
      .main { padding: 6px 34px 40px 0; }
      .main .sec__title { color: var(--accent-deep); font-size: 1.3em; font-weight: 700;
        text-transform: none; letter-spacing: 0; font-family: var(--font-title); }
      .main .sec { border-top: 1px solid var(--line); padding-top: 12px; }
      .entry { position: relative; padding-left: 16px; }
      .entry::before { content: ""; position: absolute; left: 0; top: 8px; width: 7px; height: 7px;
        border-radius: 50%; background: var(--accent); }
      .entry__title { font-size: 1em; }
      .entry__org { color: var(--accent-deep); font-weight: 600; }
    `,
    layout: (d) => `
      <aside class="side">
        ${B.photo(d)}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }))}
        ${B.sec('Langues', B.langues(d, { style: 'bars' }))}
        ${B.sec('Contact', B.contactList(d))}
        ${B.sec('Intérêts', B.interets(d))}
      </aside>
      <header class="hero"><h1 class="name">${duoName(d)}</h1>${role(d)}</header>
      <main class="main">
        ${B.sec('Profil', B.profil(d))}
        ${B.sec('Formation', B.formations(d))}
        ${B.sec('Expériences', B.experiences(d))}
        ${B.sec('Projets', B.projets(d))}
        ${B.sec('Certifications', B.certifications(d))}
        ${B.sec('Références', B.references(d))}
      </main>`,
  },

  /* ---------------------------------------------------------------- 29. Jade */
  {
    id: 'jade',
    name: 'Jade',
    desc: 'En-tête en pilule allongée, colonne verte à onglets, niveaux en pastilles.',
    tags: ['Pilule', 'Pastilles'],
    accent: '#2a8c82',
    font: 'sans',
    css: `
      ${onDark('.hero', '.side')}
      .page { padding: 0; background: #eef0f2; }
      .hero { background: var(--accent); border-radius: 0 0 0 120px; margin: 18px 22px 20px;
        border-radius: 90px; padding: 26px 34px; display: grid;
        grid-template-columns: 160px minmax(0, 1fr); gap: 0 24px; align-items: center; }
      /* Sans photo, la colonne qui lui est réservée avalerait le texte : on
         retombe alors sur une seule colonne. */
      .hero:not(:has(.photo)) { grid-template-columns: minmax(0, 1fr); }
      .hero .photo { width: 148px; height: 148px; border-radius: 50%; overflow: hidden; border: 5px solid #fff; }
      .hero .photo img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); }
      .name { font-size: 2.2em; font-weight: 800; text-transform: uppercase; color: #fff; line-height: 1.02; letter-spacing: .02em; }
      .role { font-size: .95em; color: rgba(255,255,255,.9); margin-top: 4px; }
      .hero .lead { color: rgba(255,255,255,.88); font-size: .86em; margin-top: 8px; }

      .cols { display: grid; grid-template-columns: 244px minmax(0, 1fr); gap: 0 26px; padding: 0 22px 36px; align-items: start; }
      .side { background: var(--accent); border-radius: 26px; padding: 24px 22px 30px; }
      .side .sec__title { display: flex; align-items: center; gap: 10px; color: #fff; font-size: 1em;
        letter-spacing: .06em; padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,.34); }
      .side .sec__ico { width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgba(255,255,255,.5); }
      .side .contact__item { color: rgba(255,255,255,.9); }
      .side .contact__item .ico { color: #fff; }
      .side .dot-i { background: rgba(255,255,255,.35); width: 9px; height: 9px; }
      .side .dot-i.is-on { background: #fff; }
      .side .skill__name, .side .lang__name { color: #fff; font-size: .86em; letter-spacing: .08em; text-transform: uppercase; }

      .main { background: #fff; border-radius: 26px; padding: 24px 26px 30px; }
      .main .sec__title { display: inline-block; background: var(--accent); color: #fff;
        border-radius: 4px; padding: 4px 14px; font-size: .82em; letter-spacing: .06em; }
      .main .sec:first-of-type .sec__title { background: none; color: var(--accent-deep); font-size: 1.5em;
        padding: 0; text-transform: uppercase; }
      .entry { grid-template-columns: 108px minmax(0, 1fr); gap: 0 14px; }
      .entry__period { color: var(--accent-deep); font-weight: 700; }
      .entry__title { color: var(--accent-deep); text-transform: uppercase; font-size: .95em; }
      .lang__lvl { font-size: .78em; }
    `,
    layout: (d) => `
      <header class="hero">
        ${B.photo(d)}
        <div>
          <h1 class="name">${name(d)}</h1>${role(d)}
          ${B.profil(d)}
        </div>
      </header>
      <div class="cols">
        <aside class="side">
          ${B.sec('Contact', B.contactList(d), '', 'id')}
          ${B.sec('Compétences', B.competences(d, { style: 'dots', grouped: false }), '', 'chart')}
          ${B.sec('Langues', B.langues(d, { style: 'dots' }), '', 'globe')}
          ${B.sec('Intérêts', B.interets(d), '', 'flag')}
        </aside>
        <main class="main">
          ${B.sec('Formation', B.formations(d))}
          ${B.sec('Expériences', B.experiences(d))}
          ${B.sec('Projets', B.projets(d))}
          ${B.sec('Certifications', B.certifications(d))}
          ${B.sec('Références', B.references(d))}
        </main>
      </div>`,
  },

  /* --------------------------------------------------------------- 30. Sapin */
  {
    id: 'sapin',
    name: 'Sapin',
    desc: 'Colonne vert profond à droite avec la photo, intitulés en pilules bordées.',
    tags: ['Pilules', 'Profond'],
    accent: '#1f6f68',
    font: 'sans',
    css: `
      ${onDark('.side')}
      .page { padding: 0; }
      .side { float: right; width: 300px; min-height: var(--band-h); background: var(--accent-deep);
        margin-left: 26px; padding: 26px 24px 40px; }
      .side .photo { width: 190px; height: 226px; border-radius: 100px / 118px; overflow: hidden;
        border: 5px solid #fff; margin: 0 auto 22px; }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; }
      .side .sec__title { border: 2px solid #fff; border-radius: 99px; color: #fff; text-align: center;
        padding: 6px 16px; font-size: .92em; letter-spacing: .06em; }
      .side .contact__item { color: #fff; font-size: 1em; align-items: center; gap: 12px; }
      .side .contact__item .ico { color: #fff; opacity: 1; }
      .side .bar { height: 12px; background: rgba(255,255,255,.25); border-radius: 0; }
      .side .bar__fill { background: #fff; border-radius: 0; }
      .side .skill__name { color: #fff; text-align: center; display: block; font-size: .82em;
        text-transform: uppercase; letter-spacing: .06em; }
      .side .skills--bars .skill { justify-items: center; }
      .side .lead { color: rgba(255,255,255,.86); font-size: .8em; text-align: justify; }

      .main { padding: 30px 30px 40px 40px; }
      .name { font-size: 1.9em; font-weight: 800; text-transform: uppercase; line-height: 1; }
      .name b { color: var(--accent-deep); }
      .role { font-size: .95em; color: var(--muted); letter-spacing: .04em; margin-top: 1px; }
      .main .sec__title { background: var(--accent-deep); color: #fff; border-radius: 99px;
        display: flex; align-items: center; gap: 10px; padding: 7px 18px; font-size: 1em; letter-spacing: .04em; }
      .main .sec__ico { color: #fff; }
      .entry__period { color: var(--ink); font-weight: 700; }
      .entry__title { color: var(--accent-deep); font-size: 1.02em; }
      .entry { grid-template-columns: 1fr; }
      .entry__side { order: -1; }
      .lead { text-align: justify; }
    `,
    layout: (d) => `
      <aside class="side">
        ${B.photo(d)}
        ${B.sec('À propos', B.profil(d))}
        ${B.sec('Contact', B.contactList(d))}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }))}
      </aside>
      <main class="main">
        <header class="head"><h1 class="name">${duoName(d)}</h1>${role(d)}</header>
        ${B.sec('Formation', B.formations(d), '', 'cap')}
        ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
        ${B.sec('Projets', B.projets(d), '', 'spark')}
        ${B.sec('Langues', B.langues(d, { style: 'dots' }), '', 'globe')}
        ${B.sec('Certifications', B.certifications(d), '', 'award')}
        ${B.sec('Références', B.references(d), '', 'users')}
      </main>`,
  },

  /* ---------------------------------------------------------------- 31. Nuit */
  {
    id: 'nuit',
    name: 'Nuit',
    desc: 'Colonne marine, intitulés sur fanions orange, jauges chiffrées à droite.',
    tags: ['Marine', 'Fanions'],
    accent: '#f97316',
    font: 'sans',
    css: `
      ${onDark('.side')}
      .page { padding: 0; }
      /* Marine posé en dur : la variable --dark se teinte de l'accent, et un
         accent orange y virerait au brun. */
      .side { float: left; width: 268px; min-height: var(--band-h); background: #10233f;
        margin-right: 26px; padding: 0 0 40px; }
      .side .photo { width: 100%; aspect-ratio: 3 / 4; overflow: hidden; }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; }
      .ident { background: #1b3a68; padding: 16px 22px 18px; }
      .name { font-size: 1.55em; font-weight: 800; text-transform: uppercase; color: #fff; line-height: 1.05; }
      .name b { color: var(--accent); }
      .role { font-size: .72em; letter-spacing: .24em; text-transform: uppercase;
        color: rgba(255,255,255,.78); margin-top: 3px; }
      .side .contact { padding: 18px 22px 4px; text-align: center; }
      .side .contact__item { justify-content: center; color: rgba(255,255,255,.86); font-size: .84em; }
      .side .contact__item .ico { display: none; }
      /* Fanion : la pointe est dessinée par un pseudo-élément, pas par une image. */
      .side .sec { margin-top: 22px; }
      .side .sec__title { background: var(--accent); color: #fff; padding: 9px 22px; font-size: .86em;
        letter-spacing: .08em; margin-right: -18px; position: relative; }
      .side .sec__title::after { content: ""; position: absolute; right: 0; top: 0; border: 17px solid transparent;
        border-right-color: #fff; }
      .side .sec__body { padding: 12px 22px 0; }
      .side .bar { height: 5px; background: rgba(255,255,255,.22); }
      .side .bar__fill { background: var(--accent); }
      .side .skill__name, .side .lang__name { color: #fff; font-size: .88em; }
      .side .skills--bars .skill { grid-template-columns: minmax(0, 1fr); }

      .main { padding: 30px 34px 40px 0; }
      .main .sec__title { color: var(--accent); font-size: 1.06em; letter-spacing: .06em;
        border-bottom: 1px solid var(--line); padding-bottom: 6px; }
      .entry { grid-template-columns: 108px minmax(0, 1fr); position: relative; padding-left: 0; }
      .entry__side { position: relative; padding-left: 18px; }
      .entry__side::before { content: ""; position: absolute; left: 0; top: 5px; width: 9px; height: 9px;
        border-radius: 50%; border: 2px solid var(--accent); background: #fff; }
      .entry__title { text-transform: uppercase; font-size: .92em; letter-spacing: .04em; }
      .entry__period { color: var(--ink); font-weight: 600; }
    `,
    layout: (d) => `
      <aside class="side">
        ${B.photo(d)}
        <header class="ident"><h1 class="name">${duoName(d)}</h1>${role(d)}</header>
        ${B.contactList(d)}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }))}
        ${B.sec('Langues', B.langues(d, { style: 'bars' }))}
        ${B.sec('Intérêts', B.interets(d))}
      </aside>
      <main class="main">
        ${B.sec('À propos', B.profil(d))}
        ${B.sec('Formation', B.formations(d))}
        ${B.sec('Expériences', B.experiences(d))}
        ${B.sec('Projets', B.projets(d))}
        ${B.sec('Certifications', B.certifications(d))}
        ${B.sec('Références', B.references(d))}
      </main>`,
  },

  /* ---------------------------------------------------------------- 32. Ancre */
  {
    id: 'ancre',
    name: 'Ancre',
    desc: 'Bandeau marine en tête, photo carrée, rubriques à pastilles orange et frise fine.',
    tags: ['Marine', 'Frise'],
    accent: '#f97316',
    font: 'sans',
    css: `
      ${onDark('.hero')}
      .page { padding: 0; }
      .hero { background: #10233f; padding: 26px 34px 26px 300px; min-height: 210px; position: relative; }
      /* Sans photo, la colonne qui lui est réservée avalerait le texte : on
         retombe alors sur une seule colonne. */
      .hero:not(:has(.photo)) { padding-left: 34px; }
      .hero .photo { position: absolute; left: 34px; top: 26px; width: 234px; height: 258px;
        overflow: hidden; border: 4px solid #fff; }
      .hero .photo img { width: 100%; height: 100%; object-fit: cover; }
      .name { font-size: 2.3em; font-weight: 800; text-transform: uppercase; color: #fff; line-height: 1.02; }
      .name b { color: var(--accent); }
      .role { font-size: .78em; letter-spacing: .28em; text-transform: uppercase;
        color: rgba(255,255,255,.86); margin-top: 4px; padding-bottom: 8px; border-bottom: 2px solid var(--accent); display: inline-block; }
      .hero .lead { color: rgba(255,255,255,.84); font-size: .86em; margin-top: 12px; }

      .cols { display: grid; grid-template-columns: 268px minmax(0, 1fr); gap: 0 30px; padding: 66px 34px 40px; }
      .sec__title { display: flex; align-items: center; gap: 11px; color: var(--ink);
        font-size: .92em; letter-spacing: .14em; padding-bottom: 6px; border-bottom: 1px solid var(--line); }
      .sec__ico { width: 24px; height: 24px; border-radius: 50%; background: var(--accent); color: #fff; }
      .side .bar { height: 5px; }
      .side .skill__name { font-size: .88em; }
      .main .entry { grid-template-columns: 96px minmax(0, 1fr); gap: 0 22px; position: relative; }
      .main .entry__side { position: relative; }
      .main .entry__main { position: relative; padding-left: 22px; }
      .main .entry__main::before { content: ""; position: absolute; left: -1px; top: 4px; width: 10px; height: 10px;
        border-radius: 50%; border: 2px solid var(--accent); background: #fff; z-index: 1; }
      .main .entry__main::after { content: ""; position: absolute; left: 4px; top: 14px; bottom: -16px; width: 1px; background: var(--accent-soft); }
      .main .entry:last-child .entry__main::after { display: none; }
      .entry__title { text-transform: uppercase; font-size: .92em; letter-spacing: .04em; }
      .entry__period { color: var(--ink); font-weight: 600; }
      .contact__item .ico { color: var(--accent); }
    `,
    layout: (d) => `
      <header class="hero">
        ${B.photo(d)}
        <h1 class="name">${duoName(d)}</h1>${role(d)}
        ${B.profil(d)}
      </header>
      <div class="cols">
        <aside class="side">
          ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
          ${B.sec('Langues', B.langues(d, { style: 'bars' }), '', 'globe')}
          ${B.sec('Contact', B.contactList(d), '', 'phone')}
          ${B.sec('Références', B.references(d), '', 'users')}
        </aside>
        <main class="main">
          ${B.sec('Formation', B.formations(d), '', 'cap')}
          ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
          ${B.sec('Projets', B.projets(d), '', 'spark')}
          ${B.sec('Certifications', B.certifications(d), '', 'award')}
          ${B.sec('Intérêts', B.interets(d), '', 'flag')}
        </main>
      </div>`,
  },

  /* ------------------------------------------------------------- 33. Nocturne */
  {
    id: 'nocturne',
    name: 'Nocturne',
    desc: 'En-tête noir, colonne bleue en médaillon, dates en étiquettes fléchées.',
    tags: ['Nocturne', 'Étiquettes'],
    accent: '#2563eb',
    font: 'sans',
    css: `
      ${onDark('.hero', '.side')}
      .page { padding: 0; }
      .hero { background: var(--dark); padding: 26px 34px 26px 300px; min-height: 190px; }
      /* Sans photo, la colonne qui lui est réservée avalerait le texte : on
         retombe alors sur une seule colonne. */
      .hero:not(:has(.photo)) { padding-left: 34px; }
      .name { font-size: 2.4em; font-weight: 800; text-transform: uppercase; color: #fff; line-height: 1; }
      .role { font-size: .72em; letter-spacing: .22em; text-transform: uppercase;
        color: rgba(255,255,255,.8); margin-top: 5px; }
      .hero .lead { color: rgba(255,255,255,.82); font-size: .86em; margin-top: 12px; }

      .side { float: left; width: 268px; background: var(--accent); margin: -150px 26px 0 34px;
        padding: 24px 22px 30px; position: relative; z-index: 2; }
      .side .photo { width: 100%; aspect-ratio: 1 / 1; border-radius: 50% 50% 46% 46%; overflow: hidden;
        border: 5px solid #fff; margin-bottom: 20px; }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; }
      .side .sec__title { display: flex; align-items: center; gap: 10px; color: #fff; font-size: 1em;
        text-transform: none; letter-spacing: 0; font-weight: 700; padding-bottom: 6px;
        border-bottom: 1px solid rgba(255,255,255,.4); }
      .side .sec__ico { width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,.22); }
      .side .bar { height: 4px; background: rgba(255,255,255,.34); }
      .side .bar__fill { background: #fff; }
      .side .skill__name, .side .lang__name { color: #fff; font-size: .86em; }
      .side .contact__item { color: rgba(255,255,255,.9); }
      .side .contact__item .ico { color: #fff; }
      .side .lang__lvl, .side .skill__lvl { color: rgba(255,255,255,.85); }

      .main { padding: 24px 34px 40px 0; }
      .main .sec__title { display: flex; align-items: center; gap: 11px; color: var(--accent-deep);
        font-size: 1.1em; text-transform: none; letter-spacing: 0; font-weight: 700;
        padding-bottom: 6px; border-bottom: 2px solid var(--accent-soft); }
      .main .sec__ico { width: 26px; height: 26px; border-radius: 50%; background: var(--accent); color: #fff; }
      .entry { grid-template-columns: 108px minmax(0, 1fr); gap: 0 20px; }
      .entry__side { position: relative; }
      .entry__period { display: inline-block; background: var(--accent); color: #fff; font-size: .72em;
        padding: 3px 10px; position: relative; }
      .entry__period::after { content: ""; position: absolute; right: -9px; top: 0; border: 9px solid transparent; border-left-color: var(--accent); }
      .entry__main { position: relative; padding-left: 20px; }
      .entry__main::before { content: ""; position: absolute; left: -2px; top: 4px; width: 10px; height: 10px;
        border-radius: 50%; border: 2px solid var(--accent); background: #fff; z-index: 1; }
      .entry__main::after { content: ""; position: absolute; left: 3px; top: 14px; bottom: -16px; width: 1px; background: var(--accent-soft); }
      .entry:last-child .entry__main::after { display: none; }
    `,
    layout: (d) => `
      <header class="hero">
        <h1 class="name">${name(d)}</h1>${role(d)}
        ${B.profil(d)}
      </header>
      <aside class="side">
        ${B.photo(d)}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
        ${B.sec('Langues', B.langues(d, { style: 'bars' }), '', 'globe')}
        ${B.sec('Contact', B.contactList(d), '', 'phone')}
        ${B.sec('Références', B.references(d), '', 'users')}
      </aside>
      <main class="main">
        ${B.sec('Formation', B.formations(d), '', 'cap')}
        ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
        ${B.sec('Projets', B.projets(d), '', 'spark')}
        ${B.sec('Certifications', B.certifications(d), '', 'award')}
        ${B.sec('Intérêts', B.interets(d), '', 'flag')}
      </main>`,
  },

  /* -------------------------------------------------------------- 34. Éclipse */
  {
    id: 'eclipse',
    name: 'Éclipse',
    desc: 'Grande photo sur fond noir, colonne sombre pleine hauteur, jauges à curseur.',
    tags: ['Sombre', 'Photo large'],
    accent: '#1d8bf1',
    font: 'sans',
    css: `
      ${onDark('.side', '.hero')}
      .page { padding: 0; }
      .side { float: left; width: 300px; min-height: var(--band-h); background: var(--dark);
        margin-right: 26px; padding: 0 22px 40px; }
      .side .photo { width: calc(100% + 44px); margin: 0 -22px 22px; aspect-ratio: 3 / 4;
        border-radius: 0 0 150px 150px; overflow: hidden; }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; }
      .side .sec__title { color: #fff; font-size: .92em; letter-spacing: .1em;
        padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,.28); }
      .side .bar { height: 3px; background: rgba(255,255,255,.3); overflow: visible; }
      .side .bar__fill { background: var(--accent); position: relative; overflow: visible; }
      .side .bar__fill::after { content: ""; position: absolute; right: -6px; top: 50%; width: 12px; height: 12px;
        transform: translateY(-50%); border-radius: 50%; background: var(--accent); border: 2px solid var(--dark); }
      .side .skill__name, .side .lang__name { color: #fff; font-size: .92em; }
      .side .contact__item { color: rgba(255,255,255,.86); }
      .side .contact__item .ico { color: var(--accent); }
      .side .entry__title { color: #fff; }

      .hero { background: var(--accent); padding: 24px 34px 22px 0; }
      .name { font-size: 2.3em; font-weight: 800; text-transform: uppercase; color: #fff; line-height: 1; }
      .name b { font-weight: 300; }
      .role { font-size: .74em; letter-spacing: .3em; text-transform: uppercase;
        color: rgba(255,255,255,.88); margin-top: 5px; }
      .hero .lead { color: rgba(255,255,255,.9); font-size: .86em; margin-top: 10px; }
      .hero .contact-inline { margin-top: 12px; color: rgba(255,255,255,.92); }
      .hero .contact-inline__item .ico { color: #fff; }

      .main { padding: 22px 34px 40px 0; }
      .main .sec__title { color: var(--accent-deep); font-size: 1.1em; letter-spacing: .02em;
        padding-bottom: 5px; border-bottom: 2px solid var(--accent); }
      .entry { grid-template-columns: 112px minmax(0, 1fr); gap: 0 18px; }
      .entry__main { position: relative; padding-left: 20px; }
      .entry__main::before { content: ""; position: absolute; left: 0; top: 5px; width: 9px; height: 9px;
        transform: rotate(45deg); border: 2px solid var(--accent); background: #fff; }
      .entry__title { text-transform: uppercase; font-size: .92em; letter-spacing: .04em; }
    `,
    layout: (d) => `
      <aside class="side">
        ${B.photo(d)}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }))}
        ${B.sec('Langues', B.langues(d, { style: 'bars' }))}
        ${B.sec('Contact', B.contactList(d))}
        ${B.sec('Références', B.references(d))}
      </aside>
      <header class="hero">
        <h1 class="name">${duoName(d)}</h1>${role(d)}
        ${B.profil(d)}
      </header>
      <main class="main">
        ${B.sec('Formation', B.formations(d))}
        ${B.sec('Expériences', B.experiences(d))}
        ${B.sec('Projets', B.projets(d))}
        ${B.sec('Certifications', B.certifications(d))}
        ${B.sec('Intérêts', B.interets(d))}
      </main>`,
  },

  /* ------------------------------------------------------------- 35. Dégradé */
  {
    id: 'degrade',
    name: 'Dégradé',
    desc: 'Colonne sombre en dégradé, intitulés en bandeaux fondus, photo en arche.',
    tags: ['Dégradé', 'Moderne'],
    accent: '#2f8ef7',
    font: 'sans',
    css: `
      ${onDark('.side')}
      .page { padding: 0; }
      .side { float: left; width: 282px; min-height: var(--band-h); margin-right: 26px;
        /* Deux teintes explicites : un color-mix imbriqué dans un dégradé
           fait tomber toute la déclaration. */
        padding: 0 22px 40px; background: linear-gradient(180deg, #0d1a2b, #1b4f85); }
      .side .photo { width: calc(100% + 44px); margin: 0 -22px 22px; aspect-ratio: 3 / 4;
        border-radius: 0 0 140px 140px; overflow: hidden; border-bottom: 4px solid #fff; }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; }
      .side .sec__title { display: inline-block; background: linear-gradient(90deg, var(--accent), var(--accent-light));
        color: #fff; border-radius: 4px; padding: 5px 16px; font-size: .82em; letter-spacing: .08em; }
      .side .entry__title, .side .skill__name, .side .lang__name { color: #fff; }
      .side .contact__item { color: rgba(255,255,255,.9); }
      .side .contact__item .ico { color: var(--accent-light); }
      .side .dot-i { background: rgba(255,255,255,.3); }
      .side .dot-i.is-on { background: var(--accent-light); }
      .side .entry { grid-template-columns: 1fr; }
      .side .entry__side { order: 2; }

      .main { padding: 26px 34px 40px 0; }
      .head { background: linear-gradient(90deg, #eef2f7, #fff); padding: 22px 26px; margin-bottom: 18px; }
      .name { font-size: 2.3em; font-weight: 300; text-transform: uppercase; line-height: 1; letter-spacing: .02em; }
      .name b { font-weight: 800; }
      .role { font-size: .72em; letter-spacing: .38em; text-transform: uppercase; color: var(--muted); margin-top: 4px; }
      .main .sec__title { display: inline-flex; align-items: center; gap: 9px;
        background: linear-gradient(90deg, var(--accent), var(--accent-light)); color: #fff;
        border-radius: 99px; padding: 6px 18px; font-size: .84em; letter-spacing: .08em; }
      .main .sec__ico { color: #fff; }
      .entry { grid-template-columns: minmax(0, 1fr); position: relative; padding-left: 24px; }
      .entry::before { content: ""; position: absolute; left: 0; top: 5px; width: 13px; height: 13px;
        border-radius: 50%; border: 3px solid var(--accent); background: #fff; z-index: 1; }
      .entry::after { content: ""; position: absolute; left: 6px; top: 18px; bottom: -12px; width: 1px; background: var(--accent-soft); }
      .entry:last-child::after { display: none; }
      .entry__side { order: -1; }
      .entry__period { color: var(--ink); font-weight: 600; }
      .skills { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; }
    `,
    layout: (d) => `
      <aside class="side">
        ${B.photo(d)}
        ${B.sec('Formation', B.formations(d))}
        ${B.sec('Langues', B.langues(d, { style: 'dots' }))}
        ${B.sec('Contact', B.contactList(d))}
        ${B.sec('Intérêts', B.interets(d))}
      </aside>
      <main class="main">
        <header class="head"><h1 class="name">${duoName(d)}</h1>${role(d)}</header>
        ${B.sec('À propos', B.profil(d), '', 'user')}
        ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
        ${B.sec('Projets', B.projets(d), '', 'spark')}
        ${B.sec('Certifications', B.certifications(d), '', 'award')}
        ${B.sec('Références', B.references(d), '', 'users')}
      </main>`,
  },

  /* -------------------------------------------------------------- 36. Grenat */
  {
    id: 'grenat',
    name: 'Grenat',
    desc: 'Colonne grise à gauche, intitulés sur bandeaux rouges, curseurs de niveau.',
    tags: ['Bandeaux', 'Classique'],
    accent: '#c81e2b',
    font: 'sans',
    css: `
      .page { padding: 0; }
      .side { float: left; width: 244px; min-height: var(--band-h); background: #ebedf0;
        margin-right: 26px; padding: 26px 22px 40px; text-align: center; }
      .side .photo { width: 150px; height: 150px; border-radius: 50%; overflow: hidden;
        border: 4px solid #fff; margin: 0 auto 18px; box-shadow: 0 2px 10px rgba(0,0,0,.14); }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); }
      .side .sec__title { display: inline-block; background: var(--accent); color: #fff;
        padding: 5px 18px; font-size: .84em; letter-spacing: .06em; }
      .side .sec { position: relative; }
      .side .sec + .sec::before { content: ""; display: block; width: 62px; height: 3px;
        background: #cfd3d9; border-radius: 99px; margin: 0 auto 18px; }
      .side .contact__item { justify-content: center; text-align: left; }
      .side .contact__item .ico { color: var(--accent); }
      .side .ref__name { font-size: .92em; }
      .side .cert__name { font-size: .9em; }

      .main { padding: 26px 34px 40px 0; }
      .name { font-size: 2.3em; font-weight: 800; text-transform: uppercase; line-height: 1; }
      .name b { color: var(--accent); }
      .role { font-size: .68em; letter-spacing: .4em; text-transform: uppercase; color: var(--muted); margin-top: 3px; }
      .about { margin-top: 14px; }
      .about .sec__title { display: inline-flex; align-items: center; gap: 8px; background: var(--accent);
        color: #fff; border-radius: 4px; padding: 4px 14px; font-size: .8em; }
      .about .sec__ico { color: #fff; }
      .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 0 26px; }
      .main .sec__title { display: flex; align-items: center; justify-content: center; gap: 9px;
        background: var(--accent); color: #fff; padding: 6px 14px; font-size: .84em; letter-spacing: .04em; }
      .main .sec__ico { color: #fff; }
      .entry__title { font-size: .96em; }
      .entry__org { font-size: .84em; }
      .entry { grid-template-columns: 1fr; }
      .entry__side { order: 2; margin-top: 4px; }
      .skills { display: grid; grid-template-columns: 1fr 1fr; gap: 0 22px; }
      .bar { height: 6px; overflow: visible; }
      .bar__fill { overflow: visible; position: relative; }
      .bar__fill::after { content: ""; position: absolute; right: -6px; top: 50%; width: 12px; height: 12px;
        transform: translateY(-50%); border-radius: 50%; background: var(--ink); }
      .lang__lvl { font-size: .76em; }
    `,
    layout: (d) => `
      <aside class="side">
        ${B.photo(d)}
        ${B.sec('Contact', B.contactList(d))}
        ${B.sec('Références', B.references(d))}
        ${B.sec('Certifications', B.certifications(d))}
        ${B.sec('Intérêts', B.interets(d))}
      </aside>
      <main class="main">
        <header class="head"><h1 class="name">${duoName(d)}</h1>${role(d)}</header>
        <div class="about">${B.sec('À propos', B.profil(d), '', 'user')}</div>
        ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
        ${B.sec('Formation', B.formations(d), '', 'cap')}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
        <div class="cols">
          ${B.sec('Projets', B.projets(d), '', 'spark')}
          ${B.sec('Langues', B.langues(d, { style: 'bars' }), '', 'globe')}
        </div>
      </main>`,
  },

  /* -------------------------------------------------------------- 37. Braise */
  {
    id: 'braise',
    name: 'Braise',
    desc: 'En-tête anthracite, bandeau de contact orange pleine largeur, titres en gouttières.',
    tags: ['Bandeau', 'Chaleureux'],
    accent: '#f97316',
    font: 'sans',
    css: `
      ${onDark('.hero', '.band')}
      .page { padding: 0; }
      .hero { background: var(--ink); padding: 26px 36px 26px 240px; min-height: 176px; position: relative; }
      /* Sans photo, la colonne qui lui est réservée avalerait le texte : on
         retombe alors sur une seule colonne. */
      .hero:not(:has(.photo)) { padding-left: 36px; }
      .hero .photo { position: absolute; left: 36px; top: 22px; width: 168px; height: 168px;
        border-radius: 50%; overflow: hidden; background: var(--accent); }
      .hero .photo img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); }
      .over { font-size: .9em; color: rgba(255,255,255,.68); }
      .name { font-size: 2.4em; font-weight: 800; color: #fff; line-height: 1.02; }
      .name b { color: var(--accent); font-weight: 400; }
      .role { font-size: .92em; color: rgba(255,255,255,.76); margin-top: 1px;
        padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,.24); }
      .hero .lead { color: rgba(255,255,255,.82); font-size: .86em; margin-top: 10px; }

      .band { background: var(--accent); padding: 11px 36px; display: flex; align-items: center; gap: 20px; }
      .band .tag { display: inline-flex; align-items: center; gap: 9px; color: #fff; font-weight: 700; font-size: .92em; }
      .band .tag i { width: 24px; height: 24px; border-radius: 50%; background: #fff; color: var(--accent);
        display: grid; place-items: center; font-style: normal; font-weight: 800; }
      .band .contact-inline { color: #fff; font-size: .84em; gap: 4px 20px; }
      .band .contact-inline__item .ico { color: rgba(255,255,255,.85); opacity: 1; }

      .cols { display: grid; grid-template-columns: 244px minmax(0, 1fr); gap: 0 30px; padding: 22px 36px 40px; }
      .sec__title { display: flex; align-items: center; gap: 10px; color: var(--ink); font-size: 1.06em;
        text-transform: none; letter-spacing: 0; font-weight: 700; }
      .sec__ico { width: 26px; height: 26px; border-radius: 50%; background: var(--accent); color: #fff; }
      .main .sec__title { background: #f1f2f4; border-radius: 99px; padding: 6px 14px; }
      .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 16px; position: relative; padding-left: 18px; }
      .entry::before { content: ""; position: absolute; left: 0; top: 7px; width: 9px; height: 9px;
        border-radius: 50%; background: var(--accent); }
      .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .entry__main { grid-column: 1; grid-row: 1; }
      .entry__period { color: var(--accent-deep); font-weight: 700; text-transform: uppercase; font-size: .78em; }
      /* En colonne étroite, la date ne peut pas partager la ligne : elle
         passe dessous, sinon l'intitulé se brise mot à mot. */
      .side .entry { grid-template-columns: minmax(0, 1fr); }
      .side .entry__side { grid-column: 1; grid-row: 2; text-align: left; margin-top: 2px; }
      .side .entry__main { grid-column: 1; grid-row: 1; }
      .side .entry__period { color: var(--accent-deep); }
      .skills { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; }
      .bar { height: 9px; border-radius: 99px; background: none; box-shadow: inset 0 0 0 1px var(--accent-soft); }
      .bar__fill { border-radius: 99px; }
      .inline-list { columns: 2; }
    `,
    layout: (d) => `
      <header class="hero">
        ${B.photo(d)}
        <p class="over">À propos</p>
        <h1 class="name">${duoName(d)}</h1>${role(d)}
        ${B.profil(d)}
      </header>
      <div class="band">
        <span class="tag"><i>✆</i> Contact</span>
        ${B.contactInline(d, { withCivil: false })}
      </div>
      <div class="cols">
        <aside class="side">
          ${B.sec('Formation', B.formations(d), '', 'cap')}
          ${B.sec('Références', B.references(d), '', 'users')}
          ${B.sec('Langues', B.langues(d, { style: 'chips' }), '', 'globe')}
          ${B.sec('Intérêts', B.interets(d), '', 'flag')}
        </aside>
        <main class="main">
          ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
          ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
          ${B.sec('Projets', B.projets(d), '', 'spark')}
          ${B.sec('Certifications', B.certifications(d), '', 'award')}
        </main>
      </div>`,
  },

  /* -------------------------------------------------------------- 38. Damier */
  {
    id: 'damier',
    name: 'Damier',
    desc: 'Repères carrés, photo cerclée, colonne étroite pour les niveaux et les loisirs.',
    tags: ['Carrés', 'Structuré'],
    accent: '#1f6fd0',
    font: 'sans',
    css: `
      .page { padding: 34px 40px 40px; }
      .head { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 0 26px; align-items: center; }
      /* Sans photo, la colonne qui lui est réservée avalerait le texte : on
         retombe alors sur une seule colonne. */
      .head:not(:has(.photo)) { grid-template-columns: minmax(0, 1fr); }
      .head .photo { width: 190px; height: 190px; border-radius: 50%; overflow: hidden;
        border: 8px solid var(--accent); position: relative; }
      .head .photo img { width: 100%; height: 100%; object-fit: cover; }
      .name { font-size: 2.2em; font-weight: 300; text-transform: uppercase; letter-spacing: .01em; }
      .name b { font-weight: 800; }
      .role { font-size: .84em; letter-spacing: .2em; text-transform: uppercase; color: var(--ink-2); margin-top: 2px; }
      .head .contact { background: var(--accent); border-radius: 8px; padding: 12px 18px; margin-top: 14px; gap: 5px; }
      .head .contact__item { color: #fff; font-size: .84em; }
      .head .contact__item .ico { color: rgba(255,255,255,.75); }

      .cols { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: 0 32px; margin-top: 22px; }
      .sec__title { display: flex; align-items: center; gap: 11px; color: var(--ink);
        font-size: .92em; letter-spacing: .3em; }
      .main .sec__title::before { content: ""; width: 13px; height: 13px; background: var(--accent);
        box-shadow: inset 0 0 0 2px #fff, 0 0 0 1px var(--accent); flex-shrink: 0; }
      .entry { grid-template-columns: 128px minmax(0, 1fr); gap: 0 18px; }
      .entry__title { font-size: .98em; }
      .entry__org { font-size: .88em; }
      .entry__period { color: var(--accent-deep); font-weight: 700; }
      .col-side .entry { grid-template-columns: minmax(0, 1fr); }
      .col-side .entry__side { order: 2; }
      .lead { text-align: justify; }
      .bar { height: 8px; border-radius: 0; }
      .bar__fill { border-radius: 0; }
      .skill__name, .lang__name { font-size: .84em; font-weight: 700; text-transform: uppercase; }
      .inline-list li { font-weight: 700; font-size: .86em; text-transform: uppercase; }
      .foot { background: #eceef1; padding: 16px 20px; margin-top: 18px; }
      .foot .sec__title { letter-spacing: .24em; }
    `,
    layout: (d) => `
      <main class="page-body">
        <header class="head">
          ${B.photo(d)}
          <div>
            <h1 class="name">${duoName(d)}</h1>${role(d)}
            ${B.contactList(d)}
          </div>
        </header>
        <div class="cols">
          <div class="main">
            ${B.sec('Profil', B.profil(d))}
            ${B.sec('Expériences', B.experiences(d))}
            ${B.sec('Formation', B.formations(d))}
            ${B.sec('Projets', B.projets(d))}
          </div>
          <aside class="col-side">
            ${B.sec('Langues', B.langues(d, { style: 'bars' }))}
            ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }))}
            ${B.sec('Intérêts', B.interets(d, { style: 'list' }))}
            ${B.sec('Certifications', B.certifications(d))}
          </aside>
        </div>
        <div class="foot">${B.sec('Références', B.references(d))}</div>
      </main>`,
  },

  /* --------------------------------------------------------------- 39. Cadre */
  {
    id: 'cadre',
    name: 'Cadre',
    desc: 'En-tête bleu plein, rubriques enfermées dans des cadres à titre coloré.',
    tags: ['Encadré', 'Institutionnel'],
    accent: '#1d7fe0',
    font: 'sans',
    css: `
      ${onDark('.hero', '.foot')}
      .page { padding: 0; }
      .hero { background: var(--accent); padding: 26px 40px; display: grid;
        grid-template-columns: 170px minmax(0, 1fr); gap: 0 26px; align-items: center; }
      /* Sans photo, la colonne qui lui est réservée avalerait le texte : on
         retombe alors sur une seule colonne. */
      .hero:not(:has(.photo)) { grid-template-columns: minmax(0, 1fr); }
      .hero .photo { width: 158px; height: 178px; overflow: hidden; border: 4px solid #fff; }
      .hero .photo img { width: 100%; height: 100%; object-fit: cover; }
      .name { font-size: 2.5em; font-weight: 800; text-transform: uppercase; color: #fff; line-height: 1; }
      .name b { font-weight: 300; }
      .role { font-size: .78em; letter-spacing: .3em; text-transform: uppercase;
        color: rgba(255,255,255,.9); margin-top: 6px; padding-top: 10px; }
      .role::before { content: ""; display: block; width: 92px; height: 3px; background: #fff; margin-bottom: 10px; }

      .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; padding: 22px 40px 24px; align-items: start; }
      .cols .sec { border: 1px solid var(--line); margin-top: 0; padding: 0 18px 16px; }
      .sec__title { display: flex; align-items: center; gap: 10px; background: var(--accent); color: #fff;
        margin: 0 -18px 14px; padding: 8px 18px; font-size: .92em; letter-spacing: .04em; }
      .sec__ico { color: #fff; }
      .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 12px; }
      .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .entry__main { grid-column: 1; grid-row: 1; }
      .entry__title { font-size: .95em; text-transform: uppercase; }
      .entry__org { font-style: italic; font-size: .84em; }
      .entry__period { color: var(--accent-deep); font-weight: 700; font-style: italic; }
      .lead { text-align: justify; }
      .skills { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; }
      .bar { height: 5px; overflow: visible; }
      .bar__fill { overflow: visible; position: relative; }
      .bar__fill::after { content: ""; position: absolute; right: -4px; top: 50%; width: 9px; height: 14px;
        transform: translateY(-50%); background: var(--accent-deep); }
      .skill__name { font-size: .78em; font-style: italic; }
      .foot { background: var(--ink); color: #fff; padding: 12px 40px; }
      .foot .contact-inline { gap: 6px 26px; font-size: .84em; color: rgba(255,255,255,.9); }
      .foot .contact-inline__item .ico { color: var(--accent-light); opacity: 1; }
    `,
    layout: (d) => `
      <header class="hero">
        ${B.photo(d)}
        <div><h1 class="name">${duoName(d)}</h1>${role(d)}</div>
      </header>
      <main class="cols">
        ${B.sec('Formation', B.formations(d), '', 'cap')}
        ${B.sec('Profil', B.profil(d), '', 'user')}
        ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
        ${B.sec('Références', B.references(d), '', 'users')}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
        ${B.sec('Projets', B.projets(d), '', 'spark')}
        ${B.sec('Langues', B.langues(d, { style: 'list' }), '', 'globe')}
        ${B.sec('Certifications', B.certifications(d), '', 'award')}
      </main>
      <footer class="foot">${B.contactInline(d, { withCivil: false })}</footer>`,
  },

  /* --------------------------------------------------------------- 40. Galet */
  {
    id: 'galet',
    name: 'Galet',
    desc: 'Cartes grises arrondies, en-tête clair, coordonnées dans un bandeau bleu.',
    tags: ['Arrondi', 'Doux'],
    accent: '#3a7ca5',
    font: 'sans',
    css: `
      .page { padding: 0; background: #fff; }
      .hero { background: #eef1f4; padding: 24px 40px 26px; display: grid;
        grid-template-columns: 176px minmax(0, 1fr); gap: 0 24px; align-items: center; }
      /* Sans photo, la colonne qui lui est réservée avalerait le texte : on
         retombe alors sur une seule colonne. */
      .hero:not(:has(.photo)) { grid-template-columns: minmax(0, 1fr); }
      .hero .photo { width: 164px; height: 164px; border-radius: 50%; overflow: hidden; border: 5px solid #fff; }
      .hero .photo img { width: 100%; height: 100%; object-fit: cover; }
      .name { font-size: 2.4em; font-weight: 800; text-transform: uppercase; line-height: .98; }
      .name b { font-weight: 300; color: var(--accent); }
      .role { font-size: .78em; letter-spacing: .3em; text-transform: uppercase; color: var(--muted); margin-top: 4px; }
      .hero .contact { background: var(--accent); border-radius: 12px; padding: 13px 18px; margin-top: 14px;
        display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; }
      .hero .contact__item { color: #fff; font-size: .82em; }
      .hero .contact__item .ico { color: rgba(255,255,255,.78); }

      .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 22px 40px 40px; align-items: start; }
      .cols .sec { background: #eef1f4; border-radius: 14px; padding: 16px 20px 20px; margin-top: 0; }
      .cols .sec--large { grid-column: 1 / -1; }
      .sec__title { display: inline-flex; align-items: center; gap: 10px; background: var(--accent); color: #fff;
        border-radius: 99px; padding: 7px 20px; font-size: .9em; letter-spacing: .03em; }
      .sec__ico { color: #fff; }
      .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 12px; }
      .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .entry__main { grid-column: 1; grid-row: 1; }
      .entry__title { font-size: .96em; text-transform: uppercase; }
      .entry__org { font-style: italic; font-size: .84em; }
      .entry__period { color: var(--accent-deep); font-weight: 700; font-style: italic; }
      .lead { text-align: justify; }
      .skills { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; }
      .bar { height: 5px; overflow: visible; background: #d5dae0; }
      .bar__fill { overflow: visible; position: relative; }
      .bar__fill::after { content: ""; position: absolute; right: -4px; top: 50%; width: 9px; height: 14px;
        transform: translateY(-50%); border-radius: 2px; background: var(--accent-deep); }
      .skill__name { font-size: .78em; font-style: italic; }
      .chip { background: #fff; }
    `,
    layout: (d) => `
      <header class="hero">
        ${B.photo(d)}
        <div>
          <h1 class="name">${duoName(d)}</h1>${role(d)}
          ${B.contactList(d)}
        </div>
      </header>
      <main class="cols">
        ${B.sec('Profil', B.profil(d), '', 'user')}
        ${B.sec('Formation', B.formations(d), '', 'cap')}
        ${B.sec('Références', B.references(d), '', 'users')}
        ${B.sec('Expériences', B.experiences(d), 'sec--large', 'briefcase')}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
        ${B.sec('Projets', B.projets(d), '', 'spark')}
        ${B.sec('Langues', B.langues(d, { style: 'chips' }), '', 'globe')}
        ${B.sec('Certifications', B.certifications(d), '', 'award')}
      </main>`,
  },

  /* -------------------------------------------------------------- 41. Lagune */
  {
    id: 'lagune',
    name: 'Lagune',
    desc: 'Colonne turquoise à droite, photo cerclée sur la couture, jauges en cannelures.',
    tags: ['Turquoise', 'Colonne'],
    accent: '#2b7a8c',
    font: 'sans',
    css: `
      ${onDark('.side')}
      .page { padding: 0; }
      .side { float: right; width: 296px; min-height: var(--band-h); background: var(--accent);
        margin-left: 26px; padding: 152px 24px 40px; }
      .side .sec__title { display: flex; align-items: center; gap: 10px; color: #fff; font-size: 1em;
        letter-spacing: .04em; padding-bottom: 7px; border-bottom: 1px solid rgba(255,255,255,.35); }
      .side .sec__ico { width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgba(255,255,255,.6); }
      .side .lead { color: rgba(255,255,255,.9); text-align: justify; font-size: .86em; }
      .side .bar { height: 8px; border-radius: 99px; background: none; box-shadow: inset 0 0 0 1px rgba(255,255,255,.6); }
      .side .bar__fill { background: #fff; border-radius: 99px; }
      .side .skill__name, .side .lang__name { color: #fff; font-size: .88em; }
      .side .chip { background: none; box-shadow: inset 0 0 0 1px rgba(255,255,255,.6); color: #fff;
        border-radius: 99px; padding: 3px 14px; }
      .side .contact__item { color: rgba(255,255,255,.92); }
      .side .contact__item .ico { color: #fff; }

      .main { padding: 28px 24px 40px 40px; }
      /* L'en-tête réserve la hauteur de la photo, qui déborde sur la couture. */
      .head { min-height: 186px; padding-right: 210px; }
      /* Sans photo, la colonne qui lui est réservée avalerait le texte : on
         retombe alors sur une seule colonne. */
      .main:not(:has(.photo)) .head { min-height: 0; padding-right: 0; }
      .name { font-size: 2.5em; font-weight: 800; text-transform: uppercase; line-height: .94; }
      .name b { color: var(--accent); font-weight: 300; }
      .role { font-size: .8em; letter-spacing: .2em; text-transform: uppercase; color: var(--muted); margin-top: 4px; }
      .main .photo { position: absolute; right: 236px; top: 30px; width: 168px; height: 168px;
        border-radius: 50%; overflow: hidden; border: 5px solid var(--ink); z-index: 3; }
      .main .photo img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); }
      .page { position: relative; }
      .main .sec__title { display: flex; align-items: center; gap: 10px; color: var(--ink);
        font-size: 1em; letter-spacing: .04em; padding-bottom: 6px; border-bottom: 1px solid var(--line); }
      .main .sec__ico { width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--accent); color: var(--accent); }
      .cols2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 22px; }
      .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 12px; }
      .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .entry__main { grid-column: 1; grid-row: 1; }
      .entry__title { font-size: .96em; text-transform: uppercase; }
      .entry__org { font-style: italic; font-size: .86em; }
      .entry__period { color: var(--accent-deep); font-weight: 700; }
    `,
    layout: (d) => `
      <aside class="side">
        ${B.sec('À propos', B.profil(d), '', 'user')}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
        ${B.sec('Langues', B.langues(d, { style: 'chips' }), '', 'globe')}
        ${B.sec('Intérêts', B.interets(d), '', 'flag')}
        ${B.sec('Contact', B.contactList(d), '', 'phone')}
      </aside>
      <main class="main">
        ${B.photo(d)}
        <header class="head"><h1 class="name">${duoName(d)}</h1>${role(d)}</header>
        ${B.sec('Formation', B.formations(d), '', 'cap')}
        ${B.sec('Références', B.references(d), '', 'users')}
        ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
        ${B.sec('Projets', B.projets(d), '', 'spark')}
        ${B.sec('Certifications', B.certifications(d), '', 'award')}
      </main>`,
  },

  /* -------------------------------------------------------------- 42. Volute */
  {
    id: 'volute',
    name: 'Volute',
    desc: 'Voile violet arrondi à gauche, accents orange, parcours en gouttière épaisse.',
    tags: ['Courbe', 'Bicolore'],
    accent: '#4c3fb5',
    font: 'sans',
    css: `
      .page { padding: 0; position: relative; overflow: hidden; }
      /* La courbe encadre la photo ; plus bas elle passerait sous les
         coordonnées, qui deviendraient illisibles. */
      .page::before { content: ""; position: absolute; left: -150px; top: -40px; width: 330px; height: 330px;
        background: var(--accent); border-radius: 0 260px 260px 0; }
      .cols { display: grid; grid-template-columns: 268px minmax(0, 1fr); gap: 0 30px;
        padding: 30px 36px 40px; position: relative; z-index: 1; }
      .side .photo { width: 176px; height: 176px; border-radius: 50%; overflow: hidden;
        border: 6px solid #fff; margin: 0 auto 22px; background: #e8eaf0; }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; }
      .side .contact { text-align: right; padding-right: 16px; position: relative; margin-bottom: 20px; }
      .side .contact::after { content: ""; position: absolute; right: 0; top: 4px; bottom: 4px; width: 3px;
        background: var(--accent); border-radius: 99px; }
      .side .contact__item { justify-content: flex-end; text-align: right; font-size: .82em; }
      .side .contact__item .ico { display: none; }
      .side .sec__title { color: var(--warn, #ea580c); color: #ea580c; font-size: 1.1em; letter-spacing: .04em; text-align: center; }
      .side .sec { text-align: center; }
      .side .skills--bars .skill { justify-items: center; }
      .side .bar { height: 5px; background: #f6ddc9; overflow: visible; }
      .side .bar__fill { background: #ea580c; overflow: visible; position: relative; }
      .side .bar__fill::after { content: ""; position: absolute; right: -5px; top: 50%; width: 11px; height: 11px;
        transform: translateY(-50%); border-radius: 3px; background: #ea580c; }
      .side .skill__name { font-size: .84em; font-weight: 700; }
      .side .ref__name { font-size: .9em; }

      .main { padding-top: 4px; }
      .name { font-size: 2.15em; font-weight: 800; text-transform: uppercase; letter-spacing: -.01em; line-height: 1; }
      .name b { font-weight: 300; }
      .role { font-size: .72em; letter-spacing: .34em; text-transform: uppercase; color: var(--muted); margin-top: 4px; }
      .about .sec__title { display: inline-flex; align-items: center; gap: 8px; background: #ea580c; color: #fff;
        border-radius: 99px; padding: 4px 16px; font-size: .8em; }
      .about .sec__ico { color: #fff; }
      .main .sec__title { display: flex; align-items: center; gap: 10px; color: #ea580c; font-size: 1.35em;
        letter-spacing: .01em; }
      .main .sec__ico { width: 26px; height: 26px; color: var(--accent); }
      .main .sec__title::after { content: ""; flex: 1; height: 2px; background: #ea580c; max-width: 120px; }
      /* Déclaré après la règle générale, sinon le filet et l'étirement de
         celle-ci reprendraient le dessus sur la pastille. */
      .main .about .sec__title { display: inline-flex; flex: 0 0 auto; font-size: .8em; color: #fff; }
      .main .about .sec__title::after { display: none; }
      .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 14px; position: relative; padding-left: 20px; }
      .entry::before { content: ""; position: absolute; left: 0; top: 4px; bottom: 4px; width: 11px;
        border-radius: 99px; background: var(--accent); }
      .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .entry__main { grid-column: 1; grid-row: 1; }
      .entry__title { text-transform: uppercase; font-size: .95em; }
      .entry__period { font-weight: 700; font-size: .76em; }
    `,
    layout: (d) => `
      <div class="cols">
        <aside class="side">
          ${B.photo(d)}
          ${B.contactList(d)}
          ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }))}
          ${B.sec('Références', B.references(d))}
          ${B.sec('Langues', B.langues(d, { style: 'list' }))}
        </aside>
        <main class="main">
          <header class="head"><h1 class="name">${duoName(d)}</h1>${role(d)}</header>
          <div class="about">${B.sec('À propos', B.profil(d), '', 'user')}</div>
          ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
          ${B.sec('Formation', B.formations(d), '', 'cap')}
          ${B.sec('Projets', B.projets(d), '', 'spark')}
          ${B.sec('Certifications', B.certifications(d), '', 'award')}
          ${B.sec('Intérêts', B.interets(d), '', 'flag')}
        </main>
      </div>`,
  },

  /* ------------------------------------------------------------- 43. Sillage */
  {
    id: 'sillage',
    name: 'Sillage',
    desc: 'Colonne bleu nuit, photo cerclée sur l’angle, frise verticale continue à droite.',
    tags: ['Nocturne', 'Frise'],
    accent: '#2196e3',
    font: 'sans',
    css: `
      ${onDark('.side')}
      .page { padding: 0; }
      .side { float: left; width: 280px; min-height: var(--band-h); background: var(--dark);
        margin-right: 26px; padding: 176px 24px 40px; position: relative; }
      .side::before { content: ""; position: absolute; left: 0; top: 0; width: 100%; height: 130px;
        background: var(--accent); clip-path: polygon(0 0, 100% 0, 0 100%); }
      .side .photo { position: absolute; left: 50%; top: 24px; transform: translateX(-50%);
        width: 150px; height: 150px; border-radius: 50%; overflow: hidden; border: 5px solid var(--accent); background: #dfe3ea; }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; }
      .side .sec__title { display: flex; align-items: center; gap: 10px; color: #fff; font-size: 1.02em; letter-spacing: .04em; }
      .side .sec__ico { width: 26px; height: 26px; border-radius: 50%; background: var(--accent); color: #fff; }
      .side .contact__item { color: rgba(255,255,255,.88); font-size: .84em; position: relative; padding-left: 4px; }
      .side .contact__item .ico { color: var(--accent); }
      .side .sec + .sec { border-top: 1px dashed rgba(255,255,255,.28); padding-top: 16px; }
      .side .entry { grid-template-columns: minmax(0, 1fr); }
      .side .entry__side { grid-column: 1; grid-row: 2; text-align: left; margin-top: 3px; }
      .side .entry__main { grid-column: 1; grid-row: 1; }
      .side .entry__title { color: #fff; font-size: .92em; text-transform: uppercase; }
      .side .entry__period { color: var(--accent); font-weight: 600; }

      .main { padding: 34px 34px 40px 0; position: relative; }
      .head { background: #eef1f5; padding: 16px 22px; margin-bottom: 20px; }
      .name { font-size: 2.15em; font-weight: 800; text-transform: uppercase; line-height: 1; }
      .name b { color: var(--accent); font-weight: 300; }
      .role { font-size: .72em; letter-spacing: .3em; text-transform: uppercase; color: var(--muted); margin-top: 3px; }
      .main .sec { position: relative; padding-left: 34px; }
      .main .sec::before { content: ""; position: absolute; left: 12px; top: 8px; bottom: -14px; width: 2px; background: var(--ink); }
      .main .sec:last-child::before { display: none; }
      .main .sec__title { display: flex; align-items: center; gap: 11px; color: var(--ink); font-size: 1.05em; letter-spacing: .04em; }
      .main .sec__ico { width: 26px; height: 26px; border-radius: 50%; background: var(--accent); color: #fff;
        position: absolute; left: 0; }
      .main .sec__title { padding-left: 34px; margin-left: -34px; background: #fff; }
      .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 14px; position: relative; }
      .entry::before { content: ""; position: absolute; left: -27px; top: 6px; width: 9px; height: 9px;
        border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 3px #fff; }
      .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .entry__main { grid-column: 1; grid-row: 1; }
      .entry__title { text-transform: uppercase; font-size: .95em; }
      .entry__org { font-style: italic; }
      .entry__period { color: var(--accent); font-weight: 700; }
      .skills { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; }
      .bar { height: 6px; }
    `,
    layout: (d) => `
      <aside class="side">
        ${B.photo(d)}
        ${B.sec('Contact', B.contactList(d), '', 'phone')}
        ${B.sec('Références', B.references(d), '', 'users')}
        ${B.sec('Formation', B.formations(d), '', 'cap')}
        ${B.sec('Langues', B.langues(d, { style: 'list' }), '', 'globe')}
      </aside>
      <main class="main">
        <header class="head"><h1 class="name">${duoName(d)}</h1>${role(d)}</header>
        ${B.sec('À propos', B.profil(d), '', 'user')}
        ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
        ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }), '', 'chart')}
        ${B.sec('Projets', B.projets(d), '', 'spark')}
        ${B.sec('Certifications', B.certifications(d), '', 'award')}
      </main>`,
  },

  /* --------------------------------------------------------------- 44. Trait */
  {
    id: 'trait',
    name: 'Trait',
    desc: 'Noir et blanc, fil vertical ponctué de pastilles, aucune couleur superflue.',
    tags: ['Épuré', 'Monochrome'],
    accent: '#111827',
    font: 'sans',
    css: `
      .page { padding: 34px 40px 40px; }
      .cols { display: grid; grid-template-columns: 232px minmax(0, 1fr); gap: 0 34px; }
      .side, .main { position: relative; padding-left: 26px; }
      .side::before, .main::before { content: ""; position: absolute; left: 5px; top: 8px; bottom: 0; width: 2px; background: var(--ink); }
      .side .sec, .main .sec { position: relative; }
      .side .sec__title, .main .sec__title { color: var(--ink); font-size: .88em; letter-spacing: .08em; }
      .side .sec__title::before, .main .sec__title::before { content: ""; position: absolute; left: -26px; top: 1px;
        width: 12px; height: 12px; border-radius: 50%; background: var(--ink); }

      .side .photo { width: 168px; height: 168px; border-radius: 50%; overflow: hidden;
        border: 2px solid var(--ink); margin-bottom: 18px; }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); }
      .name { font-size: 2.1em; font-weight: 300; text-transform: uppercase; line-height: 1; }
      .name b { display: block; font-weight: 800; }
      .role { font-size: .8em; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); margin-top: 4px; }
      .side .head { position: relative; margin-bottom: 20px; }
      .side .head::before { content: ""; position: absolute; left: -26px; top: 6px; width: 12px; height: 12px;
        border-radius: 50%; background: var(--ink); }

      .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 14px; }
      .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .entry__main { grid-column: 1; grid-row: 1; }
      .entry__title { text-transform: uppercase; font-size: .92em; letter-spacing: .04em; }
      .entry__period { font-weight: 800; color: var(--ink); }
      .lead { text-align: justify; }
      .skills--bars .bar { height: 10px; background: none; }
      .bar__fill { background: none; }
      .skill__name { font-size: .84em; text-transform: uppercase; font-weight: 700; letter-spacing: .05em; }
      .lang__name { text-transform: uppercase; font-weight: 700; font-size: .84em; }
      .chip { background: #f1f2f4; color: var(--ink); border-radius: 3px; }
      .foot { text-align: right; font-size: .8em; letter-spacing: .1em; text-transform: uppercase;
        color: var(--muted); margin-top: 20px; }
    `,
    layout: (d) => `
      <main class="page-body">
        <div class="cols">
          <aside class="side">
            ${B.photo(d)}
            <header class="head"><h1 class="name">${duoName(d)}</h1>${role(d)}</header>
            ${B.sec('Contact', B.contactList(d))}
            ${B.sec('Références', B.references(d))}
            ${B.sec('Langues', B.langues(d, { style: 'dots' }))}
          </aside>
          <div class="main">
            ${B.sec('À propos', B.profil(d))}
            ${B.sec('Formation', B.formations(d))}
            ${B.sec('Expériences', B.experiences(d))}
            ${B.sec('Compétences', B.competences(d, { style: 'dots', grouped: false }))}
            ${B.sec('Projets', B.projets(d))}
            ${B.sec('Certifications', B.certifications(d))}
            ${B.sec('Intérêts', B.interets(d))}
          </div>
        </div>
      </main>`,
  },

  /* ----------------------------------------------------------- 45. Orchidée */
  {
    id: 'orchidee',
    name: 'Orchidée',
    desc: 'Carte bordée à gauche en arche, barres violettes, intitulés en capitales serrées.',
    tags: ['Arche', 'Violet'],
    accent: '#6d28d9',
    font: 'sans',
    css: `
      .page { padding: 30px 34px 40px; background: #f6f7f9; }
      .cols { display: grid; grid-template-columns: 262px minmax(0, 1fr); gap: 0 30px; }
      .side { border: 1px solid #c9ccd4; border-radius: 130px 130px 18px 18px; padding: 26px 22px 28px;
        background: #fff; text-align: center; }
      .side .photo { width: 168px; height: 168px; border-radius: 50%; overflow: hidden;
        margin: 0 auto 18px; background: #e6e8ee; position: relative; }
      .side .photo img { width: 100%; height: 100%; object-fit: cover; }
      .side .sec__title { color: var(--ink); font-size: 1.15em; letter-spacing: .02em; }
      .side .contact__item { justify-content: center; font-size: .84em; }
      .side .contact__item .ico { display: none; }
      .side .sec { border-top: 1px solid var(--line); padding-top: 14px; }
      .side .ref__name { font-size: .88em; }
      .side .ref__contact { font-size: .78em; }
      .side .skills--bars .skill { justify-items: center; }
      .side .bar { height: 5px; background: #e4e0f4; overflow: visible; }
      .side .bar__fill { overflow: visible; position: relative; }
      .side .bar__fill::after { content: ""; position: absolute; right: -5px; top: 50%; width: 11px; height: 11px;
        transform: translateY(-50%); border-radius: 3px; background: var(--accent); }
      .side .skill__name { font-size: .82em; font-weight: 700; }
      .side .inline-list { text-align: right; }

      .main { background: #fff; border-radius: 18px; padding: 24px 26px 28px; }
      .name { font-size: 2.2em; font-weight: 300; text-transform: uppercase; line-height: 1; }
      .name b { font-weight: 800; color: var(--accent-deep); }
      .role { font-size: .74em; letter-spacing: .34em; text-transform: uppercase; color: var(--muted); margin-top: 3px; }
      .rule { height: 12px; border-radius: 99px; background: var(--accent); margin: 12px 0 16px; }
      .about .sec__title { display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--line);
        border-radius: 99px; padding: 4px 14px; color: var(--ink); font-size: .78em; }
      .about .sec__ico { color: var(--accent); }
      .main .sec__title { display: flex; align-items: center; gap: 11px; color: var(--ink);
        font-size: 1.28em; letter-spacing: .01em; }
      .main .sec__ico { width: 26px; height: 26px; color: var(--accent); }
      .entry { grid-template-columns: minmax(0, 1fr) auto; gap: 0 14px; position: relative; padding-left: 18px; }
      .entry::before { content: ""; position: absolute; left: 0; top: 4px; bottom: 4px; width: 9px;
        border-radius: 99px; background: var(--ink); }
      .entry__side { grid-column: 2; grid-row: 1; text-align: right; }
      .entry__main { grid-column: 1; grid-row: 1; }
      .entry__title { text-transform: uppercase; font-size: .95em; }
      .entry__period { color: var(--accent); font-weight: 700; font-size: .76em; }
    `,
    layout: (d) => `
      <div class="cols">
        <aside class="side">
          ${B.photo(d)}
          ${B.sec('Contact', B.contactList(d))}
          ${B.sec('Références', B.references(d))}
          ${B.sec('Compétences', B.competences(d, { style: 'bars', grouped: false }))}
          ${B.sec('Intérêts', B.interets(d, { style: 'list' }))}
        </aside>
        <main class="main">
          <header class="head"><h1 class="name">${duoName(d)}</h1>${role(d)}</header>
          <div class="rule"></div>
          <div class="about">${B.sec('À propos', B.profil(d), '', 'user')}</div>
          ${B.sec('Expériences', B.experiences(d), '', 'briefcase')}
          ${B.sec('Formation', B.formations(d), '', 'cap')}
          ${B.sec('Projets', B.projets(d), '', 'spark')}
          ${B.sec('Langues', B.langues(d, { style: 'list' }), '', 'globe')}
          ${B.sec('Certifications', B.certifications(d), '', 'award')}
        </main>
      </div>`,
  },
];

/* =====================================================================
   Le catalogue.

   Le tableau ci-dessus décrit les *mises en page* : du code, figé dans ce
   fichier. Le catalogue, lui, est administrable — il vient du serveur et
   se contente de désigner une mise en page en l'habillant d'un nom, d'une
   description, d'étiquettes, d'une couleur et d'un rang.

   Tant que le serveur n'a pas répondu, les mises en page tiennent lieu de
   catalogue : la galerie reste utilisable, et un rendu déclenché avant le
   chargement (une miniature, une impression) sort correct.
   ===================================================================== */

export const LAYOUTS = TEMPLATES;
export const LAYOUT_BY_ID = Object.fromEntries(LAYOUTS.map((t) => [t.id, t]));

/** Une mise en page vue comme une entrée de catalogue, faute de mieux. */
const fromLayout = (l) => ({
  ...l, base: l.id, builtin: true, visible: true, position: 0, usage: 0,
});

/**
 * Une ligne du catalogue rendue utilisable : on lui greffe le CSS et la
 * fonction d'assemblage de sa mise en page, et on comble ce qu'elle
 * laisse vide (couleur, police, description) avec les valeurs d'origine.
 */
export function resolveTemplate(row) {
  const base = LAYOUT_BY_ID[row.base] || LAYOUTS[0];
  return {
    ...row,
    css: base.css,
    layout: base.layout,
    accent: row.accent || base.accent,
    font: row.font || base.font,
    desc: row.desc ?? base.desc,
    tags: row.tags ?? base.tags,
  };
}

let CATALOG = LAYOUTS.map(fromLayout);
let BY_ID = new Map(CATALOG.map((t) => [t.id, t]));

/** Le catalogue publié, dans l'ordre de la galerie. */
export const catalog = () => CATALOG;

/** Remplace le catalogue par ce que renvoie le serveur. */
export function setCatalog(rows) {
  if (!Array.isArray(rows)) return CATALOG;
  CATALOG = rows.map(resolveTemplate);
  BY_ID = new Map(CATALOG.map((t) => [t.id, t]));
  return CATALOG;
}

/**
 * Rend des modèles résolvables sans les publier — l'administration s'en
 * sert pour prévisualiser les modèles masqués, qui n'ont rien à faire
 * dans la galerie mais doivent tout de même se dessiner.
 */
export function registerTemplates(rows) {
  for (const row of rows || []) BY_ID.set(row.id, resolveTemplate(row));
}

/**
 * Le modèle d'un CV. Un modèle retiré du catalogue reste rendu par sa
 * mise en page : masquer « Moderne » ne doit pas redessiner les CV qui
 * s'en servent.
 */
export const getTemplate = (id) =>
  BY_ID.get(id)
  || (LAYOUT_BY_ID[id] ? fromLayout(LAYOUT_BY_ID[id]) : null)
  || CATALOG[0]
  || fromLayout(LAYOUTS[0]);
