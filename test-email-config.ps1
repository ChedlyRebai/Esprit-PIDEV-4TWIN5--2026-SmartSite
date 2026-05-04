# Test de Configuration Email - Materials Service
Write-Host "🧪 Test de Configuration Email - Materials Service" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$MATERIALS_SERVICE_URL = "http://localhost:3009"
$TEST_EMAIL = "jamar.wisoky@ethereal.email"

Write-Host "📋 Configuration:"
Write-Host "   Service URL: $MATERIALS_SERVICE_URL"
Write-Host "   Test Email: $TEST_EMAIL"
Write-Host ""

# Test 1: Vérifier que le service est accessible
Write-Host "1️⃣  Test: Service Materials accessible..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$MATERIALS_SERVICE_URL/api/materials/dashboard" -Method GET -ErrorAction SilentlyContinue
    Write-Host "   ✅ Service accessible" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Service non accessible" -ForegroundColor Red
    Write-Host "   💡 Démarrez le service avec: cd apps/backend/materials-service && npm run start:dev" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 2: Test d'envoi d'email d'alerte
Write-Host "2️⃣  Test: Envoi email d'alerte d'anomalie..." -ForegroundColor Yellow
try {
    $body = @{
        email = $TEST_EMAIL
        materialName = "Ciment Test"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$MATERIALS_SERVICE_URL/api/materials/email/test" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    if ($response.success -eq $true) {
        Write-Host "   ✅ Email d'alerte envoyé avec succès" -ForegroundColor Green
        if ($response.etherealUrl) {
            Write-Host "   🔗 Prévisualisation: $($response.etherealUrl)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   ❌ Échec de l'envoi de l'email d'alerte" -ForegroundColor Red
        Write-Host "   Message: $($response.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Erreur lors du test d'alerte: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Test d'envoi de rapport quotidien
Write-Host "3️⃣  Test: Envoi rapport quotidien..." -ForegroundColor Yellow
try {
    $body = @{
        email = $TEST_EMAIL
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$MATERIALS_SERVICE_URL/api/materials/reports/daily/send" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    if ($response.success -eq $true) {
        Write-Host "   ✅ Rapport quotidien envoyé avec succès" -ForegroundColor Green
        Write-Host "   Message: $($response.message)" -ForegroundColor Cyan
    } else {
        Write-Host "   ❌ Échec de l'envoi du rapport quotidien" -ForegroundColor Red
        Write-Host "   Message: $($response.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Erreur lors du test de rapport: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Instructions finales
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "📬 Vérification des emails:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Allez sur: https://ethereal.email/messages" -ForegroundColor White
Write-Host "2. Connectez-vous avec:" -ForegroundColor White
Write-Host "   Username: jamar.wisoky@ethereal.email" -ForegroundColor Yellow
Write-Host "   Password: ppg5A4AUcaFHWFP3DY" -ForegroundColor Yellow
Write-Host "3. Vous devriez voir 2 emails:" -ForegroundColor White
Write-Host "   - 🚨 Alerte Anomalie Stock" -ForegroundColor White
Write-Host "   - 📊 Rapport quotidien matériaux" -ForegroundColor White
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
