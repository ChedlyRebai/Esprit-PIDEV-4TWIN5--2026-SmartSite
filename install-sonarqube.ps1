# Script d'installation automatique de SonarQube 9.9.8
# Pour Windows avec Docker Desktop

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installation SonarQube 9.9.8" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Docker est installé et en cours d'exécution
Write-Host "🔍 Vérification de Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker détecté: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker n'est pas installé ou n'est pas en cours d'exécution" -ForegroundColor Red
    Write-Host "   Veuillez installer Docker Desktop et le démarrer" -ForegroundColor Red
    exit 1
}

# Vérifier si le fichier docker-compose existe
if (-Not (Test-Path "docker-compose-sonarqube.yml")) {
    Write-Host "❌ Le fichier docker-compose-sonarqube.yml est introuvable" -ForegroundColor Red
    Write-Host "   Assurez-vous d'exécuter ce script dans le bon dossier" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Téléchargement des images Docker..." -ForegroundColor Yellow
docker-compose -f docker-compose-sonarqube.yml pull

Write-Host ""
Write-Host "🚀 Démarrage de SonarQube..." -ForegroundColor Yellow
docker-compose -f docker-compose-sonarqube.yml up -d

Write-Host ""
Write-Host "⏳ Attente du démarrage de SonarQube (cela peut prendre 2-3 minutes)..." -ForegroundColor Yellow

# Attendre que SonarQube soit prêt
$maxAttempts = 60
$attempt = 0
$isReady = $false

while ($attempt -lt $maxAttempts -and -not $isReady) {
    Start-Sleep -Seconds 5
    $attempt++
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9000/api/system/status" -UseBasicParsing -TimeoutSec 5
        $status = ($response.Content | ConvertFrom-Json).status
        
        if ($status -eq "UP") {
            $isReady = $true
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host ""

if ($isReady) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ SonarQube installé avec succès !" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 URL: http://localhost:9000" -ForegroundColor Cyan
    Write-Host "👤 Username: admin" -ForegroundColor Cyan
    Write-Host "🔑 Password: admin" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Changez le mot de passe lors de la première connexion" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "   1. Ouvrez http://localhost:9000 dans votre navigateur" -ForegroundColor White
    Write-Host "   2. Connectez-vous avec admin/admin" -ForegroundColor White
    Write-Host "   3. Changez le mot de passe" -ForegroundColor White
    Write-Host "   4. Créez un token pour Jenkins (My Account → Security → Generate Token)" -ForegroundColor White
    Write-Host ""
    
    # Ouvrir le navigateur automatiquement
    Start-Process "http://localhost:9000"
    
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ⚠️  SonarQube prend plus de temps que prévu" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vérifiez les logs avec:" -ForegroundColor Yellow
    Write-Host "   docker logs -f sonarqube" -ForegroundColor White
    Write-Host ""
    Write-Host "SonarQube devrait être accessible dans quelques minutes sur:" -ForegroundColor Yellow
    Write-Host "   http://localhost:9000" -ForegroundColor White
}

Write-Host ""
Write-Host "📚 Commandes utiles:" -ForegroundColor Cyan
Write-Host "   Voir les logs:        docker logs -f sonarqube" -ForegroundColor White
Write-Host "   Arrêter SonarQube:    docker-compose -f docker-compose-sonarqube.yml stop" -ForegroundColor White
Write-Host "   Démarrer SonarQube:   docker-compose -f docker-compose-sonarqube.yml start" -ForegroundColor White
Write-Host "   Redémarrer SonarQube: docker-compose -f docker-compose-sonarqube.yml restart" -ForegroundColor White
Write-Host ""
