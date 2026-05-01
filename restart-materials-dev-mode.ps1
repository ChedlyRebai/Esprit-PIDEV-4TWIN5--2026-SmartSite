# Script de redémarrage du Materials Service en MODE DEV
# Usage: .\restart-materials-dev-mode.ps1

Write-Host "🔄 REDÉMARRAGE MATERIALS SERVICE EN MODE DEV" -ForegroundColor Cyan
Write-Host "=" * 60

# 1. Arrêter le processus actuel (PID 18080)
Write-Host "`n1️⃣ Arrêt du processus actuel (PID 18080)..." -ForegroundColor Yellow

try {
    Stop-Process -Id 18080 -Force -ErrorAction Stop
    Write-Host "   ✅ Processus 18080 arrêté" -ForegroundColor Green
    Start-Sleep -Seconds 2
} catch {
    Write-Host "   ⚠️  Processus 18080 déjà arrêté ou introuvable" -ForegroundColor Yellow
}

# 2. Vérifier qu'aucun autre processus n'utilise le port 3009
Write-Host "`n2️⃣ Vérification du port 3009..." -ForegroundColor Yellow

$portCheck = netstat -ano | findstr ":3009" | findstr "LISTENING"
if ($portCheck) {
    Write-Host "   ⚠️  Le port 3009 est toujours utilisé!" -ForegroundColor Red
    Write-Host "   Extraction du PID..." -ForegroundColor Yellow
    
    $pid = ($portCheck -split '\s+')[-1]
    Write-Host "   PID trouvé: $pid" -ForegroundColor Gray
    Write-Host "   Arrêt du processus..." -ForegroundColor Yellow
    
    try {
        Stop-Process -Id $pid -Force
        Write-Host "   ✅ Processus $pid arrêté" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "   ❌ Impossible d'arrêter le processus $pid" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✅ Port 3009 libre" -ForegroundColor Green
}

# 3. Supprimer le dossier dist pour forcer la recompilation
Write-Host "`n3️⃣ Nettoyage du dossier dist..." -ForegroundColor Yellow

$distPath = "apps/backend/materials-service/dist"
if (Test-Path $distPath) {
    try {
        Remove-Item -Path $distPath -Recurse -Force
        Write-Host "   ✅ Dossier dist supprimé" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Impossible de supprimer dist (peut-être verrouillé)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ️  Dossier dist n'existe pas" -ForegroundColor Gray
}

# 4. Aller dans le dossier materials-service
Write-Host "`n4️⃣ Navigation vers materials-service..." -ForegroundColor Yellow
Set-Location "apps/backend/materials-service"
Write-Host "   ✅ Dossier: $(Get-Location)" -ForegroundColor Green

# 5. Vérifier les dépendances
Write-Host "`n5️⃣ Vérification des dépendances..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "   📥 Installation des dépendances..." -ForegroundColor Cyan
    npm install
} else {
    Write-Host "   ✅ node_modules existe" -ForegroundColor Green
}

# 6. Démarrer en mode développement
Write-Host "`n6️⃣ Démarrage en MODE DÉVELOPPEMENT..." -ForegroundColor Yellow
Write-Host "   ⚠️  Une nouvelle fenêtre va s'ouvrir" -ForegroundColor Yellow
Write-Host "   ⚠️  NE PAS FERMER cette fenêtre!" -ForegroundColor Red
Write-Host ""
Write-Host "   📊 Surveillez les logs pour voir:" -ForegroundColor Cyan
Write-Host "      - 🚀 Materials Service démarré sur le port 3009" -ForegroundColor Gray
Write-Host "      - 🔍 Récupération matériau XXX depuis l'API interne..." -ForegroundColor Gray
Write-Host "      - ✅ Matériau trouvé: ..." -ForegroundColor Gray
Write-Host ""

Start-Sleep -Seconds 2

# Démarrer dans une nouvelle fenêtre PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run start:dev"

Write-Host "`n✅ SERVICE REDÉMARRÉ EN MODE DEV!" -ForegroundColor Green
Write-Host "📊 Vérifiez les logs dans la nouvelle fenêtre" -ForegroundColor Cyan
Write-Host "🌐 Le service devrait être disponible sur http://localhost:3009" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧪 TESTEZ MAINTENANT:" -ForegroundColor Yellow
Write-Host "   1. Ouvrir http://localhost:5173" -ForegroundColor Gray
Write-Host "   2. Aller sur Matériaux" -ForegroundColor Gray
Write-Host "   3. Cliquer sur 'Commander'" -ForegroundColor Gray
Write-Host "   4. Remplir et valider" -ForegroundColor Gray
Write-Host "   5. ✅ La commande devrait se créer sans erreur!" -ForegroundColor Green
Write-Host ""

Set-Location "../../.."
