# Test GPS Complet
Write-Host "`n" -NoNewline
Write-Host "=" * 80
Write-Host "🔍 TEST GPS COMPLET"
Write-Host "=" * 80
Write-Host "`n"

# 1. Vérifier MongoDB
Write-Host "📍 ÉTAPE 1: VÉRIFICATION MONGODB`n"
node check-sites-gps.cjs
Write-Host "`n"

# 2. Vérifier si le backend est démarré
Write-Host "📡 ÉTAPE 2: VÉRIFICATION BACKEND`n"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/materials" -Method GET -TimeoutSec 5
    $materials = ($response.Content | ConvertFrom-Json).data
    
    Write-Host "✅ Backend répond: $($materials.Count) matériaux`n"
    
    if ($materials.Count -gt 0) {
        $firstMaterial = $materials[0]
        Write-Host "📦 Premier matériau:"
        Write-Host "   Nom: $($firstMaterial.name)"
        Write-Host "   Code: $($firstMaterial.code)"
        Write-Host "   SiteId: $($firstMaterial.siteId)"
        Write-Host "   SiteName: $($firstMaterial.siteName)"
        Write-Host "   SiteAddress: $($firstMaterial.siteAddress)"
        
        if ($firstMaterial.siteCoordinates) {
            Write-Host "   ✅ GPS: $($firstMaterial.siteCoordinates.lat), $($firstMaterial.siteCoordinates.lng)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ GPS: MANQUANT!" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Aucun matériau! Exécutez: node creer-materiaux-test.cjs`n" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend non accessible sur http://localhost:3002" -ForegroundColor Red
    Write-Host "   Démarrez-le avec: cd apps\backend\materials-service && npm start`n"
}

Write-Host "`n"
Write-Host "=" * 80
Write-Host "📊 RÉSUMÉ"
Write-Host "=" * 80
Write-Host "`n"
Write-Host "Si GPS manquant:"
Write-Host "1. Vérifier que le backend est démarré"
Write-Host "2. Vérifier les logs backend (chercher 'Site FOUND')"
Write-Host "3. Redémarrer le backend si nécessaire`n"
