# NexusOps — React + FastAPI + Supabase PostgreSQL

## Supabase déjà configuré
Projet `rccmxvhwyptjyyceczqs` (Paris). Cinq tables créées avec RLS et aucun accès anon/authenticated. Le backend se connecte avec l'URI PostgreSQL du compte serveur, **jamais depuis React**.

## 1. Configuration privée
Dans Supabase > Project > Connect, choisir **Session pooler** (port 5432), copier l'URI PostgreSQL. Sous Windows, si la connexion directe IPv6 ne fonctionne pas, le pooler de session est recommandé. Dans `backend`, copier `.env.example` vers `.env` et remplacer `DATABASE_URL` par la véritable URI. Le backend utilise explicitement psycopg 3 même si l'URI Supabase commence par `postgresql://`. Échapper les caractères spéciaux du mot de passe dans l'URI, ou utiliser un mot de passe compatible URL. Le fichier `backend/.env` est chargé quel que soit le dossier depuis lequel le backend est lancé. Ne jamais partager `.env`.

Générer une clé de signature d'au moins 32 octets et la placer dans `AUTH_SECRET_KEY` :
```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```
Ne pas communiquer ni commiter cette clé. Elle doit rester stable : la changer invalide toutes les sessions en cours.

## 2. Démarrage backend (PowerShell)
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# Compléter backend/.env : DATABASE_URL et AUTH_SECRET_KEY
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```
L'authentification applicative utilise maintenant les comptes de `public.directory_users`, sans Supabase Auth. Chaque mot de passe est haché avec Argon2id par le backend ; aucun mot de passe en clair n'est enregistré. Dans Supabase > SQL Editor, exécuter une fois [`supabase/migrations/20261118_add_password_hash.sql`](./supabase/migrations/20261118_add_password_hash.sql) pour ajouter `password_hash` à la table existante. Cette colonne contient uniquement le hachage.

Pour donner un premier mot de passe à un utilisateur déjà présent dans l'annuaire, ouvrir un terminal dans `backend`, puis lancer :
```powershell
.\.venv\Scripts\python.exe set_user_password.py
```
Le script demande l'adresse et le nouveau mot de passe sans l'afficher dans le terminal. Configurer d'abord un compte `admin`. Ensuite, les administrateurs pourront créer des comptes et définir/réinitialiser les mots de passe dans NexusOps > **Utilisateurs**. Les nouveaux mots de passe doivent contenir au moins 12 caractères.

Tester http://localhost:8000/api/health puis ouvrir http://localhost:5173 et se connecter avec l'adresse et le mot de passe configurés pour `directory_users`. La route `/api/health` reste publique ; les routes de données exigent un jeton signé par le backend et un compte toujours présent dans l'annuaire.

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
Les mots de passe sont hachés avec Argon2id dans le backend et ne sont jamais renvoyés par l'API. Les opérations de gestion des comptes sont réservées au rôle `admin`. Le jeton signé expire après une heure et reste en mémoire dans le frontend ; une reconnexion est nécessaire après rechargement. Ne jamais exposer l'API sans HTTPS ni communiquer/commiter `backend/.env`. RLS est activé sans politique publique ; le backend se connecte à PostgreSQL avec son URI privée. Pour la production, prévoir une limitation des tentatives de connexion, HTTPS et un worker de supervision distinct. Le ping ne peut atteindre que les IP privées/loopback accessibles depuis la machine exécutant FastAPI.
