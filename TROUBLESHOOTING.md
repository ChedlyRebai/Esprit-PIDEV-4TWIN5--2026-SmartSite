# 🔧 Guide de dépannage - Récupération GPS et Localisation

## ❌ Problèmes courants et solutions

### 1. Les coordonnées GPS ne s'affichent pas

**Symptôme:**
```
Chantier Assigné: Chantier Nord
(Pas de coordonnées GPS)
```

**Causes possibles:**

#### A. Le site n'a pas de coordonnées GPS
```bash
# Vérifier dans la base de données des sites
db.sites.findOne({ _id: ObjectId("...") })

# Vérifier que le champ coordinates existe et contient lat/lng
{
  _id: ObjectId("..."),
  nom: "Chantier Nord",
  coordinates: {
    lat: 48.856613,
    lng: 2.352222
  }
}
```

**Solution:**
- Ajouter les coordonnées GPS au site dans la base de données
- Ou utiliser un service de géocodage pour récupérer les coordonnées à partir de l'adresse

#### B. Le matériau n'a pas de siteId assigné
```bash
# Vérifier dans la base de données des matériaux
db.materials.findOne({ _id: ObjectId("...") })

# Vérifier que le champ siteId existe
{
  _id: ObjectId("..."),
  name: "Ciment Portland",
  siteId: ObjectId("507f1f77bcf86cd799439012")
}
```

**Solution:**
- Assigner un site au matériau
- Ou créer un nouveau matériau avec un site assigné

#### C. L'API des sites retourne null pour coordinates
```bash
# Vérifier la réponse de l'API des sites
curl -X GET http://localhost:3001/api/gestion-sites/507f1f77bcf86cd799439012

# Vérifier que la réponse contient coordinates
{
  _id: "507f1f77bcf86cd799439012",
  nom: "Chantier Nord",
  coordinates: {
    lat: 48.856613,
    lng: 2.352222
  }
}
```

**Solution:**
- Vérifier que le service des sites est en cours d'exécution
- Vérifier que l'ID du site est correct
- Vérifier que le site a des coordonnées GPS

### 2. Erreur "Aucun site assigné à ce matériau"

**Symptôme:**
```json
{
  "success": false,
  "message": "Aucun site assigné à ce matériau",
  "data": null
}
```

**Causes possibles:**

#### A. Le matériau n'a pas de siteId
```bash
# Vérifier dans la base de données
db.materials.findOne({ _id: ObjectId("...") })

# Si siteId est null ou undefined
{
  _id: ObjectId("..."),
  name: "Ciment Portland",
  siteId: null  # ❌ Problème
}
```

**Solution:**
```bash
# Assigner un site au matériau
db.materials.updateOne(
  { _id: ObjectId("...") },
  { $set: { siteId: ObjectId("507f1f77bcf86cd799439012") } }
)
```

#### B. Le siteId est invalide
```bash
# Vérifier que le site existe
db.sites.findOne({ _id: ObjectId("507f1f77bcf86cd799439012") })

# Si le site n'existe pas, le siteId est invalide
```

**Solution:**
- Vérifier que le site existe dans la base de données
- Assigner un site valide au matériau

### 3. Erreur "Service des sites indisponible"

**Symptôme:**
```json
{
  "success": false,
  "message": "Erreur lors de la récupération des détails du site",
  "error": "Service des sites indisponible",
  "data": null
}
```

**Logs du backend:**
```
❌ Erreur lors de la récupération du site 507f1f77bcf86cd799439012: 
   connect ECONNREFUSED 127.0.0.1:3001
```

**Causes possibles:**

#### A. Le service des sites n'est pas en cours d'exécution
```bash
# Vérifier que le service est en cours d'exécution
curl -X GET http://localhost:3001/api/gestion-sites

# Si erreur de connexion, le service n'est pas en cours d'exécution
```

**Solution:**
```bash
# Démarrer le service des sites
cd apps/backend/gestion-site
npm run start

# Ou en mode développement
npm run start:dev
```

#### B. Le port 3001 est occupé par un autre service
```bash
# Vérifier quel processus utilise le port 3001
netstat -ano | findstr :3001  # Windows
lsof -i :3001                  # macOS/Linux

# Arrêter le processus qui occupe le port
taskkill /PID <PID> /F  # Windows
kill -9 <PID>           # macOS/Linux
```

**Solution:**
- Arrêter le processus qui occupe le port
- Démarrer le service des sites sur le port 3001

#### C. L'URL du service est incorrecte
```bash
# Vérifier dans le code du service
# apps/backend/materials-service/src/materials/materials.service.ts

const siteResponse = await axios.get(
  `http://localhost:3001/api/gestion-sites/${siteIdStr}`,
);
```

**Solution:**
- Vérifier que l'URL est correcte
- Vérifier que le port est correct (3001)
- Vérifier que le chemin de l'API est correct

### 4. Les coordonnées GPS sont null

**Symptôme:**
```json
{
  "success": true,
  "message": "Détails du site récupérés avec succès",
  "data": {
    "siteId": "507f1f77bcf86cd799439012",
    "siteName": "Chantier Nord",
    "siteAddress": "123 Rue de la Paix",
    "siteLocalisation": "Paris",
    "coordinates": null,  # ❌ Problème
    "status": "active",
    "progress": 75
  }
}
```

**Causes possibles:**

#### A. Le site n'a pas de coordonnées GPS
```bash
# Vérifier dans la base de données des sites
db.sites.findOne({ _id: ObjectId("507f1f77bcf86cd799439012") })

# Si coordinates est null ou undefined
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  nom: "Chantier Nord",
  coordinates: null  # ❌ Problème
}
```

**Solution:**
```bash
# Ajouter les coordonnées GPS au site
db.sites.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439012") },
  { $set: { 
    coordinates: {
      lat: 48.856613,
      lng: 2.352222
    }
  }}
)
```

#### B. Le format des coordonnées est incorrect
```bash
# Vérifier le format des coordonnées
db.sites.findOne({ _id: ObjectId("507f1f77bcf86cd799439012") })

# Format incorrect
{
  coordinates: "48.856613, 2.352222"  # ❌ String au lieu d'objet
}

# Format correct
{
  coordinates: {
    lat: 48.856613,
    lng: 2.352222
  }
}
```

**Solution:**
```bash
# Corriger le format des coordonnées
db.sites.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439012") },
  { $set: { 
    coordinates: {
      lat: 48.856613,
      lng: 2.352222
    }
  }}
)
```

### 5. Erreur "Matériau non trouvé"

**Symptôme:**
```
Erreur 404: Matériau non trouvé
```

**Causes possibles:**

#### A. L'ID du matériau est invalide
```bash
# Vérifier que l'ID est un ObjectId valide
# Format valide: 507f1f77bcf86cd799439011

# Vérifier que le matériau existe
db.materials.findOne({ _id: ObjectId("507f1f77bcf86cd799439011") })
```

**Solution:**
- Vérifier que l'ID du matériau est correct
- Vérifier que le matériau existe dans la base de données

#### B. Le matériau a été supprimé
```bash
# Vérifier dans la base de données
db.materials.findOne({ _id: ObjectId("507f1f77bcf86cd799439011") })

# Si le matériau n'existe pas, il a été supprimé
```

**Solution:**
- Créer un nouveau matériau
- Ou restaurer le matériau à partir d'une sauvegarde

### 6. Timeout lors de la récupération des détails du site

**Symptôme:**
```
Erreur: Timeout après 30 secondes
```

**Logs du backend:**
```
❌ Erreur lors de la récupération du site 507f1f77bcf86cd799439012: 
   timeout of 30000ms exceeded
```

**Causes possibles:**

#### A. Le service des sites est lent
```bash
# Vérifier le temps de réponse du service des sites
time curl -X GET http://localhost:3001/api/gestion-sites/507f1f77bcf86cd799439012

# Si le temps de réponse est > 30 secondes, le service est trop lent
```

**Solution:**
- Optimiser les requêtes du service des sites
- Augmenter le timeout dans le code
- Vérifier les performances de la base de données

#### B. Le réseau est lent
```bash
# Vérifier la latence réseau
ping localhost

# Si la latence est élevée, le réseau est lent
```

**Solution:**
- Vérifier la connexion réseau
- Vérifier les performances du serveur

#### C. Le timeout est trop court
```bash
# Vérifier le timeout dans le code
// apps/backend/materials-service/src/materials/materials.service.ts

const siteResponse = await axios.get(
  `http://localhost:3001/api/gestion-sites/${siteIdStr}`,
  // Pas de timeout spécifié, utilise le timeout par défaut
);
```

**Solution:**
```typescript
// Augmenter le timeout
const siteResponse = await axios.get(
  `http://localhost:3001/api/gestion-sites/${siteIdStr}`,
  { timeout: 60000 }  // 60 secondes au lieu de 30
);
```

## 🔍 Vérification des logs

### Backend
```bash
# Vérifier les logs du service materials
npm run start:dev

# Chercher les logs avec "📍" ou "✅" ou "❌"
```

### Frontend
```bash
# Ouvrir la console du navigateur (F12)
# Chercher les logs avec "📍" ou "✅" ou "❌"
```

## 📊 Vérification de la base de données

### MongoDB

```bash
# Vérifier les matériaux avec siteId
db.materials.find({ siteId: { $exists: true, $ne: null } }).pretty()

# Vérifier les sites avec coordonnées
db.sites.find({ coordinates: { $exists: true, $ne: null } }).pretty()

# Vérifier un matériau spécifique
db.materials.findOne({ _id: ObjectId("507f1f77bcf86cd799439011") }).pretty()

# Vérifier un site spécifique
db.sites.findOne({ _id: ObjectId("507f1f77bcf86cd799439012") }).pretty()
```

## 🧪 Tests de diagnostic

### Test 1: Vérifier la connexion au service des sites

```bash
curl -X GET http://localhost:3001/api/gestion-sites \
  -H "Content-Type: application/json"

# Réponse attendue: Liste des sites
```

### Test 2: Vérifier un site spécifique

```bash
curl -X GET http://localhost:3001/api/gestion-sites/507f1f77bcf86cd799439012 \
  -H "Content-Type: application/json"

# Réponse attendue: Détails du site avec coordonnées
```

### Test 3: Vérifier l'endpoint du service materials

```bash
curl -X GET http://localhost:3000/api/materials/507f1f77bcf86cd799439011/site-details \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Réponse attendue: Détails du site avec coordonnées
```

## 📞 Contacter le support

Si vous rencontrez un problème non résolu:

1. **Vérifier les logs** du backend et du frontend
2. **Vérifier la base de données** pour les données manquantes
3. **Vérifier la connexion réseau** entre les services
4. **Vérifier les versions** des dépendances
5. **Créer un issue** sur GitHub avec les logs et les détails du problème

## 📝 Checklist de dépannage

- [ ] Le service des sites est en cours d'exécution
- [ ] Le port 3001 est accessible
- [ ] Le matériau a un siteId assigné
- [ ] Le site existe dans la base de données
- [ ] Le site a des coordonnées GPS
- [ ] Les coordonnées GPS sont au format correct
- [ ] L'authentification est correcte
- [ ] Les logs du backend ne montrent pas d'erreurs
- [ ] Les logs du frontend ne montrent pas d'erreurs
- [ ] La base de données est accessible
