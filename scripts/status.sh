#!/bin/bash

# ============================================================================
# PTI CALENDAR SOLUTION - Script de status
# ============================================================================
# Affiche l'état de tous les composants PTI Calendar
# ============================================================================

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Répertoire racine du projet
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"

print_header() {
    echo -e "\n${PURPLE}============================================================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}============================================================================${NC}\n"
}

check_service() {
    local name=$1
    local port=$2
    local type=$3

    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
        echo -e "  ${GREEN}●${NC} $name ${GREEN}(UP)${NC} - http://localhost:$port"
    elif curl -s "http://localhost:$port" > /dev/null 2>&1; then
        echo -e "  ${YELLOW}●${NC} $name ${YELLOW}(RUNNING)${NC} - http://localhost:$port"
    else
        echo -e "  ${RED}●${NC} $name ${RED}(DOWN)${NC} - port $port"
    fi
}

check_docker_service() {
    local name=$1
    local container=$2

    if docker ps --format '{{.Names}}' | grep -q "^$container$"; then
        local status=$(docker inspect --format '{{.State.Status}}' "$container" 2>/dev/null)
        local health=$(docker inspect --format '{{.State.Health.Status}}' "$container" 2>/dev/null || echo "N/A")
        echo -e "  ${GREEN}●${NC} $name ${GREEN}($status)${NC} - Health: $health"
    else
        echo -e "  ${RED}●${NC} $name ${RED}(STOPPED)${NC}"
    fi
}

main() {
    print_header "PTI CALENDAR SOLUTION - Status"
    echo -e "Date: $(date)"

    # Infrastructure Docker
    echo -e "\n${CYAN}━━━ Infrastructure Docker ━━━${NC}"

    # Vérifier les conteneurs de développement ou production
    for container in "pti-postgres-dev" "pti-postgres"; do
        if docker ps -a --format '{{.Names}}' | grep -q "^$container$"; then
            check_docker_service "PostgreSQL" "$container"
            break
        fi
    done

    for container in "pti-redis-dev" "pti-redis"; do
        if docker ps -a --format '{{.Names}}' | grep -q "^$container$"; then
            check_docker_service "Redis" "$container"
            break
        fi
    done

    for container in "pti-kafka-dev" "pti-kafka"; do
        if docker ps -a --format '{{.Names}}' | grep -q "^$container$"; then
            check_docker_service "Kafka" "$container"
            break
        fi
    done

    for container in "pti-zookeeper-dev" "pti-zookeeper"; do
        if docker ps -a --format '{{.Names}}' | grep -q "^$container$"; then
            check_docker_service "Zookeeper" "$container"
            break
        fi
    done

    if docker ps -a --format '{{.Names}}' | grep -q "^pti-kong$"; then
        check_docker_service "Kong Gateway" "pti-kong"
    fi

    # Outils de développement
    if docker ps -a --format '{{.Names}}' | grep -q "pti-pgadmin\|pti-kafka-ui\|pti-redis-commander"; then
        echo -e "\n${CYAN}━━━ Outils de développement ━━━${NC}"

        if docker ps --format '{{.Names}}' | grep -q "pti-pgadmin"; then
            echo -e "  ${GREEN}●${NC} pgAdmin ${GREEN}(UP)${NC} - http://localhost:5050"
        fi

        if docker ps --format '{{.Names}}' | grep -q "pti-kafka-ui"; then
            echo -e "  ${GREEN}●${NC} Kafka UI ${GREEN}(UP)${NC} - http://localhost:8080"
        fi

        if docker ps --format '{{.Names}}' | grep -q "pti-redis-commander"; then
            echo -e "  ${GREEN}●${NC} Redis Commander ${GREEN}(UP)${NC} - http://localhost:8081"
        fi
    fi

    # Services backend
    echo -e "\n${CYAN}━━━ Services Backend (NestJS) ━━━${NC}"
    check_service "User Service" "4000" "backend"
    check_service "Planning Service" "4001" "backend"
    check_service "RDV Service" "4002" "backend"
    check_service "Payment Service" "4003" "backend"
    check_service "Notification Service" "4004" "backend"
    check_service "Admin Service" "4005" "backend"
    check_service "Audit Service" "4006" "backend"

    # Applications frontend
    echo -e "\n${CYAN}━━━ Applications Frontend (Next.js) ━━━${NC}"
    check_service "Client PWA" "3000" "frontend"
    check_service "Pro WebApp" "3001" "frontend"
    check_service "Admin WebApp" "3002" "frontend"
    check_service "CallCenter WebApp" "3003" "frontend"

    # API Gateway
    echo -e "\n${CYAN}━━━ API Gateway ━━━${NC}"
    if curl -s "http://localhost:8000" > /dev/null 2>&1; then
        echo -e "  ${GREEN}●${NC} Kong Proxy ${GREEN}(UP)${NC} - http://localhost:8000"
    else
        echo -e "  ${RED}●${NC} Kong Proxy ${RED}(DOWN)${NC} - port 8000"
    fi

    if curl -s "http://localhost:8001" > /dev/null 2>&1; then
        echo -e "  ${GREEN}●${NC} Kong Admin ${GREEN}(UP)${NC} - http://localhost:8001"
    else
        echo -e "  ${RED}●${NC} Kong Admin ${RED}(DOWN)${NC} - port 8001"
    fi

    # Résumé
    echo -e "\n${CYAN}━━━ Résumé ━━━${NC}"

    local docker_running=$(docker ps --format '{{.Names}}' | grep -c "pti-" || echo "0")
    local services_up=0
    local apps_up=0

    for port in 4000 4001 4002 4003 4004 4005 4006; do
        if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
            services_up=$((services_up + 1))
        fi
    done

    for port in 3000 3001 3002 3003; do
        if curl -s "http://localhost:$port" > /dev/null 2>&1; then
            apps_up=$((apps_up + 1))
        fi
    done

    echo -e "  Conteneurs Docker: ${CYAN}$docker_running${NC} en cours"
    echo -e "  Services Backend:  ${CYAN}$services_up/7${NC} actifs"
    echo -e "  Applications:      ${CYAN}$apps_up/4${NC} actives"

    # Fichiers de log
    if [ -d "$LOG_DIR" ] && ls "$LOG_DIR"/*.log > /dev/null 2>&1; then
        echo -e "\n${CYAN}━━━ Fichiers de log ━━━${NC}"
        for log in "$LOG_DIR"/*.log; do
            if [ -f "$log" ]; then
                local size=$(du -h "$log" | cut -f1)
                local lines=$(wc -l < "$log")
                echo -e "  $(basename "$log"): $size ($lines lignes)"
            fi
        done
    fi

    echo ""
}

main
