# Script de nettoyage complet de SonarQube
Write-Host "🧹 Nettoyage complet de SonarQube..." -ForegroundColor Yellow

# 1. Arrêter et supprimer les conteneurs
Write-Host "`n1️⃣ Arrêt et suppression des conteneurs..." -ForegroundColor Cyan
docker stop sonarqube sonarqube-db 2>$null
docker rm sonarqube sonarqube-db 2>$null

# 2. Supprimer les volumes
Write-Host "`n2️⃣ Suppression des volumes..." -ForegroundColor Cyan
docker volume rm smartsite-platform_sonarqube_data 2>$null
docker volume rm smartsite-platform_sonarqube_extensions 2>$null
docker volume rm smartsite-platform_sonarqube_logs 2>$null
docker volume rm smartsite-platform_postgresql_data 2>$null
docker volume rm sonarqube_data 2>$null
docker volume rm sonarqube_extensions 2>$null
docker volume rm sonarqube_logs 2>$null
docker volume rm postgresql_data 2>$null

# 3. Supprimer le réseau
Write-Host "`n3️⃣ Suppression du réseau..." -ForegroundColor Cyan
docker network rm smartsite-platform_sonarnet 2>$null
docker network rm sonarnet 2>$null

# 4. Supprimer les images (optionnel)
Write-Host "`n4️⃣ Suppression des images..." -ForegroundColor Cyan
docker rmi sonarqube:community 2>$null
docker rmi postgres:15-alpine 2>$null

Write-Host "`n✅ Nettoyage terminé !" -ForegroundColor Green
Write-Host "`n📋 Vérification..." -ForegroundColor Yellow
docker ps -a | Select-String "sonar"
docker volume ls | Select-String "sonar"
docker network ls | Select-String "sonar"

Write-Host "`n✨ Prêt pour une installation propre !" -ForegroundColor Green
