#!/bin/bash

# ============================================
# PTI CALENDAR - Script de démarrage complet
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$SCRIPT_DIR/pti-calendar-infrastructure"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           PTI CALENDAR - Démarrage complet                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================
# 1. Démarrage de l'infrastructure Docker
# ============================================
echo -e "${YELLOW}[1/4] Démarrage de l'infrastructure Docker...${NC}"

cd "$INFRA_DIR"
docker-compose -f docker-compose.dev.yml up -d

echo -e "${GREEN}✓ Infrastructure Docker démarrée${NC}"

# ============================================
# 2. Attente que PostgreSQL soit prêt
# ============================================
echo -e "${YELLOW}[2/4] Attente de PostgreSQL...${NC}"

until docker exec pti-postgres-dev pg_isready -U postgres > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo ""
echo -e "${GREEN}✓ PostgreSQL est prêt${NC}"

# ============================================
# 3. Création des bases de données si nécessaire
# ============================================
echo -e "${YELLOW}[3/4] Vérification des bases de données...${NC}"

DATABASES=("pti_user" "pti_planning" "pti_rdv" "pti_payment" "pti_notification" "pti_admin")

for db in "${DATABASES[@]}"; do
    EXISTS=$(docker exec pti-postgres-dev psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db'" 2>/dev/null || echo "")
    if [ "$EXISTS" != "1" ]; then
        echo "  Création de la base $db..."
        docker exec pti-postgres-dev psql -U postgres -c "CREATE DATABASE $db;" > /dev/null 2>&1
    fi
done

echo -e "${GREEN}✓ Bases de données vérifiées${NC}"

# ============================================
# 4. Affichage du statut
# ============================================
echo -e "${YELLOW}[4/4] Vérification du statut...${NC}"

echo ""
docker ps --filter "name=pti-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    Services disponibles                   ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║  PostgreSQL      : localhost:5433                         ║"
echo "║  Redis           : localhost:6380                         ║"
echo "║  Kafka           : localhost:9094                         ║"
echo "║  Kafka UI        : http://localhost:8084                  ║"
echo "║  pgAdmin         : http://localhost:5050                  ║"
echo "║  Redis Commander : http://localhost:8083                  ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║  Pour démarrer un microservice :                          ║"
echo "║  cd pti-calendar-user-service && npm run start:dev        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}✓ PTI Calendar infrastructure prête !${NC}"
