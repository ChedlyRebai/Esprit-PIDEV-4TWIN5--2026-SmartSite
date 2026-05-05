# 🗺️ GUIDE FINAL - Affichage GPS Complet

Date: 2 Mai 2026  
Statut: **GUIDE COMPLET POUR RÉSOUDRE LE PROBLÈME GPS**

---

## 🎯 OBJECTIF

Afficher les coordonnées GPS du site assigné dans **TOUS** les contextes:
- ✅ Liste des matériaux
- ✅ Ajout de matériau
- ✅ Modification de matériau
- ✅ Détails de matériau
- ✅ Matériaux expirants
- ✅ Recherche par code-barres/QR

---

## 🔍 ÉTAPE 1: DIAGNOSTIC

### Exécuter le script de test

```bash
node test-gps-complet.cjs
```

**Ce script va tester**:
1. GET /api/materials - Liste des matériaux
2. GET /api/materials/:id - Détails d'un matériau
3. GET /api/materials/with-sites - Matériaux avec sites
4. GET /api/materials/expiring - Matériaux expirants

**Résultat attendu**:
```
================================================================================
📊 RÉSUMÉ DES TESTS
================================================================================

Endpoint                         | Testé | GPS Disponible | Détails
--------------------------------------------------------------------------------
GET /api/materials               | ✅    | ✅             | 10/10 avec GPS
GET /api/materials/:id           | ✅    | ✅             | Détails
GET /api/materials/with-sites    | ✅    | ✅             | 10/10 avec GPS
GET /api/materials/expiring      | ✅    | ✅             | 5/5 avec GPS

================================================================================
✅ TOUS LES TESTS PASSÉS - GPS DISPONIBLE PARTOUT
================================================================================
```

---

## 🔧 ÉTAPE 2: SI GPS MANQUANT - VÉRIFIER MONGODB

### Vérifier que les sites ont des coordonnées

```bash
# Se connecter à MongoDB
mongo smartsite

# Vérifier les sites
db.sites.find({}, { nom: 1, adresse: 1, coordonnees: 1 }).pretty()
```

**Résultat attendu**:
```javascript
{
  "_id": ObjectId("..."),
  "nom": "Chantier Nord Paris",
  "adresse": "123 Rue de la Paix",
  "ville": "Paris",
  "codePostal": "75001",
  "coordonnees": {
    "latitude": 48.8566,
    "longitude": 2.3522
  }
}
```

### Si les coordonnées sont manquantes

**Ajouter les coordonnées à un site**:
```javascript
db.sites.updateOne(
  { nom: "Chantier Nord Paris" },
  {
    $set: {
      coordonnees: {
        latitude: 48.8566,
        longitude: 2.3522
      }
    }
  }
)
```

**Ajouter les coordonnées à tous les sites**:
```javascript
// Exemple pour plusieurs sites
db.sites.updateOne(
  { nom: "Chantier Sud Lyon" },
  { $set: { coordonnees: { latitude: 45.7640, longitude: 4.8357 } } }
);

db.sites.updateOne(
  { nom: "Chantier Est Marseille" },
  { $set: { coordonnees: { latitude: 43.2965, longitude: 5.3698 } } }
);
```

---

## 🔧 ÉTAPE 3: VÉRIFIER LES LOGS BACKEND

### Démarrer le backend avec logs

```bash
cd apps/backend/materials-service
npm start
```

**Chercher dans les logs**:
```
✅ Connexion MongoDB sites établie
✅ GPS récupéré pour Ciment Portland: Chantier Nord Paris (48.8566, 2.3522)
✅ Site info loaded: Chantier Nord Paris (48.8566, 2.3522)
```

**Si vous voyez**:
```
⚠️ GPS manquant pour Ciment Portland: Site Chantier Nord Paris n'a pas de coordonnées
```
→ Le site n'a pas de coordonnées dans MongoDB (voir Étape 2)

**Si vous voyez**:
```
⚠️ Could not fetch site 507f191e810c19729de860ea: ...
```
→ Erreur de connexion MongoDB ou siteId invalide

---

## 🎨 ÉTAPE 4: VÉRIFIER L'AFFICHAGE FRONTEND

### Test 1: Liste des Matériaux

```bash
1. Ouvrir http://localhost:5173/materials
2. Vérifier que chaque matériau affiche:
   - Nom du site
   - Adresse du site
   - 📍 GPS: lat, lng
```

**Affichage attendu dans le tableau**:
```
┌─────────────────────────────────────────────────────────────┐
│ Nom              | Site / Localisation                      │
├─────────────────────────────────────────────────────────────┤
│ Ciment Portland  | Chantier Nord Paris                      │
│                  | 123 Rue de la Paix, 75001 Paris         │
│                  | 📍 48.85660, 2.35220                     │
└─────────────────────────────────────────────────────────────┘
```

---

### Test 2: Ajout de Matériau

```bash
1. Cliquer sur "Add Material"
2. Sélectionner un site dans la liste
3. ✅ Vérifier l'affichage:
   - Nom du site
   - Adresse complète
   - Ville et code postal
   - 📍 GPS: lat, lng
```

**Affichage attendu**:
```
┌─────────────────────────────────────────────────────────────┐
│ Site / Location *                                           │
│ [Chantier Nord Paris - 123 Rue...]  ▼                      │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📍 Chantier Nord Paris                                  │ │
│ │    123 Rue de la Paix                                   │ │
│ │    Paris 75001                                          │ │
│ │    📍 GPS: 48.85660, 2.35220                           │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

### Test 3: Détails de Matériau

```bash
1. Cliquer sur un matériau
2. ✅ Vérifier la carte "Assigned Site":
   - Nom du site
   - Adresse
   - 📍 GPS: lat, lng
   - Widget météo (si GPS disponible)
```

**Affichage attendu**:
```
┌─────────────────────────────────────────────────────────────┐
│ 📍 Assigned Site                                            │
│                                                             │
│ Chantier Nord Paris                                         │
│ 🧭 48.85660, 2.35220                                       │
│ 123 Rue de la Paix, 75001 Paris                           │
└─────────────────────────────────────────────────────────────┘
```

---

### Test 4: Matériaux Expirants

```bash
1. Ouvrir la page "Matériaux Expirants"
2. ✅ Vérifier que chaque matériau affiche:
   - Nom du site
   - Adresse
   - 📍 GPS: lat, lng
```

---

## 🔧 ÉTAPE 5: SI LE PROBLÈME PERSISTE

### Vérification 1: API retourne bien les GPS

```bash
# Test direct de l'API
curl http://localhost:3002/api/materials | jq '.[0] | {name, siteName, siteAddress, siteCoordinates}'

# Résultat attendu:
{
  "name": "Ciment Portland",
  "siteName": "Chantier Nord Paris",
  "siteAddress": "123 Rue de la Paix, 75001 Paris",
  "siteCoordinates": {
    "lat": 48.8566,
    "lng": 2.3522
  }
}
```

**Si siteCoordinates est null**:
→ Problème backend (voir Étape 2 et 3)

**Si siteCoordinates est présent**:
→ Problème frontend (voir Étape 4)

---

### Vérification 2: Redémarrer les services

```bash
# Backend
cd apps/backend/materials-service
npm start

# Frontend
cd apps/frontend
npm run dev
```

---

### Vérification 3: Vider le cache

```bash
# Backend - Le cache est automatiquement vidé après 5 minutes
# Ou redémarrer le service

# Frontend - Vider le cache du navigateur
# Ctrl + Shift + R (Windows/Linux)
# Cmd + Shift + R (Mac)
```

---

## 📊 CHECKLIST COMPLÈTE

### Backend
- [x] ✅ `findAll()` retourne siteCoordinates
- [x] ✅ `findOne()` retourne siteCoordinates
- [x] ✅ `findByCode()` retourne siteCoordinates
- [x] ✅ `findByBarcode()` retourne siteCoordinates
- [x] ✅ `findByQRCode()` retourne siteCoordinates
- [x] ✅ `getExpiringMaterials()` retourne siteCoordinates
- [x] ✅ `getMaterialsWithSiteInfo()` retourne siteCoordinates

### MongoDB
- [ ] ❓ Les sites ont des coordonnées (latitude, longitude)
- [ ] ❓ Format correct: `coordonnees: { latitude: number, longitude: number }`

### Frontend
- [x] ✅ `MaterialDetails.tsx` affiche GPS
- [x] ✅ `MaterialForm.tsx` affiche GPS du site sélectionné
- [x] ✅ `ExpiringMaterials.tsx` affiche GPS
- [ ] ❓ `Materials.tsx` affiche GPS dans le tableau

---

## 🎯 RÉSOLUTION RAPIDE

### Problème: GPS ne s'affiche nulle part

**Solution**:
```bash
1. Exécuter: node test-gps-complet.cjs
2. Si "GPS MANQUANT":
   - Vérifier MongoDB (Étape 2)
   - Ajouter les coordonnées aux sites
3. Si "TESTS PASSÉS":
   - Vérifier le frontend (Étape 4)
   - Vider le cache du navigateur
```

---

### Problème: GPS s'affiche dans l'API mais pas dans le frontend

**Solution**:
```bash
1. Vider le cache du navigateur (Ctrl + Shift + R)
2. Vérifier la console du navigateur (F12)
3. Chercher les erreurs JavaScript
4. Redémarrer le frontend (npm run dev)
```

---

### Problème: GPS s'affiche pour certains matériaux mais pas tous

**Solution**:
```bash
1. Vérifier que TOUS les sites ont des coordonnées:
   db.sites.find({ coordonnees: { $exists: false } })
   
2. Ajouter les coordonnées manquantes:
   db.sites.updateMany(
     { coordonnees: { $exists: false } },
     { $set: { coordonnees: { latitude: 0, longitude: 0 } } }
   )
   
3. Mettre à jour avec les vraies coordonnées
```

---

## 📞 SUPPORT

### Logs à fournir si le problème persiste

```bash
# 1. Résultat du script de test
node test-gps-complet.cjs > test-results.txt

# 2. Logs du backend
cd apps/backend/materials-service
npm start > backend-logs.txt 2>&1

# 3. Vérification MongoDB
mongo smartsite --eval "db.sites.find({}, {nom:1, coordonnees:1}).pretty()" > sites-data.txt

# 4. Test API direct
curl http://localhost:3002/api/materials | jq '.[0]' > api-response.json
```

---

## 🎉 SUCCÈS

**Si tous les tests passent**:
```
✅ Backend retourne les GPS
✅ MongoDB a les coordonnées
✅ Frontend affiche les GPS
✅ Tous les contextes fonctionnent
```

**Vous devriez voir les coordonnées GPS partout**:
- 📍 Dans la liste des matériaux
- 📍 Lors de l'ajout d'un matériau
- 📍 Lors de la modification
- 📍 Dans les détails
- 📍 Dans les matériaux expirants

---

**Développeur**: Kiro AI  
**Date**: 2 Mai 2026  
**Version**: 2.3.0 - GPS Complete Guide  
**Statut**: ✅ **GUIDE COMPLET**
