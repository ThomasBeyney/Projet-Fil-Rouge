# NexusOps — Frontend

Interface de supervision React 19 + TypeScript + Vite.

## Installation

Node.js 22+ recommandé.

```bash
npm install
npm run dev
```

## Vérification

```bash
npm run build
npm run lint
```

## Fonctionnalités

- Tableau de bord : compteurs, disponibilité et incidents récents.
- Équipements : recherche, filtre, ajout, modification et suppression protégée si des incidents y sont liés.
- Incidents : recherche, filtre, ajout, modification, suppression et liaison à un équipement.
- Utilisateurs : recherche, ajout, modification, suppression, validation et unicité des e-mails.
- Sauvegarde locale automatique dans `localStorage`.
- Interface sombre et responsive, formulaires accessibles au clavier.

## Limites importantes

**Ceci est un frontend de démonstration, pas une application de production.** Les données sont enregistrées uniquement dans le navigateur utilisé, sans synchronisation multi-utilisateur. Aucune authentification, autorisation, API, base SQL, monitoring réel ou backend n'est implémenté. Le statut de démonstration ne reflète pas la santé réelle des serveurs. Les données initiales sont des exemples.

Pour la production : API FastAPI, PostgreSQL, JWT et contrôles d'accès côté serveur, tests d'intégration/E2E, CI et déploiement sécurisé.

## Structure

- `src/App.tsx` : navigation et état partagé.
- `src/pages/` : logique propre à chaque page.
- `src/components/` : composants réutilisables.
- `src/lib/storage.ts` : persistance locale résiliente.
- `src/lib/utils.ts` : fonctions utilitaires.
- `src/services/api.ts` : types et données de démonstration (aucune requête réseau).
