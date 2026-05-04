# 🎯 CORRECTIONS GPS & STOCK - Guide Rapide

## 🚀 DÉMARRAGE RAPIDE

### 1. Diagnostic
```bash
node test-complet-gps-stock.cjs
```

### 2. Si GPS manquants
```bash
node add-gps-to-sites.cjs
```

### 3. Vérification
```bash
node test-complet-gps-stock.cjs
```

---

## ✅ CORRECTIONS APPLIQUÉES

### Backend
- ✅ `materials.service.ts` - Récupération GPS depuis MongoDB
- ✅ Toutes les méthodes retournent `siteCoordinates: { lat, lng }`

### Frontend
- ✅ `Materials.tsx` - Affichage GPS dans le tableau
- ✅ `MaterialDetails.tsx` - Affichage amélioré:
  - Encadré GPS avec coordonnées
  - Adresse complète du site
  - Champs stock V2 (stockExistant, stockEntree, stockSortie)
  - Avertissement si GPS manquant

---

## 📊 SCRIPTS DISPONIBLES

| Script | Fonction |
|--------|----------|
| `test-gps-mongodb.cjs` | Diagnostic MongoDB - Vérifie si sites ont GPS |
| `add-gps-to-sites.cjs` | Ajoute GPS automatiquement à tous les sites |
| `test-complet-gps-stock.cjs` | Test complet MongoDB + API + Frontend |
| `diagnostic-complet-final.cjs` | Test API uniquement |

---

## 🔧 COMMANDES UTILES

### MongoDB
```bash
# Vérifier sites
mongo smartsite --eval "db.sites.find({}, {nom:1, coordonnees:1}).pretty()"

# Ajouter GPS à tous (Paris)
mongo smartsite --eval "db.sites.updateMany({}, {\$set: {coordonnees: {latitude: 48.8566, longitude: 2.3522}}})"

# Vérifier matériaux
mongo smartsite --eval "db.materials.find({}, {name:1, siteId:1, stockExistant:1, stockEntree:1, stockSortie:1}).limit(5).pretty()"
```

### Backend
```bash
cd apps/backend/materials-service
npm start
```

### Test API
```bash
curl http://localhost:3002/api/materials | jq '.[0] | {name, siteName, siteCoordinates}'
```

---

## 📍 STRUCTURE REQUISE

### Site MongoDB
```json
{
  "nom": "Chantier Nord Paris",
  "adresse": "123 Rue de Paris",
  "coordonnees": {
    "latitude": 48.8566,
    "longitude": 2.3522
  }
}
```

### Matériau MongoDB (optionnel)
```json
{
  "name": "Ciment Portland",
  "siteId": ObjectId("..."),
  "stockExistant": 1000,
  "stockEntree": 600,
  "stockSortie": 700
}
```

---

## ❌ PROBLÈMES COURANTS

### GPS null dans l'API
→ Exécuter: `node add-gps-to-sites.cjs`

### stockEntree/stockSortie non affichés
→ Normal si pas encore de mouvements enregistrés
→ Seront créés lors de la prochaine mise à jour

### Backend ne démarre pas
→ Vérifier MongoDB: `mongo smartsite --eval "db.stats()"`

---

## 📖 DOCUMENTATION COMPLÈTE

Voir: `GUIDE_CORRECTION_GPS_FINAL.md`

---

**Développeur**: Kiro AI  
**Date**: 2 Mai 2026
