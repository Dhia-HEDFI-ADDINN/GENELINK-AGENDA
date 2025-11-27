# Shared Types

## PTI Calendar Solution - Types TypeScript Partagés

**Package :** @pti-calendar/shared-types
**Version :** 1.0.0

---

## Description

Ce package contient tous les types TypeScript partagés entre les différents services et applications de la plateforme PTI Calendar.

---

## Installation

```bash
# Depuis le monorepo
pnpm add @pti-calendar/shared-types

# Ou dans package.json
"@pti-calendar/shared-types": "workspace:*"
```

---

## Utilisation

```typescript
import {
  User,
  Rdv,
  Centre,
  TypeControle,
  RdvStatut
} from '@pti-calendar/shared-types';

const rdv: Rdv = {
  id: 'uuid',
  centre_id: 'uuid',
  date: '2024-12-15',
  heure_debut: '09:00',
  type_controle: TypeControle.CTP,
  statut: RdvStatut.RESERVE,
  // ...
};
```

---

## Types Disponibles

### Entités Principales

- `User` - Utilisateur
- `Role` - Rôle utilisateur
- `Centre` - Centre de contrôle
- `Reseau` - Réseau partenaire
- `Rdv` - Rendez-vous
- `Creneau` - Créneau horaire
- `Controleur` - Contrôleur technique
- `Vehicule` - Véhicule
- `Payment` - Paiement

### Enums

- `TypeControle` - CTP, CVP, CV
- `TypeVehicule` - VL, L
- `Carburant` - Essence, Diesel, Gaz, Electrique, Hybride
- `RdvStatut` - RESERVE, CONFIRME, ARRIVE, EN_COURS, TERMINE, ANNULE, NO_SHOW
- `PaymentStatut` - PENDING, PROCESSING, SUCCEEDED, FAILED, CANCELLED, REFUNDED
- `RoleCode` - ADMIN_SGS, ADMIN_RESEAU, GESTIONNAIRE_CENTRE, CONTROLEUR, CALLCENTER, CLIENT

### DTOs

- `CreateRdvDto`
- `UpdateRdvDto`
- `CreateUserDto`
- `UpdateUserDto`
- `CreateCentreDto`
- `DisponibilitesQueryDto`

### Responses

- `ApiResponse<T>`
- `PaginatedResponse<T>`
- `ErrorResponse`

---

## Structure

```
pti-calendar-shared-types/
├── src/
│   ├── entities/
│   │   ├── user.ts
│   │   ├── rdv.ts
│   │   ├── centre.ts
│   │   └── ...
│   ├── enums/
│   │   ├── type-controle.ts
│   │   ├── rdv-statut.ts
│   │   └── ...
│   ├── dtos/
│   │   ├── rdv.dto.ts
│   │   ├── user.dto.ts
│   │   └── ...
│   ├── responses/
│   │   └── api-response.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

## Build

```bash
pnpm build
```

---

## Types Détaillés

### User

```typescript
export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role: Role;
  tenant_id?: string;
  centre_id?: string;
  actif: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### Rdv

```typescript
export interface Rdv {
  id: string;
  tenant_id: string;
  centre_id: string;
  controleur_id?: string;
  ligne_id: string;

  date: string;
  heure_debut: string;
  heure_fin: string;

  type_controle: TypeControle;
  client: Client;
  vehicule: Vehicule;

  statut: RdvStatut;
  montant_ttc: number;
  paye: boolean;

  resultat?: 'FAVORABLE' | 'DEFAVORABLE' | 'CONTRE_VISITE';
  source: 'WEB' | 'PWA' | 'CALLCENTER' | 'CENTRE';

  created_at: Date;
  updated_at: Date;
}
```

### Centre

```typescript
export interface Centre {
  id: string;
  reseau_id: string;
  code: string;
  nom: string;

  adresse: {
    rue: string;
    code_postal: string;
    ville: string;
    latitude: number;
    longitude: number;
  };

  contact: {
    telephone: string;
    email: string;
  };

  configuration: CentreConfiguration;
  horaires: Horaire[];
  tarifs: Tarif[];

  actif: boolean;
}
```
