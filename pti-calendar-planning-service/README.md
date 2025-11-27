# Planning Service

## PTI Calendar Solution - Microservice Gestion des Plannings

**Port :** 4001
**Framework :** NestJS 10+
**Base de données :** PostgreSQL (schema: pti_planning)

---

## Description

Le Planning Service gère les plannings des centres de contrôle technique, les disponibilités et l'affectation des contrôleurs.

### Responsabilités

- Calcul des disponibilités en temps réel
- Gestion des plannings contrôleurs
- Affectation automatique des contrôleurs
- Gestion des créneaux bloqués (absences, pauses)
- Surbooking paramétrable
- Matrices de durées de contrôle

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
PORT=4001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=pti_planning
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
```

---

## API Endpoints

### Disponibilités

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/v1/disponibilites | Calculer les créneaux disponibles |

**Paramètres :**
- `centre_id` : UUID du centre
- `date` : Date (YYYY-MM-DD)
- `type_controle` : CTP, CVP, CV
- `type_vehicule` : VL, L
- `carburant` : Essence, Diesel, Gaz, Electrique, Hybride

**Réponse :**
```json
{
  "date": "2024-12-15",
  "centre_id": "uuid",
  "creneaux": [
    {
      "heure_debut": "09:00",
      "heure_fin": "09:45",
      "controleur_id": "uuid",
      "ligne_id": "uuid",
      "disponible": true,
      "prix": 7900
    }
  ]
}
```

### Plannings

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/v1/planning/:centreId | Planning d'un centre |
| GET | /api/v1/planning/:centreId/:date | Planning d'une date |
| PUT | /api/v1/planning/creneau/:id | Modifier un créneau |
| POST | /api/v1/planning/bloquer | Bloquer un créneau |

### Contrôleurs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/v1/controleurs/:centreId | Liste des contrôleurs |
| POST | /api/v1/controleurs/affecter | Affecter un contrôleur |

---

## Algorithme de Calcul des Disponibilités

```typescript
// Pseudo-code de l'algorithme
function calculateDisponibilites(params: DisponibilitesParams): Creneau[] {
  // 1. Récupérer les lignes du centre
  const lignes = await getLignesActives(params.centre_id);

  // 2. Récupérer les contrôleurs disponibles
  const controleurs = await getControleursDisponibles(params.centre_id, params.date);

  // 3. Récupérer les horaires d'ouverture
  const horaires = await getHoraires(params.centre_id, params.date);

  // 4. Récupérer les RDV existants
  const rdvExistants = await getRdvExistants(params.centre_id, params.date);

  // 5. Calculer la durée du contrôle
  const duree = await getDureeControle(params.type_controle, params.type_vehicule, params.carburant);

  // 6. Générer les créneaux disponibles
  const creneaux = generateCreneaux(horaires, duree, rdvExistants, controleurs, lignes);

  return creneaux;
}
```

---

## Matrice des Durées de Contrôle

| Type | VL Essence | VL Diesel | VL Électrique | PL |
|------|------------|-----------|---------------|-----|
| CTP | 35 min | 40 min | 30 min | 60 min |
| CVP | 25 min | 30 min | 20 min | 45 min |
| CV | 20 min | 25 min | 15 min | 40 min |

---

## Events Kafka

### Produits

- `planning.creneau.bloque` : Créneau bloqué
- `planning.controleur.affecte` : Contrôleur affecté
- `planning.horaires.modifies` : Horaires modifiés

### Consommés

- `rdv.created` : Mettre à jour les disponibilités
- `rdv.cancelled` : Libérer le créneau

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
curl http://localhost:4001/health
```
