# 🚀 GUIDE DEVOPS - PARTIE EXCELLENCE & CHECKLIST FINAL

---

## PHASE 6: PARTIE EXCELLENCE (2-3 points bonus)

### Idées pour Gagner des Points Bonus

#### Option 1: Helm Charts (Complexité: Moyenne, Groupe)

**Avantage**: Facilite le déploiement Kubernetes

**Fichier**: `helm/materials-service/Chart.yaml`

```yaml
apiVersion: v2
name: materials-service
description: A Helm chart for Materials Service
type: application
version: 1.0.0
appVersion: "1.0.0"
```

**Fichier**: `helm/materials-service/values.yaml`

```yaml
replicaCount: 2

image:
  repository: ghada/smartsite-materials-service
  pullPolicy: IfNotPresent
  tag: "latest"

service:
  type: LoadBalancer
  port: 3009

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

mongodb:
  uri: mongodb+srv://user:pass@cluster.mongodb.net/smartsite-materials
```

**Déploiement**:
```bash
helm install materials-service ./helm/materials-service -n smartsite
```

---

#### Option 2: ArgoCD - GitOps (Complexité: Élevée, Groupe)

**Avantage**: Déploiement continu automatique depuis Git

**Installation**:
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Accéder à ArgoCD
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

**Créer une Application**:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: materials-service
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/votre-repo/smartsite-platform
    targetRevision: HEAD
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: smartsite
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

---

#### Option 3: Istio Service Mesh (Complexité: Élevée, Groupe)

**Avantage**: Traffic management, sécurité, observabilité

**Installation**:
```bash
curl -L https://istio.io/downloadIstio | sh -
cd istio-*
export PATH=$PWD/bin:$PATH
istioctl install --set profile=demo -y

# Activer l'injection automatique
kubectl label namespace smartsite istio-injection=enabled
```

**Avantages**:
- Circuit breaker
- Retry automatique
- Canary deployment
- Mutual TLS

---

#### Option 4: Trivy - Scan de Sécurité (Complexité: Faible, Individuel)

**Avantage**: Scanner les vulnérabilités dans les images Docker

**Installation**:
```bash
# Installer Trivy
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Scanner une image
trivy image ghada/smartsite-materials-service:latest
```

**Intégration dans Jenkins**:
```groovy
stage('Security Scan') {
    steps {
        sh 'trivy image --severity HIGH,CRITICAL ghada/smartsite-materials-service:latest'
    }
}
```

---

#### Option 5: Vault - Gestion des Secrets (Complexité: Moyenne, Groupe)

**Avantage**: Sécuriser les secrets (mots de passe, tokens)

**Installation**:
```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault --namespace vault --create-namespace
```

**Utilisation**:
```bash
# Stocker un secret
vault kv put secret/mongodb uri="mongodb+srv://..."

# Récupérer un secret
vault kv get secret/mongodb
```

---

#### Option 6: ELK Stack - Logs Centralisés (Complexité: Élevée, Groupe)

**Avantage**: Centraliser et analyser les logs

**Composants**:
- **Elasticsearch**: Stockage des logs
- **Logstash**: Collecte et transformation
- **Kibana**: Visualisation

**Installation**:
```bash
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch -n logging --create-namespace
helm install kibana elastic/kibana -n logging
helm install filebeat elastic/filebeat -n logging
```

---

#### Option 7: Terraform - Infrastructure as Code (Complexité: Moyenne, Groupe)

**Avantage**: Automatiser la création de l'infrastructure

**Fichier**: `terraform/main.tf`

```hcl
provider "kubernetes" {
  config_path = "~/.kube/config"
}

resource "kubernetes_namespace" "smartsite" {
  metadata {
    name = "smartsite"
  }
}

resource "kubernetes_deployment" "materials_service" {
  metadata {
    name      = "materials-service"
    namespace = kubernetes_namespace.smartsite.metadata[0].name
  }
  
  spec {
    replicas = 2
    
    selector {
      match_labels = {
        app = "materials-service"
      }
    }
    
    template {
      metadata {
        labels = {
          app = "materials-service"
        }
      }
      
      spec {
        container {
          name  = "materials-service"
          image = "ghada/smartsite-materials-service:latest"
          
          port {
            container_port = 3009
          }
        }
      }
    }
  }
}
```

**Déploiement**:
```bash
terraform init
terraform plan
terraform apply
```

---

#### Option 8: Chaos Engineering avec Chaos Mesh (Complexité: Élevée, Groupe)

**Avantage**: Tester la résilience de l'application

**Installation**:
```bash
helm repo add chaos-mesh https://charts.chaos-mesh.org
helm install chaos-mesh chaos-mesh/chaos-mesh -n chaos-testing --create-namespace
```

**Exemple d'expérience**:
```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: pod-failure
  namespace: chaos-testing
spec:
  action: pod-failure
  mode: one
  duration: "30s"
  selector:
    namespaces:
      - smartsite
    labelSelectors:
      app: materials-service
```

---

### Recommandations pour Gagner des Points

**Complexité Faible (1 point)** - Individuel:
- ✅ Trivy (scan de sécurité)
- ✅ Pre-commit hooks
- ✅ Code coverage badges

**Complexité Moyenne (2 points)** - Groupe:
- ✅ Helm Charts
- ✅ Vault (gestion des secrets)
- ✅ Terraform

**Complexité Élevée (3 points)** - Groupe:
- ✅ ArgoCD (GitOps)
- ✅ Istio (Service Mesh)
- ✅ ELK Stack
- ✅ Chaos Engineering

**Ma Recommandation**:
1. **Trivy** (individuel, facile, 1 point)
2. **Helm Charts** (groupe, moyen, 2 points)
3. **Total**: 3 points bonus! 🎉

---

## ✅ CHECKLIST FINALE

### 1. Pipelines CI/CD ✅

#### Backend (Materials Service)
- [ ] Pipeline CI créé dans Jenkins
- [ ] Pipeline CD créé dans Jenkins
- [ ] Tests unitaires intégrés
- [ ] CD déclenché automatiquement après CI
- [ ] Captures d'écran des pipelines

#### Frontend
- [ ] Pipeline CI créé dans Jenkins
- [ ] Pipeline CD créé dans Jenkins
- [ ] Tests unitaires intégrés
- [ ] CD déclenché automatiquement après CI
- [ ] Captures d'écran des pipelines

**Total**: 4 pipelines ✅

---

### 2. Tests Unitaires ✅

#### Votre Module (Materials Service)
- [ ] Tests créés pour votre module
- [ ] Couverture > 70%
- [ ] Tests passent dans le pipeline CI
- [ ] Rapport de couverture généré

**Fichiers de tests**:
- [ ] `materials.service.spec.ts`
- [ ] `materials.controller.spec.ts`
- [ ] Autres fichiers de votre module

---

### 3. SonarQube ✅

#### Configuration
- [ ] SonarQube installé et accessible
- [ ] Projet Backend créé
- [ ] Projet Frontend créé
- [ ] Intégré dans les pipelines CI

#### Captures AVANT Refactoring
- [ ] Vue d'ensemble (bugs, vulnerabilities, code smells)
- [ ] Détails des bugs
- [ ] Détails des code smells
- [ ] Couverture de code
- [ ] Métriques (LOC, complexity, debt)

#### Refactoring
- [ ] Bugs corrigés
- [ ] Code smells réduits
- [ ] Couverture améliorée (>80%)
- [ ] Duplications réduites

#### Captures APRÈS Refactoring
- [ ] Vue d'ensemble (améliorations visibles)
- [ ] Détails des corrections
- [ ] Nouvelle couverture
- [ ] Nouvelles métriques

#### Documentation
- [ ] Tableau comparatif avant/après
- [ ] Explications des corrections

---

### 4. Kubernetes ✅

#### Infrastructure
- [ ] Cluster créé avec kubeadm
- [ ] Master node configuré
- [ ] Worker nodes joints
- [ ] Réseau Pod installé (Flannel)
- [ ] Cluster fonctionnel (`kubectl get nodes`)

#### Déploiements
- [ ] Namespace `smartsite` créé
- [ ] Secrets créés (MongoDB)
- [ ] ConfigMaps créés
- [ ] Materials Service déployé (2 replicas)
- [ ] Frontend déployé (2 replicas)
- [ ] Services exposés (LoadBalancer)

#### Fichiers Kubernetes
- [ ] `materials-service-deployment.yaml`
- [ ] `frontend-deployment.yaml`
- [ ] `mongodb-secret.yaml`
- [ ] `materials-service-configmap.yaml`

#### Vérification
- [ ] Pods en état `Running`
- [ ] Services accessibles
- [ ] Health checks fonctionnels
- [ ] Logs visibles

---

### 5. Monitoring ✅

#### Prometheus
- [ ] Installé sur Kubernetes
- [ ] Accessible (NodePort 30090)
- [ ] Collecte les métriques
- [ ] Règles d'alerte configurées

#### Grafana
- [ ] Installé sur Kubernetes
- [ ] Accessible (NodePort 30091)
- [ ] Dashboards importés:
  - [ ] Kubernetes Cluster Monitoring
  - [ ] Node Exporter Full
  - [ ] Docker Monitoring
- [ ] Dashboards personnalisés pour Materials Service

#### Alert Manager
- [ ] Configuré
- [ ] Règles d'alerte créées:
  - [ ] Service Down
  - [ ] High Memory Usage
  - [ ] High CPU Usage
- [ ] Notifications configurées (Email)
- [ ] Test d'alerte effectué

#### Captures d'Écran
- [ ] Dashboard Prometheus
- [ ] Dashboards Grafana
- [ ] Alertes actives
- [ ] Notification reçue

---

### 6. Partie Excellence (Optionnel) ✅

#### Option Choisie: _________________

- [ ] Outil installé et configuré
- [ ] Intégré dans le workflow
- [ ] Documentation créée
- [ ] Démonstration préparée
- [ ] Captures d'écran

**Points attendus**: _____ / 3

---

### 7. Documentation ✅

#### Documentation Technique
- [ ] README.md du projet
- [ ] Guide d'installation
- [ ] Guide de déploiement
- [ ] Architecture du système

#### Documentation DevOps
- [ ] Guide des pipelines CI/CD
- [ ] Guide Kubernetes
- [ ] Guide Monitoring
- [ ] Guide SonarQube

#### Captures d'Écran
- [ ] Pipelines CI/CD
- [ ] SonarQube (avant/après)
- [ ] Kubernetes (pods, services)
- [ ] Monitoring (Prometheus, Grafana)
- [ ] Partie Excellence

---

### 8. Présentation ✅

#### Préparation
- [ ] Slides de présentation
- [ ] Démonstration live préparée
- [ ] Vidéo de backup (si problème technique)
- [ ] Répartition des rôles (qui présente quoi)

#### Contenu de la Présentation
- [ ] Introduction du projet
- [ ] Architecture globale
- [ ] Pipelines CI/CD (démonstration)
- [ ] SonarQube (avant/après)
- [ ] Kubernetes (architecture, déploiement)
- [ ] Monitoring (dashboards, alertes)
- [ ] Partie Excellence
- [ ] Conclusion et difficultés rencontrées

---

## 📊 SCORE ATTENDU

| Critère | Points Max | Votre Score |
|---------|------------|-------------|
| **Pipelines CI/CD** | 4 | ___ / 4 |
| **Tests Unitaires** | 2 | ___ / 2 |
| **SonarQube** | 3 | ___ / 3 |
| **Kubernetes** | 4 | ___ / 4 |
| **Monitoring** | 3 | ___ / 3 |
| **Alert Manager** | 2 | ___ / 2 |
| **Documentation** | 2 | ___ / 2 |
| **TOTAL** | **20** | ___ / 20 |
| **Excellence (Bonus)** | +3 | ___ / 3 |
| **TOTAL FINAL** | **23** | ___ / 23 |

---

## 🎯 PLAN DE TRAVAIL RECOMMANDÉ

### Semaine 1: Tests et Pipelines
- **Jour 1-2**: Compléter les tests unitaires
- **Jour 3-4**: Configurer Jenkins et pipelines CI/CD
- **Jour 5**: Tests et captures d'écran

### Semaine 2: SonarQube et Kubernetes
- **Jour 1-2**: SonarQube (captures avant, refactoring, captures après)
- **Jour 3-5**: Kubernetes (installation, déploiement, tests)

### Semaine 3: Monitoring et Excellence
- **Jour 1-2**: Prometheus et Grafana
- **Jour 3**: Alert Manager
- **Jour 4-5**: Partie Excellence

### Semaine 4: Documentation et Présentation
- **Jour 1-2**: Documentation complète
- **Jour 3-4**: Préparation de la présentation
- **Jour 5**: Répétition et ajustements

---

## 📞 AIDE ET SUPPORT

### Problèmes Courants

#### Jenkins ne démarre pas
```bash
# Vérifier les logs
docker logs jenkins

# Redémarrer
docker restart jenkins
```

#### Kubernetes pods en CrashLoopBackOff
```bash
# Voir les logs
kubectl logs <pod-name> -n smartsite

# Décrire le pod
kubectl describe pod <pod-name> -n smartsite
```

#### SonarQube ne se connecte pas
```bash
# Vérifier que SonarQube est démarré
docker ps | grep sonarqube

# Vérifier les logs
docker logs sonarqube
```

---

## 🎉 FÉLICITATIONS!

Si vous avez complété toutes les étapes de ce guide, vous avez:

✅ 4 pipelines CI/CD fonctionnels
✅ Tests unitaires intégrés
✅ SonarQube avec avant/après
✅ Cluster Kubernetes opérationnel
✅ Monitoring complet (Prometheus + Grafana)
✅ Alert Manager configuré
✅ Documentation complète
✅ Partie Excellence (bonus)

**Vous êtes prêt pour la présentation!** 🚀

---

**Date**: 3 Mai 2026
**Auteur**: Ghada
**Statut**: GUIDE COMPLET - PRÊT POUR LA PRÉSENTATION
