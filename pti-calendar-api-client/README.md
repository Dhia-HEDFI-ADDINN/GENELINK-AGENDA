# API Client

## PTI Calendar Solution - Client API pour Applications Frontend

**Package :** @pti-calendar/api-client
**Version :** 1.0.0

---

## Description

Client API unifié pour toutes les applications frontend de la plateforme PTI Calendar. Inclut également un module d'audit intégré.

---

## Installation

```bash
pnpm add @pti-calendar/api-client
```

---

## Utilisation

### Configuration

```typescript
import { ApiClient } from '@pti-calendar/api-client';

const api = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000
});

// Avec token d'authentification
api.setAuthToken(token);
```

### Services Disponibles

```typescript
// Authentification
await api.auth.login(email, password);
await api.auth.logout();
await api.auth.refreshToken();

// Utilisateurs
await api.users.getMe();
await api.users.update(userId, data);

// Centres
await api.centres.search(codePostal, lat, lng);
await api.centres.getById(centreId);

// Disponibilités
await api.disponibilites.get({
  centre_id,
  date,
  type_controle,
  type_vehicule,
  carburant
});

// RDV
await api.rdv.create(data);
await api.rdv.getById(rdvId);
await api.rdv.update(rdvId, data);
await api.rdv.cancel(rdvId, motif);

// Paiements
await api.payment.createIntent(rdvId, amount);
await api.payment.confirm(paymentIntentId);
```

---

## Module Audit

### Hook React

```typescript
import { useAudit } from '@pti-calendar/api-client';

function MyComponent() {
  const { logEvent, logPageView, logError } = useAudit({
    appName: 'client-pwa',
    autoPageView: true,
    autoErrorTracking: true
  });

  const handleRdvCreated = async (rdv) => {
    await logEvent({
      action: 'RDV_CREATED',
      entity_type: 'rdv',
      entity_id: rdv.id
    });
  };
}
```

### Client Direct

```typescript
import { getAuditClient } from '@pti-calendar/api-client';

const audit = getAuditClient('admin-webapp');

// Log d'événement
await audit.log({
  action: 'USER_LOGIN',
  entity_type: 'user',
  entity_id: userId,
  metadata: { method: 'email' }
});

// Méthodes spécialisées
await audit.logRdvCreated(rdvId, metadata);
await audit.logRdvModified(rdvId, changes);
await audit.logRdvCancelled(rdvId, motif);
await audit.logPayment(paymentId, status, amount);
await audit.logLogin(userId, method);
await audit.logError(error, metadata);
```

---

## React Query

Le client est compatible avec React Query :

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { ApiClient } from '@pti-calendar/api-client';

const api = new ApiClient({ baseURL: '/api' });

// Query
const { data: centres } = useQuery({
  queryKey: ['centres', codePostal],
  queryFn: () => api.centres.search(codePostal)
});

// Mutation
const createRdv = useMutation({
  mutationFn: (data) => api.rdv.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['rdv']);
  }
});
```

---

## Gestion des Erreurs

```typescript
import { ApiError, isApiError } from '@pti-calendar/api-client';

try {
  await api.rdv.create(data);
} catch (error) {
  if (isApiError(error)) {
    console.error('API Error:', error.code, error.message);
    // Codes: UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR, etc.
  }
}
```

---

## Intercepteurs

```typescript
// Request interceptor
api.addRequestInterceptor((config) => {
  config.headers['X-Tenant-ID'] = tenantId;
  return config;
});

// Response interceptor
api.addResponseInterceptor(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
    }
    return Promise.reject(error);
  }
);
```

---

## Types

```typescript
import type {
  Rdv,
  Centre,
  User,
  Creneau,
  CreateRdvDto,
  ApiResponse,
  PaginatedResponse
} from '@pti-calendar/api-client';
```

---

## Structure

```
pti-calendar-api-client/
├── src/
│   ├── client.ts           # Client principal
│   ├── services/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── centres.ts
│   │   ├── disponibilites.ts
│   │   ├── rdv.ts
│   │   └── payment.ts
│   ├── audit.ts            # Client audit
│   ├── hooks/
│   │   └── useAudit.ts     # Hook React
│   ├── errors.ts           # Gestion erreurs
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

## Build

```bash
pnpm build
```
