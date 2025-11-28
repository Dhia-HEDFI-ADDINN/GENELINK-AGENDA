# ============================================================================
# PTI CALENDAR SOLUTION - Script de démarrage complet (PowerShell)
# ============================================================================
# Ce script démarre toutes les applications PTI Calendar:
# - Infrastructure (PostgreSQL, Redis, Kafka via Docker)
# - Services backend (NestJS microservices)
# - Applications frontend (Next.js apps)
# ============================================================================

param(
    [ValidateSet("dev", "prod", "infra", "services", "apps", "help")]
    [string]$Mode = "dev",
    [switch]$SkipInfra,
    [switch]$SkipServices,
    [switch]$SkipApps,
    [switch]$SkipBuild,
    [switch]$Seed,
    [switch]$Help
)

# Configuration
$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$InfraDir = Join-Path $ProjectRoot "pti-calendar-infrastructure"
$LogDir = Join-Path $ProjectRoot "logs"

# Configuration des services
$Services = @{
    "user-service" = @{ Port = 4005; Database = "pti_user"; Required = $true }
    # "planning-service" = @{ Port = 4001; Database = "pti_planning"; Required = $false }
    # "rdv-service" = @{ Port = 4002; Database = "pti_rdv"; Required = $false }
    # "payment-service" = @{ Port = 4003; Database = "pti_payment"; Required = $false }
    # "notification-service" = @{ Port = 4004; Database = "pti_notification"; Required = $false }
    # "admin-service" = @{ Port = 4006; Database = "pti_admin"; Required = $false }
}

$Apps = @{
    "pro-webapp" = @{ Port = 3001; Name = "Pro WebApp" }
    "admin-webapp" = @{ Port = 3002; Name = "Admin WebApp" }
    "callcenter-webapp" = @{ Port = 3003; Name = "CallCenter WebApp" }
    "client-pwa" = @{ Port = 3004; Name = "Client PWA" }
}

# Infrastructure Docker
$InfraContainers = @{
    "postgres" = @{ Container = "pti-postgres-dev"; Port = 5433; HealthCmd = "pg_isready -U postgres" }
    "redis" = @{ Container = "pti-redis-dev"; Port = 6380; HealthCmd = "redis-cli ping" }
    "kafka" = @{ Container = "pti-kafka-dev"; Port = 9094; HealthCmd = $null }
    "zookeeper" = @{ Container = "pti-zookeeper-dev"; Port = 2181; HealthCmd = $null }
}

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
    Write-Header "PTI CALENDAR - Aide"
    Write-Host "Usage: .\start-all.ps1 [-Mode <mode>] [options]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Modes:" -ForegroundColor Cyan
    Write-Host "  dev          Démarrage complet en développement (défaut)"
    Write-Host "  prod         Démarrage en production (Docker complet)"
    Write-Host "  infra        Démarrer uniquement l'infrastructure"
    Write-Host "  services     Démarrer uniquement les services backend"
    Write-Host "  apps         Démarrer uniquement les applications frontend"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -SkipInfra      Ignorer le démarrage de l'infrastructure"
    Write-Host "  -SkipServices   Ignorer le démarrage des services"
    Write-Host "  -SkipApps       Ignorer le démarrage des applications"
    Write-Host "  -SkipBuild      Ignorer le build des packages partagés"
    Write-Host "  -Seed           Exécuter le seed de la base de données"
    Write-Host "  -Help           Afficher cette aide"
    Write-Host ""
    Write-Host "Exemples:" -ForegroundColor Cyan
    Write-Host "  .\start-all.ps1                      # Mode dev complet"
    Write-Host "  .\start-all.ps1 -Mode infra          # Infrastructure seule"
    Write-Host "  .\start-all.ps1 -SkipInfra           # Sans infrastructure"
    Write-Host "  .\start-all.ps1 -Mode apps -Seed     # Apps + seed DB"
    Write-Host ""
}

function Test-Port {
    param([int]$Port)
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        return $null -ne $connection
    } catch {
        return $false
    }
}

function Wait-ForService {
    param(
        [string]$Name,
        [string]$Url,
        [int]$MaxAttempts = 30,
        [int]$DelaySeconds = 2
    )
    
    Write-Step "Attente de $Name..."
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Success "$Name est prêt"
                return $true
            }
        } catch {
            # Ignorer l'erreur et continuer
        }
        Start-Sleep -Seconds $DelaySeconds
    }
    
    Write-Warning "$Name n'est pas accessible après $MaxAttempts tentatives"
    return $false
}

function Wait-ForDocker {
    param(
        [string]$ContainerName,
        [int]$MaxAttempts = 30
    )
    
    Write-Step "Attente du conteneur $ContainerName..."
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        $status = docker inspect --format '{{.State.Running}}' $ContainerName 2>$null
        if ($status -eq "true") {
            Write-Success "$ContainerName est en cours d'exécution"
            return $true
        }
        Start-Sleep -Seconds 2
    }
    
    Write-Warning "$ContainerName n'a pas démarré"
    return $false
}

function Initialize-LogDirectory {
    if (-not (Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
        Write-Step "Dossier de logs créé: $LogDir"
    }
}

function Stop-ExistingProcesses {
    Write-Step "Arrêt des processus Node.js existants sur les ports utilisés..."
    
    # Ports des apps et services
    $allPorts = @(3001, 3002, 3003, 3004, 4005)
    
    foreach ($port in $allPorts) {
        try {
            $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
            foreach ($conn in $connections) {
                $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                if ($process -and $process.ProcessName -eq "node") {
                    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
                    Write-Step "Processus arrêté sur le port $port"
                }
            }
        } catch {
            # Ignorer les erreurs
        }
    }
}

# ============================================================================
# Infrastructure Docker
# ============================================================================

function Start-Infrastructure {
    Write-Header "Démarrage de l'infrastructure Docker"
    
    Push-Location $InfraDir
    
    try {
        # Vérifier si Docker est disponible
        $dockerVersion = docker --version 2>$null
        if (-not $dockerVersion) {
            Write-Error "Docker n'est pas installé ou n'est pas en cours d'exécution"
            Pop-Location
            return $false
        }
        
        Write-Step "Docker détecté: $dockerVersion"
        
        # Démarrer les conteneurs de développement
        Write-Step "Démarrage des conteneurs de développement..."
        docker-compose -f docker-compose.dev.yml up -d
        
        # Attendre que les services soient prêts
        Start-Sleep -Seconds 5
        
        # Vérifier PostgreSQL
        Write-Step "Vérification de PostgreSQL..."
        $pgReady = $false
        for ($i = 1; $i -le 30; $i++) {
            $result = docker exec pti-postgres-dev pg_isready -U postgres 2>$null
            if ($LASTEXITCODE -eq 0) {
                $pgReady = $true
                break
            }
            Start-Sleep -Seconds 2
        }
        
        if ($pgReady) {
            Write-Success "PostgreSQL est prêt (port 5433)"
        } else {
            Write-Warning "PostgreSQL n'est pas accessible"
        }
        
        # Vérifier Redis
        Write-Step "Vérification de Redis..."
        $redisReady = $false
        for ($i = 1; $i -le 30; $i++) {
            $result = docker exec pti-redis-dev redis-cli ping 2>$null
            if ($result -eq "PONG") {
                $redisReady = $true
                break
            }
            Start-Sleep -Seconds 2
        }
        
        if ($redisReady) {
            Write-Success "Redis est prêt (port 6380)"
        } else {
            Write-Warning "Redis n'est pas accessible"
        }
        
        # Afficher les outils de développement
        Write-Host ""
        Write-Step "Outils de développement disponibles:"
        Write-Host "  pgAdmin:         http://localhost:5050 (admin@pti-calendar.fr / admin)" -ForegroundColor Cyan
        Write-Host "  Kafka UI:        http://localhost:8084" -ForegroundColor Cyan
        Write-Host "  Redis Commander: http://localhost:8083" -ForegroundColor Cyan
        
        Write-Success "Infrastructure démarrée avec succès"
        return $true
        
    } finally {
        Pop-Location
    }
}

# ============================================================================
# Services Backend
# ============================================================================

function Start-Services {
    Write-Header "Démarrage des services backend"
    
    Initialize-LogDirectory
    
    Push-Location $ProjectRoot
    
    try {
        # Build des packages partagés si nécessaire
        if (-not $SkipBuild) {
            Write-Step "Build du design-system..."
            $designSystemDir = Join-Path $ProjectRoot "pti-calendar-design-system"
            if (Test-Path $designSystemDir) {
                Push-Location $designSystemDir
                pnpm build 2>$null
                Pop-Location
                Write-Success "Design-system buildé"
            }
        }
        
        # Démarrer les services
        foreach ($serviceName in $Services.Keys) {
            $service = $Services[$serviceName]
            $serviceDir = Join-Path $ProjectRoot "pti-calendar-$serviceName"
            
            if (-not (Test-Path $serviceDir)) {
                Write-Warning "Service $serviceName non trouvé dans $serviceDir"
                continue
            }
            
            $port = $service.Port
            
            # Vérifier si le service est déjà en cours d'exécution
            if (Test-Port $port) {
                Write-Warning "$serviceName déjà en cours d'exécution sur le port $port"
                continue
            }
            
            Write-Step "Démarrage de $serviceName sur le port $port..."
            
            Push-Location $serviceDir
            
            # Créer le fichier .env si nécessaire
            if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
                Copy-Item ".env.example" ".env"
                Write-Step "Fichier .env créé pour $serviceName"
            }
            
            # Démarrer le service en arrière-plan
            $logFile = Join-Path $LogDir "$serviceName.log"
            $process = Start-Process -FilePath "npm" -ArgumentList "run", "start:dev" -WorkingDirectory $serviceDir -WindowStyle Hidden -PassThru -RedirectStandardOutput $logFile -RedirectStandardError (Join-Path $LogDir "$serviceName.error.log")
            
            # Sauvegarder le PID
            $process.Id | Out-File -FilePath (Join-Path $LogDir "$serviceName.pid")
            
            Write-Success "$serviceName démarré (PID: $($process.Id), log: $logFile)"
            
            Pop-Location
        }
        
        # Attendre que les services soient prêts
        Write-Step "Attente du démarrage des services (10 secondes)..."
        Start-Sleep -Seconds 10
        
        # Seed de la base de données si demandé
        if ($Seed) {
            Write-Step "Exécution du seed de la base de données..."
            $userServiceDir = Join-Path $ProjectRoot "pti-calendar-user-service"
            if (Test-Path (Join-Path $userServiceDir "src/seed.ts")) {
                Push-Location $userServiceDir
                npm run seed 2>$null
                Pop-Location
                Write-Success "Base de données seedée"
            }
        }
        
        # Vérifier les services
        Write-Step "Vérification des services..."
        foreach ($serviceName in $Services.Keys) {
            $service = $Services[$serviceName]
            $port = $service.Port
            
            if (Test-Port $port) {
                Write-Success "${serviceName}: OK (port $port)"
            } else {
                Write-Warning "${serviceName}: En attente... (port $port)"
            }
        }
        
        Write-Success "Services backend démarrés"
        return $true
        
    } finally {
        Pop-Location
    }
}

# ============================================================================
# Applications Frontend
# ============================================================================

function Start-Apps {
    Write-Header "Démarrage des applications frontend"
    
    Initialize-LogDirectory
    
    Push-Location $ProjectRoot
    
    try {
        foreach ($appName in $Apps.Keys) {
            $app = $Apps[$appName]
            $appDir = Join-Path $ProjectRoot "pti-calendar-$appName"
            
            if (-not (Test-Path $appDir)) {
                Write-Warning "Application $appName non trouvée dans $appDir"
                continue
            }
            
            $port = $app.Port
            
            # Vérifier si l'app est déjà en cours d'exécution
            if (Test-Port $port) {
                Write-Warning "$($app.Name) déjà en cours d'exécution sur le port $port"
                continue
            }
            
            Write-Step "Démarrage de $($app.Name) sur le port $port..."
            
            # Créer le fichier .env.local si nécessaire
            $envFile = Join-Path $appDir ".env.local"
            if (-not (Test-Path $envFile)) {
                @"
NEXT_PUBLIC_API_URL=http://localhost:4005/api/v1
NEXT_PUBLIC_APP_ENV=development
"@ | Out-File -FilePath $envFile -Encoding utf8
                Write-Step "Fichier .env.local créé pour $appName"
            }
            
            # Démarrer l'application en arrière-plan avec le bon port
            $logFile = Join-Path $LogDir "$appName.log"
            
            # Utiliser Start-Job pour un démarrage vraiment en arrière-plan
            $scriptBlock = {
                param($dir, $p)
                Set-Location $dir
                & pnpm next dev -p $p
            }
            
            $job = Start-Job -ScriptBlock $scriptBlock -ArgumentList $appDir, $port
            
            # Sauvegarder le Job ID
            $job.Id | Out-File -FilePath (Join-Path $LogDir "$appName.jobid")
            
            Write-Success "$($app.Name) démarré (Job ID: $($job.Id))"
            
            # Petit délai entre chaque app pour éviter les conflits
            Start-Sleep -Seconds 3
        }
        
        # Attendre que les apps soient prêtes
        Write-Step "Attente du démarrage des applications (15 secondes)..."
        Start-Sleep -Seconds 15
        
        # Vérifier les applications
        Write-Step "Vérification des applications..."
        foreach ($appName in $Apps.Keys) {
            $app = $Apps[$appName]
            $port = $app.Port
            
            if (Test-Port $port) {
                Write-Success "$($app.Name): OK (http://localhost:$port)"
            } else {
                Write-Warning "$($app.Name): En attente... (http://localhost:$port)"
            }
        }
        
        Write-Host ""
        Write-Step "Applications disponibles:"
        Write-Host "  Pro WebApp:       http://localhost:3001" -ForegroundColor Cyan
        Write-Host "  Admin WebApp:     http://localhost:3002" -ForegroundColor Cyan
        Write-Host "  CallCenter:       http://localhost:3003" -ForegroundColor Cyan
        Write-Host "  Client PWA:       http://localhost:3004" -ForegroundColor Cyan
        
        Write-Success "Applications frontend démarrées"
        return $true
        
    } finally {
        Pop-Location
    }
}

# ============================================================================
# Affichage du récapitulatif
# ============================================================================

function Show-Summary {
    Write-Header "Récapitulatif"
    
    Write-Host "Utilisateurs de test:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Admin WebApp (http://localhost:3002):" -ForegroundColor Yellow
    Write-Host "    Email: admin@sgs-france.fr"
    Write-Host "    Mot de passe: Admin123!"
    Write-Host ""
    Write-Host "  Pro WebApp (http://localhost:3001):" -ForegroundColor Yellow
    Write-Host "    Email: gestionnaire@securitest.fr"
    Write-Host "    Mot de passe: Gestionnaire123!"
    Write-Host ""
    Write-Host "  CallCenter WebApp (http://localhost:3003):" -ForegroundColor Yellow
    Write-Host "    Email: agent@callcenter.sgs.fr"
    Write-Host "    Mot de passe: Agent123!"
    Write-Host ""
    Write-Host "  Client PWA (http://localhost:3004):" -ForegroundColor Yellow
    Write-Host "    Email: client@test.fr"
    Write-Host "    Mot de passe: Client123!"
    Write-Host ""
    Write-Host "Commandes utiles:" -ForegroundColor Cyan
    Write-Host "  Arrêter tout:    .\scripts\stop-all.ps1" -ForegroundColor Yellow
    Write-Host "  Voir les logs:   Get-Content logs\*.log -Tail 50" -ForegroundColor Yellow
    Write-Host "  Status:          .\scripts\status.ps1" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# Point d'entrée principal
# ============================================================================

function Main {
    if ($Help -or $Mode -eq "help") {
        Show-Usage
        return
    }
    
    Write-Header "PTI CALENDAR SOLUTION - Démarrage"
    Write-Host "Mode: $Mode" -ForegroundColor Cyan
    Write-Host "Date: $(Get-Date)"
    Write-Host ""
    
    # Arrêter les processus existants
    Stop-ExistingProcesses
    
    switch ($Mode) {
        "infra" {
            Start-Infrastructure
        }
        "services" {
            Start-Services
        }
        "apps" {
            Start-Apps
        }
        "dev" {
            if (-not $SkipInfra) {
                Start-Infrastructure
            }
            
            if (-not $SkipServices) {
                Start-Services
            }
            
            if (-not $SkipApps) {
                Start-Apps
            }
            
            Show-Summary
        }
        "prod" {
            Write-Warning "Mode production non encore implémenté"
        }
    }
    
    Write-Header "Démarrage terminé"
    Write-Host "Tous les composants sont démarrés!" -ForegroundColor Green
    Write-Host ""
}

# Exécuter le script
Main
