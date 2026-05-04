# 🚀 DOCUMENTATION DEVOPS - MATERIALS SERVICE

## 📋 TABLE DES MATIÈRES

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture DevOps](#architecture-devops)
3. [Fichiers DevOps](#fichiers-devops)
4. [Pipeline CI/CD](#pipeline-cicd)
5. [Docker](#docker)
6. [Jenkins](#jenkins)
7. [SonarQube](#sonarqube)
8. [Déploiement](#déploiement)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)

---

## 📖 VUE D'ENSEMBLE

### Qu'est-ce que DevOps?

**DevOps** = **Dev**elopment + **Op**erations

C'est une approche qui combine:
- **Développement** (écrire du code)
- **Opérations** (déployer et maintenir le code en production)

### Objectifs DevOps

✅ **Automatisation**: Déploiement automatique sans intervention manuelle
✅ **Qualité**: Tests automatiques et analyse de code
✅ **Rapidité**: Déploiement rapide et fréquent
✅ **Fiabilité**: Déploiements reproductibles et sans erreur
✅ **Monitoring**: Surveillance continue de l'application

---

## 🏗️ ARCHITECTURE DEVOPS

### Flux Complet

```
┌─────────────┐
│   GitHub    │  1. Push du code
│  (Source)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Jenkins   │  2. Détection automatique du push
│  (CI/CD)    │
└──────┬──────┘
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
┌─────────────┐                    ┌─────────────┐
│  Pipeline   │                    │  Pipeline   │
│     CI      │                    │     CD      │
│ (Intégration)│                   │(Déploiement)│
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       ├─► Tests                          ├─► Docker Build
       ├─► Build                          ├─► Docker Push
       ├─► SonarQube                      ├─► Deploy
       └─► Quality Gate                   └─► Health Check
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │ Production  │
                                          │   Server    │
                                          └─────────────┘
```

### Composants

| Composant | Rôle | Technologie |
|-----------|------|-------------|
| **GitHub** | Hébergement du code source | Git |
| **Jenkins** | Orchestration CI/CD | Jenkins Pipeline |
| **Docker** | Conteneurisation | Docker |
| **Docker Hub** | Registre d'images | Docker Registry |
| **SonarQube** | Analyse de qualité de code | SonarQube |
| **Node.js** | Runtime de l'application | Node.js 20 |
| **MongoDB** | Base de données | MongoDB Atlas |

---

## 📁 FICHIERS DEVOPS

### 1. Dockerfile

**Emplacement**: `apps/backend/materials-service/Dockerfile`

**Rôle**: Définit comment construire l'image Docker du service

**Structure**:
```dockerfile
# Stage 1: Build (compilation TypeScript)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production (image légère)
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3009
CMD ["node", "dist/src/main"]
```

**Avantages du Multi-Stage Build**:
- ✅ Image finale plus légère (pas de devDependencies)
- ✅ Séparation build/production
- ✅ Meilleure sécurité (moins de packages)

### 2. .dockerignore

**Emplacement**: `apps/backend/materials-service/.dockerignore`

**Rôle**: Exclure les fichiers inutiles du contexte Docker

**Contenu principal**:
```
node_modules    # Réinstallés dans le conteneur
dist            # Régénéré lors du build
.env            # Secrets (ne jamais inclure!)
*.spec.ts       # Tests (inutiles en production)
*.md            # Documentation
```

**Avantages**:
- ✅ Build Docker plus rapide
- ✅ Image plus petite
- ✅ Pas de secrets dans l'image

### 3. Jenkinsfile (CI)

**Emplacement**: `apps/backend/materials-service/Jenkinsfile`

**Rôle**: Pipeline d'Intégration Continue

**Étapes**:
1. **Checkout**: Récupérer le code depuis GitHub
2. **Install**: Installer les dépendances (`npm ci`)
3. **Test**: Exécuter les tests unitaires avec couverture
4. **Build**: Compiler TypeScript → JavaScript
5. **SonarQube**: Analyser la qualité du code
6. **Quality Gate**: Vérifier les seuils de qualité
7. **Trigger CD**: Déclencher le déploiement

**Exemple**:
```groovy
stage('Unit Tests') {
    steps {
        sh 'npm test -- --coverage --coverageReporters=lcov'
        echo "✅ Tests unitaires terminés"
    }
}
```

### 4. Jenkinsfile-CD (CD)

**Emplacement**: `apps/backend/materials-service/Jenkinsfile-CD`

**Rôle**: Pipeline de Déploiement Continu

**Étapes**:
1. **Checkout**: Récupérer le code
2. **Docker Build**: Construire l'image Docker
3. **Docker Push**: Pousser l'image sur Docker Hub
4. **Deploy**: Déployer le conteneur
5. **Health Check**: Vérifier que le service fonctionne

**Exemple**:
```groovy
stage('Docker Build') {
    steps {
        sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} ."
        echo "✅ Image Docker construite"
    }
}
```

### 5. sonar-project.properties

**Emplacement**: `apps/backend/materials-service/sonar-project.properties`

**Rôle**: Configuration SonarQube

**Contenu**:
```properties
sonar.projectKey=smartsite-materials-service
sonar.projectName=SmartSite - Materials Service
sonar.sources=src
sonar.exclusions=**/*.spec.ts,**/node_modules/**
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

---

## 🔄 PIPELINE CI/CD

### Pipeline CI (Intégration Continue)

**Déclenchement**: Automatique à chaque push sur GitHub

**Durée**: ~5-10 minutes

**Étapes détaillées**:

#### 1. Checkout (10s)
```bash
git clone https://github.com/votre-repo/smartsite-platform.git
cd apps/backend/materials-service
```

#### 2. Install Dependencies (30s)
```bash
npm ci  # Installation propre (plus rapide que npm install)
```

#### 3. Unit Tests (2-3 min)
```bash
npm test -- --coverage --coverageReporters=lcov --forceExit
```
**Génère**: `coverage/lcov.info` (rapport de couverture)

#### 4. Build (1-2 min)
```bash
npm run build  # TypeScript → JavaScript dans dist/
```

#### 5. SonarQube Analysis (1-2 min)
```bash
sonar-scanner \
  -Dsonar.projectKey=smartsite-materials-service \
  -Dsonar.sources=src \
  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
```
**Analyse**:
- Bugs
- Vulnérabilités
- Code smells
- Couverture de code
- Duplication

#### 6. Quality Gate (30s)
```
Vérification des seuils:
- Couverture > 80%
- Bugs = 0
- Vulnérabilités = 0
- Code smells < 10
```

#### 7. Trigger CD (5s)
```groovy
build job: 'materials-service-CD', wait: false
```

### Pipeline CD (Déploiement Continu)

**Déclenchement**: Automatique après succès du CI

**Durée**: ~3-5 minutes

**Étapes détaillées**:

#### 1. Checkout (10s)
Récupérer le code source

#### 2. Docker Build (2-3 min)
```bash
docker build --no-cache \
  -t asmaamh/smartsite-materials-service:42 \
  -t asmaamh/smartsite-materials-service:latest \
  .
```
**Génère**: 2 images Docker
- Tag avec numéro de build (ex: `:42`)
- Tag `latest`

#### 3. Docker Push (1 min)
```bash
docker login -u asmaamh
docker push asmaamh/smartsite-materials-service:42
docker push asmaamh/smartsite-materials-service:latest
```
**Destination**: Docker Hub

#### 4. Deploy (30s)
```bash
# Arrêter l'ancien conteneur
docker stop materials-service
docker rm materials-service

# Démarrer le nouveau conteneur
docker run -d \
  --name materials-service \
  --restart unless-stopped \
  -p 3009:3009 \
  -e PORT=3009 \
  -e NODE_ENV=production \
  -e MONGODB_URI="mongodb+srv://..." \
  -e ML_PREDICTION_SERVICE_URL="http://localhost:8000" \
  -v /var/smartsite/materials/uploads:/app/uploads \
  -v /var/smartsite/materials/exports:/app/exports \
  asmaamh/smartsite-materials-service:latest
```

#### 5. Health Check (10s)
```bash
curl http://localhost:3009/api/materials/health
# Réponse attendue: 200 OK
```

---

## 🐳 DOCKER

### Qu'est-ce que Docker?

**Docker** permet de **conteneuriser** une application:
- Empaqueter l'application + ses dépendances
- Exécuter dans un environnement isolé
- Garantir que ça fonctionne partout (dev, test, prod)

### Commandes Docker Utiles

#### Build
```bash
# Construire l'image
docker build -t materials-service .

# Construire sans cache
docker build --no-cache -t materials-service .
```

#### Run
```bash
# Démarrer le conteneur
docker run -d \
  --name materials-service \
  -p 3009:3009 \
  -e MONGODB_URI="mongodb://..." \
  materials-service

# Voir les logs
docker logs materials-service

# Voir les logs en temps réel
docker logs -f materials-service
```

#### Manage
```bash
# Lister les conteneurs
docker ps

# Arrêter un conteneur
docker stop materials-service

# Supprimer un conteneur
docker rm materials-service

# Lister les images
docker images

# Supprimer une image
docker rmi materials-service
```

#### Debug
```bash
# Entrer dans le conteneur
docker exec -it materials-service sh

# Voir les ressources utilisées
docker stats materials-service
```

### Volumes Docker

**Pourquoi?** Persister les données entre les redémarrages

```bash
docker run -d \
  -v /var/smartsite/materials/uploads:/app/uploads \
  -v /var/smartsite/materials/exports:/app/exports \
  materials-service
```

**Mapping**:
- `/var/smartsite/materials/uploads` (hôte) → `/app/uploads` (conteneur)
- `/var/smartsite/materials/exports` (hôte) → `/app/exports` (conteneur)

---

## 🔧 JENKINS

### Configuration Jenkins

#### 1. Créer un Job CI

1. Aller dans Jenkins: `http://jenkins-server:8080`
2. Cliquer sur "New Item"
3. Nom: `materials-service-CI`
4. Type: "Pipeline"
5. Configuration:
   - **Pipeline**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/votre-repo/smartsite-platform.git`
   - **Script Path**: `apps/backend/materials-service/Jenkinsfile`
   - **Branch**: `*/main`

#### 2. Créer un Job CD

1. Cliquer sur "New Item"
2. Nom: `materials-service-CD`
3. Type: "Pipeline"
4. Configuration:
   - **Pipeline**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/votre-repo/smartsite-platform.git`
   - **Script Path**: `apps/backend/materials-service/Jenkinsfile-CD`
   - **Branch**: `*/main`

#### 3. Configurer les Credentials

**Docker Hub**:
1. Jenkins → Manage Jenkins → Manage Credentials
2. Add Credentials:
   - **Kind**: Username with password
   - **ID**: `docker-hub-credentials`
   - **Username**: `asmaamh`
   - **Password**: `[votre-token-docker-hub]`

**MongoDB**:
1. Add Credentials:
   - **Kind**: Secret text
   - **ID**: `mongodb-uri`
   - **Secret**: `mongodb+srv://user:pass@cluster.mongodb.net/smartsite-materials`

**ML Service**:
1. Add Credentials:
   - **Kind**: Secret text
   - **ID**: `ml-service-url`
   - **Secret**: `http://localhost:8000`

#### 4. Configurer les Webhooks GitHub

1. GitHub → Repository → Settings → Webhooks
2. Add webhook:
   - **Payload URL**: `http://jenkins-server:8080/github-webhook/`
   - **Content type**: `application/json`
   - **Events**: Just the push event

---

## 📊 SONARQUBE

### Qu'est-ce que SonarQube?

**SonarQube** analyse la qualité du code:
- **Bugs**: Erreurs potentielles
- **Vulnérabilités**: Failles de sécurité
- **Code Smells**: Mauvaises pratiques
- **Couverture**: % de code testé
- **Duplication**: Code dupliqué

### Métriques Analysées

| Métrique | Seuil | Description |
|----------|-------|-------------|
| **Bugs** | 0 | Erreurs qui causent des dysfonctionnements |
| **Vulnerabilities** | 0 | Failles de sécurité |
| **Code Smells** | < 10 | Mauvaises pratiques |
| **Coverage** | > 80% | Couverture de tests |
| **Duplications** | < 3% | Code dupliqué |

### Accéder à SonarQube

1. URL: `http://sonarqube-server:9000`
2. Login: `admin` / `admin`
3. Projet: `smartsite-materials-service`

### Interpréter les Résultats

**Quality Gate: PASSED** ✅
- Tous les seuils sont respectés
- Code de bonne qualité

**Quality Gate: FAILED** ❌
- Un ou plusieurs seuils non respectés
- Corriger avant de merger

---

## 🚀 DÉPLOIEMENT

### Environnements

| Environnement | URL | Déploiement |
|---------------|-----|-------------|
| **Development** | `http://localhost:3009` | Manuel |
| **Staging** | `http://staging.smartsite.com:3009` | Automatique (branche `develop`) |
| **Production** | `http://api.smartsite.com:3009` | Automatique (branche `main`) |

### Déploiement Manuel

#### 1. Build Local
```bash
cd apps/backend/materials-service
npm ci
npm run build
```

#### 2. Build Docker
```bash
docker build -t materials-service .
```

#### 3. Run Docker
```bash
docker run -d \
  --name materials-service \
  -p 3009:3009 \
  -e MONGODB_URI="mongodb://..." \
  materials-service
```

### Déploiement Automatique

**Déclenchement**: Push sur `main`

**Flux**:
```
Push → GitHub → Jenkins CI → Tests → Build → SonarQube → Jenkins CD → Docker → Production
```

### Rollback (Retour Arrière)

Si le déploiement échoue:

```bash
# Arrêter le nouveau conteneur
docker stop materials-service
docker rm materials-service

# Redémarrer l'ancien conteneur (avec tag précédent)
docker run -d \
  --name materials-service \
  -p 3009:3009 \
  asmaamh/smartsite-materials-service:41  # Build précédent
```

---

## 📈 MONITORING

### Logs

#### Logs Docker
```bash
# Voir les logs
docker logs materials-service

# Suivre les logs en temps réel
docker logs -f materials-service

# Dernières 100 lignes
docker logs --tail 100 materials-service
```

#### Logs Application
```bash
# Entrer dans le conteneur
docker exec -it materials-service sh

# Voir les logs NestJS
cat /app/logs/application.log
```

### Health Check

```bash
# Vérifier que le service répond
curl http://localhost:3009/api/materials/health

# Réponse attendue
{
  "status": "ok",
  "timestamp": "2026-05-03T10:30:00.000Z",
  "uptime": 3600
}
```

### Métriques

```bash
# Ressources utilisées
docker stats materials-service

# Résultat
CONTAINER ID   NAME                CPU %   MEM USAGE / LIMIT   MEM %
abc123         materials-service   2.5%    150MiB / 2GiB       7.5%
```

---

## 🐛 TROUBLESHOOTING

### Problème 1: Build Docker Échoue

**Erreur**:
```
npm ERR! code ELIFECYCLE
npm ERR! errno 1
```

**Solution**:
```bash
# Vérifier les dépendances
npm ci

# Build local pour voir l'erreur
npm run build

# Nettoyer le cache Docker
docker system prune -a
```

### Problème 2: Conteneur Ne Démarre Pas

**Erreur**:
```
docker: Error response from daemon: Conflict. The container name "/materials-service" is already in use
```

**Solution**:
```bash
# Arrêter et supprimer l'ancien conteneur
docker stop materials-service
docker rm materials-service

# Redémarrer
docker run -d --name materials-service ...
```

### Problème 3: Service Inaccessible

**Erreur**:
```
curl: (7) Failed to connect to localhost port 3009
```

**Solution**:
```bash
# Vérifier que le conteneur tourne
docker ps | grep materials-service

# Vérifier les logs
docker logs materials-service

# Vérifier le port
netstat -an | grep 3009
```

### Problème 4: Tests Échouent dans Jenkins

**Erreur**:
```
FAIL src/materials/materials.service.spec.ts
```

**Solution**:
```bash
# Exécuter les tests localement
npm test

# Voir les détails
npm test -- --verbose

# Corriger les tests qui échouent
```

### Problème 5: Quality Gate Échoue

**Erreur**:
```
Quality Gate failed: Coverage is 65% (threshold: 80%)
```

**Solution**:
```bash
# Ajouter plus de tests
npm test -- --coverage

# Voir le rapport de couverture
open coverage/lcov-report/index.html

# Écrire des tests pour les fichiers non couverts
```

---

## 📚 RESSOURCES

### Documentation

- **Docker**: https://docs.docker.com/
- **Jenkins**: https://www.jenkins.io/doc/
- **SonarQube**: https://docs.sonarqube.org/
- **NestJS**: https://docs.nestjs.com/

### Commandes Utiles

```bash
# Docker
docker ps                    # Lister les conteneurs
docker images                # Lister les images
docker logs <container>      # Voir les logs
docker exec -it <container> sh  # Entrer dans le conteneur

# Jenkins
# Accès: http://jenkins-server:8080

# SonarQube
# Accès: http://sonarqube-server:9000

# Git
git status                   # Voir les changements
git add .                    # Ajouter tous les fichiers
git commit -m "message"      # Commit
git push                     # Push (déclenche CI/CD)
```

---

## ✅ CHECKLIST DEVOPS

### Configuration Initiale

- [ ] Dockerfile créé
- [ ] .dockerignore créé
- [ ] Jenkinsfile (CI) créé
- [ ] Jenkinsfile-CD créé
- [ ] sonar-project.properties créé
- [ ] Credentials Jenkins configurés
- [ ] Webhooks GitHub configurés
- [ ] Jobs Jenkins créés

### Tests

- [ ] Build Docker local réussit
- [ ] Tests unitaires passent
- [ ] Build NestJS réussit
- [ ] SonarQube analyse le code
- [ ] Quality Gate passe

### Déploiement

- [ ] Image Docker sur Docker Hub
- [ ] Conteneur démarre correctement
- [ ] Service accessible sur le port 3009
- [ ] Health check répond
- [ ] Logs visibles

---

**Date**: 3 Mai 2026
**Version**: 1.0.0
**Auteur**: Équipe DevOps SmartSite
**Statut**: ✅ DOCUMENTATION COMPLÈTE
