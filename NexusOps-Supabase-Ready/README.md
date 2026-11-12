# NexusOps — React + FastAPI + Supabase PostgreSQL

## Supabase déjà configuré
Projet `rccmxvhwyptjyyceczqs` (Paris). Cinq tables créées avec RLS et aucun accès anon/authenticated. Le backend se connecte avec l'URI PostgreSQL du compte serveur, **jamais depuis React**.

## 1. Configuration privée
Dans Supabase > Project > Connect, choisir **Session pooler** (port 5432), copier l'URI PostgreSQL. Sous Windows, si la connexion directe IPv6 ne fonctionne pas, le pooler de session est recommandé. Dans `backend`, copier `.env.example` vers `.env` et remplacer `DATABASE_URL` par la véritable URI. Le backend utilise explicitement psycopg 3 même si l'URI Supabase commence par `postgresql://`. Échapper les caractères spéciaux du mot de passe dans l'URI, ou utiliser un mot de passe compatible URL. Le fichier `backend/.env` est chargé quel que soit le dossier depuis lequel le backend est lancé. Ne jamais partager `.env`.

## 2. Démarrage backend (PowerShell)
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# Compléter backend/.env : DATABASE_URL, SUPABASE_URL et SUPABASE_ANON_KEY
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```
Dans Supabase > Project Settings > API, renseigner l’URL du projet et la clé `anon`/publishable dans `SUPABASE_URL` et `SUPABASE_ANON_KEY`. Créer les comptes avec leurs mots de passe dans Supabase > Authentication > Users ; leurs adresses e-mail doivent également figurer dans la table `directory_users`. Aucun mot de passe n’est stocké dans cette table. Ne jamais commiter ni partager `backend/.env`.

Tester http://localhost:8000/api/health puis ouvrir http://localhost:5173 et se connecter avec l’adresse et le mot de passe d’un utilisateur Supabase Auth présent dans `directory_users`. La route `/api/health` reste publique pour le contrôle de disponibilité ; toutes les routes de données exigent un jeton Supabase Bearer vérifié auprès de Supabase Auth et un utilisateur correspondant dans l’annuaire.

## 3. Démarrage frontend (autre terminal)
```powershell
cd nexusops-frontend
npm install
npm run build
npm run lint
npm run dev
```
Ouvrir http://localhost:5173. Le frontend interroge FastAPI sur localhost:8000.

## 4. GitHub
Dans le dépôt `Projet-Fil-Rouge`, copier **uniquement** `backend/`, `supabase/`, et le frontend dans le dossier `nexusops-frontend/` (ne pas remplacer le `.git`). Vérifier `git status` et l'absence de `.env` avant commit.

## API
`GET /api/health`, CRUD `/api/equipment`, `/api/incidents`, `/api/users`, `POST /api/equipment/{id}/check`, `GET /api/equipment/{id}/history`. Les données de monitoring ICMP sont enregistrées dans `monitoring_checks`. `metrics` est provisionnée mais aucune collecte CPU/RAM n'est encore active.

## Sécurité et limites
Les routes de données exigent un jeton d’accès Supabase Auth vérifié auprès du service Supabase et un e-mail correspondant à une ligne de `directory_users`. Le jeton frontend reste en mémoire et une reconnexion est nécessaire après rechargement. Seule la clé anon/publishable est utilisée par le backend pour les appels Auth ; ne jamais placer la clé `service_role` dans le frontend ou dans un fichier commité. Ne pas exposer l’API sans HTTPS. RLS est activé sans politique publique. Pour la production, prévoir une limitation des tentatives de connexion, HTTPS et un worker de supervision distinct. Le ping ne peut atteindre que les IP privées/loopback accessibles depuis la machine exécutant FastAPI.
