# TPRA — Third Party Risk Assessment

Plateforme d'évaluation automatisée du risque fournisseur (cybersécurité), propulsée par **Mistral AI**.
Elle ingère un questionnaire de sécurité (Excel, PDF ou e-mail), orchestre une analyse multi-étapes via un agent IA, et produit un rapport de décision exportable en Excel.

---

## Sommaire

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Prérequis](#prérequis)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Démarrage rapide](#démarrage-rapide)
7. [Pipeline d'analyse](#pipeline-danalyse)
8. [Scoring & décision finale](#scoring--décision-finale)
9. [Comptes & accès](#comptes--accès)
10. [Structure du projet](#structure-du-projet)
11. [Commandes Makefile](#commandes-makefile)

---

## Vue d'ensemble

TPRA automatise l'analyse des réponses fournisseurs à un questionnaire de sécurité en 6 étapes :

```
Questionnaire (xlsx / pdf / email)
        │
        ▼
  [1] Extraction du texte
        │
        ▼
  [2] Analyse des risques          ← Mistral Large
        │
        ▼
  [3] Scoring par question (1–4)   ← Mistral Large (par batch de 25)
        │
        ▼
  [4] Génération du rapport texte
        │
        ▼
  [5] Validation humaine ⏸️         ← Interface web
        │
        ▼
  [6] Export Excel
```

---

## Architecture

```
Mistral-Ecole_42/
├── Back/                          # Backend Python
│   ├── main.py                    # API FastAPI (port 8000)
│   ├── requirements_api.txt
│   ├── tickets.db                 # Base SQLite (tickets & résultats)
│   ├── uploads/                   # Fichiers uploadés (ignorés par git)
│   └── evaluation_risques/        # Moteur d'analyse IA
│       ├── src/
│       │   ├── entrypoints/       # Points d'entrée du worker
│       │   └── workflows/
│       │       ├── router.py      # Orchestrateur du workflow TPRA
│       │       ├── scorer.py      # Scoring IA (1–4) + showstoppers
│       │       ├── analyzer.py    # Identification des risques
│       │       ├── extractor.py   # Extraction texte (xlsx/pdf/email)
│       │       ├── reporter.py    # Génération rapport + export Excel
│       │       └── utils.py       # Helpers (parse, score_to_level…)
│       └── pyproject.toml
│
└── front/                         # Frontend React (port 5173 / 3000)
    ├── src/
    ├── public/
    └── package.json
```

---

## Prérequis

| Outil | Version minimale | Rôle |
|---|---|---|
| Python | 3.11+ | Backend & workflows |
| Node.js | 18+ | Frontend |
| npm | 9+ | Gestion des dépendances JS |
| uv *(optionnel)* | toute | Gestionnaire Python rapide |

Une clé API **Mistral AI** est obligatoire (`mistral-large-latest`).

---

## Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd Mistral-Ecole_42
```

### 2. Tout installer en une commande

```bash
make install
```

Ce qui exécute, dans l'ordre :

```bash
# Backend
cd Back && uv sync          # ou pip install -r requirements_api.txt

# Workflows / agent IA
cd Back/evaluation_risques && uv sync

# Frontend
cd front && npm install
```

---

## Configuration

Créer les fichiers `.env` à partir des exemples fournis.

### `Back/.env`

```env
MISTRAL_API_KEY=sk-...           # Clé API Mistral AI (obligatoire)
DATABASE_URL=sqlite:///tickets.db
SECRET_KEY=changez-moi
```

### `Back/evaluation_risques/.env`

```env
MISTRAL_API_KEY=sk-...           # Même clé
```

> Les fichiers `.env` sont exclus du dépôt par le `.gitignore` racine.
> Ne jamais committer de clé API.

---

## Démarrage rapide

### Tout lancer en une commande

```bash
make
```

Lance en parallèle les trois services :

| Service | URL | Commande équivalente |
|---|---|---|
| Backend FastAPI | http://localhost:8000 | `make back` |
| Worker Mistral (agent) | — | `make workflows` |
| Frontend React | http://localhost:5173 | `make front` |

Les logs de chaque service sont disponibles dans `.logs/`.

### Arrêter tous les services

```bash
make stop
```

---

## Pipeline d'analyse

### Étape 1 — Extraction

`extractor.py` lit le questionnaire selon son format :

- **Excel** (`.xlsx`) : lecture des colonnes question / réponse
- **PDF** : extraction du texte brut
- **Email** : parsing du corps du message

### Étape 2 — Analyse des risques

`analyzer.py` interroge `mistral-large-latest` pour identifier les risques de sécurité, les showstoppers potentiels, les exceptions et dérogations. Chaque risque est associé aux identifiants de questions concernées (`related_question_ids`).

### Étape 3 — Scoring

`scorer.py` évalue chaque paire question/réponse avec l'échelle suivante :

| Score | Niveau | Critère |
|---|---|---|
| **1** | Non-conforme | Réponse absente, hors-sujet ou réponse d'une ligne sans explication |
| **2** | Partiellement conforme | Réponse vague, générique, sans outil ni processus nommé |
| **3** | Conforme | Réponse détaillée citant des outils, standards ou processus concrets |
| **4** | Mature | Réponse complète + références à des preuves vérifiables (audits, certifications, SLA) |

Les questions sont traitées par **batch de 25** avec un délai de 3 secondes entre chaque batch pour respecter les limites de l'API.

Un **showstopper** est déclenché uniquement si le score est **1** ET que le sujet concerne un domaine critique :
- Chiffrement des données (au repos ou en transit)
- Conformité RGPD
- Processus de notification de violation de données personnelles
- Contrôle d'accès aux données
- Résidence / souveraineté des données

### Étape 4 — Rapport texte

`reporter.py` génère un rapport structuré listant les risques, scores, showstoppers, pièces jointes attendues et questions de suivi.

### Étape 5 — Validation humaine ⏸️

Le workflow se met en pause et affiche le rapport dans l'interface web pour validation par un analyste avant export.

### Étape 6 — Export Excel

Un fichier Excel est généré avec l'ensemble des résultats (scores par question, niveaux de risque, décision finale, résumé exécutif).

---

## Scoring & décision finale

Le niveau de risque global est recalculé à partir des scores des questions associées à chaque risque.

| Niveau global | Showstoppers | Décision |
|---|---|---|
| Critical | — | **Rejected** |
| — | ≥ 1 | **Rejected** |
| High | 0 | **Approved with conditions** |
| Medium / Low | 0 | **Approved** |

---

## Comptes & accès

> ⚠️ Ces identifiants sont réservés à l'environnement de développement local.
> Remplacez-les avant tout déploiement.

| Rôle | Identifiant | Mot de passe | Accès |
|---|---|---|---|
| Admin | `admin` | `admin2024` | Tout + mode suppression |
| Analyste Cyber | `cyber1` | `cyber2024` | Tickets + validation |
| Analyste Cyber | `cyber2` | `tpra2024` | Tickets + validation |

---

## Structure du projet

```
Mistral-Ecole_42/
├── .gitignore                     # Exclut .env, __pycache__, node_modules…
├── Makefile                       # Commandes de lancement
├── README.md                      # Ce fichier
│
├── Back/
│   ├── .env                       # ← à créer (voir Configuration)
│   ├── main.py
│   ├── requirements_api.txt
│   ├── tickets.db
│   ├── uploads/                   # Ignoré par git
│   └── evaluation_risques/
│       ├── .env                   # ← à créer (voir Configuration)
│       ├── pyproject.toml
│       └── src/
│           ├── entrypoints/
│           └── workflows/
│               ├── __init__.py
│               ├── router.py
│               ├── scorer.py
│               ├── analyzer.py
│               ├── extractor.py
│               ├── reporter.py
│               └── utils.py
│
└── front/
    ├── package.json
    ├── public/
    └── src/
```

---

## Commandes Makefile

| Commande | Description |
|---|---|
| `make` / `make dev` | Lance les 3 services en parallèle |
| `make back` | Backend FastAPI seul |
| `make workflows` | Worker Mistral seul |
| `make front` | Frontend seul |
| `make install` | Installe toutes les dépendances |
| `make stop` | Arrête tous les services |
| `make logs` | Affiche les logs des 3 services en live |
| `make clean` | Supprime les caches et les logs |