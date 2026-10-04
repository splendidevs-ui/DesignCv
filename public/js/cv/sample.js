/* Jeu de données fictif : sert d'aperçu dans la galerie de modèles et de
   contenu de démonstration pour un nouveau CV. */

export const SAMPLE_DATA = {
  identite: {
    photo: '',
    prenom: 'Aminata',
    nom: 'Traoré',
    titre: 'Cheffe de projet digital · Product Owner certifiée',
    email: 'aminata.traore@email.com',
    telephone: '+225 07 58 41 22 90',
    adresse: '14 boulevard Latrille',
    ville: 'Abidjan',
    pays: "Côte d'Ivoire",
    dateNaissance: '',
    nationalite: 'Ivoirienne',
    permis: 'Permis B',
    linkedin: 'linkedin.com/in/aminata-traore',
    github: '',
    portfolio: 'aminata-traore.com',
  },
  profil: {
    accroche: "Cheffe de projet digital avec 8 ans d'expérience dans la conduite de produits web et mobiles pour les secteurs bancaire et télécom. J'accompagne des équipes pluridisciplinaires de la découverte utilisateur à la mise en production, avec une attention constante portée à la valeur livrée. Dernier projet en date : refonte d'une application de paiement mobile utilisée par 400 000 clients.",
  },
  experiences: [
    {
      poste: 'Cheffe de projet digital senior',
      entreprise: 'Orange Côte d’Ivoire',
      ville: 'Abidjan',
      contrat: 'CDI',
      debut: '2021-04',
      fin: '',
      enPoste: true,
      description: "Pilotage de la refonte de l'application Orange Money (400 000 utilisateurs actifs)\nEncadrement d'une équipe de 9 personnes : 5 développeurs, 2 designers, 1 QA\nRéduction de 35 % du taux d'abandon au tunnel de paiement en 6 mois\nMise en place du rituel de découverte produit avec les équipes métier",
      technos: ['Jira', 'Figma', 'Scrum', 'Mixpanel'],
    },
    {
      poste: 'Product Owner',
      entreprise: 'Société Générale CI',
      ville: 'Abidjan',
      contrat: 'CDI',
      debut: '2018-09',
      fin: '2021-03',
      enPoste: false,
      description: "Définition et priorisation du backlog de la banque en ligne\nLancement du parcours d'ouverture de compte 100 % à distance\nAnimation des comités produit mensuels auprès du comité de direction",
      technos: ['Confluence', 'SQL', 'Design thinking'],
    },
    {
      poste: 'Chargée de projet web',
      entreprise: 'Agence Kaolin',
      ville: 'Dakar',
      contrat: 'CDD',
      debut: '2017-01',
      fin: '2018-08',
      enPoste: false,
      description: "Gestion d'un portefeuille de 12 clients grands comptes\nCoordination des livraisons entre les studios de Dakar et de Paris",
      technos: [],
    },
  ],
  formations: [
    {
      diplome: 'Master 2 — Management des systèmes d’information',
      etablissement: 'ESATIC',
      ville: 'Abidjan',
      debut: '2015-09',
      fin: '2017-06',
      enCours: false,
      mention: 'Mention Bien',
      description: "Mémoire : adoption du paiement mobile en Afrique de l'Ouest",
    },
    {
      diplome: 'Licence en Informatique de gestion',
      etablissement: 'Université Félix Houphouët-Boigny',
      ville: 'Abidjan',
      debut: '2012-09',
      fin: '2015-06',
      enCours: false,
      mention: '',
      description: '',
    },
  ],
  competences: [
    { nom: 'Gestion de produit', categorie: 'Métier', niveau: 5 },
    { nom: 'Méthodes agiles (Scrum, Kanban)', categorie: 'Métier', niveau: 5 },
    { nom: 'Cadrage & rédaction fonctionnelle', categorie: 'Métier', niveau: 4 },
    { nom: 'Jira / Confluence', categorie: 'Logiciels', niveau: 5 },
    { nom: 'Figma', categorie: 'Logiciels', niveau: 4 },
    { nom: 'SQL & analyse de données', categorie: 'Logiciels', niveau: 3 },
    { nom: 'Animation d’ateliers', categorie: 'Savoir-être', niveau: 5 },
    { nom: 'Négociation', categorie: 'Savoir-être', niveau: 4 },
  ],
  langues: [
    { langue: 'Français', niveau: 'Langue maternelle', precision: '' },
    { langue: 'Anglais', niveau: 'C1 — Autonome', precision: 'TOEIC 910' },
    { langue: 'Espagnol', niveau: 'B1 — Intermédiaire', precision: '' },
  ],
  certifications: [
    { intitule: 'Professional Scrum Product Owner I', organisme: 'Scrum.org', annee: '2022', url: '' },
    { intitule: 'Google Project Management', organisme: 'Coursera', annee: '2021', url: '' },
  ],
  projets: [
    {
      nom: 'Baobab Learning',
      role: 'Co-fondatrice',
      annee: '2023',
      url: 'baobab-learning.ci',
      description: "Plateforme de soutien scolaire en ligne pour les lycéens ivoiriens\n1 200 élèves inscrits la première année",
      technos: ['Next.js', 'Supabase'],
    },
  ],
  interets: {
    liste: ['Course à pied (semi-marathon)', 'Photographie argentique', 'Cuisine ouest-africaine'],
    benevolat: "Marraine du programme « Filles & Tech » — accompagnement de 20 lycéennes par an",
  },
  references: [],
};

/** Copie profonde du jeu d'exemple (les modèles ne doivent jamais le modifier). */
export const sampleData = () => structuredClone(SAMPLE_DATA);
