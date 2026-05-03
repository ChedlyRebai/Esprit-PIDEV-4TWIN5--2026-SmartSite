# ⚡ ACTION IMMÉDIATE - DEVOPS MATERIALS SERVICE

## 🎯 COMMENCEZ MAINTENANT (30 MINUTES)

---

## ÉTAPE 1: VÉRIFIER LES TESTS (10 min)

### Ouvrir un terminal

```bash
cd apps/backend/materials-service
```

### Lancer les tests

```bash
npm test
```

**✅ Si tous les tests passent**: Passez à l'étape suivante

**❌ Si des tests échouent**: Corrigez-les avant de continuer

### Vérifier la couverture

```bash
npm test -- --coverage
```

**Objectif**: Couverture > 70%

**📸 Prendre une capture d'écran** du résultat

---

## ÉTAPE 2: INSTALLER JENKINS (10 min)

### Ouvrir un nouveau terminal

```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts
```

### Attendre 1-2 minutes

Jenkins démarre...

### Récupérer le mot de passe

```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

**📋 Copier le mot de passe**

### Ouvrir Jenkins

```
http://localhost:8080
```

1. Coller le mot de passe
2. **Install suggested plugins**
3. Créer un compte admin
4. **Save and Finish**

**✅ Jenkins est prêt!**

---

## ÉTAPE 3: CONFIGURER NODEJS DANS JENKINS (5 min)

### Dans Jenkins

1. **Manage Jenkins** → **Global Tool Configuration**
2. **NodeJS** → **Add NodeJS**
   - Name: `NodeJS-20`
   - Version: `NodeJS 20.x`
   - ✅ Install automatically
3. **Save**

---

## ÉTAPE 4: CRÉER VOTRE PREMIER PIPELINE (5 min)

### Dans Jenkins

1. **New Item**
2. Nom: `materials-service-CI`
3. Type: **Pipeline**
4. **OK**

### Configuration

**General**:
- Description: `Pipeline CI pour Materials Service`

**Pipeline**:
- Definition: **Pipeline script from SCM**
- SCM: **Git**
- Repository URL: `https://github.com/votre-repo/smartsite-platform.git`
- Branch: `*/main`
- Script Path: `apps/backend/materials-service/Jenkinsfile`

### Sauvegarder

**✅ Pipeline créé!**

---

## ✅ RÉSULTAT APRÈS 30 MINUTES

Vous avez maintenant:
- ✅ Tests vérifiés
- ✅ Jenkins installé et configuré
- ✅ NodeJS configuré
- ✅ Premier pipeline créé

---

## 🎯 PROCHAINES ÉTAPES (AUJOURD'HUI)

### Étape 5: Tester le Pipeline (15 min)

1. Aller dans `materials-service-CI`
2. **Build Now**
3. Voir les logs
4. **📸 Prendre des captures d'écran**

### Étape 6: Créer le Pipeline CD (15 min)

1. Configurer credentials Docker Hub
2. Créer `materials-service-CD`
3. Tester

---

## 📚 GUIDES À CONSULTER

### Pour continuer aujourd'hui:
📖 **GUIDE_DEVOPS_COMPLET_ETAPE_PAR_ETAPE.md**
- Étape 5: Tester Pipeline CI
- Étape 6: Créer Pipeline CD

### Pour cette semaine:
📖 **GUIDE_DEVOPS_PHASE_3_4_5.md**
- SonarQube
- Kubernetes
- Monitoring

### Pour la checklist:
📖 **GUIDE_DEVOPS_EXCELLENCE_ET_CHECKLIST.md**

---

## 🆘 PROBLÈMES?

### Jenkins ne démarre pas

```bash
docker logs jenkins
docker restart jenkins
```

### Tests échouent

```bash
# Voir les détails
npm test -- --verbose

# Corriger les tests
# Relancer
npm test
```

### Port 8080 déjà utilisé

```bash
# Utiliser un autre port
docker run -d --name jenkins -p 8081:8080 ...
# Accéder: http://localhost:8081
```

---

## 📋 CHECKLIST IMMÉDIATE

- [ ] Terminal ouvert dans `apps/backend/materials-service`
- [ ] Tests lancés (`npm test`)
- [ ] Couverture vérifiée (`npm test -- --coverage`)
- [ ] Capture d'écran prise
- [ ] Jenkins installé (`docker run...`)
- [ ] Mot de passe récupéré
- [ ] Jenkins accessible (`http://localhost:8080`)
- [ ] Plugins installés
- [ ] Compte admin créé
- [ ] NodeJS configuré
- [ ] Pipeline `materials-service-CI` créé

---

## 🎉 FÉLICITATIONS!

Si vous avez complété ces 4 étapes, vous avez:
- ✅ Vérifié que votre code fonctionne
- ✅ Installé l'outil principal (Jenkins)
- ✅ Créé votre premier pipeline

**Vous êtes sur la bonne voie!** 🚀

---

## 📞 AIDE

### Besoin d'aide?

1. **Consulter les guides**:
   - INDEX_DOCUMENTATION_DEVOPS.md
   - DEMARRAGE_RAPIDE_DEVOPS.md

2. **Vérifier les logs**:
   ```bash
   docker logs jenkins
   ```

3. **Redémarrer si nécessaire**:
   ```bash
   docker restart jenkins
   ```

---

## 🚀 CONTINUEZ!

**Prochaine étape**: Tester votre pipeline

📖 Ouvrir: **GUIDE_DEVOPS_COMPLET_ETAPE_PAR_ETAPE.md** - Étape 5

---

**Date**: 3 Mai 2026
**Auteur**: Ghada
**Statut**: PRÊT À DÉMARRER - ACTION IMMÉDIATE
