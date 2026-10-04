# DESIGN CV

Application web de création de CV : l'utilisateur se connecte, choisit un modèle
de design parmi quarante-cinq, remplit un formulaire découpé en rubriques successives,
règle le téléchargement par carte ou paiement mobile, et exporte le résultat en PDF A4.

**Aucun paquet à installer.** Tout repose sur Node (serveur HTTP, SQLite et
crypto natifs) et sur des modules ES côté navigateur — pas de `npm install`, pas
d'étape de build.

Une seule dépendance, système celle-là : **Chrome ou Chromium doit être présent
sur la machine qui fait tourner le serveur**, car c'est lui qui compose le PDF.
Voir [Export PDF](#export-pdf).

---

## Démarrer

```bash
npm start          # http://127.0.0.1:4173
npm run dev        # idem, avec rechargement à chaque modification
```

Node 22.5 ou plus est requis (pour le module `node:sqlite`), et Chrome ou
Chromium doit être installé pour l'export PDF.
La base de données est créée automatiquement dans `data/cv.sqlite`.

Pour changer de port : `PORT=8080 npm start`.

Au premier lancement, un **compte d'administration** et deux comptes de
démonstration sont créés, et leurs identifiants s'affichent dans la console.
Voir [Administration du catalogue](#administration-du-catalogue) et
[Banc d'essai](#banc-dessai-temporaire).

---

## Le parcours

1. **Connexion / inscription** — e-mail et mot de passe, session de 30 jours.
2. **Choix du modèle** (`/modeles`) — les aperçus sont de vrais rendus, pas des
   images : ce que vous voyez est ce que vous obtiendrez. On choisit aussi la
   couleur dominante — parmi huit teintes, ou librement au sélecteur du système
   et à la pipette — et si l'on part d'un CV vierge ou de l'exemple.
   La page est tenue par deux barres, pour qu'aucun réglage n'oblige à
   parcourir toute la hauteur des aperçus :
   - en haut, la **bande de réglages** (nom du CV, couleur, contenu de départ)
     se fige sous l'en-tête pendant le défilement — changer de couleur redessine
     les aperçus sous les yeux, sans remonter ;
   - en bas, une **barre d'action** rappelle le modèle retenu et porte le bouton
     « Continuer ».

   Sous 760 px de large, les trois réglages s'empilent et la bande reprend le fil
   de la page : figée, elle mangerait un tiers de la hauteur utile.
3. **Éditeur** (`/cv/:id`) — le formulaire est découpé en **dix rubriques**,
   parcourues une par une. Chaque rubrique est une étape autonome :

   | # | Rubrique | Type |
   |---|----------|------|
   | 1 | Informations personnelles | fiche unique |
   | 2 | Profil & accroche | fiche unique |
   | 3 | Expériences professionnelles | liste |
   | 4 | Formation & diplômes | liste |
   | 5 | Compétences | liste |
   | 6 | Langues | liste |
   | 7 | Certifications | liste |
   | 8 | Projets & réalisations | liste |
   | 9 | Centres d'intérêt | fiche unique |
   | 10 | Références | liste |

   Les rubriques de type *liste* se remplissent par fiches dépliables que l'on
   peut réordonner (glisser-déposer ou flèches) et supprimer. La progression et
   l'avancement de chaque rubrique s'affichent en permanence dans le rail de
   gauche, et l'aperçu A4 se met à jour pendant la frappe.

4. **Paiement** — le téléchargement est payant, une fois par CV. Carte bancaire
   ou paiement mobile, puis un code de confirmation. Tant que la commande n'est pas
   réglée, l'aperçu reste consultable mais filigrané. Voir
   [Paiement du téléchargement](#paiement-du-téléchargement).

5. **Export** — le bouton PDF **télécharge directement le fichier**, sans passer
   par la boîte d'impression du navigateur : le serveur compose le document et
   le renvoie en pièce jointe, nommé d'après le titre du CV. Comptez trois à
   quatre secondes. Le document sort en A4 exact
   (595 × 842 pt), sans marge parasite ni filigrane. Raccourci : `⌘P`.

Une rubrique laissée vide n'apparaît pas sur le CV.

---

## Les modèles

| Modèle | Mise en page |
|--------|--------------|
| **Moderne** | Bandeau latéral coloré (contact, compétences, langues) + parcours à droite |
| **Classique** | Une colonne, en-tête centré, serif, filets fins — profils traditionnels |
| **Élégant** | Bandeau d'en-tête pleine largeur puis deux colonnes équilibrées |
| **Créatif** | Frise chronologique à pastilles et colonne de droite colorée |
| **Minimal** | Titres de rubrique en marge, beaucoup de blanc, aucune fioriture |
| **Exécutif** | En-tête sombre, typographie serif — profils seniors et encadrement |
| **Technique** | Dense, deux colonnes, monospace pour l'environnement technique |
| **Suisse** | Grille stricte, rubriques numérotées (01, 02…), filets épais, capitales |
| **Académique** | Dates en gouttière gauche, serif sobre — recherche et enseignement |
| **Cartes** | Chaque rubrique dans un bloc arrondi sur fond teinté, deux colonnes |
| **Corporate** | Bandeau nominatif plein, bande de coordonnées, puis une colonne large |
| **Émeraude** | Colonne verte à blocs arrondis, titres à pastilles, formation et références à gauche |
| **Encadré** | Panneaux bordés, marqueurs carrés, nom en deux tons, coordonnées en tableau |
| **Agrume** | Colonne noire à droite, panneau orange arrondi, contraste marqué |
| **Lagon** | Colonne turquoise détachée du bord, badges carrés, jauges sur deux colonnes |
| **Affiche** | Titres en bandeaux pleins, colonne sombre à droite, grandes jauges |
| **Jalons** | Colonne sombre, repères jaunes, frise verticale sur le parcours |
| **Améthyste** | Bandeau violet en biais, photo ronde débordante, parcours en frise à pastilles |
| **Écarlate** | Colonne sombre à droite, médaillon coloré pour l'accroche, jauges fines |
| **Rubis** | Blocs rouges et anthracite, nom sur bandeau sombre, rubriques sur deux colonnes |
| **Safran** | Colonne jaune arrondie à droite, panneau d'accroche coloré, titres à pastilles |
| **Ambre** | Intitulés sur bandeaux sombres, dates en onglets latéraux, photo cerclée |
| **Clémentine** | Filet orange en bordure, en-tête compact, compétences sur trois colonnes |
| **Mandarine** | Bandeau sombre en salutation, rubriques posées dans des cartes encadrées |
| **Azur** | Bandes claires pleine largeur, salutation en titre, colonnes appariées |
| **Cobalt** | Colonne grise à gauche, nom sur cartouche bleu, rubriques à pastilles rondes |
| **Vague** | En-tête bleu clair fermé par une courbe, titres serif, deux colonnes |
| **Marée** | Colonne bleu nuit fermée par des arrondis, jauges chiffrées, titres serif |
| **Jade** | En-tête en pilule allongée, colonne verte à onglets, niveaux en pastilles |
| **Sapin** | Colonne vert profond à droite avec la photo, intitulés en pilules bordées |
| **Nuit** | Colonne marine, intitulés sur fanions orange, jauges chiffrées |
| **Ancre** | Bandeau marine en tête, photo carrée, rubriques à pastilles et frise fine |
| **Nocturne** | En-tête noir, colonne bleue en médaillon, dates en étiquettes fléchées |
| **Éclipse** | Grande photo sur fond noir, colonne sombre pleine hauteur, jauges à curseur |
| **Dégradé** | Colonne sombre en dégradé, intitulés en bandeaux fondus, photo en arche |
| **Grenat** | Colonne grise à gauche, intitulés sur bandeaux rouges, curseurs de niveau |
| **Braise** | En-tête anthracite, bandeau de contact orange, titres en gouttières |
| **Damier** | Repères carrés, photo cerclée, colonne étroite pour niveaux et loisirs |
| **Cadre** | En-tête bleu plein, rubriques enfermées dans des cadres à titre coloré |
| **Galet** | Cartes grises arrondies, en-tête clair, coordonnées en bandeau bleu |
| **Lagune** | Colonne turquoise à droite, photo cerclée sur la couture, jauges cannelées |
| **Volute** | Voile violet arrondi à gauche, accents orange, parcours en gouttière épaisse |
| **Sillage** | Colonne bleu nuit, photo sur l'angle, frise verticale continue à droite |
| **Trait** | Noir et blanc, fil vertical ponctué de pastilles, aucune couleur superflue |
| **Orchidée** | Carte bordée en arche, barres violettes, intitulés en capitales serrées |

---

## Les réglages

Chaque modèle se combine avec une couleur dominante, 3 réglages de police
(sans, serif, mixte) et 3 densités (aéré, normal, compact). Changer de modèle ne
touche pas aux données saisies.

### Couleur dominante

La rangée de pastilles propose la couleur d'origine du modèle, huit teintes
prêtes à l'emploi, puis **le choix libre** :

- la pastille marquée `+` ouvre le **sélecteur de couleurs du système** — celui
  qui offre la roue chromatique, la saisie hexadécimale et la loupe ;
- le bouton pipette, à côté, **prélève une couleur n'importe où à l'écran**. Il
  n'apparaît que là où le navigateur sait le faire (`EyeDropper`, Chrome et Edge
  à partir de la version 95).

La couleur retenue se propage à l'aperçu pendant qu'on la choisit, puis au CV
enregistré et au PDF. N'importe quelle valeur convient : les modèles la déclinent
eux-mêmes en versions foncée, claire et lavée, via `color-mix()`.

Une précision qui a son importance : le sélecteur du système est une **fenêtre
séparée**, et l'ouvrir fait perdre le focus à la page. Sans précaution, la
protection du contenu y verrait une tentative de capture et voilerait l'écran en
plein choix de couleur. `holdFocusVeil()`, dans `lib/guard.js`, ouvre donc une
parenthèse le temps du réglage — elle ne suspend que le voile de perte de focus,
jamais celui d'une capture détectée.

Tant que le sélecteur natif est ouvert, la page ne reçoit plus aucun événement
clavier : c'est le propre des fenêtres du système, et aucune application web n'y
peut rien. Le filigrane de l'aperçu, lui, reste en place.

### Pagination — l'aperçu et le PDF sont le même document

La mise en pages n'est **pas** laissée au moteur d'impression : elle est
calculée une fois, dans le document rendu, par `window.__cvLayout()`
(`public/js/cv/render.js`). L'aperçu affiche ce résultat, l'impression le
découpe aux mêmes endroits — les deux coïncident par construction.

`__cvLayout()` parcourt les blocs de la colonne principale et, dès qu'un bloc
déborde de sa page, insère **deux cales** avant lui :

1. une cale ordinaire qui comble la fin de la page en cours ;
2. une cale `cv-gap--break`, haute de 12 mm, qui porte `break-before: page`
   et fournit la marge haute de la page suivante.

La seconde est indispensable : à l'impression, le moteur **écarte les blocs
vides qui tombent sur une coupure**. Sans coupure forcée, la cale était
absorbée et le bloc remontait d'une page — l'aperçu annonçait 3 pages, le PDF
en produisait 2.

#### Déplacer la rubrique, ou la couper ?

Quand une rubrique ne tient plus sur sa page, il n'existe que deux issues, et
chacune a son défaut : la **déplacer entière** évite la coupure mais laisse un
blanc en bas de page ; la **couper** remplit la page mais fend la rubrique.

Le moteur tranche sur la taille du blanc, parce que c'est lui qui se voit :

| Situation | Décision |
|---|---|
| Blanc < ¼ de page (< 258 px) | rubrique déplacée entière |
| Blanc ≥ ¼ de page | rubrique coupée entre deux entrées |
| Rubrique encadrée (fond ou cadre complet) | même règle, mais le seuil monte à ⅓ de page — fendre un cadre coûte plus cher |
| Rubrique plus haute qu'une page | coupée, il n'y a pas d'autre choix |

La coupure reste toujours **propre** : le titre part avec au moins sa première
entrée — jamais de titre seul en bas de page — et une entrée entière au moins
reste pour la page suivante. Une entrée n'est jamais fendue en son milieu.

Un simple filet de séparation (le `border-top` qui souligne un titre) ne fait
pas une rubrique « encadrée » : la détection exige les **quatre côtés** ou un
fond propre. Confondre les deux rendrait la moitié des modèles quasi
incoupables et ferait revenir les grands blancs.

Les deux seuils sont les constantes `HOLE_FLAT` et `HOLE_CARD` en tête de
`__cvLayout()`.

**Trois pièges à connaître si vous modifiez un modèle :**

- `@page` ne doit porter **aucune marge** : les marges viennent des cales.
- Ne déclarez pas `break-inside: avoid` sur `.sec` dans un modèle : cette règle
  concurrence le moteur et fait diverger le PDF (c'était le cas de Cartes).
- La colonne paginée doit être en **flux normal**, jamais en grille : une grille
  ajoute son écart autour des cales et fausse les hauteurs (c'était le cas de
  `.col-main` dans Cartes).

La géométrie de page est exprimée en millimètres (`210mm × 297mm`) pour l'écran
comme pour l'impression : une largeur en pixels d'un côté et en millimètres de
l'autre décalait les retours à la ligne.

### Barres latérales et CV de plusieurs pages

Les modèles à colonne latérale la font **flotter sur une hauteur d'exactement
une page**. Dès la deuxième page, la colonne disparaît et le contenu reprend
toute la largeur : plus de bande vide sur un tiers de page.

Concrètement, `.side` est en `float` avec `min-height: var(--band-h)` (1122 px,
soit la hauteur utile d'une A4) et porte lui-même son fond — au lieu d'un
dégradé sur `body`, qui se répétait sur toutes les pages. Quand un bandeau
occupe le haut de la page, on retranche sa hauteur :
`min-height: calc(var(--band-h) - var(--head-h))`, comme dans Jalons et
Améthyste.

**N'utilisez pas une grille à deux colonnes pour cette structure.** Une cellule
de grille garde sa position sur toutes les pages : la colonne principale reste
décalée jusqu'au bas du document, même une fois la colonne latérale épuisée.

Trois conséquences à connaître si vous modifiez ces modèles :

- tout élément à fond, à filet **ou à repère en position absolue** placé dans la
  colonne principale doit être en `display: flow-root`. Sans cela sa boîte
  commence sous la colonne flottante : seules les lignes de texte se décalent,
  pas les pseudo-éléments, qui se dessinent alors par-dessus la colonne
  (c'est ce qui arrivait aux repères et à la frise de Jalons et Encadré) ;
- mais `flow-root` sur une **rubrique entière** la colle au flottant sur toute
  sa hauteur : une rubrique à cheval sur la coupure resterait étroite jusqu'au
  bas de la page 2. Décorez donc les **entrées**, pas la rubrique — elles sont
  déjà des grilles, donc des contextes de formatage, et chacune se replace pour
  son propre compte. C'est ainsi qu'Améthyste dessine sa frise : un segment
  pointillé par entrée, débordant vers la suivante pour former un trait continu ;
- si le contenu de la colonne dépasse une page, elle se prolonge — c'est voulu :
  la bande n'est là que parce qu'il y a quelque chose à y afficher.

**Tous les modèles acceptent une photo**, toujours facultative : chacun lui
réserve un emplacement propre (ronde en médaillon, carrée en bandeau, en coin
d'en-tête…). Laissée vide, elle disparaît sans laisser de trou dans la mise en
page. La galerie affiche un avatar générique pour montrer où elle se placera.

---

## Administration du catalogue

La galerie n'est plus figée dans le code : elle est composée depuis l'écran
`/administration`, réservé aux comptes dont le rôle vaut `admin`.

### Se connecter

Au premier démarrage, DESIGN CV crée un compte d'administration et affiche ses
identifiants :

```
┌─ Compte d’administration créé ────────────────
│  admin@designcv.local
│  Admin@DesignCV2026
└───────────────────────────────────────────────
```

Trois variables d'environnement pilotent ce compte :

| Variable | Rôle | Défaut |
|----------|------|--------|
| `ADMIN_EMAIL` | adresse du compte d'administration | `admin@designcv.local` |
| `ADMIN_PASSWORD` | son mot de passe, **à la création seulement** | `Admin@DesignCV2026` |
| `ADMIN_EMAILS` | comptes existants à promouvoir, séparés par des virgules | — |

```bash
ADMIN_PASSWORD='un-mot-de-passe-solide' npm start   # au tout premier lancement
ADMIN_EMAILS='vous@exemple.com' npm start           # promouvoir un compte existant
```

Le mot de passe d'un compte déjà créé n'est jamais réécrit au démarrage : un
redémarrage ne peut pas redonner sa validité à un ancien mot de passe.

### Mise en page, modèle

La distinction porte tout le reste :

- une **mise en page** est du code — une feuille de style et une fonction
  d'assemblage, dans `public/js/cv/templates.js`. Il y en a quarante-cinq ;
- un **modèle** est une ligne de la table `templates` qui désigne une mise en
  page et l'habille : nom, description, étiquettes, couleur, police, rang.

L'administrateur compose donc des modèles sans écrire une ligne de code. Deux
modèles peuvent partager une mise en page en s'en distinguant par la couleur et
le nom — « Moderne » et « Moderne Émeraude », par exemple.

### Les trois gestes

| Geste | Effet |
|-------|-------|
| **Ajouter** | une mise en page comme base, puis nom, description, étiquettes, couleur et police. L'aperçu à droite du formulaire est le rendu réel, pas une image. |
| **Masquer / Afficher** | retire le modèle de la galerie ou l'y remet. **Les CV déjà créés ne bougent pas** : leur mise en page existe toujours et continue de les dessiner. |
| **Réordonner** | deux gestes au choix : **maintenir une carte et la glisser**, ou **saisir son rang** dans la pastille en haut à gauche puis Entrée. L'ordre de la galerie suit, et s'enregistre aussitôt. |

Le rang saisi est une *insertion*, pas un échange : taper « 1 » sur la douzième
carte l'amène en tête et décale les autres d'un cran. Un nombre hors bornes est
ramené entre 1 et le nombre de modèles, et une saisie qui n'est pas un nombre
laisse l'ordre intact. `Échap` annule une saisie comme un glissement en cours.

Pendant le glissement, rien ne bouge : la carte tirée pâlit, un liseré indique de
quel côté de la carte survolée elle se posera, et une étiquette suit le curseur
en annonçant le rang d'arrivée. La grille n'est redessinée qu'au relâchement.

### Deux détails d'implémentation

Le tri n'utilise **pas** le glisser-déposer natif du HTML, pour deux raisons :

1. `installGuard()` (protection du contenu) annule tous les `dragstart` hors des
   fiches de l'éditeur — voir `public/js/lib/guard.js`. Un tri en HTML5 aurait
   dépendu d'une liste blanche à maintenir dans un module sans rapport.
2. Le glisser-déposer natif ne fonctionne pas au tactile, et déplacer une carte
   dans le DOM en plein geste rechargerait l'`iframe` de son aperçu.

Le tri s'appuie donc sur les événements pointeur : souris, trackpad et tactile
avec le même code. **Au doigt, seule la poignée `⠿` déclenche le tri** — ailleurs
sur la carte, le geste vertical continue de faire défiler la page.

**Supprimer** n'existe que pour les modèles composés, et seulement s'ils n'ont
jamais servi. Un modèle intégré ne se supprime pas — sa mise en page fait partie
du code — et un modèle utilisé par des CV non plus, sans quoi ces CV changeraient
de design à l'insu de leur propriétaire. Dans les deux cas, la réponse est
« masquez-le ».

### Ce que voit l'utilisateur

Le catalogue publié est servi par `GET /api/templates` et chargé au démarrage de
l'application. Si l'appel échoue, les mises en page intégrées servent de
repli : une galerie non ordonnée vaut mieux qu'une page vide.

---

## Banc d'essai (temporaire)

La page de connexion affiche un cadre pointillé « Test » avec trois boutons qui
remplissent les champs en un clic. C'est une aide au test, **à retirer avant
toute mise en ligne**.

| Bouton | Compte | Mot de passe |
|--------|--------|--------------|
| Administrateur | `admin@designcv.local` | `Admin@DesignCV2026` |
| Utilisatrice — Aminata Traoré | `demo@designcv.local` | `Demo@DesignCV2026` |
| Utilisateur — Koffi Mensah | `demo2@designcv.local` | `Demo@DesignCV2026` |

Les deux comptes utilisateurs sont créés au démarrage ; ils existent pour vérifier
qu'un compte ne voit jamais les CV de l'autre. Les mots de passe se règlent par
`ADMIN_PASSWORD` et `DEMO_PASSWORD`.

### Éteindre

```bash
DEMO_LOGINS=0 npm start
```

Le cadre disparaît et `GET /api/demo-accounts` renvoie une liste vide.

**Attention :** cet interrupteur masque le banc d'essai, il ne supprime pas les
comptes. `demo@designcv.local` et `demo2@designcv.local` restent en base et restent
connectables avec un mot de passe publié dans ce fichier. Pour les faire
disparaître :

```bash
node --input-type=module -e "
const { DatabaseSync } = await import('node:sqlite');
new DatabaseSync('data/cv.sqlite')
  .prepare(\"DELETE FROM users WHERE email IN ('demo@designcv.local','demo2@designcv.local')\").run();
"
```

Pensez aussi à changer le mot de passe de l'administrateur, lui aussi publié ici.

### Retirer le code

Quatre endroits, tous marqués `TEMPORAIRE` :

| Fichier | Quoi |
|---------|------|
| `server/demo.js` | le module entier — à supprimer |
| `server/api.js` | l'import et la route `/api/demo-accounts` |
| `server/index.js` | l'import, `seedDemoUsers()` et le bloc affiché au démarrage |
| `public/js/views/auth.js` | la fonction `demoPanel` et son appel dans le formulaire |
| `public/js/lib/api.js` | la méthode `demoAccounts` |
| `public/css/app.css` | le bloc `.demo-fill*` |

---

## Export PDF

Le bouton « Télécharger le PDF » **descend le fichier directement**. Il n'y a
plus de boîte d'impression à traverser.

### Pourquoi le serveur

Aucune interface du navigateur ne produit un PDF sans dialogue : `window.print()`
montre toujours la fenêtre d'impression, et il n'existe pas d'API pour l'éviter.
Le fichier est donc composé côté serveur, en confiant le document du CV au Chrome
installé sur la machine — le même moteur que celui qui dessine l'aperçu.

Le PDF obtenu est **vectoriel**, son texte reste sélectionnable, il pèse environ
380 Ko et sort en A4 exact. C'est rigoureusement ce que donnait « Enregistrer au
format PDF », en un clic de moins.

### Ce qu'il faut sur la machine

Chrome, Chromium ou Edge. Le serveur les cherche aux emplacements habituels de
macOS, Linux et Windows ; à défaut, `CHROME_PATH` désigne l'exécutable.

```bash
# Debian / Ubuntu
apt-get install -y chromium
CHROME_PATH=/usr/bin/chromium npm start

# conteneur tournant en root : le bac à sable de Chrome refuse de démarrer
CHROME_NO_SANDBOX=1 npm start
```

| Variable | Rôle | Défaut |
|----------|------|--------|
| `CHROME_PATH` | chemin de l'exécutable | détection automatique |
| `CHROME_NO_SANDBOX` | `1` pour ajouter `--no-sandbox` | absent |
| `PDF_TIMEOUT_MS` | abandon si le rendu s'éternise | `25000` |
| `PDF_SETTLE_MS` | temps laissé aux polices et à la mise en pages | `4000` |

Sans navigateur, l'application fonctionne normalement mais l'export répond
`503` avec un message explicite — le reste n'est pas bloqué.

### Deux détails d'implémentation

**Le calage des pages attend les polices.** La pagination est calculée par
`__cvLayout()`, qui mesure le texte. Mesurer avant le chargement des polices
donnerait un nombre de pages différent de celui annoncé par l'aperçu ; l'option
`autoLayout` de `renderDocument()` attend donc `document.fonts.ready`.

**On attend le fichier, pas la fin du processus.** Avec un profil dédié
(`--user-data-dir`, indispensable pour ne pas toucher au profil de
l'utilisateur), Chrome écrit bien le PDF puis reste en vie indéfiniment sur
certaines plateformes. `server/pdf.js` guette donc le fichier et le déclare prêt
dès qu'il se termine par `%%EOF`, puis coupe le navigateur.

---

## Paiement du téléchargement

Le PDF est le produit : il ne sort qu'une fois la commande réglée. L'aperçu
reste gratuit, complet et modifiable — il est simplement filigrané.

**Une commande par CV, valable pour toujours.** Une fois le CV débloqué, il
reste téléchargeable indéfiniment, y compris après modification. Dupliquer un
CV crée un nouveau CV, donc une nouvelle commande.

Deux moyens de paiement : **carte bancaire** (Visa, Mastercard, American
Express) et **paiement mobile**, tous opérateurs confondus. Le parcours tient
en trois écrans — moyen de paiement, code de confirmation, reçu.

### Opérateurs de paiement mobile

L'utilisateur choisit son pays, puis son opérateur parmi ceux qui y opèrent.

| Pays | Chiffres | Opérateurs |
|---|---|---|
| Côte d'Ivoire (+225) | 10 | Orange Money, MTN MoMo, Moov Money, Wave |
| Sénégal (+221) | 9 | Orange Money, Free Money, Wave, E-Money |
| Mali (+223) | 8 | Orange Money, Moov Money, Wave |
| Burkina Faso (+226) | 8 | Orange Money, Moov Money, Wave |
| Niger (+227) | 8 | Airtel Money, Moov Money |
| Guinée (+224) | 9 | Orange Money, MTN MoMo |
| Cameroun (+237) | 9 | MTN MoMo, Orange Money |
| RD Congo (+243) | 9 | M-Pesa, Orange Money, Airtel Money |
| Madagascar (+261) | 9 | MVola, Orange Money, Airtel Money |

Ajouter un opérateur ou un pays se fait dans le seul tableau
`MOBILE_COUNTRIES` de `server/payments.js` ; le formulaire s'adapte tout seul,
il lit `/api/pricing`.

**L'opérateur est choisi, jamais déduit.** Le champ `prefixes` sert uniquement
à *présélectionner* l'opérateur pendant la frappe (en Côte d'Ivoire : `07`
Orange, `05` MTN, `01` Moov ; au Sénégal : `77`/`78` Orange, `76` Free, `70`
E-Money). La suggestion s'arrête dès que l'utilisateur clique lui-même, et un
préfixe inconnu ne bloque jamais rien : les plages de numéros évoluent, et un
tableau périmé refuserait des clients légitimes. Les pays dont la répartition
n'est pas connue avec certitude ont simplement un `prefixes` vide.

Seules la longueur du numéro et l'appartenance de l'opérateur au pays sont
réellement vérifiées.

| Réglage | Variable d'environnement | Défaut |
|---|---|---|
| Montant | `CV_PRICE` | `2000` |
| Devise | `CV_CURRENCY` | `XOF` (FCFA) |
| Mode | `PAYMENT_MODE` | `demo` |

### Mode démonstration et mise en production

En mode `demo` — celui par défaut — **aucun argent ne circule**. Le simulateur
intégré délivre lui-même le code de confirmation et l'affiche à l'écran, faute
de banque et de passerelle. Deux numéros de test permettent d'éprouver le
parcours d'échec : la carte `4000 0000 0000 0002` est refusée, et tout numéro
de téléphone terminant par `00` renvoie un solde insuffisant, quel que soit
l'opérateur.

```bash
PAYMENT_MODE=live npm start    # refuse d'encaisser tant qu'aucun prestataire n'est branché
```

Le mode `live` **refuse d'encaisser** plutôt que de faire semblant. Pour brancher
un vrai prestataire (CinetPay, PayDunya, Stripe, les API opérateurs…), il n'y a qu'un objet
à remplir — `live` dans `server/payments.js` — plus une route webhook qui passe
la commande à `paid`. Le reste de l'application n'en saura rien.

### Données de carte

**Aucun numéro de carte n'est écrit en base.** `validateCard()` contrôle la
somme de Luhn, la marque, la longueur, le cryptogramme et la date, puis ne
laisse ressortir que la marque et les quatre derniers chiffres — c'est ce qui
figure sur le reçu, et c'est tout ce que la table `orders` contient. Les
numéros de téléphone sont masqués de la même façon (`+225 07••••••56`).

Le code de confirmation est vérifié côté serveur, limité à **trois tentatives**,
et la commande expire au bout de **dix minutes**.

---

## Protection du contenu

Ce que cette protection fait — et ce qu'elle ne peut pas faire.

**Aucun navigateur n'expose d'interface permettant d'empêcher une capture
d'écran.** Ni une page web, ni une extension, ni le HTTPS n'arrêtent
Cmd+Maj+4, l'outil Capture de Windows, un enregistreur vidéo, ou simplement un
téléphone braqué sur l'écran. Une application web qui promet le contraire ment.

La protection repose donc sur cinq leviers, du plus solide au plus dissuasif.

**1. Le paiement (`server/`).** Le livrable — le PDF net, imprimable — n'est
produit qu'après accord du serveur. C'est la seule barrière réellement
infranchissable, parce qu'elle ne dépend pas du navigateur.

**2. Le masquage (`lib/guard.js`).** L'écran se voile dès que la fenêtre perd le
focus ou que l'onglet passe en arrière-plan. Toute capture lancée depuis une
autre application — outil de capture différée, enregistreur d'écran, fenêtre de
sélection de Windows — photographie le voile et non le CV.

**3. L'interception (`lib/guard.js`).** Les raccourcis de capture connus lèvent
un voile qui **reste en place jusqu'à ce qu'on le referme explicitement**, et le
presse-papiers est écrasé par un avertissement :

| Raccourci | Système |
|-----------|---------|
| `Impr. écran` (avec ou sans modificateur) | Windows, Linux |
| `Cmd+Maj+3/4/5/6` | macOS |
| `Win+Maj+S` | Windows (outil Capture) |
| `Ctrl+Maj+S` | Linux (Flameshot, Spectacle…) |

Le voile persistant est ce qui distingue cette version de la précédente : une
sélection de zone lancée par `Cmd+Maj+4` cadre le voile quel que soit le temps
qu'on met à tracer le rectangle. Le presse-papiers est écrasé une seconde fois
250 ms après un `Impr. écran`, une fois que le système l'a rempli.

Le partage d'écran demandé par la page elle-même — `getDisplayMedia`, et
`getUserMedia` avec une surface d'écran — est refusé. Cela ne concerne pas les
outils du système, qui ne passent pas par là : c'est une porte de moins, pas une
protection à soi seule.

**4. Le filigrane (`cv/render.js`).** Tant que la commande n'est pas réglée,
l'aperçu de l'éditeur porte la mention **`DESIGN CV`** répétée en diagonale sur toute
la hauteur du document, pages suivantes comprises. C'est ce qui empêche qu'une
capture d'écran tienne lieu du livrable payant : l'export PDF est verrouillé
côté serveur, mais rien n'empêchait jusqu'ici de photographier un aperçu propre.

La marque tombe dès le paiement, et le document d'impression n'en reçoit jamais
— le PDF que l'on a payé sort net. La galerie des modèles n'est pas marquée non
plus : elle montre un CV d'exemple, pas le travail de l'utilisateur.

Le motif est un SVG en URL de données — aucune requête réseau, donc rien à
bloquer pour s'en débarrasser — avec un halo clair derrière les lettres qui le
garde lisible sur le papier blanc comme sur une bande latérale sombre.

Il est **volontairement discret** : l'aperçu doit rester confortable à lire, le
filigrane est là pour dévaloriser une capture, pas pour rendre le CV illisible.
Le réglage tient dans trois nombres de `watermarkTile()`
(`public/js/cv/render.js`) :

| Valeur | Effet |
|--------|-------|
| `fill: rgba(23, 26, 43, .085)` | présence sur les fonds clairs |
| `stroke: rgba(255, 255, 255, .28)` | présence sur les fonds sombres |
| `width="380" height="215"` | espacement — une tuile plus grande espace la marque |

Le filigrane ne perturbe pas la mise en pages : la pagination des modèles est
identique avec et sans lui.

En complément, une surimpression portant la même mention couvre **toute
l'application** — tableau de bord et galerie compris — le temps d'une tentative
de capture, d'une perte de focus ou d'un `Ctrl/Cmd+S`. Elle est posée par
`lib/guard.js`, en une image, sans redessiner le document du CV.

**5. La gêne (`lib/guard.js`, `cv/render.js`).** Sélection, copie, coupe,
glisser-déposer et menu contextuel sont neutralisés — dans l'application comme à
l'intérieur de l'iframe d'aperçu, qui a son propre document et n'hérite donc pas
de la feuille de style. Ctrl/Cmd+C, X, A, S, U, P et les raccourcis d'outils de
développement sont interceptés. Imprimer la page depuis le navigateur ne donne
qu'un renvoi vers le bouton de téléchargement.

L'aperçu à l'écran est **toujours** verrouillé, payé ou non ; seul le document
d'impression en est exempté, pour que le texte du PDF reste sélectionnable. Le
PDF ne porte jamais de filigrane : il sort d'un document séparé, que la
surimpression n'atteint pas.

### Les limites, dites franchement

- Une capture plein écran instantanée (`Cmd+Maj+3`) peut devancer l'affichage du
  voile. Elle emporte alors l'aperçu — mais filigrané, puisque la marque de
  l'aperçu non réglé y est en permanence.
- `Win+Maj+S` est traitée par Windows avant la page ; c'est la perte de focus,
  et non le raccourci, qui déclenche alors voile et filigrane.
- Un second appareil photographiant l'écran ne laisse aucune trace.
- Qui ouvre les outils de développement retire ces protections en une ligne.

C'est pour cela que la vraie barrière reste le paiement. Le reste rend la capture
pénible, le plus souvent inexploitable, et identifiable quand elle aboutit — ce
n'est pas la même chose que de l'interdire, et il ne faut pas le vendre comme tel.

---

## Organisation du code

```
server/
  index.js     serveur HTTP, fichiers statiques, repli SPA
  api.js       routes REST (authentification, CRUD des CV, catalogue, paiement)
  auth.js      hachage scrypt, sessions par cookie HttpOnly
  catalog.js   catalogue des modèles : semis, validation, ordre
  pdf.js       composition du PDF par le Chrome du système
  admin.js     amorçage du compte d'administration
  demo.js      banc d'essai — TEMPORAIRE, à supprimer avant mise en ligne
  payments.js  tarif, validation carte / mobile money, prestataire
  errors.js    HttpError partagée
  db.js        schéma SQLite et migrations

public/
  css/app.css  interface (thème clair et sombre)
  js/
    main.js    routeur et session
    schema.js  ← définition des 10 rubriques et de leurs champs
    form.js    rendu des contrôles à partir du schéma
    lib/
      guard.js   protection du contenu (copie, captures, voile, filigrane)
    cv/
      templates.js  les 45 modèles (mise en page + CSS)
      blocks.js     blocs de contenu partagés par les modèles
      render.js     document A4 autonome, aperçu et impression
      sample.js     CV d'exemple
    views/     connexion, tableau de bord, galerie, éditeur, paiement,
               admin.js    ← administration du catalogue
               swatches.js ← couleurs : palette, choix libre, pipette
```

Deux fichiers portent l'essentiel de la logique métier :

- **`public/js/schema.js`** décrit les rubriques. Ajouter un champ ou une
  rubrique se fait ici uniquement : le formulaire, le calcul de progression et
  la navigation en découlent automatiquement.
- **`public/js/cv/templates.js`** décrit les modèles. Un modèle est un objet
  `{ id, name, desc, tags, accent, font, css, layout(data) }` ; `layout`
  assemble les blocs de `blocks.js`. Trois aides y sont disponibles :
  `duoName(d)` pour un nom en deux tons, `box(html, cls)` pour envelopper un
  fragment sans créer de bloc vide, et **`onDark('.selecteur')`** qui repasse en
  clair tous les textes d'une zone sombre — indispensable dès qu'une colonne a
  un fond coloré, sinon certains intitulés deviennent invisibles. Ajouter une
  dix-huitième **mise en page** revient à ajouter une entrée dans le tableau
  `TEMPLATES` : elle rejoint le catalogue toute seule au démarrage suivant. Pour
  un simple habillage — même dessin, autre couleur, autre nom — il n'y a rien à
  coder, cela se fait depuis `/administration`.

Types de champs disponibles dans le schéma : `text`, `email`, `tel`, `url`,
`textarea`, `lines` (une ligne = une puce), `month`, `select`, `checkbox`,
`level` (jauge à 5 crans), `tags`, `photo`.

`B.sec(titre, corps, classe, icone)` accepte une pastille d'icône en quatrième
argument (voir `cv/icons.js`) ; les modèles qui n'en demandent pas n'en émettent
aucun balisage.

---

## API

Toutes les routes `/api/cvs*` exigent un cookie de session valide et ne donnent
accès qu'aux CV de leur propriétaire.

| Méthode | Route | Rôle |
|---------|-------|------|
| `POST` | `/api/auth/register` | créer un compte |
| `POST` | `/api/auth/login` | se connecter |
| `POST` | `/api/auth/logout` | se déconnecter |
| `GET` | `/api/auth/me` | session courante (avec le rôle) |
| `GET` | `/api/templates` | le catalogue publié, dans l'ordre de la galerie |
| `GET` | `/api/demo-accounts` | comptes du banc d'essai — **temporaire**, vide si `DEMO_LOGINS=0` |
| `GET` | `/api/cvs` | lister ses CV |
| `POST` | `/api/cvs` | créer un CV |
| `GET` | `/api/cvs/:id` | lire un CV |
| `PATCH` | `/api/cvs/:id` | mettre à jour (sauvegarde automatique) |
| `POST` | `/api/cvs/:id/duplicate` | dupliquer |
| `DELETE` | `/api/cvs/:id` | supprimer |
| `GET` | `/api/pricing` | tarif, pays et opérateurs mobiles |
| `GET` | `/api/cvs/:id/access` | ce CV est-il débloqué ? |
| `GET` | `/api/cvs/:id/pdf` | télécharger le PDF (réglé uniquement) |
| `POST` | `/api/cvs/:id/checkout` | ouvrir une commande |
| `POST` | `/api/orders/:ref/confirm` | valider le code et encaisser |
| `GET` | `/api/orders` | historique des paiements |

Les routes ci-dessous exigent en plus un compte dont le rôle vaut `admin` ;
elles répondent `403` à tout autre utilisateur connecté.

| Méthode | Route | Rôle |
|---------|-------|------|
| `GET` | `/api/admin/templates` | catalogue complet (masqués compris) et mises en page disponibles |
| `POST` | `/api/admin/templates` | composer un modèle |
| `PATCH` | `/api/admin/templates/:id` | renommer, recolorer, masquer, afficher |
| `DELETE` | `/api/admin/templates/:id` | supprimer un modèle composé et inutilisé |
| `POST` | `/api/admin/templates/ordre` | enregistrer l'ordre de la galerie |

---

## Notes

- Les mots de passe sont hachés en scrypt avec sel aléatoire ; les cookies de
  session sont `HttpOnly` et `SameSite=Lax`.
- Le serveur écoute sur `127.0.0.1` : l'application n'est pas exposée au réseau.
  Une mise en ligne réelle demanderait HTTPS, un `Secure` sur le cookie et une
  limitation du nombre de tentatives de connexion.
- Les photos sont redimensionnées à 640 px dans le navigateur et stockées en
  base64 avec le CV (corps de requête plafonné à 12 Mo).
- Les polices viennent de Google Fonts ; hors connexion, les substituts système
  (Helvetica, Georgia, Menlo) prennent le relais.
