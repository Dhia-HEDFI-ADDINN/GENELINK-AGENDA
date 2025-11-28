# ============================================================================
# PTI CALENDAR SOLUTION - Script d'installation (PowerShell)
# ============================================================================
# Installe toutes les dépendances et prépare l'environnement
# ============================================================================

param(
    [switch]$SkipDocker,
    [switch]$SkipBuild,
    [switch]$Help
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$InfraDir = Join-Path $ProjectRoot "pti-calendar-infrastructure"

# ============================================================================
# Fonctions utilitaires
# ============================================================================

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Magenta
    Write-Host "  $Message" -ForegroundColor Magenta
    Write-Host "============================================================================" -ForegroundColor Magenta
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host "[INFO] " -ForegroundColor Blue -NoNewline
    Write-Host $Message
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] " -ForegroundColor Green -NoNewline
    Write-Host $Message
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] " -ForegroundColor Red -NoNewline
    Write-Host $Message
}

function Show-Usage {
    Write-Header "PTI CALENDAR - Installation - Aide"
    Write-Host "Usage: .\install.ps1 [options]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -SkipDocker    Ignorer la configuration Docker"
    Write-Host "  -SkipBuild     Ignorer le build des packages partagés"
    Write-Host "  -Help          Afficher cette aide"
    Write-Host ""
}

# ============================================================================
# Vérification des prérequis
# ============================================================================

function Check-Requirements {
    Write-Header "Vérification des prérequis"
    
    # Node.js
    try {
        $nodeVersion = node -v
        Write-Success "Node.js: $nodeVersion"
    } catch {
        Write-Error "Node.js n'est pas installé"
        Write-Host "  Téléchargez Node.js depuis: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
    
    # pnpm
    try {
        $pnpmVersion = pnpm -v
        Write-Success "pnpm: $pnpmVersion"
    } catch {
        Write-Warning "pnpm n'est pas installé, installation..."
        npm install -g pnpm
        Write-Success "pnpm installé"
    }
    
    # Docker (optionnel)
    if (-not $SkipDocker) {
        try {
            $dockerVersion = docker --version
            Write-Success "Docker: $dockerVersion"
        } catch {
            Write-Warning "Docker n'est pas installé (recommandé pour l'infrastructure)"
        }
        
        # Docker Compose
        try {
            docker compose version 2>$null
            Write-Success "Docker Compose: installé"
        } catch {
            try {
                docker-compose --version 2>$null
                Write-Success "Docker Compose (legacy): installé"
            } catch {
                Write-Warning "Docker Compose n'est pas installé"
            }
        }
    }
}

# ============================================================================
# Installation des dépendances
# ============================================================================

function Install-Dependencies {
    Write-Header "Installation des dépendances"
    
    Push-Location $ProjectRoot
    
    try {
        Write-Step "Installation des packages npm via pnpm..."
        pnpm install
        Write-Success "Dépendances installées"
        
        # Installer les dépendances du user-service séparément (npm)
        $userServiceDir = Join-Path $ProjectRoot "pti-calendar-user-service"
        if (Test-Path $userServiceDir) {
            Write-Step "Installation des dépendances du user-service..."
            Push-Location $userServiceDir
            npm install
            Pop-Location
            Write-Success "Dépendances user-service installées"
        }
        
    } finally {
        Pop-Location
    }
}

# ============================================================================
# Build des packages partagés
# ============================================================================

function Build-SharedPackages {
    Write-Header "Build des packages partagés"
    
    Push-Location $ProjectRoot
    
    try {
        # Build design-system
        $designSystemDir = Join-Path $ProjectRoot "pti-calendar-design-system"
        if (Test-Path $designSystemDir) {
            Write-Step "Build de @pti-calendar/design-system..."
            Push-Location $designSystemDir
            pnpm build
            Pop-Location
            Write-Success "Design-system buildé"
        }
        
        # Build shared-types
        $sharedTypesDir = Join-Path $ProjectRoot "pti-calendar-shared-types"
        if (Test-Path $sharedTypesDir) {
            Write-Step "Build de @pti-calendar/shared-types..."
            Push-Location $sharedTypesDir
            pnpm build 2>$null
            Pop-Location
            Write-Success "Shared-types buildé"
        }
        
        # Build shared-utils
        $sharedUtilsDir = Join-Path $ProjectRoot "pti-calendar-shared-utils"
        if (Test-Path $sharedUtilsDir) {
            Write-Step "Build de @pti-calendar/shared-utils..."
            Push-Location $sharedUtilsDir
            pnpm build 2>$null
            Pop-Location
            Write-Success "Shared-utils buildé"
        }
        
        # Build api-client
        $apiClientDir = Join-Path $ProjectRoot "pti-calendar-api-client"
        if (Test-Path $apiClientDir) {
            Write-Step "Build de @pti-calendar/api-client..."
            Push-Location $apiClientDir
            pnpm build 2>$null
            Pop-Location
            Write-Success "API-client buildé"
        }
        
    } finally {
        Pop-Location
    }
}

# ============================================================================
# Configuration de l'environnement
# ============================================================================

function Setup-Environment {
    Write-Header "Configuration de l'environnement"
    
    # Services backend
    $services = @("user-service", "planning-service", "rdv-service", "payment-service", "notification-service", "admin-service", "audit-service")
    $servicePort = 4005
    
    foreach ($service in $services) {
        $serviceDir = Join-Path $ProjectRoot "pti-calendar-$service"
        $envFile = Join-Path $serviceDir ".env"
        $envExample = Join-Path $serviceDir ".env.example"
        
        if (Test-Path $serviceDir) {
            if (-not (Test-Path $envFile) -and (Test-Path $envExample)) {
                Copy-Item $envExample $envFile
                Write-Step "Créé: $envFile (copie de .env.example)"
            } elseif (-not (Test-Path $envFile)) {
                # Créer un fichier .env de base
                $dbName = "pti_" + ($service -replace "-service", "")
                @"
NODE_ENV=development
PORT=$servicePort
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=$dbName
REDIS_HOST=localhost
REDIS_PORT=6380
KAFKA_BROKERS=localhost:9094
JWT_SECRET=development-secret-key-change-in-production
JWT_REFRESH_SECRET=development-refresh-secret-key
"@ | Out-File -FilePath $envFile -Encoding utf8
                Write-Step "Créé: $envFile (configuration par défaut)"
            }
        }
        $servicePort++
    }
    
    # Applications frontend
    $apps = @("client-pwa", "pro-webapp", "admin-webapp", "callcenter-webapp")
    
    foreach ($app in $apps) {
        $appDir = Join-Path $ProjectRoot "pti-calendar-$app"
        $envFile = Join-Path $appDir ".env.local"
        
        if ((Test-Path $appDir) -and -not (Test-Path $envFile)) {
            @"
NEXT_PUBLIC_API_URL=http://localhost:4005/api/v1
NEXT_PUBLIC_APP_ENV=development
"@ | Out-File -FilePath $envFile -Encoding utf8
            Write-Step "Créé: $envFile"
        }
    }
    
    Write-Success "Environnement configuré"
}

# ============================================================================
# Création du dossier de logs
# ============================================================================

function Create-LogsDirectory {
    $logDir = Join-Path $ProjectRoot "logs"
    
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        Write-Step "Dossier de logs créé: $logDir"
    }
}

# ============================================================================
# Affichage des prochaines étapes
# ============================================================================

function Show-NextSteps {
    Write-Header "Installation terminée"
    
    Write-Host "L'installation est terminée!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  1. Démarrer l'infrastructure Docker:" -ForegroundColor White
    Write-Host "     .\scripts\start-all.ps1 -Mode infra" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  2. Démarrer tous les services et applications:" -ForegroundColor White
    Write-Host "     .\scripts\start-all.ps1" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  3. Seed de la base de données (utilisateurs de test):" -ForegroundColor White
    Write-Host "     .\scripts\start-all.ps1 -Seed" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  4. Vérifier le status:" -ForegroundColor White
    Write-Host "     .\scripts\status.ps1" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "URLs des applications:" -ForegroundColor Cyan
    Write-Host "  - Pro WebApp:       http://localhost:3001"
    Write-Host "  - Admin WebApp:     http://localhost:3002"
    Write-Host "  - CallCenter:       http://localhost:3003"
    Write-Host "  - Client PWA:       http://localhost:3004"
    Write-Host ""
    Write-Host "Outils de développement:" -ForegroundColor Cyan
    Write-Host "  - pgAdmin:          http://localhost:5050 (admin@pti-calendar.fr / admin)"
    Write-Host "  - Kafka UI:         http://localhost:8084"
    Write-Host "  - Redis Commander:  http://localhost:8083"
    Write-Host ""
}

# ============================================================================
# Point d'entrée principal
# ============================================================================

function Main {
    if ($Help) {
        Show-Usage
        return
    }
    
    Write-Header "PTI CALENDAR SOLUTION - Installation"
    Write-Host "Date: $(Get-Date)"
    
    Check-Requirements
    Install-Dependencies
    
    if (-not $SkipBuild) {
        Build-SharedPackages
    }
    
    Setup-Environment
    Create-LogsDirectory
    Show-NextSteps
}

Main
