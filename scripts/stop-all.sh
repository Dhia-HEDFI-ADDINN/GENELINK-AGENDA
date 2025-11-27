#!/bin/bash

# ============================================================================
# PTI CALENDAR SOLUTION - Script d'arrêt complet
# ============================================================================
# Ce script arrête toutes les applications PTI Calendar:
# - Applications frontend (Next.js apps)
# - Services backend (NestJS microservices)
# - Infrastructure (PostgreSQL, Redis, Kafka, Kong)
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
MODE="${1:-all}"
KEEP_VOLUMES="${KEEP_VOLUMES:-true}"

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

show_usage() {
    echo -e "${CYAN}Usage:${NC} $0 [MODE] [OPTIONS]"
    echo ""
    echo -e "${CYAN}Modes:${NC}"
    echo "  all          Arrêter tous les composants (défaut)"
    echo "  infra        Arrêter uniquement l'infrastructure Docker"
    echo "  services     Arrêter uniquement les services backend"
    echo "  apps         Arrêter uniquement les applications frontend"
    echo "  clean        Arrêter tout et supprimer les volumes Docker"
    echo ""
    echo -e "${CYAN}Variables d'environnement:${NC}"
    echo "  KEEP_VOLUMES=false   Supprimer les volumes Docker (attention: perte de données)"
    echo ""
    echo -e "${CYAN}Exemples:${NC}"
    echo "  $0                           # Arrêter tout"
    echo "  $0 services                  # Arrêter services uniquement"
    echo "  $0 clean                     # Arrêter et nettoyer"
    echo "  KEEP_VOLUMES=false $0 infra  # Arrêter infra et supprimer volumes"
    echo ""
}

# ============================================================================
# Arrêt des applications frontend
# ============================================================================
stop_apps() {
    print_header "Arrêt des applications frontend"

    local apps=("client-pwa" "pro-webapp" "admin-webapp" "callcenter-webapp")
    local ports=("3000" "3001" "3002" "3003")

    for i in "${!apps[@]}"; do
        local app="${apps[$i]}"
        local port="${ports[$i]}"
        local pid_file="$LOG_DIR/$app.pid"

        print_step "Arrêt de $app..."

        # Méthode 1: Utiliser le fichier PID
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            if ps -p "$pid" > /dev/null 2>&1; then
                kill "$pid" 2>/dev/null || true
                print_success "$app arrêté (PID: $pid)"
            fi
            rm -f "$pid_file"
        fi

        # Méthode 2: Tuer par port
        local pids=$(lsof -ti ":$port" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "$pids" | xargs -r kill 2>/dev/null || true
            print_success "$app arrêté (port: $port)"
        fi
    done

    # Tuer tous les processus Next.js restants
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "next-server" 2>/dev/null || true

    print_success "Applications frontend arrêtées"
}

# ============================================================================
# Arrêt des services backend
# ============================================================================
stop_services() {
    print_header "Arrêt des services backend"

    local services=("user-service" "planning-service" "rdv-service" "payment-service" "notification-service" "admin-service" "audit-service")
    local ports=("4000" "4001" "4002" "4003" "4004" "4005" "4006")

    for i in "${!services[@]}"; do
        local service="${services[$i]}"
        local port="${ports[$i]}"
        local pid_file="$LOG_DIR/$service.pid"

        print_step "Arrêt de $service..."

        # Méthode 1: Utiliser le fichier PID
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            if ps -p "$pid" > /dev/null 2>&1; then
                kill "$pid" 2>/dev/null || true
                print_success "$service arrêté (PID: $pid)"
            fi
            rm -f "$pid_file"
        fi

        # Méthode 2: Tuer par port
        local pids=$(lsof -ti ":$port" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "$pids" | xargs -r kill 2>/dev/null || true
            print_success "$service arrêté (port: $port)"
        fi
    done

    # Tuer tous les processus NestJS restants
    pkill -f "nest start" 2>/dev/null || true
    pkill -f "node dist/main.js" 2>/dev/null || true

    # Arrêter les services Docker si en production
    if docker ps --format '{{.Names}}' | grep -q "pti-.*-service"; then
        print_step "Arrêt des services Docker..."
        cd "$INFRA_DIR"
        docker-compose stop user-service planning-service rdv-service payment-service notification-service admin-service 2>/dev/null || true
    fi

    print_success "Services backend arrêtés"
}

# ============================================================================
# Arrêt de l'infrastructure Docker
# ============================================================================
stop_infrastructure() {
    print_header "Arrêt de l'infrastructure Docker"

    cd "$INFRA_DIR"

    # Arrêter les conteneurs de développement
    if docker-compose -f docker-compose.dev.yml ps -q 2>/dev/null | grep -q .; then
        print_step "Arrêt des conteneurs de développement..."
        if [ "$KEEP_VOLUMES" == "false" ]; then
            docker-compose -f docker-compose.dev.yml down -v
            print_warning "Volumes supprimés (données perdues)"
        else
            docker-compose -f docker-compose.dev.yml down
        fi
    fi

    # Arrêter les conteneurs de production
    if docker-compose ps -q 2>/dev/null | grep -q .; then
        print_step "Arrêt des conteneurs de production..."
        if [ "$KEEP_VOLUMES" == "false" ]; then
            docker-compose down -v
            print_warning "Volumes supprimés (données perdues)"
        else
            docker-compose down
        fi
    fi

    print_success "Infrastructure Docker arrêtée"
}

# ============================================================================
# Nettoyage complet
# ============================================================================
clean_all() {
    print_header "Nettoyage complet"

    # Supprimer les fichiers de log et PID
    print_step "Suppression des fichiers de log..."
    rm -rf "$LOG_DIR"/*.log "$LOG_DIR"/*.pid 2>/dev/null || true

    # Supprimer les volumes Docker orphelins
    print_step "Nettoyage des volumes Docker orphelins..."
    docker volume prune -f 2>/dev/null || true

    # Supprimer les réseaux Docker inutilisés
    print_step "Nettoyage des réseaux Docker..."
    docker network prune -f 2>/dev/null || true

    # Supprimer les images non utilisées (optionnel)
    if [ "$DEEP_CLEAN" == "true" ]; then
        print_step "Nettoyage des images Docker non utilisées..."
        docker image prune -f 2>/dev/null || true
    fi

    print_success "Nettoyage terminé"
}

# ============================================================================
# Afficher l'état actuel
# ============================================================================
show_status() {
    print_header "État actuel des composants"

    echo -e "${CYAN}Conteneurs Docker:${NC}"
    docker ps --format "  {{.Names}}: {{.Status}}" | grep pti- || echo "  Aucun conteneur PTI en cours"

    echo ""
    echo -e "${CYAN}Processus Node.js:${NC}"

    # Services backend
    for port in 4000 4001 4002 4003 4004 4005 4006; do
        local pids=$(lsof -ti ":$port" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "  Port $port: PID $pids"
        fi
    done

    # Applications frontend
    for port in 3000 3001 3002 3003; do
        local pids=$(lsof -ti ":$port" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "  Port $port: PID $pids"
        fi
    done

    if ! lsof -ti ":3000" -ti ":4000" > /dev/null 2>&1; then
        echo "  Aucun processus Node.js PTI en cours"
    fi
}

# ============================================================================
# Point d'entrée principal
# ============================================================================
main() {
    print_header "PTI CALENDAR SOLUTION - Arrêt"
    echo -e "Mode: ${CYAN}$MODE${NC}"
    echo -e "Date: $(date)"

    case "$MODE" in
        help|-h|--help)
            show_usage
            exit 0
            ;;
        status)
            show_status
            ;;
        apps)
            stop_apps
            ;;
        services)
            stop_services
            ;;
        infra)
            stop_infrastructure
            ;;
        clean)
            KEEP_VOLUMES="false"
            stop_apps
            stop_services
            stop_infrastructure
            clean_all
            ;;
        all|*)
            stop_apps
            stop_services
            stop_infrastructure
            ;;
    esac

    print_header "Arrêt terminé"
    echo -e "${GREEN}Tous les composants ont été arrêtés!${NC}"
    echo ""
    echo -e "Pour redémarrer: ${CYAN}./scripts/start-all.sh${NC}"
}

# Exécuter le script
main
