# Script PowerShell pour redémarrer le service materials
# Usage: .\restart-service.ps1

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     REDÉMARRAGE DU SERVICE MATERIALS                           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Vérifier si on est dans le bon répertoire
$currentDir = Get-Location
if ($currentDir.Path -notlike "*materials-service*") {
    Write-Host "⚠️  Attention: Vous n'êtes pas dans le répertoire materials-service" -ForegroundColor Yellow
    Write-Host "   Répertoire actuel: $currentDir" -ForegroundColor Yellow
    Write-Host "`n   Changement de répertoire..." -ForegroundColor Yellow
    
    # Essayer de trouver le répertoire materials-service
    if (Test-Path "apps/backend/materials-service") {
        Set-Location "apps/backend/materials-service"
        Write-Host "   ✅ Déplacé vers: $(Get-Location)`n" -ForegroundColor Green
    } elseif (Test-Path "materials-service") {
        Set-Location "materials-service"
        Write-Host "   ✅ Déplacé vers: $(Get-Location)`n" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Impossible de trouver le répertoire materials-service" -ForegroundColor Red
        Write-Host "   💡 Exécutez ce script depuis la racine du projet ou depuis materials-service`n" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "📂 Répertoire: $(Get-Location)`n" -ForegroundColor Cyan

# Vérifier si package.json existe
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: package.json non trouvé" -ForegroundColor Red
    Write-Host "   Assurez-vous d'être dans le répertoire materials-service`n" -ForegroundColor Yellow
    exit 1
}

# Vérifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules non trouvé. Installation des dépendances..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Erreur lors de l'installation des dépendances`n" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dépendances installées`n" -ForegroundColor Green
}

# Arrêter les processus Node existants sur le port 3009 (si nécessaire)
Write-Host "🔍 Vérification des processus existants sur le port 3009..." -ForegroundColor Cyan
$processes = Get-NetTCPConnection -LocalPort 3009 -ErrorAction SilentlyContinue
if ($processes) {
    Write-Host "⚠️  Un processus utilise déjà le port 3009" -ForegroundColor Yellow
    Write-Host "   Arrêt du processus..." -ForegroundColor Yellow
    
    foreach ($proc in $processes) {
        $processId = $proc.OwningProcess
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Processus $processId arrêté" -ForegroundColor Green
    }
    Start-Sleep -Seconds 2
}

Write-Host "`n🚀 Démarrage du service materials...`n" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Démarrer le service
Write-Host "Commande: npm run start:dev`n" -ForegroundColor Gray

# Lancer le service
npm run start:dev

# Note: Le script s'arrêtera ici car npm run start:dev est un processus bloquant
# Pour arrêter le service, utilisez Ctrl+C
