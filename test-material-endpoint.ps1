# Script de test de l'endpoint materials
# Usage: .\test-material-endpoint.ps1

Write-Host "🧪 TEST ENDPOINT MATERIALS" -ForegroundColor Cyan
Write-Host "=" * 50

# 1. Lister tous les matériaux
Write-Host "`n1️⃣ Récupération de tous les matériaux..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3009/api/materials" -Method Get
    $materials = $response.data
    
    Write-Host "✅ $($materials.Count) matériaux trouvés" -ForegroundColor Green
    
    if ($materials.Count -gt 0) {
        Write-Host "`n📋 Liste des matériaux:" -ForegroundColor Cyan
        foreach ($mat in $materials) {
            Write-Host "  - ID: $($mat._id)" -ForegroundColor White
            Write-Host "    Nom: $($mat.name)" -ForegroundColor Gray
            Write-Host "    Code: $($mat.code)" -ForegroundColor Gray
            Write-Host "    Quantité: $($mat.quantity) $($mat.unit)" -ForegroundColor Gray
            Write-Host ""
        }
        
        # 2. Tester l'endpoint pour le premier matériau
        $firstMaterial = $materials[0]
        $materialId = $firstMaterial._id
        
        Write-Host "`n2️⃣ Test de l'endpoint pour le matériau: $($firstMaterial.name)" -ForegroundColor Yellow
        Write-Host "   ID: $materialId" -ForegroundColor Gray
        
        try {
            $singleMaterial = Invoke-RestMethod -Uri "http://localhost:3009/api/materials/$materialId" -Method Get
            Write-Host "✅ Matériau récupéré avec succès!" -ForegroundColor Green
            Write-Host "   Nom: $($singleMaterial.name)" -ForegroundColor Gray
            Write-Host "   Code: $($singleMaterial.code)" -ForegroundColor Gray
        } catch {
            Write-Host "❌ ERREUR lors de la récupération du matériau:" -ForegroundColor Red
            Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # 3. Tester l'endpoint de prédiction
        Write-Host "`n3️⃣ Test de l'endpoint de prédiction..." -ForegroundColor Yellow
        try {
            $prediction = Invoke-RestMethod -Uri "http://localhost:3009/api/materials/$materialId/prediction" -Method Get
            Write-Host "✅ Prédiction récupérée avec succès!" -ForegroundColor Green
            Write-Host "   Quantité recommandée: $($prediction.recommendedOrderQuantity)" -ForegroundColor Gray
        } catch {
            Write-Host "⚠️  Prédiction non disponible: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "⚠️  Aucun matériau dans la base de données!" -ForegroundColor Yellow
        Write-Host "   Créez des matériaux via l'interface avant de tester les commandes." -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ ERREUR lors de la récupération des matériaux:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n⚠️  Vérifiez que le materials-service tourne sur le port 3009" -ForegroundColor Yellow
}

Write-Host "`n" + ("=" * 50)
Write-Host "✅ Test terminé" -ForegroundColor Cyan
