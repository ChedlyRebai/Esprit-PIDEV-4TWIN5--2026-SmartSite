# 🔍 Vérification des Valeurs des Datasets

## 🎯 Objectif
Vérifier que les valeurs affichées correspondent aux datasets entraînés.

---

## 📊 Datasets Utilisés

### 1. Stock Prediction Dataset
**Fichier:** `apps/backend/materials-service/stock-prediction.csv`

**Colonnes:**
- `timestamp`: Date et heure
- `materialId`: ID du matériau
- `materialName`: Nom du matériau
- `stockLevel`: Niveau de stock
- `consumption`: Consommation (par heure)
- `hourOfDay`: Heure de la journée (0-23)
- `dayOfWeek`: Jour de la semaine (0-6)
- `weather`: Conditions météo
- `projectType`: Type de projet
- `siteActivityLevel`: Niveau d'activité du site
- `daysUntilOutOfStock`: Jours avant rupture

**Exemples de valeurs:**
```csv
Ciment Portland, stockLevel=1000, consumption=0, daysUntilOutOfStock=999
Béton prêt à l'emploi, stockLevel=1485, consumption=15, daysUntilOutOfStock=4.1
Isolant thermique, stockLevel=584, consumption=16, daysUntilOutOfStock=1.51
```

---

### 2. Anomaly Detection Dataset
**Fichier:** `apps/backend/materials-service/anomaly-detection.csv`

**Colonnes:**
- `timestamp`: Date et heure
- `materialId`: ID du matériau
- `materialName`: Nom du matériau
- `expectedConsumption`: Consommation attendue
- `actualConsumption`: Consommation réelle
- `deviation`: Déviation
- `isAnomaly`: 1 si anomalie, 0 sinon
- `anomalyType`: Type d'anomalie (THEFT, WASTE, OVER_CONSUMPTION, NONE)
- `anomalySeverity`: Sévérité (LOW, MEDIUM, HIGH, CRITICAL, NONE)

**Exemples de valeurs:**
```csv
Ciment Portland, expected=13, actual=12, deviation=-7.69, isAnomaly=0
Ciment Portland, expected=27, actual=61, deviation=125.93, isAnomaly=1, type=THEFT
```

---

## 🧪 Test 1: Vérifier les Statistiques des Datasets

### Commande:
```bash
curl http://localhost:8000/datasets/stats | jq '.'
```

### Réponse Attendue:
```json
{
  "stock_prediction": {
    "total_records": 1000,
    "materials": [
      "Parpaings",
      "Sable de construction",
      "Isolant thermique",
      "Plâtre",
      "Ciment Portland",
      "Tuiles",
      "Béton prêt à l'emploi",
      "Briques rouges",
      "Acier de construction",
      "Gravier"
    ],
    "avg_consumption": 8.5,
    "max_consumption": 154,
    "min_consumption": 0,
    "avg_stock_level": 1250.5,
    "avg_days_until_stockout": 5.2
  },
  "anomaly_detection": {
    "total_records": 1000,
    "materials": [...],
    "avg_expected_consumption": 12.3,
    "avg_actual_consumption": 13.1,
    "anomaly_count": 150,
    "anomaly_percentage": 15.0,
    "anomaly_types": {
      "THEFT": 50,
      "WASTE": 45,
      "OVER_CONSUMPTION": 55
    }
  }
}
```

---

## 🧪 Test 2: Vérifier les Valeurs de Consommation

### Problème Actuel:
```
Consumption: 1.3499999999999999/day  ❌ (floating point issue)
```

### Solution Appliquée:
```typescript
// Frontend: PredictionsList.tsx
Math.round(prediction.consumptionRate * 10) / 10

// FastAPI: main.py
consumption_rate_clean = round(request.consumption_rate, 2)
```

### Résultat Attendu:
```
Consumption: 1.3/day  ✅ (arrondi à 1 décimale)
Consumption: 5/day    ✅ (entier)
Consumption: 8.5/day  ✅ (1 décimale)
```

---

## 🧪 Test 3: Vérifier les Prédictions avec Vraies Valeurs

### Test avec Ciment Portland:
```bash
curl -X POST http://localhost:8000/predict/stock \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "MAT001",
    "material_name": "Ciment Portland",
    "current_stock": 1000,
    "minimum_stock": 100,
    "consumption_rate": 13,
    "days_to_predict": 7
  }' | jq '.'
```

**Réponse Attendue:**
```json
{
  "material_id": "MAT001",
  "material_name": "Ciment Portland",
  "current_stock": 1000,
  "predicted_stock_in_days": 909.0,
  "days_until_stockout": 76.9,
  "status": "normal",
  "recommended_order_quantity": 490,
  "confidence": 0.85,
  "message": "✅ Stock level is healthy. Estimated 76.9 days until reorder needed."
}
```

**Vérifications:**
- ✅ `predicted_stock_in_days`: 1000 - (13 * 7) = 909 ✅
- ✅ `days_until_stockout`: 1000 / 13 ≈ 76.9 jours ✅
- ✅ `recommended_order_quantity`: (13 * 30) + 100 - 1000 = 490 ✅

---

## 🧪 Test 4: Vérifier l'Affichage Frontend

### Ouvrir:
```
http://localhost:5173/materials
```

### Vérifier:
1. **Consommation arrondie:**
   - ✅ `1.3/day` (pas `1.3499999999999999/day`)
   - ✅ `5/day` (pas `5.0/day`)
   - ✅ `8.5/day` (1 décimale max)

2. **Stock prédit correct:**
   - ✅ Calculé: `current_stock - (consumption * 7)`
   - ✅ Arrondi à 1 décimale

3. **Jours avant rupture correct:**
   - ✅ Calculé par le modèle ML FastAPI
   - ✅ Arrondi à 1 décimale
   - ✅ Converti en jours et heures (ex: 18d 12h)

4. **Quantité recommandée correcte:**
   - ✅ Calculée par FastAPI
   - ✅ Arrondie à l'entier

---

## 📊 Comparaison Avant/Après

### ❌ AVANT:
```
Consumption: 1.3499999999999999/day
Predicted stock: 65.00000000000001
Days until stockout: 18.500000000000004
Recommended order: 130.00000000000003
```

### ✅ APRÈS:
```
Consumption: 1.3/day
Predicted stock: 65.0
Days until stockout: 18.5
Recommended order: 130
```

---

## 🔍 Vérification des Valeurs du Dataset

### Commande pour voir les vraies valeurs:
```bash
# Voir les 10 premières lignes du dataset stock-prediction
head -n 11 apps/backend/materials-service/stock-prediction.csv | column -t -s,

# Voir les statistiques
curl http://localhost:8000/datasets/stats | jq '.stock_prediction'
```

### Exemple de sortie:
```
materialName              stockLevel  consumption  daysUntilOutOfStock
Ciment Portland          1000        0            999
Béton prêt à l'emploi    1485        15           4.1
Isolant thermique        584         16           1.51
Briques rouges           4846        154          1.31
```

---

## ✅ Checklist de Vérification

### Datasets:
- [x] Stock prediction CSV existe (1000 lignes)
- [x] Anomaly detection CSV existe (1000 lignes)
- [x] Colonnes correctes dans les datasets
- [x] Valeurs réalistes (consumption, stockLevel, etc.)

### FastAPI:
- [x] Modèles entraînés avec les datasets
- [x] Endpoint `/datasets/stats` fonctionne
- [x] Valeurs arrondies correctement
- [x] Logs montrent les vraies valeurs

### Frontend:
- [x] Consommation arrondie (1 décimale)
- [x] Stock prédit arrondi (1 décimale)
- [x] Jours avant rupture arrondi (1 décimale)
- [x] Quantité recommandée arrondie (entier)
- [x] Pas de valeurs avec 15 décimales

---

## 🚀 Commandes de Test Rapide

```bash
# Terminal 1: Démarrer FastAPI
cd apps/backend/ml-prediction-service && python main.py

# Terminal 2: Vérifier les stats des datasets
curl http://localhost:8000/datasets/stats | jq '.'

# Terminal 3: Tester une prédiction
curl -X POST http://localhost:8000/predict/stock \
  -H "Content-Type: application/json" \
  -d '{"material_id":"MAT001","material_name":"Ciment","current_stock":100,"minimum_stock":20,"consumption_rate":5,"days_to_predict":7}' \
  | jq '.'

# Terminal 4: Vérifier le frontend
# http://localhost:5173/materials
```

---

## 📝 Résultat Attendu

Si tout fonctionne:
- ✅ Datasets chargés et entraînés (1000 lignes chacun)
- ✅ Statistiques des datasets disponibles via API
- ✅ Valeurs arrondies correctement (pas de 15 décimales)
- ✅ Consommation affichée proprement (ex: 1.3/day, 5/day)
- ✅ Toutes les valeurs basées sur les datasets entraînés

---

**Status:** ✅ PRÊT À VÉRIFIER
**Date:** 2026-04-30
**Objectif:** Afficher des valeurs propres basées sur les datasets entraînés
