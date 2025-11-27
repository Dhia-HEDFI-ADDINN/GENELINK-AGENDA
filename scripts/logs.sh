#!/bin/bash

# ============================================================================
# PTI CALENDAR SOLUTION - Script de visualisation des logs
# ============================================================================
# Affiche les logs de différents composants
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
INFRA_DIR="$PROJECT_ROOT/pti-calendar-infrastructure"
LOG_DIR="$PROJECT_ROOT/logs"

# Configuration
COMPONENT="${1:-all}"
LINES="${2:-100}"
FOLLOW="${FOLLOW:-false}"

show_usage() {
    echo -e "${CYAN}Usage:${NC} $0 [COMPONENT] [LINES]"
    echo ""
    echo -e "${CYAN}Components:${NC}"
    echo "  all                 Tous les logs (défaut)"
    echo "  services            Logs de tous les services backend"
    echo "  apps                Logs de toutes les applications"
    echo "  docker              Logs de tous les conteneurs Docker"
    echo ""
    echo "  user-service        Logs du service utilisateur"
    echo "  planning-service    Logs du service planning"
    echo "  rdv-service         Logs du service RDV"
    echo "  payment-service     Logs du service paiement"
    echo "  notification-service Logs du service notification"
    echo "  admin-service       Logs du service admin"
    echo "  audit-service       Logs du service audit"
    echo ""
    echo "  client-pwa          Logs de la PWA client"
    echo "  pro-webapp          Logs de la webapp pro"
    echo "  admin-webapp        Logs de la webapp admin"
    echo "  callcenter-webapp   Logs de la webapp callcenter"
    echo ""
    echo "  postgres            Logs PostgreSQL (Docker)"
    echo "  redis               Logs Redis (Docker)"
    echo "  kafka               Logs Kafka (Docker)"
    echo "  kong                Logs Kong (Docker)"
    echo ""
    echo -e "${CYAN}Options:${NC}"
    echo "  FOLLOW=true $0 [COMPONENT]   Suivre les logs en temps réel"
    echo ""
    echo -e "${CYAN}Exemples:${NC}"
    echo "  $0                           # Afficher tous les logs"
    echo "  $0 user-service 50           # 50 dernières lignes du user-service"
    echo "  FOLLOW=true $0 services      # Suivre les logs des services"
    echo ""
}

view_file_log() {
    local name=$1
    local log_file="$LOG_DIR/$name.log"

    if [ -f "$log_file" ]; then
        echo -e "\n${PURPLE}━━━ $name ━━━${NC}"
        if [ "$FOLLOW" == "true" ]; then
            tail -f "$log_file"
        else
            tail -n "$LINES" "$log_file"
        fi
    else
        echo -e "${YELLOW}[WARNING]${NC} Fichier de log non trouvé: $log_file"
    fi
}

view_docker_log() {
    local name=$1
    local container=$2

    # Chercher le conteneur (dev ou prod)
    local actual_container=""
    for c in "$container-dev" "$container" "pti-$container-dev" "pti-$container"; do
        if docker ps --format '{{.Names}}' | grep -q "^$c$"; then
            actual_container="$c"
            break
        fi
    done

    if [ -n "$actual_container" ]; then
        echo -e "\n${PURPLE}━━━ $name (Docker: $actual_container) ━━━${NC}"
        if [ "$FOLLOW" == "true" ]; then
            docker logs -f "$actual_container"
        else
            docker logs --tail "$LINES" "$actual_container"
        fi
    else
        echo -e "${YELLOW}[WARNING]${NC} Conteneur Docker non trouvé: $container"
    fi
}

view_all_services() {
    echo -e "${CYAN}━━━ Services Backend ━━━${NC}"
    for service in user-service planning-service rdv-service payment-service notification-service admin-service audit-service; do
        view_file_log "$service"
    done
}

view_all_apps() {
    echo -e "${CYAN}━━━ Applications Frontend ━━━${NC}"
    for app in client-pwa pro-webapp admin-webapp callcenter-webapp; do
        view_file_log "$app"
    done
}

view_all_docker() {
    echo -e "${CYAN}━━━ Infrastructure Docker ━━━${NC}"
    view_docker_log "PostgreSQL" "pti-postgres"
    view_docker_log "Redis" "pti-redis"
    view_docker_log "Kafka" "pti-kafka"
    view_docker_log "Kong" "pti-kong"
}

main() {
    case "$COMPONENT" in
        help|-h|--help)
            show_usage
            exit 0
            ;;
        all)
            view_all_services
            view_all_apps
            ;;
        services)
            view_all_services
            ;;
        apps)
            view_all_apps
            ;;
        docker)
            view_all_docker
            ;;
        user-service|planning-service|rdv-service|payment-service|notification-service|admin-service|audit-service)
            view_file_log "$COMPONENT"
            ;;
        client-pwa|pro-webapp|admin-webapp|callcenter-webapp)
            view_file_log "$COMPONENT"
            ;;
        postgres)
            view_docker_log "PostgreSQL" "pti-postgres"
            ;;
        redis)
            view_docker_log "Redis" "pti-redis"
            ;;
        kafka)
            view_docker_log "Kafka" "pti-kafka"
            ;;
        kong)
            view_docker_log "Kong" "pti-kong"
            ;;
        *)
            echo -e "${RED}[ERROR]${NC} Composant inconnu: $COMPONENT"
            show_usage
            exit 1
            ;;
    esac
}

main
