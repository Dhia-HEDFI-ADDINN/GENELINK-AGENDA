# PTI Calendar Infrastructure

## Quick Start - Development

```bash
# Start infrastructure services only (DB, Redis, Kafka)
docker-compose -f docker-compose.dev.yml up -d

# Access tools:
# - pgAdmin: http://localhost:5050 (admin@pti-calendar.fr / admin)
# - Kafka UI: http://localhost:8080
# - Redis Commander: http://localhost:8081
```

## Quick Start - Production

```bash
# Copy environment variables
cp .env.example .env
# Edit .env with your production values

# Start all services
docker-compose up -d

# Access API Gateway: http://localhost:8000
```

## Services Ports

| Service | Port | Description |
|---------|------|-------------|
| Kong Gateway | 8000 | API Gateway (Proxy) |
| Kong Admin | 8001 | Kong Admin API |
| User Service | 4000 | Authentication & RBAC |
| Planning Service | 4001 | Planning management |
| RDV Service | 4002 | Appointments |
| Payment Service | 4003 | Payments & Stripe |
| Notification Service | 4004 | SMS, Email, Push |
| Admin Service | 4005 | Multi-tenant admin |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |
| Kafka | 9092 | Event streaming |

## API Endpoints

All services are accessible through Kong API Gateway:

```
http://localhost:8000/api/v1/user/...
http://localhost:8000/api/v1/planning/...
http://localhost:8000/api/v1/rdv/...
http://localhost:8000/api/v1/payment/...
http://localhost:8000/api/v1/notification/...
http://localhost:8000/api/v1/admin/...
```

## Health Checks

Each service exposes health endpoints:

```bash
curl http://localhost:4000/api/v1/user/health
curl http://localhost:4001/api/v1/planning/health
curl http://localhost:4002/api/v1/rdv/health
curl http://localhost:4003/api/v1/payment/health
curl http://localhost:4004/api/v1/notification/health
curl http://localhost:4005/api/v1/admin/health
```

## Databases

Each service has its own database for isolation:

- `pti_user` - User Service
- `pti_planning` - Planning Service
- `pti_rdv` - RDV Service
- `pti_payment` - Payment Service
- `pti_notification` - Notification Service
- `pti_admin` - Admin Service
