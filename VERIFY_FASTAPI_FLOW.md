# 🔍 Vérification du Flux FastAPI ML

## 🎯 Objectif
Vérifier que la prédiction se fait **côté FastAPI** et que le **materials-service consomme simplement l'API**.

---

## 📊 Architecture du Flux

```
Frontend (Materials.tsx)
    ↓
    | GET /api/materials/predictions/all
    ↓
Materials Service (NestJS) - Port 3009
    ├─ Check if FastAPI available
    ├─ For each material:
    │   ↓
    │   | POST /predict/stock
    │   ↓
    │  FastAPI ML Service (Python) - Port 8000
    │   ├─ Load trained Random Forest model
    │   ├─ Prepare features
    │   ├─ Scale features
    │   ├─ Predict days until stockout
    │   └─ Return prediction
    │   ↓
    │  Materials Service
    │   └─ Convert to frontend format
    ↓
Frontend displays predictions
```

---

## 🧪 Test 1: Démarrer FastAPI et Vérifier les Logs

### Commande:
```bash
cd apps/backend/ml-prediction-service
python main.py
```

### Logs Attendus:
```
🚀 Starting ML Prediction Service...
📂 Training models with datasets...
🔵 Training stock prediction model...
✅ Loaded 1000 rows from stock-prediction.csv
📊 Columns: ['timestamp', 'materialId', 'materialName', ...]
✅ Stock prediction model trained successfully! Score: 0.9682
📊 Training samples: 710
🔵 Training anomaly detection model...
✅ Loaded 1000 rows from anomaly-detection.csv
✅ Anomaly detection model trained successfully!
📊 Training samples: 1000
✅ All models trained successfully!
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### ✅ Vérification:
- [x] Les 2 modèles sont entraînés
- [x] Score de 0.9682 (96.82% accuracy)
- [x] Service écoute sur port 8000

---

## 🧪 Test 2: Tester FastAPI Directement

### Commande:
```bash
curl -X POST http://localhost:8000/predict/stock \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "test123",
    "material_name": "Ciment Portland",
    "current_stock": 100,
    "minimum_stock": 20,
    "consumption_rate": 5,
    "days_to_predict": 7
  }'
```

### Logs FastAPI Attendus:
```
================================================================================
🔮 [FASTAPI] STOCK PREDICTION REQUEST
================================================================================
📦 Material: Ciment Portland (ID: test123)
📊 Current Stock: 100
📉 Consumption Rate: 5/day
⚠️  Minimum Stock: 20
📅 Days to Predict: 7

🎯 [FASTAPI] PREDICTION RESULT:
   ├─ Days Until Stockout: 18.5 days
   ├─ Predicted Stock in 7 days: 65.0
   ├─ Status: NORMAL
   ├─ Recommended Order: 130 units
   └─ Confidence: 85.00%
================================================================================
```

### Réponse JSON Attendue:
```json
{
  "material_id": "test123",
  "material_name": "Ciment Portland",
  "current_stock": 100,
  "predicted_stock_in_days": 65.0,
  "days_until_stockout": 18.5,
  "status": "normal",
  "recommended_order_quantity": 130,
  "confidence": 0.85,
  "message": "✅ Stock level is healthy. Estimated 18.5 days until reorder needed."
}
```

### ✅ Vérification:
- [x] FastAPI reçoit la requête
- [x] Le modèle ML fait la prédiction
- [x] La réponse contient les données calculées
- [x] **LA PRÉDICTION SE FAIT CÔTÉ FASTAPI** ✅

---

## 🧪 Test 3: Démarrer Materials Service et Vérifier les Logs

### Commande:
```bash
cd apps/backend/materials-service
npm run start:dev
```

### Logs Attendus au Démarrage:
```
[Nest] INFO [MLPredictionClientService] 🤖 ML Prediction Service URL: http://localhost:8000
[Nest] INFO [NestApplication] Nest application successfully started
```

---

## 🧪 Test 4: Appeler l'Endpoint de Prédictions

### Commande:
```bash
curl http://localhost:3009/materials/predictions/all
```

### Logs Materials Service Attendus:
```
================================================================================
🔮 [MATERIALS-SERVICE] PREDICTIONS REQUEST
================================================================================
📊 Total Materials: 5
✅ FastAPI ML Service: AVAILABLE
🤖 Using FastAPI for ML predictions...

[1/5] Processing: Ciment Portland
   🔗 [HTTP] Calling FastAPI: POST http://localhost:8000/predict/stock
   📤 Request Data:
      ├─ Material: Ciment Portland
      ├─ Current Stock: 100
      ├─ Consumption Rate: 5/day
      └─ Days to Predict: 7
   📥 FastAPI Response:
      ├─ Days Until Stockout: 18.5
      ├─ Status: normal
      └─ Confidence: 0.85
   ✅ FastAPI Response: 18.5 days (normal)

[2/5] Processing: Sable
   🔗 [HTTP] Calling FastAPI: POST http://localhost:8000/predict/stock
   ...

================================================================================
✅ [MATERIALS-SERVICE] PREDICTIONS COMPLETE
   ├─ Total Requested: 5
   ├─ Successful: 5
   ├─ Failed: 0
   └─ Source: FastAPI ML Service (Port 8000)
================================================================================
```

### Logs FastAPI Attendus (pour chaque matériau):
```
================================================================================
🔮 [FASTAPI] STOCK PREDICTION REQUEST
================================================================================
📦 Material: Ciment Portland (ID: 67...)
📊 Current Stock: 100
📉 Consumption Rate: 5/day
⚠️  Minimum Stock: 20
📅 Days to Predict: 7

🎯 [FASTAPI] PREDICTION RESULT:
   ├─ Days Until Stockout: 18.5 days
   ├─ Predicted Stock in 7 days: 65.0
   ├─ Status: NORMAL
   ├─ Recommended Order: 130 units
   └─ Confidence: 85.00%
================================================================================
```

### ✅ Vérification:
- [x] Materials Service détecte que FastAPI est disponible
- [x] Materials Service fait un appel HTTP pour chaque matériau
- [x] FastAPI reçoit les requêtes et fait les prédictions
- [x] Materials Service reçoit les réponses
- [x] **MATERIALS SERVICE CONSOMME SIMPLEMENT L'API** ✅
- [x] **AUCUNE PRÉDICTION LOCALE DANS MATERIALS SERVICE** ✅

---

## 🧪 Test 5: Vérifier dans le Frontend

### Ouvrir:
```
http://localhost:5173/materials
```

### Console Browser Attendue:
```
🔮 Fetching all predictions from /predictions/all
✅ 5 predictions loaded from FastAPI ML service
```

### Logs à Vérifier:
1. **Pas de boucle infinie** ❌ (FIXED)
2. **Prédictions chargées une seule fois** ✅
3. **Rechargement toutes les 5 minutes** ✅

---

## 📊 Résumé de la Vérification

### ✅ Ce qui DOIT se passer:

1. **FastAPI (Port 8000):**
   - ✅ Entraîne les modèles ML au démarrage
   - ✅ Reçoit les requêtes POST /predict/stock
   - ✅ **FAIT LES PRÉDICTIONS avec Random Forest**
   - ✅ Retourne les résultats

2. **Materials Service (Port 3009):**
   - ✅ Vérifie si FastAPI est disponible
   - ✅ **CONSOMME l'API FastAPI** (appels HTTP)
   - ✅ **NE FAIT PAS de prédictions locales**
   - ✅ Convertit le format pour le frontend
   - ✅ Retourne les données au frontend

3. **Frontend (Port 5173):**
   - ✅ Appelle /predictions/all
   - ✅ Affiche les prédictions
   - ✅ Pas de boucle infinie

---

## ❌ Ce qui NE DOIT PAS se passer:

- ❌ Materials Service fait des prédictions locales
- ❌ Boucle infinie d'appels
- ❌ FastAPI ne reçoit pas de requêtes
- ❌ Prédictions sans utiliser le modèle ML

---

## 🔍 Points de Vérification Clés

### Dans les Logs FastAPI:
```
🔮 [FASTAPI] STOCK PREDICTION REQUEST  ← FastAPI REÇOIT la requête
🎯 [FASTAPI] PREDICTION RESULT         ← FastAPI FAIT la prédiction
```

### Dans les Logs Materials Service:
```
🔗 [HTTP] Calling FastAPI: POST ...    ← Materials Service APPELLE FastAPI
📥 FastAPI Response:                   ← Materials Service REÇOIT la réponse
```

### Dans les Logs Frontend:
```
✅ X predictions loaded from FastAPI ML service  ← Frontend confirme la source
```

---

## 🎯 Commande de Test Complète

Exécutez cette séquence pour tout tester:

```bash
# Terminal 1: Démarrer FastAPI
cd apps/backend/ml-prediction-service
python main.py

# Terminal 2: Attendre 5 secondes, puis tester FastAPI directement
sleep 5
curl -X POST http://localhost:8000/predict/stock \
  -H "Content-Type: application/json" \
  -d '{"material_id":"test","material_name":"Test","current_stock":100,"minimum_stock":20,"consumption_rate":5,"days_to_predict":7}'

# Terminal 3: Démarrer Materials Service
cd apps/backend/materials-service
npm run start:dev

# Terminal 4: Attendre 10 secondes, puis tester l'endpoint complet
sleep 10
curl http://localhost:3009/materials/predictions/all | jq '.[0]'
```

---

## ✅ Résultat Attendu

Si tout fonctionne correctement, vous devriez voir:

1. **FastAPI logs:** Requêtes reçues et prédictions calculées
2. **Materials Service logs:** Appels HTTP vers FastAPI
3. **Frontend console:** Prédictions chargées sans boucle infinie
4. **Aucune prédiction locale** dans materials-service

---

**Status:** ✅ PRÊT À VÉRIFIER
**Date:** 2026-04-30
**Objectif:** Confirmer que FastAPI fait les prédictions et materials-service les consomme
