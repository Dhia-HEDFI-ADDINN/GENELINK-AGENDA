# PTI Calendar Infrastructure

## Configuration Docker et Kubernetes pour PTI Calendar Solution

---

## Table des Matières

1. [Démarrage Rapide](#démarrage-rapide)
2. [Architecture Infrastructure](#architecture-infrastructure)
3. [Services et Ports](#services-et-ports)
4. [Environnements](#environnements)
5. [Monitoring](#monitoring)
6. [Déploiement Kubernetes](#déploiement-kubernetes)
7. [Maintenance](#maintenance)

---

## Démarrage Rapide

### Développement

```bash
# Démarrer l'infrastructure de développement
docker-compose -f docker-compose.dev.yml up -d

# Vérifier les services
docker-compose -f docker-compose.dev.yml ps

# Voir les logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Production

```bash
# Copier les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs production

# Démarrer tous les services
docker-compose up -d

# Vérifier les services
docker-compose ps
```

---

## Architecture Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER (Nginx)                    │
│                        :80 / :443                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   API GATEWAY (Kong)                        │
│              :8000 (Proxy) / :8001 (Admin)                  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    MICROSERVICES                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  │User  │ │Plan. │ │ RDV  │ │Pay.  │ │Notif │ │Admin │    │
│  │:4000 │ │:4001 │ │:4002 │ │:4003 │ │:4004 │ │:4005 │    │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘    │
│     │        │        │        │        │        │         │
└─────┼────────┼────────┼────────┼────────┼────────┼─────────┘
      │        │        │        │        │        │
┌─────▼────────▼────────▼────────▼────────▼────────▼─────────┐
│                      DATA LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │    Redis     │  │    Kafka     │      │
│  │    :5432     │  │    :6379     │  │    :9092     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Services et Ports

### Infrastructure Core

| Service | Port | Description | Credentials |
|---------|------|-------------|-------------|
| PostgreSQL | 5432 | Base de données | postgres / postgres |
| Redis | 6379 | Cache & Sessions | - |
| Kafka | 9092 | Event Bus | - |
| Zookeeper | 2181 | Kafka Coordination | - |

### API Gateway

| Service | Port | Description |
|---------|------|-------------|
| Kong Proxy | 8000 | API Gateway |
| Kong Admin | 8001 | Administration Kong |
| Kong SSL | 8443 | API Gateway (HTTPS) |

### Microservices Backend

| Service | Port | Base de données |
|---------|------|-----------------|
| User Service | 4000 | pti_user |
| Planning Service | 4001 | pti_planning |
| RDV Service | 4002 | pti_rdv |
| Payment Service | 4003 | pti_payment |
| Notification Service | 4004 | pti_notification |
| Admin Service | 4005 | pti_admin |
| Audit Service | 4006 | pti_audit |

### Applications Frontend

| Application | Port |
|-------------|------|
| Client PWA | 3000 |
| Pro WebApp | 3001 |
| Admin WebApp | 3002 |
| CallCenter WebApp | 3003 |

### Outils de Développement

| Outil | Port | Credentials |
|-------|------|-------------|
| pgAdmin | 5050 | admin@pti-calendar.fr / admin |
| Kafka UI | 8080 | - |
| Redis Commander | 8081 | - |

### Monitoring

| Outil | Port | Credentials |
|-------|------|-------------|
| Prometheus | 9090 | - |
| Grafana | 3030 | admin / admin |

---

## Environnements

### Développement (docker-compose.dev.yml)

Infrastructure seule (microservices en local) :
- PostgreSQL avec bases multiples
- Redis
- Kafka + Zookeeper
- pgAdmin, Kafka UI, Redis Commander

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Production (docker-compose.yml)

Stack complète avec tous les services :
- Infrastructure
- Tous les microservices
- Toutes les applications frontend
- API Gateway Kong

```bash
docker-compose up -d
```

---

## Bases de Données

### Création Automatique

Le script `init-multiple-databases.sh` crée automatiquement :

```
pti_user
pti_planning
pti_rdv
pti_payment
pti_notification
pti_admin
pti_audit
```

### Row-Level Security (RLS)

Isolation multi-tenant via RLS PostgreSQL :

```sql
-- Activer RLS sur une table
ALTER TABLE rdv ENABLE ROW LEVEL SECURITY;

-- Politique d'isolation par tenant
CREATE POLICY tenant_isolation ON rdv
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### Accès pgAdmin

1. Ouvrir http://localhost:5050
2. Login : admin@pti-calendar.fr / admin
3. Ajouter serveur :
   - Host : postgres (ou pti-postgres-dev)
   - Port : 5432
   - Username : postgres
   - Password : postgres

---

## Monitoring

### Prometheus

Configuration dans `monitoring/prometheus/prometheus.yml`

Métriques collectées :
- Latence des services
- Taux d'erreur
- Nombre de requêtes
- Métriques business (RDV, paiements)

### Grafana

Dashboards préconfigurés :
- Overview Platform
- Services Health
- Business Metrics
- Infrastructure

### Alertes

Règles d'alerte dans `monitoring/prometheus/rules/alerts.yml` :
- Service down
- Latence > 500ms
- Erreur rate > 5%
- Disque > 80%

---

## Déploiement Kubernetes

### Prérequis

- Cluster Kubernetes 1.28+
- kubectl configuré
- Helm 3+

### Déploiement

```bash
# Namespace
kubectl create namespace pti-calendar

# Secrets
kubectl apply -f kubernetes/secrets/

# Infrastructure
kubectl apply -f kubernetes/infrastructure/

# Services
kubectl apply -f kubernetes/services/

# Ingress
kubectl apply -f kubernetes/ingress/
```

### Vérification

```bash
# Pods
kubectl get pods -n pti-calendar

# Services
kubectl get svc -n pti-calendar

# Ingress
kubectl get ingress -n pti-calendar
```

---

## Maintenance

### Backup PostgreSQL

```bash
# Backup toutes les bases
docker exec pti-postgres pg_dumpall -U postgres > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20241127.sql | docker exec -i pti-postgres psql -U postgres
```

### Logs

```bash
# Logs d'un service
docker-compose logs -f user-service

# Logs de tous les services
docker-compose logs -f
```

### Mise à Jour

```bash
# Pull des nouvelles images
docker-compose pull

# Redémarrage avec nouvelles versions
docker-compose up -d

# Vérification
docker-compose ps
```

### Nettoyage

```bash
# Arrêt et suppression des conteneurs
docker-compose down

# Suppression avec volumes (ATTENTION: perte de données)
docker-compose down -v

# Nettoyage Docker
docker system prune -af
```

---

## Variables d'Environnement

### .env.example

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password_here

# Redis
REDIS_PASSWORD=redis_password_here

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Notifications
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
BREVO_API_KEY=xkeysib-xxx

# Monitoring
GRAFANA_ADMIN_PASSWORD=admin
```

---

## Troubleshooting

### PostgreSQL ne démarre pas

```bash
# Vérifier les logs
docker-compose logs postgres

# Réinitialiser le volume
docker-compose down -v
docker-compose up -d postgres
```

### Kafka erreur de connexion

```bash
# Vérifier que Zookeeper est up
docker-compose logs zookeeper

# Redémarrer Kafka
docker-compose restart kafka
```

### Service ne répond pas

```bash
# Health check
curl http://localhost:4000/health

# Logs du service
docker-compose logs user-service

# Redémarrer le service
docker-compose restart user-service
```
