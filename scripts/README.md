# 🚀 PTI Calendar - Scripts de gestion

Ce dossier contient les scripts pour gérer l'ensemble de la solution PTI Calendar.

## 📁 Structure des scripts

| Script | Description |
|--------|-------------|
| `start-all.ps1` / `start-all.sh` | Démarrage complet de l'application |
| `stop-all.ps1` / `stop-all.sh` | Arrêt de tous les composants |
| `restart.ps1` / `restart.sh` | Redémarrage des composants |
| `status.ps1` / `status.sh` | Affichage de l'état des composants |
| `install.ps1` / `install.sh` | Installation des dépendances |
| `logs.ps1` / `logs.sh` | Visualisation des logs |

## 🖥️ Windows (PowerShell)

### Installation initiale

```powershell
# Installer toutes les dépendances
.\scripts\install.ps1
```

### Démarrage

```powershell
# Démarrage complet (infrastructure + services + apps)
.\scripts\start-all.ps1

# Démarrage avec seed de la base de données
.\scripts\start-all.ps1 -Seed

# Démarrage de l'infrastructure seule
.\scripts\start-all.ps1 -Mode infra

# Démarrage des services seuls
.\scripts\start-all.ps1 -Mode services

# Démarrage des applications seules
.\scripts\start-all.ps1 -Mode apps

# Démarrage sans l'infrastructure (si déjà lancée)
.\scripts\start-all.ps1 -SkipInfra

# Démarrage sans rebuild des packages
.\scripts\start-all.ps1 -SkipBuild
```

### Arrêt

```powershell
# Arrêter tous les composants
.\scripts\stop-all.ps1

# Arrêter uniquement les applications
.\scripts\stop-all.ps1 -Mode apps

# Arrêter et nettoyer (logs, volumes Docker)
.\scripts\stop-all.ps1 -Mode clean
```

### Status

```powershell
# Voir l'état de tous les composants
.\scripts\status.ps1
```

### Logs

```powershell
# Voir tous les logs
.\scripts\logs.ps1

# Voir les logs d'un service spécifique
.\scripts\logs.ps1 -Component user-service

# Suivre les logs en temps réel
.\scripts\logs.ps1 -Follow

# Afficher plus de lignes
.\scripts\logs.ps1 -Lines 200
```

### Redémarrage

```powershell
# Redémarrer tous les composants
.\scripts\restart.ps1

# Redémarrer uniquement les services
.\scripts\restart.ps1 -Mode services
```

## 🐧 Linux/macOS (Bash)

### Installation initiale

```bash
# Rendre les scripts exécutables
chmod +x scripts/*.sh

# Installer toutes les dépendances
./scripts/install.sh
```

### Démarrage

```bash
# Démarrage complet
./scripts/start-all.sh dev

# Démarrage de l'infrastructure seule
./scripts/start-all.sh infra

# Démarrage sans apps
SKIP_APPS=true ./scripts/start-all.sh dev
```

### Arrêt

```bash
# Arrêter tous les composants
./scripts/stop-all.sh

# Arrêter et nettoyer
./scripts/stop-all.sh clean
```

### Status

```bash
./scripts/status.sh
```

## 🌐 URLs de toutes les composantes

### 🖥️ Applications Frontend

| Application | URL | Description |
|-------------|-----|-------------|
| **Pro WebApp** | http://localhost:3001 | Application pour les professionnels (centres de contrôle technique) |
| **Admin WebApp** | http://localhost:3002 | Administration du système et gestion des tenants |
| **CallCenter WebApp** | http://localhost:3003 | Centre d'appels pour la prise de RDV |
| **Client PWA** | http://localhost:3004 | Application client mobile-first (PWA) |

### ⚙️ Services Backend (API)

| Service | URL | Description |
|---------|-----|-------------|
| **User Service** | http://localhost:4005/api/v1 | Authentification et gestion des utilisateurs |
| **User Service Docs** | http://localhost:4005/docs | Documentation Swagger de l'API |
| Planning Service | http://localhost:4001/api/v1 | Gestion des plannings (non déployé) |
| RDV Service | http://localhost:4002/api/v1 | Gestion des rendez-vous (non déployé) |
| Payment Service | http://localhost:4003/api/v1 | Gestion des paiements (non déployé) |
| Notification Service | http://localhost:4004/api/v1 | Notifications (non déployé) |
| Admin Service | http://localhost:4006/api/v1 | Administration (non déployé) |

### 🛠️ Outils de développement

| Outil | URL | Identifiants |
|-------|-----|--------------|
| **pgAdmin** | http://localhost:5050 | `admin@pti-calendar.fr` / `admin` |
| **Kafka UI** | http://localhost:8084 | (pas d'authentification) |
| **Redis Commander** | http://localhost:8083 | (pas d'authentification) |

### 🗄️ Infrastructure

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5433 | Base de données principale |
| Redis | 6380 | Cache et sessions |
| Kafka | 9094 | Message broker |
| Zookeeper | 2181 | Coordination Kafka |

---

## 👤 Comptes de test

### Admin WebApp (http://localhost:3002)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Super Admin Tenant** | `admin@sgs-france.fr` | `Admin123!` |

### Pro WebApp (http://localhost:3001)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Gestionnaire Agence** | `gestionnaire@securitest.fr` | `Gestionnaire123!` |
| **Responsable Centre** | `responsable@centre-paris.fr` | `Responsable123!` |
| **Contrôleur Technique** | `controleur@centre-paris.fr` | `Controleur123!` |

### CallCenter WebApp (http://localhost:3003)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Agent Call Center** | `agent@callcenter.sgs.fr` | `Agent123!` |

### Client PWA (http://localhost:3004)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Client** | `client@test.fr` | `Client123!` |

---

## 🏗️ Architecture des composants

### Infrastructure Docker (Port mapping)

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5433 | Base de données principale |
| Redis | 6380 | Cache et sessions |
| Kafka | 9094 | Message broker |
| Zookeeper | 2181 | Coordination Kafka |
| pgAdmin | 5050 | Interface admin PostgreSQL |
| Kafka UI | 8084 | Interface admin Kafka |
| Redis Commander | 8083 | Interface admin Redis |

### Services Backend (NestJS)

| Service | Port | Base de données |
|---------|------|-----------------|
| User Service | 4005 | pti_user |
| Planning Service | 4001 | pti_planning |
| RDV Service | 4002 | pti_rdv |
| Payment Service | 4003 | pti_payment |
| Notification Service | 4004 | pti_notification |
| Admin Service | 4006 | pti_admin |

### Applications Frontend (Next.js)

| Application | Port | Description |
|-------------|------|-------------|
| Pro WebApp | 3001 | Application pour les professionnels |
| Admin WebApp | 3002 | Administration du système |
| CallCenter WebApp | 3003 | Centre d'appels |
| Client PWA | 3004 | Application client (PWA) |

## 👤 Utilisateurs de test

Après avoir exécuté le seed (`-Seed`), les utilisateurs suivants sont disponibles :

| WebApp | Email | Mot de passe | Rôle |
|--------|-------|--------------|------|
| Admin (3002) | admin@sgs-france.fr | Admin123! | ADMIN_TENANT |
| Pro (3001) | gestionnaire@securitest.fr | Gestionnaire123! | ADMIN_AGENCE |
| Pro (3001) | responsable@centre-paris.fr | Responsable123! | ADMIN_CT |
| Pro (3001) | controleur@centre-paris.fr | Controleur123! | CONTROLEUR |
| CallCenter (3003) | agent@callcenter.sgs.fr | Agent123! | CALL_CENTER |
| Client (3004) | client@test.fr | Client123! | CLIENT |

## 📝 Configuration

### Variables d'environnement principales

Les fichiers `.env` sont créés automatiquement par le script d'installation. Voici les principales variables :

**Services backend (.env):**
```env
NODE_ENV=development
PORT=4005
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=pti_user
REDIS_HOST=localhost
REDIS_PORT=6380
KAFKA_BROKERS=localhost:9094
JWT_SECRET=your-secret-key
```

**Applications frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:4005/api/v1
NEXT_PUBLIC_APP_ENV=development
```

## 🔧 Dépannage

### Les ports sont déjà utilisés

```powershell
# Vérifier quel processus utilise un port
Get-NetTCPConnection -LocalPort 3001 -State Listen

# Tuer tous les processus Node.js
taskkill /F /IM node.exe
```

### Docker ne démarre pas

```powershell
# Vérifier que Docker Desktop est lancé
docker ps

# Redémarrer les conteneurs
docker-compose -f pti-calendar-infrastructure/docker-compose.dev.yml down
docker-compose -f pti-calendar-infrastructure/docker-compose.dev.yml up -d
```

### Erreurs de build

```powershell
# Nettoyer et réinstaller
Remove-Item -Recurse -Force node_modules
pnpm install

# Rebuild le design-system
cd pti-calendar-design-system
pnpm build
```

## 📊 Monitoring

### Outils de développement

- **pgAdmin**: http://localhost:5050 (admin@pti-calendar.fr / admin)
- **Kafka UI**: http://localhost:8084
- **Redis Commander**: http://localhost:8083

### Logs

Les logs sont stockés dans le dossier `logs/` à la racine du projet :
- `user-service.log`
- `pro-webapp.log`
- `admin-webapp.log`
- etc.

```powershell
# Voir les logs en temps réel
Get-Content logs\user-service.log -Tail 50 -Wait
```
