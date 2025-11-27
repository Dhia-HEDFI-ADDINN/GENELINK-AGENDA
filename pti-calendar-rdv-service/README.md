# RDV Service

## PTI Calendar Solution - Microservice Gestion des Rendez-vous

**Port :** 4002
**Framework :** NestJS 10+
**Base de données :** PostgreSQL (schema: pti_rdv)

---

## Description

Le RDV Service gère le cycle de vie complet des rendez-vous de contrôle technique.

### Responsabilités

- Création de RDV
- Modification de RDV (report, changement)
- Annulation de RDV
- Workflow contrôle (check-in, démarrage, fin)
- Gestion des résultats de contrôle
- Historique client

---

## Démarrage Rapide

### Installation

```bash
npm install
cp .env.example .env
npm run start:dev
```

### Variables d'Environnement

```bash
NODE_ENV=development
PORT=4002
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=pti_rdv
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
```

---

## API Endpoints

### RDV

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/v1/rdv | Liste des RDV |
| GET | /api/v1/rdv/:id | Détail d'un RDV |
| POST | /api/v1/rdv | Créer un RDV |
| PUT | /api/v1/rdv/:id | Modifier un RDV |
| DELETE | /api/v1/rdv/:id | Annuler un RDV |

### Workflow Contrôle

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/v1/rdv/:id/checkin | Check-in client |
| POST | /api/v1/rdv/:id/demarrer | Démarrer le contrôle |
| POST | /api/v1/rdv/:id/terminer | Terminer le contrôle |
| POST | /api/v1/rdv/:id/resultat | Enregistrer résultat |

### Recherche

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/v1/rdv/recherche | Recherche multi-critères |
| GET | /api/v1/rdv/client/:clientId | RDV d'un client |
| GET | /api/v1/rdv/centre/:centreId | RDV d'un centre |

---

## Modèle de Données

### RDV

```typescript
interface Rdv {
  id: string;
  tenant_id: string;
  centre_id: string;
  controleur_id?: string;
  ligne_id: string;

  // Créneau
  date: string;
  heure_debut: string;
  heure_fin: string;

  // Type
  type_controle: 'CTP' | 'CVP' | 'CV';

  // Client
  client: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };

  // Véhicule
  vehicule: {
    immatriculation: string;
    type: 'VL' | 'L';
    carburant: string;
    marque?: string;
    modele?: string;
  };

  // Statut
  statut: RdvStatut;

  // Paiement
  montant_ttc: number;
  paiement_id?: string;
  paye: boolean;

  // Résultat
  resultat?: 'FAVORABLE' | 'DEFAVORABLE' | 'CONTRE_VISITE';
  defauts?: Defaut[];
  observations?: string;

  // Métadonnées
  source: 'WEB' | 'PWA' | 'CALLCENTER' | 'CENTRE';
  created_at: Date;
  updated_at: Date;
}

type RdvStatut =
  | 'RESERVE'
  | 'CONFIRME'
  | 'ARRIVE'
  | 'EN_COURS'
  | 'TERMINE'
  | 'ANNULE'
  | 'NO_SHOW';
```

---

## Cycle de Vie du RDV

```
RESERVE → CONFIRME → ARRIVE → EN_COURS → TERMINE
    ↓         ↓         ↓         ↓
  ANNULE   ANNULE   NO_SHOW   ANNULE
```

---

## Events Kafka

### Produits

- `rdv.created` : RDV créé
- `rdv.confirmed` : RDV confirmé
- `rdv.modified` : RDV modifié
- `rdv.cancelled` : RDV annulé
- `rdv.checkin` : Client arrivé
- `rdv.started` : Contrôle démarré
- `rdv.completed` : Contrôle terminé

### Consommés

- `payment.completed` : Confirmer le RDV après paiement
- `notification.sent` : Accusé de notification

---

## Exemple de Création de RDV

```bash
curl -X POST http://localhost:4002/api/v1/rdv \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "centre_id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2024-12-15",
    "heure_debut": "09:00",
    "type_controle": "CTP",
    "client": {
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@email.fr",
      "telephone": "0612345678"
    },
    "vehicule": {
      "immatriculation": "AB-123-CD",
      "type": "VL",
      "carburant": "Essence"
    }
  }'
```

---

## Tests

```bash
npm run test
npm run test:cov
npm run test:e2e
```

---

## Health Check

```bash
curl http://localhost:4002/health
```
