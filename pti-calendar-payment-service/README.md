# Payment Service

## PTI Calendar Solution - Microservice Paiement

**Port :** 4003
**Framework :** NestJS 10+
**Base de données :** PostgreSQL (schema: pti_payment)

---

## Description

Le Payment Service gère l'ensemble des transactions de paiement pour les contrôles techniques.

### Responsabilités

- Intégration Stripe (paiement CB)
- Gestion des paiements en ligne
- Gestion des paiements sur place
- Remboursements
- Factures et reçus
- Rapprochement comptable

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
PORT=4003
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=pti_payment
KAFKA_BROKERS=localhost:9092

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

---

## API Endpoints

### Paiements

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/v1/payment/intent | Créer un intent de paiement |
| POST | /api/v1/payment/confirm | Confirmer un paiement |
| GET | /api/v1/payment/:id | Détail d'un paiement |
| GET | /api/v1/payment/rdv/:rdvId | Paiement d'un RDV |

### Remboursements

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/v1/payment/:id/refund | Rembourser |
| GET | /api/v1/payment/:id/refund | Statut remboursement |

### Webhooks

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/v1/payment/webhook/stripe | Webhook Stripe |

---

## Flux de Paiement

```
1. Client → POST /payment/intent (montant, rdv_id)
2. Service → Stripe.createPaymentIntent
3. Client ← client_secret
4. Client → Stripe.js confirmCardPayment
5. Stripe → POST /webhook (payment_intent.succeeded)
6. Service → Kafka.publish('payment.completed')
7. RDV Service ← Confirmer le RDV
```

---

## Modèle de Données

### Payment

```typescript
interface Payment {
  id: string;
  tenant_id: string;
  rdv_id: string;

  // Montants
  montant_ht: number;
  tva: number;
  montant_ttc: number;

  // Stripe
  stripe_payment_intent_id?: string;
  stripe_customer_id?: string;

  // Statut
  statut: PaymentStatut;
  methode: 'CARTE' | 'ESPECES' | 'CHEQUE' | 'VIREMENT';

  // Remboursement
  rembourse: boolean;
  montant_rembourse?: number;
  refund_id?: string;

  // Métadonnées
  created_at: Date;
  updated_at: Date;
}

type PaymentStatut =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';
```

---

## Tarification

### Contrôle Technique Particulier (CTP)

| Type Véhicule | Prix HT | TVA 20% | Prix TTC |
|---------------|---------|---------|----------|
| VL Essence | 65.83€ | 13.17€ | 79.00€ |
| VL Diesel | 70.83€ | 14.17€ | 85.00€ |
| VL Électrique | 58.33€ | 11.67€ | 70.00€ |

### Contre-Visite (CVP)

| Type Véhicule | Prix TTC |
|---------------|----------|
| VL | 25.00€ |
| PL | 35.00€ |

---

## Events Kafka

### Produits

- `payment.created` : Paiement initié
- `payment.completed` : Paiement réussi
- `payment.failed` : Paiement échoué
- `payment.refunded` : Remboursement effectué

### Consommés

- `rdv.cancelled` : Déclencher remboursement si payé

---

## Sécurité

- Clés Stripe stockées en secrets Kubernetes
- Validation webhook via signature Stripe
- Logs PCI-DSS compliant (pas de données carte)
- Chiffrement des données sensibles

---

## Tests

```bash
npm run test
npm run test:cov
npm run test:e2e

# Tests avec Stripe Test Mode
STRIPE_SECRET_KEY=sk_test_xxx npm run test:e2e
```

---

## Health Check

```bash
curl http://localhost:4003/health
```
