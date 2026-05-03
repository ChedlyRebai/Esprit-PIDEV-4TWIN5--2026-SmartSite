# 🗺️ GUIDE RAPIDE - RÉCUPÉRATION GPS

## 📍 Coordonnées GPS Tunisia: **33.8439, 9.4001**

## 🚀 ACTIONS RAPIDES

### 1️⃣ Vérifier l'état actuel
```bash
node check-sites-gps.cjs
```

### 2️⃣ Ajouter GPS aux sites (33.8439, 9.4001)
```bash
node ajouter-gps-tunisia.cjs
```

### 3️⃣ Corriger les sites manquants des matériaux
```bash
node corriger-sites-manquants.cjs
```

### 4️⃣ Redémarrer le backend
```bash
cd apps/backend/materials-service
npm start
```

### 5️⃣ Vérifier dans le navigateur
- Ouvrir l'application frontend
- Aller dans Materials
- Vérifier que les GPS s'affichent: `📍 33.8439, 9.4001`

---

## ✅ CE QUI FONCTIONNE DÉJÀ

### Backend (`materials.service.ts`)
- ✅ `findAll()` - Récupère site + GPS
- ✅ `findOne()` - Récupère site + GPS
- ✅ `findByCode()` - Récupère site + GPS
- ✅ `findByBarcode()` - Récupère site + GPS
- ✅ `findByQRCode()` - Récupère site + GPS
- ✅ `getExpiringMaterials()` - Récupère site + GPS
- ✅ `getMaterialsWithSiteInfo()` - Récupère site + GPS

### Frontend
- ✅ `Materials.tsx` - Affiche GPS dans le tableau (ligne 1050-1056)
- ✅ `MaterialDetails.tsx` - Affiche GPS dans la fiche détail
- ✅ `MaterialForm.tsx` - Affiche GPS lors de la sélection de site
- ✅ `CreateOrderDialog.tsx` - Récupère et affiche GPS correctement

---

## 🔍 STRUCTURE DES DONNÉES

### MongoDB - Collection `sites`
```javascript
{
  _id: ObjectId("..."),
  nom: "Chantier Tunisia",
  adresse: "Tunis",
  ville: "Tunis",
  codePostal: "1000",
  pays: "Tunisia",
  coordonnees: {
    latitude: 33.8439,
    longitude: 9.4001
  },
  isActive: true
}
```

### API Response - Material avec GPS
```javascript
{
  _id: "...",
  name: "Ciment Portland",
  code: "CIM001",
  siteId: "...",
  siteName: "Chantier Tunisia",
  siteAddress: "Tunis",
  siteCoordinates: {
    lat: 33.8439,
    lng: 9.4001
  }
}
```

---

## 🐛 PROBLÈMES COURANTS

### ❌ "Site assigné" au lieu du nom
**Cause**: Le site référencé n'existe pas dans MongoDB  
**Solution**: `node corriger-sites-manquants.cjs`

### ❌ GPS ne s'affiche pas
**Cause**: Le site n'a pas de coordonnées GPS  
**Solution**: `node ajouter-gps-tunisia.cjs`

### ❌ Backend logs "SITE NOT FOUND"
**Cause**: Le siteId du matériau est invalide  
**Solution**: `node corriger-sites-manquants.cjs`

---

## 📝 LOGS À VÉRIFIER

### Backend (materials-service)
```
✅ [findAll] Site FOUND: Chantier Tunisia
   coordonnees: { latitude: 33.8439, longitude: 9.4001 }
✅ [findAll] GPS: (33.8439, 9.4001)
```

### Frontend (Console)
```
Material: { 
  siteName: "Chantier Tunisia",
  siteCoordinates: { lat: 33.8439, lng: 9.4001 }
}
```

---

## 🎯 RÉSULTAT ATTENDU

### Dans le tableau Materials
```
Site: Chantier Tunisia
      Tunis
      📍 GPS: 33.8439, 9.4001
```

### Dans Material Details
```
┌─────────────────────────────────────┐
│ Site assigné                        │
│ Chantier Tunisia                    │
│ 📍 Tunis                            │
│                                     │
│ 📍 GPS Coordinates:                 │
│ 📍 33.8439, 9.4001                  │
└─────────────────────────────────────┘
```

### Dans MaterialForm (sélection site)
```
📍 Chantier Tunisia
   Tunis
   Tunis 1000
   📍 GPS: 33.8439, 9.4001
```

### Dans recherche QR/Barcode
```
Material trouvé: Ciment Portland
Site: Chantier Tunisia
Adresse: Tunis
📍 GPS: 33.8439, 9.4001
```

---

## 🔧 COMMANDES MONGODB MANUELLES

### Vérifier les sites
```javascript
db.sites.find({}).pretty()
```

### Ajouter GPS à un site
```javascript
db.sites.updateOne(
  { nom: "Chantier Tunisia" },
  { $set: { coordonnees: { latitude: 33.8439, longitude: 9.4001 } } }
)
```

### Vérifier les matériaux
```javascript
db.materials.find({}, { name: 1, siteId: 1 }).pretty()
```

### Réassigner tous les matériaux au premier site
```javascript
const site = db.sites.findOne()
db.materials.updateMany({}, { $set: { siteId: site._id } })
```

---

## 📞 SUPPORT

Si les GPS ne s'affichent toujours pas après avoir suivi ce guide:

1. Vérifier les logs backend (chercher "🔍 [findAll]")
2. Vérifier la console frontend (F12)
3. Vider le cache du navigateur (Ctrl+Shift+Delete)
4. Redémarrer complètement le backend

---

**Dernière mise à jour**: 2026-05-03  
**Coordonnées GPS Tunisia**: 33.8439, 9.4001
