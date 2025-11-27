# PTI CALENDAR SOLUTION - GENILINK

## Plateforme SaaS Multi-Tenant pour la Gestion des Rendez-vous de Contrôle Technique

**Client :** SGS France
**Projet :** PTI CALENDAR SOLUTION
**Prestataire :** NEXIUS IT / ADDINN Group
**Version :** 1.0.0
**Date :** Novembre 2024

---

## Table des Matières

1. [Présentation du Projet](#présentation-du-projet)
2. [Architecture Technique](#architecture-technique)
3. [Structure du Monorepo](#structure-du-monorepo)
4. [Guide de Démarrage Rapide](#guide-de-démarrage-rapide)
5. [Guide de Déploiement](#guide-de-déploiement)
6. [Manuel d'Utilisation](#manuel-dutilisation)
7. [Informations d'Accès](#informations-daccès)
8. [API Documentation](#api-documentation)
9. [Monitoring & Observabilité](#monitoring--observabilité)
10. [Contribuer](#contribuer)

---

## Présentation du Projet

### Vision

PTI Calendar Solution est une plateforme SaaS multi-tenant permettant la gestion complète des rendez-vous de contrôle technique pour les 2000+ centres SGS France.

### Caractéristiques Principales

- **Multi-Tenant 3 niveaux** : SGS Global → Réseaux → Centres
- **7M+ RDV/an** : Capacité de traitement haute performance
- **2000+ centres** : Couverture nationale complète
- **99.98% SLA** : Haute disponibilité garantie
- **< 200ms P95** : Latence optimisée

### Réseaux Partenaires

| Réseau | Nombre de Centres |
|--------|-------------------|
| SECURITEST | 700 centres |
| AUTO SÉCURITÉ | 800 centres |
| Vérif'Auto | 500 centres |

---

## Architecture Technique

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PTI CALENDAR SOLUTION                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    APPLICATIONS FRONTEND                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │   │
│  │  │  Client  │ │   Pro    │ │  Admin   │ │    CallCenter    │ │   │
│  │  │   PWA    │ │  WebApp  │ │  WebApp  │ │      WebApp      │ │   │
│  │  │  :3000   │ │  :3001   │ │  :3002   │ │      :3003       │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     API GATEWAY (Kong)                        │   │
│  │                         :8000                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    MICROSERVICES BACKEND                      │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐  │   │
│  │  │  User  │ │Planning│ │  RDV   │ │Payment │ │Notification│  │   │
│  │  │ :4000  │ │ :4001  │ │ :4002  │ │ :4003  │ │   :4004    │  │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────────┘  │   │
│  │  ┌────────┐ ┌────────┐ ┌────────────────────────────────────┐│   │
│  │  │ Admin  │ │ Audit  │ │           IA Service               ││   │
│  │  │ :4005  │ │ :4006  │ │             :5001                  ││   │
│  │  └────────┘ └────────┘ └────────────────────────────────────┘│   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      INFRASTRUCTURE                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │   │
│  │  │PostgreSQL│ │  Redis   │ │  Kafka   │ │    Monitoring    │ │   │
│  │  │  :5432   │ │  :6379   │ │  :9092   │ │  Prometheus/Graf │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Stack Technique

| Couche | Technologies |
|--------|--------------|
| **Frontend** | Next.js 14, React 18, TypeScript 5, Tailwind CSS |
| **Backend** | NestJS 10, Node.js 20, TypeScript 5 |
| **IA Service** | Python 3.11, FastAPI |
| **Base de données** | PostgreSQL 16 avec Row-Level Security (RLS) |
| **Cache** | Redis 7 |
| **Event Bus** | Apache Kafka |
| **API Gateway** | Kong 3.5 |
| **Monitoring** | Prometheus, Grafana, ELK Stack |
| **Conteneurisation** | Docker, Kubernetes |

### Isolation Multi-Tenant

L'isolation des données est assurée par PostgreSQL Row-Level Security (RLS) :

```sql
-- Politique RLS pour isolation par tenant
CREATE POLICY tenant_isolation ON rdv
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

## Structure du Monorepo

```
pti-calendar-monorepo/
│
├── 📁 DOCUMENTATION
│   ├── 00_SYNTHESE_DOCUMENTATION_COMPLETE.md
│   ├── 02_USE_CASES_METIER_EXHAUSTIFS.md
│   ├── 03_DESIGN_SYSTEM_SGS_COMPLET.md
│   └── 04_ARCHITECTURE_MULTI_PROJETS_MICROSERVICES.md
│
├── 📁 PACKAGES PARTAGÉS
│   ├── pti-calendar-shared-types/      # Types TypeScript partagés
│   ├── pti-calendar-shared-utils/      # Utilitaires communs
│   ├── pti-calendar-api-client/        # Client API pour frontends
│   └── pti-calendar-design-system/     # Design System SGS
│
├── 📁 SERVICES BACKEND (NestJS)
│   ├── pti-calendar-user-service/      # Authentification & utilisateurs
│   ├── pti-calendar-planning-service/  # Gestion des plannings
│   ├── pti-calendar-rdv-service/       # Gestion des RDV
│   ├── pti-calendar-payment-service/   # Paiements (Stripe)
│   ├── pti-calendar-notification-service/ # Notifications (Email, SMS)
│   ├── pti-calendar-admin-service/     # Administration multi-tenant
│   └── pti-calendar-audit-service/     # Audit et traçabilité
│
├── 📁 APPLICATIONS FRONTEND (Next.js)
│   ├── pti-calendar-client-pwa/        # PWA Client particulier
│   ├── pti-calendar-pro-webapp/        # WebApp Centres/Contrôleurs
│   ├── pti-calendar-admin-webapp/      # WebApp Administration SGS
│   └── pti-calendar-callcenter-webapp/ # WebApp Centre d'appels
│
├── 📁 INFRASTRUCTURE
│   ├── pti-calendar-infrastructure/    # Docker, Kubernetes, Terraform
│   ├── pti-calendar-api-gateway/       # Configuration Kong
│   └── pti-calendar-db-migrations/     # Migrations SQL
│
├── 📁 SERVICES SPÉCIALISÉS
│   ├── pti-calendar-ia-service/        # Service IA (Python/FastAPI)
│   └── pti-calendar-integration-service/ # Intégrations tierces
│
├── 📁 SCRIPTS
│   ├── scripts/start-all.sh            # Démarrage complet
│   ├── scripts/stop-all.sh             # Arrêt complet
│   ├── scripts/status.sh               # État des services
│   ├── scripts/logs.sh                 # Visualisation logs
│   ├── scripts/restart.sh              # Redémarrage
│   └── scripts/install.sh              # Installation
│
├── package.json                        # Configuration monorepo
├── pnpm-workspace.yaml                 # Workspace pnpm
└── README.md                           # Ce fichier
```

---

## Guide de Démarrage Rapide

### Prérequis

- **Node.js** : >= 18.0.0
- **pnpm** : >= 8.0.0
- **Docker** : >= 24.0
- **Docker Compose** : >= 2.0

### Installation

```bash
# 1. Cloner le repository
git clone https://github.com/sgs-genilink/pti-calendar-monorepo.git
cd pti-calendar-monorepo

# 2. Installer les dépendances
pnpm install

# 3. Configurer l'environnement
./scripts/install.sh

# 4. Démarrer la plateforme complète
pnpm start
```

### Commandes Principales

```bash
# Démarrage
pnpm start              # Démarrage complet (mode dev)
pnpm start:prod         # Démarrage production (Docker)
pnpm start:infra        # Infrastructure seule
pnpm start:services     # Services backend seuls
pnpm start:apps         # Applications frontend seules

# Arrêt
pnpm stop               # Arrêt complet
pnpm stop:clean         # Arrêt + suppression volumes

# Monitoring
pnpm status             # État des services
pnpm logs               # Tous les logs
pnpm logs:services      # Logs services backend
pnpm logs:apps          # Logs applications frontend

# Développement
pnpm dev:client         # PWA Client (:3000)
pnpm dev:pro            # Pro WebApp (:3001)
pnpm dev:admin          # Admin WebApp (:3002)
pnpm dev:callcenter     # CallCenter WebApp (:3003)
pnpm dev:services       # Tous les services backend

# Build & Tests
pnpm build              # Build tous les projets
pnpm test               # Exécuter les tests
pnpm lint               # Linter
pnpm type-check         # Vérification TypeScript
```

### URLs en Développement

| Application | URL | Description |
|-------------|-----|-------------|
| **Client PWA** | http://localhost:3000 | Interface client particulier |
| **Pro WebApp** | http://localhost:3001 | Interface centres/contrôleurs |
| **Admin WebApp** | http://localhost:3002 | Administration SGS |
| **CallCenter** | http://localhost:3003 | Centre d'appels |
| **API Gateway** | http://localhost:8000 | Proxy API |
| **pgAdmin** | http://localhost:5050 | Administration PostgreSQL |
| **Kafka UI** | http://localhost:8080 | Administration Kafka |
| **Redis Commander** | http://localhost:8081 | Administration Redis |
| **Grafana** | http://localhost:3030 | Dashboards monitoring |
| **Prometheus** | http://localhost:9090 | Métriques |

---

## Guide de Déploiement

### Environnements

| Environnement | URL | Description |
|---------------|-----|-------------|
| **Development** | localhost | Environnement local |
| **Staging** | staging.genilink.fr | Pré-production |
| **Production** | *.genilink.fr | Production multi-tenant |

### Déploiement Docker

```bash
# Build des images Docker
pnpm docker:build

# Démarrage de la stack production
pnpm docker:up

# Vérification des logs
pnpm docker:logs

# Arrêt
pnpm docker:down
```

### Déploiement Kubernetes

```bash
# Appliquer les manifests Kubernetes
kubectl apply -f pti-calendar-infrastructure/kubernetes/

# Vérifier le déploiement
kubectl get pods -n pti-calendar

# Vérifier les services
kubectl get svc -n pti-calendar
```

### Variables d'Environnement Production

```bash
# Base de données
DATABASE_HOST=postgres.pti-calendar.svc.cluster.local
DATABASE_PORT=5432
DATABASE_NAME=pti_calendar
DATABASE_USER=pti_user
DATABASE_PASSWORD=${SECURE_DB_PASSWORD}

# Redis
REDIS_HOST=redis.pti-calendar.svc.cluster.local
REDIS_PORT=6379

# Kafka
KAFKA_BROKERS=kafka:9092

# JWT
JWT_SECRET=${SECURE_JWT_SECRET}
JWT_EXPIRES_IN=1h

# Stripe (Paiements)
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}

# Notifications
TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
SMTP_HOST=smtp.brevo.com
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
```

---

## Manuel d'Utilisation

### Pour les Clients (PWA)

1. **Recherche de centre** : Saisir code postal ou activer géolocalisation
2. **Sélection du créneau** : Choisir date et heure disponibles
3. **Informations véhicule** : Renseigner immatriculation et type
4. **Paiement** : Régler par carte bancaire (Stripe)
5. **Confirmation** : Recevoir SMS et email de confirmation

### Pour les Contrôleurs (Pro WebApp)

1. **Connexion** : Authentification SSO
2. **Dashboard** : Vue planning journalier
3. **Gestion RDV** : Check-in, démarrage, fin de contrôle
4. **Résultats** : Saisie des défauts et observations
5. **Rapports** : Consultation des statistiques

### Pour les Administrateurs (Admin WebApp)

1. **Tableau de bord** : Vue consolidée tous centres
2. **Gestion des centres** : Configuration, horaires, tarifs
3. **Gestion des utilisateurs** : Création, rôles, permissions
4. **Audit** : Consultation des logs d'activité
5. **Monitoring** : Santé système, alertes
6. **Rapports** : Statistiques multi-centres

### Pour le Call Center

1. **Recherche client** : Par téléphone, nom, immatriculation
2. **Création RDV** : Pour le compte du client
3. **Modifications** : Report, annulation
4. **Rappels** : Gestion des callbacks
5. **Scripts** : Aide à la conversation

---

## Informations d'Accès

### Environnement de Développement

#### Base de Données PostgreSQL

| Paramètre | Valeur |
|-----------|--------|
| **Host** | localhost |
| **Port** | 5432 |
| **Utilisateur** | postgres |
| **Mot de passe** | postgres |
| **Bases** | pti_user, pti_planning, pti_rdv, pti_payment, pti_notification, pti_admin, pti_audit |

#### Redis

| Paramètre | Valeur |
|-----------|--------|
| **Host** | localhost |
| **Port** | 6379 |
| **Mot de passe** | (aucun en dev) |

#### Kafka

| Paramètre | Valeur |
|-----------|--------|
| **Brokers** | localhost:9092 |
| **Topics** | rdv.events, planning.events, payment.events, notification.events |

#### pgAdmin

| Paramètre | Valeur |
|-----------|--------|
| **URL** | http://localhost:5050 |
| **Email** | admin@pti-calendar.fr |
| **Mot de passe** | admin |

#### Grafana

| Paramètre | Valeur |
|-----------|--------|
| **URL** | http://localhost:3030 |
| **Utilisateur** | admin |
| **Mot de passe** | admin |

### Comptes Utilisateurs de Test

#### Admin SGS Global

| Paramètre | Valeur |
|-----------|--------|
| **Email** | admin@sgs-france.fr |
| **Mot de passe** | Admin123! |
| **Rôle** | ADMIN_SGS |

#### Gestionnaire Réseau

| Paramètre | Valeur |
|-----------|--------|
| **Email** | gestionnaire@securitest.fr |
| **Mot de passe** | Gestionnaire123! |
| **Rôle** | ADMIN_RESEAU |

#### Responsable Centre

| Paramètre | Valeur |
|-----------|--------|
| **Email** | responsable@centre-paris.fr |
| **Mot de passe** | Responsable123! |
| **Rôle** | GESTIONNAIRE_CENTRE |

#### Contrôleur

| Paramètre | Valeur |
|-----------|--------|
| **Email** | controleur@centre-paris.fr |
| **Mot de passe** | Controleur123! |
| **Rôle** | CONTROLEUR |

#### Agent Call Center

| Paramètre | Valeur |
|-----------|--------|
| **Email** | agent@callcenter.sgs.fr |
| **Mot de passe** | Agent123! |
| **Rôle** | CALLCENTER |

#### Client Test

| Paramètre | Valeur |
|-----------|--------|
| **Email** | client@test.fr |
| **Mot de passe** | Client123! |
| **Rôle** | CLIENT |

---

## API Documentation

### Authentification

Toutes les APIs utilisent JWT Bearer Token :

```bash
# Obtenir un token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sgs-france.fr", "password": "Admin123!"}'

# Utiliser le token
curl http://localhost:8000/api/v1/rdv \
  -H "Authorization: Bearer {token}"
```

### Endpoints Principaux

| Service | Base URL | Description |
|---------|----------|-------------|
| **Auth** | /api/v1/auth | Authentification |
| **Users** | /api/v1/users | Gestion utilisateurs |
| **Planning** | /api/v1/planning | Plannings |
| **Disponibilités** | /api/v1/disponibilites | Créneaux disponibles |
| **RDV** | /api/v1/rdv | Gestion RDV |
| **Payment** | /api/v1/payment | Paiements |
| **Notifications** | /api/v1/notifications | Notifications |
| **Centres** | /api/v1/centres | Gestion centres |
| **Audit** | /api/v1/audit | Logs d'audit |

### Exemple : Créer un RDV

```bash
curl -X POST http://localhost:8000/api/v1/rdv \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "centre_id": "uuid-centre",
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

## Monitoring & Observabilité

### Métriques (Prometheus)

Accès : http://localhost:9090

Métriques disponibles :
- `http_request_duration_seconds` : Latence des requêtes
- `http_requests_total` : Nombre de requêtes
- `rdv_created_total` : RDV créés
- `payment_processed_total` : Paiements traités

### Dashboards (Grafana)

Accès : http://localhost:3030

Dashboards préconfigurés :
- **Overview** : Vue globale plateforme
- **Services** : Santé des microservices
- **Business** : KPIs métier
- **Infrastructure** : Ressources système

### Logs

```bash
# Tous les logs
pnpm logs

# Logs d'un service spécifique
pnpm logs user-service
pnpm logs rdv-service

# Logs en temps réel
FOLLOW=true pnpm logs services
```

### Alertes

Les alertes sont configurées dans Prometheus :
- Service down
- Latence > 500ms
- Erreur rate > 5%
- Mémoire > 80%

---

## Contribuer

### Workflow Git

1. Créer une branche depuis `main`
2. Développer la fonctionnalité
3. Écrire les tests
4. Créer une Pull Request
5. Code review
6. Merge après approbation

### Conventions

- **Commits** : Conventional Commits (feat:, fix:, docs:, etc.)
- **Code** : ESLint + Prettier
- **Tests** : Jest, coverage > 80%
- **Documentation** : JSDoc pour les fonctions publiques

### Structure des Commits

```
type(scope): description

[optional body]

[optional footer]
```

Types : feat, fix, docs, style, refactor, test, chore

---

## Support

### Contacts Techniques

- **Architecte Lead** : architect@nexius.com
- **Tech Lead Backend** : backend@nexius.com
- **Tech Lead Frontend** : frontend@nexius.com

### Documentation Complémentaire

- [Architecture Multi-Tenant](./04_ARCHITECTURE_MULTI_PROJETS_MICROSERVICES.md)
- [Use Cases Métier](./02_USE_CASES_METIER_EXHAUSTIFS.md)
- [Design System SGS](./03_DESIGN_SYSTEM_SGS_COMPLET.md)

---

## Licence

Propriétaire - SGS France
Usage interne uniquement

---

**Document généré par :** NEXIUS IT / ADDINN Group
**Pour :** SGS France
**Version :** 1.0.0
**Date :** Novembre 2024
