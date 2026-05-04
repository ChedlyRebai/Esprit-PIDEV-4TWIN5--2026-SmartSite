# 🚀 DÉMARRAGE RAPIDE - DEVOPS MATERIALS SERVICE

## 📋 VOUS AVEZ DÉJÀ

✅ Docker Desktop installé
✅ Dockerfile pour materials-service
✅ Jenkinsfile CI pour materials-service
✅ Jenkinsfile-CD pour materials-service
✅ Configuration SonarQube

## 🎯 CE QU'IL FAUT FAIRE

### AUJOURD'HUI (2-3h)

#### 1. Vérifier les Tests (30 min)
```bash
cd apps/backend/materials-service
npm test
npm test -- --coverage
```

**Si couverture < 70%**: Ajouter des tests pour votre module

#### 2. Installer Jenkins (30 min)
```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts
```

Accéder: `http://localhost:8080`

#### 3. Créer Pipeline CI Backend (30 min)
1. Jenkins → New Item → `materials-service-CI`
2. Type: Pipeline
3. Script Path: `apps/backend/materials-service/Jenkinsfile`
4. Build Now

#### 4. Créer Pipeline CD Backend (30 min)
1. Configurer credentials Docker Hub
2. Jenkins → New Item → `materials-service-CD`
3. Script Path: `apps/backend/materials-service/Jenkinsfile-CD`

---

### CETTE SEMAINE (10-15h)

#### Jour 1: Pipelines Frontend (2-3h)
- Créer `apps/frontend/Jenkinsfile`
- Créer `apps/frontend/Jenkinsfile-CD`
- Tester les pipelines

#### Jour 2: SonarQube (2-3h)
- Installer SonarQube
- Capturer état AVANT
- Refactoring
- Capturer état APRÈS

#### Jour 3-4: Kubernetes (4-6h)
- Créer VMs (Master + Workers)
- Installer kubeadm
- Déployer applications

#### Jour 5: Monitoring (2-3h)
- Installer Prometheus
- Configurer Grafana
- Alert Manager

---

## 📚 GUIDES DISPONIBLES

### Guide Principal
📖 **GUIDE_DEVOPS_COMPLET_ETAPE_PAR_ETAPE.md**
- Phase 1: Tests unitaires
- Phase 2: Pipelines CI/CD (4 pipelines)

### Guide Avancé
📖 **GUIDE_DEVOPS_PHASE_3_4_5.md**
- Phase 3: SonarQube
- Phase 4: Kubernetes
- Phase 5: Monitoring

### Guide Excellence
📖 **GUIDE_DEVOPS_EXCELLENCE_ET_CHECKLIST.md**
- Partie Excellence (bonus)
- Checklist finale
- Plan de travail

---

## 🆘 AIDE RAPIDE

### Commandes Essentielles

**Docker**:
```bash
docker ps                    # Voir les conteneurs
docker logs <container>      # Voir les logs
docker restart <container>   # Redémarrer
```

**Jenkins**:
```bash
# Mot de passe initial
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

**Kubernetes**:
```bash
kubectl get nodes            # Voir les nodes
kubectl get pods -n smartsite  # Voir les pods
kubectl logs <pod> -n smartsite  # Voir les logs
```

**Tests**:
```bash
npm test                     # Lancer les tests
npm test -- --coverage       # Avec couverture
```

---

## ✅ CHECKLIST RAPIDE

### Aujourd'hui
- [ ] Tests unitaires vérifiés (couverture > 70%)
- [ ] Jenkins installé et accessible
- [ ] Pipeline CI Backend créé et testé
- [ ] Pipeline CD Backend créé

### Cette Semaine
- [ ] Pipelines Frontend (CI + CD)
- [ ] SonarQube (avant/après)
- [ ] Kubernetes (cluster + déploiement)
- [ ] Monitoring (Prometheus + Grafana)

### Avant la Présentation
- [ ] 4 pipelines fonctionnels
- [ ] Tests intégrés
- [ ] SonarQube avec captures
- [ ] Kubernetes opérationnel
- [ ] Monitoring complet
- [ ] Documentation
- [ ] Présentation préparée

---

## 🎯 PRIORITÉS

### CRITIQUE (À faire en premier)
1. ✅ Tests unitaires (votre module)
2. ✅ Pipeline CI Backend
3. ✅ Pipeline CD Backend

### IMPORTANT (Cette semaine)
4. ✅ Pipelines Frontend
5. ✅ SonarQube
6. ✅ Kubernetes

### BONUS (Si temps)
7. ✅ Monitoring avancé
8. ✅ Partie Excellence

---

## 📞 QUESTIONS FRÉQUENTES

### Q: Par où commencer?
**R**: Commencez par vérifier vos tests unitaires, puis installez Jenkins.

### Q: Combien de temps ça prend?
**R**: 
- Tests + Pipelines Backend: 2-3h
- Pipelines Frontend: 2-3h
- SonarQube: 2-3h
- Kubernetes: 4-6h
- Monitoring: 2-3h
- **Total**: 12-18h

### Q: Dois-je tout faire seul?
**R**: 
- Tests unitaires: **Individuel** (votre module)
- Pipelines: **Individuel** (votre service)
- Kubernetes: **Groupe** (infrastructure commune)
- Monitoring: **Groupe** (infrastructure commune)

### Q: Que faire si Jenkins ne démarre pas?
**R**: 
```bash
docker logs jenkins
docker restart jenkins
```

### Q: Comment tester sans Kubernetes?
**R**: Utilisez Docker localement d'abord:
```bash
docker build -t materials-service .
docker run -p 3009:3009 materials-service
```

---

## 🚀 COMMENCER MAINTENANT

### Étape 1: Vérifier les Tests (5 min)
```bash
cd apps/backend/materials-service
npm test
```

### Étape 2: Installer Jenkins (10 min)
```bash
docker run -d --name jenkins -p 8080:8080 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts
```

### Étape 3: Ouvrir le Guide Complet
📖 Ouvrir: `GUIDE_DEVOPS_COMPLET_ETAPE_PAR_ETAPE.md`

### Étape 4: Suivre les Instructions
Suivre le guide étape par étape, phase par phase.

---

## 🎉 VOUS ÊTES PRÊT!

Vous avez maintenant:
- ✅ Un plan clair
- ✅ Des guides détaillés
- ✅ Une checklist
- ✅ Des commandes prêtes à l'emploi

**Commencez par l'Étape 1 et suivez le guide!** 🚀

---

**Date**: 3 Mai 2026
**Auteur**: Ghada
**Statut**: PRÊT À DÉMARRER
