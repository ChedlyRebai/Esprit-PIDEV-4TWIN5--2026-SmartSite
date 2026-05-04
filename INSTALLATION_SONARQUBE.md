# Installation de SonarQube avec Docker Desktop

## 📋 Prérequis
- Docker Desktop installé et en cours d'exécution
- Au moins 2 Go de RAM disponible pour SonarQube
- Port 9000 disponible

## 🚀 Installation

### Étape 1 : Démarrer SonarQube

```bash
# Démarrer les conteneurs
docker-compose -f docker-compose-sonarqube.yml up -d

# Vérifier que les conteneurs sont en cours d'exécution
docker ps
```

### Étape 2 : Attendre le démarrage (2-3 minutes)

```bash
# Suivre les logs pour voir la progression
docker logs -f sonarqube
```

Attendez de voir le message : **"SonarQube is operational"**

### Étape 3 : Accéder à SonarQube

1. Ouvrez votre navigateur : http://localhost:9000
2. Connexion par défaut :
   - **Username** : `admin`
   - **Password** : `admin`
3. Vous serez invité à changer le mot de passe

## 🔧 Configuration initiale

### 1. Créer un token d'authentification

1. Allez dans **My Account** → **Security** → **Generate Tokens**
2. Nom du token : `jenkins` ou `local-analysis`
3. Type : **Global Analysis Token**
4. Copiez et sauvegardez le token généré

### 2. Créer un projet

1. Cliquez sur **Create Project** → **Manually**
2. Project key : `materials-service` (ou le nom de votre service)
3. Display name : `Materials Service`
4. Cliquez sur **Set Up**

### 3. Choisir la méthode d'analyse

- **Locally** : pour analyser depuis votre machine
- **With Jenkins** : pour l'intégration CI/CD

## 📊 Analyser un projet Node.js/NestJS

### Installation du scanner

```bash
# Installer le scanner SonarQube globalement
npm install -g sonarqube-scanner
```

### Configuration du projet

Créez un fichier `sonar-project.properties` à la racine de votre service :

```properties
sonar.projectKey=materials-service
sonar.projectName=Materials Service
sonar.projectVersion=1.0
sonar.sources=src
sonar.exclusions=**/node_modules/**,**/dist/**,**/test/**,**/*.spec.ts
sonar.tests=src
sonar.test.inclusions=**/*.spec.ts
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.host.url=http://localhost:9000
sonar.login=YOUR_TOKEN_HERE
```

### Lancer l'analyse

```bash
# Depuis le répertoire du service
cd apps/backend/materials-service

# Générer le coverage (optionnel mais recommandé)
npm run test:cov

# Lancer l'analyse SonarQube
sonar-scanner
```

## 🔄 Commandes utiles

```bash
# Arrêter SonarQube
docker-compose -f docker-compose-sonarqube.yml down

# Redémarrer SonarQube
docker-compose -f docker-compose-sonarqube.yml restart

# Voir les logs
docker logs sonarqube

# Supprimer complètement (données incluses)
docker-compose -f docker-compose-sonarqube.yml down -v
```

## 🎯 Intégration avec Jenkins

### 1. Configurer SonarQube dans Jenkins

1. **Jenkins** → **Manage Jenkins** → **Configure System**
2. Section **SonarQube servers** :
   - Name : `SonarQube`
   - Server URL : `http://sonarqube:9000` (si Jenkins est dans Docker)
   - Server authentication token : Ajoutez le token créé précédemment

### 2. Installer le plugin SonarQube Scanner

1. **Manage Jenkins** → **Manage Plugins**
2. Recherchez **SonarQube Scanner**
3. Installez et redémarrez Jenkins

### 3. Configurer le scanner

1. **Manage Jenkins** → **Global Tool Configuration**
2. Section **SonarQube Scanner** :
   - Name : `SonarQube Scanner`
   - Cochez **Install automatically**

### 4. Mettre à jour le Jenkinsfile

Le Jenkinsfile existant dans `apps/backend/materials-service/Jenkinsfile` contient déjà la configuration SonarQube :

```groovy
stage('SonarQube Analysis') {
    steps {
        script {
            def scannerHome = tool 'SonarQube Scanner'
            withSonarQubeEnv('SonarQube') {
                sh """
                    ${scannerHome}/bin/sonar-scanner \
                    -Dsonar.projectKey=materials-service \
                    -Dsonar.sources=src \
                    -Dsonar.host.url=http://sonarqube:9000
                """
            }
        }
    }
}
```

## 📈 Métriques importantes

SonarQube analyse :
- **Bugs** : Erreurs de code
- **Vulnerabilities** : Failles de sécurité
- **Code Smells** : Problèmes de maintenabilité
- **Coverage** : Couverture de tests
- **Duplications** : Code dupliqué
- **Security Hotspots** : Points sensibles de sécurité

## 🎨 Quality Gates

Configurez des seuils de qualité :
1. **Quality Gates** → **Create**
2. Définissez vos critères :
   - Coverage > 80%
   - Duplications < 3%
   - Maintainability Rating = A
   - Security Rating = A

## 🔍 Dépannage

### SonarQube ne démarre pas

```bash
# Vérifier les logs
docker logs sonarqube

# Augmenter la mémoire dans Docker Desktop
# Settings → Resources → Memory : 4 GB minimum
```

### Erreur "max virtual memory areas"

Sur Linux/WSL, exécutez :
```bash
sudo sysctl -w vm.max_map_count=262144
```

### Port 9000 déjà utilisé

Modifiez le port dans `docker-compose-sonarqube.yml` :
```yaml
ports:
  - "9001:9000"  # Utilisez 9001 au lieu de 9000
```

## 📚 Ressources

- [Documentation SonarQube](https://docs.sonarqube.org/latest/)
- [SonarQube pour JavaScript/TypeScript](https://docs.sonarqube.org/latest/analysis/languages/javascript/)
- [Intégration Jenkins](https://docs.sonarqube.org/latest/analysis/jenkins/)

## ✅ Checklist de vérification

- [ ] Docker Desktop est en cours d'exécution
- [ ] SonarQube est accessible sur http://localhost:9000
- [ ] Mot de passe admin changé
- [ ] Token d'authentification créé
- [ ] Projet créé dans SonarQube
- [ ] Fichier sonar-project.properties configuré
- [ ] Première analyse réussie
- [ ] Quality Gate configuré
