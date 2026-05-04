# 📦 Kit d'Installation SonarQube 9.9.8

Ce dossier contient tous les fichiers nécessaires pour installer et configurer SonarQube 9.9.8 avec Docker Desktop sur Windows.

---

## 📁 Fichiers Inclus

| Fichier | Description |
|---------|-------------|
| **QUICK_START_SONARQUBE.md** | ⚡ Guide de démarrage rapide (COMMENCEZ ICI) |
| **INSTALLATION_SONARQUBE_9.9.8.md** | 📖 Documentation complète d'installation |
| **docker-compose-sonarqube.yml** | 🐳 Configuration Docker Compose |
| **install-sonarqube.ps1** | 🚀 Script d'installation automatique |
| **verify-sonarqube.ps1** | ✅ Script de vérification |

---

## 🚀 Installation Rapide (3 étapes)

### Étape 1 : Exécuter le script d'installation

```powershell
.\install-sonarqube.ps1
```

### Étape 2 : Vérifier l'installation

```powershell
.\verify-sonarqube.ps1
```

### Étape 3 : Se connecter

Ouvrez http://localhost:9000
- **Username**: `admin`
- **Password**: `admin`

---

## 📚 Documentation

### Pour les débutants
👉 **Lisez d'abord** : `QUICK_START_SONARQUBE.md`

### Pour plus de détails
👉 **Documentation complète** : `INSTALLATION_SONARQUBE_9.9.8.md`

---

## 🛠️ Commandes Essentielles

```powershell
# Installer SonarQube
.\install-sonarqube.ps1

# Vérifier l'installation
.\verify-sonarqube.ps1

# Voir les logs
docker logs -f sonarqube

# Arrêter SonarQube
docker-compose -f docker-compose-sonarqube.yml stop

# Démarrer SonarQube
docker-compose -f docker-compose-sonarqube.yml start

# Redémarrer SonarQube
docker-compose -f docker-compose-sonarqube.yml restart
```

---

## ✅ Checklist d'Installation

- [ ] Docker Desktop installé et démarré
- [ ] Script `install-sonarqube.ps1` exécuté
- [ ] Script `verify-sonarqube.ps1` exécuté (toutes les vérifications passent)
- [ ] SonarQube accessible sur http://localhost:9000
- [ ] Connexion réussie avec admin/admin
- [ ] Mot de passe admin changé
- [ ] Token Jenkins créé (My Account → Security → Generate Token)
- [ ] Token ajouté dans Jenkins (Credentials)
- [ ] Serveur SonarQube configuré dans Jenkins
- [ ] SonarScanner configuré dans Jenkins

---

## 🎯 Configuration Jenkins

Une fois SonarQube installé, configurez Jenkins :

### 1. Créer un Token dans SonarQube
```
SonarQube → My Account → Security → Generate Tokens
Name: jenkins-materials-service
Type: Global Analysis Token
```

### 2. Ajouter le Token dans Jenkins
```
Jenkins → Manage Jenkins → Credentials → Add Credentials
Kind: Secret text
ID: sonarqube-token
Secret: [votre token]
```

### 3. Configurer le Serveur SonarQube
```
Jenkins → Manage Jenkins → Configure System → SonarQube servers
Name: SonarQube
Server URL: http://localhost:9000
Token: sonarqube-token
```

### 4. Configurer SonarScanner
```
Jenkins → Manage Jenkins → Global Tool Configuration → SonarQube Scanner
Name: SonarScanner
Install automatically: ✅
```

---

## 🐛 Dépannage

### Problème : SonarQube ne démarre pas

**Solution 1** : Augmenter la RAM Docker
```
Docker Desktop → Settings → Resources → Memory: 4 GB minimum
```

**Solution 2** : Vérifier les logs
```powershell
docker logs -f sonarqube
```

### Problème : Port 9000 déjà utilisé

**Solution** : Modifier le port dans `docker-compose-sonarqube.yml`
```yaml
ports:
  - "9001:9000"  # Utiliser 9001 au lieu de 9000
```

Puis dans Jenkins, utilisez : `http://localhost:9001`

### Problème : Erreur "vm.max_map_count too low"

**Solution** : Sur Windows avec WSL2
```powershell
wsl
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
exit
```

Puis redémarrez SonarQube :
```powershell
docker-compose -f docker-compose-sonarqube.yml restart
```

---

## 📊 Informations Importantes

### Credentials par défaut
- **Username**: `admin`
- **Password**: `admin`
- ⚠️ **Changez le mot de passe** lors de la première connexion

### Ports utilisés
- **SonarQube**: `9000`
- **PostgreSQL**: `5432` (interne au réseau Docker)

### Volumes Docker (données persistantes)
- `sonarqube_data` : Données SonarQube
- `sonarqube_extensions` : Plugins et extensions
- `sonarqube_logs` : Logs
- `postgresql_data` : Base de données PostgreSQL

---

## 🎉 Prochaines Étapes

1. ✅ SonarQube installé
2. 🔧 Configurer Jenkins
3. 🚀 Lancer le pipeline CI
4. 📊 Consulter les résultats sur http://localhost:9000

---

## 📞 Support

### Vérifier le statut
```powershell
.\verify-sonarqube.ps1
```

### Voir les logs
```powershell
docker logs -f sonarqube
```

### Redémarrer complètement
```powershell
docker-compose -f docker-compose-sonarqube.yml restart
```

---

## 🔗 Ressources

- **Documentation SonarQube 9.9**: https://docs.sonarqube.org/9.9/
- **Docker Hub SonarQube**: https://hub.docker.com/_/sonarqube
- **Community Forum**: https://community.sonarsource.com/

---

**Bon déploiement ! 🚀**
