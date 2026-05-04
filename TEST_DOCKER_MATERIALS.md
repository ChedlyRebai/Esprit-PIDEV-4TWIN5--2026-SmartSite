# 🐳 TEST DOCKER - MATERIALS SERVICE

## 🎯 OBJECTIF

Tester la configuration Docker du materials-service en local avant le déploiement Jenkins.

---

## ✅ PRÉREQUIS

- [x] Docker installé (`docker --version`)
- [x] Docker Desktop en cours d'exécution
- [x] Compte Docker Hub (ghada)
- [x] MongoDB URI disponible

---

## 🚀 ÉTAPE 1: BUILD DE L'IMAGE DOCKER

### Commande

```bash
cd apps/backend/materials-service
docker build -t ghada/smartsite-materials-service:test .
```

### Résultat Attendu

```
[+] Building 45.2s (17/17) FINISHED
 => [internal] load build definition from Dockerfile
 => => transferring dockerfile: 500B
 => [internal] load .dockerignore
 => => transferring context: 150B
 => [internal] load metadata for docker.io/library/node:20-alpine
 => [builder 1/6] FROM docker.io/library/node:20-alpine
 => [internal] load build context
 => => transferring context: 2.5MB
 => [builder 2/6] WORKDIR /app
 => [builder 3/6] COPY package.json package-lock.json ./
 => [builder 4/6] RUN npm ci
 => [builder 5/6] COPY . .
 => [builder 6/6] RUN npm run build
 => [production 1/4] WORKDIR /app
 => [production 2/4] COPY package.json package-lock.json ./
 => [production 3/4] RUN npm ci --only=production
 => [production 4/4] COPY --from=builder /app/dist ./dist
 => exporting to image
 => => exporting layers
 => => writing image sha256:abc123...
 => => naming to docker.io/ghada/smartsite-materials-service:test
```

### Vérification

```bash
docker images | grep materials-service
```

**Résultat**:
```
ghada/smartsite-materials-service   test    abc123    2 minutes ago   250MB
```

---

## 🏃 ÉTAPE 2: LANCER LE CONTENEUR

### Commande

```bash
docker run -d \
  --name materials-service-test \
  -p 3009:3009 \
  -e PORT=3009 \
  -e NODE_ENV=production \
  -e MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/smartsite-materials" \
  -e ML_PREDICTION_SERVICE_URL="http://host.docker.internal:8000" \
  ghada/smartsite-materials-service:test
```

**Note**: `host.docker.internal` permet au conteneur d'accéder au service ML sur l'hôte.

### Résultat Attendu

```
abc123def456...
```

### Vérification

```bash
docker ps | grep materials-service
```

**Résultat**:
```
abc123    ghada/smartsite-materials-service:test    "node dist/src/main"    Up 10 seconds    0.0.0.0:3009->3009/tcp    materials-service-test
```

---

## 📋 ÉTAPE 3: VÉRIFIER LES LOGS

### Commande

```bash
docker logs materials-service-test
```

### Résultat Attendu

```
[Nest] 1  - 05/03/2026, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 1  - 05/03/2026, 10:30:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 1  - 05/03/2026, 10:30:00 AM     LOG [InstanceLoader] MongooseModule dependencies initialized
[Nest] 1  - 05/03/2026, 10:30:00 AM     LOG [InstanceLoader] MaterialsModule dependencies initialized
[Nest] 1  - 05/03/2026, 10:30:00 AM     LOG [RoutesResolver] MaterialsController {/api/materials}
[Nest] 1  - 05/03/2026, 10:30:00 AM     LOG [RouterExplorer] Mapped {/api/materials, GET} route
[Nest] 1  - 05/03/2026, 10:30:00 AM     LOG [RouterExplorer] Mapped {/api/materials/:id, GET} route
[Nest] 1  - 05/03/2026, 10:30:00 AM     LOG [RouterExplorer] Mapped {/api/materials, POST} route
[Nest] 1  - 05/03/2026, 10:30:00 AM     LOG [NestApplication] Nest application successfully started
[Nest] 1  - 05/03/2026, 10:30:00 AM     LOG Application is running on: http://0.0.0.0:3009
```

### Suivre les Logs en Temps Réel

```bash
docker logs -f materials-service-test
```

---

## 🔍 ÉTAPE 4: TESTER LE SERVICE

### Test 1: Health Check

```bash
curl http://localhost:3009/api/materials/health
```

**Résultat attendu**:
```json
{
  "status": "ok",
  "timestamp": "2026-05-03T10:30:00.000Z",
  "uptime": 3600
}
```

### Test 2: Liste des Matériaux

```bash
curl http://localhost:3009/api/materials
```

**Résultat attendu**:
```json
[
  {
    "_id": "69f68ff60d59b26477d5f455",
    "name": "Ciment Portland",
    "code": "CIM-001",
    "quantity": 500,
    "unit": "sac",
    "siteId": "69f0f069df4fbf107365c34a",
    "siteName": "Site Down Tunisia",
    "coordinates": {
      "lat": 33.8439,
      "lng": 9.4001
    }
  }
]
```

### Test 3: Détails d'un Matériau

```bash
curl http://localhost:3009/api/materials/69f68ff60d59b26477d5f455
```

---

## 📊 ÉTAPE 5: VÉRIFIER LES RESSOURCES

### Commande

```bash
docker stats materials-service-test --no-stream
```

### Résultat Attendu

```
CONTAINER ID   NAME                      CPU %   MEM USAGE / LIMIT   MEM %   NET I/O
abc123         materials-service-test    2.5%    150MiB / 2GiB       7.5%    1.2kB / 850B
```

---

## 🛑 ÉTAPE 6: ARRÊTER ET NETTOYER

### Arrêter le Conteneur

```bash
docker stop materials-service-test
```

### Supprimer le Conteneur

```bash
docker rm materials-service-test
```

### Supprimer l'Image (optionnel)

```bash
docker rmi ghada/smartsite-materials-service:test
```

---

## 🐛 DÉPANNAGE

### Problème 1: Build Échoue

**Erreur**:
```
npm ERR! code ELIFECYCLE
```

**Solution**:
```bash
# Vérifier que le build fonctionne localement
cd apps/backend/materials-service
npm ci
npm run build

# Si ça fonctionne, nettoyer Docker
docker system prune -a
```

---

### Problème 2: Conteneur Ne Démarre Pas

**Erreur**:
```
docker: Error response from daemon: Conflict
```

**Solution**:
```bash
# Arrêter et supprimer l'ancien conteneur
docker stop materials-service-test
docker rm materials-service-test

# Relancer
docker run -d --name materials-service-test ...
```

---

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
docker logs materials-service-test

# Vérifier le port
netstat -an | grep 3009
```

---

### Problème 4: Erreur MongoDB

**Erreur dans les logs**:
```
MongooseError: Could not connect to MongoDB
```

**Solution**:
```bash
# Vérifier l'URI MongoDB
echo $MONGODB_URI

# Tester la connexion MongoDB
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/smartsite-materials"

# Relancer avec la bonne URI
docker stop materials-service-test
docker rm materials-service-test
docker run -d --name materials-service-test \
  -e MONGODB_URI="mongodb+srv://CORRECT_URI" \
  ...
```

---

## 📝 CHECKLIST DE TEST

- [ ] Build Docker réussit
- [ ] Image créée (`docker images`)
- [ ] Conteneur démarre (`docker ps`)
- [ ] Logs montrent "Nest application successfully started"
- [ ] Health check répond (200 OK)
- [ ] API `/api/materials` fonctionne
- [ ] Ressources normales (< 200MB RAM)
- [ ] Pas d'erreurs dans les logs

---

## 🎉 SUCCÈS

Si tous les tests passent:

```
✅ Build Docker: OK
✅ Conteneur démarre: OK
✅ Logs: OK
✅ Health Check: OK
✅ API fonctionne: OK
✅ Ressources: OK

🎉 Configuration Docker fonctionnelle!
```

---

## 🚀 PROCHAINE ÉTAPE: PUSH SUR DOCKER HUB

```bash
# Login
docker login -u ghada

# Tag l'image
docker tag ghada/smartsite-materials-service:test ghada/smartsite-materials-service:latest

# Push
docker push ghada/smartsite-materials-service:latest
```

**Résultat attendu**:
```
The push refers to repository [docker.io/ghada/smartsite-materials-service]
abc123: Pushed
def456: Pushed
latest: digest: sha256:abc123... size: 1234
```

---

**Date**: 3 Mai 2026
**Version**: 1.0.0
**Auteur**: Ghada
**Statut**: ✅ GUIDE DE TEST DOCKER COMPLET
