# 🚀 GUIDE DEVOPS - PHASES 3, 4, 5
## SonarQube, Kubernetes, Monitoring

---

## PHASE 3: SONARQUBE - QUALITÉ DU CODE

### ÉTAPE 10: Installer SonarQube

#### Option 1: Docker (Recommandé)

```bash
# Créer un réseau Docker
docker network create sonarnet

# Lancer PostgreSQL
docker run -d \
  --name sonarqube-db \
  --network sonarnet \
  -e POSTGRES_USER=sonar \
  -e POSTGRES_PASSWORD=sonar \
  -e POSTGRES_DB=sonarqube \
  postgres:13

# Lancer SonarQube
docker run -d \
  --name sonarqube \
  --network sonarnet \
  -p 9000:9000 \
  -e SONAR_JDBC_URL=jdbc:postgresql://sonarqube-db:5432/sonarqube \
  -e SONAR_JDBC_USERNAME=sonar \
  -e SONAR_JDBC_PASSWORD=sonar \
  sonarqube:lts
```

#### Accéder à SonarQube

```
http://localhost:9000
```

**Credentials par défaut**:
- Username: `admin`
- Password: `admin`

**Changer le mot de passe** lors de la première connexion.

---

### ÉTAPE 11: Configurer SonarQube

#### 11.1 Créer un Token

1. **My Account** → **Security** → **Generate Token**
2. Name: `jenkins`
3. Type: `Global Analysis Token`
4. **Generate**
5. **Copier le token** (vous ne le reverrez plus!)

#### 11.2 Créer le Projet Backend

1. **Projects** → **Create Project**
2. Project key: `smartsite-materials-service`
3. Display name: `SmartSite - Materials Service`
4. **Set Up**

#### 11.3 Créer le Projet Frontend

1. **Projects** → **Create Project**
2. Project key: `smartsite-frontend`
3. Display name: `SmartSite - Frontend`
4. **Set Up**

#### 11.4 Configurer Jenkins avec SonarQube

1. Jenkins → **Manage Jenkins** → **Configure System**
2. **SonarQube servers** → **Add SonarQube**
   - Name: `SonarQube`
   - Server URL: `http://localhost:9000`
   - Server authentication token: **Add** → **Secret text**
     - Secret: `[votre-token-sonarqube]`
     - ID: `sonarqube-token`

---

### ÉTAPE 12: Capturer l'État AVANT Refactoring

#### 12.1 Lancer l'analyse SonarQube

```bash
cd apps/backend/materials-service

# Installer SonarScanner (si pas déjà fait)
npm install -g sonarqube-scanner

# Lancer l'analyse
sonar-scanner \
  -Dsonar.projectKey=smartsite-materials-service \
  -Dsonar.sources=src \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=[votre-token]
```

#### 12.2 Prendre des Captures d'Écran AVANT

**Captures à prendre**:
1. **Vue d'ensemble du projet**
   - Bugs
   - Vulnerabilities
   - Code Smells
   - Coverage
   - Duplications

2. **Détails par catégorie**
   - Liste des bugs
   - Liste des code smells
   - Couverture de code par fichier

3. **Métriques**
   - Lines of Code
   - Complexity
   - Technical Debt

**Sauvegarder les captures**: `screenshots/sonarqube-avant/`

---

### ÉTAPE 13: Refactoring du Code

#### 13.1 Identifier les Problèmes

Dans SonarQube, cliquer sur:
- **Bugs** → Voir la liste
- **Code Smells** → Voir la liste
- **Coverage** → Voir les fichiers non couverts

#### 13.2 Corriger les Bugs

**Exemple de bugs courants**:

```typescript
// ❌ AVANT: Variable non utilisée
const unusedVariable = 'test';

// ✅ APRÈS: Supprimer
// (supprimé)

// ❌ AVANT: Condition toujours vraie
if (true) {
  doSomething();
}

// ✅ APRÈS: Simplifier
doSomething();

// ❌ AVANT: Comparaison avec ==
if (value == null) {
  // ...
}

// ✅ APRÈS: Utiliser ===
if (value === null) {
  // ...
}
```

#### 13.3 Corriger les Code Smells

**Exemple de code smells courants**:

```typescript
// ❌ AVANT: Fonction trop longue (>50 lignes)
function processData(data) {
  // 100 lignes de code...
}

// ✅ APRÈS: Diviser en fonctions plus petites
function processData(data) {
  const validated = validateData(data);
  const transformed = transformData(validated);
  return saveData(transformed);
}

function validateData(data) {
  // ...
}

function transformData(data) {
  // ...
}

function saveData(data) {
  // ...
}

// ❌ AVANT: Duplication de code
function getUserById(id) {
  const user = await db.findOne({ _id: id });
  if (!user) throw new Error('User not found');
  return user;
}

function getMaterialById(id) {
  const material = await db.findOne({ _id: id });
  if (!material) throw new Error('Material not found');
  return material;
}

// ✅ APRÈS: Fonction générique
function findByIdOrFail(model, id, entityName) {
  const entity = await model.findOne({ _id: id });
  if (!entity) throw new Error(`${entityName} not found`);
  return entity;
}
```

#### 13.4 Améliorer la Couverture de Tests

**Objectif**: Atteindre au moins 80% de couverture

```bash
# Voir la couverture actuelle
npm test -- --coverage

# Identifier les fichiers non couverts
# Ajouter des tests pour ces fichiers
```

#### 13.5 Relancer l'Analyse

```bash
npm test -- --coverage
sonar-scanner \
  -Dsonar.projectKey=smartsite-materials-service \
  -Dsonar.sources=src \
  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=[votre-token]
```

---

### ÉTAPE 14: Capturer l'État APRÈS Refactoring

#### 14.1 Prendre des Captures d'Écran APRÈS

**Mêmes captures que AVANT**:
1. Vue d'ensemble du projet
2. Détails par catégorie
3. Métriques

**Sauvegarder les captures**: `screenshots/sonarqube-apres/`

#### 14.2 Créer un Tableau Comparatif

**Fichier**: `SONARQUBE_COMPARAISON.md`

```markdown
# Comparaison SonarQube - Avant/Après Refactoring

## Materials Service

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| **Bugs** | 15 | 0 | ✅ -15 |
| **Vulnerabilities** | 3 | 0 | ✅ -3 |
| **Code Smells** | 45 | 12 | ✅ -33 |
| **Coverage** | 45% | 82% | ✅ +37% |
| **Duplications** | 8.5% | 2.1% | ✅ -6.4% |
| **Technical Debt** | 2d 5h | 8h | ✅ -1d 21h |

## Captures d'Écran

### Avant Refactoring
![Avant](screenshots/sonarqube-avant/overview.png)

### Après Refactoring
![Après](screenshots/sonarqube-apres/overview.png)
```

---

## PHASE 4: KUBERNETES

### ÉTAPE 15: Installer Kubernetes avec kubeadm

#### 15.1 Prérequis

**Environnement de virtualisation** (choisir UN seul pour tout le groupe):
- VirtualBox
- VMware
- Hyper-V

**Configuration minimale par VM**:
- 2 CPU
- 2 GB RAM
- 20 GB Disk

#### 15.2 Créer les VMs

**VM 1: Master Node**
- Nom: `k8s-master`
- OS: Ubuntu 22.04
- IP: `192.168.56.10`

**VM 2: Worker Node 1**
- Nom: `k8s-worker1`
- OS: Ubuntu 22.04
- IP: `192.168.56.11`

**VM 3: Worker Node 2** (optionnel)
- Nom: `k8s-worker2`
- OS: Ubuntu 22.04
- IP: `192.168.56.12`

#### 15.3 Installer Docker sur TOUTES les VMs

```bash
# Sur chaque VM
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
```

#### 15.4 Installer kubeadm, kubelet, kubectl sur TOUTES les VMs

```bash
# Sur chaque VM
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl

# Ajouter la clé GPG de Kubernetes
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.28/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

# Ajouter le repository Kubernetes
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.28/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list

# Installer kubeadm, kubelet, kubectl
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```

#### 15.5 Initialiser le Master Node

```bash
# Sur k8s-master uniquement
sudo kubeadm init --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=192.168.56.10

# Configurer kubectl
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Installer un réseau Pod (Flannel)
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml
```

**Sauvegarder la commande `kubeadm join`** affichée à la fin!

#### 15.6 Joindre les Worker Nodes

```bash
# Sur k8s-worker1 et k8s-worker2
sudo kubeadm join 192.168.56.10:6443 --token [token] \
  --discovery-token-ca-cert-hash sha256:[hash]
```

#### 15.7 Vérifier le Cluster

```bash
# Sur k8s-master
kubectl get nodes

# Résultat attendu:
# NAME          STATUS   ROLES           AGE   VERSION
# k8s-master    Ready    control-plane   5m    v1.28.0
# k8s-worker1   Ready    <none>          2m    v1.28.0
# k8s-worker2   Ready    <none>          2m    v1.28.0
```

---

### ÉTAPE 16: Créer les Fichiers de Déploiement Kubernetes

#### 16.1 Deployment pour Materials Service

**Fichier**: `k8s/materials-service-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: materials-service
  labels:
    app: materials-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: materials-service
  template:
    metadata:
      labels:
        app: materials-service
    spec:
      containers:
      - name: materials-service
        image: ghada/smartsite-materials-service:latest
        ports:
        - containerPort: 3009
        env:
        - name: PORT
          value: "3009"
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: mongodb-secret
              key: uri
        - name: ML_PREDICTION_SERVICE_URL
          value: "http://ml-service:8000"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/materials/health
            port: 3009
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/materials/health
            port: 3009
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: materials-service
spec:
  selector:
    app: materials-service
  ports:
  - protocol: TCP
    port: 3009
    targetPort: 3009
  type: LoadBalancer
```

#### 16.2 Secret pour MongoDB

**Fichier**: `k8s/mongodb-secret.yaml`

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mongodb-secret
type: Opaque
stringData:
  uri: mongodb+srv://user:pass@cluster.mongodb.net/smartsite-materials
```

#### 16.3 ConfigMap

**Fichier**: `k8s/materials-service-configmap.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: materials-service-config
data:
  PORT: "3009"
  NODE_ENV: "production"
  ML_SERVICE_URL: "http://ml-service:8000"
```

#### 16.4 Deployment pour Frontend

**Fichier**: `k8s/frontend-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  labels:
    app: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: ghada/smartsite-frontend:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
spec:
  selector:
    app: frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

---

### ÉTAPE 17: Déployer sur Kubernetes

#### 17.1 Créer le Namespace

```bash
kubectl create namespace smartsite
```

#### 17.2 Déployer les Secrets

```bash
kubectl apply -f k8s/mongodb-secret.yaml -n smartsite
```

#### 17.3 Déployer les ConfigMaps

```bash
kubectl apply -f k8s/materials-service-configmap.yaml -n smartsite
```

#### 17.4 Déployer Materials Service

```bash
kubectl apply -f k8s/materials-service-deployment.yaml -n smartsite
```

#### 17.5 Déployer Frontend

```bash
kubectl apply -f k8s/frontend-deployment.yaml -n smartsite
```

#### 17.6 Vérifier les Déploiements

```bash
# Voir les pods
kubectl get pods -n smartsite

# Voir les services
kubectl get services -n smartsite

# Voir les logs
kubectl logs -f <pod-name> -n smartsite
```

---

## PHASE 5: MONITORING

### ÉTAPE 18: Installer Prometheus

#### 18.1 Créer le Namespace

```bash
kubectl create namespace monitoring
```

#### 18.2 Installer Prometheus avec Helm

```bash
# Installer Helm (si pas déjà fait)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Ajouter le repository Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Installer Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.service.type=NodePort \
  --set prometheus.service.nodePort=30090 \
  --set grafana.service.type=NodePort \
  --set grafana.service.nodePort=30091
```

#### 18.3 Accéder à Prometheus

```
http://192.168.56.10:30090
```

---

### ÉTAPE 19: Configurer Grafana

#### 19.1 Récupérer le Mot de Passe Grafana

```bash
kubectl get secret --namespace monitoring prometheus-grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
```

#### 19.2 Accéder à Grafana

```
http://192.168.56.10:30091
```

**Credentials**:
- Username: `admin`
- Password: `[mot-de-passe-récupéré]`

#### 19.3 Ajouter des Dashboards

1. **Dashboards** → **Import**
2. Import via grafana.com:
   - **Kubernetes Cluster Monitoring**: ID `7249`
   - **Node Exporter Full**: ID `1860`
   - **Docker Monitoring**: ID `893`

---

### ÉTAPE 20: Configurer Alert Manager

#### 20.1 Créer les Règles d'Alerte

**Fichier**: `k8s/prometheus-rules.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-rules
  namespace: monitoring
data:
  alert.rules: |
    groups:
    - name: materials-service
      interval: 30s
      rules:
      - alert: MaterialsServiceDown
        expr: up{job="materials-service"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Materials Service is down"
          description: "Materials Service has been down for more than 1 minute"
      
      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes{pod=~"materials-service.*"} > 400000000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 400MB"
      
      - alert: HighCPUUsage
        expr: rate(container_cpu_usage_seconds_total{pod=~"materials-service.*"}[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is above 80%"
```

#### 20.2 Appliquer les Règles

```bash
kubectl apply -f k8s/prometheus-rules.yaml
```

#### 20.3 Configurer les Notifications (Email)

**Fichier**: `k8s/alertmanager-config.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  alertmanager.yml: |
    global:
      smtp_smarthost: 'smtp.gmail.com:587'
      smtp_from: 'votre-email@gmail.com'
      smtp_auth_username: 'votre-email@gmail.com'
      smtp_auth_password: 'votre-mot-de-passe-app'
    
    route:
      receiver: 'email-notifications'
      group_by: ['alertname', 'cluster']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
    
    receivers:
    - name: 'email-notifications'
      email_configs:
      - to: 'votre-email@gmail.com'
        headers:
          Subject: '🚨 Alert: {{ .GroupLabels.alertname }}'
```

---

## ✅ RÉSUMÉ PHASES 3, 4, 5

**Ce que vous avez maintenant**:
- ✅ SonarQube configuré
- ✅ Captures avant/après refactoring
- ✅ Cluster Kubernetes avec kubeadm
- ✅ Applications déployées sur Kubernetes
- ✅ Prometheus installé
- ✅ Grafana configuré avec dashboards
- ✅ Alert Manager avec notifications

---

**Date**: 3 Mai 2026
**Auteur**: Ghada
**Statut**: PHASES 3, 4, 5 - SONARQUBE, KUBERNETES, MONITORING
