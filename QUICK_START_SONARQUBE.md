# ⚡ Quick Start - SonarQube 9.9.8

## 🚀 Installation en 3 commandes

### Option 1 : Avec le script automatique (Recommandé)

```powershell
# Exécuter le script d'installation
.\install-sonarqube.ps1
```

Le script va :
- ✅ Vérifier Docker
- ✅ Télécharger les images
- ✅ Démarrer SonarQube
- ✅ Ouvrir votre navigateur automatiquement

---

### Option 2 : Manuellement

```powershell
# 1. Démarrer SonarQube
docker-compose -f docker-compose-sonarqube.yml up -d

# 2. Voir les logs (optionnel)
docker logs -f sonarqube

# 3. Attendre 2-3 minutes puis ouvrir
# http://localhost:9000
```

---

## 🔐 Première Connexion

1. **URL**: http://localhost:9000
2. **Login**: `admin`
3. **Password**: `admin`
4. ⚠️ **Changez le mot de passe** immédiatement

---

## 🎯 Configuration pour Jenkins

### 1. Créer un Token

```
SonarQube → My Account → Security → Generate Tokens
```

- **Name**: `jenkins-materials-service`
- **Type**: `Global Analysis Token`
- **Expires**: `No expiration`

**⚠️ COPIEZ LE TOKEN** (exemple: `squ_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### 2. Ajouter le Token dans Jenkins

```
Jenkins → Manage Jenkins → Credentials → Add Credentials
```

- **Kind**: Secret text
- **Secret**: [Collez le token SonarQube]
- **ID**: `sonarqube-token`
- **Description**: SonarQube authentication token

### 3. Configurer le Serveur SonarQube dans Jenkins

```
Jenkins → Manage Jenkins → Configure System → SonarQube servers
```

- **Name**: `SonarQube`
- **Server URL**: `http://localhost:9000`
- **Server authentication token**: Sélectionnez `sonarqube-token`

### 4. Configurer SonarScanner dans Jenkins

```
Jenkins → Manage Jenkins → Global Tool Configuration → SonarQube Scanner
```

- **Name**: `SonarScanner`
- ✅ **Install automatically**
- **Version**: Latest

---

## ✅ Test de l'Installation

### Vérifier que SonarQube fonctionne

```powershell
# Vérifier le statut
curl http://localhost:9000/api/system/status

# Vérifier la version
curl http://localhost:9000/api/server/version
```

Réponses attendues :
```json
{"status":"UP"}
```
```
9.9.8
```

---

## 📊 Créer le Projet Materials Service

### Option A : Automatique
Le projet sera créé automatiquement lors de la première analyse Jenkins.

### Option B : Manuelle
1. SonarQube → **Create Project**
2. **Project key**: `smartsite-materials-service`
3. **Display name**: `SmartSite - Materials Service`
4. **Set Up**

---

## 🛠️ Commandes Utiles

```powershell
# Voir les logs
docker logs -f sonarqube

# Arrêter
docker-compose -f docker-compose-sonarqube.yml stop

# Démarrer
docker-compose -f docker-compose-sonarqube.yml start

# Redémarrer
docker-compose -f docker-compose-sonarqube.yml restart

# Vérifier les conteneurs
docker ps

# Supprimer tout (⚠️ supprime les données)
docker-compose -f docker-compose-sonarqube.yml down -v
```

---

## 🐛 Problèmes Courants

### SonarQube ne démarre pas

**Solution** : Augmenter la RAM Docker
```
Docker Desktop → Settings → Resources → Memory: 4 GB minimum
```

### Port 9000 déjà utilisé

**Solution** : Modifier le port dans `docker-compose-sonarqube.yml`
```yaml
ports:
  - "9001:9000"  # Utiliser 9001
```

### Erreur "vm.max_map_count too low"

**Solution** : Sur Windows avec WSL2
```powershell
wsl
sudo sysctl -w vm.max_map_count=262144
```

---

## 🎉 C'est Prêt !

Votre SonarQube est maintenant installé et configuré.

**Prochaine étape** : Lancez votre pipeline Jenkins pour voir l'analyse en action !

```
Jenkins → materials-service-CI → Build Now
```

Puis consultez les résultats sur : http://localhost:9000

---

## 📚 Documentation Complète

Pour plus de détails, consultez : **INSTALLATION_SONARQUBE_9.9.8.md**
