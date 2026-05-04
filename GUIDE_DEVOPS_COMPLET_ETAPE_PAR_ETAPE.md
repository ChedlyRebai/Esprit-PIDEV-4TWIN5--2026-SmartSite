# 🚀 GUIDE DEVOPS COMPLET - MATERIALS SERVICE
## Guide Étape par Étape pour Répondre aux Exigences du Projet

---

## 📋 EXIGENCES DU PROJET

### ✅ Ce qui est DÉJÀ FAIT pour Materials-Service
- [x] Dockerfile (Backend)
- [x] .dockerignore
- [x] Jenkinsfile CI (Backend)
- [x] Jenkinsfile-CD (Backend)
- [x] Configuration SonarQube
- [x] Tests unitaires (à vérifier/compléter)

### ⚠️ Ce qui RESTE À FAIRE
- [ ] Pipeline CI Frontend
- [ ] Pipeline CD Frontend
- [ ] Compléter les tests unitaires (votre module)
- [ ] Captures SonarQube (avant/après)
- [ ] Configuration Kubernetes
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Alert Manager
- [ ] Partie Excellence (optionnel)

---

## 🎯 PLAN D'ACTION - ÉTAPE PAR ÉTAPE

### PHASE 1: VÉRIFICATION ET TESTS (1-2h)
1. Vérifier les tests unitaires existants
2. Ajouter vos tests pour votre module
3. Tester localement

### PHASE 2: PIPELINES CI/CD (2-3h)
4. Configurer Jenkins
5. Tester Pipeline CI Backend
6. Tester Pipeline CD Backend
7. Créer Pipeline CI Frontend
8. Créer Pipeline CD Frontend

### PHASE 3: SONARQUBE (1h)
9. Capturer l'état AVANT
10. Refactoring du code
11. Capturer l'état APRÈS

### PHASE 4: KUBERNETES (3-4h)
12. Installer kubeadm
13. Créer les fichiers de déploiement
14. Déployer sur Kubernetes

### PHASE 5: MONITORING (2-3h)
15. Installer Prometheus
16. Installer Grafana
17. Configurer Alert Manager

### PHASE 6: EXCELLENCE (optionnel, 1-2h)
18. Ajouter des outils avancés

---

# 📖 GUIDE DÉTAILLÉ

---

## PHASE 1: VÉRIFICATION ET TESTS UNITAIRES

### ÉTAPE 1: Vérifier les Tests Existants

#### 1.1 Lister les fichiers de tests

```bash
cd apps/backend/materials-service
find src -name "*.spec.ts"
```

**Résultat attendu**: Liste des fichiers de tests existants

#### 1.2 Exécuter les tests

```bash
npm test
```

**Résultat attendu**: Tous les tests passent

#### 1.3 Vérifier la couverture

```bash
npm test -- --coverage
```

**Résultat attendu**: Rapport de couverture généré dans `coverage/`

---

### ÉTAPE 2: Ajouter VOS Tests pour VOTRE Module

**Question**: Quel est VOTRE module/ticket dans le projet?
- Materials CRUD?
- Stock Management?
- Flow Logs?
- ML Predictions?
- QR Code?
- Autre?

#### Exemple: Tests pour Materials CRUD

**Fichier**: `src/materials/materials.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MaterialsService } from './materials.service';
import { getModelToken } from '@nestjs/mongoose';
import { Material } from './entities/material.entity';

describe('MaterialsService', () => {
  let service: MaterialsService;
  let mockMaterialModel: any;

  beforeEach(async () => {
    // Mock du modèle Material
    mockMaterialModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialsService,
        {
          provide: getModelToken(Material.name),
          useValue: mockMaterialModel,
        },
      ],
    }).compile();

    service = module.get<MaterialsService>(MaterialsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of materials', async () => {
      const mockMaterials = [
        { _id: '1', name: 'Ciment', quantity: 100 },
        { _id: '2', name: 'Sable', quantity: 200 },
      ];

      mockMaterialModel.find.mockReturnValue({
        exec: jest.fn().resolveValue(mockMaterials),
      });

      const result = await service.findAll();
      expect(result).toEqual(mockMaterials);
      expect(mockMaterialModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single material', async () => {
      const mockMaterial = { _id: '1', name: 'Ciment', quantity: 100 };

      mockMaterialModel.findById.mockReturnValue({
        exec: jest.fn().resolveValue(mockMaterial),
      });

      const result = await service.findOne('1');
      expect(result).toEqual(mockMaterial);
      expect(mockMaterialModel.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    it('should create a new material', async () => {
      const createDto = { name: 'Ciment', quantity: 100 };
      const mockMaterial = { _id: '1', ...createDto };

      mockMaterialModel.create.mockResolvedValue(mockMaterial);

      const result = await service.create(createDto);
      expect(result).toEqual(mockMaterial);
      expect(mockMaterialModel.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update a material', async () => {
      const updateDto = { quantity: 150 };
      const mockMaterial = { _id: '1', name: 'Ciment', quantity: 150 };

      mockMaterialModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().resolveValue(mockMaterial),
      });

      const result = await service.update('1', updateDto);
      expect(result).toEqual(mockMaterial);
      expect(mockMaterialModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        updateDto,
        { new: true },
      );
    });
  });

  describe('delete', () => {
    it('should delete a material', async () => {
      const mockMaterial = { _id: '1', name: 'Ciment', quantity: 100 };

      mockMaterialModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().resolveValue(mockMaterial),
      });

      const result = await service.remove('1');
      expect(result).toEqual(mockMaterial);
      expect(mockMaterialModel.findByIdAndDelete).toHaveBeenCalledWith('1');
    });
  });
});
```

#### 2.1 Créer/Compléter vos tests

```bash
# Créer un fichier de test si nécessaire
touch src/materials/materials.service.spec.ts
```

#### 2.2 Exécuter VOS tests

```bash
npm test -- materials.service.spec.ts
```

#### 2.3 Vérifier la couverture de VOTRE module

```bash
npm test -- --coverage --collectCoverageFrom="src/materials/**/*.ts"
```

**Objectif**: Atteindre au moins 70% de couverture pour votre module

---

### ÉTAPE 3: Tester Localement

#### 3.1 Build

```bash
npm run build
```

**Résultat attendu**: Build réussit sans erreur

#### 3.2 Tests complets

```bash
npm test -- --coverage --forceExit
```

**Résultat attendu**: Tous les tests passent

---

## PHASE 2: PIPELINES CI/CD

### ÉTAPE 4: Configurer Jenkins

#### 4.1 Installer Jenkins (si pas déjà fait)

**Option 1: Docker (Recommandé)**

```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts
```

**Option 2: Installation locale**
- Télécharger depuis: https://www.jenkins.io/download/
- Installer et démarrer

#### 4.2 Accéder à Jenkins

```
http://localhost:8080
```

#### 4.3 Récupérer le mot de passe initial

```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

#### 4.4 Installer les plugins nécessaires

1. Aller dans: **Manage Jenkins** → **Manage Plugins**
2. Installer:
   - ✅ Git Plugin
   - ✅ Pipeline Plugin
   - ✅ Docker Pipeline Plugin
   - ✅ NodeJS Plugin
   - ✅ SonarQube Scanner Plugin

#### 4.5 Configurer NodeJS

1. **Manage Jenkins** → **Global Tool Configuration**
2. **NodeJS** → **Add NodeJS**
   - Name: `NodeJS-20`
   - Version: `NodeJS 20.x`
   - ✅ Install automatically

#### 4.6 Configurer SonarQube Scanner

1. **Manage Jenkins** → **Global Tool Configuration**
2. **SonarQube Scanner** → **Add SonarQube Scanner**
   - Name: `SonarScanner`
   - ✅ Install automatically

---

### ÉTAPE 5: Créer Pipeline CI Backend

#### 5.1 Créer un nouveau Job

1. Jenkins → **New Item**
2. Nom: `materials-service-CI`
3. Type: **Pipeline**
4. OK

#### 5.2 Configurer le Job

**General**:
- Description: `Pipeline CI pour Materials Service`

**Build Triggers**:
- ✅ GitHub hook trigger for GITScm polling

**Pipeline**:
- Definition: **Pipeline script from SCM**
- SCM: **Git**
- Repository URL: `https://github.com/votre-repo/smartsite-platform.git`
- Branch: `*/main`
- Script Path: `apps/backend/materials-service/Jenkinsfile`

#### 5.3 Sauvegarder

---

### ÉTAPE 6: Tester Pipeline CI Backend

#### 6.1 Lancer manuellement

1. Aller dans le job `materials-service-CI`
2. Cliquer sur **Build Now**

#### 6.2 Vérifier les logs

1. Cliquer sur le build (#1)
2. **Console Output**

**Résultat attendu**:
```
✅ Code récupéré depuis GitHub
✅ Dépendances installées
✅ Tests unitaires terminés
✅ Build terminé
✅ SonarQube Analysis
✅ Quality Gate
✅ Pipeline CD déclenché
```

#### 6.3 Capturer les résultats

**Prendre des captures d'écran**:
- Vue d'ensemble du pipeline
- Console output
- Résultats des tests
- SonarQube analysis

---

### ÉTAPE 7: Créer Pipeline CD Backend

#### 7.1 Configurer Docker Hub Credentials

1. **Manage Jenkins** → **Manage Credentials**
2. **Global** → **Add Credentials**
   - Kind: **Username with password**
   - Username: `ghada`
   - Password: `[votre-token-docker-hub]`
   - ID: `docker-hub-credentials`

#### 7.2 Configurer MongoDB URI

1. **Add Credentials**
   - Kind: **Secret text**
   - Secret: `mongodb+srv://user:pass@cluster.mongodb.net/smartsite-materials`
   - ID: `mongodb-uri`

#### 7.3 Créer le Job CD

1. Jenkins → **New Item**
2. Nom: `materials-service-CD`
3. Type: **Pipeline**
4. Configuration similaire au CI
5. Script Path: `apps/backend/materials-service/Jenkinsfile-CD`

---

### ÉTAPE 8: Créer Pipeline CI Frontend

**Fichier**: `apps/frontend/Jenkinsfile`

```groovy
pipeline {
    agent any

    environment {
        SERVICE_NAME  = 'frontend'
        SERVICE_DIR   = 'apps/frontend'
        SONAR_PROJECT = 'smartsite-frontend'
    }

    tools {
        nodejs 'NodeJS-20'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "✅ Code récupéré depuis GitHub"
            }
        }

        stage('Install Dependencies') {
            steps {
                dir("${SERVICE_DIR}") {
                    sh 'npm ci'
                    echo "✅ Dépendances installées"
                }
            }
        }

        stage('Unit Tests') {
            steps {
                dir("${SERVICE_DIR}") {
                    sh 'npm test -- --coverage --watchAll=false'
                    echo "✅ Tests unitaires terminés"
                }
            }
        }

        stage('Build') {
            steps {
                dir("${SERVICE_DIR}") {
                    sh 'npm run build'
                    echo "✅ Build terminé"
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                dir("${SERVICE_DIR}") {
                    withSonarQubeEnv('SonarQube') {
                        withEnv(["PATH+SONAR=${tool 'SonarScanner'}/bin"]) {
                            sh """
                                sonar-scanner \
                                    -Dsonar.projectKey=${SONAR_PROJECT} \
                                    -Dsonar.projectName='SmartSite - Frontend' \
                                    -Dsonar.sources=src \
                                    -Dsonar.exclusions=**/*.spec.ts,**/*.test.ts,**/node_modules/**,**/build/** \
                                    -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                            """
                        }
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }

        stage('Trigger CD') {
            steps {
                build job: 'frontend-CD', wait: false
                echo "🚀 Pipeline CD déclenché automatiquement"
            }
        }
    }

    post {
        success {
            echo "🎉 CI réussi pour ${SERVICE_NAME} — build #${BUILD_NUMBER}"
        }
        failure {
            echo "❌ CI échoué pour ${SERVICE_NAME} — build #${BUILD_NUMBER}"
        }
        always {
            cleanWs()
        }
    }
}
```

---

### ÉTAPE 9: Créer Pipeline CD Frontend

**Fichier**: `apps/frontend/Jenkinsfile-CD`

```groovy
pipeline {
    agent any

    environment {
        SERVICE_NAME  = 'frontend'
        SERVICE_DIR   = 'apps/frontend'
        DOCKER_IMAGE  = "ghada/smartsite-frontend"
        PORT          = '3000'
        DOCKER_HOST   = 'unix:///var/run/docker.sock'
    }

    tools {
        nodejs 'NodeJS-20'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "✅ Code récupéré depuis GitHub"
            }
        }

        stage('Docker Build') {
            steps {
                dir("${SERVICE_DIR}") {
                    sh "docker build --no-cache -t ${DOCKER_IMAGE}:${BUILD_NUMBER} -t ${DOCKER_IMAGE}:latest ."
                    echo "✅ Image Docker construite : ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                }
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-hub-credentials',
                    usernameVariable: 'DOCKER_USERNAME',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    sh """
                        echo "\$DOCKER_PASSWORD" | docker login -u "\$DOCKER_USERNAME" --password-stdin
                        docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}
                        docker push ${DOCKER_IMAGE}:latest
                    """
                    echo "✅ Image Docker poussée sur Docker Hub"
                }
            }
        }

        stage('Deploy') {
            steps {
                sh """
                    docker stop ${SERVICE_NAME} || true
                    docker rm ${SERVICE_NAME} || true
                    docker run -d \
                        --name ${SERVICE_NAME} \
                        --restart unless-stopped \
                        -p ${PORT}:${PORT} \
                        ${DOCKER_IMAGE}:latest
                """
                echo "✅ ${SERVICE_NAME} déployé sur le port ${PORT}"
            }
        }

        stage('Health Check') {
            steps {
                script {
                    sleep(time: 10, unit: 'SECONDS')
                    def response = sh(
                        script: "curl -s -o /dev/null -w '%{http_code}' http://localhost:${PORT} || echo '000'",
                        returnStdout: true
                    ).trim()
                    
                    if (response == '200') {
                        echo "✅ Health check réussi - Service opérationnel"
                    } else {
                        echo "⚠️ Health check échoué - Code HTTP: ${response}"
                    }
                }
            }
        }
    }

    post {
        success {
            echo "🎉 CD réussi — ${SERVICE_NAME} déployé (build #${BUILD_NUMBER})"
        }
        failure {
            echo "❌ CD échoué pour ${SERVICE_NAME} — build #${BUILD_NUMBER}"
            sh "docker start ${SERVICE_NAME} || true"
        }
        always {
            sh "docker image prune -f || true"
            cleanWs()
        }
    }
}
```

---

## ✅ RÉSUMÉ PHASE 2

**Ce que vous avez maintenant**:
- ✅ Pipeline CI Backend (materials-service)
- ✅ Pipeline CD Backend (materials-service)
- ✅ Pipeline CI Frontend
- ✅ Pipeline CD Frontend
- ✅ Déclenchement automatique CD après CI

**Total**: 4 pipelines comme demandé! 🎉

---

**SUITE DU GUIDE**: Phases 3, 4, 5, 6 dans les prochains fichiers...

---

**Date**: 3 Mai 2026
**Auteur**: Ghada
**Statut**: PHASE 1 & 2 - TESTS ET PIPELINES CI/CD
