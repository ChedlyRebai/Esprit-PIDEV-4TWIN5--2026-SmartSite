# 🚀 Installation SonarQube 9.9.8 avec Docker Desktop

## 📋 Prérequis

✅ Docker Desktop installé et en cours d'exécution  
✅ Au moins 4 GB de RAM disponible  
✅ Windows avec WSL2 activé (pour Docker Desktop)

---

## 🎯 Méthode 1 : Installation Rapide (Recommandée)

### Étape 1 : Créer un docker-compose.yml

Créez un fichier `docker-compose-sonarqube.yml` :

```yaml
version: "3.8"

services:
  sonarqube:
    image: sonarqube:9.9.8-community
    container_name: sonarqube
    depends_on:
      - sonarqube-db
    environment:
      SONAR_JDBC_URL: jdbc:postgresql://sonarqube-db:5432/sonar
      SONAR_JDBC_USERNAME: sonar
      SONAR_JDBC_PASSWORD: sonar
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_extensions:/opt/sonarqube/extensions
      - sonarqube_logs:/opt/sonarqube/logs
    ports:
      - "9000:9000"
    networks:
      - sonarnet
    restart: unless-stopped

  sonarqube-db:
    image: postgres:15-alpine
    container_name: sonarqube-db
    environment:
      POSTGRES_USER: sonar
      POSTGRES_PASSWORD: sonar
      POSTGRES_DB: sonar
    volumes:
      - postgresql_data:/var/lib/postgresql/data
    networks:
      - sonarnet
    restart: unless-stopped

volumes:
  sonarqube_data:
  sonarqube_extensions:
  sonarqube_logs:
  postgresql_data:

networks:
  sonarnet:
    driver: bridge
```

### Étape 2 : Démarrer SonarQube

Ouvrez PowerShell ou CMD dans le dossier contenant le fichier :

```powershell
docker-compose -f docker-compose-sonarqube.yml up -d
```

### Étape 3 : Vérifier l'installation

```powershell
# Vérifier que les conteneurs sont en cours d'exécution
docker ps

# Voir les logs de SonarQube
docker logs -f sonarqube
```

### Étape 4 : Accéder à SonarQube

1. Attendez 2-3 minutes que SonarQube démarre complètement
2. Ouvrez votre navigateur : **http://localhost:9000**
3. Login par défaut :
   - **Username**: `admin`
   - **Password**: `admin`
4. ⚠️ Changez le mot de passe lors de la première connexion

---

## 🎯 Méthode 2 : Installation Simple (Sans PostgreSQL)

Si vous voulez une installation plus simple sans base de données externe :

```powershell
docker run -d \
  --name sonarqube \
  -p 9000:9000 \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  -v sonarqube_logs:/opt/sonarqube/logs \
  sonarqube:9.9.8-community
```

⚠️ **Note**: Cette méthode utilise H2 (base de données embarquée) - **NON recommandée pour la production**.

---

## 🔧 Configuration Post-Installation

### 1. Créer un Token pour Jenkins

1. Connectez-vous à SonarQube : http://localhost:9000
2. Cliquez sur votre avatar (en haut à droite) → **My Account**
3. Allez dans l'onglet **Security**
4. Dans **Generate Tokens** :
   - **Name**: `jenkins-materials-service`
   - **Type**: `Global Analysis Token`
   - **Expires in**: `No expiration` (ou selon vos besoins)
5. Cliquez sur **Generate**
6. **⚠️ COPIEZ LE TOKEN** (vous ne pourrez plus le voir après)

### 2. Créer le Projet dans SonarQube

**Option A : Création Manuelle**
1. Cliquez sur **Create Project** (ou **+** en haut à droite)
2. **Project key**: `smartsite-materials-service`
3. **Display name**: `SmartSite - Materials Service`
4. Cliquez sur **Set Up**

**Option B : Création Automatique**
Le projet sera créé automatiquement lors de la première analyse depuis Jenkins.

### 3. Configurer les Quality Gates (Optionnel)

1. Allez dans **Quality Gates**
2. Sélectionnez **Sonar way** (par défaut)
3. Ou créez votre propre Quality Gate personnalisé

---

## 🛠️ Commandes Utiles

### Arrêter SonarQube
```powershell
docker-compose -f docker-compose-sonarqube.yml stop
```

### Démarrer SonarQube
```powershell
docker-compose -f docker-compose-sonarqube.yml start
```

### Redémarrer SonarQube
```powershell
docker-compose -f docker-compose-sonarqube.yml restart
```

### Voir les logs
```powershell
docker logs -f sonarqube
```

### Arrêter et supprimer (⚠️ Attention : supprime les données)
```powershell
docker-compose -f docker-compose-sonarqube.yml down -v
```

### Mettre à jour SonarQube
```powershell
docker-compose -f docker-compose-sonarqube.yml pull
docker-compose -f docker-compose-sonarqube.yml up -d
```

---

## 🔍 Vérification de l'Installation

### 1. Vérifier que SonarQube est accessible
```powershell
curl http://localhost:9000/api/system/status
```

Réponse attendue :
```json
{"status":"UP"}
```

### 2. Vérifier la version
```powershell
curl http://localhost:9000/api/server/version
```

Réponse attendue :
```
9.9.8
```

---

## 🐛 Dépannage

### Problème : SonarQube ne démarre pas

**Solution 1 : Augmenter la mémoire Docker**
1. Docker Desktop → Settings → Resources
2. Augmentez la RAM à au moins **4 GB**
3. Cliquez sur **Apply & Restart**

**Solution 2 : Vérifier les logs**
```powershell
docker logs sonarqube
```

### Problème : "max virtual memory areas vm.max_map_count [65530] is too low"

**Sur Windows avec WSL2** :
```powershell
# Ouvrir WSL
wsl

# Exécuter cette commande
sudo sysctl -w vm.max_map_count=262144

# Pour rendre permanent
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

### Problème : Port 9000 déjà utilisé

**Changer le port** dans docker-compose.yml :
```yaml
ports:
  - "9001:9000"  # Utiliser 9001 au lieu de 9000
```

---

## 📊 Configuration dans Jenkins

Une fois SonarQube installé, configurez Jenkins :

### 1. Installer le plugin SonarQube Scanner dans Jenkins
1. Jenkins → Manage Jenkins → Plugins
2. Recherchez "SonarQube Scanner"
3. Installez et redémarrez Jenkins

### 2. Configurer le serveur SonarQube
1. Jenkins → Manage Jenkins → Configure System
2. Section **SonarQube servers** :
   - **Name**: `SonarQube`
   - **Server URL**: `http://localhost:9000` (ou `http://host.docker.internal:9000` si Jenkins est dans Docker)
   - **Server authentication token**: Sélectionnez le credential créé avec le token

### 3. Configurer SonarScanner
1. Jenkins → Manage Jenkins → Global Tool Configuration
2. Section **SonarQube Scanner** :
   - **Name**: `SonarScanner`
   - Cochez **Install automatically**
   - Sélectionnez la dernière version

---

## ✅ Checklist d'Installation

- [ ] Docker Desktop installé et en cours d'exécution
- [ ] Fichier docker-compose-sonarqube.yml créé
- [ ] SonarQube démarré avec `docker-compose up -d`
- [ ] SonarQube accessible sur http://localhost:9000
- [ ] Mot de passe admin changé
- [ ] Token Jenkins créé
- [ ] Projet `smartsite-materials-service` créé (ou sera créé automatiquement)
- [ ] Plugin SonarQube Scanner installé dans Jenkins
- [ ] Serveur SonarQube configuré dans Jenkins
- [ ] SonarScanner configuré dans Jenkins
- [ ] Credential du token ajouté dans Jenkins

---

## 📚 Ressources

- **Documentation SonarQube**: https://docs.sonarqube.org/9.9/
- **Docker Hub**: https://hub.docker.com/_/sonarqube
- **SonarQube Community**: https://community.sonarsource.com/

---

## 🎉 Prochaines Étapes

1. ✅ SonarQube installé et accessible
2. 🔄 Configurer Jenkins pour utiliser SonarQube
3. 🚀 Lancer votre premier pipeline CI avec analyse SonarQube
4. 📊 Consulter les résultats d'analyse sur http://localhost:9000

---

**Besoin d'aide ?** Consultez les logs avec `docker logs -f sonarqube`
