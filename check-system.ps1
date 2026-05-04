# Script de vérification du système de prédictions (PowerShell)
# Usage: .\check-system.ps1

Write-Host "🔍 VÉRIFICATION DU SYSTÈME DE PRÉDICTIONS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Fonction de test d'endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Name
    )
    
    Write-Host "Testing $Name... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ OK" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "❌ FAILED" -ForegroundColor Red
        return $false
    }
}

# 1. Vérifier MongoDB
Write-Host "1️⃣ Vérification MongoDB" -ForegroundColor Yellow
Write-Host "----------------------" -ForegroundColor Yellow

if (Get-Command mongosh -ErrorAction SilentlyContinue) {
    Write-Host "✅ mongosh installé" -ForegroundColor Green
    
    try {
        $mongoVersion = mongosh --quiet --eval "db.version()" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MongoDB connecté" -ForegroundColor Green
        } else {
            Write-Host "❌ MongoDB non connecté" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ MongoDB non connecté" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ mongosh non trouvé (optionnel)" -ForegroundColor Yellow
}
Write-Host ""

# 2. Vérifier Materials Service
Write-Host "2️⃣ Vérification Materials Service (port 3009)" -ForegroundColor Yellow
Write-Host "--------------------------------------------" -ForegroundColor Yellow
Test-Endpoint -Url "http://localhost:3009/api/materials" -Name "GET /api/materials"
Test-Endpoint -Url "http://localhost:3009/api/materials/predictions/all" -Name "GET /api/materials/predictions/all"
Test-Endpoint -Url "http://localhost:3009/api/material-flow" -Name "GET /api/material-flow"
Write-Host ""

# 3. Vérifier API Gateway (optionnel)
Write-Host "3️⃣ Vérification API Gateway (port 9001)" -ForegroundColor Yellow
Write-Host "---------------------------------------" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9001" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ API Gateway accessible" -ForegroundColor Green
    Test-Endpoint -Url "http://localhost:9001/materials" -Name "GET /materials (via gateway)"
}
catch {
    Write-Host "⚠️ API Gateway non démarré (optionnel)" -ForegroundColor Yellow
}
Write-Host ""

# 4. Vérifier Frontend
Write-Host "4️⃣ Vérification Frontend (port 5173)" -ForegroundColor Yellow
Write-Host "------------------------------------" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Frontend accessible" -ForegroundColor Green
}
catch {
    Write-Host "❌ Frontend non accessible" -ForegroundColor Red
}
Write-Host ""

# 5. Vérifier les fichiers de configuration
Write-Host "5️⃣ Vérification Configuration" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Yellow

# Vérifier vite.config.ts
if (Test-Path "apps/frontend/vite.config.ts") {
    $viteConfig = Get-Content "apps/frontend/vite.config.ts" -Raw
    if ($viteConfig -match "localhost:3009") {
        Write-Host "✅ Proxy Vite configuré (port 3009)" -ForegroundColor Green
    } else {
        Write-Host "❌ Proxy Vite mal configuré" -ForegroundColor Red
    }
} else {
    Write-Host "❌ vite.config.ts non trouvé" -ForegroundColor Red
}

# Vérifier .env materials-service
if (Test-Path "apps/backend/materials-service/.env") {
    $envContent = Get-Content "apps/backend/materials-service/.env" -Raw
    if ($envContent -match "PORT=3009") {
        Write-Host "✅ Materials Service configuré (port 3009)" -ForegroundColor Green
    } else {
        Write-Host "❌ Materials Service mal configuré" -ForegroundColor Red
    }
} else {
    Write-Host "❌ .env non trouvé" -ForegroundColor Red
}

# Vérifier package.json
if (Test-Path "apps/backend/materials-service/package.json") {
    $packageJson = Get-Content "apps/backend/materials-service/package.json" -Raw
    if ($packageJson -match "@tensorflow/tfjs") {
        Write-Host "✅ TensorFlow.js installé" -ForegroundColor Green
    } else {
        Write-Host "❌ TensorFlow.js manquant" -ForegroundColor Red
    }
} else {
    Write-Host "❌ package.json non trouvé" -ForegroundColor Red
}
Write-Host ""

# 6. Résumé
Write-Host "📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "=========" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services requis:" -ForegroundColor White
Write-Host "  - MongoDB: Vérifier manuellement"
Write-Host "  - Materials Service (port 3009): Requis"
Write-Host "  - Frontend (port 5173): Requis"
Write-Host ""
Write-Host "Services optionnels:" -ForegroundColor White
Write-Host "  - API Gateway (port 9001): Optionnel"
Write-Host ""
Write-Host "Configuration:" -ForegroundColor White
Write-Host "  - Proxy Vite: Doit pointer vers localhost:3009"
Write-Host "  - Materials Service: Doit écouter sur port 3009"
Write-Host "  - TensorFlow.js: Doit être @tensorflow/tfjs (pas tfjs-node)"
Write-Host ""
Write-Host "Pour démarrer les services:" -ForegroundColor Yellow
Write-Host "  1. cd apps\backend\materials-service ; npm start"
Write-Host "  2. cd apps\frontend ; npm run dev"
Write-Host ""
Write-Host "Pour plus d'informations, voir:" -ForegroundColor Yellow
Write-Host "  - RESTART_GUIDE.md"
Write-Host "  - FINAL_SUMMARY.md"
Write-Host ""
