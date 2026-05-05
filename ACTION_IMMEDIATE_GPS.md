# 🚨 ACTION IMMÉDIATE - Correction GPS

## 🎯 PROBLÈME

Le service météo reçoit "Site assigné" au lieu du vrai nom du site, ce qui signifie que **les coordonnées GPS ne sont pas récupérées**.

---

## ✅ SOLUTION EN 3 ÉTAPES

### ÉTAPE 1: Diagnostic

```bash
node diagnostic-gps-urgent.cjs
```

**Ce script va vérifier**:
1. ✅ Si les sites existent dans MongoDB
2. ✅ Si les sites ont des coordonnées GPS
3. ✅ Si les matériaux ont un siteId valide
4. ✅ Si l'API retourne les GPS

---

### ÉTAPE 2: Ajouter GPS aux sites

**Si le diagnostic montre "❌ GPS MANQUANT"**, exécuter:

```bash
node add-gps-to-sites.cjs
```

**Ce script va**:
- Détecter automatiquement la ville de chaque site
- Ajouter les coordonnées GPS correspondantes
- Utiliser Paris par défaut si la ville n'est pas reconnue

---

### ÉTAPE 3: Redémarrer le backend

```bash
cd apps/backend/materials-service
npm start
```

**Chercher dans les logs**:

✅ **Si ça marche**:
```
🔍 Attempting to fetch site with ID: 507f1f77bcf86cd799439011
✅ Site FOUND: Chantier Nord Paris
   adresse: 123 Rue de Paris
   coordonnees: { "latitude": 48.8566, "longitude": 2.3522 }
✅ GPS COORDINATES FOUND: (48.8566, 2.3522)
```

❌ **Si ça ne marche pas**:
```
🔍 Attempting to fetch site with ID: 507f1f77bcf86cd799439011
❌ SITE NOT FOUND with ID: 507f1f77bcf86cd799439011
```

---

## 🔍 CAUSES POSSIBLES

### Cause 1: Sites sans GPS dans MongoDB

**Symptôme**: Le site est trouvé mais `coordonnees` est null ou incomplet

**Solution**:
```bash
node add-gps-to-sites.cjs
```

---

### Cause 2: siteId invalide dans materials

**Symptôme**: "❌ SITE NOT FOUND with ID: XXX"

**Solution MongoDB**:
```javascript
mongo smartsite

// Vérifier les matériaux
db.materials.find({}, { name: 1, siteId: 1 }).pretty()

// Vérifier les sites
db.sites.find({}, { _id: 1, nom: 1 }).pretty()

// Réassigner à un site valide
const validSiteId = db.sites.findOne()._id;
db.materials.updateMany(
  { siteId: { $exists: false } },
  { $set: { siteId: validSiteId } }
)
```

---

### Cause 3: Structure coordonnees incorrecte

**Symptôme**: Le site a `coordonnees` mais pas `latitude` et `longitude`

**Vérification**:
```javascript
mongo smartsite
db.sites.findOne({}, { coordonnees: 1 })
```

**Résultat attendu**:
```json
{
  "coordonnees": {
    "latitude": 48.8566,
    "longitude": 2.3522
  }
}
```

**Si différent**, corriger:
```javascript
db.sites.updateMany(
  {},
  { $set: { 
    coordonnees: { 
      latitude: 48.8566, 
      longitude: 2.3522 
    } 
  }}
)
```

---

## 📊 VÉRIFICATION FINALE

### 1. Test MongoDB
```bash
mongo smartsite --eval "db.sites.find({}, {nom:1, coordonnees:1}).pretty()"
```

**Résultat attendu**: Tous les sites ont `coordonnees.latitude` et `coordonnees.longitude`

---

### 2. Test API
```bash
curl http://localhost:3002/api/materials | jq '.[0] | {name, siteName, siteCoordinates}'
```

**Résultat attendu**:
```json
{
  "name": "Ciment Portland",
  "siteName": "Chantier Nord Paris",
  "siteCoordinates": {
    "lat": 48.8566,
    "lng": 2.3522
  }
}
```

---

### 3. Test Frontend

1. Ouvrir http://localhost:3000/materials
2. Cliquer sur "Details" d'un matériau
3. ✅ Vérifier que le widget météo affiche la ville correcte
4. ✅ Vérifier que les coordonnées GPS sont affichées

---

## 🆘 SI ÇA NE MARCHE TOUJOURS PAS

### Vérifier les logs backend en détail

```bash
cd apps/backend/materials-service
npm start | grep -E "🔍|✅|❌"
```

**Chercher**:
- `🔍 Attempting to fetch site with ID: XXX`
- `✅ Site FOUND: XXX` OU `❌ SITE NOT FOUND`
- `✅ GPS COORDINATES FOUND` OU `❌ GPS COORDINATES MISSING`

---

### Vérifier la connexion MongoDB

```bash
mongo smartsite --eval "db.stats()"
```

Si erreur → MongoDB n'est pas démarré

---

### Vérifier SitesService

**Fichier**: `apps/backend/materials-service/src/sites/sites.service.ts`

Vérifier que la méthode `findOne()` utilise bien:
```typescript
const { ObjectId } = require('mongodb');
let query: any;

try {
  query = { _id: new ObjectId(id) };
} catch {
  query = { _id: id };
}

return await this.sitesCollection.findOne(query);
```

---

## 📝 COMMANDES RAPIDES

```bash
# Diagnostic complet
node diagnostic-gps-urgent.cjs

# Ajouter GPS
node add-gps-to-sites.cjs

# Vérifier MongoDB
mongo smartsite --eval "db.sites.find({}, {nom:1, coordonnees:1}).pretty()"

# Test API
curl http://localhost:3002/api/materials | jq '.[0]'

# Logs backend
cd apps/backend/materials-service && npm start
```

---

**IMPORTANT**: Le problème principal est que les sites n'ont pas de coordonnées GPS dans MongoDB. Exécutez `node add-gps-to-sites.cjs` pour les ajouter automatiquement.
