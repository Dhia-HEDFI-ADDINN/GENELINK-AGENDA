# ============================================
# PTI CALENDAR - Script de demarrage complet
# ============================================

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$InfraDir = Join-Path $ScriptDir "pti-calendar-infrastructure"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "           PTI CALENDAR - Demarrage complet                     " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. Demarrage de l'infrastructure Docker
# ============================================
Write-Host "[1/4] Demarrage de l'infrastructure Docker..." -ForegroundColor Yellow

Set-Location $InfraDir
docker-compose -f docker-compose.dev.yml up -d

Write-Host "[OK] Infrastructure Docker demarree" -ForegroundColor Green

# ============================================
# 2. Attente que PostgreSQL soit pret
# ============================================
Write-Host "[2/4] Attente de PostgreSQL..." -ForegroundColor Yellow

$maxAttempts = 30
$attempt = 0
do {
    $attempt++
    $result = docker exec pti-postgres-dev pg_isready -U postgres 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
    }
} while ($LASTEXITCODE -ne 0 -and $attempt -lt $maxAttempts)

Write-Host ""
if ($attempt -ge $maxAttempts) {
    Write-Host "[ERREUR] PostgreSQL n'a pas demarre a temps" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] PostgreSQL est pret" -ForegroundColor Green

# ============================================
# 3. Creation des bases de donnees si necessaire
# ============================================
Write-Host "[3/4] Verification des bases de donnees..." -ForegroundColor Yellow

$databases = @("pti_user", "pti_planning", "pti_rdv", "pti_payment", "pti_notification", "pti_admin")

foreach ($db in $databases) {
    $exists = docker exec pti-postgres-dev psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db'" 2>$null
    if ($exists -ne "1") {
        Write-Host "  Creation de la base $db..."
        docker exec pti-postgres-dev psql -U postgres -c "CREATE DATABASE $db;" 2>$null | Out-Null
    }
}

Write-Host "[OK] Bases de donnees verifiees" -ForegroundColor Green

# ============================================
# 4. Affichage du statut
# ============================================
Write-Host "[4/4] Verification du statut..." -ForegroundColor Yellow

Write-Host ""
docker ps --filter "name=pti-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                    Services disponibles                        " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  PostgreSQL      : localhost:5433                              " -ForegroundColor Cyan
Write-Host "  Redis           : localhost:6380                              " -ForegroundColor Cyan
Write-Host "  Kafka           : localhost:9094                              " -ForegroundColor Cyan
Write-Host "  Kafka UI        : http://localhost:8084                       " -ForegroundColor Cyan
Write-Host "  pgAdmin         : http://localhost:5050                       " -ForegroundColor Cyan
Write-Host "  Redis Commander : http://localhost:8083                       " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Pour demarrer un microservice :                               " -ForegroundColor Cyan
Write-Host "  cd pti-calendar-user-service; npm run start:dev               " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[OK] PTI Calendar infrastructure prete !" -ForegroundColor Green

# Retour au repertoire initial
Set-Location $ScriptDir
