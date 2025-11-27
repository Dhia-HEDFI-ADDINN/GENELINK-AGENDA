#!/bin/bash

# ============================================================================
# PTI CALENDAR SOLUTION - Script d'installation
# ============================================================================
# Installe toutes les dépendances et prépare l'environnement
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

check_requirements() {
    print_header "Vérification des prérequis"

    # Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node -v)
        print_success "Node.js: $node_version"
    else
        print_error "Node.js n'est pas installé"
        exit 1
    fi

    # pnpm
    if command -v pnpm &> /dev/null; then
        local pnpm_version=$(pnpm -v)
        print_success "pnpm: $pnpm_version"
    else
        print_warning "pnpm n'est pas installé, installation..."
        npm install -g pnpm
    fi

    # Docker
    if command -v docker &> /dev/null; then
        local docker_version=$(docker --version)
        print_success "Docker: $docker_version"
    else
        print_warning "Docker n'est pas installé (requis pour l'infrastructure)"
    fi

    # Docker Compose
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        print_success "Docker Compose: installé"
    else
        print_warning "Docker Compose n'est pas installé"
    fi
}

install_dependencies() {
    print_header "Installation des dépendances"

    cd "$PROJECT_ROOT"
    print_step "Installation des packages npm..."
    pnpm install

    print_success "Dépendances installées"
}

build_shared() {
    print_header "Build des packages partagés"

    cd "$PROJECT_ROOT"

    print_step "Build de @pti-calendar/shared-types..."
    pnpm --filter @pti-calendar/shared-types build 2>/dev/null || print_warning "shared-types: build ignoré"

    print_step "Build de @pti-calendar/shared-utils..."
    pnpm --filter @pti-calendar/shared-utils build 2>/dev/null || print_warning "shared-utils: build ignoré"

    print_step "Build de @pti-calendar/api-client..."
    pnpm --filter @pti-calendar/api-client build 2>/dev/null || print_warning "api-client: build ignoré"

    print_step "Build de @pti-calendar/design-system..."
    pnpm --filter @pti-calendar/design-system build 2>/dev/null || print_warning "design-system: build ignoré"

    print_success "Packages partagés buildés"
}

setup_env() {
    print_header "Configuration de l'environnement"

    # Créer les fichiers .env s'ils n'existent pas
    local services=("user-service" "planning-service" "rdv-service" "payment-service" "notification-service" "admin-service" "audit-service")

    for service in "${services[@]}"; do
        local service_dir="$PROJECT_ROOT/pti-calendar-$service"
        local env_file="$service_dir/.env"
        local env_example="$service_dir/.env.example"

        if [ -d "$service_dir" ]; then
            if [ ! -f "$env_file" ] && [ -f "$env_example" ]; then
                cp "$env_example" "$env_file"
                print_step "Créé: $env_file"
            elif [ ! -f "$env_file" ]; then
                # Créer un fichier .env de base
                cat > "$env_file" << EOF
NODE_ENV=development
PORT=$(echo 4000 + $(echo "${services[@]}" | tr ' ' '\n' | grep -n "$service" | cut -d: -f1) - 1 | bc)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=pti_$(echo "$service" | sed 's/-service//')
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
JWT_SECRET=development-secret-key-change-in-production
EOF
                print_step "Créé: $env_file (configuration par défaut)"
            fi
        fi
    done

    # Créer les fichiers .env pour les apps frontend
    local apps=("client-pwa" "pro-webapp" "admin-webapp" "callcenter-webapp")

    for app in "${apps[@]}"; do
        local app_dir="$PROJECT_ROOT/pti-calendar-$app"
        local env_file="$app_dir/.env.local"

        if [ -d "$app_dir" ] && [ ! -f "$env_file" ]; then
            cat > "$env_file" << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development
EOF
            print_step "Créé: $env_file"
        fi
    done

    print_success "Environnement configuré"
}

create_logs_dir() {
    print_header "Création du dossier de logs"

    mkdir -p "$PROJECT_ROOT/logs"
    print_success "Dossier de logs créé: $PROJECT_ROOT/logs"
}

show_next_steps() {
    print_header "Installation terminée"

    echo -e "${GREEN}L'installation est terminée!${NC}"
    echo ""
    echo -e "${CYAN}Prochaines étapes:${NC}"
    echo ""
    echo "  1. Démarrer l'infrastructure Docker:"
    echo -e "     ${YELLOW}pnpm start:infra${NC}"
    echo ""
    echo "  2. Démarrer tous les services et applications:"
    echo -e "     ${YELLOW}pnpm start${NC}"
    echo ""
    echo "  3. Vérifier le status:"
    echo -e "     ${YELLOW}pnpm status${NC}"
    echo ""
    echo -e "${CYAN}URLs des applications:${NC}"
    echo "  - Client PWA:      http://localhost:3000"
    echo "  - Pro WebApp:      http://localhost:3001"
    echo "  - Admin WebApp:    http://localhost:3002"
    echo "  - CallCenter:      http://localhost:3003"
    echo ""
    echo -e "${CYAN}Outils de développement:${NC}"
    echo "  - pgAdmin:         http://localhost:5050"
    echo "  - Kafka UI:        http://localhost:8080"
    echo "  - Redis Commander: http://localhost:8081"
    echo ""
}

main() {
    print_header "PTI CALENDAR SOLUTION - Installation"
    echo -e "Date: $(date)"

    check_requirements
    install_dependencies
    build_shared
    setup_env
    create_logs_dir
    show_next_steps
}

main
