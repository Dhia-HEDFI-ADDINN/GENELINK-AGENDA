# Admin WebApp

## PTI Calendar Solution - Application Administration SGS

**Port :** 3002
**Framework :** Next.js 14 (App Router)
**Utilisateurs :** Administrateurs SGS, Gestionnaires Réseau

---

## Description

Application d'administration globale de la plateforme PTI Calendar pour SGS France.

### Fonctionnalités

- Dashboard multi-centres consolidé
- Gestion des réseaux partenaires
- Gestion des centres
- Gestion des utilisateurs et rôles
- Audit et traçabilité
- Monitoring système
- Rapports et statistiques

---

## Démarrage Rapide

### Installation

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

L'application démarre sur http://localhost:3002

### Variables d'Environnement

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development
```

---

## Structure du Projet

```
pti-calendar-admin-webapp/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── dashboard/
│   │   │   ├── page.tsx           # Dashboard global
│   │   │   ├── reseaux/           # Gestion réseaux
│   │   │   ├── centres/
│   │   │   │   └── [id]/          # Détail centre
│   │   │   ├── utilisateurs/      # Gestion utilisateurs
│   │   │   ├── audit/             # Logs d'audit
│   │   │   ├── monitoring/        # Monitoring système
│   │   │   └── rapports/          # Rapports & stats
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── dashboard/
│   │   ├── centres/
│   │   ├── utilisateurs/
│   │   ├── audit/
│   │   └── monitoring/
│   │
│   └── lib/
│
└── package.json
```

---

## Modules

### Dashboard Global

Vue consolidée de tous les centres :
- KPIs temps réel
- RDV du jour
- Taux de remplissage
- Alertes système

### Gestion des Réseaux

CRUD complet des réseaux partenaires :
- SECURITEST
- AUTO SÉCURITÉ
- Vérif'Auto

### Gestion des Centres

Pour chaque centre :
- Informations générales
- Configuration (lignes, agréments)
- Horaires d'ouverture
- Tarification
- Équipe (contrôleurs)

### Gestion des Utilisateurs

- Création de comptes
- Attribution de rôles
- Gestion des permissions
- Désactivation

### Audit

Consultation des logs d'audit :
- Filtres par action, utilisateur, date
- Export CSV/JSON
- Alertes de sécurité

### Monitoring

Surveillance système :
- Santé des services
- Métriques de performance
- Utilisation des ressources
- Alertes

### Rapports

Statistiques et exports :
- Rapports d'activité
- Statistiques RDV
- Chiffre d'affaires
- Performance par centre

---

## Rôles et Accès

### Admin SGS Global

Accès complet à toutes les fonctionnalités :
- Tous les réseaux
- Tous les centres
- Tous les utilisateurs
- Configuration globale

### Admin Réseau

Accès limité à son réseau :
- Centres de son réseau uniquement
- Utilisateurs de son réseau
- Statistiques réseau

---

## Comptes de Test

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@sgs-france.fr | Admin123! | ADMIN_SGS |
| gestionnaire@securitest.fr | Gestionnaire123! | ADMIN_RESEAU |

---

## Composants Principaux

### CentreConfigForm

Configuration complète d'un centre.

```tsx
<CentreConfigForm
  centreId={centreId}
  onSave={async (config) => {
    await updateCentreConfig(centreId, config);
    toast.success('Configuration sauvegardée');
  }}
/>
```

### AuditLogViewer

Visualisation des logs d'audit.

```tsx
<AuditLogViewer
  filters={{
    dateRange: [startDate, endDate],
    actionType: 'USER_LOGIN',
    severity: 'WARNING'
  }}
  onExport={(format) => exportAuditLogs(filters, format)}
/>
```

### SystemMonitor

Monitoring temps réel.

```tsx
<SystemMonitor
  services={['user', 'rdv', 'planning', 'payment']}
  refreshInterval={30000}
/>
```

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
docker build -t pti-admin-webapp .
docker run -p 3002:3000 pti-admin-webapp
```
