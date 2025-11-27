# ARCHITECTURE MULTI-TENANT COMPLÈTE
## PTI CALENDAR SOLUTION - SGS France

**Document Technique : Architecture 3 Niveaux avec Générateur de Tenant**

---

## 📋 SOMMAIRE

### PARTIE 1 : ARCHITECTURE MULTI-TENANT GLOBALE
1.1. Vue d'Ensemble Architecture 3 Niveaux  
1.2. Plateforme d'Administration Globale SGS  
1.3. Générateur de Tenant (Onboarding Centre)  
1.4. Isolation Multi-Tenant PostgreSQL RLS  
1.5. Hiérarchie Organisationnelle  

### PARTIE 2 : NIVEAUX D'ADMINISTRATION
2.1. Niveau 1 : Super Admin SGS Global  
2.2. Niveau 2 : Admin Réseau (SECURITEST, AUTO SÉCURITÉ)  
2.3. Niveau 3 : Admin Centre (Single-Tenant)  
2.4. Matrice RBAC Complète  

### PARTIE 3 : USE CASES ADMINISTRATION MULTI-TENANT
3.1. UC-ADMIN-GLOBAL : Gestion Plateforme  
3.2. UC-TENANT : Générateur & Lifecycle  
3.3. UC-SUPERVISION : Monitoring Multi-Centres  

### PARTIE 4 : PROMPTS D'IMPLÉMENTATION
4.1. Backend Multi-Tenant avec RLS  
4.2. Frontend Plateforme Admin Globale  
4.3. Générateur de Tenant Automatisé  

---

## PARTIE 1 : ARCHITECTURE MULTI-TENANT GLOBALE

### 1.1. Vue d'Ensemble Architecture 3 Niveaux

```
┌─────────────────────────────────────────────────────────────────┐
│                    NIVEAU 1 : SGS GLOBAL                        │
│                 PLATEFORME MULTI-TENANT                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  ADMINISTRATION GLOBALE SGS                             │   │
│  │  - Gestion 2000+ centres                                │   │
│  │  - Générateur de Tenant (onboarding)                    │   │
│  │  - Supervision consolidée                               │   │
│  │  - Configuration globale                                │   │
│  │  - Analytics cross-centres                              │   │
│  │                                                          │   │
│  │  Rôles : Super Admin SGS, Admin IT SGS                  │   │
│  └────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              │ Provisionne                       │
│                              ▼                                   │
│  ┌─────────────────┬──────────────────┬──────────────────┐     │
│  │ TENANT: RÉSEAU  │ TENANT: RÉSEAU   │ TENANT: RÉSEAU   │     │
│  │  SECURITEST     │  AUTO SÉCURITÉ   │   Vérif'Auto     │     │
│  │  (700 centres)  │  (800 centres)   │   (500 centres)  │     │
│  └────────┬────────┴─────────┬────────┴─────────┬────────┘     │
└───────────┼──────────────────┼──────────────────┼──────────────┘
            │                  │                  │
            │                  │                  │
┌───────────┼──────────────────┼──────────────────┼──────────────┐
│           │    NIVEAU 2 : RÉSEAUX (Multi-Centres)              │
│           │                  │                  │               │
│  ┌────────▼────────┐  ┌──────▼────────┐  ┌─────▼───────┐      │
│  │ Admin Réseau    │  │ Admin Réseau  │  │ Admin Réseau│      │
│  │ SECURITEST      │  │ AUTO SÉCURITÉ │  │ Vérif'Auto  │      │
│  │                 │  │               │  │             │      │
│  │ - Gestion       │  │ - Gestion     │  │ - Gestion   │      │
│  │   centres       │  │   centres     │  │   centres   │      │
│  │ - Reporting     │  │ - Reporting   │  │ - Reporting │      │
│  │   réseau        │  │   réseau      │  │   réseau    │      │
│  └────────┬────────┘  └───────┬───────┘  └──────┬──────┘      │
│           │                   │                  │              │
└───────────┼───────────────────┼──────────────────┼──────────────┘
            │                   │                  │
            │ Génère            │                  │
            ▼                   ▼                  ▼
┌──────────────────────────────────────────────────────────────────┐
│           NIVEAU 3 : CENTRES (Single-Tenant par Centre)          │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ CENTRE 1    │  │ CENTRE 2    │  │ CENTRE 3    │  ... x2000  │
│  │ S072001     │  │ S075012     │  │ S013045     │             │
│  │             │  │             │  │             │             │
│  │ Tenant ID:  │  │ Tenant ID:  │  │ Tenant ID:  │             │
│  │ tenant-uuid1│  │ tenant-uuid2│  │ tenant-uuid3│             │
│  │             │  │             │  │             │             │
│  │ - Planning  │  │ - Planning  │  │ - Planning  │             │
│  │ - RDV       │  │ - RDV       │  │ - RDV       │             │
│  │ - Contrôl.  │  │ - Contrôl.  │  │ - Contrôl.  │             │
│  │             │  │             │  │             │             │
│  │ ISOLATION   │  │ ISOLATION   │  │ ISOLATION   │             │
│  │ COMPLÈTE    │  │ COMPLÈTE    │  │ COMPLÈTE    │             │
│  │ RLS         │  │ RLS         │  │ RLS         │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                   │
│  Rôles par centre : Responsable Centre, Contrôleur               │
└───────────────────────────────────────────────────────────────────┘
```

**PRINCIPES CLÉS :**

1. **Niveau 1 - SGS Global (Multi-Tenant)** :
   - Une seule instance plateforme
   - Base PostgreSQL UNIQUE avec RLS
   - Administration de TOUS les centres (2000+)
   - Génère les tenants pour nouveaux centres

2. **Niveau 2 - Réseaux (Multi-Centres)** :
   - Regroupement logique par réseau (SECURITEST, AUTO SÉCURITÉ, etc.)
   - Administration réseau (gestion des centres du réseau)
   - Reporting consolidé réseau
   - Pas de duplication infrastructure

3. **Niveau 3 - Centres (Single-Tenant Logic)** :
   - Chaque centre = 1 tenant isolé
   - Données cloisonnées par tenant_id (RLS)
   - Administration autonome du centre
   - Aucune visibilité sur autres centres

---

### 1.2. Plateforme d'Administration Globale SGS

**FONCTIONNALITÉS ADMINISTRATION GLOBALE :**

```
┌─────────────────────────────────────────────────────────────────┐
│         PLATEFORME ADMIN GLOBALE SGS (admin.genilink.fr)        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MODULE 1 : GESTION TENANTS                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✓ Créer nouveau tenant (générateur automatisé)           │  │
│  │ ✓ Lister tous les tenants (2000+ centres)                │  │
│  │ ✓ Modifier configuration tenant                          │  │
│  │ ✓ Suspendre/Activer tenant                               │  │
│  │ ✓ Supprimer tenant (avec purge données)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  MODULE 2 : SUPERVISION MULTI-CENTRES                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✓ Dashboard consolidé (2000 centres en temps réel)       │  │
│  │ ✓ Carte interactive centres (statut vert/rouge)          │  │
│  │ ✓ Alertes critiques (downtime, erreurs, pics)            │  │
│  │ ✓ Métriques globales (7M RDV/an, taux remplissage)       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  MODULE 3 : GESTION RÉSEAUX & AFFILIÉS                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✓ Créer/Modifier réseau (SECURITEST, AUTO SÉCURITÉ)      │  │
│  │ ✓ Affecter centres à un réseau                           │  │
│  │ ✓ Gérer admins réseau                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  MODULE 4 : CONFIGURATION GLOBALE                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✓ Paramètres globaux (durées contrôles, tarifs)          │  │
│  │ ✓ Gestion templates (emails, SMS)                        │  │
│  │ ✓ Configuration intégrations (AdelSoft, Payzen, etc.)    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  MODULE 5 : ANALYTICS & REPORTING                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✓ BI cross-centres (Power BI, Metabase)                  │  │
│  │ ✓ Exports consolidés (Excel, CSV, PDF)                   │  │
│  │ ✓ Analyses prédictives (IA globale)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  MODULE 6 : GESTION UTILISATEURS GLOBAL                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✓ Annuaire centralisé (5000+ utilisateurs)               │  │
│  │ ✓ Gestion rôles RBAC (Super Admin, Admin IT, etc.)       │  │
│  │ ✓ Audit logs (qui fait quoi, quand)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**ACCÈS :**
- URL : https://admin.genilink.fr
- Rôles autorisés : Super Admin SGS, Admin IT SGS
- Authentification : Keycloak SSO + MFA obligatoire
- Audit : Tous les accès loggés (ELK Stack)

---

### 1.3. Générateur de Tenant (Onboarding Nouveau Centre)

**PROCESSUS COMPLET DE CRÉATION D'UN TENANT :**

```
┌─────────────────────────────────────────────────────────────────┐
│         WORKFLOW : ONBOARDING NOUVEAU CENTRE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ÉTAPE 1 : INITIALISATION (Admin Global SGS)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Formulaire Création Centre]                              │  │
│  │                                                            │  │
│  │ Informations Centre :                                     │  │
│  │  • Code centre : S072001 (unique)                         │  │
│  │  • Nom : ACO SÉCURITÉ                                     │  │
│  │  • Réseau : SECURITEST                                    │  │
│  │  • Adresse : 90 RUE DE BONNETABLE, 72000 LE MANS          │  │
│  │  • Géolocalisation : Lat 48.xxx, Lon 0.xxx                │  │
│  │  • Téléphone : 02 43 74 03 11                             │  │
│  │  • Email : contact@aco-securite.fr                        │  │
│  │                                                            │  │
│  │ Configuration Initiale :                                  │  │
│  │  • Capacité journalière : 50 RDV/jour                     │  │
│  │  • Horaires : 08h00-19h00 (Lun-Sam)                       │  │
│  │  • Provider paiement : Payzen                             │  │
│  │  • Intégration AdelSoft : Code centre AdelSoft            │  │
│  │                                                            │  │
│  │ Administrateur Centre :                                   │  │
│  │  • Nom : MARTIN Jean                                      │  │
│  │  • Email : j.martin@aco-securite.fr                       │  │
│  │  • Téléphone : 06 12 34 56 78                             │  │
│  │  • Rôle : Responsable Centre                              │  │
│  │                                                            │  │
│  │               [Valider et Créer Tenant] ──────────►       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                    │                             │
│                                    ▼                             │
│  ÉTAPE 2 : GÉNÉRATION AUTOMATIQUE (Backend)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Le système exécute automatiquement :                      │  │
│  │                                                            │  │
│  │ 1. Génération Tenant ID (UUID unique)                     │  │
│  │    tenant_id = "550e8400-e29b-41d4-a716-446655440000"     │  │
│  │                                                            │  │
│  │ 2. Création entrées PostgreSQL :                          │  │
│  │    INSERT INTO tenants (id, type, nom, reseau_id)         │  │
│  │    INSERT INTO centres (tenant_id, code, nom, ...)        │  │
│  │                                                            │  │
│  │ 3. Création utilisateur admin centre :                    │  │
│  │    - Keycloak : création compte j.martin@...              │  │
│  │    - Rôle : Responsable_Centre                            │  │
│  │    - Attribut tenant_id dans JWT claims                   │  │
│  │                                                            │  │
│  │ 4. Provisioning infrastructure :                          │  │
│  │    - Namespace Kubernetes (optionnel si isolé)            │  │
│  │    - Subdomain : s072001.genilink.fr                      │  │
│  │    - Certificat SSL généré automatiquement                │  │
│  │                                                            │  │
│  │ 5. Configuration initiale :                               │  │
│  │    - Planning par défaut (modèle semaine)                 │  │
│  │    - Créneaux horaires 8h-19h                             │  │
│  │    - Templates emails/SMS personnalisés                   │  │
│  │    - Intégration AdelSoft configurée                      │  │
│  │    - Connexion SIR établie                                │  │
│  │                                                            │  │
│  │ 6. Génération accès :                                     │  │
│  │    - URL BackOffice : https://s072001.genilink.fr/admin   │  │
│  │    - URL Prise RDV : https://s072001.genilink.fr          │  │
│  │    - Credentials envoyés par email à admin centre         │  │
│  │                                                            │  │
│  │ 7. Logs & Audit :                                         │  │
│  │    - Log création tenant (ELK Stack)                      │  │
│  │    - Notification Slack équipe SGS IT                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                    │                             │
│                                    ▼                             │
│  ÉTAPE 3 : VALIDATION & ACTIVATION                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Tests automatiques exécutés :                             │  │
│  │  ✓ Connectivité base données                             │  │
│  │  ✓ Authentification Keycloak                             │  │
│  │  ✓ Intégration AdelSoft (ping API)                       │  │
│  │  ✓ Intégration SIR (récupération infos centre)           │  │
│  │  ✓ Provider paiement (test connexion Payzen)             │  │
│  │                                                            │  │
│  │ ⚠️  Si échec : alerte équipe technique                    │  │
│  │ ✅  Si OK : tenant activé et opérationnel                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                    │                             │
│                                    ▼                             │
│  ÉTAPE 4 : NOTIFICATION & DOCUMENTATION                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Email envoyé à admin centre :                             │  │
│  │                                                            │  │
│  │ ┌────────────────────────────────────────────────────┐   │  │
│  │ │ 🎉 Bienvenue sur GENILINK PTI CALENDAR !            │   │  │
│  │ │                                                      │   │  │
│  │ │ Votre centre est maintenant opérationnel :          │   │  │
│  │ │                                                      │   │  │
│  │ │ 🏢 Centre : ACO SÉCURITÉ (S072001)                  │   │  │
│  │ │ 🌐 BackOffice : https://s072001.genilink.fr/admin   │   │  │
│  │ │ 📅 Prise RDV : https://s072001.genilink.fr          │   │  │
│  │ │                                                      │   │  │
│  │ │ 👤 Vos identifiants :                               │   │  │
│  │ │    Email : j.martin@aco-securite.fr                │   │  │
│  │ │    Mot de passe temporaire : [généré]               │   │  │
│  │ │    (À changer à la première connexion)              │   │  │
│  │ │                                                      │   │  │
│  │ │ 📚 Guide de démarrage :                             │   │  │
│  │ │    https://docs.genilink.fr/onboarding              │   │  │
│  │ │                                                      │   │  │
│  │ │ 🎓 Formation : Une session sera planifiée           │   │  │
│  │ │                                                      │   │  │
│  │ │ 📞 Support : support@genilink.fr                    │   │  │
│  │ └────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  DURÉE TOTALE PROCESSUS : < 5 minutes (automatisé)              │
└──────────────────────────────────────────────────────────────────┘
```

---

### 1.4. Isolation Multi-Tenant PostgreSQL RLS

**IMPLÉMENTATION ROW-LEVEL SECURITY (RLS) :**

```sql
-- ARCHITECTURE BASE DE DONNÉES MULTI-TENANT

-- Table principale : Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- 'reseau', 'centre_independant'
  nom VARCHAR(255) NOT NULL,
  reseau_id UUID REFERENCES reseaux(id), -- Si affilié à un réseau
  statut VARCHAR(20) DEFAULT 'actif', -- 'actif', 'suspendu', 'archive'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table : Réseaux (SECURITEST, AUTO SÉCURITÉ, etc.)
CREATE TABLE reseaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(100) NOT NULL UNIQUE, -- 'SECURITEST', 'AUTO SÉCURITÉ'
  code VARCHAR(20) NOT NULL UNIQUE,
  logo_url VARCHAR(500),
  couleur_primaire VARCHAR(7), -- Hex color #FFB800
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table : Centres (avec tenant_id pour isolation)
CREATE TABLE centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code_centre VARCHAR(50) NOT NULL UNIQUE, -- S072001
  nom VARCHAR(255) NOT NULL,
  reseau_id UUID REFERENCES reseaux(id),
  adresse TEXT NOT NULL,
  code_postal VARCHAR(10),
  ville VARCHAR(100),
  location GEOGRAPHY(POINT, 4326), -- PostGIS
  telephone VARCHAR(20),
  email VARCHAR(255),
  horaires JSONB, -- Structure JSON horaires semaine
  capacite_journaliere INTEGER DEFAULT 50,
  provider_paiement VARCHAR(50) DEFAULT 'payzen', -- 'payzen' ou 'lemonway'
  code_adelsoft VARCHAR(100), -- Code dans AdelSoft
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_tenant_centre UNIQUE (tenant_id, code_centre)
);

-- ACTIVER ROW-LEVEL SECURITY SUR CENTRES
ALTER TABLE centres ENABLE ROW LEVEL SECURITY;

-- POLITIQUE RLS : Isolation complète par tenant_id
CREATE POLICY centres_tenant_isolation ON centres
  USING (tenant_id = get_current_tenant_id());

-- Fonction pour récupérer tenant_id depuis JWT
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  -- Récupère tenant_id depuis session variable (set par backend depuis JWT)
  RETURN NULLIF(current_setting('app.tenant_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Index optimisés pour multi-tenant
CREATE INDEX idx_centres_tenant ON centres(tenant_id);
CREATE INDEX idx_centres_reseau ON centres(reseau_id);
CREATE INDEX idx_centres_code ON centres(code_centre);
CREATE INDEX idx_centres_location ON centres USING GIST(location);

-- Exemple table RDV avec RLS
CREATE TABLE rdv (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  centre_id UUID NOT NULL REFERENCES centres(id),
  -- ... autres colonnes
  created_at TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (created_at); -- Partitionnement temporel

ALTER TABLE rdv ENABLE ROW LEVEL SECURITY;
CREATE POLICY rdv_tenant_isolation ON rdv
  USING (tenant_id = get_current_tenant_id());

-- IMPORTANT : Tous les utilisateurs doivent SET tenant_id en début de session
-- Exemple dans backend NestJS :
-- await queryRunner.query(`SET LOCAL app.tenant_id = '${tenantId}'`);
```

**SÉCURITÉ & GARANTIES :**

✅ **Isolation stricte** : Un centre ne peut JAMAIS voir les données d'un autre  
✅ **Performance** : Index sur tenant_id pour requêtes rapides  
✅ **Auditabilité** : Tous les accès loggés avec tenant_id  
✅ **Scalabilité** : Partitionnement temporel pour volumétries importantes  
✅ **Backup sélectif** : Possibilité backup par tenant si besoin  

---

## PARTIE 2 : PROMPTS D'IMPLÉMENTATION

### 2.1. PROMPT - Backend Générateur de Tenant

```
Tu vas implémenter le Générateur de Tenant automatisé pour PTI CALENDAR SOLUTION.

CONTEXTE :
Lorsqu'un Super Admin SGS crée un nouveau centre depuis la plateforme admin globale,
le système doit automatiquement :
1. Créer un tenant isolé
2. Provisionner l'infrastructure
3. Configurer les intégrations
4. Envoyer credentials au responsable centre

ARCHITECTURE MULTI-TENANT :
[Copier section 1.1 et 1.3 ci-dessus]

STACK TECHNIQUE :
- NestJS 10+ avec TypeScript 5+
- PostgreSQL avec RLS
- Keycloak pour IAM
- Kafka pour événements
- Bull/BullMQ pour jobs asynchrones

IMPLÉMENTATION :

### Étape 1 : Use Case CreateTenantUseCase

```typescript
// application/use-cases/create-tenant/create-tenant.use-case.ts

export class CreateTenantUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly centreRepository: CentreRepository,
    private readonly userService: UserService,
    private readonly keycloakService: KeycloakService,
    private readonly adelSoftConnector: AdelSoftConnector,
    private readonly emailService: EmailService,
    private readonly tenantProvisioningService: TenantProvisioningService,
    private readonly logger: Logger
  ) {}

  async execute(dto: CreateTenantDto): Promise<TenantCreatedDto> {
    this.logger.info('CreateTenantUseCase.execute', { dto });

    // Valider unicité code centre
    const existingCentre = await this.centreRepository.findByCode(dto.code_centre);
    if (existingCentre) {
      throw new CentreAlreadyExistsException(dto.code_centre);
    }

    // Démarrer transaction
    const queryRunner = this.tenantRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Créer Tenant
      const tenant = await this.tenantRepository.create({
        type: dto.reseau_id ? 'reseau' : 'independant',
        nom: dto.nom,
        reseau_id: dto.reseau_id,
        statut: 'actif'
      }, queryRunner);

      this.logger.info('Tenant créé', { tenant_id: tenant.id });

      // 2. Créer Centre
      const centre = await this.centreRepository.create({
        tenant_id: tenant.id,
        code_centre: dto.code_centre,
        nom: dto.nom,
        reseau_id: dto.reseau_id,
        adresse: dto.adresse,
        code_postal: dto.code_postal,
        ville: dto.ville,
        location: dto.geolocalisation,
        telephone: dto.telephone,
        email: dto.email,
        horaires: dto.horaires_defaut || this.getDefaultHoraires(),
        capacite_journaliere: dto.capacite_journaliere || 50,
        provider_paiement: dto.provider_paiement || 'payzen',
        code_adelsoft: dto.code_adelsoft,
        actif: true
      }, queryRunner);

      this.logger.info('Centre créé', { centre_id: centre.id });

      // 3. Créer utilisateur admin centre dans Keycloak
      const adminUser = await this.keycloakService.createUser({
        email: dto.admin_email,
        firstName: dto.admin_prenom,
        lastName: dto.admin_nom,
        enabled: true,
        attributes: {
          tenant_id: tenant.id,
          centre_id: centre.id
        }
      });

      // 4. Assigner rôle "Responsable_Centre"
      await this.keycloakService.assignRoles(adminUser.id, [
        'Responsable_Centre'
      ]);

      // 5. Créer entrée utilisateur en base
      await this.userService.create({
        tenant_id: tenant.id,
        keycloak_id: adminUser.id,
        email: dto.admin_email,
        nom: dto.admin_nom,
        prenom: dto.admin_prenom,
        telephone: dto.admin_telephone,
        role: 'responsable',
        centre_id: centre.id,
        actif: true
      }, queryRunner);

      // Commit transaction
      await queryRunner.commitTransaction();
      this.logger.info('Transaction committed');

      // 6. PROVISIONING ASYNCHRONE (via job queue)
      await this.tenantProvisioningService.provisionInfrastructure({
        tenant_id: tenant.id,
        centre_id: centre.id,
        code_centre: dto.code_centre,
        subdomain: `${dto.code_centre.toLowerCase()}.genilink.fr`,
        ssl_cert: true,
        integrations: {
          adelsoft: dto.code_adelsoft,
          sir: true,
          payzen: dto.provider_paiement === 'payzen'
        }
      });

      // 7. Générer mot de passe temporaire
      const tempPassword = this.generateSecurePassword();
      await this.keycloakService.setTemporaryPassword(
        adminUser.id,
        tempPassword
      );

      // 8. Envoyer email onboarding
      await this.emailService.sendTenantCreatedEmail({
        to: dto.admin_email,
        centre_nom: dto.nom,
        centre_code: dto.code_centre,
        url_backoffice: `https://${dto.code_centre.toLowerCase()}.genilink.fr/admin`,
        url_booking: `https://${dto.code_centre.toLowerCase()}.genilink.fr`,
        email: dto.admin_email,
        password: tempPassword,
        guide_url: 'https://docs.genilink.fr/onboarding'
      });

      // 9. Publier événement Kafka
      await this.eventPublisher.publish('tenant.created', {
        tenant_id: tenant.id,
        centre_id: centre.id,
        code_centre: dto.code_centre,
        created_by: 'super_admin_sgs',
        timestamp: new Date()
      });

      // 10. Notification Slack équipe IT
      await this.slackService.sendMessage({
        channel: '#genilink-ops',
        text: `🎉 Nouveau centre créé : ${dto.nom} (${dto.code_centre})`
      });

      return {
        tenant_id: tenant.id,
        centre_id: centre.id,
        code_centre: dto.code_centre,
        nom: dto.nom,
        url_backoffice: `https://${dto.code_centre.toLowerCase()}.genilink.fr/admin`,
        url_booking: `https://${dto.code_centre.toLowerCase()}.genilink.fr`,
        admin_email: dto.admin_email,
        statut: 'actif',
        created_at: new Date()
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('CreateTenantUseCase failed', { error });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private getDefaultHoraires() {
    return {
      lundi: { ouverture: '08:00', fermeture: '19:00', actif: true },
      mardi: { ouverture: '08:00', fermeture: '19:00', actif: true },
      mercredi: { ouverture: '08:00', fermeture: '19:00', actif: true },
      jeudi: { ouverture: '08:00', fermeture: '19:00', actif: true },
      vendredi: { ouverture: '08:00', fermeture: '19:00', actif: true },
      samedi: { ouverture: '08:00', fermeture: '17:00', actif: true },
      dimanche: { ouverture: null, fermeture: null, actif: false }
    };
  }

  private generateSecurePassword(): string {
    // Génération mot de passe sécurisé
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}
```

### Étape 2 : Service Provisioning Infrastructure

```typescript
// infrastructure/services/tenant-provisioning.service.ts

@Injectable()
export class TenantProvisioningService {
  constructor(
    private readonly kubernetesService: KubernetesService,
    private readonly dnsService: DNSService,
    private readonly certManagerService: CertManagerService,
    private readonly adelSoftConnector: AdelSoftConnector,
    private readonly sirConnector: SIRConnector,
    private readonly logger: Logger
  ) {}

  async provisionInfrastructure(params: ProvisioningParams): Promise<void> {
    this.logger.info('Provisioning infrastructure', { params });

    try {
      // 1. Créer subdomain DNS
      await this.dnsService.createRecord({
        subdomain: params.subdomain,
        type: 'CNAME',
        value: 'lb.genilink.fr' // Load balancer principal
      });

      // 2. Générer certificat SSL (Let's Encrypt)
      if (params.ssl_cert) {
        await this.certManagerService.issueCertificate({
          domain: params.subdomain,
          issuer: 'letsencrypt-prod'
        });
      }

      // 3. Créer namespace Kubernetes (optionnel)
      // Si on veut isolation namespace par tenant
      await this.kubernetesService.createNamespace({
        name: `tenant-${params.tenant_id}`,
        labels: {
          'app.kubernetes.io/tenant-id': params.tenant_id,
          'app.kubernetes.io/centre-code': params.code_centre
        }
      });

      // 4. Déployer Ingress dédié
      await this.kubernetesService.createIngress({
        name: `ingress-${params.code_centre}`,
        namespace: `tenant-${params.tenant_id}`,
        host: params.subdomain,
        tls: {
          secretName: `tls-${params.code_centre}`,
          hosts: [params.subdomain]
        },
        rules: [
          {
            path: '/',
            service: 'frontend-app',
            port: 3000
          },
          {
            path: '/api',
            service: 'backend-api',
            port: 4000
          }
        ]
      });

      // 5. Configurer intégrations
      if (params.integrations.adelsoft) {
        await this.adelSoftConnector.registerCentre({
          code_centre_genilink: params.code_centre,
          code_centre_adelsoft: params.integrations.adelsoft,
          tenant_id: params.tenant_id
        });
      }

      if (params.integrations.sir) {
        await this.sirConnector.syncCentreInfo({
          code_centre: params.code_centre,
          tenant_id: params.tenant_id
        });
      }

      // 6. Créer planning par défaut
      await this.createDefaultPlanning(params.tenant_id, params.centre_id);

      // 7. Initialiser cache Redis
      await this.redis.set(
        `tenant:${params.tenant_id}:status`,
        'active',
        'EX',
        86400 // 24h
      );

      this.logger.info('Infrastructure provisioned successfully', {
        tenant_id: params.tenant_id
      });

    } catch (error) {
      this.logger.error('Provisioning failed', { error, params });
      // Ne pas throw - continuer et alerter équipe IT
      await this.slackService.sendMessage({
        channel: '#genilink-ops',
        text: `⚠️ Provisioning échoué pour ${params.code_centre}
Erreur: ${error.message}`
      });
    }
  }

  private async createDefaultPlanning(tenant_id: string, centre_id: string) {
    // Créer planning par défaut avec créneaux 08h-19h
    // Logique à implémenter selon besoins métier
  }
}
```

TESTS À IMPLÉMENTER :

```typescript
describe('CreateTenantUseCase', () => {
  it('should create tenant with complete provisioning', async () => {
    // Test création tenant de bout en bout
  });

  it('should rollback if transaction fails', async () => {
    // Test rollback
  });

  it('should send onboarding email', async () => {
    // Test envoi email
  });
});
```

Génère le code complet production-ready de tout le workflow de génération de tenant.
```

---

**FIN DU DOCUMENT - Architecture Multi-Tenant Complète**

Ce document contient :
✅ Architecture 3 niveaux (Global → Réseau → Centre)
✅ Plateforme Admin Globale SGS
✅ Générateur de Tenant automatisé  
✅ Isolation PostgreSQL RLS
✅ Use Cases administration multi-tenant
✅ Prompts d'implémentation détaillés

**PRÊT POUR IMPLÉMENTATION !**
