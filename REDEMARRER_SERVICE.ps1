#!/usr/bin/env pwsh
# Script pour arrêter et redémarrer le service materials
# Usage: .\REDEMARRER_SERVICE.ps1

Write-Host "`n" -NoNewline
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "║     REDÉMARRAGE DU SERVICE MATERIALS                          ║" -ForegroundColor Cyan -BackgroundColor Black
Write-Host "║                                                               ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Arrêter le service existant
Write-Host "🔍 Étape 1/3: Recherche du service en cours d'exécution..." -ForegroundColor Yellow
Write-Host ""

$found = $false
try {
    $connections = Get-NetTCPConnection -LocalPort 3009 -ErrorAction SilentlyContinue
    if ($connections) {
        $found = $true
        Write-Host "   ✅ Service trouvé sur le port 3009" -ForegroundColor Green
        
        foreach ($conn in $connections) {
            $processId = $conn.OwningProcess
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            
            if ($process) {
                Write-Host "   📍 Processus: $($process.Name) (PID: $processId)" -ForegroundColor Cyan
                Write-Host "   🛑 Arrêt du processus..." -ForegroundColor Yellow
                
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 2
                
                Write-Host "   ✅ Processus arrêté avec succès" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "   ℹ️  Aucun service trouvé sur le port 3009" -ForegroundColor Gray
        Write-Host "   (C'est normal si le service n'était pas démarré)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  Erreur lors de la recherche: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Étape 2: Vérifier le répertoire
Write-Host "📂 Étape 2/3: Vérification du répertoire..." -ForegroundColor Yellow
Write-Host ""

$targetPath = "apps\backend\materials-service"
$currentPath = Get-Location

if ($currentPath.Path -notlike "*materials-service*") {
    Write-Host "   📍 Répertoire actuel: $currentPath" -ForegroundColor Cyan
    
    if (Test-Path $targetPath) {
        Write-Host "   🔄 Changement vers: $targetPath" -ForegroundColor Yellow
        Set-Location $targetPath
        Write-Host "   ✅ Répertoire changé" -ForegroundColor Green
    } else {
        Write-Host "   ❌ ERREUR: Répertoire $targetPath non trouvé" -ForegroundColor Red
        Write-Host ""
        Write-Host "   💡 Assurez-vous d'exécuter ce script depuis la racine du projet" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
} else {
    Write-Host "   ✅ Déjà dans le bon répertoire" -ForegroundColor Green
}

Write-Host "   📍 Répertoire: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""

# Vérifier package.json
if (-not (Test-Path "package.json")) {
    Write-Host "   ❌ ERREUR: package.json non trouvé" -ForegroundColor Red
    Write-Host "   💡 Assurez-vous d'être dans le répertoire materials-service" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Étape 3: Redémarrer le service
Write-Host "🚀 Étape 3/3: Démarrage du service..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   Commande: npm run start:dev" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏳ Démarrage en cours..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   Attendez le message:" -ForegroundColor Gray
Write-Host "   🚀 Materials Service démarré avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Démarrer le service
npm run start:dev

# Note: Le script s'arrête ici car npm run start:dev est bloquant
# Pour arrêter: Ctrl+C
