# Script de vérification du Materials Service
# Usage: .\check-materials-service.ps1

Write-Host "`n🔍 VÉRIFICATION DU MATERIALS SERVICE" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Test 1: Vérifier si le port 3009 est utilisé
Write-Host "1️⃣ Vérification du port 3009..." -ForegroundColor Yellow

$port3009 = netstat -ano | Select-String ":3009"

if ($port3009) {
    Write-Host "✅ Port 3009 est utilisé" -ForegroundColor Green
    Write-Host "$port3009`n" -ForegroundColor Gray
} else {
    Write-Host "❌ Port 3009 n'est PAS utilisé" -ForegroundColor Red
    Write-Host "   Le materials-service n'est PAS démarré !`n" -ForegroundColor Red
    
    Write-Host "🚀 Pour démarrer le service:" -ForegroundColor Yellow
    Write-Host "   cd apps\backend\materials-service" -ForegroundColor Cyan
    Write-Host "   npm start`n" -ForegroundColor Cyan
    exit 1
}

# Test 2: Tester l'endpoint /api/materials
Write-Host "2️⃣ Test de l'endpoint /api/materials..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3009/api/materials" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Endpoint /api/materials accessible" -ForegroundColor Green
        
        $data = $response.Content | ConvertFrom-Json
        if ($data) {
            $count = if ($data.data) { $data.data.Count } elseif ($data.Count) { $data.Count } else { 0 }
            Write-Host "   $count matériaux trouvés`n" -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host "❌ Endpoint /api/materials non accessible" -ForegroundColor Red
    Write-Host "   Erreur: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 3: Tester l'endpoint /api/materials/predictions/all
Write-Host "3️⃣ Test de l'endpoint /api/materials/predictions/all..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3009/api/materials/predictions/all" -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Endpoint /api/materials/predictions/all accessible" -ForegroundColor Green
        
        $data = $response.Content | ConvertFrom-Json
        if ($data) {
            $count = if ($data.Count) { $data.Count } else { 0 }
            Write-Host "   $count prédictions générées`n" -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host "❌ Endpoint /api/materials/predictions/all non accessible" -ForegroundColor Red
    Write-Host "   Erreur: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 4: Vérifier MongoDB
Write-Host "4️⃣ Vérification de MongoDB..." -ForegroundColor Yellow

$mongoPort = netstat -ano | Select-String ":27017"

if ($mongoPort) {
    Write-Host "✅ MongoDB tourne sur le port 27017`n" -ForegroundColor Green
} else {
    Write-Host "⚠️ MongoDB ne semble pas tourner sur le port 27017" -ForegroundColor Yellow
    Write-Host "   Vérifiez que MongoDB est démarré`n" -ForegroundColor Yellow
}

# Résumé
Write-Host "====================================`n" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

if ($port3009) {
    Write-Host "✅ Materials Service: DÉMARRÉ" -ForegroundColor Green
} else {
    Write-Host "❌ Materials Service: NON DÉMARRÉ" -ForegroundColor Red
}

if ($mongoPort) {
    Write-Host "✅ MongoDB: DÉMARRÉ" -ForegroundColor Green
} else {
    Write-Host "⚠️ MongoDB: STATUT INCONNU" -ForegroundColor Yellow
}

Write-Host "`n🎯 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Si materials-service n'est pas démarré: npm start" -ForegroundColor White
Write-Host "   2. Redémarrer le frontend: Ctrl+C puis npm run dev" -ForegroundColor White
Write-Host "   3. Tester dans le navigateur: http://localhost:5173`n" -ForegroundColor White
