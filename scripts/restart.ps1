# ============================================================================
# PTI CALENDAR SOLUTION - Script de redémarrage (PowerShell)
# ============================================================================
# Redémarre tous les composants PTI Calendar
# ============================================================================

param(
    [ValidateSet("all", "infra", "services", "apps")]
    [string]$Mode = "all",
    [switch]$Help
)

$ScriptDir = $PSScriptRoot

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Magenta
    Write-Host "  $Message" -ForegroundColor Magenta
    Write-Host "============================================================================" -ForegroundColor Magenta
    Write-Host ""
}

function Show-Usage {
    Write-Header "PTI CALENDAR - Redémarrage - Aide"
    Write-Host "Usage: .\restart.ps1 [-Mode <mode>]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Modes:" -ForegroundColor Cyan
    Write-Host "  all          Redémarrer tous les composants (défaut)"
    Write-Host "  infra        Redémarrer uniquement l'infrastructure"
    Write-Host "  services     Redémarrer uniquement les services backend"
    Write-Host "  apps         Redémarrer uniquement les applications frontend"
    Write-Host ""
}

function Main {
    if ($Help) {
        Show-Usage
        return
    }
    
    Write-Header "PTI CALENDAR SOLUTION - Redémarrage"
    Write-Host "Mode: $Mode" -ForegroundColor Cyan
    Write-Host "Date: $(Get-Date)"
    
    # Arrêter les composants
    Write-Host ""
    Write-Host "Arrêt des composants..." -ForegroundColor Yellow
    & "$ScriptDir\stop-all.ps1" -Mode $Mode
    
    # Attendre un peu
    Start-Sleep -Seconds 3
    
    # Redémarrer les composants
    Write-Host ""
    Write-Host "Démarrage des composants..." -ForegroundColor Yellow
    
    switch ($Mode) {
        "infra" {
            & "$ScriptDir\start-all.ps1" -Mode infra
        }
        "services" {
            & "$ScriptDir\start-all.ps1" -Mode services
        }
        "apps" {
            & "$ScriptDir\start-all.ps1" -Mode apps
        }
        default {
            & "$ScriptDir\start-all.ps1" -Mode dev
        }
    }
    
    Write-Header "Redémarrage terminé"
}

Main
