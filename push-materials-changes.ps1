# Script de Push des Modifications Materials-Service
# Date: 2026-05-01
# Branche: my-fix-branch-supplier

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   PUSH MODIFICATIONS MATERIALS-SERVICE" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier l'état actuel
Write-Host "📊 Vérification de l'état actuel..." -ForegroundColor Cyan
git status

Write-Host "`n🔍 Vérification des modifications dans materials-service..." -ForegroundColor Cyan
$materialsChanges = git diff --name-only origin/main HEAD -- apps/backend/materials-service/ | Measure-Object -Line
Write-Host "   Fichiers modifiés: $($materialsChanges.Lines)" -ForegroundColor Green

# Demander confirmation
Write-Host "`n⚠️  ATTENTION:" -ForegroundColor Yellow
Write-Host "   Vous êtes sur le point de pousser 78 commits vers GitHub" -ForegroundColor White
Write-Host "   Branche: my-fix-branch-supplier" -ForegroundColor White
Write-Host "   Dépôt: https://github.com/ChedlyRebai/Esprit-PIDEV-4TWIN5--2026-SmartSite.git`n" -ForegroundColor White

$confirmation = Read-Host "Voulez-vous continuer? (O/N)"

if ($confirmation -eq 'O' -or $confirmation -eq 'o' -or $confirmation -eq 'Y' -or $confirmation -eq 'y') {
    Write-Host "`n🚀 Push en cours..." -ForegroundColor Green
    
    # Essayer un push normal d'abord
    Write-Host "`n1️⃣ Tentative de push normal..." -ForegroundColor Cyan
    git push origin my-fix-branch-supplier
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n⚠️  Le push normal a échoué. Tentative avec --force-with-lease..." -ForegroundColor Yellow
        
        $forceConfirm = Read-Host "Utiliser --force-with-lease? (O/N)"
        
        if ($forceConfirm -eq 'O' -or $forceConfirm -eq 'o' -or $forceConfirm -eq 'Y' -or $forceConfirm -eq 'y') {
            Write-Host "`n2️⃣ Push avec --force-with-lease..." -ForegroundColor Cyan
            git push origin my-fix-branch-supplier --force-with-lease
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "`n✅ Push réussi avec --force-with-lease!" -ForegroundColor Green
            } else {
                Write-Host "`n❌ Échec du push. Vérifiez vos permissions et la connexion." -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "`n❌ Push annulé par l'utilisateur." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "`n✅ Push réussi!" -ForegroundColor Green
    }
    
    # Afficher le résultat
    Write-Host "`n📊 État après push:" -ForegroundColor Cyan
    git status
    
    Write-Host "`n🎉 Vos modifications sont maintenant sur GitHub!" -ForegroundColor Green
    Write-Host "`n📝 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "   1. Créer une Pull Request sur GitHub" -ForegroundColor White
    Write-Host "   2. Demander une revue de code" -ForegroundColor White
    Write-Host "   3. Merger après approbation`n" -ForegroundColor White
    
    # Proposer d'ouvrir GitHub
    $openGitHub = Read-Host "Ouvrir GitHub dans le navigateur? (O/N)"
    if ($openGitHub -eq 'O' -or $openGitHub -eq 'o' -or $openGitHub -eq 'Y' -or $openGitHub -eq 'y') {
        Start-Process "https://github.com/ChedlyRebai/Esprit-PIDEV-4TWIN5--2026-SmartSite/compare/main...my-fix-branch-supplier"
    }
    
} else {
    Write-Host "`n❌ Push annulé par l'utilisateur." -ForegroundColor Red
    Write-Host "   Vos modifications restent en local.`n" -ForegroundColor Yellow
}

Write-Host "========================================`n" -ForegroundColor Cyan
