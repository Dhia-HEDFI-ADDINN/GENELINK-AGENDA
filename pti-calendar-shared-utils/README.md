# Shared Utils

## PTI Calendar Solution - Utilitaires Partagés

**Package :** @pti-calendar/shared-utils
**Version :** 1.0.0

---

## Description

Ce package contient les fonctions utilitaires partagées entre les différents services et applications de la plateforme PTI Calendar.

---

## Installation

```bash
# Depuis le monorepo
pnpm add @pti-calendar/shared-utils

# Ou dans package.json
"@pti-calendar/shared-utils": "workspace:*"
```

---

## Utilisation

```typescript
import {
  formatDate,
  formatPrice,
  calculateDureeControle,
  validateImmatriculation
} from '@pti-calendar/shared-utils';

// Formatage de date
const dateStr = formatDate(new Date(), 'dd/MM/yyyy');

// Formatage de prix
const priceStr = formatPrice(7900); // "79,00 €"

// Calcul durée contrôle
const duree = calculateDureeControle('CTP', 'VL', 'Essence'); // 35

// Validation immatriculation
const isValid = validateImmatriculation('AB-123-CD'); // true
```

---

## Fonctions Disponibles

### Date Utils

```typescript
// Formatage
formatDate(date: Date, format: string): string
formatTime(date: Date): string
formatDateTime(date: Date): string

// Parsing
parseDate(str: string): Date
parseTime(str: string): Date

// Calculs
addDays(date: Date, days: number): Date
addHours(date: Date, hours: number): Date
diffInMinutes(date1: Date, date2: Date): number
isWeekend(date: Date): boolean
isFerie(date: Date): boolean
```

### Price Utils

```typescript
// Formatage
formatPrice(centimes: number): string
formatPriceHT(centimes: number): string

// Calculs
calculateTTC(ht: number, tva: number): number
calculateHT(ttc: number, tva: number): number
calculateTVA(ht: number, tva: number): number
```

### Validation Utils

```typescript
// Véhicule
validateImmatriculation(immat: string): boolean
formatImmatriculation(immat: string): string

// Contact
validateEmail(email: string): boolean
validatePhone(phone: string): boolean
formatPhone(phone: string): string

// Général
validateCodePostal(cp: string): boolean
```

### Contrôle Utils

```typescript
// Durées
calculateDureeControle(
  typeControle: TypeControle,
  typeVehicule: TypeVehicule,
  carburant: Carburant
): number

// Tarifs
getTarifControle(
  typeControle: TypeControle,
  typeVehicule: TypeVehicule,
  carburant: Carburant
): number
```

### String Utils

```typescript
slugify(str: string): string
capitalize(str: string): string
truncate(str: string, length: number): string
sanitize(str: string): string
```

### Crypto Utils

```typescript
hashPassword(password: string): Promise<string>
verifyPassword(password: string, hash: string): Promise<boolean>
generateToken(length: number): string
generateUUID(): string
```

---

## Structure

```
pti-calendar-shared-utils/
├── src/
│   ├── date/
│   │   └── index.ts
│   ├── price/
│   │   └── index.ts
│   ├── validation/
│   │   └── index.ts
│   ├── controle/
│   │   └── index.ts
│   ├── string/
│   │   └── index.ts
│   ├── crypto/
│   │   └── index.ts
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

## Tests

```bash
pnpm test
```

---

## Matrice des Durées

```typescript
const DUREES_CONTROLE = {
  CTP: {
    VL: { Essence: 35, Diesel: 40, Electrique: 30, Gaz: 45, Hybride: 40 },
    L: { Essence: 60, Diesel: 65, Electrique: 55, Gaz: 70, Hybride: 65 }
  },
  CVP: {
    VL: { Essence: 25, Diesel: 30, Electrique: 20, Gaz: 35, Hybride: 30 },
    L: { Essence: 45, Diesel: 50, Electrique: 40, Gaz: 55, Hybride: 50 }
  },
  CV: {
    VL: { Essence: 20, Diesel: 25, Electrique: 15, Gaz: 30, Hybride: 25 },
    L: { Essence: 40, Diesel: 45, Electrique: 35, Gaz: 50, Hybride: 45 }
  }
};
```

---

## Jours Fériés France

```typescript
const JOURS_FERIES_2024 = [
  '2024-01-01', // Jour de l'An
  '2024-04-01', // Lundi de Pâques
  '2024-05-01', // Fête du Travail
  '2024-05-08', // Victoire 1945
  '2024-05-09', // Ascension
  '2024-05-20', // Lundi de Pentecôte
  '2024-07-14', // Fête Nationale
  '2024-08-15', // Assomption
  '2024-11-01', // Toussaint
  '2024-11-11', // Armistice
  '2024-12-25', // Noël
];
```
