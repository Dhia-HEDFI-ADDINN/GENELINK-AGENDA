# Audit Service

## PTI Calendar Solution - Microservice Audit et Traçabilité

**Port :** 4006
**Framework :** NestJS 10+
**Base de données :** PostgreSQL (schema: pti_audit)

---

## Description

L'Audit Service assure la traçabilité complète de toutes les actions sur la plateforme.

### Responsabilités

- Enregistrement des événements d'audit
- Traçabilité des actions utilisateur
- Logs de sécurité
- Analyse des comportements
- Export pour conformité RGPD
- Rétention paramétrable

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
PORT=4006
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=pti_audit
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092

# Rétention (jours)
AUDIT_RETENTION_DAYS=365
```

---

## API Endpoints

### Audit Logs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/v1/audit | Liste des événements |
| GET | /api/v1/audit/:id | Détail d'un événement |
| POST | /api/v1/audit | Enregistrer un événement |
| POST | /api/v1/audit/batch | Enregistrer plusieurs événements |

### Recherche

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/v1/audit/search | Recherche avancée |
| GET | /api/v1/audit/user/:userId | Actions d'un utilisateur |
| GET | /api/v1/audit/entity/:type/:id | Actions sur une entité |

### Export

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/v1/audit/export | Export CSV/JSON |
| GET | /api/v1/audit/report | Rapport d'activité |

### Sécurité

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/v1/audit/security | Événements de sécurité |
| GET | /api/v1/audit/failed-logins | Tentatives échouées |

---

## Types d'Événements

### Actions Utilisateur

| Code | Description |
|------|-------------|
| USER_LOGIN | Connexion utilisateur |
| USER_LOGOUT | Déconnexion utilisateur |
| USER_LOGIN_FAILED | Échec de connexion |
| USER_CREATED | Utilisateur créé |
| USER_UPDATED | Utilisateur modifié |
| USER_DELETED | Utilisateur supprimé |

### Actions RDV

| Code | Description |
|------|-------------|
| RDV_CREATED | RDV créé |
| RDV_UPDATED | RDV modifié |
| RDV_CANCELLED | RDV annulé |
| RDV_CHECKIN | Check-in client |
| RDV_STARTED | Contrôle démarré |
| RDV_COMPLETED | Contrôle terminé |

### Actions Paiement

| Code | Description |
|------|-------------|
| PAYMENT_INITIATED | Paiement initié |
| PAYMENT_COMPLETED | Paiement réussi |
| PAYMENT_FAILED | Paiement échoué |
| PAYMENT_REFUNDED | Remboursement |

### Actions Admin

| Code | Description |
|------|-------------|
| CENTRE_CREATED | Centre créé |
| CENTRE_UPDATED | Centre modifié |
| CONFIG_CHANGED | Configuration modifiée |
| EXPORT_DATA | Export de données |

---

## Modèle de Données

### AuditEvent

```typescript
interface AuditEvent {
  id: string;
  tenant_id?: string;

  // Action
  action: string;
  entity_type: string;
  entity_id: string;

  // Acteur
  user_id?: string;
  user_email?: string;
  user_role?: string;

  // Contexte
  ip_address?: string;
  user_agent?: string;
  session_id?: string;

  // Détails
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata?: Record<string, any>;

  // Sécurité
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

  // Timestamps
  created_at: Date;
}
```

---

## Events Kafka Consommés

Le service écoute tous les topics pour capturer les événements :

- `rdv.events`
- `payment.events`
- `user.events`
- `centre.events`
- `planning.events`

---

## Rétention des Données

```typescript
// Politique de rétention
const retentionPolicies = {
  'INFO': 90,      // 90 jours
  'WARNING': 180,  // 6 mois
  'ERROR': 365,    // 1 an
  'CRITICAL': 730, // 2 ans
  'SECURITY': 1095 // 3 ans (conformité)
};

// Job de nettoyage quotidien
@Cron('0 2 * * *')
async cleanupOldLogs() {
  for (const [severity, days] of Object.entries(retentionPolicies)) {
    await this.auditRepository.deleteOlderThan(severity, days);
  }
}
```

---

## Conformité RGPD

### Export des Données Personnelles

```bash
GET /api/v1/audit/export?user_id=xxx&format=json
```

### Anonymisation

```bash
POST /api/v1/audit/anonymize
{
  "user_id": "xxx"
}
```

---

## Alertes de Sécurité

Le service génère des alertes pour :

- 5+ échecs de connexion consécutifs
- Accès depuis IP inhabituelle
- Actions sensibles (export, suppression)
- Modifications de permissions

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
curl http://localhost:4006/health
```
