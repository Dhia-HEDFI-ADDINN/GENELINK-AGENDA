# ============================================================================
# PTI CALENDAR SOLUTION - Script de status (PowerShell)
# ============================================================================
# Affiche l'état de tous les composants PTI Calendar
# ============================================================================

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$LogDir = Join-Path $ProjectRoot "logs"

# Configuration
$InfraContainers = @(
    @{ Name = "PostgreSQL"; Container = "pti-postgres-dev"; Port = 5433 }
    @{ Name = "Redis"; Container = "pti-redis-dev"; Port = 6380 }
    @{ Name = "Kafka"; Container = "pti-kafka-dev"; Port = 9094 }
    @{ Name = "Zookeeper"; Container = "pti-zookeeper-dev"; Port = 2181 }
    @{ Name = "pgAdmin"; Container = "pti-pgadmin"; Port = 5050 }
    @{ Name = "Kafka UI"; Container = "pti-kafka-ui"; Port = 8084 }
    @{ Name = "Redis Commander"; Container = "pti-redis-commander"; Port = 8083 }
)

$Services = @(
    @{ Name = "User Service"; Port = 4005; HealthEndpoint = "/api/v1/health" }
    # @{ Name = "Planning Service"; Port = 4001; HealthEndpoint = "/health" }
    # @{ Name = "RDV Service"; Port = 4002; HealthEndpoint = "/health" }
    # @{ Name = "Payment Service"; Port = 4003; HealthEndpoint = "/health" }
    # @{ Name = "Notification Service"; Port = 4004; HealthEndpoint = "/health" }
    # @{ Name = "Admin Service"; Port = 4006; HealthEndpoint = "/health" }
)

$Apps = @(
    @{ Name = "Pro WebApp"; Port = 3001 }
    @{ Name = "Admin WebApp"; Port = 3002 }
    @{ Name = "CallCenter WebApp"; Port = 3003 }
    @{ Name = "Client PWA"; Port = 3004 }
)

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

function Write-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━ $Message ━━━" -ForegroundColor Cyan
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

function Test-HttpEndpoint {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 3
    )
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSeconds -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Get-ContainerStatus {
    param([string]$ContainerName)
    
    try {
        $status = docker inspect --format '{{.State.Status}}' $ContainerName 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $status
        }
    } catch {
        # Ignorer les erreurs
    }
    return "not found"
}

function Show-Status {
    param(
        [string]$Name,
        [bool]$IsUp,
        [string]$Details = ""
    )
    
    if ($IsUp) {
        Write-Host "  " -NoNewline
        Write-Host "●" -ForegroundColor Green -NoNewline
        Write-Host " $Name " -NoNewline
        Write-Host "(UP)" -ForegroundColor Green -NoNewline
        if ($Details) {
            Write-Host " - $Details" -ForegroundColor DarkGray
        } else {
            Write-Host ""
        }
    } else {
        Write-Host "  " -NoNewline
        Write-Host "●" -ForegroundColor Red -NoNewline
        Write-Host " $Name " -NoNewline
        Write-Host "(DOWN)" -ForegroundColor Red -NoNewline
        if ($Details) {
            Write-Host " - $Details" -ForegroundColor DarkGray
        } else {
            Write-Host ""
        }
    }
}

# ============================================================================
# Vérifications
# ============================================================================

function Check-Infrastructure {
    Write-Section "Infrastructure Docker"
    
    $dockerRunning = docker ps 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Docker n'est pas en cours d'exécution" -ForegroundColor Yellow
        return 0
    }
    
    $upCount = 0
    
    foreach ($container in $InfraContainers) {
        $status = Get-ContainerStatus $container.Container
        $isUp = $status -eq "running"
        if ($isUp) { $upCount++ }
        
        $details = "port $($container.Port)"
        if ($container.Port -eq 5050) { $details = "http://localhost:5050" }
        if ($container.Port -eq 8084) { $details = "http://localhost:8084" }
        if ($container.Port -eq 8083) { $details = "http://localhost:8083" }
        
        Show-Status -Name $container.Name -IsUp $isUp -Details $details
    }
    
    return $upCount
}

function Check-Services {
    Write-Section "Services Backend (NestJS)"
    
    $upCount = 0
    
    foreach ($service in $Services) {
        $isUp = Test-Port $service.Port
        if ($isUp) { $upCount++ }
        
        $details = "http://localhost:$($service.Port)"
        Show-Status -Name $service.Name -IsUp $isUp -Details $details
    }
    
    return $upCount
}

function Check-Apps {
    Write-Section "Applications Frontend (Next.js)"
    
    $upCount = 0
    
    foreach ($app in $Apps) {
        $isUp = Test-Port $app.Port
        if ($isUp) { $upCount++ }
        
        $details = "http://localhost:$($app.Port)"
        Show-Status -Name $app.Name -IsUp $isUp -Details $details
    }
    
    return $upCount
}

function Show-LogFiles {
    Write-Section "Fichiers de log"
    
    if (-not (Test-Path $LogDir)) {
        Write-Host "  Aucun fichier de log" -ForegroundColor DarkGray
        return
    }
    
    $logFiles = Get-ChildItem -Path $LogDir -Filter "*.log" -ErrorAction SilentlyContinue
    
    if ($logFiles.Count -eq 0) {
        Write-Host "  Aucun fichier de log" -ForegroundColor DarkGray
        return
    }
    
    foreach ($log in $logFiles) {
        $size = "{0:N2} KB" -f ($log.Length / 1KB)
        $lines = (Get-Content $log.FullName -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
        Write-Host "  $($log.Name): $size ($lines lignes)" -ForegroundColor DarkGray
    }
}

function Show-TestUsers {
    Write-Section "Utilisateurs de test"
    
    Write-Host ""
    Write-Host "  Admin WebApp (http://localhost:3002):" -ForegroundColor Yellow
    Write-Host "    admin@sgs-france.fr / Admin123!" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Pro WebApp (http://localhost:3001):" -ForegroundColor Yellow
    Write-Host "    gestionnaire@securitest.fr / Gestionnaire123!" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  CallCenter (http://localhost:3003):" -ForegroundColor Yellow
    Write-Host "    agent@callcenter.sgs.fr / Agent123!" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Client PWA (http://localhost:3004):" -ForegroundColor Yellow
    Write-Host "    client@test.fr / Client123!" -ForegroundColor DarkGray
}

# ============================================================================
# Point d'entrée principal
# ============================================================================

function Main {
    Write-Header "PTI CALENDAR SOLUTION - Status"
    Write-Host "Date: $(Get-Date)"
    
    $infraUp = Check-Infrastructure
    $servicesUp = Check-Services
    $appsUp = Check-Apps
    
    Write-Section "Résumé"
    Write-Host "  Conteneurs Docker:  $infraUp/$($InfraContainers.Count) actifs" -ForegroundColor Cyan
    Write-Host "  Services Backend:   $servicesUp/$($Services.Count) actifs" -ForegroundColor Cyan
    Write-Host "  Applications:       $appsUp/$($Apps.Count) actives" -ForegroundColor Cyan
    
    Show-LogFiles
    Show-TestUsers
    
    Write-Host ""
}

Main
