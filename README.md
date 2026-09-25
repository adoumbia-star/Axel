# ProFuel — Mockup interactif (SUD CONTRACTORS)

Prototype cliquable du suivi carburant, de l'enlèvement GESTOCI jusqu'au dépotage en station.
Les données sont fictives : aucun backend, aucune sonde réelle.

## Démarrer en local

```bash
npm install
npm run dev
```

L'application est servie sur `http://localhost:5173`.

## Parcours testables

- **Mission GESTOCI → station** : création, chargement par compartiment, trajet avec alerte de variation, réception, rapprochement final.
- **Rapprochement dynamique** : modifier une mesure de réception recalcule l'écart en litres et en pourcentage.
- **Rôles** : sélecteur « Tester en tant que » dans la barre supérieure (Direction, Gérant station, Superviseur, Pompiste). Les menus changent selon le rôle.
- **Pompiste** : relevé des index d'ouverture, avec confirmation d'enregistrement.
- **Cuves et alertes** : niveaux, historique des jauges, anomalies hors zone autorisée.

## Design

Les couleurs, la typographie Montserrat et les composants suivent la charte SUD CONTRACTORS
fournie dans `design.md` (orange `#FF7900`, bleu marine `#001529`, icônes Lucide).

## Neon + Vercel

L'accès à Neon reste exclusivement côté serveur dans les fonctions Vercel du dossier `api/`.
La chaîne de connexion n'est jamais incluse dans le bundle React.

1. Dans le projet Vercel, ouvrir **Storage** → **Create Database** → **Neon**.
2. Lier la base au projet et aux environnements Production, Preview et Development. L'intégration crée `DATABASE_URL`.
3. Dans la console SQL Neon, exécuter dans l'ordre :

```text
db/schema.sql
db/seed.sql
```

4. Redéployer le projet. Le badge de la barre supérieure passe de **Mode démo** à **Neon connecté**.

Pour un environnement local connecté à Neon :

```bash
cp .env.example .env.local
# renseigner DATABASE_URL dans .env.local
npx vercel dev
```

API disponibles :

- `GET /api/health` : contrôle de la connexion Neon ;
- `GET /api/missions` : liste des missions ;
- `GET /api/mission?reference=MS-2026-0918` : détail d'une mission ;
- `PATCH /api/mission?reference=MS-2026-0918` : statut et mesures de réception ;
- `POST /api/pump-readings` : enregistrement d'un index de pompe.

Sans `DATABASE_URL`, ou en ouvrant le fichier HTML hors ligne, l'interface conserve automatiquement ses
données de démonstration. L'échec de connexion ne bloque donc jamais le workflow de présentation.

> Cette intégration est adaptée au mockup. Une mise en production requiert une authentification et une
> autorisation serveur par station avant d'autoriser les écritures.

## Déploiement Vercel

Le dépôt contient `vercel.json` (build Vite + réécritures SPA).

- Depuis le tableau de bord Vercel : importer le dépôt, aucun réglage supplémentaire n'est requis.
- Depuis la CLI :

```bash
npx vercel --prod
```

## Stack

Vite, React 19, TypeScript, React Router, Lucide React, CSS natif basé sur les tokens de la charte.
