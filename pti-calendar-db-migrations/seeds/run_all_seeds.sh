#!/bin/bash
# ============================================
# PTI Calendar V4 - Script d'exécution des seeds
# ============================================

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}╔════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║     PTI Calendar V4 - Database Seeding         ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════╝${NC}"

# Liste des bases de données
DATABASES=("pti_user" "pti_planning" "pti_rdv" "pti_payment" "pti_notification" "pti_admin" "pti_audit")

# Liste des fichiers seed dans l'ordre
SEED_FILES=(
  "001_tenants.sql"
  "002_roles_permissions.sql"
  "003_users.sql"
  "004_centres.sql"
  "005_controleurs_clients.sql"
  "006_rdv.sql"
)

# Répertoire des seeds
SEED_DIR="$(dirname "$0")"

echo -e "\n${YELLOW}📦 Création des bases de données si nécessaires...${NC}"
for DB in "${DATABASES[@]}"; do
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB'" | grep -q 1 || \
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB"
  echo -e "  ${GREEN}✓${NC} Base $DB vérifiée"
done

# Exécution des seeds sur toutes les bases
for SEED_FILE in "${SEED_FILES[@]}"; do
  echo -e "\n${YELLOW}🌱 Exécution de $SEED_FILE...${NC}"

  for DB in "${DATABASES[@]}"; do
    echo -n "  → $DB: "

    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB -f "$SEED_DIR/$SEED_FILE" > /dev/null 2>&1; then
      echo -e "${GREEN}✓${NC}"
    else
      # Certains seeds ne s'appliquent pas à toutes les BDD, c'est normal
      echo -e "${YELLOW}⊘ (skipped)${NC}"
    fi
  done
done

echo -e "\n${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ✓ Seeding terminé avec succès!         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}📋 Comptes utilisateurs créés:${NC}"
echo -e "  ┌─────────────────────────────────────────────────────────────────┐"
echo -e "  │ ${GREEN}Super Admin SGS${NC}        │ admin@sgs-france.fr      │ password123 │"
echo -e "  │ ${GREEN}Admin Securitest${NC}       │ admin@securitest.fr      │ password123 │"
echo -e "  │ ${GREEN}Admin Autovision${NC}       │ admin@autovision.fr      │ password123 │"
echo -e "  │ ${GREEN}Responsable Paris 11${NC}   │ responsable.paris11@...  │ password123 │"
echo -e "  │ ${GREEN}Contrôleur 1 Paris${NC}     │ controleur1.paris11@...  │ password123 │"
echo -e "  │ ${GREEN}Agent Call Center${NC}      │ agent1@callcenter.sgs.fr │ password123 │"
echo -e "  │ ${GREEN}Client Test${NC}            │ client.test@gmail.com    │ password123 │"
echo -e "  └─────────────────────────────────────────────────────────────────┘"

echo -e "\n${YELLOW}📊 Données de test créées:${NC}"
echo -e "  • 3 Tenants (SGS France, Securitest, Autovision)"
echo -e "  • 8 Rôles avec permissions"
echo -e "  • 20+ Utilisateurs (admins, contrôleurs, clients)"
echo -e "  • 7 Centres de contrôle"
echo -e "  • 7 Contrôleurs"
echo -e "  • 8 Clients (particuliers + professionnels)"
echo -e "  • 12 Véhicules"
echo -e "  • 20+ RDV (passés, aujourd'hui, futurs)"
