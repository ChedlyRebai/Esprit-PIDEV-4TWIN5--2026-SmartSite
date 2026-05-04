# 🚀 ÉTAPE 4 — CI/CD avec Jenkins - COMPLET

## ✅ RÉCAPITULATIF DES PIPELINES

### **Pipelines créés** :

| Service | CI (Jenkinsfile) | CD (Jenkinsfile-CD) | SonarQube |
|---------|------------------|---------------------|-----------|
| **materials-service** | ✅ | ✅ | ✅ |
| **ml-prediction-service** | ✅ | ✅ | ✅ |
| **frontend** | ✅ | ✅ | ✅ |

---

## 📋 CONFIGURATION JENKINS

### **Jobs à créer dans Jenkins** :

#### 1. **materials-service-CI**
- **Type** : Pipeline
- **Script Path** : `apps/backend/materials-service/Jenkinsfile`
- **Déclencheur** : GitHub webhook (push sur main)

#### 2. **materials-service-CD**
- **Type** : Pipeline
- **Script Path** : `apps/backend/materials-service/Jenkinsfile-CD`
- **Déclencheur** : Automatique après CI

#### 3. **ml-prediction-service-CI**
- **Type** : Pipeline
- **Script Path** : `apps/backend/ml-prediction-service/Jenkinsfile`
- **Déclencheur** : GitHub webhook (push sur main)

#### 4. **ml-prediction-service-CD**
- **Type** : Pipeline
- **Script Path** : `apps/backend/ml-prediction-service/Jenkinsfile-CD`
- **Déclencheur** : Automatique après CI

#### 5. **frontend-CI**
- **Type** : Pipeline
- **Script Path** : `apps/frontend/Jenkinsfile`
- **Déclencheur** : GitHub webhook (push sur main)

#### 6. **frontend-CD**
- **Type** : Pipeline
- **Script Path** : `apps/frontend/Jenkinsfile-CD`
- **Déclencheur** : Automatique après CI

---

## 🔐 CREDENTIALS JENKINS NÉCESSAIRES

### **1. Docker Hub**
- **ID** : `docker-hub-credentials`
- **Type** : Username with password
- **Username** : `ghada`
- **Password** : Votre token Docker Hub

### **2. SonarQube Token**
- **ID** : `sonarqube-token`
- **Type** : Secret text
- **Secret** : Token généré depuis SonarQube

### **3. MongoDB URI** (pour materials-service)
- **ID** : `mongodb-uri`
- **Type** : Secret text
- **Value** : `mongodb://localhost:27017/smartsite-materials`

### **4. ML Service URL** (pour materials-service)
- **ID** : `ml-service-url`
- **Type** : Secret text
- **Value** : `http://localhost:8000`

---

## 🎯 FLUX CI/CD

```
┌─────────────────────────────────────────────────────────────┐
│                    PUSH sur GitHub                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  CI PIPELINE (Jenkinsfile)                  │
├─────────────────────────────────────────────────────────────┤
│  1. Checkout code                                           │
│  2. Install dependencies                                    │
│  3. Run unit tests                                          │
│  4. SonarQube analysis                                      │
│  5. Quality Gate check                                      │
│  6. Trigger CD pipeline                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 CD PIPELINE (Jenkinsfile-CD)                │
├─────────────────────────────────────────────────────────────┤
│  1. Checkout code                                           │
│  2. Build Docker image                                      │
│  3. Push to Docker Hub                                      │
│  4. Deploy container                                        │
│  5. Health check                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              SERVICE DÉPLOYÉ ET OPÉRATIONNEL                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 TESTER LES PIPELINES

### **1. Tester localement les Jenkinsfiles**

```bash
# Vérifier la syntaxe
jenkins-cli declarative-linter < apps/backend/materials-service/Jenkinsfile
```

### **2. Créer les jobs dans Jenkins**

1. Ouvrir Jenkins : http://localhost:8080
2. **New Item** → Nom : `materials-service-CI` → Type : **Pipeline**
3. **Pipeline** section :
   - **Definition** : Pipeline script from SCM
   - **SCM** : Git
   - **Repository URL** : https://github.com/ChedlyRebai/Esprit-PIDEV-4TWIN5--2026-SmartSite.git
   - **Branch** : `*/main`
   - **Script Path** : `apps/backend/materials-service/Jenkinsfile`
4. **Save**
5. Répéter pour tous les autres jobs

### **3. Lancer un build**

1. Cliquer sur le job
2. **Build Now**
3. Voir les logs dans **Console Output**

---

## 📊 RÉSULTATS ATTENDUS

### **CI Pipeline** :
- ✅ Tests unitaires passent
- ✅ SonarQube analyse le code
- ✅ Quality Gate passe (ou warning)
- ✅ CD déclenché automatiquement

### **CD Pipeline** :
- ✅ Image Docker construite
- ✅ Image poussée sur Docker Hub
- ✅ Container déployé
- ✅ Health check réussi

---

## 🐛 TROUBLESHOOTING

### **Problème : "docker: command not found"**
**Solution** : Installer Docker sur l'agent Jenkins ou utiliser un agent avec Docker

### **Problème : "SonarQube server not found"**
**Solution** : Configurer le serveur SonarQube dans Jenkins (Manage Jenkins → Configure System)

### **Problème : "Permission denied (docker.sock)"**
**Solution** : Ajouter l'utilisateur Jenkins au groupe docker
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### **Problème : "Tests failed"**
**Solution** : Vérifier les logs des tests et corriger le code

---

## ✅ VALIDATION ÉTAPE 4

- [ ] 6 jobs Jenkins créés (3 CI + 3 CD)
- [ ] Credentials configurés
- [ ] SonarQube configuré
- [ ] Premier build CI réussi
- [ ] Premier build CD réussi
- [ ] Services déployés et accessibles

---

## 🎉 PROCHAINE ÉTAPE

Une fois que tous les pipelines fonctionnent, on passe à l'**ÉTAPE 5 : Kubernetes** ! 🚀
