# Script de vérification de l'installation SonarQube
# Pour Windows avec Docker Desktop

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Vérification SonarQube 9.9.8" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allChecks = @()

# 1. Vérifier Docker
Write-Host "🔍 Vérification 1/5: Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "   ✅ Docker est installé: $dockerVersion" -ForegroundColor Green
    $allChecks += $true
} catch {
    Write-Host "   ❌ Docker n'est pas installé ou n'est pas en cours d'exécution" -ForegroundColor Red
    $allChecks += $false
}

Write-Host ""

# 2. Vérifier les conteneurs
Write-Host "🔍 Vérification 2/5: Conteneurs Docker..." -ForegroundColor Yellow
try {
    $sonarContainer = docker ps --filter "name=sonarqube" --format "{{.Status}}"
    $dbContainer = docker ps --filter "name=sonarqube-db" --format "{{.Status}}"
    
    if ($sonarContainer -match "Up") {
        Write-Host "   ✅ Conteneur SonarQube: $sonarContainer" -ForegroundColor Green
        $allChecks += $true
    } else {
        Write-Host "   ❌ Conteneur SonarQube n'est pas en cours d'exécution" -ForegroundColor Red
        $allChecks += $false
    }
    
    if ($dbContainer -match "Up") {
        Write-Host "   ✅ Conteneur PostgreSQL: $dbContainer" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Conteneur PostgreSQL n'est pas en cours d'exécution" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Impossible de vérifier les conteneurs" -ForegroundColor Red
    $allChecks += $false
}

Write-Host ""

# 3. Vérifier l'API SonarQube
Write-Host "🔍 Vérification 3/5: API SonarQube..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9000/api/system/status" -UseBasicParsing -TimeoutSec 10
    $status = ($response.Content | ConvertFrom-Json).status
    
    if ($status -eq "UP") {
        Write-Host "   ✅ SonarQube est opérationnel (Status: UP)" -ForegroundColor Green
        $allChecks += $true
    } else {
        Write-Host "   ⚠️  SonarQube répond mais status: $status" -ForegroundColor Yellow
        $allChecks += $false
    }
} catch {
    Write-Host "   ❌ SonarQube n'est pas accessible sur http://localhost:9000" -ForegroundColor Red
    Write-Host "      Erreur: $($_.Exception.Message)" -ForegroundColor Red
    $allChecks += $false
}

Write-Host ""

# 4. Vérifier la version
Write-Host "🔍 Vérification 4/5: Version SonarQube..." -ForegroundColor Yellow
try {
    $versionResponse = Invoke-WebRequest -Uri "http://localhost:9000/api/server/version" -UseBasicParsing -TimeoutSec 10
    $version = $versionResponse.Content
    
    if ($version -match "9.9") {
        Write-Host "   ✅ Version SonarQube: $version" -ForegroundColor Green
        $allChecks += $true
    } else {
        Write-Host "   ⚠️  Version inattendue: $version (attendu: 9.9.x)" -ForegroundColor Yellow
        $allChecks += $false
    }
} catch {
    Write-Host "   ❌ Impossible de récupérer la version" -ForegroundColor Red
    $allChecks += $false
}

Write-Host ""

# 5. Vérifier l'interface web
Write-Host "🔍 Vérification 5/5: Interface Web..." -ForegroundColor Yellow
try {
    $webResponse = Invoke-WebRequest -Uri "http://localhost:9000" -UseBasicParsing -TimeoutSec 10
    
    if ($webResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Interface web accessible (HTTP 200)" -ForegroundColor Green
        $allChecks += $true
    } else {
        Write-Host "   ⚠️  Interface web répond avec code: $($webResponse.StatusCode)" -ForegroundColor Yellow
        $allChecks += $false
    }
} catch {
    Write-Host "   ❌ Interface web non accessible" -ForegroundColor Red
    $allChecks += $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Résumé
$passedChecks = ($allChecks | Where-Object { $_ -eq $true }).Count
$totalChecks = $allChecks.Count

if ($passedChecks -eq $totalChecks) {
    Write-Host "  ✅ TOUT FONCTIONNE PARFAITEMENT !" -ForegroundColor Green
    Write-Host "  $passedChecks/$totalChecks vérifications réussies" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 SonarQube est prêt à l'emploi !" -ForegroundColor Green
    Write-Host "   URL: http://localhost:9000" -ForegroundColor Cyan
    Write-Host "   Login: admin / admin" -ForegroundColor Cyan
    Write-Host ""
} elseif ($passedChecks -ge ($totalChecks * 0.6)) {
    Write-Host "  ⚠️  INSTALLATION PARTIELLE" -ForegroundColor Yellow
    Write-Host "  $passedChecks/$totalChecks vérifications réussies" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "SonarQube fonctionne mais avec quelques avertissements." -ForegroundColor Yellow
    Write-Host "Consultez les détails ci-dessus." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "  ❌ PROBLÈMES DÉTECTÉS" -ForegroundColor Red
    Write-Host "  $passedChecks/$totalChecks vérifications réussies" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔧 Actions recommandées:" -ForegroundColor Yellow
    Write-Host ""
    
    if (-not ($allChecks[0])) {
        Write-Host "   1. Installez Docker Desktop" -ForegroundColor White
        Write-Host "      https://www.docker.com/products/docker-desktop" -ForegroundColor Gray
    }
    
    if (-not ($allChecks[1])) {
        Write-Host "   2. Démarrez SonarQube:" -ForegroundColor White
        Write-Host "      docker-compose -f docker-compose-sonarqube.yml up -d" -ForegroundColor Gray
    }
    
    if (-not ($allChecks[2]) -or -not ($allChecks[3]) -or -not ($allChecks[4])) {
        Write-Host "   3. Vérifiez les logs:" -ForegroundColor White
        Write-Host "      docker logs -f sonarqube" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   4. Attendez 2-3 minutes que SonarQube démarre complètement" -ForegroundColor White
    }
    Write-Host ""
}

Write-Host "📚 Commandes utiles:" -ForegroundColor Cyan
Write-Host "   Voir les logs:     docker logs -f sonarqube" -ForegroundColor White
Write-Host "   Redémarrer:        docker-compose -f docker-compose-sonarqube.yml restart" -ForegroundColor White
Write-Host "   Vérifier conteneurs: docker ps" -ForegroundColor White
Write-Host ""
