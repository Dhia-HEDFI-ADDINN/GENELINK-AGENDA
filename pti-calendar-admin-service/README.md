# Admin Service

## PTI Calendar Solution - Microservice Administration Multi-Tenant

**Port :** 4005
**Framework :** NestJS 10+
**Base de données :** PostgreSQL (schema: pti_admin)

---

## Description

L'Admin Service gère l'administration globale de la plateforme multi-tenant.

### Responsabilités

- Gestion des tenants (réseaux, centres)
- Provisioning automatique
- Configuration globale
- Gestion des réseaux partenaires
- Statistiques consolidées
- Export de données

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
PORT=4005
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=pti_admin
KAFKA_BROKERS=localhost:9092
```

---

## API Endpoints

### Réseaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/v1/reseaux | Liste des réseaux |
| GET | /api/v1/reseaux/:id | Détail d'un réseau |
| POST | /api/v1/reseaux | Créer un réseau |
| PUT | /api/v1/reseaux/:id | Modifier un réseau |
| DELETE | /api/v1/reseaux/:id | Désactiver un réseau |

### Centres

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/v1/centres | Liste des centres |
| GET | /api/v1/centres/:id | Détail d'un centre |
| POST | /api/v1/centres | Créer un centre |
| PUT | /api/v1/centres/:id | Modifier un centre |
| DELETE | /api/v1/centres/:id | Désactiver un centre |

### Configuration

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/v1/centres/:id/config | Configuration d'un centre |
| PUT | /api/v1/centres/:id/config | Modifier la configuration |
| PUT | /api/v1/centres/:id/horaires | Modifier les horaires |
| PUT | /api/v1/centres/:id/tarifs | Modifier les tarifs |

### Statistiques

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/v1/stats/global | Statistiques globales |
| GET | /api/v1/stats/reseau/:id | Statistiques réseau |
| GET | /api/v1/stats/centre/:id | Statistiques centre |

---

## Architecture Multi-Tenant

```
SGS GLOBAL (Niveau 1)
├── SECURITEST (Réseau - Niveau 2)
│   ├── Centre Paris 11 (Centre - Niveau 3)
│   ├── Centre Paris 15 (Centre - Niveau 3)
│   └── Centre Lyon 3 (Centre - Niveau 3)
│
├── AUTO SÉCURITÉ (Réseau - Niveau 2)
│   ├── Centre Marseille (Centre - Niveau 3)
│   └── Centre Nice (Centre - Niveau 3)
│
└── Vérif'Auto (Réseau - Niveau 2)
    └── Centre Toulouse (Centre - Niveau 3)
```

---

## Modèle de Données

### Reseau

```typescript
interface Reseau {
  id: string;
  code: string;
  nom: string;
  logo_url?: string;

  contact: {
    nom: string;
    email: string;
    telephone: string;
  };

  configuration: {
    theme_couleur: string;
    domaine_personnalise?: string;
  };

  actif: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### Centre

```typescript
interface Centre {
  id: string;
  reseau_id: string;
  code: string;
  nom: string;

  adresse: {
    rue: string;
    code_postal: string;
    ville: string;
    latitude: number;
    longitude: number;
  };

  contact: {
    telephone: string;
    email: string;
  };

  configuration: {
    nb_lignes: number;
    types_controles: string[];
    agrement_gaz: boolean;
    agrement_electrique: boolean;
    surbooking_autorise: boolean;
    taux_surbooking: number;
  };

  horaires: Horaire[];
  tarifs: Tarif[];

  actif: boolean;
  created_at: Date;
  updated_at: Date;
}
```

---

## Provisioning Automatique

Lors de la création d'un nouveau centre :

1. Création du tenant en base
2. Configuration RLS PostgreSQL
3. Création des utilisateurs par défaut
4. Configuration des horaires par défaut
5. Configuration des tarifs par défaut
6. Notification au réseau

```typescript
@Injectable()
export class ProvisioningService {
  async provisionCentre(data: CreateCentreDto): Promise<Centre> {
    // 1. Créer le centre
    const centre = await this.centreRepository.create(data);

    // 2. Configurer RLS
    await this.configureRLS(centre.id);

    // 3. Créer utilisateur gestionnaire
    await this.userService.createGestionnaire(centre);

    // 4. Appliquer configuration par défaut
    await this.applyDefaultConfig(centre);

    // 5. Notifier
    await this.kafkaProducer.publish('centre.provisioned', centre);

    return centre;
  }
}
```

---

## Events Kafka

### Produits

- `centre.created` : Centre créé
- `centre.updated` : Centre modifié
- `centre.activated` : Centre activé
- `centre.deactivated` : Centre désactivé
- `reseau.created` : Réseau créé

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
curl http://localhost:4005/health
```
