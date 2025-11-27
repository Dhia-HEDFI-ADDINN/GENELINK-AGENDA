# Pro WebApp

## PTI Calendar Solution - Application Centres & Contrôleurs

**Port :** 3001
**Framework :** Next.js 14 (App Router)
**Utilisateurs :** Gestionnaires de centre, Contrôleurs

---

## Description

Application de gestion quotidienne pour les centres de contrôle technique et leurs contrôleurs.

### Fonctionnalités

- Dashboard temps réel
- Planning journalier interactif
- Gestion des RDV (check-in, contrôle, résultats)
- Affectation des contrôleurs
- Statistiques du centre
- Gestion des créneaux bloqués

---

## Démarrage Rapide

### Installation

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

L'application démarre sur http://localhost:3001

### Variables d'Environnement

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development
```

---

## Structure du Projet

```
pti-calendar-pro-webapp/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/          # Page de connexion
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # Dashboard principal
│   │   │   ├── planning/       # Planning journalier
│   │   │   │   └── gestion/    # Gestion des créneaux
│   │   │   ├── rdv/
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Détail RDV
│   │   │   │       ├── demarrer/     # Démarrer contrôle
│   │   │   │       └── terminer/     # Terminer contrôle
│   │   │   ├── controleurs/    # Gestion contrôleurs
│   │   │   └── statistiques/   # Statistiques centre
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── planning/           # Grille planning
│   │   ├── rdv/                # Blocs RDV
│   │   └── controleurs/        # Gestion contrôleurs
│   │
│   └── lib/
│       ├── api/
│       └── hooks/
│
└── package.json
```

---

## Parcours Gestionnaire Centre

### Dashboard

```
Connexion → Dashboard
          ├── Planning du jour (vue principale)
          ├── RDV en attente
          ├── Contrôleurs actifs
          └── Statistiques temps réel
```

### Gestion RDV

```
Planning → Clic sur RDV → Détail RDV
                        ├── Check-in client
                        ├── Affecter contrôleur
                        └── Voir historique
```

### Gestion Planning

```
Planning → Gestion des créneaux
         ├── Bloquer un créneau
         ├── Modifier capacité
         └── Gérer absences
```

---

## Parcours Contrôleur

### Planning Personnel

```
Connexion → Mon Planning
          ├── RDV du jour
          └── RDV en cours
```

### Workflow Contrôle

```
RDV assigné → Démarrer contrôle
            → Saisie résultats
              ├── Favorable
              ├── Défavorable (liste défauts)
              └── Contre-visite
            → Terminer contrôle
            → Observations
```

---

## Composants Principaux

### PlanningGrid

Grille planning journalière interactive.

```tsx
<PlanningGrid
  date={selectedDate}
  centreId={user.centreId}
  onRdvClick={(rdv) => router.push(`/dashboard/rdv/${rdv.id}`)}
/>
```

### RdvBlock

Bloc représentant un RDV dans le planning.

```tsx
<RdvBlock
  rdv={rdv}
  status={rdv.statut}
  controleur={rdv.controleur}
  onClick={() => openRdvDetail(rdv)}
/>
```

### ControleForm

Formulaire de saisie des résultats de contrôle.

```tsx
<ControleForm
  rdvId={rdvId}
  onSubmit={async (data) => {
    await terminerControle(rdvId, data);
    router.push('/dashboard');
  }}
/>
```

---

## Rôles et Permissions

### Gestionnaire Centre

- Voir tout le planning du centre
- Gérer tous les RDV
- Affecter les contrôleurs
- Modifier les créneaux
- Accès aux statistiques

### Contrôleur

- Voir son planning personnel
- Gérer ses RDV assignés
- Saisir les résultats de contrôle
- Marquer les arrivées

---

## Comptes de Test

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| responsable@centre-paris.fr | Responsable123! | GESTIONNAIRE_CENTRE |
| controleur@centre-paris.fr | Controleur123! | CONTROLEUR |

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
docker build -t pti-pro-webapp .
docker run -p 3001:3000 pti-pro-webapp
```
