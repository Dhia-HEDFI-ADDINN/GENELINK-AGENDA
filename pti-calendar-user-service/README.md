# User Service

## PTI Calendar Solution - Microservice Authentification & Utilisateurs

**Port :** 4000
**Framework :** NestJS 10+
**Base de données :** PostgreSQL (schema: pti_user)

---

## Description

Le User Service gère l'authentification, l'autorisation et la gestion des utilisateurs pour l'ensemble de la plateforme PTI Calendar.

### Responsabilités

- Authentification JWT (login, refresh token, logout)
- Gestion des utilisateurs (CRUD)
- Gestion des rôles et permissions
- SSO OAuth2/OIDC (Google, Microsoft)
- Gestion des sessions
- Audit des connexions

---

## Démarrage Rapide

### Prérequis

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Installation

```bash
# Installation des dépendances
npm install

# Configuration
cp .env.example .env
# Éditer .env avec vos paramètres

# Démarrage en développement
npm run start:dev
```

### Variables d'Environnement

```bash
# Application
NODE_ENV=development
PORT=4000

# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=pti_user

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# OAuth (optionnel)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

---

## API Endpoints

### Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/v1/auth/login | Connexion utilisateur |
| POST | /api/v1/auth/register | Inscription |
| POST | /api/v1/auth/refresh | Rafraîchir le token |
| POST | /api/v1/auth/logout | Déconnexion |
| GET | /api/v1/auth/me | Profil utilisateur connecté |

### Utilisateurs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/v1/users | Liste des utilisateurs |
| GET | /api/v1/users/:id | Détail d'un utilisateur |
| POST | /api/v1/users | Créer un utilisateur |
| PUT | /api/v1/users/:id | Modifier un utilisateur |
| DELETE | /api/v1/users/:id | Supprimer un utilisateur |

### Rôles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/v1/roles | Liste des rôles |
| GET | /api/v1/roles/:id | Détail d'un rôle |
| POST | /api/v1/roles | Créer un rôle |
| PUT | /api/v1/roles/:id | Modifier un rôle |

---

## Modèle de Données

### User

```typescript
interface User {
  id: string;
  email: string;
  password_hash: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role_id: string;
  tenant_id?: string;
  centre_id?: string;
  actif: boolean;
  email_verifie: boolean;
  derniere_connexion?: Date;
  created_at: Date;
  updated_at: Date;
}
```

### Role

```typescript
interface Role {
  id: string;
  code: string; // ADMIN_SGS, ADMIN_RESEAU, GESTIONNAIRE_CENTRE, CONTROLEUR, CALLCENTER, CLIENT
  nom: string;
  description: string;
  permissions: string[];
  niveau: number; // 1=SGS, 2=Réseau, 3=Centre, 4=Client
}
```

---

## Rôles Disponibles

| Code | Niveau | Description |
|------|--------|-------------|
| ADMIN_SGS | 1 | Administrateur SGS Global |
| ADMIN_RESEAU | 2 | Administrateur Réseau |
| GESTIONNAIRE_CENTRE | 3 | Gestionnaire de Centre |
| CONTROLEUR | 3 | Contrôleur Technique |
| CALLCENTER | 3 | Agent Call Center |
| CLIENT | 4 | Client Particulier |

---

## Comptes de Test

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@sgs-france.fr | Admin123! | ADMIN_SGS |
| gestionnaire@securitest.fr | Gestionnaire123! | ADMIN_RESEAU |
| responsable@centre-paris.fr | Responsable123! | GESTIONNAIRE_CENTRE |
| controleur@centre-paris.fr | Controleur123! | CONTROLEUR |
| agent@callcenter.sgs.fr | Agent123! | CALLCENTER |
| client@test.fr | Client123! | CLIENT |

---

## Tests

```bash
# Tests unitaires
npm run test

# Tests avec couverture
npm run test:cov

# Tests E2E
npm run test:e2e
```

---

## Docker

```bash
# Build
docker build -t pti-user-service .

# Run
docker run -p 4000:4000 pti-user-service
```

---

## Health Check

```bash
curl http://localhost:4000/health
```

Réponse :
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```
