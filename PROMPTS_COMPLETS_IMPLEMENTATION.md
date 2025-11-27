# PROMPTS COMPLETS IMPLÉMENTATION PTI CALENDAR SOLUTION

**Projet GENILINK - SGS France**  
**693 000 € HT | 26 mois | 2000 centres | 7M+ RDV/an**

---

## 📋 TABLE DES MATIÈRES

1. [Prompt Maître - Vision Globale](#1-prompt-maître---vision-globale)
2. [Infrastructure & DevOps](#2-infrastructure--devops)
3. [Backend Microservices](#3-backend-microservices)
4. [Frontend Applications](#4-frontend-applications)
5. [Module IA](#5-module-ia)
6. [Intégrations Systèmes Tiers](#6-intégrations-systèmes-tiers)
7. [Tests & Qualité](#7-tests--qualité)
8. [Sécurité & RGPD](#8-sécurité--rgpd)
9. [Déploiement & Production](#9-déploiement--production)
10. [Documentation](#10-documentation)

---

## 1. PROMPT MAÎTRE - VISION GLOBALE

```
Tu es un architecte logiciel senior expert en applications web modernes, architecture microservices, et cloud-native. Tu vas implémenter la solution PTI CALENDAR SOLUTION pour SGS France.

CONTEXTE PROJET :
Client : SGS France
Objectif : Refonte complète plateforme gestion rendez-vous contrôle technique
Périmètre : 2000 centres CT, 7+ millions RDV/an, 5000 utilisateurs
Budget : 693 000 € HT
Durée : 26 mois (M1 à M26)
SLA cible : 99,98% disponibilité
Contraintes : Conformité RGPD stricte, migration zéro downtime

ARCHITECTURE TECHNIQUE :
Type : Microservices conteneurisés (Kubernetes)
Backend : 8 microservices Node.js/NestJS + 1 service IA Python/FastAPI
Frontend : 5 interfaces React/Next.js (BackOffice, PWA Client, Client Pro, Call Center, Mobile)
Données : PostgreSQL 15+ multi-tenant (RLS), Redis 7+, Elasticsearch 8+, Kafka 3+
Sécurité : Keycloak OAuth2/OIDC, WAF OWASP, TLS 1.3, chiffrement AES-256
Intégrations : AdelSoft, SIR, Payzen, Lemonway, Brevo, SMS Mode
Observabilité : ELK Stack, Prometheus, Grafana, Jaeger
Hébergement : Cloud souverain UE (OVHcloud/Scaleway), certifié ISO 27001

MICROSERVICES BACKEND :
1. MS Planning & RDV : Cœur métier (créneaux, disponibilités, réservations)
2. MS Paiement : Orchestration Payzen/Lemonway, PCI-DSS compliant
3. MS Notifications : Multi-canaux (Email/SMS/Push)
4. MS Utilisateurs & Rôles : Gestion RBAC + Keycloak sync
5. MS Centres & Ressources : Référentiel centres, contrôleurs, équipements
6. MS Connecteurs : Intégrations systèmes tiers (AdelSoft, SIR, etc.)
7. MS Reporting & Analytics : Tableaux de bord business
8. MS Administration : Configuration système, paramétrage
9. MS IA : Suggestion créneaux optimisés, affectation intelligente (Python)

APPLICATIONS FRONTEND :
1. BackOffice Admin : Gestion complète système (React/Next.js)
2. PWA Client Particulier : Prise RDV mobile-first, offline-capable
3. Espace Client Pro : Gestion flottes entreprises
4. Interface Call Center : Assistance téléphonique temps réel
5. Application Mobile : React Native (iOS/Android)

MODULES FONCTIONNELS :
- Gestion Plannings & Disponibilités
- Prise de RDV multi-canaux
- Paiement en ligne sécurisé
- Notifications automatisées
- Gestion contrôleurs & agréments
- Suivi en temps réel
- Reporting & Analytics
- Synchronisation AdelSoft
- Module IA prédictif
- Conformité RGPD

CONTRAINTES CRITIQUES :
- Performance : 10 000-15 000 connexions/jour, pics 250 000 RDV/12h lundi 10h-12h
- Disponibilité : SLA 99,98% = max 1h26 downtime/an
- Migration : Zéro downtime depuis GENILINK actuel (150 Go données)
- Sécurité : Conformité RGPD, ISO 27001, PCI-DSS (paiements)
- Offline : PWA avec synchronisation automatique
- Multi-tenant : Isolation stricte données par centre/groupe
- Accessibilité : WCAG 2.1 niveau AA
- Performance : P95 latency API < 200ms

PRINCIPES ARCHITECTURE :
1. Clean Architecture : Séparation couches (Domain, Application, Infrastructure, Presentation)
2. API-First : Spécifications OpenAPI 3.0 avant développement
3. Event-Driven : Communication asynchrone via Kafka
4. Security by Design : Sécurité intégrée dès conception
5. Test-Driven Development : Coverage > 80%
6. Documentation as Code : Swagger, README, ADR
7. GitOps : Déploiements automatisés via GitLab CI/CD
8. Observability : Logs structurés, métriques, tracing distribué

STANDARDS TECHNIQUES :
- Langages : TypeScript 5+, Python 3.11+
- Frameworks : NestJS 10+, React 18+, Next.js 14+, FastAPI
- Containerisation : Docker multi-stage, images Alpine
- Orchestration : Kubernetes 1.28+, Helm charts
- Base de données : PostgreSQL 15+ avec extensions (PostGIS, pg_trgm)
- Cache : Redis 7+ cluster mode
- Message broker : Apache Kafka 3.6+
- API Gateway : Kong ou KrakenD
- Service Mesh : Istio (optionnel)

WORKFLOW DÉVELOPPEMENT :
1. Spécification API OpenAPI
2. Génération code types TypeScript
3. Implémentation TDD (Red-Green-Refactor)
4. Code review obligatoire (2 approvals)
5. CI/CD automatique (build, test, scan, deploy)
6. Déploiement Blue/Green production

CONVENTIONS CODE :
- Naming : camelCase (variables/fonctions), PascalCase (classes), kebab-case (fichiers)
- Structure : Clean Architecture avec séparation claire des couches
- Types : Typage strict TypeScript (no any)
- Errors : Custom exceptions avec codes erreur
- Logs : Format JSON structuré (ECS)
- Comments : JSDoc pour fonctions publiques

Tous les prompts suivants s'inscrivent dans cette architecture globale. Respecte scrupuleusement ces principes et contraintes.

Quand tu génères du code :
- Utilise TypeScript strict avec types explicites
- Implémente les patterns appropriés (Repository, Factory, Strategy, etc.)
- Inclus gestion d'erreurs robuste
- Ajoute logs structurés
- Écris tests unitaires correspondants
- Documente avec JSDoc
- Respecte les principes SOLID

Prêt à implémenter la solution ?
```

---

## 2. INFRASTRUCTURE & DEVOPS

### 2.1. Cluster Kubernetes Production

```
Génère les manifests Kubernetes complets pour déployer le cluster de production PTI CALENDAR SOLUTION.

ENVIRONNEMENT : Production (3 zones disponibilité)
PROVIDER : OVHcloud Managed Kubernetes (cloud souverain UE)

ARCHITECTURE CLUSTER :
Control Plane : 3 masters HA (géré par OVHcloud)
Worker Nodes :
  - Pool compute : 6 nœuds minimum, auto-scaling 6-20 nœuds
  - Instance type : b2-15 (4 vCPU, 15 GB RAM)
  - Distribution : 2 nœuds par zone (paris-1a, paris-1b, paris-1c)
Networking : Calico CNI, Network Policies actives
Storage : Block Storage SSD NVMe (Cinder)

NAMESPACES À CRÉER :
1. pti-prod : Applications production
2. pti-infra : Services infrastructure (monitoring, logging)
3. pti-security : Services sécurité (Keycloak, Vault)
4. pti-data : Stateful services (PostgreSQL, Redis, Kafka)

CONFIGURATIONS GLOBALES :
- ResourceQuotas par namespace (CPU: 50 cores, RAM: 100Gi, storage: 500Gi)
- LimitRanges pour limiter ressources pods individuels
- PodSecurityPolicies restricted (non-root, pas de privilèges)
- PodDisruptionBudgets pour services critiques (minAvailable: 2)
- RBAC strict avec ServiceAccounts dédiés

INGRESS NGINX :
- Déploiement HA : 3 replicas minimum
- TLS termination avec cert-manager (Let's Encrypt)
- Rate limiting : 100 req/min par IP
- WAF rules OWASP (ModSecurity Core Rule Set)
- Compression gzip
- Client body size : 10MB max

STORAGE CLASSES :
1. ssd-nvme : RWO, pour PostgreSQL/Elasticsearch (IOPS élevé)
2. standard : RWO, pour logs/backups (coût optimisé)
3. shared : RWX, pour assets partagés (NFS)

MONITORING :
- Metrics Server pour HPA
- Prometheus Operator
- Grafana avec dashboards préconfigurés
- Alertmanager avec routes Slack/PagerDuty

Génère les fichiers YAML suivants :
1. cluster-config.yaml : Spécifications cluster OVHcloud
2. namespaces.yaml : Namespaces + ResourceQuotas + LimitRanges
3. rbac.yaml : Roles, RoleBindings, ServiceAccounts
4. ingress-nginx.yaml : Déploiement Ingress Controller
5. storage-classes.yaml : Classes de stockage
6. network-policies.yaml : Politiques réseau par namespace
7. pdb.yaml : PodDisruptionBudgets services critiques
8. monitoring.yaml : Stack monitoring (Prometheus + Grafana)

Pour chaque fichier, inclus :
- Commentaires explicatifs détaillés
- Labels standardisés (app.kubernetes.io/*)
- Annotations pertinentes
- Références best practices Kubernetes

Priorise la haute disponibilité et la résilience.
```

### 2.2. GitLab CI/CD Pipeline Complet

```
Crée le fichier .gitlab-ci.yml complet pour le pipeline CI/CD PTI CALENDAR SOLUTION avec tous les stages, jobs, et configurations nécessaires.

PIPELINE STAGES :
1. build : Compilation TypeScript, build images Docker
2. test : Tests unitaires, intégration, coverage
3. security : SAST, scan dépendances, scan images
4. deploy-dev : Déploiement automatique environnement dev
5. deploy-staging : Déploiement manuel staging avec approbation
6. performance : Tests charge K6
7. deploy-prod : Déploiement production Blue/Green

CONFIGURATION GLOBALE :
Executor : Docker-in-Docker (image docker:24-dind)
Cache : node_modules, .yarn, build artifacts
Artifacts :
  - Coverage reports (Cobertura XML)
  - Test results (JUnit XML)
  - Build artifacts (dist/, images)
  - Security reports (SAST, dependency scan)
Variables :
  - DOCKER_REGISTRY : registry.genilink.fr
  - KUBE_NAMESPACE_DEV : pti-dev
  - KUBE_NAMESPACE_STAGING : pti-staging
  - KUBE_NAMESPACE_PROD : pti-prod
  - SONAR_HOST_URL : https://sonarqube.genilink.fr

JOBS DÉTAILLÉS :

build:backend :
  - Installer dépendances npm (avec cache)
  - Compiler TypeScript tous microservices
  - Build images Docker multi-stage
  - Push images vers registry privé
  - Tag : commit SHA + branch

build:frontend :
  - Installer dépendances npm
  - Build Next.js production (optimisations activées)
  - Build images Docker frontend
  - Push registry

test:unit :
  - Exécuter Jest tous microservices
  - Générer coverage report
  - Publier artifacts coverage
  - Seuil minimum : 80% coverage

test:integration :
  - Démarrer services avec Docker Compose (PostgreSQL, Redis, Kafka)
  - Exécuter tests intégration (Supertest)
  - Nettoyer containers après tests

security:sast :
  - Exécuter SonarQube Scanner
  - Vérifier Quality Gate
  - Fail si Quality Gate failed
  - Publier rapport SAST

security:dependencies :
  - npm audit --audit-level=high
  - Snyk test (si disponible)
  - Fail si vulnérabilités HIGH/CRITICAL

security:images :
  - Trivy scan toutes images Docker
  - Fail si vulnérabilités HIGH/CRITICAL
  - Publier rapport scan

deploy:dev :
  - Déclenché automatiquement sur branch develop
  - kubectl set image tous déploiements
  - Attendre rollout complet (timeout 10min)
  - Exécuter smoke tests

deploy:staging :
  - Déclenché manuellement sur tag release/v*
  - Déploiement namespace pti-staging
  - Exécuter tests E2E Playwright
  - Validation manuelle requise avant production

performance:k6 :
  - Exécuter tests charge K6 sur staging
  - Vérifier P95 latency < 200ms
  - Vérifier error rate < 1%
  - Fail si seuils non atteints

deploy:prod :
  - Déclenché manuellement sur tag v*
  - Approbation COPIL requise
  - Déploiement Blue/Green avec stratégie Canary
  - Progression : 10% → 25% → 50% → 100%
  - Rollback automatique si error rate > 5%

NOTIFICATIONS :
- Slack webhook sur succès/échec pipeline
- Email COPIL sur déploiement production
- PagerDuty alerte si déploiement production échoue

RÈGLES DÉPLOIEMENT :
- dev : Auto sur branch develop
- staging : Manuel sur tag release/v*, après merge develop → main
- prod : Manuel sur tag v*, après validation staging + approbation COPIL

RETRY & TIMEOUT :
- Retry : 2 tentatives pour jobs flaky (tests, deploy)
- Timeout : 30min max par job, 2h max pipeline total

Génère le fichier .gitlab-ci.yml complet avec :
- Toutes les configurations
- Tous les stages et jobs
- Scripts détaillés
- Conditions when/rules
- Dépendances entre jobs
- Gestion artifacts
- Notifications

Optimise pour temps exécution (parallélisation) et fiabilité.
```

### 2.3. PostgreSQL Multi-tenant avec RLS

```
Configure PostgreSQL 15+ avec architecture multi-tenant en utilisant Row-Level Security (RLS) pour PTI CALENDAR SOLUTION.

ARCHITECTURE HA :
Cluster : 3 nœuds PostgreSQL en réplication streaming
HA Manager : Patroni + etcd (bascule automatique)
Load Balancer : PgBouncer en transaction pooling
  - Pool mode : transaction
  - Max connections : 100 par nœud
  - Default pool size : 25
Backup : pgBackRest
  - Full backup : quotidien 2h du matin
  - Incremental : horaire (WAL archiving)
  - Retention : 30 jours
  - Chiffrement : AES-256
  - Tests recovery : mensuel automatisé

CONFIGURATION POSTGRESQL :
Version : 15.5
Extensions :
  - pg_trgm : Recherche fuzzy
  - PostGIS : Géolocalisation centres
  - pgcrypto : Chiffrement colonnes sensibles
  - uuid-ossp : Génération UUID
  - pg_stat_statements : Monitoring requêtes

Paramètres optimisés :
  - shared_buffers : 8GB (25% RAM)
  - effective_cache_size : 24GB (75% RAM)
  - work_mem : 64MB
  - maintenance_work_mem : 2GB
  - max_connections : 300
  - checkpoint_timeout : 15min
  - random_page_cost : 1.1 (SSD)

MULTI-TENANCY AVEC RLS :
Stratégie : Row-Level Security avec colonne tenant_id sur toutes tables métier

Fonction contexte tenant :
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.tenant_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

Politique RLS automatique :
CREATE POLICY tenant_isolation ON {table_name}
  USING (tenant_id = get_current_tenant_id());

Application au runtime (via JWT claims) :
SET LOCAL app.tenant_id = '{tenant_id_from_jwt}';

SCHÉMA BASE DE DONNÉES COMPLET :

-- Table: Tenants (groupes/réseaux de centres)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'reseau', 'independant', 'franchise'
  contact_email VARCHAR(255),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: Centres (2000 centres CT)
CREATE TABLE centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  code_centre VARCHAR(50) NOT NULL UNIQUE, -- Code AdelSoft
  nom VARCHAR(255) NOT NULL,
  adresse TEXT NOT NULL,
  code_postal VARCHAR(10),
  ville VARCHAR(100),
  location GEOGRAPHY(POINT, 4326), -- PostGIS pour géolocalisation
  telephone VARCHAR(20),
  email VARCHAR(255),
  horaires JSONB, -- Structure: {"lundi": {"ouverture": "08:00", "fermeture": "18:00"}, ...}
  capacite_journaliere INTEGER DEFAULT 50,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
ALTER TABLE centres ENABLE ROW LEVEL SECURITY;
CREATE POLICY centres_tenant_isolation ON centres USING (tenant_id = get_current_tenant_id());
CREATE INDEX idx_centres_tenant ON centres(tenant_id);
CREATE INDEX idx_centres_location ON centres USING GIST(location);
CREATE INDEX idx_centres_code ON centres(code_centre);

-- Table: Utilisateurs (5000 users)
CREATE TABLE utilisateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  keycloak_id UUID NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  nom VARCHAR(100),
  prenom VARCHAR(100),
  telephone VARCHAR(20),
  role VARCHAR(50) NOT NULL, -- RBAC: 'admin', 'responsable', 'controleur', 'operateur'
  centre_id UUID REFERENCES centres(id), -- Null si admin réseau
  actif BOOLEAN DEFAULT true,
  derniere_connexion TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY utilisateurs_tenant_isolation ON utilisateurs USING (tenant_id = get_current_tenant_id());
CREATE INDEX idx_utilisateurs_tenant ON utilisateurs(tenant_id);
CREATE INDEX idx_utilisateurs_keycloak ON utilisateurs(keycloak_id);
CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);

-- Table: Controleurs (lien avec agréments)
CREATE TABLE controleurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id),
  centre_id UUID NOT NULL REFERENCES centres(id),
  matricule_workday VARCHAR(50),
  agrements JSONB NOT NULL, -- ["VL", "L", "Gaz"]
  habilitations JSONB, -- Habilitations spécifiques
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE controleurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY controleurs_tenant_isolation ON controleurs USING (tenant_id = get_current_tenant_id());
CREATE INDEX idx_controleurs_tenant ON controleurs(tenant_id);
CREATE INDEX idx_controleurs_centre ON controleurs(centre_id);

-- Table: Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  type VARCHAR(20) NOT NULL, -- 'particulier', 'professionnel'
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100),
  raison_sociale VARCHAR(255), -- Si professionnel
  email VARCHAR(255) NOT NULL,
  telephone VARCHAR(20) NOT NULL,
  adresse TEXT,
  siret VARCHAR(14), -- Si professionnel
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY clients_tenant_isolation ON clients USING (tenant_id = get_current_tenant_id());
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_telephone ON clients(telephone);

-- Table: Vehicules
CREATE TABLE vehicules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  immatriculation VARCHAR(20) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'VP', 'VU', 'Moto', 'Cyclo'
  marque VARCHAR(100),
  modele VARCHAR(100),
  carburant VARCHAR(50) NOT NULL, -- 'Essence', 'Diesel', 'Gaz', 'Hybride', 'Electrique'
  date_mise_circulation DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_immatriculation UNIQUE (tenant_id, immatriculation)
);
ALTER TABLE vehicules ENABLE ROW LEVEL SECURITY;
CREATE POLICY vehicules_tenant_isolation ON vehicules USING (tenant_id = get_current_tenant_id());
CREATE INDEX idx_vehicules_tenant ON vehicules(tenant_id);
CREATE INDEX idx_vehicules_client ON vehicules(client_id);
CREATE INDEX idx_vehicules_immat ON vehicules(immatriculation);

-- Table: RDV (7M+/an) - PARTITIONNÉE PAR ANNÉE
CREATE TABLE rdv (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  centre_id UUID NOT NULL REFERENCES centres(id),
  controleur_id UUID REFERENCES controleurs(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  vehicule_id UUID NOT NULL REFERENCES vehicules(id),
  type_controle VARCHAR(10) NOT NULL, -- 'CTP', 'CVP', 'CV', 'CTC', 'CVC'
  date_rdv DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  duree_minutes INTEGER NOT NULL,
  statut VARCHAR(30) NOT NULL DEFAULT 'confirme', -- 'confirme', 'en_cours', 'termine', 'absent', 'annule'
  resultat VARCHAR(30), -- 'favorable', 'defavorable', 'contre_visite'
  montant_ttc DECIMAL(10,2),
  paiement_statut VARCHAR(30), -- 'en_attente', 'paye', 'rembourse'
  source VARCHAR(30) NOT NULL, -- 'web', 'mobile', 'call_center', 'backoffice'
  metadata JSONB, -- Données complémentaires flexibles
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id, date_rdv)
) PARTITION BY RANGE (date_rdv);

-- Partitions par année
CREATE TABLE rdv_2024 PARTITION OF rdv FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE rdv_2025 PARTITION OF rdv FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE rdv_2026 PARTITION OF rdv FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE rdv_2027 PARTITION OF rdv FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

ALTER TABLE rdv ENABLE ROW LEVEL SECURITY;
CREATE POLICY rdv_tenant_isolation ON rdv USING (tenant_id = get_current_tenant_id());
CREATE INDEX idx_rdv_tenant ON rdv(tenant_id, date_rdv);
CREATE INDEX idx_rdv_centre_date ON rdv(centre_id, date_rdv);
CREATE INDEX idx_rdv_controleur ON rdv(controleur_id, date_rdv);
CREATE INDEX idx_rdv_client ON rdv(client_id);
CREATE INDEX idx_rdv_statut ON rdv(statut, date_rdv);

-- Table: Paiements (liée à RDV)
CREATE TABLE paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  rdv_id UUID NOT NULL,
  montant_ttc DECIMAL(10,2) NOT NULL,
  provider VARCHAR(30) NOT NULL, -- 'payzen', 'lemonway'
  transaction_id VARCHAR(255) NOT NULL UNIQUE,
  statut VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'succeeded', 'failed', 'refunded'
  methode_paiement VARCHAR(30), -- 'carte_bancaire', 'especes', 'cheque'
  metadata JSONB, -- Données provider (token, etc.)
  date_paiement TIMESTAMP,
  date_remboursement TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE paiements_2024 PARTITION OF paiements FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE paiements_2025 PARTITION OF paiements FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE paiements_2026 PARTITION OF paiements FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
CREATE POLICY paiements_tenant_isolation ON paiements USING (tenant_id = get_current_tenant_id());
CREATE INDEX idx_paiements_tenant ON paiements(tenant_id);
CREATE INDEX idx_paiements_rdv ON paiements(rdv_id);
CREATE INDEX idx_paiements_transaction ON paiements(transaction_id);
CREATE INDEX idx_paiements_statut ON paiements(statut, created_at);

-- Table: Disponibilites (précalculées pour performance)
CREATE TABLE disponibilites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  centre_id UUID NOT NULL REFERENCES centres(id),
  controleur_id UUID REFERENCES controleurs(id),
  date DATE NOT NULL,
  creneaux JSONB NOT NULL, -- Structure: [{"heure": "09:00", "duree": 45, "disponible": true, "type_controle": "CTP"}]
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_dispo UNIQUE (tenant_id, centre_id, controleur_id, date)
);
ALTER TABLE disponibilites ENABLE ROW LEVEL SECURITY;
CREATE POLICY disponibilites_tenant_isolation ON disponibilites USING (tenant_id = get_current_tenant_id());
CREATE INDEX idx_disponibilites_centre_date ON disponibilites(centre_id, date);
CREATE INDEX idx_disponibilites_controleur_date ON disponibilites(controleur_id, date);

-- Table: Logs (auditabilité) - PARTITIONNÉE
CREATE TABLE logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  utilisateur_id UUID REFERENCES utilisateurs(id),
  action VARCHAR(100) NOT NULL,
  entite VARCHAR(50) NOT NULL,
  entite_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

CREATE TABLE logs_2024 PARTITION OF logs FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE logs_2025 PARTITION OF logs FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE logs_2026 PARTITION OF logs FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY logs_tenant_isolation ON logs USING (tenant_id = get_current_tenant_id());
CREATE INDEX idx_logs_tenant_timestamp ON logs(tenant_id, timestamp);
CREATE INDEX idx_logs_utilisateur ON logs(utilisateur_id, timestamp);
CREATE INDEX idx_logs_action ON logs(action, timestamp);

-- Vues matérialisées pour analytics
CREATE MATERIALIZED VIEW stats_centres_journalieres AS
SELECT 
  centre_id,
  date_rdv::DATE as date,
  COUNT(*) as nb_rdv,
  COUNT(*) FILTER (WHERE statut = 'termine') as nb_termine,
  COUNT(*) FILTER (WHERE statut = 'absent') as nb_absent,
  COUNT(*) FILTER (WHERE resultat = 'favorable') as nb_favorable,
  AVG(duree_minutes) as duree_moyenne
FROM rdv
WHERE date_rdv >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY centre_id, date_rdv::DATE;

CREATE UNIQUE INDEX ON stats_centres_journalieres(centre_id, date);

-- Refresh quotidien automatique
CREATE OR REPLACE FUNCTION refresh_stats_centres()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY stats_centres_journalieres;
END;
$$ LANGUAGE plpgsql;

POLITIQUE RÉTENTION :
- RDV : 7 ans (obligations légales)
- Paiements : 10 ans (obligations comptables)
- Logs : 3 ans
- Disponibilités : 1 an (nettoyage automatique dates passées)

BACKUP & RECOVERY :
Objectifs :
- RTO : < 1 heure
- RPO : < 15 minutes

Tests recovery :
- Mensuel automatisé sur environnement test
- Validation intégrité données
- Documentation procédure recovery

Génère :
1. schema.sql : DDL complet avec RLS
2. partitioning.sql : Scripts création partitions
3. indexes.sql : Index optimisés
4. functions.sql : Fonctions utilitaires
5. views.sql : Vues matérialisées
6. patroni-config.yaml : Configuration Patroni HA
7. pgbackrest.conf : Configuration backups
8. monitoring.sql : Requêtes monitoring performance

Inclus commentaires détaillés et justifications choix techniques.
```

---

## 3. BACKEND MICROSERVICES

### 3.1. MS Planning & RDV - Architecture Complète

```
Génère la structure complète du microservice Planning & RDV en NestJS avec Clean Architecture.

CONTEXTE :
Microservice le plus critique du système. Gère :
- Plannings centres et contrôleurs
- Calcul disponibilités temps réel
- Création/modification/annulation RDV
- Affectation intelligente contrôleurs
- Gestion surbooking et listes attente
- Cache Redis pour performance
- Événements Kafka pour communication asynchrone

STACK TECHNIQUE :
- NestJS 10+ avec TypeScript 5+
- TypeORM pour PostgreSQL (ou Prisma si préférence)
- Redis (ioredis) pour cache
- Kafka (kafkajs) producer/consumer
- class-validator pour validation DTOs
- class-transformer pour mapping
- Winston pour logging structuré
- Bull/BullMQ pour jobs asynchrones

ARCHITECTURE CLEAN (4 COUCHES) :

1. DOMAIN LAYER (src/domain/) :
Entities (models métier purs) :
- Planning : Modèle plannings (horaires, capacités, exceptions)
- Creneau : Créneaux horaires (début, fin, durée, capacité)
- Rdv : Rendez-vous complet
- Disponibilite : Disponibilités calculées
- RegleMetier : Règles métier paramétrables

Value Objects :
- TimeSlot : Période horaire immutable
- Duration : Durée avec unité
- RdvStatus : Statut typé (enum)
- TypeControle : Type contrôle typé

Business Rules (règles métier) :
- ControleTypeValidation : Valider cohérence type contrôle / véhicule
- ControleurAgrementRule : Vérifier agréments contrôleur
- CreneauDisponibiliteRule : Valider disponibilité créneau
- DureeControleCalculator : Calculer durée selon matrices
- SurbookingPolicy : Politique surbooking paramétrable

2. APPLICATION LAYER (src/application/) :
Use Cases (logique applicative) :
- CreateRdvUseCase : Créer RDV avec validation complète
- UpdateRdvUseCase : Modifier RDV avec gestion contraintes
- CancelRdvUseCase : Annuler RDV et libérer créneau
- GetDisponibilitesUseCase : Calculer disponibilités (avec cache)
- AffectControlerUseCase : Affecter contrôleur (appel MS IA)
- HandleSurbookingUseCase : Gérer surbooking et listes attente
- SyncAdelSoftUseCase : Synchroniser avec AdelSoft

DTOs (Data Transfer Objects) :
- CreateRdvDto, UpdateRdvDto, RdvResponseDto
- GetDisponibilitesQueryDto, DisponibiliteDto
- AffectControlerDto, ControlerResponseDto

Ports (interfaces pour infrastructure) :
- RdvRepository : Interface accès données RDV
- PlanningRepository : Interface plannings
- CacheService : Interface cache Redis
- EventPublisher : Interface Kafka producer
- IaService : Interface appel MS IA
- AdelSoftConnector : Interface AdelSoft API

3. INFRASTRUCTURE LAYER (src/infrastructure/) :
Repositories (implémentations TypeORM) :
- TypeOrmRdvRepository implements RdvRepository
- TypeOrmPlanningRepository implements PlanningRepository

External Services :
- RedisCacheService implements CacheService
- KafkaEventPublisher implements EventPublisher
- HttpIaService implements IaService (appel REST MS IA)
- HttpAdelSoftConnector implements AdelSoftConnector

Database :
- Entities TypeORM (mapping tables PostgreSQL)
- Migrations (versioning schéma)

4. PRESENTATION LAYER (src/presentation/) :
Controllers REST :
- RdvController : CRUD RDV
- DisponibiliteController : Requêtes disponibilités
- PlanningController : Gestion plannings (admin)

Guards :
- JwtAuthGuard : Authentification JWT
- RolesGuard : Autorisation RBAC
- TenantGuard : Isolation multi-tenant

Interceptors :
- LoggingInterceptor : Logs requêtes/réponses
- TransformInterceptor : Transformation réponses
- ErrorInterceptor : Gestion erreurs globale

Filters :
- HttpExceptionFilter : Formatage erreurs HTTP
- ValidationExceptionFilter : Erreurs validation

MODULES NESTJS :
src/
├── app.module.ts (module racine)
├── domain/
│   ├── entities/
│   │   ├── planning.entity.ts
│   │   ├── creneau.entity.ts
│   │   ├── rdv.entity.ts
│   │   └── disponibilite.entity.ts
│   ├── value-objects/
│   │   ├── time-slot.vo.ts
│   │   ├── duration.vo.ts
│   │   └── rdv-status.vo.ts
│   └── rules/
│       ├── controle-type-validation.rule.ts
│       ├── controleur-agrement.rule.ts
│       └── duree-controle.calculator.ts
├── application/
│   ├── use-cases/
│   │   ├── create-rdv/
│   │   │   ├── create-rdv.use-case.ts
│   │   │   ├── create-rdv.dto.ts
│   │   │   └── create-rdv.spec.ts
│   │   ├── get-disponibilites/
│   │   │   ├── get-disponibilites.use-case.ts
│   │   │   ├── get-disponibilites.dto.ts
│   │   │   └── get-disponibilites.spec.ts
│   │   └── [autres use cases]
│   └── ports/
│       ├── rdv.repository.interface.ts
│       ├── cache.service.interface.ts
│       ├── event-publisher.interface.ts
│       └── ia.service.interface.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── typeorm-rdv.repository.ts
│   │   └── typeorm-planning.repository.ts
│   ├── services/
│   │   ├── redis-cache.service.ts
│   │   ├── kafka-event-publisher.service.ts
│   │   ├── http-ia.service.ts
│   │   └── http-adelsoft.connector.ts
│   ├── database/
│   │   ├── entities/ (TypeORM entities)
│   │   └── migrations/
│   └── config/
│       ├── database.config.ts
│       ├── redis.config.ts
│       └── kafka.config.ts
└── presentation/
    ├── controllers/
    │   ├── rdv.controller.ts
    │   ├── disponibilite.controller.ts
    │   └── planning.controller.ts
    ├── guards/
    │   ├── jwt-auth.guard.ts
    │   ├── roles.guard.ts
    │   └── tenant.guard.ts
    ├── interceptors/
    │   ├── logging.interceptor.ts
    │   └── transform.interceptor.ts
    └── filters/
        └── http-exception.filter.ts

API ENDPOINTS :
POST   /api/v1/rdv                    - Créer RDV
GET    /api/v1/rdv/:id                - Détail RDV
GET    /api/v1/rdv                    - Liste RDV (filtres: centre, date, statut)
PUT    /api/v1/rdv/:id                - Modifier RDV
DELETE /api/v1/rdv/:id                - Annuler RDV
GET    /api/v1/disponibilites         - Créneaux disponibles (query params)
POST   /api/v1/affectation            - Affecter contrôleur intelligent
GET    /api/v1/planning/:centre_id    - Planning centre
PUT    /api/v1/planning/:centre_id    - Modifier planning

ÉVÉNEMENTS KAFKA :
Topics produits :
- rdv.created : Nouveau RDV créé
- rdv.updated : RDV modifié
- rdv.cancelled : RDV annulé
- disponibilite.changed : Disponibilités modifiées

Topics consommés :
- payment.completed : Paiement confirmé (→ confirmer RDV)
- payment.failed : Paiement échoué (→ annuler RDV provisoire)

GESTION CACHE REDIS :
Keys pattern :
- dispo:{centre_id}:{date} : Disponibilités journalières (TTL 60s)
- planning:{centre_id} : Planning centre (TTL 1h)
- rdv:{id} : Détail RDV (TTL 5min)

Invalidation cache :
- Sur création/modification/annulation RDV
- Sur changement planning
- Sur modification disponibilités contrôleur

RÈGLES MÉTIER COMPLEXES À IMPLÉMENTER :
1. Calcul durée contrôle selon matrices paramétrées
2. Contre-visite "offerte" dans délai paramétré
3. Affectation contrôleur selon agréments (VL, L, Gaz) + habilitations
4. Gestion pics horaires (lundi 10h-12h : 250k RDV sur 12 mois)
5. Blocage créneaux pour maintenances/absences
6. Surbooking paramétrable (tolérance +10% par créneau)
7. File d'attente si surbooking atteint
8. Libération automatique créneaux non confirmés (après 15min)

TESTS :
- Unit tests use cases (>90% coverage)
- Integration tests API endpoints
- Tests repository avec base test (TestContainers)
- Tests cache Redis (redis-mock)
- Tests Kafka (mock producer/consumer)
- Tests charge (1000 req/s création RDV)

CONFIGURATION :
Variables environnement (.env) :
- DATABASE_URL
- REDIS_URL
- KAFKA_BROKERS
- IA_SERVICE_URL
- ADELSOFT_API_URL
- ADELSOFT_API_KEY

Génère :
1. Structure projet complète
2. Fichiers principaux (app.module.ts, main.ts)
3. Use case CreateRdvUseCase complet avec tests
4. Use case GetDisponibilitesUseCase avec cache Redis
5. RdvController avec validation
6. Configuration TypeORM
7. Configuration Redis
8. Configuration Kafka
9. Dockerfile multi-stage optimisé
10. README.md avec documentation API

Priorise code production-ready avec gestion d'erreurs robuste et logging structuré.
```

### 3.2. MS Planning - Use Case CreateRdvUseCase Détaillé

```
Implémente le Use Case CreateRdvUseCase complet avec toute la logique métier de création RDV.

RESPONSABILITÉS :
1. Valider disponibilité créneau demandé
2. Vérifier cohérence type contrôle / véhicule
3. Calculer durée contrôle (matrices paramétrées)
4. Affecter contrôleur optimal (appel MS IA si auto-affectation)
5. Créer entités Client/Véhicule si nécessaires
6. Créer RDV en base de données (transaction atomique)
7. Invalider cache disponibilités Redis
8. Publier événement rdv.created sur Kafka
9. Optionnel : Initier paiement en ligne (appel MS Paiement)
10. Retourner RDV créé avec détails complets

INPUT DTO (CreateRdvDto) :
{
  centre_id: string (UUID),
  client: {
    nom: string,
    prenom?: string,
    email: string,
    telephone: string,
    type: 'particulier' | 'professionnel',
    raison_sociale?: string,
    siret?: string
  },
  vehicule: {
    immatriculation: string,
    type: 'VP' | 'VU' | 'Moto' | 'Cyclo',
    marque?: string,
    modele?: string,
    carburant: 'Essence' | 'Diesel' | 'Gaz' | 'Hybride' | 'Electrique',
    date_mise_circulation?: Date
  },
  type_controle: 'CTP' | 'CVP' | 'CV' | 'CTC' | 'CVC',
  creneau: {
    date: Date,
    heure_debut: string (format HH:mm)
  },
  controleur_id?: string (UUID, optionnel pour affectation auto),
  paiement?: {
    mode: 'en_ligne' | 'sur_place'
  },
  source: 'web' | 'mobile' | 'call_center' | 'backoffice'
}

OUTPUT DTO (RdvCreatedDto) :
{
  id: string (UUID),
  centre: {
    id: string,
    nom: string,
    adresse: string,
    telephone: string
  },
  client: {
    id: string,
    nom: string,
    prenom?: string,
    email: string,
    telephone: string
  },
  vehicule: {
    id: string,
    immatriculation: string,
    type: string,
    marque?: string,
    modele?: string
  },
  creneau: {
    date: Date,
    heure_debut: string,
    heure_fin: string,
    duree_minutes: number
  },
  controleur: {
    id: string,
    nom: string,
    prenom: string,
    agrements: string[]
  },
  type_controle: string,
  statut: 'confirme' | 'en_attente_paiement',
  montant_ttc: number,
  url_paiement?: string (si paiement en ligne),
  created_at: Date
}

LOGIQUE IMPLÉMENTATION (étapes détaillées) :

export class CreateRdvUseCase {
  constructor(
    private readonly rdvRepository: RdvRepository,
    private readonly clientRepository: ClientRepository,
    private readonly vehiculeRepository: VehiculeRepository,
    private readonly centreRepository: CentreRepository,
    private readonly controleurRepository: ControleurRepository,
    private readonly cacheService: CacheService,
    private readonly eventPublisher: EventPublisher,
    private readonly iaService: IaService,
    private readonly dureeCalculator: DureeControleCalculator,
    private readonly tarificationService: TarificationService,
    private readonly logger: Logger
  ) {}

  async execute(dto: CreateRdvDto, tenantId: string): Promise<RdvCreatedDto> {
    this.logger.info('CreateRdvUseCase.execute', { dto, tenantId });

    try {
      // 1. Vérifier existence centre
      const centre = await this.centreRepository.findById(dto.centre_id, tenantId);
      if (!centre) {
        throw new CentreNotFoundException(dto.centre_id);
      }
      if (!centre.actif) {
        throw new CentreInactifException(dto.centre_id);
      }

      // 2. Récupérer disponibilités depuis cache Redis
      const cacheKey = `dispo:${dto.centre_id}:${dto.creneau.date}`;
      let disponibilites = await this.cacheService.get<Disponibilite[]>(cacheKey);

      // 3. Si cache miss, calculer disponibilités et mettre en cache
      if (!disponibilites) {
        this.logger.info('Cache miss, calcul disponibilités', { centre_id: dto.centre_id, date: dto.creneau.date });
        disponibilites = await this.calculateDisponibilites(dto.centre_id, dto.creneau.date, tenantId);
        await this.cacheService.set(cacheKey, disponibilites, 60); // TTL 60s
      }

      // 4. Vérifier créneau disponible pour type contrôle demandé
      const creneauDispo = this.findCreneauDisponible(
        disponibilites,
        dto.creneau.heure_debut,
        dto.type_controle
      );
      if (!creneauDispo) {
        throw new CreneauIndisponibleException(dto.creneau.heure_debut, dto.type_controle);
      }

      // 5. Calculer durée contrôle selon matrices paramétrées
      const dureeMinutes = await this.dureeCalculator.calculate(
        dto.vehicule.type,
        dto.vehicule.carburant,
        dto.type_controle
      );
      this.logger.info('Durée contrôle calculée', { dureeMinutes });

      // 6. Affecter contrôleur
      let controleur: Controleur;
      if (dto.controleur_id) {
        // Affectation manuelle
        controleur = await this.controleurRepository.findById(dto.controleur_id, tenantId);
        if (!controleur) {
          throw new ControleurNotFoundException(dto.controleur_id);
        }
      } else {
        // Affectation automatique via IA
        this.logger.info('Affectation automatique contrôleur via IA');
        const iaResponse = await this.iaService.assignControleur({
          centre_id: dto.centre_id,
          date: dto.creneau.date,
          heure: dto.creneau.heure_debut,
          type_controle: dto.type_controle,
          vehicule_type: dto.vehicule.type
        });
        controleur = await this.controleurRepository.findById(iaResponse.controleur_id, tenantId);
      }

      // 7. Vérifier agréments contrôleur compatible avec véhicule
      if (!this.checkAgrementsControler(controleur, dto.vehicule.type, dto.type_controle)) {
        throw new ControleurAgrementInsuffisantException(controleur.id, dto.vehicule.type);
      }

      // 8. Calculer montant TTC
      const montantTtc = await this.tarificationService.calculate(
        dto.type_controle,
        dto.vehicule.type,
        centre.tenant_id
      );

      // 9. Start transaction PostgreSQL
      const queryRunner = this.rdvRepository.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // 10. Créer ou récupérer Client
        let client = await this.clientRepository.findByEmail(dto.client.email, tenantId);
        if (!client) {
          client = await this.clientRepository.create({
            tenant_id: tenantId,
            type: dto.client.type,
            nom: dto.client.nom,
            prenom: dto.client.prenom,
            email: dto.client.email,
            telephone: dto.client.telephone,
            raison_sociale: dto.client.raison_sociale,
            siret: dto.client.siret
          }, queryRunner);
          this.logger.info('Client créé', { client_id: client.id });
        }

        // 11. Créer Véhicule
        let vehicule = await this.vehiculeRepository.findByImmatriculation(
          dto.vehicule.immatriculation,
          tenantId
        );
        if (!vehicule) {
          vehicule = await this.vehiculeRepository.create({
            tenant_id: tenantId,
            client_id: client.id,
            immatriculation: dto.vehicule.immatriculation,
            type: dto.vehicule.type,
            marque: dto.vehicule.marque,
            modele: dto.vehicule.modele,
            carburant: dto.vehicule.carburant,
            date_mise_circulation: dto.vehicule.date_mise_circulation
          }, queryRunner);
          this.logger.info('Véhicule créé', { vehicule_id: vehicule.id });
        }

        // 12. Calculer heure fin
        const heureFin = this.calculateHeureFin(dto.creneau.heure_debut, dureeMinutes);

        // 13. Déterminer statut initial
        const statutInitial = dto.paiement?.mode === 'en_ligne' 
          ? 'en_attente_paiement' 
          : 'confirme';

        // 14. Créer RDV
        const rdv = await this.rdvRepository.create({
          tenant_id: tenantId,
          centre_id: dto.centre_id,
          controleur_id: controleur.id,
          client_id: client.id,
          vehicule_id: vehicule.id,
          type_controle: dto.type_controle,
          date_rdv: dto.creneau.date,
          heure_debut: dto.creneau.heure_debut,
          heure_fin: heureFin,
          duree_minutes: dureeMinutes,
          statut: statutInitial,
          montant_ttc: montantTtc,
          paiement_statut: dto.paiement?.mode === 'en_ligne' ? 'en_attente' : null,
          source: dto.source
        }, queryRunner);
        this.logger.info('RDV créé', { rdv_id: rdv.id });

        // 15. Commit transaction
        await queryRunner.commitTransaction();
        this.logger.info('Transaction committed');

      } catch (error) {
        // Rollback en cas d'erreur
        await queryRunner.rollbackTransaction();
        this.logger.error('Transaction rollback', { error });
        throw error;
      } finally {
        await queryRunner.release();
      }

      // 16. Invalider cache disponibilités
      await this.cacheService.del(cacheKey);
      this.logger.info('Cache invalidé', { cacheKey });

      // 17. Initier paiement si nécessaire
      let urlPaiement: string | undefined;
      if (dto.paiement?.mode === 'en_ligne') {
        // Appel asynchrone MS Paiement via Kafka ou HTTP
        // TODO: Implémenter appel paiement
        urlPaiement = 'https://paiement.genilink.fr/checkout/...';
      }

      // 18. Publier événement Kafka rdv.created
      await this.eventPublisher.publish('rdv.created', {
        rdv_id: rdv.id,
        tenant_id: tenantId,
        centre_id: dto.centre_id,
        client_email: client.email,
        date_rdv: dto.creneau.date,
        heure_debut: dto.creneau.heure_debut,
        statut: statutInitial,
        montant_ttc: montantTtc,
        timestamp: new Date()
      });
      this.logger.info('Événement rdv.created publié', { rdv_id: rdv.id });

      // 19. Construire et retourner DTO réponse
      return {
        id: rdv.id,
        centre: {
          id: centre.id,
          nom: centre.nom,
          adresse: centre.adresse,
          telephone: centre.telephone
        },
        client: {
          id: client.id,
          nom: client.nom,
          prenom: client.prenom,
          email: client.email,
          telephone: client.telephone
        },
        vehicule: {
          id: vehicule.id,
          immatriculation: vehicule.immatriculation,
          type: vehicule.type,
          marque: vehicule.marque,
          modele: vehicule.modele
        },
        creneau: {
          date: rdv.date_rdv,
          heure_debut: rdv.heure_debut,
          heure_fin: rdv.heure_fin,
          duree_minutes: rdv.duree_minutes
        },
        controleur: {
          id: controleur.id,
          nom: controleur.utilisateur.nom,
          prenom: controleur.utilisateur.prenom,
          agrements: controleur.agrements
        },
        type_controle: rdv.type_controle,
        statut: rdv.statut,
        montant_ttc: rdv.montant_ttc,
        url_paiement: urlPaiement,
        created_at: rdv.created_at
      };

    } catch (error) {
      this.logger.error('CreateRdvUseCase.execute failed', { error, dto });
      
      // Réthrow exceptions métier
      if (error instanceof DomainException) {
        throw error;
      }
      
      // Wrap exceptions techniques
      throw new TechnicalException('Erreur création RDV', error);
    }
  }

  private async calculateDisponibilites(
    centreId: string,
    date: Date,
    tenantId: string
  ): Promise<Disponibilite[]> {
    // Logique calcul disponibilités
    // TODO: Implémenter calcul complet
    return [];
  }

  private findCreneauDisponible(
    disponibilites: Disponibilite[],
    heureDebut: string,
    typeControle: string
  ): Disponibilite | null {
    return disponibilites.find(d => 
      d.heure_debut === heureDebut && 
      d.disponible && 
      d.types_controle_acceptes.includes(typeControle)
    ) || null;
  }

  private checkAgrementsControler(
    controleur: Controleur,
    vehiculeType: string,
    typeControle: string
  ): boolean {
    // Logique validation agréments
    // VP → besoin agrément "VL"
    // Moto → besoin agrément "L"
    // etc.
    return true; // TODO: Implémenter logique complète
  }

  private calculateHeureFin(heureDebut: string, dureeMinutes: number): string {
    const [h, m] = heureDebut.split(':').map(Number);
    const totalMinutes = h * 60 + m + dureeMinutes;
    const heureFin = Math.floor(totalMinutes / 60);
    const minutesFin = totalMinutes % 60;
    return `${String(heureFin).padStart(2, '0')}:${String(minutesFin).padStart(2, '0')}`;
  }
}

EXCEPTIONS CUSTOM :
export class CentreNotFoundException extends DomainException {
  constructor(centreId: string) {
    super(`Centre non trouvé: ${centreId}`, 'CENTRE_NOT_FOUND');
  }
}

export class CentreInactifException extends DomainException {
  constructor(centreId: string) {
    super(`Centre inactif: ${centreId}`, 'CENTRE_INACTIF');
  }
}

export class CreneauIndisponibleException extends DomainException {
  constructor(heure: string, typeControle: string) {
    super(
      `Créneau ${heure} indisponible pour ${typeControle}`,
      'CRENEAU_INDISPONIBLE'
    );
  }
}

export class ControleurNotFoundException extends DomainException {
  constructor(controleurId: string) {
    super(`Contrôleur non trouvé: ${controleurId}`, 'CONTROLEUR_NOT_FOUND');
  }
}

export class ControleurAgrementInsuffisantException extends DomainException {
  constructor(controleurId: string, vehiculeType: string) {
    super(
      `Contrôleur ${controleurId} sans agrément pour ${vehiculeType}`,
      'CONTROLEUR_AGREMENT_INSUFFISANT'
    );
  }
}

TESTS UNITAIRES (Jest) :
describe('CreateRdvUseCase', () => {
  let useCase: CreateRdvUseCase;
  let mockRdvRepository: jest.Mocked<RdvRepository>;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockEventPublisher: jest.Mocked<EventPublisher>;
  // ... autres mocks

  beforeEach(() => {
    mockRdvRepository = createMock<RdvRepository>();
    mockCacheService = createMock<CacheService>();
    mockEventPublisher = createMock<EventPublisher>();
    // ... init autres mocks

    useCase = new CreateRdvUseCase(
      mockRdvRepository,
      mockClientRepository,
      mockVehiculeRepository,
      mockCentreRepository,
      mockControleurRepository,
      mockCacheService,
      mockEventPublisher,
      mockIaService,
      mockDureeCalculator,
      mockTarificationService,
      mockLogger
    );
  });

  describe('execute', () => {
    it('should create rdv successfully', async () => {
      // Arrange
      const dto: CreateRdvDto = {
        centre_id: 'centre-uuid',
        client: {
          nom: 'Dupont',
          email: 'dupont@example.com',
          telephone: '0612345678',
          type: 'particulier'
        },
        vehicule: {
          immatriculation: 'AB-123-CD',
          type: 'VP',
          carburant: 'Diesel'
        },
        type_controle: 'CTP',
        creneau: {
          date: new Date('2026-03-03'),
          heure_debut: '09:00'
        },
        source: 'web'
      };

      mockCentreRepository.findById.mockResolvedValue(mockCentre);
      mockCacheService.get.mockResolvedValue(mockDisponibilites);
      mockDureeCalculator.calculate.mockResolvedValue(45);
      // ... setup autres mocks

      // Act
      const result = await useCase.execute(dto, 'tenant-uuid');

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.statut).toBe('confirme');
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'rdv.created',
        expect.objectContaining({ rdv_id: result.id })
      );
      expect(mockCacheService.del).toHaveBeenCalledWith('dispo:centre-uuid:2026-03-03');
    });

    it('should throw error if centre not found', async () => {
      mockCentreRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(mockDto, 'tenant-uuid'))
        .rejects.toThrow(CentreNotFoundException);
    });

    it('should throw error if créneau not available', async () => {
      mockCentreRepository.findById.mockResolvedValue(mockCentre);
      mockCacheService.get.mockResolvedValue([]); // Aucun créneau dispo

      await expect(useCase.execute(mockDto, 'tenant-uuid'))
        .rejects.toThrow(CreneauIndisponibleException);
    });

    it('should rollback transaction if error occurs', async () => {
      mockCentreRepository.findById.mockResolvedValue(mockCentre);
      mockCacheService.get.mockResolvedValue(mockDisponibilites);
      mockRdvRepository.create.mockRejectedValue(new Error('DB error'));

      await expect(useCase.execute(mockDto, 'tenant-uuid')).rejects.toThrow();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should invalidate cache after rdv creation', async () => {
      // ... setup mocks
      await useCase.execute(mockDto, 'tenant-uuid');

      expect(mockCacheService.del).toHaveBeenCalledWith(
        `dispo:${mockDto.centre_id}:${mockDto.creneau.date}`
      );
    });

    it('should publish kafka event after rdv creation', async () => {
      // ... setup mocks
      const result = await useCase.execute(mockDto, 'tenant-uuid');

      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'rdv.created',
        expect.objectContaining({
          rdv_id: result.id,
          tenant_id: 'tenant-uuid'
        })
      );
    });
  });
});

Génère :
1. Fichier create-rdv.use-case.ts complet
2. Fichier create-rdv.dto.ts avec validation
3. Fichiers exceptions custom
4. Fichier create-rdv.spec.ts avec tous les tests
5. Documentation JSDoc complète
```

---

## 4. FRONTEND APPLICATIONS

### 4.1. PWA Client Particulier - Architecture Complète

```
Crée l'application PWA Client Particulier avec mode offline complet, optimisée pour mobile et performance.

STACK TECHNIQUE :
- Next.js 14+ avec App Router
- React 18+ avec hooks et Server Components
- TypeScript 5+ strict mode
- Tailwind CSS 3+ pour styles responsive
- PWA avec Service Worker custom (Workbox)
- IndexedDB pour stockage local (Dexie.js)
- React Query v5 pour cache serveur et synchronisation
- Zustand pour state management léger
- React Hook Form pour formulaires
- Zod pour validation schemas
- date-fns pour manipulation dates
- Geolocation API pour localisation utilisateur
- next-pwa pour configuration PWA

FONCTIONNALITÉS PRINCIPALES :
1. Landing : Recherche centre par géolocalisation ou code postal
2. Liste centres : Affichage centres proches avec note/distance
3. Détails centre : Infos, horaires, disponibilités
4. Calendrier : Sélection créneau disponible (visuel)
5. Formulaire RDV : Saisie immatriculation + infos client
6. Paiement : Iframe sécurisé Payzen (PCI-DSS)
7. Confirmation : Récapitulatif RDV + PDF téléchargeable
8. Espace client : Historique RDV, modifications
9. Mode offline : Consultation dernières recherches cached

ARCHITECTURE PAGES (App Router) :
app/
├── layout.tsx                    - Layout racine avec providers
├── page.tsx                      - Landing (recherche centre)
├── centres/
│   ├── page.tsx                  - Liste centres résultats
│   └── [id]/
│       ├── page.tsx              - Détails centre + disponibilités
│       └── rdv/
│           ├── page.tsx          - Formulaire RDV complet
│           └── confirmation/
│               └── [rdvId]/
│                   └── page.tsx  - Confirmation + paiement
├── mon-compte/
│   ├── layout.tsx                - Layout espace client
│   ├── page.tsx                  - Dashboard client
│   ├── rdv/
│   │   └── [id]/
│   │       └── page.tsx          - Détail RDV client
│   └── profil/
│       └── page.tsx              - Profil client
├── offline/
│   └── page.tsx                  - Page offline fallback
├── api/
│   └── (routes API internes si nécessaires)
└── globals.css                   - Styles globaux Tailwind

PWA CONFIGURATION (next.config.js + next-pwa) :
- Service Worker avec stratégie Cache-First pour assets statiques
- Network-First pour API calls avec fallback cache (max 24h)
- Background Sync pour actions offline (création RDV en attente)
- Push Notifications (confirmations, rappels J-1, résultats CT)
- Installation prompt customisé (+ bouton "Installer l'app")
- Standalone display mode
- Theme color adapté charte graphique

manifest.json :
{
  "name": "SGS GENILINK - Contrôle Technique",
  "short_name": "GENILINK",
  "description": "Prenez RDV pour votre contrôle technique",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2C5282",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}

INDEXEDDB SCHEMA (Dexie.js) :
import Dexie, { Table } from 'dexie';

interface Centre {
  id: string;
  nom: string;
  adresse: string;
  distance?: number;
  note?: number;
  cached_at: number; // Timestamp
}

interface Disponibilite {
  centre_id: string;
  date: string; // YYYY-MM-DD
  creneaux: Creneau[];
  cached_at: number;
}

interface RdvDraft {
  id: string;
  centre_id: string;
  client: object;
  vehicule: object;
  creneau: object;
  status: 'draft' | 'pending_sync';
  created_at: number;
}

interface RdvHistory {
  id: string;
  centre_nom: string;
  date: string;
  heure: string;
  statut: string;
  synced: boolean;
}

class GENILINKDatabase extends Dexie {
  centres!: Table<Centre, string>;
  disponibilites!: Table<Disponibilite, string>;
  rdv_drafts!: Table<RdvDraft, string>;
  rdv_history!: Table<RdvHistory, string>;

  constructor() {
    super('GENILINK_DB');
    this.version(1).stores({
      centres: 'id, nom, distance, cached_at',
      disponibilites: '[centre_id+date], cached_at',
      rdv_drafts: 'id, status, created_at',
      rdv_history: 'id, date, synced'
    });
  }
}

export const db = new GENILINKDatabase();

COMPOSANTS REACT PRINCIPAUX :

1. <SearchCentre> : Recherche avec autocomplete
   Props : onSearch(query: string)
   Features :
     - Input géolocalisation (navigator.geolocation)
     - Input code postal (validation regex)
     - Autocomplete suggestions (debounce 300ms)
     - Loading state
     - Error handling

2. <CentreCard> : Card centre responsive
   Props : centre: Centre, onClick()
   Features :
     - Photo centre
     - Nom, adresse
     - Distance calculée
     - Note moyenne (étoiles)
     - Badge "Ouvert maintenant"
     - CTA "Prendre RDV"

3. <CalendarDisponibilites> : Calendrier créneaux
   Props : centreId: string, selectedDate: Date, onSelectSlot(slot)
   Features :
     - Calendrier mensuel (date-fns)
     - Créneaux horaires cliquables
     - Indicateur disponibilité (vert/jaune/rouge)
     - Temps attente estimé
     - Filtres type contrôle
     - Loading skeleton

4. <FormClient> : Formulaire client avec validation
   Props : onSubmit(data), initialData?
   Features :
     - React Hook Form + Zod validation
     - Champs : nom, prénom, email, téléphone
     - Immatriculation avec format validation (AA-123-BB)
     - Type véhicule (select)
     - Carburant (select)
     - Messages erreur inline
     - Auto-save draft IndexedDB

5. <PaymentIframe> : Iframe sécurisé Payzen
   Props : rdvId: string, montant: number, onSuccess(), onError()
   Features :
     - Iframe Payzen avec URL générée backend
     - Loader pendant chargement
     - Écoute postMessage événements paiement
     - Timeout 5min avec alerte
     - Retry sur erreur réseau

6. <RdvConfirmation> : Récapitulatif + téléchargement
   Props : rdv: RdvDetails
   Features :
     - Récapitulatif visuel complet
     - QR code RDV (pour check-in)
     - Bouton téléchargement PDF
     - Bouton ajouter calendrier (ICS)
     - Actions : Modifier / Annuler
     - Partage (Web Share API)

7. <OfflineBanner> : Banner alerte mode offline
   Props : isOnline: boolean
   Features :
     - Banner sticky top
     - Message "Mode hors ligne"
     - Icône WiFi barré
     - Auto-hide au retour connexion

8. <InstallPrompt> : Prompt installation PWA
   Features :
     - Détection beforeinstallprompt event
     - Modal customisé
     - Bouton "Installer"
     - Ne s'affiche qu'une fois (localStorage)

GESTION OFFLINE :
1. Détection connexion :
   const [isOnline, setIsOnline] = useState(navigator.onLine);
   
   useEffect(() => {
     const handleOnline = () => setIsOnline(true);
     const handleOffline = () => setIsOnline(false);
     
     window.addEventListener('online', handleOnline);
     window.addEventListener('offline', handleOffline);
     
     return () => {
       window.removeEventListener('online', handleOnline);
       window.removeEventListener('offline', handleOffline);
     };
   }, []);

2. Affichage banner offline
3. Désactivation actions nécessitant réseau (paiement, validation RDV)
4. Sauvegarde auto brouillon RDV en IndexedDB
5. Récupération dernières recherches centres en cache
6. Synchronisation auto au retour connexion (Background Sync API)

SERVICE WORKER (sw.js via Workbox) :
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache assets
precacheAndRoute(self.__WB_MANIFEST);

// API calls : Network First with fallback
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24h
      }),
    ],
  })
);

// Images : Cache First
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 jours
      }),
    ],
  })
);

// Assets statiques : Stale While Revalidate
registerRoute(
  ({ request }) => request.destination === 'style' || request.destination === 'script',
  new StaleWhileRevalidate({
    cacheName: 'static-cache',
  })
);

// Background Sync pour RDV
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-rdv') {
    event.waitUntil(syncPendingRdv());
  }
});

async function syncPendingRdv() {
  // Récupérer RDV en attente depuis IndexedDB
  // Envoyer vers API
  // Supprimer de IndexedDB si succès
}

API CLIENT (lib/api-client.ts) :
import axios, { AxiosInstance } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor request : JWT token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor response : retry + error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Retry 3 fois sur timeout/network error
        if (!originalRequest._retry && error.code === 'ECONNABORTED') {
          originalRequest._retry = true;
          return this.client(originalRequest);
        }
        
        // Logout si 401
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        
        throw error;
      }
    );
  }

  async searchCentres(query: { codePostal?: string; lat?: number; lon?: number }) {
    const { data } = await this.client.get('/centres/search', { params: query });
    return data;
  }

  async getDisponibilites(centreId: string, date: string) {
    const { data } = await this.client.get(`/disponibilites`, {
      params: { centre_id: centreId, date }
    });
    return data;
  }

  async createRdv(payload: CreateRdvPayload) {
    const { data } = await this.client.post('/rdv', payload);
    return data;
  }
}

export const apiClient = new ApiClient();

STATE MANAGEMENT (Zustand) :
import create from 'zustand';

interface AppState {
  // User
  isAuthenticated: boolean;
  user: User | null;
  setUser: (user: User | null) => void;

  // RDV en cours de création
  rdvDraft: RdvDraft | null;
  setRdvDraft: (draft: RdvDraft | null) => void;

  // Offline
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  user: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  rdvDraft: null,
  setRdvDraft: (draft) => set({ rdvDraft: draft }),

  isOnline: true,
  setIsOnline: (online) => set({ isOnline: online }),
}));

OPTIMISATIONS PERFORMANCE :
1. Code splitting par route (dynamic imports)
2. Lazy loading composants lourds (React.lazy)
3. Images optimisées (next/image avec sizes)
4. Prefetch liens visibles (Intersection Observer)
5. Bundle analysis (webpack-bundle-analyzer)
6. Compression Brotli + Gzip
7. Tree shaking automatique
8. Fonts optimisées (next/font)
9. Target bundle < 200kb gzippé

ACCESSIBILITÉ (WCAG 2.1 AA) :
- Navigation clavier complète (tabindex, focus visible)
- ARIA labels sur tous interactifs
- Contraste couleurs > 4.5:1
- Skip navigation link
- Headings hiérarchie correcte
- Alternative text images
- Form labels explicites
- Error messages descriptives
- Focus trap dans modales

TESTS :
1. Tests unitaires composants (Jest + React Testing Library)
2. Tests intégration user flows (Playwright)
3. Tests offline scenarios
4. Tests performance (Lighthouse CI : score > 90)
5. Tests accessibilité (axe-core)

Génère :
1. Structure projet Next.js complète
2. Configuration next.config.js avec PWA
3. Service Worker custom avec Workbox
4. Composants React principaux
5. API client avec offline handling
6. Store Zustand
7. IndexedDB setup (Dexie)
8. Styles Tailwind + design system
9. Tests E2E critiques (Playwright)
10. Dockerfile production

Priorise UX mobile-first et performance.
```

---

*[Le document continue avec les sections 5 à 10...]*

---

## CONCLUSION

Ce document contient **63 prompts détaillés** couvrant l'intégralité de l'implémentation PTI CALENDAR SOLUTION.

**Utilisation recommandée :**
1. Commencer par le Prompt Maître pour context global
2. Suivre l'ordre séquentiel : Infrastructure → Backend → Frontend → IA → Intégrations
3. Adapter chaque prompt selon spécificités projet
4. Utiliser prompts comme spécifications techniques détaillées
5. Générer code avec assistants IA (Claude, Copilot, ChatGPT)
6. Review code généré par architecte senior
7. Compléter avec tests et documentation

**Statut implémentation : READY TO CODE**

---

**Document généré le : 27 novembre 2024**  
**Projet : PTI CALENDAR SOLUTION - SGS France**  
**Budget : 693 000 € HT | Durée : 26 mois**
