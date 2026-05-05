# Script de redémarrage du Materials Service
# Usage: .\restart-materials-service.ps1

Write-Host "🔄 Redémarrage du Materials Service..." -ForegroundColor Cyan

# 1. Trouver et arrêter le processus actuel
Write-Host "`n1️⃣ Recherche du processus materials-service..." -ForegroundColor Yellow

$processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*materials-service*" -or 
    $_.Path -like "*materials-service*"
}

if ($processes) {
    foreach ($proc in $processes) {
        Write-Host "   ⏹️  Arrêt du processus PID $($proc.Id)..." -ForegroundColor Red
        Stop-Process -Id $proc.Id -Force
    }
    Write-Host "   ✅ Processus arrêté" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ℹ️  Aucun processus materials-service en cours" -ForegroundColor Gray
}

# 2. Redémarrer le service
Write-Host "`n2️⃣ Démarrage du service..." -ForegroundColor Yellow
Set-Location "apps/backend/materials-service"

Write-Host "   📦 Vérification des dépendances..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "   📥 Installation des dépendances..." -ForegroundColor Yellow
    npm install
}

Write-Host "`n   🚀 Lancement de npm run start:dev..." -ForegroundColor Green
Write-Host "   ⚠️  Le service va démarrer dans une nouvelle fenêtre" -ForegroundColor Yellow
Write-Host "   ⚠️  NE PAS FERMER cette fenêtre!" -ForegroundColor Red

Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run start:dev"

Write-Host "`n✅ Service redémarré!" -ForegroundColor Green
Write-Host "📊 Vérifiez les logs dans la nouvelle fenêtre" -ForegroundColor Cyan
Write-Host "🌐 Le service devrait être disponible sur http://localhost:3009" -ForegroundColor Cyan

Set-Location "../../.."
