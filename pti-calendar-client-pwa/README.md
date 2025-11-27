# Client PWA

## PTI Calendar Solution - Application Client Particulier

**Port :** 3000
**Framework :** Next.js 14 (App Router)
**Type :** Progressive Web App (PWA)

---

## Description

Application mobile-first permettant aux clients particuliers de prendre rendez-vous pour leur contrôle technique.

### Fonctionnalités

- Recherche de centres par géolocalisation
- Affichage des créneaux disponibles
- Réservation en ligne
- Paiement sécurisé (Stripe)
- Gestion des rendez-vous
- Notifications push
- Mode hors-ligne (PWA)

---

## Démarrage Rapide

### Prérequis

- Node.js 20+
- pnpm 8+

### Installation

```bash
# Installation des dépendances
pnpm install

# Configuration
cp .env.example .env.local

# Démarrage en développement
pnpm dev
```

L'application démarre sur http://localhost:3000

### Variables d'Environnement

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Google Maps (géolocalisation)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx

# Analytics
NEXT_PUBLIC_GA_ID=G-xxx
```

---

## Structure du Projet

```
pti-calendar-client-pwa/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── (public)/           # Pages publiques
│   │   │   ├── page.tsx        # Accueil
│   │   │   ├── centres/        # Recherche centres
│   │   │   └── rdv/            # Prise de RDV
│   │   │       └── [id]/       # Détail RDV
│   │   ├── (auth)/             # Pages authentifiées
│   │   │   ├── mes-rdv/        # Mes rendez-vous
│   │   │   └── profil/         # Mon profil
│   │   ├── layout.tsx          # Layout racine
│   │   └── globals.css         # Styles globaux
│   │
│   ├── components/             # Composants React
│   │   ├── ui/                 # Design System
│   │   ├── centres/            # Composants centres
│   │   ├── rdv/                # Composants RDV
│   │   └── payment/            # Composants paiement
│   │
│   ├── lib/                    # Utilitaires
│   │   ├── api/                # Client API
│   │   ├── hooks/              # Custom hooks
│   │   └── stores/             # Zustand stores
│   │
│   └── types/                  # Types TypeScript
│
├── public/
│   ├── manifest.json           # PWA Manifest
│   ├── sw.js                   # Service Worker
│   └── icons/                  # Icônes PWA
│
└── package.json
```

---

## Parcours Utilisateur

### 1. Recherche de Centre

```
Accueil → Saisie Code Postal / Géolocalisation
        → Liste des centres à proximité
        → Sélection d'un centre
```

### 2. Prise de RDV

```
Centre sélectionné → Choix du type de contrôle
                   → Choix de la date
                   → Choix du créneau
                   → Saisie informations client
                   → Saisie informations véhicule
                   → Paiement (Stripe)
                   → Confirmation
```

### 3. Gestion RDV

```
Mes RDV → Liste des rendez-vous
        → Détail RDV (QR Code, infos)
        → Modifier / Annuler
```

---

## Composants Principaux

### CentreSearch

Recherche de centres avec carte interactive.

```tsx
<CentreSearch
  onSelect={(centre) => router.push(`/rdv/${centre.id}`)}
  defaultLocation={{ lat: 48.8566, lng: 2.3522 }}
/>
```

### CreneauPicker

Sélection de créneau horaire.

```tsx
<CreneauPicker
  centreId={centreId}
  typeControle="CTP"
  onSelect={(creneau) => setSelectedCreneau(creneau)}
/>
```

### PaymentForm

Formulaire de paiement Stripe.

```tsx
<PaymentForm
  amount={7900} // centimes
  rdvId={rdvId}
  onSuccess={() => router.push('/confirmation')}
  onError={(error) => toast.error(error.message)}
/>
```

---

## PWA Features

### Installation

L'application peut être installée sur mobile :
- iOS : Safari → Partager → Sur l'écran d'accueil
- Android : Chrome → Menu → Installer l'application

### Mode Hors-ligne

Les données essentielles sont mises en cache :
- Dernier RDV
- Informations client
- QR Code de confirmation

### Notifications Push

Rappels automatiques :
- J-1 : Rappel du RDV
- 2h avant : Rappel avec adresse

---

## Tests

```bash
# Tests unitaires
pnpm test

# Tests avec couverture
pnpm test:cov

# Tests E2E (Playwright)
pnpm test:e2e
```

---

## Build Production

```bash
# Build
pnpm build

# Démarrage production
pnpm start
```

---

## Déploiement

### Docker

```bash
docker build -t pti-client-pwa .
docker run -p 3000:3000 pti-client-pwa
```

### Vercel (recommandé pour Next.js)

```bash
vercel deploy --prod
```

---

## Performance

Objectifs Lighthouse :
- Performance : > 90
- Accessibility : > 95
- Best Practices : > 95
- SEO : > 90
- PWA : Installable

---

## Accessibilité

- WCAG 2.1 AA compliant
- Navigation clavier
- Lecteur d'écran compatible
- Contraste élevé
