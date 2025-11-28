# ============================================================================
# PTI CALENDAR SOLUTION - Script de visualisation des logs (PowerShell)
# ============================================================================
# Affiche les logs des différents composants
# ============================================================================

param(
    [ValidateSet("all", "services", "apps", "user-service", "pro-webapp", "admin-webapp", "callcenter-webapp", "client-pwa")]
    [string]$Component = "all",
    [int]$Lines = 50,
    [switch]$Follow,
    [switch]$Help
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$LogDir = Join-Path $ProjectRoot "logs"

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Magenta
    Write-Host "  $Message" -ForegroundColor Magenta
    Write-Host "============================================================================" -ForegroundColor Magenta
    Write-Host ""
}

function Show-Usage {
    Write-Header "PTI CALENDAR - Logs - Aide"
    Write-Host "Usage: .\logs.ps1 [-Component <component>] [-Lines <n>] [-Follow]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Components:" -ForegroundColor Cyan
    Write-Host "  all              Tous les logs"
    Write-Host "  services         Logs des services backend"
    Write-Host "  apps             Logs des applications frontend"
    Write-Host "  user-service     Logs du user-service"
    Write-Host "  pro-webapp       Logs de la pro-webapp"
    Write-Host "  admin-webapp     Logs de l'admin-webapp"
    Write-Host "  callcenter-webapp Logs de la callcenter-webapp"
    Write-Host "  client-pwa       Logs de la client-pwa"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -Lines <n>       Nombre de lignes à afficher (défaut: 50)"
    Write-Host "  -Follow          Suivre les logs en temps réel"
    Write-Host "  -Help            Afficher cette aide"
    Write-Host ""
    Write-Host "Exemples:" -ForegroundColor Cyan
    Write-Host "  .\logs.ps1 -Component user-service -Lines 100"
    Write-Host "  .\logs.ps1 -Component apps -Follow"
    Write-Host ""
}

function Show-LogFile {
    param(
        [string]$LogFile,
        [int]$TailLines,
        [bool]$FollowMode
    )
    
    if (-not (Test-Path $LogFile)) {
        Write-Host "Fichier non trouvé: $LogFile" -ForegroundColor Yellow
        return
    }
    
    $fileName = Split-Path -Leaf $LogFile
    Write-Host ""
    Write-Host "━━━ $fileName ━━━" -ForegroundColor Cyan
    
    if ($FollowMode) {
        Get-Content $LogFile -Tail $TailLines -Wait
    } else {
        Get-Content $LogFile -Tail $TailLines
    }
}

function Main {
    if ($Help) {
        Show-Usage
        return
    }
    
    if (-not (Test-Path $LogDir)) {
        Write-Host "Aucun dossier de logs trouvé: $LogDir" -ForegroundColor Yellow
        Write-Host "Lancez d'abord les services avec: .\scripts\start-all.ps1" -ForegroundColor Yellow
        return
    }
    
    Write-Header "PTI CALENDAR SOLUTION - Logs"
    Write-Host "Component: $Component" -ForegroundColor Cyan
    Write-Host "Lignes: $Lines"
    if ($Follow) {
        Write-Host "Mode: Follow (Ctrl+C pour quitter)" -ForegroundColor Yellow
    }
    
    $logFiles = @()
    
    switch ($Component) {
        "all" {
            $logFiles = Get-ChildItem -Path $LogDir -Filter "*.log" -ErrorAction SilentlyContinue
        }
        "services" {
            $logFiles = Get-ChildItem -Path $LogDir -Filter "*-service.log" -ErrorAction SilentlyContinue
        }
        "apps" {
            $logFiles = Get-ChildItem -Path $LogDir -Filter "*-webapp.log" -ErrorAction SilentlyContinue
            $logFiles += Get-ChildItem -Path $LogDir -Filter "*-pwa.log" -ErrorAction SilentlyContinue
        }
        default {
            $logFile = Join-Path $LogDir "$Component.log"
            if (Test-Path $logFile) {
                $logFiles = @(Get-Item $logFile)
            }
        }
    }
    
    if ($logFiles.Count -eq 0) {
        Write-Host "Aucun fichier de log trouvé pour: $Component" -ForegroundColor Yellow
        return
    }
    
    foreach ($logFile in $logFiles) {
        Show-LogFile -LogFile $logFile.FullName -TailLines $Lines -FollowMode $Follow
    }
}

Main
