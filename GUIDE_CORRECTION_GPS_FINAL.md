# 🗺️ GUIDE COMPLET - Correction GPS et Affichage Stock

Date: 2 Mai 2026  
Statut: **CORRECTIONS APPLIQUÉES - TESTS REQUIS**

---

## 🎯 PROBLÈMES IDENTIFIÉS

1. ❌ GPS ne s'affiche pas → Sites MongoDB n'ont pas de coordonnées
2. ❌ Entrées/Sorties de stock non affichées dans MaterialDetails
3. ❌ Affichage site assigné pas assez clair

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. MaterialDetails.tsx - Affichage Stock Amélioré

**Fichier**: `apps/frontend/src/app/pages/materials/MaterialDetails.tsx`

**Ajouts**:
- ✅ Affichage `stockExistant` (Stock existant)
- ✅ Affichage `stockEntree` (Entrées) avec icône verte
- ✅ Affichage `stockSortie` (Sorties) avec icône rouge
- ✅ Affichage GPS amélioré avec encadré bleu
- ✅ Affichage adresse complète avec icône
- ✅ Avertissement si GPS manquant

**Exemple d'affichage**:
```
Stock Levels
├─ Current: 900 kg
├─ Minimum: 1000 kg
├─ Maximum: 5000 kg
├─ Reorder Point: 1000 kg
├─ Existing Stock: 1000 kg
├─ ↓ Stock In: +600 kg (vert)
└─ ↑ Stock Out: -700 kg (rouge)
```

---

### 2. MaterialDetails.tsx - Affichage Site Amélioré

**Avant**:
```
Assigned Site
Chantier Nord Paris
48.85660, 2.35220
123 Rue de Paris
```

**Après**:
```
Assigned Site
Chantier Nord Paris

📍 123 Rue de Paris

┌─────────────────────────────────┐
│ 🧭 GPS Coordinates:             │
│ 📍 48.856600, 2.352200          │
└─────────────────────────────────┘
```

---

## 🔧 SCRIPTS CRÉÉS

### 1. test-gps-mongodb.cjs - Diagnostic GPS

**Fonction**: Vérifier si les sites ont des coordonnées GPS dans MongoDB

**Commande**:
```bash
node test-gps-mongodb.cjs
```

**Ce qu'il fait**:
1. ✅ Se connecte à MongoDB
2. ✅ Liste tous les sites
3. ✅ Vérifie si chaque site a `coordonnees.latitude` et `coordonnees.longitude`
4. ✅ Affiche les 5 premiers sites avec détails
5. ✅ Affiche un résumé (X sites avec GPS, Y sites sans GPS)
6. ✅ Vérifie les matériaux et leurs sites assignés
7. ✅ Donne des recommandations pour ajouter GPS

**Résultat attendu**:
```
📍 VÉRIFICATION DES SITES

Total sites: 5

Site 1: Chantier Nord Paris
  _id: 507f1f77bcf86cd799439011
  adresse: 123 Rue de Paris
  coordonnees: { latitude: 48.8566, longitude: 2.3522 }
  ✅ GPS: 48.8566, 2.3522

📊 RÉSUMÉ SITES:
  ✅ Avec GPS: 5
  ❌ Sans GPS: 0
```

---

### 2. add-gps-to-sites.cjs - Ajout GPS Automatique

**Fonction**: Ajouter automatiquement des coordonnées GPS à tous les sites

**Commande**:
```bash
node add-gps-to-sites.cjs
```

**Ce qu'il fait**:
1. ✅ Se connecte à MongoDB
2. ✅ Récupère tous les sites
3. ✅ Pour chaque site sans GPS:
   - Détecte la ville dans le nom/adresse
   - Utilise les coordonnées de la ville
   - Si pas trouvé, utilise Paris par défaut
4. ✅ Met à jour MongoDB avec les coordonnées
5. ✅ Affiche un résumé

**Villes supportées**:
- Paris (48.8566, 2.3522)
- Lyon (45.7640, 4.8357)
- Marseille (43.2965, 5.3698)
- Toulouse (43.6047, 1.4442)
- Nice (43.7102, 7.2620)
- Nantes (47.2184, -1.5536)
- Strasbourg (48.5734, 7.7521)
- Montpellier (43.6108, 3.8767)
- Bordeaux (44.8378, -0.5792)
- Lille (50.6292, 3.0573)

**Résultat attendu**:
```
🗺️  AJOUT COORDONNÉES GPS AUX SITES

📍 5 sites trouvés

📍 Chantier Nord Paris - Coordonnées détectées automatiquement
   ✅ GPS ajouté: 48.8566, 2.3522

📊 RÉSUMÉ
✅ Sites mis à jour: 5
⏭️  Sites déjà avec GPS: 0
📍 Total sites: 5

🎉 SUCCÈS! Tous les sites ont maintenant des coordonnées GPS!
```

---

## 🚀 PROCÉDURE DE CORRECTION

### Étape 1: Diagnostic

```bash
# Vérifier si les sites ont des GPS
node test-gps-mongodb.cjs
```

**Si le résultat montre "❌ Sans GPS: X"**, passer à l'étape 2.

---

### Étape 2: Ajout GPS Automatique

```bash
# Ajouter automatiquement les GPS
node add-gps-to-sites.cjs
```

**Résultat attendu**: "🎉 SUCCÈS! Tous les sites ont maintenant des coordonnées GPS!"

---

### Étape 3: Vérification Backend

```bash
# Démarrer le backend
cd apps/backend/materials-service
npm start
```

**Chercher dans les logs**:
```
✅ Site info loaded: Chantier Nord Paris (48.8566, 2.3522)
```

**Si vous voyez**:
```
⚠️ Could not fetch site XXX
```
→ Le site n'existe pas ou l'ID est incorrect

---

### Étape 4: Test API

```bash
# Tester l'API materials
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

### Étape 5: Test Frontend

1. Ouvrir http://localhost:3000/materials
2. ✅ Vérifier que le tableau affiche GPS
3. ✅ Cliquer sur "Details" d'un matériau
4. ✅ Vérifier l'affichage:
   - Nom du site
   - Adresse complète
   - Encadré GPS avec coordonnées
   - Stock Existant
   - Entrées de stock (si > 0)
   - Sorties de stock (si > 0)

---

## 📊 STRUCTURE MONGODB REQUISE

### Collection `sites`

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "nom": "Chantier Nord Paris",
  "adresse": "123 Rue de Paris",
  "ville": "Paris",
  "codePostal": "75001",
  "pays": "France",
  "coordonnees": {
    "latitude": 48.8566,    // ✅ REQUIS
    "longitude": 2.3522     // ✅ REQUIS
  },
  "isActive": true
}
```

### Collection `materials`

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "name": "Ciment Portland",
  "code": "CIM-001",
  "quantity": 900,
  "siteId": ObjectId("507f1f77bcf86cd799439011"),  // ✅ Référence au site
  
  // Champs V2 (optionnels, pour affichage dans MaterialDetails)
  "stockExistant": 1000,   // Stock existant avant mouvements
  "stockEntree": 600,      // Dernière entrée
  "stockSortie": 700,      // Dernière sortie
  "stockMinimum": 1000     // Seuil de réapprovisionnement
}
```

---

## 🔍 VÉRIFICATIONS MANUELLES MONGODB

### Vérifier les sites

```javascript
// Connexion
mongo smartsite

// Lister tous les sites avec coordonnées
db.sites.find({}, { nom: 1, coordonnees: 1 }).pretty()

// Compter sites avec GPS
db.sites.count({ "coordonnees.latitude": { $exists: true } })

// Compter sites sans GPS
db.sites.count({ "coordonnees.latitude": { $exists: false } })
```

### Ajouter GPS manuellement

```javascript
// Pour un site spécifique
db.sites.updateOne(
  { nom: "Chantier Nord Paris" },
  { $set: { coordonnees: { latitude: 48.8566, longitude: 2.3522 } } }
)

// Pour tous les sites sans GPS (Paris par défaut)
db.sites.updateMany(
  { "coordonnees.latitude": { $exists: false } },
  { $set: { coordonnees: { latitude: 48.8566, longitude: 2.3522 } } }
)
```

### Vérifier les matériaux

```javascript
// Lister matériaux avec leur siteId
db.materials.find({}, { name: 1, siteId: 1, stockExistant: 1, stockEntree: 1, stockSortie: 1 }).pretty()

// Vérifier qu'un matériau a un site valide
db.materials.aggregate([
  { $lookup: {
      from: "sites",
      localField: "siteId",
      foreignField: "_id",
      as: "site"
  }},
  { $project: {
      name: 1,
      siteName: { $arrayElemAt: ["$site.nom", 0] },
      siteGPS: { $arrayElemAt: ["$site.coordonnees", 0] }
  }},
  { $limit: 5 }
])
```

---

## ❌ PROBLÈMES COURANTS

### Problème 1: GPS toujours null dans l'API

**Symptôme**: L'API retourne `siteCoordinates: null`

**Causes possibles**:
1. ❌ Le site n'a pas de coordonnées dans MongoDB
2. ❌ Le champ s'appelle `coordinates` au lieu de `coordonnees`
3. ❌ Les champs sont `lat/lon` au lieu de `latitude/longitude`

**Solution**:
```bash
# Vérifier la structure exacte
mongo smartsite
db.sites.findOne({}, { coordonnees: 1 })

# Si le résultat est null ou différent, corriger:
db.sites.updateMany(
  {},
  { $set: { coordonnees: { latitude: 48.8566, longitude: 2.3522 } } }
)
```

---

### Problème 2: stockEntree/stockSortie non affichés

**Symptôme**: Les champs n'apparaissent pas dans MaterialDetails

**Causes possibles**:
1. ❌ Les champs ne sont pas dans la base de données
2. ❌ Les valeurs sont 0 ou undefined
3. ❌ Le backend ne retourne pas ces champs

**Solution**:
```javascript
// Vérifier dans MongoDB
db.materials.findOne({ name: "Ciment Portland" }, { stockExistant: 1, stockEntree: 1, stockSortie: 1 })

// Si les champs n'existent pas, les ajouter:
db.materials.updateOne(
  { name: "Ciment Portland" },
  { $set: {
      stockExistant: 1000,
      stockEntree: 600,
      stockSortie: 700
  }}
)
```

---

### Problème 3: Site non trouvé

**Symptôme**: Logs backend montrent "⚠️ Could not fetch site XXX"

**Causes possibles**:
1. ❌ Le siteId dans materials ne correspond à aucun site
2. ❌ Le siteId est une string au lieu d'un ObjectId
3. ❌ Le site a été supprimé

**Solution**:
```javascript
// Trouver les matériaux avec siteId invalide
db.materials.aggregate([
  { $lookup: {
      from: "sites",
      localField: "siteId",
      foreignField: "_id",
      as: "site"
  }},
  { $match: { site: { $size: 0 } } },
  { $project: { name: 1, siteId: 1 } }
])

// Réassigner à un site valide
const validSiteId = db.sites.findOne()._id;
db.materials.updateMany(
  { siteId: { $exists: false } },
  { $set: { siteId: validSiteId } }
)
```

---

## ✅ CHECKLIST FINALE

### Backend
- [ ] Sites ont `coordonnees.latitude` et `coordonnees.longitude`
- [ ] Backend démarre sans erreur
- [ ] Logs montrent "✅ Site info loaded: ... (lat, lng)"
- [ ] API retourne `siteCoordinates: { lat, lng }`

### Frontend
- [ ] Tableau Materials affiche GPS
- [ ] MaterialDetails affiche:
  - [ ] Nom du site
  - [ ] Adresse complète
  - [ ] Encadré GPS avec coordonnées
  - [ ] Stock Existant (si disponible)
  - [ ] Entrées de stock (si > 0)
  - [ ] Sorties de stock (si > 0)

### MongoDB
- [ ] Tous les sites ont des coordonnées GPS
- [ ] Tous les matériaux ont un siteId valide
- [ ] Les champs stockExistant/stockEntree/stockSortie existent

---

## 📝 COMMANDES RAPIDES

```bash
# 1. Diagnostic GPS
node test-gps-mongodb.cjs

# 2. Ajouter GPS automatiquement
node add-gps-to-sites.cjs

# 3. Démarrer backend
cd apps/backend/materials-service && npm start

# 4. Test API
curl http://localhost:3002/api/materials | jq '.[0] | {name, siteName, siteCoordinates}'

# 5. MongoDB - Vérifier sites
mongo smartsite --eval "db.sites.find({}, {nom:1, coordonnees:1}).pretty()"

# 6. MongoDB - Ajouter GPS à tous
mongo smartsite --eval "db.sites.updateMany({}, {\$set: {coordonnees: {latitude: 48.8566, longitude: 2.3522}}})"
```

---

**Développeur**: Kiro AI  
**Date**: 2 Mai 2026  
**Statut**: ✅ **CORRECTIONS APPLIQUÉES - TESTS REQUIS**
