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

## Déploiement Vercel

Le dépôt contient `vercel.json` (build Vite + réécritures SPA).

- Depuis le tableau de bord Vercel : importer le dépôt, aucun réglage supplémentaire n'est requis.
- Depuis la CLI :

```bash
npx vercel --prod
```

## Stack

Vite, React 19, TypeScript, React Router, Lucide React, CSS natif basé sur les tokens de la charte.
