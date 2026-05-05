# Script d'installation propre de SonarQube
Write-Host "🚀 Installation de SonarQube..." -ForegroundColor Green

# 1. Créer le réseau
Write-Host "`n1️⃣ Création du réseau Docker..." -ForegroundColor Cyan
docker network create sonarnet

# 2. Démarrer PostgreSQL
Write-Host "`n2️⃣ Démarrage de PostgreSQL..." -ForegroundColor Cyan
docker run -d `
  --name sonarqube-db `
  --network sonarnet `
  -e POSTGRES_USER=sonar `
  -e POSTGRES_PASSWORD=sonar `
  -e POSTGRES_DB=sonar `
  -v postgresql_data:/var/lib/postgresql/data `
  postgres:15-alpine

Write-Host "⏳ Attente du démarrage de PostgreSQL (15 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 3. Démarrer SonarQube
Write-Host "`n3️⃣ Démarrage de SonarQube..." -ForegroundColor Cyan
docker run -d `
  --name sonarqube `
  --network sonarnet `
  -p 9000:9000 `
  -e SONAR_JDBC_URL=jdbc:postgresql://sonarqube-db:5432/sonar `
  -e SONAR_JDBC_USERNAME=sonar `
  -e SONAR_JDBC_PASSWORD=sonar `
  -v sonarqube_data:/opt/sonarqube/data `
  -v sonarqube_extensions:/opt/sonarqube/extensions `
  -v sonarqube_logs:/opt/sonarqube/logs `
  sonarqube:community

Write-Host "`n✅ SonarQube est en cours de démarrage..." -ForegroundColor Green
Write-Host "`n📊 Vérification des conteneurs..." -ForegroundColor Yellow
docker ps --filter "name=sonar"

Write-Host "`n📝 Suivez les logs avec:" -ForegroundColor Cyan
Write-Host "   docker logs -f sonarqube" -ForegroundColor White

Write-Host "`n⏳ Attendez 2-3 minutes puis ouvrez:" -ForegroundColor Yellow
Write-Host "   http://localhost:9000" -ForegroundColor White
Write-Host "   Login: admin / Password: admin" -ForegroundColor White

Write-Host "`n🎯 Pour voir les logs maintenant, tapez:" -ForegroundColor Cyan
Write-Host "   docker logs -f sonarqube" -ForegroundColor White
