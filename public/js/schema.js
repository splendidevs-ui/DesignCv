/* =====================================================================
   Schéma déclaratif du CV.
   Chaque rubrique décrite ici génère automatiquement son étape de
   formulaire, sa progression et son rendu dans les modèles.
   ===================================================================== */

export const SKILL_LEVELS = ['Notions', 'Débutant', 'Intermédiaire', 'Avancé', 'Expert'];

export const LANG_LEVELS = [
  'A1 — Découverte',
  'A2 — Élémentaire',
  'B1 — Intermédiaire',
  'B2 — Avancé',
  'C1 — Autonome',
  'C2 — Maîtrise',
  'Langue maternelle',
];

export const CONTRACTS = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance', 'Intérim', 'Bénévolat', 'Autre'];

export const SKILL_CATEGORIES = [
  'Techniques', 'Logiciels', 'Langages', 'Gestion de projet',
  'Communication', 'Savoir-être', 'Métier',
];

/* --------------------------------------------------------------- rubriques */

export const SECTIONS = [
  {
    id: 'identite',
    label: 'Informations personnelles',
    short: 'Identité',
    icon: '👤',
    kind: 'single',
    hint: "Ces informations composent l'en-tête de votre CV. Le prénom, le nom et le titre professionnel sont ceux qui ressortent le plus visuellement.",
    fields: [
      { name: 'photo', type: 'photo', label: 'Photo de profil', width: 'full', help: 'Facultative. Format carré conseillé, 5 Mo maximum.' },
      { name: 'prenom', type: 'text', label: 'Prénom', required: true, placeholder: 'Ibrahim', autocomplete: 'given-name' },
      { name: 'nom', type: 'text', label: 'Nom', required: true, placeholder: 'Fofana', autocomplete: 'family-name' },
      { name: 'titre', type: 'text', label: 'Titre professionnel', width: 'full', placeholder: 'Développeur Full-Stack · React & Node.js', help: 'La ligne qui résume votre positionnement, juste sous votre nom.' },
      { name: 'email', type: 'email', label: 'Adresse e-mail', placeholder: 'prenom.nom@email.com', autocomplete: 'email' },
      { name: 'telephone', type: 'tel', label: 'Téléphone', placeholder: '+225 07 00 00 00 00', autocomplete: 'tel' },
      { name: 'adresse', type: 'text', label: 'Adresse', width: 'full', placeholder: '12 rue des Jardins' },
      { name: 'ville', type: 'text', label: 'Ville', placeholder: 'Abidjan' },
      { name: 'pays', type: 'text', label: 'Pays', placeholder: "Côte d'Ivoire" },
      { name: 'dateNaissance', type: 'text', label: 'Date de naissance', placeholder: '12/05/1994' },
      { name: 'nationalite', type: 'text', label: 'Nationalité', placeholder: 'Ivoirienne' },
      { name: 'permis', type: 'text', label: 'Permis / mobilité', placeholder: 'Permis B — véhiculé' },
      { name: 'linkedin', type: 'url', label: 'LinkedIn', placeholder: 'linkedin.com/in/…' },
      { name: 'github', type: 'url', label: 'GitHub', placeholder: 'github.com/…' },
      { name: 'portfolio', type: 'url', label: 'Site / Portfolio', placeholder: 'monsite.com' },
    ],
    isFilled: (v) => Boolean(v.prenom && v.nom),
  },

  {
    id: 'profil',
    label: 'Profil & accroche',
    short: 'Profil',
    icon: '✍️',
    kind: 'single',
    hint: "Trois à cinq phrases pour situer votre expertise, vos réalisations marquantes et ce que vous cherchez. C'est le premier paragraphe lu par un recruteur.",
    fields: [
      {
        name: 'accroche', type: 'textarea', label: 'Résumé professionnel', width: 'full', rows: 7, max: 700,
        placeholder: "Développeur full-stack avec 5 ans d'expérience sur des applications web à fort trafic…",
        help: 'Privilégiez des faits chiffrés : équipes encadrées, budgets, volumes, résultats obtenus.',
      },
    ],
    isFilled: (v) => Boolean(v.accroche?.trim()),
  },

  {
    id: 'experiences',
    label: 'Expériences professionnelles',
    short: 'Expériences',
    icon: '💼',
    kind: 'repeatable',
    itemLabel: 'expérience',
    hint: "Commencez par le poste le plus récent. Vous pouvez réorganiser les blocs par glisser-déposer.",
    summary: (v) => v.poste || 'Nouvelle expérience',
    subtitle: (v) => [v.entreprise, periodLabel(v.debut, v.fin, v.enPoste)].filter(Boolean).join(' · '),
    fields: [
      { name: 'poste', type: 'text', label: 'Intitulé du poste', width: 'full', required: true, placeholder: 'Développeur Full-Stack' },
      { name: 'entreprise', type: 'text', label: 'Entreprise', placeholder: 'Orange Côte d’Ivoire' },
      { name: 'ville', type: 'text', label: 'Lieu', placeholder: 'Abidjan · Télétravail' },
      { name: 'contrat', type: 'select', label: 'Type de contrat', options: CONTRACTS },
      { name: 'debut', type: 'month', label: 'Date de début' },
      { name: 'fin', type: 'month', label: 'Date de fin', disabledBy: 'enPoste' },
      { name: 'enPoste', type: 'checkbox', label: "J'occupe actuellement ce poste", width: 'full' },
      {
        name: 'description', type: 'lines', label: 'Missions & réalisations', width: 'full', rows: 6,
        placeholder: "Conception de l'architecture front-end de la plateforme (React, TypeScript)\nRéduction de 40 % du temps de chargement\nEncadrement de 3 développeurs juniors",
        help: 'Une ligne par puce. Commencez par un verbe d’action et ajoutez un résultat mesurable.',
      },
      { name: 'technos', type: 'tags', label: 'Environnement technique', width: 'full', placeholder: 'React, Node.js, PostgreSQL…' },
    ],
    newItem: () => ({ poste: '', entreprise: '', ville: '', contrat: '', debut: '', fin: '', enPoste: false, description: '', technos: [] }),
  },

  {
    id: 'formations',
    label: 'Formation & diplômes',
    short: 'Formation',
    icon: '🎓',
    kind: 'repeatable',
    itemLabel: 'formation',
    hint: 'Du diplôme le plus élevé au plus ancien. Les formations courtes et certifiantes ont leur propre rubrique.',
    summary: (v) => v.diplome || 'Nouvelle formation',
    subtitle: (v) => [v.etablissement, periodLabel(v.debut, v.fin, v.enCours)].filter(Boolean).join(' · '),
    fields: [
      { name: 'diplome', type: 'text', label: 'Diplôme / intitulé', width: 'full', required: true, placeholder: 'Master 2 Informatique — Génie logiciel' },
      { name: 'etablissement', type: 'text', label: 'Établissement', placeholder: 'Université Félix Houphouët-Boigny' },
      { name: 'ville', type: 'text', label: 'Lieu', placeholder: 'Abidjan' },
      { name: 'debut', type: 'month', label: 'Date de début' },
      { name: 'fin', type: 'month', label: "Date d'obtention", disabledBy: 'enCours' },
      { name: 'enCours', type: 'checkbox', label: 'Formation en cours', width: 'full' },
      { name: 'mention', type: 'text', label: 'Mention / résultat', width: 'full', placeholder: 'Mention Bien' },
      { name: 'description', type: 'lines', label: 'Précisions', width: 'full', rows: 4, placeholder: "Spécialisation systèmes distribués\nMémoire sur l'optimisation des files de messages", help: 'Une ligne par puce. Facultatif.' },
    ],
    newItem: () => ({ diplome: '', etablissement: '', ville: '', debut: '', fin: '', enCours: false, mention: '', description: '' }),
  },

  {
    id: 'competences',
    label: 'Compétences',
    short: 'Compétences',
    icon: '⚙️',
    kind: 'repeatable',
    itemLabel: 'compétence',
    hint: 'Regroupez vos compétences par catégorie : les modèles les affichent groupées. Restez honnête sur les niveaux, ils sont souvent testés en entretien.',
    summary: (v) => v.nom || 'Nouvelle compétence',
    subtitle: (v) => [v.categorie, SKILL_LEVELS[(v.niveau || 3) - 1]].filter(Boolean).join(' · '),
    compact: true,
    fields: [
      { name: 'nom', type: 'text', label: 'Compétence', required: true, placeholder: 'JavaScript' },
      { name: 'categorie', type: 'text', label: 'Catégorie', placeholder: 'Langages', suggestions: SKILL_CATEGORIES },
      { name: 'niveau', type: 'level', label: 'Niveau de maîtrise', width: 'full' },
    ],
    newItem: () => ({ nom: '', categorie: '', niveau: 3 }),
  },

  {
    id: 'langues',
    label: 'Langues',
    short: 'Langues',
    icon: '🌍',
    kind: 'repeatable',
    itemLabel: 'langue',
    hint: 'Les niveaux suivent le cadre européen (CECRL). Indiquez « Langue maternelle » pour votre langue d’origine.',
    summary: (v) => v.langue || 'Nouvelle langue',
    subtitle: (v) => v.niveau || '',
    compact: true,
    fields: [
      { name: 'langue', type: 'text', label: 'Langue', required: true, placeholder: 'Anglais' },
      { name: 'niveau', type: 'select', label: 'Niveau', options: LANG_LEVELS },
      { name: 'precision', type: 'text', label: 'Précision', width: 'full', placeholder: 'TOEIC 890 — contexte professionnel' },
    ],
    newItem: () => ({ langue: '', niveau: 'B2 — Avancé', precision: '' }),
  },

  {
    id: 'certifications',
    label: 'Certifications',
    short: 'Certifications',
    icon: '🏅',
    kind: 'repeatable',
    itemLabel: 'certification',
    hint: 'Certifications, habilitations et formations courtes obtenues hors cursus diplômant.',
    summary: (v) => v.intitule || 'Nouvelle certification',
    subtitle: (v) => [v.organisme, v.annee].filter(Boolean).join(' · '),
    compact: true,
    fields: [
      { name: 'intitule', type: 'text', label: 'Intitulé', width: 'full', required: true, placeholder: 'AWS Certified Solutions Architect' },
      { name: 'organisme', type: 'text', label: 'Organisme', placeholder: 'Amazon Web Services' },
      { name: 'annee', type: 'text', label: 'Année', placeholder: '2024' },
      { name: 'url', type: 'url', label: 'Lien de vérification', width: 'full', placeholder: 'credly.com/…' },
    ],
    newItem: () => ({ intitule: '', organisme: '', annee: '', url: '' }),
  },

  {
    id: 'projets',
    label: 'Projets & réalisations',
    short: 'Projets',
    icon: '🚀',
    kind: 'repeatable',
    itemLabel: 'projet',
    hint: 'Projets personnels, associatifs ou open source qui démontrent vos compétences au-delà de vos postes.',
    summary: (v) => v.nom || 'Nouveau projet',
    subtitle: (v) => [v.role, v.annee].filter(Boolean).join(' · '),
    fields: [
      { name: 'nom', type: 'text', label: 'Nom du projet', width: 'full', required: true, placeholder: 'Plateforme de covoiturage étudiant' },
      { name: 'role', type: 'text', label: 'Votre rôle', placeholder: 'Développeur principal' },
      { name: 'annee', type: 'text', label: 'Année', placeholder: '2025' },
      { name: 'url', type: 'url', label: 'Lien', width: 'full', placeholder: 'github.com/…' },
      { name: 'description', type: 'lines', label: 'Description', width: 'full', rows: 4, placeholder: "Application web reliant 2 000 étudiants\nPaiement mobile intégré", help: 'Une ligne par puce.' },
      { name: 'technos', type: 'tags', label: 'Technologies', width: 'full', placeholder: 'Vue.js, Firebase…' },
    ],
    newItem: () => ({ nom: '', role: '', annee: '', url: '', description: '', technos: [] }),
  },

  {
    id: 'interets',
    label: "Centres d'intérêt",
    short: 'Intérêts',
    icon: '🎯',
    kind: 'single',
    hint: "Quelques activités qui vous rendent mémorable. Deux à six suffisent — préférez le spécifique (« marathon », « échecs en club ») au générique (« sport », « lecture »).",
    fields: [
      { name: 'liste', type: 'tags', label: "Centres d'intérêt", width: 'full', placeholder: 'Photographie argentique, course à pied…' },
      { name: 'benevolat', type: 'lines', label: 'Engagement associatif', width: 'full', rows: 3, placeholder: "Trésorier de l'association des développeurs d'Abidjan (2023-2025)", help: 'Une ligne par engagement. Facultatif.' },
    ],
    isFilled: (v) => Boolean(v.liste?.length || v.benevolat?.trim()),
  },

  {
    id: 'references',
    label: 'Références',
    short: 'Références',
    icon: '🤝',
    kind: 'repeatable',
    itemLabel: 'référence',
    hint: 'Rubrique facultative : laissez-la vide si vous préférez la mention « références disponibles sur demande ». Demandez toujours leur accord avant de citer quelqu’un.',
    summary: (v) => v.nom || 'Nouvelle référence',
    subtitle: (v) => [v.poste, v.entreprise].filter(Boolean).join(' · '),
    fields: [
      { name: 'nom', type: 'text', label: 'Nom et prénom', required: true, placeholder: 'Awa Koné' },
      { name: 'poste', type: 'text', label: 'Fonction', placeholder: 'Directrice technique' },
      { name: 'entreprise', type: 'text', label: 'Entreprise', placeholder: 'Orange CI' },
      { name: 'email', type: 'email', label: 'E-mail', placeholder: 'a.kone@email.com' },
      { name: 'telephone', type: 'tel', label: 'Téléphone', width: 'full', placeholder: '+225 …' },
    ],
    newItem: () => ({ nom: '', poste: '', entreprise: '', email: '', telephone: '' }),
  },
];

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

/* --------------------------------------------------------------- utilitaires */

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** '2024-03' → 'mars 2024' */
export function monthLabel(value) {
  if (!value) return '';
  const [y, m] = String(value).split('-');
  if (!y) return '';
  const idx = Number(m) - 1;
  return MONTHS[idx] ? `${MONTHS[idx]} ${y}` : y;
}

/** Construit « mars 2022 — aujourd'hui ». */
export function periodLabel(start, end, ongoing) {
  const a = monthLabel(start);
  const b = ongoing ? "aujourd'hui" : monthLabel(end);
  if (a && b) return `${a} — ${b}`;
  return a || b || '';
}

/** Durée lisible entre deux dates de type '2024-03'. */
export function durationLabel(start, end, ongoing) {
  if (!start) return '';
  const [ys, ms] = String(start).split('-').map(Number);
  if (!ys) return '';

  let ye, me;
  if (ongoing || !end) {
    const today = new Date();
    ye = today.getFullYear();
    me = today.getMonth() + 1;
  } else {
    [ye, me] = String(end).split('-').map(Number);
    if (!ye) return '';
  }

  const months = (ye - ys) * 12 + ((me || 1) - (ms || 1)) + 1;
  if (months < 1) return '';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years && `${years} an${years > 1 ? 's' : ''}`, rest && `${rest} mois`].filter(Boolean).join(' ');
}

/** Structure vide d'un CV. */
export function emptyCvData() {
  const data = {};
  for (const section of SECTIONS) {
    if (section.kind === 'repeatable') { data[section.id] = []; continue; }
    data[section.id] = Object.fromEntries(section.fields.map((f) => [f.name, defaultValue(f)]));
  }
  return data;
}

function defaultValue(field) {
  if (field.type === 'tags') return [];
  if (field.type === 'checkbox') return false;
  if (field.type === 'level') return 3;
  return '';
}

/** Normalise des données venant du serveur (tolère un schéma incomplet). */
export function normalizeCvData(raw) {
  const base = emptyCvData();
  if (!raw || typeof raw !== 'object') return base;

  for (const section of SECTIONS) {
    const incoming = raw[section.id];
    if (section.kind === 'repeatable') {
      base[section.id] = Array.isArray(incoming)
        ? incoming.map((item) => ({ ...section.newItem(), ...(item && typeof item === 'object' ? item : {}) }))
        : [];
    } else if (incoming && typeof incoming === 'object') {
      base[section.id] = { ...base[section.id], ...incoming };
    }
  }
  return base;
}

/** true si la rubrique contient quelque chose d'exploitable. */
export function isSectionFilled(section, data) {
  const value = data[section.id];
  if (section.kind === 'repeatable') return Array.isArray(value) && value.length > 0;
  if (section.isFilled) return section.isFilled(value || {});
  return Object.values(value || {}).some((v) => (Array.isArray(v) ? v.length : Boolean(v)));
}

/** Nombre d'éléments d'une rubrique répétable (pour le compteur du rail). */
export function sectionCount(section, data) {
  return section.kind === 'repeatable' ? (data[section.id]?.length || 0) : 0;
}

/** Taux de complétion global, en pourcentage entier. */
export function completion(data) {
  const filled = SECTIONS.filter((s) => isSectionFilled(s, data)).length;
  return Math.round((filled / SECTIONS.length) * 100);
}
