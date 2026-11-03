# UniWorld Connect — intégration des étudiants internationaux

Plateforme qui aide les **étudiants internationaux** à s'intégrer, réalisée pour le projet Yboost (CASMA). Elle propose des profils, une mise en relation intelligente entre étudiants, une messagerie en temps réel, un assistant IA, de la traduction automatique et des recommandations d'événements.

## Contenu

| Dossier | Rôle |
|---|---|
| `frontend/` | Application React + TypeScript (TanStack Start, Vite, Tailwind, composants shadcn/Radix), déployable sur Cloudflare |
| `server/` | API Express : JWT + bcrypt, Firestore, Socket.io, OpenAI et Gemini, Google Translate, `helmet` et limitation de débit. Voir [`server/README.md`](server/README.md) et [`server/RAPPORT_BACKEND.md`](server/RAPPORT_BACKEND.md) |
| Documents | cahier des charges, rapports du projet |

## Démarrer

```bash
cd server && cp .env.example .env && npm install && npm run dev
cd frontend && npm install && npm run dev
```

> Licence : aucune licence n'est déclarée dans ce dépôt (tous droits réservés par défaut).
