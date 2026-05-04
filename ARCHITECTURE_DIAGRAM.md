# 🏗️ ARCHITECTURE DU SYSTÈME DE PRÉDICTIONS

## 📊 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                         UTILISATEUR                              │
│                    (Navigateur Web)                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Vite)                             │
│                    Port: 5173                                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Materials.tsx                                            │  │
│  │  - Affichage des matériaux                               │  │
│  │  - Prédictions IA                                        │  │
│  │  - Mise à jour automatique (1 min / 5 min)              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  vite.config.ts (PROXY)                                  │  │
│  │  /api/materials → http://localhost:3009                  │  │
│  │  /api/material-flow → http://localhost:3009              │  │
│  │  /socket.io → http://localhost:3009                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP (via Proxy)
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                  MATERIALS SERVICE (NestJS)                      │
│                    Port: 3009                                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MaterialsController                                      │  │
│  │  - GET /api/materials                                     │  │
│  │  - GET /api/materials/predictions/all                     │  │
│  │  - GET /api/material-flow                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  StockPredictionService                                   │  │
│  │  - Calcul taux de consommation réel                      │  │
│  │  - Prédiction heures avant rupture                       │  │
│  │  - TensorFlow.js (Linear Regression)                     │  │
│  │  - Ajustement météo                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AutoMLPredictionService (DÉSACTIVÉ)                     │  │
│  │  - Entraînement automatique                              │  │
│  │  - Sauvegarde de modèles                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MLTrainingService (DÉSACTIVÉ)                           │  │
│  │  - Upload dataset CSV                                     │  │
│  │  - Entraînement personnalisé                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ MongoDB Driver
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      MONGODB                                     │
│                    Port: 27017                                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Database: smartsite-materials                            │  │
│  │                                                           │  │
│  │  Collections:                                             │  │
│  │  - materials (matériaux)                                  │  │
│  │  - materialflowlogs (entrées/sorties)                    │  │
│  │  - materialsitestocks (stocks par site)                  │  │
│  │  - orders (commandes)                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flux de Données - Prédictions

```
1. CHARGEMENT INITIAL
   ┌─────────────────────────────────────────────────────────┐
   │ Frontend (Materials.tsx)                                 │
   │ useEffect(() => { loadPredictions() })                  │
   └────────────────────┬────────────────────────────────────┘
                        │
                        │ GET /api/materials/predictions/all
                        ↓
   ┌─────────────────────────────────────────────────────────┐
   │ Backend (MaterialsController)                            │
   │ getAllPredictions()                                      │
   └────────────────────┬────────────────────────────────────┘
                        │
                        │ Pour chaque matériau
                        ↓
   ┌─────────────────────────────────────────────────────────┐
   │ StockPredictionService                                   │
   │ predictStockDepletion()                                  │
   └────────────────────┬────────────────────────────────────┘
                        │
                        │ 1. Calculer taux de consommation
                        ↓
   ┌─────────────────────────────────────────────────────────┐
   │ MongoDB - MaterialFlowLog                                │
   │ Agrégation des sorties (type: 'OUT')                    │
   │ Calcul: totalOut / hoursDiff                            │
   └────────────────────┬────────────────────────────────────┘
                        │
                        │ 2. Calculer heures avant rupture
                        ↓
   ┌─────────────────────────────────────────────────────────┐
   │ Formule: (currentStock - 0) / consumptionRate           │
   │ Résultat: hoursToOutOfStock                             │
   └────────────────────┬────────────────────────────────────┘
                        │
                        │ 3. Déterminer status
                        ↓
   ┌─────────────────────────────────────────────────────────┐
   │ Status:                                                  │
   │ - critical: < 24h                                        │
   │ - warning: 24h - 72h                                     │
   │ - safe: > 72h                                            │
   └────────────────────┬────────────────────────────────────┘
                        │
                        │ 4. Retourner prédiction
                        ↓
   ┌─────────────────────────────────────────────────────────┐
   │ Frontend (Materials.tsx)                                 │
   │ setPredictions(new Map(...))                            │
   │ Affichage: renderPredictionBadge()                      │
   └─────────────────────────────────────────────────────────┘

2. MISE À JOUR AUTOMATIQUE
   ┌─────────────────────────────────────────────────────────┐
   │ Toutes les 5 minutes                                     │
   │ setInterval(() => loadPredictions(), 5 * 60 * 1000)     │
   └────────────────────┬────────────────────────────────────┘
                        │
                        │ Recharger depuis backend
                        ↓
   ┌─────────────────────────────────────────────────────────┐
   │ Nouvelles prédictions avec données à jour               │
   └─────────────────────────────────────────────────────────┘

3. DÉCRÉMENTATION LOCALE
   ┌─────────────────────────────────────────────────────────┐
   │ Toutes les 1 minute                                      │
   │ setInterval(() => {                                      │
   │   hoursToOutOfStock -= 1/60                             │
   │ }, 60 * 1000)                                           │
   └────────────────────┬────────────────────────────────────┘
                        │
                        │ Mise à jour visuelle
                        ↓
   ┌─────────────────────────────────────────────────────────┐
   │ Les heures diminuent progressivement                     │
   │ Les badges changent de couleur si seuil atteint         │
   └─────────────────────────────────────────────────────────┘
```

## 🎨 Affichage Frontend

```
┌─────────────────────────────────────────────────────────────────┐
│                    TABLEAU MATERIALS                             │
├─────────────┬────────┬──────────────────────────────────────────┤
│ Matériau    │ Stock  │ Prédiction IA                            │
├─────────────┼────────┼──────────────────────────────────────────┤
│ Ciment      │ 150    │ ┌──────────────────────────────────┐    │
│             │        │ │ 🚨 Aujourd'hui 14:30             │    │
│             │        │ │ Dans 8h                          │    │
│             │        │ └──────────────────────────────────┘    │
│             │        │ (Rouge clignotant - CRITIQUE)            │
├─────────────┼────────┼──────────────────────────────────────────┤
│ Sable       │ 500    │ ┌──────────────────────────────────┐    │
│             │        │ │ ⚠️ Demain 09:15                  │    │
│             │        │ │ Dans 1j 5h                       │    │
│             │        │ └──────────────────────────────────┘    │
│             │        │ (Jaune - WARNING)                        │
├─────────────┼────────┼──────────────────────────────────────────┤
│ Gravier     │ 1000   │ ┌──────────────────────────────────┐    │
│             │        │ │ ✅ Mercredi 16:00                │    │
│             │        │ │ Dans 3j 12h                      │    │
│             │        │ └──────────────────────────────────┘    │
│             │        │ (Vert - SAFE)                            │
└─────────────┴────────┴──────────────────────────────────────────┘

TOOLTIP AU SURVOL:
┌─────────────────────────────────────────────────────────────────┐
│ Ciment Portland                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Stock actuel: 150 unités                                        │
│ Consommation: 2.5 unités/h                                      │
│ Stock prédit (24h): 90 unités                                   │
├─────────────────────────────────────────────────────────────────┤
│ Rupture prévue: Mercredi 29 avril 2026 14:30                   │
│ Temps restant: 0j 8h                                            │
├─────────────────────────────────────────────────────────────────┤
│ 📦 Commander: 300 unités                                        │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Configuration des Ports

```
┌─────────────────────────────────────────────────────────────────┐
│                      PORTS UTILISÉS                              │
├─────────────────────────────────────────────────────────────────┤
│ Frontend (Vite)              : 5173                             │
│ Materials Service (NestJS)   : 3009 ✅ (corrigé de 3002)       │
│ API Gateway (NestJS)         : 9001 (optionnel)                │
│ MongoDB                      : 27017                            │
│ Planning Service             : 3002                             │
│ Gestion Site Service         : 3001                             │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Structure des Fichiers

```
smartsite-platform/
│
├── apps/
│   ├── frontend/
│   │   ├── vite.config.ts ✅ (MODIFIÉ - Proxy corrigé)
│   │   └── src/
│   │       └── app/
│   │           └── pages/
│   │               └── materials/
│   │                   └── Materials.tsx ✅ (MODIFIÉ - Affichage)
│   │
│   └── backend/
│       ├── materials-service/
│       │   ├── .env ✅ (MODIFIÉ - PORT=3009)
│       │   ├── package.json ✅ (VÉRIFIÉ - @tensorflow/tfjs)
│       │   └── src/
│       │       └── materials/
│       │           ├── materials.controller.ts ✅ (MODIFIÉ)
│       │           └── services/
│       │               ├── stock-prediction.service.ts ✅ (MODIFIÉ)
│       │               ├── ml-training.service.ts ⚠️ (DÉSACTIVÉ)
│       │               └── auto-ml-prediction.service.ts ⚠️ (DÉSACTIVÉ)
│       │
│       └── api-gateway/
│           ├── .env ✅ (MODIFIÉ - MATERIALS_SERVICE_URL)
│           └── src/
│               └── app.controller.ts ✅ (MODIFIÉ - Routes)
│
└── Documentation/
    ├── README_CORRECTIONS.md ✅ (Vue d'ensemble)
    ├── QUICK_START.md ✅ (Démarrage rapide)
    ├── RESTART_GUIDE.md ✅ (Guide détaillé)
    ├── FINAL_SUMMARY.md ✅ (Résumé complet)
    ├── PROXY_FIX_COMPLETE.md ✅ (Détails proxy)
    ├── ARCHITECTURE_DIAGRAM.md ✅ (Ce fichier)
    ├── check-system.ps1 ✅ (Script Windows)
    └── check-system.sh ✅ (Script Linux/Mac)
```

## 🔐 Variables d'Environnement

### Materials Service (.env)
```env
PORT=3009 ✅
MONGODB_URI=mongodb://localhost:27017/smartsite-materials
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

### API Gateway (.env)
```env
PORT=9001
MATERIALS_SERVICE_URL=http://localhost:3009 ✅
GESTION_PLANING_URL=http://localhost:3002
GESTION_SITE_URL=http://localhost:3001
```

### Frontend (vite.config.ts)
```typescript
proxy: {
  '/api/materials': {
    target: 'http://localhost:3009', ✅
    changeOrigin: true,
  },
  // ... autres routes
}
```

## 🚀 Démarrage

```
1. MongoDB
   └─> mongod (port 27017)

2. Materials Service
   └─> npm start (port 3009)
       └─> Connexion MongoDB
           └─> Initialisation TensorFlow.js
               └─> Prêt à recevoir requêtes

3. Frontend
   └─> npm run dev (port 5173)
       └─> Proxy Vite configuré
           └─> Connexion Materials Service
               └─> Chargement prédictions
                   └─> Affichage tableau
```

## 📊 Flux de Calcul des Prédictions

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. RÉCUPÉRATION DES DONNÉES                                     │
├─────────────────────────────────────────────────────────────────┤
│ MongoDB.materialflowlogs.aggregate([                            │
│   { $match: {                                                   │
│       materialId: ObjectId(...),                                │
│       type: 'OUT',                                              │
│       timestamp: { $gte: thirtyDaysAgo }                        │
│   }},                                                           │
│   { $group: {                                                   │
│       totalOut: { $sum: '$quantity' },                          │
│       firstDate: { $min: '$timestamp' },                        │
│       lastDate: { $max: '$timestamp' }                          │
│   }}                                                            │
│ ])                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. CALCUL DU TAUX DE CONSOMMATION                               │
├─────────────────────────────────────────────────────────────────┤
│ hoursDiff = (lastDate - firstDate) / (1000 * 60 * 60)          │
│ hourlyRate = totalOut / hoursDiff                               │
│ effectiveRate = Math.max(0.1, hourlyRate)                      │
│                                                                  │
│ Si taux fourni:                                                  │
│   effectiveRate = historique * 0.7 + fourni * 0.3              │
│                                                                  │
│ Si météo:                                                        │
│   effectiveRate *= weatherMultiplier                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. CALCUL DES HEURES AVANT RUPTURE                              │
├─────────────────────────────────────────────────────────────────┤
│ hoursToOutOfStock = (currentStock - 0) / effectiveRate         │
│ hoursToLowStock = (currentStock - reorderPoint) / effectiveRate│
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. DÉTERMINATION DU STATUS                                      │
├─────────────────────────────────────────────────────────────────┤
│ if (hoursToOutOfStock < 24)  → 'critical' 🚨                   │
│ if (hoursToOutOfStock < 72)  → 'warning' ⚠️                    │
│ else                          → 'safe' ✅                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. CALCUL DE LA QUANTITÉ RECOMMANDÉE                            │
├─────────────────────────────────────────────────────────────────┤
│ dailyConsumption = effectiveRate * 24                           │
│ targetStock = dailyConsumption * 14 (2 semaines)               │
│ recommended = targetStock - currentStock                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. RETOUR DE LA PRÉDICTION                                      │
├─────────────────────────────────────────────────────────────────┤
│ {                                                                │
│   materialId,                                                    │
│   materialName,                                                  │
│   currentStock,                                                  │
│   consumptionRate: effectiveRate,                               │
│   hoursToOutOfStock,                                            │
│   hoursToLowStock,                                              │
│   status,                                                        │
│   recommendedOrderQuantity,                                     │
│   confidence,                                                    │
│   message                                                        │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
```

## ✅ Points de Vérification

```
┌─────────────────────────────────────────────────────────────────┐
│ CHECKLIST DE VÉRIFICATION                                       │
├─────────────────────────────────────────────────────────────────┤
│ ☐ MongoDB démarré (port 27017)                                 │
│ ☐ Materials Service démarré (port 3009)                        │
│ ☐ Frontend démarré (port 5173)                                 │
│ ☐ Proxy Vite configuré (localhost:3009)                        │
│ ☐ Endpoints accessibles:                                        │
│   ☐ GET http://localhost:3009/api/materials                    │
│   ☐ GET http://localhost:3009/api/materials/predictions/all    │
│   ☐ GET http://localhost:3009/api/material-flow                │
│ ☐ Page Materials charge sans erreur                            │
│ ☐ Prédictions affichées correctement                           │
│ ☐ Format correct (pas de "Invalid Date")                       │
│ ☐ Tooltip fonctionne au survol                                 │
│ ☐ Mise à jour automatique active                               │
└─────────────────────────────────────────────────────────────────┘
```

---

**Date**: 29 avril 2026  
**Version**: 1.0  
**Status**: ✅ ARCHITECTURE DOCUMENTÉE
