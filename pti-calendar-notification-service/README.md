# Notification Service

## PTI Calendar Solution - Microservice Notifications

**Port :** 4004
**Framework :** NestJS 10+
**Base de données :** PostgreSQL (schema: pti_notification)

---

## Description

Le Notification Service gère l'envoi de toutes les notifications de la plateforme.

### Responsabilités

- Envoi d'emails (Brevo/Sendinblue)
- Envoi de SMS (Twilio)
- Notifications push (PWA)
- Templates de messages
- Gestion des préférences utilisateur
- Historique des notifications

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
PORT=4004
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=pti_notification
KAFKA_BROKERS=localhost:9092

# Email (Brevo)
BREVO_API_KEY=xkeysib-xxx
BREVO_SENDER_EMAIL=noreply@genilink.fr
BREVO_SENDER_NAME=PTI Calendar

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+33xxxxxxxxx
```

---

## API Endpoints

### Notifications

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/v1/notifications/email | Envoyer un email |
| POST | /api/v1/notifications/sms | Envoyer un SMS |
| POST | /api/v1/notifications/push | Envoyer une notification push |
| GET | /api/v1/notifications/history | Historique des notifications |

### Templates

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/v1/templates | Liste des templates |
| GET | /api/v1/templates/:id | Détail d'un template |
| POST | /api/v1/templates | Créer un template |
| PUT | /api/v1/templates/:id | Modifier un template |

---

## Types de Notifications

### Confirmation RDV

**Email :**
```
Sujet: Confirmation de votre rendez-vous - {{date}}

Bonjour {{client.prenom}},

Votre rendez-vous de contrôle technique est confirmé :

Date : {{date}} à {{heure}}
Centre : {{centre.nom}}
Adresse : {{centre.adresse}}
Véhicule : {{vehicule.immatriculation}}

Montant réglé : {{montant_ttc}}€

À bientôt,
L'équipe PTI Calendar
```

**SMS :**
```
PTI Calendar: RDV confirmé le {{date}} à {{heure}}
au {{centre.nom}}.
Véhicule: {{vehicule.immatriculation}}
```

### Rappel J-1

**SMS :**
```
PTI Calendar: Rappel - RDV demain à {{heure}}
au {{centre.nom}}.
N'oubliez pas vos documents !
```

### Rappel J-0 (2h avant)

**SMS :**
```
PTI Calendar: Votre RDV est dans 2h au {{centre.nom}}.
Adresse: {{centre.adresse}}
```

---

## Events Kafka Consommés

| Topic | Event | Action |
|-------|-------|--------|
| rdv.events | rdv.created | Envoyer confirmation |
| rdv.events | rdv.confirmed | Envoyer confirmation paiement |
| rdv.events | rdv.modified | Envoyer nouvelle confirmation |
| rdv.events | rdv.cancelled | Envoyer annulation |
| rdv.events | rdv.completed | Envoyer résultat contrôle |
| payment.events | payment.completed | Envoyer reçu |

---

## Scheduler de Rappels

```typescript
// Rappel J-1 à 18h
@Cron('0 18 * * *')
async sendRappelJ1() {
  const demain = addDays(new Date(), 1);
  const rdvs = await this.rdvService.findByDate(demain);

  for (const rdv of rdvs) {
    await this.sendSms(rdv.client.telephone, 'rappel-j1', rdv);
  }
}

// Rappel J-0 (2h avant)
@Cron('*/30 * * * *')
async sendRappelJ0() {
  const dans2h = addHours(new Date(), 2);
  const rdvs = await this.rdvService.findByHeure(dans2h);

  for (const rdv of rdvs) {
    await this.sendSms(rdv.client.telephone, 'rappel-j0', rdv);
  }
}
```

---

## Modèle de Données

### Notification

```typescript
interface Notification {
  id: string;
  tenant_id: string;
  recipient_id: string;
  recipient_email?: string;
  recipient_phone?: string;

  type: 'EMAIL' | 'SMS' | 'PUSH';
  template_id: string;
  subject?: string;
  body: string;

  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';
  error_message?: string;

  metadata: Record<string, any>;
  sent_at?: Date;
  delivered_at?: Date;
  created_at: Date;
}
```

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
curl http://localhost:4004/health
```
