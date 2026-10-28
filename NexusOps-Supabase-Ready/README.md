# NexusOps — React + FastAPI + Supabase PostgreSQL

## Supabase déjà configuré
Projet `rccmxvhwyptjyyceczqs` (Paris). Cinq tables créées avec RLS et aucun accès anon/authenticated. Le backend se connecte avec l'URI PostgreSQL du compte serveur, **jamais depuis React**.

## 1. Configuration privée
Dans Supabase > Project > Connect, choisir **Session pooler** (port 5432), copier l'URI PostgreSQL. Sous Windows, si la connexion directe IPv6 ne fonctionne pas, le pooler de session est recommandé. Dans `backend`, copier `.env.example` vers `.env` et remplacer `DATABASE_URL` par la véritable URI en utilisant `postgresql+psycopg://` (pas `postgresql://`). Échapper les caractères spéciaux du mot de passe dans l'URI, ou utiliser un mot de passe compatible URL. Ne jamais partager `.env`.

## 2. Démarrage backend (PowerShell)
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
# Modifier backend/.env avec la vraie DATABASE_URL
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```
Tester http://localhost:8000/api/health puis http://localhost:8000/api/equipment et http://localhost:8000/docs. Si la connexion échoue, vérifier la chaîne et le projet Supabase.

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
Développement local uniquement : l'API n'a **pas** d'authentification et doit rester accessible seulement depuis ton PC. RLS est activé sans politique publique. `directory_users` est un annuaire applicatif, **pas** Supabase Auth. Pour la production, ajouter Auth/JWT, rôles, restrictions d'accès, migrations et un worker de supervision distinct. Le ping ne peut atteindre que les IP privées/loopback accessibles depuis la machine exécutant FastAPI.
