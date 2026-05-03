# ⚡ COMMANDES RAPIDES - JENKINS & SONARQUBE

## 🔐 CREDENTIALS JENKINS - RÉSUMÉ

### Liste des 4 Credentials à Créer

```
Jenkins → Manage Jenkins → Manage Credentials → (global) → Add Credentials
```

| # | ID | Type | Valeur |
|---|----|----|--------|
| 1 | `docker-hub-credentials` | Username + Password | Username: `ghada`<br>Password: `[token-docker-hub]` |
| 2 | `mongodb-uri` | Secret text | `mongodb+srv://user:pass@cluster.mongodb.net/smartsite-materials` |
| 3 | `ml-service-url` | Secret text | `http://localhost:8000` |
| 4 | `sonarqube-token` | Secret text | `[token-sonarqube]` |

---

## 🐳 INSTALLATION SONARQUBE - COMMANDES

### Étape 1: Créer le Réseau

```bash
docker network create sonarnet
```

### Étape 2: Lancer PostgreSQL

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

### Étape 3: Lancer SonarQube

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

### Étape 4: Vérifier

```bash
# Voir les conteneurs
docker ps

# Voir les logs
docker logs -f sonarqube
```

**Attendre**: "SonarQube is operational"

### Étape 5: Accéder

```
http://localhost:9000
```

**Login**: `admin` / `admin`

---

## 📊 CONFIGURATION SONARQUBE

### Créer un Token

```
SonarQube → Avatar → My Account → Security → Generate Token
```

- Name: `jenkins`
- Type: `Global Analysis Token`
- **Generate** → **Copier le token**

### Créer les Projets

**Projet 1: Materials Service**
```
Projects → Create Project → Manually
- Project key: smartsite-materials-service
- Display name: SmartSite - Materials Service
```

**Projet 2: Frontend**
```
Projects → Create Project → Manually
- Project key: smartsite-frontend
- Display name: SmartSite - Frontend
```

---

## 🔧 CONFIGURATION JENKINS

### Ajouter SonarQube Server

```
Jenkins → Manage Jenkins → Configure System → SonarQube servers
```

- Name: `SonarQube`
- Server URL: `http://localhost:9000`
- Token: Ajouter le credential `sonarqube-token`

### Configurer SonarQube Scanner

```
Jenkins → Manage Jenkins → Global Tool Configuration → SonarQube Scanner
```

- Name: `SonarScanner`
- ✅ Install automatically

---

## 🧪 TEST RAPIDE

### Test SonarQube

```bash
cd apps/backend/materials-service

sonar-scanner \
  -Dsonar.projectKey=smartsite-materials-service \
  -Dsonar.sources=src \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=[votre-token]
```

### Voir les Résultats

```
http://localhost:9000 → Projects → SmartSite - Materials Service
```

---

## 🆘 DÉPANNAGE RAPIDE

### SonarQube ne démarre pas

```bash
docker logs sonarqube
docker restart sonarqube
```

### Erreur mémoire

```bash
# Linux/WSL
sudo sysctl -w vm.max_map_count=262144

# Ou augmenter la RAM
docker stop sonarqube
docker rm sonarqube
# Relancer avec -m 4g
```

### Redémarrer tout

```bash
docker restart sonarqube-db sonarqube
```

---

## ✅ CHECKLIST RAPIDE

### Credentials Jenkins
- [ ] docker-hub-credentials
- [ ] mongodb-uri
- [ ] ml-service-url
- [ ] sonarqube-token

### SonarQube
- [ ] PostgreSQL lancé
- [ ] SonarQube lancé
- [ ] Accessible sur :9000
- [ ] Token généré
- [ ] 2 projets créés
- [ ] Jenkins configuré

---

## 📞 COMMANDES UTILES

```bash
# Voir les conteneurs
docker ps

# Logs SonarQube
docker logs -f sonarqube

# Redémarrer
docker restart sonarqube

# Arrêter
docker stop sonarqube sonarqube-db

# Démarrer
docker start sonarqube-db sonarqube

# Supprimer (si besoin de recommencer)
docker stop sonarqube sonarqube-db
docker rm sonarqube sonarqube-db
docker volume rm sonarqube-data sonarqube-db
```

---

**Date**: 3 Mai 2026
**Statut**: ✅ COMMANDES RAPIDES PRÊTES
