# 🚀 PROMPT FINAL : AUDIT, CONFORMITÉ & IMPLÉMENTATION COMPLÈTE PTI CALENDAR V4

> **Méga-Prompt de Finalisation de Plateforme**  
> Audit complet du code existant + Implémentation de A à Z de tous les parcours utilisateurs  
> **Focus Critical : Fronts complets reliés aux backends et bases de données**

---

## 📋 MISSION GLOBALE

Tu es un architecte logiciel senior et lead developer full-stack. Ta mission est d'**auditer, corriger, uniformiser et finaliser complètement** la plateforme PTI CALENDAR SOLUTION V4.

### Objectifs Critiques

1. ✅ **AUDIT COMPLET** : Examiner en profondeur tout le code existant
2. ✅ **CONFORMITÉ V4** : Vérifier alignement avec Architecture V4 et tous les prompts
3. ✅ **UNIFORMISATION** : Standardiser le code (patterns, conventions, structure)
4. ✅ **IMPLÉMENTATION COMPLÈTE** : Finir tous les parcours utilisateurs de bout en bout
5. ✅ **FRONTS COMPLETS** : Créer TOUTES les interfaces graphiques reliées aux backends
6. ✅ **CONNEXION DONNÉES** : Dynamiser les données (Front ↔ Backend ↔ Database)
7. ✅ **SEED DATABASE** : Alimenter avec vraies données de test
8. ✅ **TESTS E2E** : Valider tous les parcours utilisateurs
9. ✅ **DOCUMENTATION** : Compléter README, guides utilisateurs
10. ✅ **DÉPLOIEMENT** : Préparer pour production

---

## 🔍 PHASE 1 : AUDIT COMPLET DU CODE EXISTANT

### 1.1 Checklist Audit Structurel

**Examine TOUS les repositories et vérifie :**

#### Architecture Globale
```
□ Les 18 repositories Git sont-ils tous créés ?
  - Backend (8 services) : planning, rdv, payment, notification, user, admin, ia, integration
  - Frontend (5 apps) : admin-webapp, client-pwa, pro-webapp, callcenter-webapp, design-system
  - Infrastructure (3 repos) : infrastructure, api-gateway, db-migrations
  - Shared (2 repos) : shared-types, shared-utils

□ Structure Multi-Repo conforme ?
  - Chaque repo a sa propre CI/CD ?
  - Chaque repo a son README.md ?
  - Chaque repo a son Dockerfile ?

□ Architecture Microservices respectée ?
  - Séparation claire des responsabilités ?
  - Communication inter-services via Kafka ?
  - API Gateway Kong configuré ?
  - Isolation tenants active (RLS PostgreSQL) ?
```

#### Backend Services (Chaque Microservice)
```
□ Structure Clean Architecture ?
  /src
    /application (use cases, commands, queries)
    /domain (entities, value objects, repositories interfaces)
    /infrastructure (database, cache, messaging, http)
    /shared (guards, interceptors, filters)
    /config

□ CQRS implémenté ?
  - Commands (write operations)
  - Queries (read operations)
  - Event handlers

□ PostgreSQL + TypeORM ?
  - Entities définies
  - Repositories implémentés
  - Migrations SQL créées
  - RLS (Row-Level Security) activé
  - Indexes performants créés

□ Redis Cache ?
  - Service Redis configuré
  - Cache des disponibilités
  - Cache des sessions

□ Kafka Events ?
  - Producer configuré
  - Consumer configuré
  - Topics créés (rdv.events, planning.events, payment.events, notification.events)
  - Event handlers implémentés

□ Tests ?
  - Tests unitaires (>80% coverage)
  - Tests E2E (scénarios critiques)
  - Tests d'intégration

□ Configuration ?
  - .env.example complet
  - Docker Compose dev
  - Dockerfile multi-stage production
  - package.json complet
```

#### Frontend Applications (Chaque App)
```
□ Structure Next.js 14 App Router ?
  /src
    /app (pages, layouts, middleware)
    /components (atoms, molecules, organisms)
    /lib (api, auth, hooks, utils)
    /stores (Zustand state management)
    /types (TypeScript types)

□ Authentification ?
  - Auth Context implémenté
  - JWT gestion (access + refresh tokens)
  - Route guards (middleware.ts)
  - RBAC (role guards)
  - OAuth2 (Google, Microsoft)

□ API Integration ?
  - Axios instance configuré
  - Interceptors (token refresh auto)
  - React Query pour data fetching
  - Error handling global

□ UI/UX ?
  - Design System utilisé (@sgs-genilink/design-system)
  - shadcn/ui components
  - Tailwind CSS configuré
  - Responsive design (mobile-first)
  - Dark mode support

□ Formulaires ?
  - React Hook Form
  - Zod validation
  - Error messages affichés

□ State Management ?
  - Zustand stores créés
  - State persistence si nécessaire

□ Tests ?
  - Jest + React Testing Library
  - Tests composants critiques
  - Tests E2E (Playwright)
```

### 1.2 Checklist Audit Fonctionnel

**Vérifie que TOUS les use cases métier sont implémentés :**

#### Admin WebApp (Super Admin + Admin Tenant)

**Super Admin :**
```
□ Dashboard global
  □ KPIs tous tenants (tenants actifs, users total, RDV mois, CA total)
  □ Charts revenus par mois
  □ Charts RDV par tenant
  □ Table activité récente tenants

□ Gestion Tenants
  □ Liste tenants avec search
  □ Créer tenant (form complet)
  □ Modifier tenant (form édition)
  □ Détails tenant (vue complète)
  □ Désactiver/Activer tenant
  □ Configuration tenant (branding, paiements, SMS/Email)

□ Monitoring Plateforme
  □ Status services (health checks)
  □ Métriques performances (Prometheus/Grafana)
  □ Logs erreurs (Sentry)
  □ Alertes incidents

□ Facturation
  □ Liste factures tenants
  □ Générer factures
  □ Exports Excel/PDF
  □ Paiements tenants

□ Audit Logs
  □ Liste complète événements sécurité
  □ Filtres (user, action, date)
  □ Export logs
```

**Admin Tenant :**
```
□ Dashboard Tenant
  □ KPIs organisme (users, RDV mois, CA, taux conversion)
  □ Charts revenus 12 mois
  □ Funnel conversion
  □ Top 5 agences

□ Gestion Utilisateurs
  □ Liste users avec search/filters
  □ Créer user (form + assign roles)
  □ Modifier user
  □ Détails user (historique, stats)
  □ Désactiver/Activer user
  □ Gestion rôles (RBAC)

□ Gestion Agences
  □ Liste agences
  □ Créer agence (form + géolocalisation)
  □ Modifier agence
  □ Détails agence (stats, CT associés)
  □ Map view agences

□ Gestion CTs (Centres Techniques)
  □ Liste CTs par agence
  □ Créer CT (form complet)
  □ Modifier CT
  □ Configuration CT (horaires, types contrôles)

□ Planning Global
  □ Vue calendrier tous CTs
  □ Filtres (agence, CT, période)
  □ Statistiques taux remplissage

□ Statistiques
  □ Dashboard complet
  □ Charts revenus
  □ Charts RDV (par type, par agence)
  □ Taux conversion
  □ Exports Excel/PDF

□ Paramètres
  □ Paramètres généraux (nom, logo, coordonnées)
  □ Paramètres paiement (Stripe/PayZen)
  □ Paramètres notifications (Brevo, SMS Mode)
  □ Branding (couleurs, logo)
```

#### Client PWA (Grand Public)

```
□ Home / Recherche
  □ Barre recherche localisation (autocomplete)
  □ Géolocalisation automatique
  □ Sélection date (date picker)
  □ Sélection type véhicule (VP/VT/VU)
  □ Bouton "Rechercher disponibilités"

□ Résultats Recherche
  □ Liste disponibilités (cards agences)
  □ Map view avec markers
  □ Filtres (prix, distance, note, horaires)
  □ Tri (distance, prix, note)
  □ Affichage créneaux disponibles par agence

□ Sélection Créneau
  □ Calendrier disponibilités CT
  □ Sélection créneau horaire
  □ Affichage prix
  □ Bouton "Réserver"

□ Formulaire Réservation
  □ Informations client (nom, email, téléphone)
  □ Informations véhicule (immatriculation, marque, modèle, année)
  □ Type contrôle (CT, contre-visite, VT)
  □ Notes complémentaires
  □ Validation Zod
  □ Bouton "Confirmer"

□ Paiement
  □ Récapitulatif RDV (agence, date, heure, véhicule, prix)
  □ Formulaire carte bancaire (Stripe Elements)
  □ Sécurité affichée (HTTPS, PCI-DSS)
  □ Bouton "Payer"
  □ Gestion erreurs paiement
  □ Redirection confirmation

□ Confirmation
  □ Message succès
  □ Détails RDV complets
  □ Bouton "Télécharger confirmation" (PDF)
  □ Bouton "Ajouter au calendrier" (ICS)
  □ Notification email envoyée
  □ Notification SMS envoyée

□ Mes RDV
  □ Liste mes RDV (à venir, passés)
  □ Filtres/Tri
  □ Détails RDV
  □ Modifier RDV (si délai respecté)
  □ Annuler RDV (avec remboursement si délai)
  □ Télécharger factures/reçus

□ Mon Profil
  □ Informations personnelles
  □ Modifier profil
  □ Mes véhicules
  □ Historique RDV
  □ Paramètres notifications

□ PWA Features
  □ Manifest.json configuré
  □ Service Worker (cache offline)
  □ Install prompt
  □ Push notifications (FCM)
  □ Offline page
  □ Add to home screen
```

#### Pro WebApp (Contrôleurs + Admin CT)

**Admin CT :**
```
□ Planning CT
  □ Calendrier FullCalendar (mois/semaine/jour)
  □ Drag & drop créneaux
  □ Créer planning (form dates/horaires)
  □ Bloquer créneaux (congés, maintenance)
  □ Affecter contrôleurs
  □ Vue disponibilités vs réservés
  □ Stats taux remplissage

□ Gestion Contrôleurs
  □ Liste contrôleurs
  □ Créer contrôleur (form complet)
  □ Modifier contrôleur
  □ Détails contrôleur (planning, stats)
  □ Disponibilités contrôleur

□ RDV CT
  □ Liste RDV (aujourd'hui, à venir, passés)
  □ Filtres (statut, contrôleur, type)
  □ Détails RDV
  □ Valider RDV
  □ Refuser RDV (avec raison)
  □ Notes contrôleur

□ Statistiques CT
  □ Dashboard stats
  □ Charts revenus
  □ Charts taux remplissage
  □ Performance contrôleurs
  □ Exports Excel/PDF
```

**Contrôleur :**
```
□ Mon Planning
  □ Vue calendrier personnel
  □ Liste RDV du jour
  □ Détails RDV
  □ Notes contrôle

□ Mes Disponibilités
  □ Calendrier disponibilités
  □ Modifier disponibilités
  □ Demandes congés

□ Historique Contrôles
  □ Liste contrôles effectués
  □ Statistiques personnelles
```

#### Call Center WebApp (Opérateurs)

```
□ Dashboard Opérateur
  □ Recherche rapide client (email, tel, immat)
  □ Création client express
  □ Call timer actif
  □ Notes appel
  □ Stats du jour (appels, RDV créés)

□ Création RDV Assistée
  □ Wizard prise RDV (3 étapes)
  □ Recherche disponibilités
  □ Formulaire client/véhicule
  □ Confirmation et envoi

□ Gestion RDV
  □ Recherche RDV
  □ Modifier RDV
  □ Annuler RDV
  □ Envoi confirmations (email/SMS)

□ Historique Appels
  □ Liste appels traités
  □ Notes appels
  □ Temps moyen appel
```

#### Design System (Storybook)

```
□ Tokens Design
  □ Colors (primary, neutral, success, warning, error, info)
  □ Typography (fonts, sizes, weights)
  □ Spacing (scale 4-8-12-16...)
  □ Shadows
  □ Border radius
  □ Breakpoints

□ Atoms
  □ Button (variants, sizes, states, icons)
  □ Input (text, email, password, number, date)
  □ Textarea
  □ Select
  □ Checkbox
  □ Radio
  □ Switch
  □ Badge
  □ Avatar
  □ Icon (Lucide React)
  □ Spinner

□ Molecules
  □ FormField (label + input + error)
  □ SearchBar
  □ Pagination
  □ Breadcrumb
  □ Alert
  □ Toast
  □ ProgressBar
  □ Tabs
  □ Accordion
  □ Tooltip

□ Organisms
  □ Card
  □ Table (sorting, filters, pagination)
  □ Modal/Dialog
  □ Drawer
  □ DropdownMenu
  □ Calendar
  □ DatePicker
  □ FileUpload
  □ DataGrid

□ Storybook Stories
  □ Chaque composant a sa story
  □ Variants affichés
  □ Controls interactifs
  □ Documentation MDX
  □ Accessibilité testée
```

### 1.3 Checklist Audit Technique

#### Sécurité
```
□ Authentification JWT
  □ RS256 (clés asymétriques)
  □ Access token (1h expiration)
  □ Refresh token (30 jours)
  □ Token refresh automatique
  □ Logout (blacklist Redis)

□ RBAC Complet
  □ 8 rôles définis (Super Admin, Admin Tenant, Admin Agence, Admin CT, Contrôleur, Call Center, Client, API Key)
  □ Permissions granulaires
  □ Guards frontend (ProtectedRoute, RoleGuard)
  □ Guards backend (JwtAuthGuard, RolesGuard, PermissionsGuard)

□ Tenant Isolation
  □ RLS PostgreSQL activé sur TOUTES tables
  □ Policies créées
  □ Header X-Tenant-ID vérifié
  □ TenantIsolationGuard backend
  □ Middleware frontend

□ API Gateway Kong
  □ JWT authentication plugin
  □ Rate limiting (par endpoint)
  □ IP restriction (payment)
  □ Request size limiting
  □ CORS configuré
  □ Prometheus metrics

□ Sécurité Générale
  □ HTTPS obligatoire production
  □ Helmet.js (security headers)
  □ CSRF protection
  □ XSS prevention
  □ SQL injection prevention (parameterized queries)
  □ Passwords hashés (bcrypt 12 rounds)
  □ Secrets dans variables d'environnement
```

#### Performance
```
□ Cache Redis
  □ Disponibilités (10 min TTL)
  □ Sessions users
  □ Rate limiting counters

□ Database Indexes
  □ Indexes sur tenant_id (TOUTES tables)
  □ Indexes sur foreign keys
  □ Indexes sur champs recherche (email, phone, immatriculation)
  □ Composite indexes (tenant_id + date)

□ Pagination
  □ Toutes listes paginées
  □ Limit max 100 items
  □ Cursor-based pagination (performance)

□ Frontend Optimisations
  □ Code splitting (dynamic imports)
  □ Image optimization (next/image)
  □ Lazy loading composants
  □ React Query cache
  □ Service Worker cache (PWA)

□ Backend Optimisations
  □ Connection pooling database
  □ Kafka batching
  □ Async operations
  □ Debouncing recherches
```

#### Monitoring & Observabilité
```
□ Logs
  □ Winston/Pino logger configuré
  □ Logs structurés (JSON)
  □ Correlation IDs
  □ Log levels (debug, info, warn, error)

□ Métriques
  □ Prometheus exporters
  □ Grafana dashboards
  □ Métriques métier (RDV, paiements, users)
  □ Métriques techniques (latence, errors, throughput)

□ Tracing
  □ Jaeger/Zipkin (optionnel)
  □ Distributed tracing

□ Alerting
  □ Sentry (errors tracking)
  □ Alertes Slack/Email
  □ Thresholds définis

□ Health Checks
  □ /health endpoints
  □ Liveness probes
  □ Readiness probes
  □ Database connectivity
  □ Redis connectivity
  □ Kafka connectivity
```

---

## 🔧 PHASE 2 : CORRECTIONS & UNIFORMISATION

### 2.1 Standards de Code

**Applique ces standards dans TOUT le code :**

#### Backend (NestJS)
```typescript
// ✅ Structure Clean Architecture stricte
src/
  application/     # Use cases (commands, queries, services)
  domain/         # Entities, Value Objects, Repositories interfaces
  infrastructure/ # Implémentations (database, cache, messaging, http)
  shared/         # Guards, Interceptors, Filters communs
  config/         # Configuration modules

// ✅ Naming Conventions
// - Fichiers: kebab-case (user-service.ts)
// - Classes: PascalCase (UserService)
// - Interfaces: PascalCase avec I prefix (IUserRepository)
// - Variables: camelCase (currentUser)
// - Constants: UPPER_SNAKE_CASE (MAX_RETRIES)

// ✅ Patterns
// - Dependency Injection partout
// - CQRS (Commands, Queries séparés)
// - Repository Pattern
// - Event-Driven (Kafka events)

// ✅ Error Handling
// - Custom exceptions (NotFoundException, UnauthorizedException, etc.)
// - Global exception filter
// - Error logging avec context

// ✅ Validation
// - class-validator DTOs
// - Validation pipes global
// - Custom validators si nécessaire

// ✅ Tests
// - Tests unitaires: .spec.ts
// - Tests E2E: .e2e-spec.ts
// - Mocking: jest
// - Coverage: >80%
```

#### Frontend (Next.js)
```typescript
// ✅ Structure Next.js 14 App Router
src/
  app/            # Pages (page.tsx, layout.tsx)
  components/     # Composants réutilisables
  lib/           # Logic (api, auth, hooks, utils)
  stores/        # Zustand state management
  types/         # TypeScript types

// ✅ Naming Conventions
// - Composants: PascalCase (UserCard.tsx)
// - Hooks: camelCase avec use prefix (useAuth.ts)
// - Utils: camelCase (formatDate.ts)
// - Types: PascalCase (User.ts)
// - Stores: kebab-case (user-store.ts)

// ✅ Composants
// - Functional components avec hooks
// - Props typées avec TypeScript
// - Composition > Héritage
// - Memoization (useMemo, useCallback) si nécessaire

// ✅ State Management
// - Server State: React Query
// - Client State: Zustand
// - Form State: React Hook Form
// - URL State: useSearchParams

// ✅ API Calls
// - Axios instance centralisé
// - React Query pour data fetching
// - Interceptors (auth, errors)
// - Loading/Error states

// ✅ Styling
// - Tailwind CSS classes
// - Design System composants
// - Responsive (mobile-first)
// - Dark mode support

// ✅ Tests
// - Jest + React Testing Library
// - Tests composants critiques
// - Tests E2E (Playwright)
```

### 2.2 Plan de Corrections

**Pour chaque fichier audité avec écarts :**

```markdown
## Fichier : [chemin/fichier.ts]

### Écarts Identifiés
1. [Description écart 1]
2. [Description écart 2]
3. [etc.]

### Corrections Appliquées
```typescript
// AVANT
[code incorrect]

// APRÈS
[code corrigé conforme]
```

### Justification
[Pourquoi cette correction, référence aux standards]
```

---

## 🚀 PHASE 3 : IMPLÉMENTATION COMPLÈTE FRONT-TO-BACK

### 3.1 Méthodologie Implémentation

**Pour CHAQUE parcours utilisateur, implémente dans cet ordre :**

#### Étape 1 : Backend API Endpoint

```typescript
// 1. Créer DTO (validation)
// src/infrastructure/http/dto/create-rdv.dto.ts
export class CreateRDVDto {
  @IsUUID()
  disponibilite_id: string;

  @IsString()
  @MinLength(2)
  immatriculation: string;

  @IsEnum(VehicleType)
  vehicle_type: VehicleType;

  // ... tous les champs
}

// 2. Créer Command/Query Handler
// src/application/commands/create-rdv/create-rdv.handler.ts
@CommandHandler(CreateRDVCommand)
export class CreateRDVHandler {
  async execute(command: CreateRDVCommand): Promise<RDV> {
    // Logic métier
    // Save to database
    // Publish Kafka event
    // Return result
  }
}

// 3. Créer Controller
// src/infrastructure/http/controllers/rdv.controller.ts
@Controller('rdv')
@UseGuards(JwtAuthGuard, TenantIsolationGuard)
export class RDVController {
  @Post()
  @Roles(UserRole.CLIENT, UserRole.ADMIN_TENANT, UserRole.CALL_CENTER)
  async create(
    @Body() dto: CreateRDVDto,
    @CurrentUser() user: User
  ): Promise<RDVResponseDto> {
    const command = new CreateRDVCommand({ ...dto, user_id: user.id });
    return this.commandBus.execute(command);
  }
}

// 4. Tests E2E
// test/rdv.e2e-spec.ts
it('should create rdv', () => {
  return request(app.getHttpServer())
    .post('/api/v1/rdv')
    .set('Authorization', `Bearer ${token}`)
    .send(createRDVDto)
    .expect(201);
});
```

#### Étape 2 : Frontend API Client

```typescript
// src/lib/api/rdv.ts
export const rdvApi = {
  async create(data: CreateRDVInput): Promise<RDV> {
    const response = await axios.post<RDV>('/api/v1/rdv', data);
    return response.data;
  },

  async getById(id: string): Promise<RDV> {
    const response = await axios.get<RDV>(`/api/v1/rdv/${id}`);
    return response.data;
  },

  // ... autres méthodes
};
```

#### Étape 3 : Frontend React Query Hook

```typescript
// src/lib/hooks/useRDVMutation.ts
export function useCreateRDV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rdvApi.create,
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['rdv'] });
      
      // Show success toast
      toast.success('RDV créé avec succès !');
    },
    onError: (error: AxiosError) => {
      // Show error toast
      toast.error(error.response?.data?.message || 'Erreur création RDV');
    }
  });
}
```

#### Étape 4 : Frontend UI Components

```typescript
// src/components/rdv/CreateRDVForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateRDV } from '@/lib/hooks/useRDVMutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const createRDVSchema = z.object({
  disponibilite_id: z.string().uuid(),
  immatriculation: z.string().min(2).max(10),
  vehicle_type: z.enum(['VP', 'VT', 'VU']),
  // ... validation complète
});

export function CreateRDVForm({ disponibiliteId }: Props) {
  const createRDV = useCreateRDV();

  const form = useForm({
    resolver: zodResolver(createRDVSchema),
    defaultValues: {
      disponibilite_id: disponibiliteId,
      immatriculation: '',
      vehicle_type: 'VP'
    }
  });

  const onSubmit = async (data: z.infer<typeof createRDVSchema>) => {
    await createRDV.mutateAsync(data);
    // Navigation après succès
    router.push(`/rdv/${data.id}`);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Formulaire complet avec tous les champs */}
      <Input
        {...form.register('immatriculation')}
        placeholder="AA-123-BB"
      />
      {form.formState.errors.immatriculation && (
        <p className="text-sm text-destructive">
          {form.formState.errors.immatriculation.message}
        </p>
      )}

      {/* ... autres champs */}

      <Button type="submit" disabled={createRDV.isPending}>
        {createRDV.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Créer RDV
      </Button>
    </form>
  );
}
```

#### Étape 5 : Frontend Page

```typescript
// src/app/(client)/reservation/[disponibiliteId]/page.tsx
import { CreateRDVForm } from '@/components/rdv/CreateRDVForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReservationPage({ params }: { params: { disponibiliteId: string } }) {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Réservation de votre contrôle technique</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateRDVForm disponibiliteId={params.disponibiliteId} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3.2 Liste Complète Parcours à Implémenter

**TOUS ces parcours DOIVENT être implémentés de bout en bout (Backend API + Frontend UI complet + Tests) :**

#### Parcours Grand Public (Client PWA)

```
1. Recherche Disponibilités
   Backend: POST /api/v1/disponibilites/search
   Frontend: 
   - Page recherche (/)
   - Composant SearchBar
   - Page résultats (/recherche)
   - Composant DisponibiliteCard
   - Map view avec markers
   
2. Prise RDV
   Backend: POST /api/v1/rdv
   Frontend:
   - Page réservation (/reservation/[disponibiliteId])
   - Composant CreateRDVForm
   - Validation Zod complète
   - États loading/error

3. Paiement
   Backend: POST /api/v1/payment/process
   Frontend:
   - Page paiement (/paiement/[rdvId])
   - Intégration Stripe Elements
   - Récapitulatif RDV
   - Page confirmation (/paiement/success)

4. Mes RDV
   Backend: GET /api/v1/rdv/me
   Frontend:
   - Page liste mes RDV (/mes-rdv)
   - Filtres (à venir, passés)
   - Page détails RDV (/mes-rdv/[id])

5. Modification RDV
   Backend: PUT /api/v1/rdv/:id
   Frontend:
   - Page modifier RDV (/mes-rdv/[id]/edit)
   - Form pré-rempli
   - Validation délai modification

6. Annulation RDV
   Backend: DELETE /api/v1/rdv/:id
   Frontend:
   - Dialog confirmation annulation
   - Gestion remboursement
   - Notification envoyée

7. Mon Profil
   Backend: GET/PUT /api/v1/users/me
   Frontend:
   - Page profil (/profil)
   - Form modification infos
   - Gestion véhicules
   - Paramètres notifications
```

#### Parcours Admin Tenant (Admin WebApp)

```
8. Dashboard Tenant
   Backend: GET /api/v1/admin/dashboard/stats
   Frontend:
   - Page dashboard (/tenant/dashboard)
   - KPI cards
   - Charts (Recharts)
   - Table activité

9. Gestion Users
   Backend: 
   - GET /api/v1/users
   - POST /api/v1/users
   - PUT /api/v1/users/:id
   - DELETE /api/v1/users/:id
   Frontend:
   - Page liste users (/tenant/users)
   - Page créer user (/tenant/users/new)
   - Page modifier user (/tenant/users/[id]/edit)
   - Dialog suppression

10. Gestion Agences
    Backend:
    - GET /api/v1/agences
    - POST /api/v1/agences
    - PUT /api/v1/agences/:id
    Frontend:
    - Page liste agences (/tenant/agences)
    - Page créer agence (/tenant/agences/new)
    - Map view agences
    - Page détails agence (/tenant/agences/[id])

11. Gestion CTs
    Backend:
    - GET /api/v1/cts
    - POST /api/v1/cts
    - PUT /api/v1/cts/:id
    Frontend:
    - Page liste CTs (/tenant/cts)
    - Page créer CT (/tenant/cts/new)
    - Configuration horaires
    - Types contrôles

12. Planning Global
    Backend: GET /api/v1/planning/global
    Frontend:
    - Page planning (/tenant/planning)
    - Calendrier tous CTs
    - Filtres (agence, CT, période)
    - Stats taux remplissage

13. Statistiques
    Backend: GET /api/v1/statistics/tenant
    Frontend:
    - Page stats (/tenant/statistics)
    - Charts revenus
    - Charts RDV
    - Taux conversion
    - Exports Excel/PDF

14. Paramètres Tenant
    Backend:
    - GET/PUT /api/v1/admin/tenant/settings
    Frontend:
    - Page paramètres généraux (/tenant/settings/general)
    - Page paramètres paiement (/tenant/settings/payment)
    - Page branding (/tenant/settings/branding)
```

#### Parcours Pro (Pro WebApp)

```
15. Planning CT (Admin CT)
    Backend:
    - GET /api/v1/planning/ct/:ctId
    - POST /api/v1/planning
    - PUT /api/v1/planning/:id
    - DELETE /api/v1/planning/:id
    Frontend:
    - Page planning (/pro/planning)
    - FullCalendar (drag & drop)
    - Dialog créer planning
    - Dialog bloquer créneau

16. Gestion Contrôleurs
    Backend:
    - GET /api/v1/controleurs
    - POST /api/v1/controleurs
    - PUT /api/v1/controleurs/:id
    Frontend:
    - Page liste contrôleurs (/pro/controleurs)
    - Page créer contrôleur (/pro/controleurs/new)
    - Page détails contrôleur (/pro/controleurs/[id])
    - Gestion disponibilités

17. RDV CT
    Backend: GET /api/v1/rdv/ct/:ctId
    Frontend:
    - Page liste RDV (/pro/rdv)
    - Filtres (statut, contrôleur)
    - Page détails RDV (/pro/rdv/[id])
    - Actions (valider, refuser)

18. Mon Planning (Contrôleur)
    Backend: GET /api/v1/planning/controleur/me
    Frontend:
    - Page mon planning (/pro/mon-planning)
    - Calendrier personnel
    - Liste RDV du jour
    - Modifier disponibilités
```

#### Parcours Call Center (Call Center WebApp)

```
19. Recherche Client
    Backend: GET /api/v1/clients/search?q=...
    Frontend:
    - Composant QuickSearch
    - Résultats temps réel (debounce)
    - Création client express

20. Prise RDV Assistée
    Backend: POST /api/v1/rdv (même que client)
    Frontend:
    - Wizard 3 étapes
    - Recherche disponibilités
    - Form client/véhicule
    - Confirmation

21. Gestion RDV
    Backend:
    - GET /api/v1/rdv/:id
    - PUT /api/v1/rdv/:id
    - DELETE /api/v1/rdv/:id
    Frontend:
    - Recherche RDV
    - Modifier RDV
    - Annuler RDV
    - Envoi confirmations

22. Historique Appels
    Backend: GET /api/v1/calls/me
    Frontend:
    - Liste appels traités
    - Filtres (date, statut)
    - Notes appels
```

#### Parcours Super Admin (Admin WebApp)

```
23. Gestion Tenants
    Backend:
    - GET /api/v1/admin/tenants
    - POST /api/v1/admin/tenants
    - PUT /api/v1/admin/tenants/:id
    - DELETE /api/v1/admin/tenants/:id
    Frontend:
    - Page liste tenants (/admin/tenants)
    - Page créer tenant (/admin/tenants/new)
    - Page détails tenant (/admin/tenants/[id])
    - Configuration tenant

24. Monitoring Plateforme
    Backend: GET /api/v1/admin/monitoring
    Frontend:
    - Page monitoring (/admin/monitoring)
    - Status services (health checks)
    - Métriques performances
    - Alertes

25. Facturation Tenants
    Backend:
    - GET /api/v1/admin/billing
    - POST /api/v1/admin/billing/generate
    Frontend:
    - Page facturation (/admin/billing)
    - Liste factures
    - Générer factures
    - Exports

26. Audit Logs
    Backend: GET /api/v1/admin/audit-logs
    Frontend:
    - Page logs (/admin/audit-logs)
    - Filtres (user, action, date)
    - Export logs
```

---

## 💾 PHASE 4 : SEED BASE DE DONNÉES

### 4.1 Scripts Seed à Créer

**Crée des scripts de seeding pour peupler la base avec des données réalistes :**

#### Seed Master Script

```typescript
// src/database/seeds/master.seed.ts
import { DataSource } from 'typeorm';
import { seedTenants } from './tenants.seed';
import { seedUsers } from './users.seed';
import { seedAgences } from './agences.seed';
import { seedCTs } from './cts.seed';
import { seedControleurs } from './controleurs.seed';
import { seedPlannings } from './plannings.seed';
import { seedRDV } from './rdv.seed';

export async function runAllSeeds(dataSource: DataSource) {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Seed Tenants (3 organismes)
    const tenants = await seedTenants(dataSource);
    console.log('✅ Tenants seeded');

    // 2. Seed Users (50 users total)
    const users = await seedUsers(dataSource, tenants);
    console.log('✅ Users seeded');

    // 3. Seed Agences (15 agences)
    const agences = await seedAgences(dataSource, tenants);
    console.log('✅ Agences seeded');

    // 4. Seed CTs (30 centres techniques)
    const cts = await seedCTs(dataSource, agences);
    console.log('✅ CTs seeded');

    // 5. Seed Contrôleurs (60 contrôleurs)
    const controleurs = await seedControleurs(dataSource, cts);
    console.log('✅ Contrôleurs seeded');

    // 6. Seed Plannings (90 jours de plannings)
    await seedPlannings(dataSource, cts, controleurs);
    console.log('✅ Plannings seeded');

    // 7. Seed RDV (500 RDV)
    await seedRDV(dataSource, users, cts);
    console.log('✅ RDV seeded');

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}
```

#### Seed Tenants

```typescript
// src/database/seeds/tenants.seed.ts
import { DataSource } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { faker } from '@faker-js/faker/locale/fr';

export async function seedTenants(dataSource: DataSource): Promise<Tenant[]> {
  const tenantRepository = dataSource.getRepository(Tenant);

  const tenants = [
    {
      name: 'Contrôle Auto France',
      domain: 'controle-auto-france.fr',
      status: 'active',
      subscription_plan: 'enterprise',
      max_users: 100,
      max_agences: 50,
      branding: {
        primary_color: '#2563eb',
        logo_url: 'https://placeholder.com/logo1.png'
      },
      payment_config: {
        stripe_account_id: 'acct_test_123',
        stripe_enabled: true,
        payzen_enabled: false
      },
      notification_config: {
        brevo_api_key: 'test_brevo_key',
        sms_mode_api_key: 'test_sms_key'
      }
    },
    {
      name: 'Auto Sécurité Pro',
      domain: 'auto-securite-pro.fr',
      status: 'active',
      subscription_plan: 'business',
      max_users: 50,
      max_agences: 20,
      branding: {
        primary_color: '#16a34a',
        logo_url: 'https://placeholder.com/logo2.png'
      }
    },
    {
      name: 'CT Express',
      domain: 'ct-express.fr',
      status: 'active',
      subscription_plan: 'starter',
      max_users: 20,
      max_agences: 5,
      branding: {
        primary_color: '#ea580c',
        logo_url: 'https://placeholder.com/logo3.png'
      }
    }
  ];

  const savedTenants: Tenant[] = [];
  for (const tenantData of tenants) {
    const tenant = tenantRepository.create(tenantData);
    const saved = await tenantRepository.save(tenant);
    savedTenants.push(saved);
  }

  return savedTenants;
}
```

#### Seed Users

```typescript
// src/database/seeds/users.seed.ts
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Tenant } from '../entities/tenant.entity';
import { faker } from '@faker-js/faker/locale/fr';
import * as bcrypt from 'bcrypt';

export async function seedUsers(
  dataSource: DataSource,
  tenants: Tenant[]
): Promise<User[]> {
  const userRepository = dataSource.getRepository(User);
  const users: User[] = [];

  // 1. Super Admin (Anthropic)
  users.push(
    userRepository.create({
      email: 'superadmin@anthropic.com',
      password: await bcrypt.hash('SuperAdmin123!', 12),
      first_name: 'Super',
      last_name: 'Admin',
      roles: ['SUPER_ADMIN'],
      permissions: ['*'], // All permissions
      is_active: true,
      email_verified: true
    })
  );

  // 2. Admin Tenant pour chaque tenant
  for (const tenant of tenants) {
    users.push(
      userRepository.create({
        email: `admin@${tenant.domain}`,
        password: await bcrypt.hash('Admin123!', 12),
        first_name: 'Admin',
        last_name: tenant.name.split(' ')[0],
        roles: ['ADMIN_TENANT'],
        permissions: ['tenant:*'],
        tenant_id: tenant.id,
        is_active: true,
        email_verified: true
      })
    );

    // 3. Call Center (2 par tenant)
    for (let i = 0; i < 2; i++) {
      users.push(
        userRepository.create({
          email: faker.internet.email(),
          password: await bcrypt.hash('CallCenter123!', 12),
          first_name: faker.person.firstName(),
          last_name: faker.person.lastName(),
          roles: ['CALL_CENTER'],
          permissions: ['rdv:create', 'rdv:read', 'rdv:update', 'client:create'],
          tenant_id: tenant.id,
          is_active: true,
          email_verified: true
        })
      );
    }

    // 4. Clients (10 par tenant)
    for (let i = 0; i < 10; i++) {
      users.push(
        userRepository.create({
          email: faker.internet.email(),
          password: await bcrypt.hash('Client123!', 12),
          first_name: faker.person.firstName(),
          last_name: faker.person.lastName(),
          phone: faker.phone.number('06########'),
          roles: ['CLIENT'],
          permissions: ['rdv:create:own', 'rdv:read:own', 'rdv:cancel:own'],
          tenant_id: tenant.id,
          is_active: true,
          email_verified: true
        })
      );
    }
  }

  return await userRepository.save(users);
}
```

#### Seed Agences

```typescript
// src/database/seeds/agences.seed.ts
import { DataSource } from 'typeorm';
import { Agence } from '../entities/agence.entity';
import { Tenant } from '../entities/tenant.entity';
import { faker } from '@faker-js/faker/locale/fr';

export async function seedAgences(
  dataSource: DataSource,
  tenants: Tenant[]
): Promise<Agence[]> {
  const agenceRepository = dataSource.getRepository(Agence);
  const agences: Agence[] = [];

  const cities = [
    { name: 'Paris', lat: 48.8566, lng: 2.3522 },
    { name: 'Lyon', lat: 45.7640, lng: 4.8357 },
    { name: 'Marseille', lat: 43.2965, lng: 5.3698 },
    { name: 'Toulouse', lat: 43.6047, lng: 1.4442 },
    { name: 'Nice', lat: 43.7102, lng: 7.2620 }
  ];

  for (const tenant of tenants) {
    // 5 agences par tenant
    for (let i = 0; i < 5; i++) {
      const city = cities[i % cities.length];
      agences.push(
        agenceRepository.create({
          name: `${tenant.name.split(' ')[0]} ${city.name}`,
          tenant_id: tenant.id,
          address: faker.location.streetAddress(),
          city: city.name,
          postal_code: faker.location.zipCode('75###'),
          latitude: city.lat,
          longitude: city.lng,
          phone: faker.phone.number('01########'),
          email: faker.internet.email(),
          is_active: true
        })
      );
    }
  }

  return await agenceRepository.save(agences);
}
```

#### Seed Plannings (90 jours)

```typescript
// src/database/seeds/plannings.seed.ts
import { DataSource } from 'typeorm';
import { Planning } from '../entities/planning.entity';
import { CT } from '../entities/ct.entity';
import { Controleur } from '../entities/controleur.entity';
import { addDays, format } from 'date-fns';

export async function seedPlannings(
  dataSource: DataSource,
  cts: CT[],
  controleurs: Controleur[]
): Promise<void> {
  const planningRepository = dataSource.getRepository(Planning);

  const today = new Date();

  // Pour chaque CT
  for (const ct of cts) {
    const ctControleurs = controleurs.filter(c => c.ct_id === ct.id);

    // Générer 90 jours de planning
    for (let day = 0; day < 90; day++) {
      const date = addDays(today, day);
      const dateStr = format(date, 'yyyy-MM-dd');

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }

      // Pour chaque contrôleur
      for (const controleur of ctControleurs) {
        // Morning: 08:00 - 12:00 (8 créneaux de 30 min)
        for (let slot = 0; slot < 8; slot++) {
          const startHour = 8 + Math.floor(slot / 2);
          const startMinute = (slot % 2) * 30;
          const endHour = startHour + (startMinute === 30 ? 1 : 0);
          const endMinute = (startMinute + 30) % 60;

          await planningRepository.save(
            planningRepository.create({
              tenant_id: ct.tenant_id,
              ct_id: ct.id,
              controleur_id: controleur.id,
              date: dateStr,
              start_time: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
              end_time: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
              is_available: true,
              is_blocked: false
            })
          );
        }

        // Afternoon: 14:00 - 18:00 (8 créneaux de 30 min)
        for (let slot = 0; slot < 8; slot++) {
          const startHour = 14 + Math.floor(slot / 2);
          const startMinute = (slot % 2) * 30;
          const endHour = startHour + (startMinute === 30 ? 1 : 0);
          const endMinute = (startMinute + 30) % 60;

          await planningRepository.save(
            planningRepository.create({
              tenant_id: ct.tenant_id,
              ct_id: ct.id,
              controleur_id: controleur.id,
              date: dateStr,
              start_time: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
              end_time: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
              is_available: true,
              is_blocked: false
            })
          );
        }
      }
    }
  }

  console.log(`✅ Generated plannings for 90 days across ${cts.length} CTs`);
}
```

#### Seed RDV (500 réservations)

```typescript
// src/database/seeds/rdv.seed.ts
import { DataSource } from 'typeorm';
import { RDV } from '../entities/rdv.entity';
import { User } from '../entities/user.entity';
import { CT } from '../entities/ct.entity';
import { Planning } from '../entities/planning.entity';
import { faker } from '@faker-js/faker/locale/fr';

export async function seedRDV(
  dataSource: DataSource,
  users: User[],
  cts: CT[]
): Promise<void> {
  const rdvRepository = dataSource.getRepository(RDV);
  const planningRepository = dataSource.getRepository(Planning);

  // Get clients only
  const clients = users.filter(u => u.roles.includes('CLIENT'));

  // Create 500 RDV
  for (let i = 0; i < 500; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)];
    const ct = cts[Math.floor(Math.random() * cts.length)];

    // Get random available planning
    const availablePlannings = await planningRepository.find({
      where: {
        ct_id: ct.id,
        is_available: true,
        is_blocked: false
      },
      take: 100
    });

    if (availablePlannings.length === 0) continue;

    const planning = availablePlannings[Math.floor(Math.random() * availablePlannings.length)];

    // Create RDV
    const rdv = rdvRepository.create({
      tenant_id: ct.tenant_id,
      client_id: client.id,
      ct_id: ct.id,
      controleur_id: planning.controleur_id,
      planning_id: planning.id,
      date: planning.date,
      start_time: planning.start_time,
      end_time: planning.end_time,
      vehicle: {
        immatriculation: faker.vehicle.vrm(),
        marque: faker.vehicle.manufacturer(),
        modele: faker.vehicle.model(),
        type: faker.helpers.arrayElement(['VP', 'VT', 'VU']),
        annee: faker.number.int({ min: 2000, max: 2024 })
      },
      control_type: faker.helpers.arrayElement(['CT', 'CT_CONTRE_VISITE', 'VT']),
      status: faker.helpers.arrayElement(['confirmed', 'completed', 'cancelled']),
      payment_status: faker.helpers.arrayElement(['paid', 'pending', 'refunded']),
      price: faker.number.float({ min: 50, max: 150, precision: 0.01 }),
      notes: faker.lorem.sentence()
    });

    await rdvRepository.save(rdv);

    // Mark planning as unavailable
    planning.is_available = false;
    await planningRepository.save(planning);
  }

  console.log('✅ Created 500 RDV');
}
```

#### Script d'Exécution Seed

```typescript
// src/database/seeds/run-seeds.ts
import { DataSource } from 'typeorm';
import { runAllSeeds } from './master.seed';
import { typeOrmConfig } from '../config/typeorm.config';

async function main() {
  const dataSource = new DataSource(typeOrmConfig);

  try {
    await dataSource.initialize();
    console.log('📦 Database connected');

    // Clear existing data (optional)
    const clearData = process.env.CLEAR_DATA === 'true';
    if (clearData) {
      console.log('🗑️  Clearing existing data...');
      await dataSource.query('TRUNCATE TABLE rdv CASCADE');
      await dataSource.query('TRUNCATE TABLE planning CASCADE');
      await dataSource.query('TRUNCATE TABLE controleurs CASCADE');
      await dataSource.query('TRUNCATE TABLE cts CASCADE');
      await dataSource.query('TRUNCATE TABLE agences CASCADE');
      await dataSource.query('TRUNCATE TABLE users CASCADE');
      await dataSource.query('TRUNCATE TABLE tenants CASCADE');
      console.log('✅ Data cleared');
    }

    // Run seeds
    await runAllSeeds(dataSource);

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

main();
```

**Commande d'exécution :**

```bash
# Dans package.json de chaque service backend
"scripts": {
  "seed": "ts-node src/database/seeds/run-seeds.ts",
  "seed:clear": "CLEAR_DATA=true ts-node src/database/seeds/run-seeds.ts"
}

# Exécution
npm run seed        # Ajoute les données
npm run seed:clear  # Clear puis ajoute les données
```

---

## ✅ PHASE 5 : TESTS END-TO-END

### 5.1 Tests E2E Critiques

**Écris des tests E2E pour TOUS les parcours utilisateurs :**

```typescript
// tests/e2e/parcours-client-complet.e2e-spec.ts
describe('Parcours Client Complet (E2E)', () => {
  let page: Page;
  let context: BrowserContext;

  beforeAll(async () => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterAll(async () => {
    await context.close();
  });

  test('Parcours complet : Recherche → RDV → Paiement → Confirmation', async () => {
    // 1. Home / Recherche
    await page.goto('http://localhost:3002');
    
    await page.fill('[data-testid="search-location"]', 'Paris');
    await page.click('[data-testid="date-picker"]');
    await page.click('[data-testid="date-today"]');
    await page.selectOption('[data-testid="vehicle-type"]', 'VP');
    await page.click('[data-testid="search-button"]');

    // 2. Résultats
    await page.waitForSelector('[data-testid="disponibilite-card"]');
    expect(await page.locator('[data-testid="disponibilite-card"]').count()).toBeGreaterThan(0);
    
    await page.click('[data-testid="disponibilite-card"]:first-child [data-testid="reserver-button"]');

    // 3. Formulaire Réservation
    await page.waitForSelector('[data-testid="reservation-form"]');
    
    await page.fill('[data-testid="first-name"]', 'Jean');
    await page.fill('[data-testid="last-name"]', 'Dupont');
    await page.fill('[data-testid="email"]', 'jean.dupont@test.com');
    await page.fill('[data-testid="phone"]', '0612345678');
    await page.fill('[data-testid="immatriculation"]', 'AA-123-BB');
    await page.fill('[data-testid="marque"]', 'Renault');
    await page.fill('[data-testid="modele"]', 'Clio');
    await page.selectOption('[data-testid="vehicle-type"]', 'VP');
    
    await page.click('[data-testid="confirm-button"]');

    // 4. Paiement
    await page.waitForSelector('[data-testid="payment-form"]');
    
    // Stripe test card
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    
    await page.click('[data-testid="pay-button"]');

    // 5. Confirmation
    await page.waitForSelector('[data-testid="confirmation-message"]');
    expect(await page.textContent('[data-testid="confirmation-message"]')).toContain('Votre rendez-vous est confirmé');
    
    // Vérifier RDV créé dans "Mes RDV"
    await page.click('[data-testid="nav-mes-rdv"]');
    await page.waitForSelector('[data-testid="rdv-card"]');
    expect(await page.locator('[data-testid="rdv-card"]').count()).toBeGreaterThan(0);
  });

  test('Annulation RDV', async () => {
    // ... test annulation
  });

  test('Modification RDV', async () => {
    // ... test modification
  });
});
```

### 5.2 Tests à Créer

**Liste complète des tests E2E à implémenter :**

```
□ Client PWA
  □ Parcours recherche → RDV → paiement → confirmation
  □ Annulation RDV
  □ Modification RDV
  □ Profil utilisateur
  □ Notifications push

□ Admin WebApp
  □ Création tenant
  □ Création utilisateur avec rôles
  □ Création agence
  □ Configuration CT
  □ Vue statistiques

□ Pro WebApp
  □ Création planning
  □ Affectation contrôleur
  □ Blocage créneau
  □ Validation RDV

□ Call Center WebApp
  □ Recherche client
  □ Création RDV assistée
  □ Modification RDV
  □ Envoi confirmations
```

---

## 📦 PHASE 6 : DÉPLOIEMENT & DOCUMENTATION

### 6.1 Checklist Déploiement Production

```
□ Environnements
  □ Development (local Docker Compose)
  □ Staging (Kubernetes cluster)
  □ Production (Kubernetes cluster)

□ CI/CD
  □ GitLab CI pipelines configurés
  □ Tests automatisés (unit + E2E)
  □ Security scans (SAST, DAST)
  □ Docker images build & push
  □ Deploy automatique staging
  □ Deploy manuel production

□ Infrastructure
  □ Terraform scripts
  □ Kubernetes manifests
  □ Helm charts
  □ Secrets management (Vault)
  □ Monitoring (Prometheus + Grafana)
  □ Logging (ELK/Loki)
  □ Alerting (Alertmanager)

□ Sécurité
  □ HTTPS (Let's Encrypt)
  □ WAF (Cloudflare/AWS WAF)
  □ Rate limiting
  □ IP whitelisting (admin endpoints)
  □ Secrets rotation
  □ Backups automatiques

□ Performance
  □ CDN (Cloudflare)
  □ Cache Redis cluster
  □ Database read replicas
  □ Kafka cluster
  □ Auto-scaling configuré

□ Compliance
  □ RGPD compliance
  □ Data retention policies
  □ Audit logs
  □ Terms of Service
  □ Privacy Policy
```

### 6.2 Documentation à Compléter

```
□ README.md (chaque repo)
  □ Description
  □ Stack technique
  □ Installation
  □ Configuration
  □ Lancement
  □ Tests
  □ Déploiement

□ API Documentation
  □ Swagger/OpenAPI specs
  □ Postman collections
  □ Exemples requêtes/réponses

□ Architecture Documentation
  □ Diagrammes C4 (Context, Container, Component)
  □ Sequence diagrams
  □ Data flow diagrams
  □ Infrastructure diagrams

□ User Guides
  □ Guide Admin Tenant
  □ Guide Contrôleur
  □ Guide Call Center
  □ FAQ

□ Developer Guides
  □ Contribution guide
  □ Code conventions
  □ Git workflow
  □ Release process
```

---

## 🎯 LIVRABLES FINAUX ATTENDUS

À l'issue de ce prompt, tu dois fournir :

### 1. Rapport d'Audit Complet

```markdown
# RAPPORT AUDIT PTI CALENDAR V4

## Résumé Exécutif
- Taux de conformité global : X%
- Écarts majeurs identifiés : X
- Corrections appliquées : X
- Implémentations ajoutées : X

## Audit Structurel
### Repositories
- [✅/❌] 18 repositories créés
- [✅/❌] Structure conforme
- [Liste écarts]

### Backend Services
- [✅/❌] Planning Service
- [✅/❌] RDV Service
- [etc.]
- [Liste écarts par service]

### Frontend Applications
- [✅/❌] Admin WebApp
- [✅/❌] Client PWA
- [etc.]
- [Liste écarts par app]

## Audit Fonctionnel
- [✅/❌] Parcours recherche RDV
- [✅/❌] Parcours paiement
- [etc.]
- [Liste use cases manquants]

## Audit Technique
### Sécurité
- [✅/❌] JWT authentication
- [✅/❌] RBAC complet
- [etc.]

### Performance
- [✅/❌] Cache Redis
- [✅/❌] Database indexes
- [etc.]

## Plan d'Action
1. [Correction 1]
2. [Implémentation 2]
3. [etc.]
```

### 2. Code Complet Tous Parcours

**Structure attendue :**

```
corrections-implementations/
├── backend/
│   ├── planning-service/
│   │   ├── src/
│   │   │   ├── application/
│   │   │   ├── domain/
│   │   │   ├── infrastructure/
│   │   │   └── ... [code complet]
│   │   ├── test/
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   ├── rdv-service/
│   ├── payment-service/
│   └── ... [tous les services]
│
├── frontend/
│   ├── admin-webapp/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (admin)/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── tenants/
│   │   │   │   │   └── ... [toutes pages]
│   │   │   │   └── (tenant-admin)/
│   │   │   │       └── ... [toutes pages]
│   │   │   ├── components/
│   │   │   │   └── ... [tous composants]
│   │   │   └── lib/
│   │   ├── tests/
│   │   └── README.md
│   │
│   ├── client-pwa/
│   ├── pro-webapp/
│   ├── callcenter-webapp/
│   └── design-system/
│
├── infrastructure/
│   ├── terraform/
│   ├── kubernetes/
│   └── scripts/
│
└── database/
    └── seeds/
```

### 3. Base de Données Peuplée

```sql
-- Résumé données insérées
SELECT
  (SELECT COUNT(*) FROM tenants) as tenants_count,        -- 3
  (SELECT COUNT(*) FROM users) as users_count,            -- 50+
  (SELECT COUNT(*) FROM agences) as agences_count,        -- 15
  (SELECT COUNT(*) FROM cts) as cts_count,                -- 30
  (SELECT COUNT(*) FROM controleurs) as controleurs_count, -- 60
  (SELECT COUNT(*) FROM planning) as plannings_count,     -- ~14400 (90j × 30 CTs × ~16 créneaux)
  (SELECT COUNT(*) FROM rdv) as rdv_count;                -- 500
```

### 4. Tests E2E Complets

```
tests/
├── e2e/
│   ├── client-pwa/
│   │   ├── parcours-complet.e2e.ts       [✅ PASS]
│   │   ├── annulation-rdv.e2e.ts         [✅ PASS]
│   │   └── modification-rdv.e2e.ts       [✅ PASS]
│   │
│   ├── admin-webapp/
│   │   ├── gestion-tenants.e2e.ts        [✅ PASS]
│   │   ├── gestion-users.e2e.ts          [✅ PASS]
│   │   └── statistiques.e2e.ts           [✅ PASS]
│   │
│   ├── pro-webapp/
│   │   ├── planning-ct.e2e.ts            [✅ PASS]
│   │   └── gestion-controleurs.e2e.ts    [✅ PASS]
│   │
│   └── callcenter-webapp/
│       └── prise-rdv-assistee.e2e.ts     [✅ PASS]
│
└── coverage/
    └── e2e-report.html                    [Coverage: >80%]
```

### 5. Documentation Complète

```
documentation/
├── architecture/
│   ├── C4-diagrams.pdf
│   ├── sequence-diagrams.pdf
│   └── infrastructure.pdf
│
├── api/
│   ├── swagger.json
│   └── postman-collection.json
│
├── user-guides/
│   ├── admin-tenant-guide.pdf
│   ├── controleur-guide.pdf
│   └── callcenter-guide.pdf
│
└── developer/
    ├── contribution-guide.md
    ├── code-conventions.md
    └── deployment-guide.md
```

---

## ⚠️ CRITÈRES DE SUCCÈS

**Pour valider que la plateforme est COMPLÈTE et CONFORME, vérifie :**

### ✅ Conformité Architecture V4

```
□ 18 repositories Git créés et structurés
□ Multi-repo avec CI/CD indépendant
□ Microservices backend NestJS (Clean Architecture + CQRS)
□ Frontend Next.js 14 App Router
□ API Gateway Kong configuré
□ PostgreSQL + RLS actif
□ Redis cache
□ Kafka event bus
□ Design System npm package publié
```

### ✅ Sécurité Complète

```
□ JWT RS256 avec refresh tokens
□ RBAC 8 rôles implémenté
□ Tenant isolation RLS
□ Kong security plugins
□ Rate limiting
□ Tests sécurité passés
```

### ✅ Tous Parcours Implémentés

```
□ 26 parcours utilisateurs codés de bout en bout
□ Frontend UI complet + Backend API + Database
□ Validations formulaires Zod
□ États loading/error gérés
□ Notifications temps réel
□ Tests E2E tous parcours passés
```

### ✅ Base Données Peuplée

```
□ 3 tenants
□ 50+ users (tous rôles)
□ 15 agences
□ 30 CTs
□ 60 contrôleurs
□ 14400+ créneaux planning (90 jours)
□ 500 RDV
```

### ✅ Qualité Code

```
□ TypeScript strict mode
□ ESLint/Prettier configurés
□ Conventions respectées
□ Code uniformisé
□ Tests >80% coverage
□ Documentation README.md
```

### ✅ Production Ready

```
□ Docker images optimisées
□ CI/CD GitLab configuré
□ Kubernetes manifests
□ Terraform IaC
□ Monitoring Prometheus/Grafana
□ Logs centralisés
□ Alerting configuré
□ Backups automatiques
```

---

## 🚀 COMMANDES D'EXÉCUTION

**Une fois toutes les corrections et implémentations faites, valide avec :**

```bash
# 1. Install dependencies (tous repos)
./scripts/install-all.sh

# 2. Seed database
npm run seed:clear  # Dans chaque backend service

# 3. Start infrastructure
docker-compose -f docker-compose.dev.yml up -d

# 4. Start all services
./scripts/start-all.sh

# 5. Run tests E2E
npm run test:e2e    # Dans chaque frontend app

# 6. Check conformité
./scripts/check-conformity.sh  # Script à créer qui vérifie tous les critères

# 7. Generate documentation
./scripts/generate-docs.sh

# 8. Deploy staging
./scripts/deploy-staging.sh

# 9. Run smoke tests production
npm run test:smoke
```

---

## 📝 FORMAT RÉPONSE ATTENDU

Réponds dans cet ordre :

### 1. Résumé Exécutif

```
✅ Conformité Architecture V4 : XX%
✅ Parcours implémentés : XX/26
✅ Tests passés : XX/XX
✅ Base données : XX users, XX RDV
⚠️ Points d'attention : [liste]
```

### 2. Audit Détaillé

```
[Rapport complet audit avec écarts identifiés]
```

### 3. Corrections Appliquées

```
[Liste toutes corrections avec code avant/après]
```

### 4. Implémentations Ajoutées

```
[Liste toutes nouvelles fonctionnalités avec code complet]
```

### 5. Seed Database

```
[Scripts seed + résumé données insérées]
```

### 6. Tests E2E

```
[Liste tests + résultats]
```

### 7. Documentation

```
[README, guides, diagrammes]
```

### 8. Next Steps

```
[Ce qu'il reste à faire si applicable]
```

---

## ⚡ COMMENCE MAINTENANT

**Examine le code existant dans `/mnt/project/` et commence l'audit et l'implémentation complète !**

**Rappel des priorités :**
1. 🔥 **CRITICAL** : Fronts complets reliés backends + database
2. 🔥 **CRITICAL** : Seed database avec vraies données
3. 🔥 **CRITICAL** : Tous parcours end-to-end implémentés
4. ⚠️ Conformité Architecture V4
5. ⚠️ Tests E2E tous parcours
6. ℹ️ Documentation complète

**Let's build the complete platform! 🚀**
