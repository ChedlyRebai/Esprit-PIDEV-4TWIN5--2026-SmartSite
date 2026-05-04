# 🔐 GUIDE COMPLET - CREDENTIALS JENKINS & INSTALLATION SONARQUBE

---

## PARTIE 1: CREDENTIALS JENKINS

### 📋 LISTE DES CREDENTIALS À CRÉER

Vous devez créer **4 credentials** dans Jenkins:

| ID | Type | Nom | Utilisation |
|----|------|-----|-------------|
| `docker-hub-credentials` | Username + Password | Docker Hub | Push images Docker |
| `mongodb-uri` | Secret text | MongoDB | Connexion base de données |
| `ml-service-url` | Secret text | ML Service | URL du service ML Python |
| `sonarqube-token` | Secret text | SonarQube | Analyse de code |

---

## 🔐 ÉTAPE PAR ÉTAPE: CRÉER LES CREDENTIALS

### Accéder à la Configuration des Credentials

1. Ouvrir Jenkins: `http://localhost:8080`
2. Cliquer sur **Manage Jenkins** (dans le menu gauche)
3. Cliquer sur **Manage Credentials**
4. Cliquer sur **(global)** sous "Stores scoped to Jenkins"
5. Cliquer sur **Add Credentials** (à gauche)

---

### CREDENTIAL 1: Docker Hub 🐳

#### Informations

- **Kind**: `Username with password`
- **Scope**: `Global`
- **Username**: `ghada` (votre nom d'utilisateur Docker Hub)
- **Password**: `[votre-mot-de-passe-ou-token-docker-hub]`
- **ID**: `docker-hub-credentials`
- **Description**: `Docker Hub credentials for ghada`

#### Comment Obtenir le Token Docker Hub

1. Aller sur: https://hub.docker.com/
2. Se connecter avec votre compte
3. Cliquer sur votre nom (en haut à droite) → **Account Settings**
4. **Security** → **New Access Token**
5. Token Name: `jenkins`
6. Access permissions: `Read, Write, Delete`
7. **Generate**
8. **Copier le token** (vous ne le reverrez plus!)
9. Utiliser ce token comme **Password** dans Jenkins

#### Créer le Credential

```
1. Kind: Username with password
2. Username: ghada
3. Password: [coller-le-token-docker-hub]
4. ID: docker-hub-credentials
5. Description: Docker Hub credentials for ghada
6. OK
```

**✅ Credential 1 créé!**

---

### CREDENTIAL 2: MongoDB URI 🍃

#### Informations

- **Kind**: `Secret text`
- **Scope**: `Global`
- **Secret**: `mongodb+srv://user:password@cluster.mongodb.net/smartsite-materials`
- **ID**: `mongodb-uri`
- **Description**: `MongoDB connection string`

#### Obtenir votre MongoDB URI

**Si vous utilisez MongoDB Atlas**:
1. Aller sur: https://cloud.mongodb.com/
2. Se connecter
3. Cliquer sur **Connect** sur votre cluster
4. **Connect your application**
5. Copier la connection string
6. Remplacer `<password>` par votre mot de passe
7. Remplacer `<dbname>` par `smartsite-materials`

**Exemple**:
```
mongodb+srv://ghada:MonMotDePasse123@cluster0.abc123.mongodb.net/smartsite-materials
```

#### Créer le Credential

```
1. Kind: Secret text
2. Secret: mongodb+srv://ghada:MonMotDePasse123@cluster0.abc123.mongodb.net/smartsite-materials
3. ID: mongodb-uri
4. Description: MongoDB connection string
5. OK
```

**✅ Credential 2 créé!**

---

### CREDENTIAL 3: ML Service URL 🤖

#### Informations

- **Kind**: `Secret text`
- **Scope**: `Global`
- **Secret**: `http://localhost:8000`
- **ID**: `ml-service-url`
- **Description**: `ML Prediction Service URL`

#### Créer le Credential

```
1. Kind: Secret text
2. Secret: http://localhost:8000
3. ID: ml-service-url
4. Description: ML Prediction Service URL
5. OK
```

**Note**: Si votre service ML est sur une autre machine, utilisez son IP:
```
http://192.168.1.100:8000
```

**✅ Credential 3 créé!**

---

### CREDENTIAL 4: SonarQube Token 📊

**⚠️ IMPORTANT**: Créez ce credential APRÈS avoir installé SonarQube (voir Partie 2)

#### Informations

- **Kind**: `Secret text`
- **Scope**: `Global`
- **Secret**: `[token-généré-par-sonarqube]`
- **ID**: `sonarqube-token`
- **Description**: `SonarQube authentication token`

#### Comment Obtenir le Token SonarQube

**Après avoir installé SonarQube** (voir Partie 2):

1. Ouvrir SonarQube: `http://localhost:9000`
2. Se connecter (admin/admin)
3. Cliquer sur votre avatar (en haut à droite)
4. **My Account**
5. **Security** (onglet)
6. **Generate Token**:
   - Name: `jenkins`
   - Type: `Global Analysis Token`
   - Expires in: `No expiration`
7. **Generate**
8. **Copier le token** (vous ne le reverrez plus!)

**Exemple de token**:
```
squ_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8
```

#### Créer le Credential

```
1. Kind: Secret text
2. Secret: squ_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8
3. ID: sonarqube-token
4. Description: SonarQube authentication token
5. OK
```

**✅ Credential 4 créé!**

---

## ✅ VÉRIFICATION DES CREDENTIALS

### Voir tous les Credentials

1. **Manage Jenkins** → **Manage Credentials**
2. Cliquer sur **(global)**
3. Vous devriez voir:

```
ID                        Type                Description
─────────────────────────────────────────────────────────────────
docker-hub-credentials    Username/Password   Docker Hub credentials for ghada
mongodb-uri               Secret text         MongoDB connection string
ml-service-url            Secret text         ML Prediction Service URL
sonarqube-token           Secret text         SonarQube authentication token
```

**✅ Tous les credentials sont créés!**

---

## PARTIE 2: INSTALLATION SONARQUBE

### 🎯 MÉTHODE RECOMMANDÉE: DOCKER

---

## ÉTAPE 1: CRÉER UN RÉSEAU DOCKER

```bash
docker network create sonarnet
```

**Pourquoi?** Pour que SonarQube et PostgreSQL puissent communiquer.

---

## ÉTAPE 2: LANCER POSTGRESQL

```bash
docker run -d \
  --name sonarqube-db \
  --network sonarnet \
  -e POSTGRES_USER=sonar \
  -e POSTGRES_PASSWORD=sonar \
  -e POSTGRES_DB=sonarqube \
  -v sonarqube-db:/var/lib/postgresql/data \
  postgres:13
```

**Vérifier**:
```bash
docker ps | grep sonarqube-db
```

**Résultat attendu**: Le conteneur est en état `Up`

---

## ÉTAPE 3: LANCER SONARQUBE

```bash
docker run -d \
  --name sonarqube \
  --network sonarnet \
  -p 9000:9000 \
  -e SONAR_JDBC_URL=jdbc:postgresql://sonarqube-db:5432/sonarqube \
  -e SONAR_JDBC_USERNAME=sonar \
  -e SONAR_JDBC_PASSWORD=sonar \
  -v sonarqube-data:/opt/sonarqube/data \
  -v sonarqube-extensions:/opt/sonarqube/extensions \
  -v sonarqube-logs:/opt/sonarqube/logs \
  sonarqube:lts
```

**Vérifier**:
```bash
docker ps | grep sonarqube
```

**Résultat attendu**: Le conteneur est en état `Up`

---

## ÉTAPE 4: ATTENDRE LE DÉMARRAGE (2-3 minutes)

```bash
docker logs -f sonarqube
```

**Attendre de voir**:
```
SonarQube is operational
```

**Appuyer sur Ctrl+C** pour sortir des logs.

---

## ÉTAPE 5: ACCÉDER À SONARQUBE

### Ouvrir dans le navigateur

```
http://localhost:9000
```

### Première Connexion

**Credentials par défaut**:
- Username: `admin`
- Password: `admin`

### Changer le Mot de Passe

1. SonarQube vous demandera de changer le mot de passe
2. Nouveau mot de passe: `admin123` (ou autre)
3. **Update**

**✅ SonarQube est prêt!**

---

## ÉTAPE 6: CRÉER LES PROJETS

### Projet 1: Materials Service

1. Cliquer sur **Projects** (en haut)
2. **Create Project**
3. **Manually**:
   - Project key: `smartsite-materials-service`
   - Display name: `SmartSite - Materials Service`
4. **Set Up**
5. **Locally**
6. **Generate a token**:
   - Name: `jenkins`
   - Type: `Global Analysis Token`
   - **Generate**
   - **Copier le token** (pour le credential Jenkins)
7. **Continue**
8. Build technology: **Other**
9. OS: **Linux**

**✅ Projet Materials Service créé!**

### Projet 2: Frontend

1. **Projects** → **Create Project**
2. **Manually**:
   - Project key: `smartsite-frontend`
   - Display name: `SmartSite - Frontend`
3. **Set Up**
4. Utiliser le même token que précédemment
5. Build technology: **Other**
6. OS: **Linux**

**✅ Projet Frontend créé!**

---

## ÉTAPE 7: CONFIGURER JENKINS AVEC SONARQUBE

### 7.1 Ajouter le Serveur SonarQube

1. Jenkins → **Manage Jenkins** → **Configure System**
2. Descendre jusqu'à **SonarQube servers**
3. **Add SonarQube**:
   - Name: `SonarQube`
   - Server URL: `http://localhost:9000`
   - Server authentication token: **Add** → **Jenkins**
     - Kind: `Secret text`
     - Secret: `[coller-le-token-sonarqube]`
     - ID: `sonarqube-token`
     - Description: `SonarQube authentication token`
     - **Add**
   - Sélectionner le token créé
4. **Save**

### 7.2 Configurer SonarQube Scanner

1. **Manage Jenkins** → **Global Tool Configuration**
2. **SonarQube Scanner** → **Add SonarQube Scanner**
   - Name: `SonarScanner`
   - ✅ Install automatically
   - Version: `SonarQube Scanner 5.0.1.3006` (ou la dernière)
3. **Save**

**✅ Jenkins est configuré avec SonarQube!**

---

## ÉTAPE 8: TESTER L'ANALYSE SONARQUBE

### Test Manuel

```bash
cd apps/backend/materials-service

# Installer SonarScanner (si pas déjà fait)
npm install -g sonarqube-scanner

# Lancer l'analyse
sonar-scanner \
  -Dsonar.projectKey=smartsite-materials-service \
  -Dsonar.sources=src \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=[votre-token-sonarqube]
```

**Résultat attendu**:
```
INFO: ANALYSIS SUCCESSFUL
INFO: Note that you will be able to access the updated dashboard once the server has processed the submitted analysis report
```

### Voir les Résultats

1. Ouvrir SonarQube: `http://localhost:9000`
2. Cliquer sur **Projects**
3. Cliquer sur **SmartSite - Materials Service**
4. Voir les métriques:
   - Bugs
   - Vulnerabilities
   - Code Smells
   - Coverage
   - Duplications

**✅ Analyse SonarQube fonctionne!**

---

## 📸 CAPTURES D'ÉCRAN À PRENDRE

### Pour SonarQube

1. **Page d'accueil** avec les 2 projets
2. **Vue d'ensemble** du projet Materials Service
3. **Détails des bugs** (s'il y en a)
4. **Détails des code smells**
5. **Couverture de code**
6. **Métriques** (LOC, Complexity, Debt)

### Pour Jenkins

1. **Liste des credentials** (Manage Credentials)
2. **Configuration SonarQube** (Configure System)
3. **Configuration SonarQube Scanner** (Global Tool Configuration)

---

## 🐛 DÉPANNAGE

### SonarQube ne démarre pas

```bash
# Voir les logs
docker logs sonarqube

# Vérifier la mémoire (SonarQube nécessite au moins 2GB)
docker stats sonarqube

# Redémarrer
docker restart sonarqube
```

### Erreur "Elasticsearch: max virtual memory areas"

**Sur Linux**:
```bash
sudo sysctl -w vm.max_map_count=262144
```

**Sur Windows avec WSL2**:
```powershell
wsl -d docker-desktop
sysctl -w vm.max_map_count=262144
```

### SonarQube accessible mais lent

```bash
# Augmenter la mémoire
docker stop sonarqube
docker rm sonarqube

docker run -d \
  --name sonarqube \
  --network sonarnet \
  -p 9000:9000 \
  -e SONAR_JDBC_URL=jdbc:postgresql://sonarqube-db:5432/sonarqube \
  -e SONAR_JDBC_USERNAME=sonar \
  -e SONAR_JDBC_PASSWORD=sonar \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  -m 4g \
  -v sonarqube-data:/opt/sonarqube/data \
  -v sonarqube-extensions:/opt/sonarqube/extensions \
  -v sonarqube-logs:/opt/sonarqube/logs \
  sonarqube:lts
```

### Token SonarQube ne fonctionne pas

1. Vérifier que le token est correct (pas d'espaces)
2. Régénérer un nouveau token
3. Mettre à jour le credential dans Jenkins

---

## ✅ CHECKLIST FINALE

### Credentials Jenkins
- [ ] `docker-hub-credentials` créé (Username + Password)
- [ ] `mongodb-uri` créé (Secret text)
- [ ] `ml-service-url` créé (Secret text)
- [ ] `sonarqube-token` créé (Secret text)
- [ ] Tous les credentials visibles dans Manage Credentials

### SonarQube
- [ ] Réseau Docker `sonarnet` créé
- [ ] PostgreSQL lancé et en état `Up`
- [ ] SonarQube lancé et en état `Up`
- [ ] SonarQube accessible sur `http://localhost:9000`
- [ ] Mot de passe changé
- [ ] Projet `smartsite-materials-service` créé
- [ ] Projet `smartsite-frontend` créé
- [ ] Token généré et copié
- [ ] Jenkins configuré avec SonarQube
- [ ] SonarQube Scanner configuré dans Jenkins
- [ ] Test d'analyse réussi

---

## 🎉 FÉLICITATIONS!

Vous avez maintenant:
- ✅ 4 credentials configurés dans Jenkins
- ✅ SonarQube installé et opérationnel
- ✅ 2 projets créés dans SonarQube
- ✅ Jenkins connecté à SonarQube
- ✅ Prêt pour l'analyse de code!

---

## 📞 COMMANDES UTILES

### Docker

```bash
# Voir les conteneurs
docker ps

# Voir les logs SonarQube
docker logs -f sonarqube

# Voir les logs PostgreSQL
docker logs -f sonarqube-db

# Redémarrer SonarQube
docker restart sonarqube

# Arrêter tout
docker stop sonarqube sonarqube-db

# Démarrer tout
docker start sonarqube-db sonarqube
```

### SonarQube

```bash
# Analyse manuelle
sonar-scanner \
  -Dsonar.projectKey=smartsite-materials-service \
  -Dsonar.sources=src \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=[token]

# Avec couverture de tests
npm test -- --coverage
sonar-scanner \
  -Dsonar.projectKey=smartsite-materials-service \
  -Dsonar.sources=src \
  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=[token]
```

---

**Date**: 3 Mai 2026
**Auteur**: Ghada
**Statut**: ✅ GUIDE COMPLET - CREDENTIALS & SONARQUBE
