#!/bin/bash

# ============================================================================
# PTI CALENDAR SOLUTION - Script de démarrage complet
# ============================================================================
# Ce script démarre toutes les applications PTI Calendar:
# - Infrastructure (PostgreSQL, Redis, Kafka, Kong)
# - Services backend (NestJS microservices)
# - Applications frontend (Next.js apps)
# ============================================================================

set -e

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
INFRA_DIR="$PROJECT_ROOT/pti-calendar-infrastructure"
LOG_DIR="$PROJECT_ROOT/logs"

# Configuration par défaut
MODE="${1:-dev}"
SKIP_INFRA="${SKIP_INFRA:-false}"
SKIP_SERVICES="${SKIP_SERVICES:-false}"
SKIP_APPS="${SKIP_APPS:-false}"

# Fonctions utilitaires
print_header() {
    echo -e "\n${PURPLE}============================================================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}============================================================================${NC}\n"
}

print_step() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

wait_for_service() {
    local name=$1
    local url=$2
    local max_attempts=${3:-30}
    local attempt=1

    print_step "Attente de $name..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            print_success "$name est prêt"
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    print_warning "$name n'est pas accessible après $max_attempts tentatives"
    return 1
}

wait_for_postgres() {
    local max_attempts=${1:-30}
    local attempt=1

    print_step "Attente de PostgreSQL..."
    while [ $attempt -le $max_attempts ]; do
        if docker exec pti-postgres-dev pg_isready -U postgres > /dev/null 2>&1 || \
           docker exec pti-postgres pg_isready -U postgres > /dev/null 2>&1; then
            print_success "PostgreSQL est prêt"
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    print_error "PostgreSQL n'est pas accessible"
    return 1
}

wait_for_redis() {
    local max_attempts=${1:-30}
    local attempt=1

    print_step "Attente de Redis..."
    while [ $attempt -le $max_attempts ]; do
        if docker exec pti-redis-dev redis-cli ping > /dev/null 2>&1 || \
           docker exec pti-redis redis-cli ping > /dev/null 2>&1; then
            print_success "Redis est prêt"
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    print_error "Redis n'est pas accessible"
    return 1
}

create_log_dir() {
    mkdir -p "$LOG_DIR"
    print_step "Dossier de logs créé: $LOG_DIR"
}

show_usage() {
    echo -e "${CYAN}Usage:${NC} $0 [MODE] [OPTIONS]"
    echo ""
    echo -e "${CYAN}Modes:${NC}"
    echo "  dev          Démarrage en mode développement (défaut)"
    echo "  prod         Démarrage en mode production (Docker complet)"
    echo "  infra        Démarrer uniquement l'infrastructure"
    echo "  services     Démarrer uniquement les services backend"
    echo "  apps         Démarrer uniquement les applications frontend"
    echo ""
    echo -e "${CYAN}Variables d'environnement:${NC}"
    echo "  SKIP_INFRA=true     Ignorer le démarrage de l'infrastructure"
    echo "  SKIP_SERVICES=true  Ignorer le démarrage des services"
    echo "  SKIP_APPS=true      Ignorer le démarrage des applications"
    echo ""
    echo -e "${CYAN}Exemples:${NC}"
    echo "  $0 dev                    # Mode développement complet"
    echo "  $0 prod                   # Mode production Docker"
    echo "  $0 infra                  # Infrastructure seule"
    echo "  SKIP_APPS=true $0 dev     # Dev sans les apps frontend"
    echo ""
}

# ============================================================================
# Démarrage de l'infrastructure
# ============================================================================
start_infrastructure() {
    print_header "Démarrage de l'infrastructure Docker"

    cd "$INFRA_DIR"

    if [ "$MODE" == "prod" ]; then
        print_step "Démarrage des conteneurs de production..."
        docker-compose up -d postgres redis zookeeper kafka kong-database kong-migration kong
    else
        print_step "Démarrage des conteneurs de développement..."
        docker-compose -f docker-compose.dev.yml up -d
    fi

    # Attendre que les services soient prêts
    wait_for_postgres
    wait_for_redis

    print_success "Infrastructure démarrée avec succès"

    # Afficher les URLs des outils de dev
    if [ "$MODE" == "dev" ]; then
        echo ""
        print_step "Outils de développement disponibles:"
        echo -e "  ${CYAN}pgAdmin:${NC}         http://localhost:5050 (admin@pti-calendar.fr / admin)"
        echo -e "  ${CYAN}Kafka UI:${NC}        http://localhost:8080"
        echo -e "  ${CYAN}Redis Commander:${NC} http://localhost:8081"
    fi
}

# ============================================================================
# Démarrage des services backend
# ============================================================================
start_services() {
    print_header "Démarrage des services backend"

    create_log_dir

    if [ "$MODE" == "prod" ]; then
        # En production, les services sont dans Docker
        cd "$INFRA_DIR"
        print_step "Démarrage des services Docker..."
        docker-compose up -d user-service planning-service rdv-service payment-service notification-service admin-service
    else
        # En développement, démarrer les services localement
        cd "$PROJECT_ROOT"

        # S'assurer que les dépendances sont installées
        print_step "Installation des dépendances (si nécessaire)..."
        pnpm install --prefer-offline 2>/dev/null || true

        # Build des packages partagés
        print_step "Build des packages partagés..."
        pnpm build:shared 2>/dev/null || true

        # Démarrer chaque service en arrière-plan
        declare -A SERVICES=(
            ["user-service"]="4000"
            ["planning-service"]="4001"
            ["rdv-service"]="4002"
            ["payment-service"]="4003"
            ["notification-service"]="4004"
            ["admin-service"]="4005"
            ["audit-service"]="4006"
        )

        for service in "${!SERVICES[@]}"; do
            local port="${SERVICES[$service]}"
            local service_dir="$PROJECT_ROOT/pti-calendar-$service"

            if [ -d "$service_dir" ]; then
                print_step "Démarrage de $service sur le port $port..."
                cd "$service_dir"

                # Vérifier si le service est déjà en cours d'exécution
                if lsof -i ":$port" > /dev/null 2>&1; then
                    print_warning "$service déjà en cours d'exécution sur le port $port"
                else
                    nohup npm run start:dev > "$LOG_DIR/$service.log" 2>&1 &
                    echo $! > "$LOG_DIR/$service.pid"
                    print_success "$service démarré (PID: $!, log: $LOG_DIR/$service.log)"
                fi
            else
                print_warning "Service $service non trouvé dans $service_dir"
            fi
        done
    fi

    # Attendre que les services soient prêts
    sleep 5
    print_step "Vérification des services..."

    declare -A SERVICE_PORTS=(
        ["user-service"]="4000"
        ["planning-service"]="4001"
        ["rdv-service"]="4002"
        ["payment-service"]="4003"
        ["notification-service"]="4004"
        ["admin-service"]="4005"
        ["audit-service"]="4006"
    )

    for service in "${!SERVICE_PORTS[@]}"; do
        local port="${SERVICE_PORTS[$service]}"
        if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
            print_success "$service: OK (port $port)"
        else
            print_warning "$service: En attente... (port $port)"
        fi
    done

    print_success "Services backend démarrés"
}

# ============================================================================
# Démarrage des applications frontend
# ============================================================================
start_apps() {
    print_header "Démarrage des applications frontend"

    create_log_dir
    cd "$PROJECT_ROOT"

    declare -A APPS=(
        ["client-pwa"]="3000"
        ["pro-webapp"]="3001"
        ["admin-webapp"]="3002"
        ["callcenter-webapp"]="3003"
    )

    for app in "${!APPS[@]}"; do
        local port="${APPS[$app]}"
        local app_dir="$PROJECT_ROOT/pti-calendar-$app"

        if [ -d "$app_dir" ]; then
            print_step "Démarrage de $app sur le port $port..."
            cd "$app_dir"

            # Vérifier si l'app est déjà en cours d'exécution
            if lsof -i ":$port" > /dev/null 2>&1; then
                print_warning "$app déjà en cours d'exécution sur le port $port"
            else
                PORT=$port nohup npm run dev > "$LOG_DIR/$app.log" 2>&1 &
                echo $! > "$LOG_DIR/$app.pid"
                print_success "$app démarré (PID: $!, log: $LOG_DIR/$app.log)"
            fi
        else
            print_warning "Application $app non trouvée dans $app_dir"
        fi
    done

    # Attendre que les apps soient prêtes
    sleep 10
    print_step "Vérification des applications..."

    for app in "${!APPS[@]}"; do
        local port="${APPS[$app]}"
        if curl -s "http://localhost:$port" > /dev/null 2>&1; then
            print_success "$app: OK (http://localhost:$port)"
        else
            print_warning "$app: En attente... (http://localhost:$port)"
        fi
    done

    echo ""
    print_step "Applications disponibles:"
    echo -e "  ${CYAN}Client PWA:${NC}      http://localhost:3000"
    echo -e "  ${CYAN}Pro WebApp:${NC}      http://localhost:3001"
    echo -e "  ${CYAN}Admin WebApp:${NC}    http://localhost:3002"
    echo -e "  ${CYAN}CallCenter:${NC}      http://localhost:3003"

    print_success "Applications frontend démarrées"
}

# ============================================================================
# Point d'entrée principal
# ============================================================================
main() {
    print_header "PTI CALENDAR SOLUTION - Démarrage"
    echo -e "Mode: ${CYAN}$MODE${NC}"
    echo -e "Date: $(date)"

    case "$MODE" in
        help|-h|--help)
            show_usage
            exit 0
            ;;
        infra)
            start_infrastructure
            ;;
        services)
            start_services
            ;;
        apps)
            start_apps
            ;;
        dev|prod)
            if [ "$SKIP_INFRA" != "true" ]; then
                start_infrastructure
            fi

            if [ "$SKIP_SERVICES" != "true" ]; then
                start_services
            fi

            if [ "$SKIP_APPS" != "true" ]; then
                start_apps
            fi
            ;;
        *)
            print_error "Mode inconnu: $MODE"
            show_usage
            exit 1
            ;;
    esac

    print_header "Démarrage terminé"
    echo -e "${GREEN}Tous les composants sont démarrés!${NC}"
    echo ""
    echo -e "Pour arrêter: ${CYAN}./scripts/stop-all.sh${NC}"
    echo -e "Pour voir les logs: ${CYAN}tail -f logs/*.log${NC}"
}

# Exécuter le script
main
