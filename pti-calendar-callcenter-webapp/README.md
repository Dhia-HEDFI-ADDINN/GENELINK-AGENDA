# CallCenter WebApp

## PTI Calendar Solution - Application Centre d'Appels

**Port :** 3003
**Framework :** Next.js 14 (App Router)
**Utilisateurs :** Agents du centre d'appels

---

## Description

Application dédiée aux agents du centre d'appels pour la gestion des RDV par téléphone.

### Fonctionnalités

- Dashboard agent avec KPIs
- Recherche client multi-critères
- Création de RDV pour les clients
- Gestion des modifications/annulations
- Gestion des rappels
- Scripts d'aide à la conversation
- FAQ intégrée

---

## Démarrage Rapide

### Installation

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

L'application démarre sur http://localhost:3003

### Variables d'Environnement

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development
```

---

## Structure du Projet

```
pti-calendar-callcenter-webapp/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # Dashboard agent
│   │   │   ├── clients/          # Recherche clients
│   │   │   ├── rappels/          # Gestion rappels
│   │   │   ├── confirmations/    # Confirmation RDV
│   │   │   └── scripts/          # Scripts & FAQ
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── clients/
│   │   ├── rdv/
│   │   ├── rappels/
│   │   └── scripts/
│   │
│   └── lib/
│
└── package.json
```

---

## Dashboard Agent

### KPIs Temps Réel

- Appels du jour
- RDV créés
- RDV modifiés
- RDV annulés
- Temps moyen de traitement
- Taux de conversion

### Objectifs Quotidiens

Suivi des objectifs avec barres de progression :
- Appels : 50/jour
- RDV créés : 20/jour
- Taux de conversion : 40%

### Actions Rapides

- Nouveau RDV
- Rechercher client
- Mes rappels du jour

---

## Recherche Client

### Critères de Recherche

- Numéro de téléphone
- Nom / Prénom
- Email
- Immatriculation véhicule
- Numéro de RDV

### Fiche Client

Une fois le client trouvé :
- Informations personnelles
- Historique des RDV
- Véhicules enregistrés
- Notes précédentes

---

## Gestion des Rappels

### Types de Rappels

| Priorité | Description | Délai max |
|----------|-------------|-----------|
| HAUTE | Client mécontent, urgence | 1h |
| NORMALE | Demande d'information | 4h |
| BASSE | Confirmation, suivi | 24h |

### Statuts

- EN_ATTENTE : À rappeler
- EFFECTUE : Rappel effectué
- ECHEC : Client injoignable
- REPORTE : Rappeler plus tard

---

## Confirmation RDV

Workflow de confirmation des RDV J-1 :

1. Liste des RDV à confirmer
2. Script d'appel intégré
3. Actions : Confirmer / Annuler / Reporter / Injoignable
4. Passage au suivant automatique

---

## Scripts d'Appel

### Accueil

```
Bonjour, [Nom du centre] à votre service.
Je suis [Prénom], comment puis-je vous aider ?
```

### Prise de RDV

```
1. Vérifier les informations client
2. Demander le type de contrôle
3. Proposer les créneaux disponibles
4. Confirmer les informations véhicule
5. Procéder au paiement (si en ligne)
6. Récapituler le RDV
```

### Annulation

```
1. Vérifier l'identité du client
2. Confirmer le RDV concerné
3. Demander le motif d'annulation
4. Proposer un report si pertinent
5. Confirmer l'annulation
6. Indiquer les modalités de remboursement
```

---

## FAQ Intégrée

Réponses rapides aux questions fréquentes :

- Documents nécessaires
- Durée du contrôle
- Tarifs
- Contre-visite
- Paiement
- Annulation / Report

---

## Comptes de Test

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| agent@callcenter.sgs.fr | Agent123! | CALLCENTER |

---

## Tests

```bash
pnpm test
pnpm test:e2e
```

---

## Build Production

```bash
pnpm build
pnpm start
```

---

## Docker

```bash
docker build -t pti-callcenter-webapp .
docker run -p 3003:3000 pti-callcenter-webapp
```
