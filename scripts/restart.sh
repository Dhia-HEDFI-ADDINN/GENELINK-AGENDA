#!/bin/bash

# ============================================================================
# PTI CALENDAR SOLUTION - Script de redémarrage
# ============================================================================
# Redémarre tous ou certains composants PTI Calendar
# ============================================================================

set -e

# Répertoire racine du projet
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configuration
COMPONENT="${1:-all}"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${PURPLE}============================================================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}============================================================================${NC}\n"
}

show_usage() {
    echo -e "${CYAN}Usage:${NC} $0 [COMPONENT]"
    echo ""
    echo -e "${CYAN}Components:${NC}"
    echo "  all          Redémarrer tout (défaut)"
    echo "  infra        Redémarrer l'infrastructure Docker"
    echo "  services     Redémarrer les services backend"
    echo "  apps         Redémarrer les applications frontend"
    echo ""
    echo -e "${CYAN}Exemples:${NC}"
    echo "  $0                  # Redémarrer tout"
    echo "  $0 services         # Redémarrer les services uniquement"
    echo ""
}

main() {
    print_header "PTI CALENDAR SOLUTION - Redémarrage"

    case "$COMPONENT" in
        help|-h|--help)
            show_usage
            exit 0
            ;;
        all)
            "$SCRIPT_DIR/stop-all.sh" all
            sleep 2
            "$SCRIPT_DIR/start-all.sh" dev
            ;;
        infra)
            "$SCRIPT_DIR/stop-all.sh" infra
            sleep 2
            "$SCRIPT_DIR/start-all.sh" infra
            ;;
        services)
            "$SCRIPT_DIR/stop-all.sh" services
            sleep 2
            "$SCRIPT_DIR/start-all.sh" services
            ;;
        apps)
            "$SCRIPT_DIR/stop-all.sh" apps
            sleep 2
            "$SCRIPT_DIR/start-all.sh" apps
            ;;
        *)
            echo -e "${RED}[ERROR]${NC} Composant inconnu: $COMPONENT"
            show_usage
            exit 1
            ;;
    esac
}

main
