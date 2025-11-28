# ============================================================================
# PTI CALENDAR SOLUTION - Script d'arrêt complet (PowerShell)
# ============================================================================
# Ce script arrête toutes les applications PTI Calendar
# ============================================================================

param(
    [ValidateSet("all", "infra", "services", "apps", "clean", "help")]
    [string]$Mode = "all",
    [switch]$KeepVolumes,
    [switch]$Help
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$InfraDir = Join-Path $ProjectRoot "pti-calendar-infrastructure"
$LogDir = Join-Path $ProjectRoot "logs"

# Configuration des ports
$ServicePorts = @(4005, 4001, 4002, 4003, 4004, 4006)
$AppPorts = @(3001, 3002, 3003, 3004)

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

function Show-Usage {
    Write-Header "PTI CALENDAR - Arrêt - Aide"
    Write-Host "Usage: .\stop-all.ps1 [-Mode <mode>] [options]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Modes:" -ForegroundColor Cyan
    Write-Host "  all          Arrêter tous les composants (défaut)"
    Write-Host "  infra        Arrêter uniquement l'infrastructure Docker"
    Write-Host "  services     Arrêter uniquement les services backend"
    Write-Host "  apps         Arrêter uniquement les applications frontend"
    Write-Host "  clean        Arrêter tout et nettoyer (logs, volumes)"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -KeepVolumes    Garder les volumes Docker lors du clean"
    Write-Host "  -Help           Afficher cette aide"
    Write-Host ""
}

function Stop-ProcessOnPort {
    param([int]$Port)
    
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
                return $true
            }
        }
    } catch {
        # Ignorer les erreurs
    }
    return $false
}

# ============================================================================
# Arrêt des applications
# ============================================================================

function Stop-Apps {
    Write-Header "Arrêt des applications frontend"
    
    foreach ($port in $AppPorts) {
        Write-Step "Arrêt de l'application sur le port $port..."
        if (Stop-ProcessOnPort $port) {
            Write-Success "Application arrêtée (port $port)"
        }
    }
    
    # Supprimer les fichiers PID
    $apps = @("pro-webapp", "admin-webapp", "callcenter-webapp", "client-pwa")
    foreach ($app in $apps) {
        $pidFile = Join-Path $LogDir "$app.pid"
        if (Test-Path $pidFile) {
            Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
        }
    }
    
    Write-Success "Applications frontend arrêtées"
}

# ============================================================================
# Arrêt des services
# ============================================================================

function Stop-Services {
    Write-Header "Arrêt des services backend"
    
    foreach ($port in $ServicePorts) {
        Write-Step "Arrêt du service sur le port $port..."
        if (Stop-ProcessOnPort $port) {
            Write-Success "Service arrêté (port $port)"
        }
    }
    
    # Supprimer les fichiers PID
    $services = @("user-service", "planning-service", "rdv-service", "payment-service", "notification-service", "admin-service")
    foreach ($service in $services) {
        $pidFile = Join-Path $LogDir "$service.pid"
        if (Test-Path $pidFile) {
            Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
        }
    }
    
    Write-Success "Services backend arrêtés"
}

# ============================================================================
# Arrêt de l'infrastructure
# ============================================================================

function Stop-Infrastructure {
    Write-Header "Arrêt de l'infrastructure Docker"
    
    Push-Location $InfraDir
    
    try {
        # Vérifier si Docker est disponible
        $dockerRunning = docker ps 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Docker n'est pas en cours d'exécution"
            Pop-Location
            return
        }
        
        Write-Step "Arrêt des conteneurs de développement..."
        
        if ($Mode -eq "clean" -and -not $KeepVolumes) {
            docker-compose -f docker-compose.dev.yml down -v 2>$null
            Write-Warning "Volumes Docker supprimés"
        } else {
            docker-compose -f docker-compose.dev.yml down 2>$null
        }
        
        Write-Success "Infrastructure Docker arrêtée"
        
    } finally {
        Pop-Location
    }
}

# ============================================================================
# Nettoyage
# ============================================================================

function Clear-All {
    Write-Header "Nettoyage complet"
    
    # Supprimer les fichiers de log
    Write-Step "Suppression des fichiers de log..."
    if (Test-Path $LogDir) {
        Get-ChildItem -Path $LogDir -Include "*.log", "*.pid" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
        Write-Success "Fichiers de log supprimés"
    }
    
    # Nettoyer les volumes Docker orphelins
    Write-Step "Nettoyage des volumes Docker orphelins..."
    docker volume prune -f 2>$null
    
    # Nettoyer les réseaux Docker
    Write-Step "Nettoyage des réseaux Docker..."
    docker network prune -f 2>$null
    
    Write-Success "Nettoyage terminé"
}

# ============================================================================
# Point d'entrée principal
# ============================================================================

function Main {
    if ($Help -or $Mode -eq "help") {
        Show-Usage
        return
    }
    
    Write-Header "PTI CALENDAR SOLUTION - Arrêt"
    Write-Host "Mode: $Mode" -ForegroundColor Cyan
    Write-Host "Date: $(Get-Date)"
    
    switch ($Mode) {
        "apps" {
            Stop-Apps
        }
        "services" {
            Stop-Services
        }
        "infra" {
            Stop-Infrastructure
        }
        "clean" {
            Stop-Apps
            Stop-Services
            Stop-Infrastructure
            Clear-All
        }
        default {
            Stop-Apps
            Stop-Services
            Stop-Infrastructure
        }
    }
    
    Write-Header "Arrêt terminé"
    Write-Host "Tous les composants ont été arrêtés!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pour redémarrer: .\scripts\start-all.ps1" -ForegroundColor Yellow
    Write-Host ""
}

Main
