# 🚀 BudgetQuest & Calendrier Budgétaire Intelligent

Projet réalisé en binôme dans le cadre de la formation **Concepteur Développeur d'Applications (CDA)**.

## 👥 Équipe & Répartition du Binôme

- **MESTIRI Intissar** : Architecture Node.js (CLI), intégration des appels HTTP asynchrones (`axios`), gestion de la persistance JSON (`budget.json`) et configuration Git.
- **BEN TMELIST Moataza** : Développement de l'interface Web (`index.html`, `app.js`), gestion des cagnottes collaboratives, calcul des KPI, thèmes visuels et gamification.

## 🎯 Présentation du Projet

**BudgetQuest / Calendrier Budgétaire** est une application hybride de gestion financière personnelle et à deux, connectée en temps réel aux **API Open Data de l'État français**.

Elle répond à un besoin concret : anticiper l'impact des **jours fériés** (décalages de virements bancaires) et des **vacances scolaires** (augmentation des dépenses loisirs et famille) sur le budget mensuel.

Le projet propose deux modes d'utilisation complémentaires :
1. **Un outil en ligne de commande (CLI Node.js)** (`index.js` + `api.js` + `budget.json`) : rapide et interactif directement dans le terminal intégré d'Antigravity IDE.
2. **Une interface Web moderne (SPA)** (`index.html` + `app.js`) : tableau de bord visuel avec gestion de projets (`Voyage`, `Imprévus`, `Cagnotte Binôme`), badges de réussite et explorateur de dates officielles.

## 📦 Packages NPM Utilisés

Conformément aux consignes de l'atelier en binôme, le projet s'appuie sur **4 packages NPM** :

- `@inquirer/prompts` : Création de menus interactifs, champs de saisie et confirmations dans le terminal.
- `chalk` : Colorisation des statuts financiers (revenus en vert, dépenses en rouge) et des badges fériés/vacances.
- `dayjs` : Validation stricte des dates au format français (`JJ/MM/AAAA`), tri chronologique et extraction des années.
- `axios` : Exécution des requêtes HTTP `GET` vers les API gouvernementales avec gestion des délais (`timeout`) et des erreurs réseau.

## 🌐 API Externes Intégrées

1. **API Jours Fériés en France (`calendrier.api.gouv.fr`)**
   - **Endpoint :** `[https://calendrier.api.gouv.fr/jours-feries/metropole/](https://calendrier.api.gouv.fr/jours-feries/metropole/){annee}.json`
   - **Rôle :** Détecte automatiquement si une opération tombe un jour férié et alerte l'utilisateur en cas de virement bancaire susceptible d'être décalé.

2. **API Calendrier Scolaire (`data.education.gouv.fr`)**
   - **Endpoint :** `[https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records](https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records)`
   - **Rôle :** Vérifie si la date saisie appartient à une période de vacances scolaires (Zone A, B ou C) et isole le budget consacré aux congés.

## 📂 Structure du Projet

```text
calendrier-budget/
├── index.js          # Point d'entrée de l'application CLI Node.js
├── api.js            # Module d'appels HTTP aux API gouvernementales (axios)
├── budget.json       # Base de données locale des opérations (persistante)
├── index.html        # Interface Web complète (Tableau de bord, Projets, Calendrier API)
├── app.js            # Logique interactive de l'application Web et gestion du LocalStorage
├── package.json      # Configuration du projet et dépendances NPM
└── .gitignore        # Exclusion du dossier node_modules/