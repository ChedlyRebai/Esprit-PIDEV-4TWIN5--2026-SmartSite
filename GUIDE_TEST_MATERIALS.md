# 🧪 GUIDE DE TEST - MATERIALS SYSTEM

## 📋 Objectif

Ce guide vous permet de tester **l'ensemble du système materials** pour vérifier que tout fonctionne correctement avant de tester en frontend.

---

## 🚀 ÉTAPE 1: Démarrer les Services

### 1.1 Backend Materials Service (NestJS)

```bash
# Terminal 1
cd apps/backend/materials-service
npm install  # Si pas encore fait
npm run start:dev
```

**Vérification**: Vous devriez voir:
```
✅ Service: http://localhost:3002/api
💬 Chat health: http://localhost:3002/api/chat/health
📦 Matériaux: http://localhost:3002/api/materials
```

### 1.2 ML-Prediction Service (FastAPI Python)

```bash
# Terminal 2
cd apps/backend/ml-prediction-service

# Créer environnement virtuel (première fois seulement)
python -m venv venv

# Activer environnement virtuel
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Installer dépendances (première fois seulement)
pip install -r requirements.txt

# Démarrer le service
python main.py
```

**Vérification**: Vous devriez voir:
```
🚀 Starting ML Prediction Service...
📂 Training models with datasets...
🔵 Training stock prediction model...
✅ Loaded X rows from stock-prediction.csv
✅ Stock prediction model trained successfully!
🔵 Training anomaly detection model...
✅ Loaded X rows from anomaly-detection.csv
✅ Anomaly detection model trained successfully!
✅ All models trained successfully!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 1.3 Frontend (React)

```bash
# Terminal 3
cd apps/frontend
npm install  # Si pas encore fait
npm run dev
```

**Vérification**: Vous devriez voir:
```
VITE v5.x.x  ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

## 🧪 ÉTAPE 2: Tests Automatiques

### 2.1 Installer les dépendances du script de test

```bash
# À la racine du projet
npm install axios chalk
```

### 2.2 Lancer le script de test

```bash
node test-materials-system.js
```

**Ce script teste**:
- ✅ ML-Prediction Service (health, datasets, prédictions, anomalies)
- ✅ Backend Materials Service (dashboard, matériaux, prédictions, sites, fournisseurs, météo)
- ✅ Connexions MongoDB (sites, fournisseurs)
- ✅ Workflow complet (création → prédiction → fournisseurs)

**Résultat attendu**:
```
🧪 TEST COMPLET - MATERIALS SYSTEM
================================================================================

📋 ML-PREDICTION SERVICE (FastAPI - Port 8000)
✅ Health check ML service
✅ Dataset statistics
✅ Stock prediction endpoint
✅ Consumption anomaly detection

📋 BACKEND MATERIALS SERVICE (NestJS - Port 3002)
✅ Dashboard statistics
✅ Get all materials
✅ Get all ML predictions
✅ Get sites from MongoDB
✅ Get suppliers from MongoDB
✅ Weather API endpoint
✅ Batch anomaly detection

📋 MONGODB CONNECTIONS
✅ MongoDB sites connection
✅ MongoDB suppliers connection

📋 FULL INTEGRATION TESTS
✅ Full workflow: Create → Predict → Suppliers

📊 RÉSUMÉ DES TESTS
Total tests: 14
✅ Passed: 14
❌ Failed: 0
⏱️  Duration: X.XXs

🎉 TOUS LES TESTS SONT PASSÉS !
```

---

## 🔍 ÉTAPE 3: Tests Manuels (curl)

### 3.1 Test ML-Prediction Service

```bash
# Health check
curl http://localhost:8000/health

# Dataset stats
curl http://localhost:8000/datasets/stats

# Stock prediction
curl -X POST http://localhost:8000/predict/stock \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "test123",
    "material_name": "Ciment Portland",
    "current_stock": 50,
    "minimum_stock": 10,
    "consumption_rate": 5,
    "days_to_predict": 7
  }'

# Anomaly detection
curl -X POST http://localhost:8000/predict/consumption-anomaly \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "test456",
    "material_name": "Béton",
    "current_consumption": 150,
    "average_consumption": 50,
    "std_consumption": 10
  }'
```

### 3.2 Test Backend Materials Service

```bash
# Dashboard
curl http://localhost:3002/api/materials/dashboard

# Liste matériaux
curl http://localhost:3002/api/materials

# Prédictions ML
curl http://localhost:3002/api/materials/predictions/all

# Sites
curl http://localhost:3002/api/materials/sites

# Fournisseurs
curl http://localhost:3002/api/materials/suppliers

# Météo (Tunis)
curl "http://localhost:3002/api/materials/weather?lat=36.8065&lng=10.1815"

# Anomalies
curl http://localhost:3002/api/materials/anomalies/detect
```

---

## 🌐 ÉTAPE 4: Tests Frontend

### 4.1 Ouvrir l'application

```
http://localhost:5173
```

### 4.2 Tester la page Materials

1. **Aller sur la page Materials**
   - Cliquer sur "Materials" dans le menu

2. **Vérifier la liste des matériaux**
   - ✅ Les matériaux s'affichent
   - ✅ Les quantités sont correctes
   - ✅ Les badges de statut (In Stock, Low Stock, Out of Stock) sont corrects

3. **Tester l'onglet Predictions**
   - Cliquer sur l'onglet "Predictions"
   - ✅ Les prédictions ML s'affichent
   - ✅ Les statuts (safe, warning, critical) sont corrects
   - ✅ Les jours avant rupture sont affichés
   - ✅ Les quantités recommandées sont calculées

4. **Tester les détails d'un matériau**
   - Cliquer sur un matériau
   - ✅ Le modal s'ouvre
   - ✅ Les informations de base s'affichent
   - ✅ Le widget météo s'affiche (si coordonnées GPS)
   - ✅ Le widget prédiction AI s'affiche
   - ✅ L'historique des mouvements s'affiche
   - ✅ Les stats agrégées (entrées, sorties, anomalies) s'affichent

5. **Tester la commande fournisseur**
   - Cliquer sur "Order" pour un matériau en stock bas
   - ✅ La liste des fournisseurs s'affiche
   - ✅ Les fournisseurs sont triés par distance (si coordonnées GPS)
   - ✅ Les informations fournisseur sont complètes

### 4.3 Tester la page Anomaly Detection

1. **Aller sur la page Anomaly Detection**
   - Cliquer sur "Anomaly Detection" dans le menu

2. **Détecter les anomalies**
   - Cliquer sur "Detect Anomalies"
   - ✅ Les anomalies s'affichent par catégorie
   - ✅ Theft Risk (Vol)
   - ✅ Waste Risk (Gaspillage)
   - ✅ Over Consumption (Surconsommation)

3. **Vérifier les détails des anomalies**
   - ✅ Nom du matériau
   - ✅ Site assigné
   - ✅ Consommation actuelle vs moyenne
   - ✅ Pourcentage de déviation
   - ✅ Niveau de sévérité
   - ✅ Message d'alerte
   - ✅ Action recommandée

### 4.4 Tester la page Site Consumption

1. **Aller sur la page Site Consumption**
   - Cliquer sur "Site Consumption" dans le menu

2. **Sélectionner un site**
   - Choisir un site dans le dropdown
   - ✅ Les matériaux du site s'affichent

3. **Ajouter un matériau au site**
   - Cliquer sur "Add Material"
   - Sélectionner un matériau
   - Entrer une quantité initiale
   - Cliquer sur "Add"
   - ✅ Le matériau est ajouté

4. **Enregistrer une consommation**
   - Entrer une quantité consommée
   - Cliquer sur "Add Consumption"
   - ✅ La consommation est enregistrée
   - ✅ La barre de progression se met à jour
   - ✅ L'historique se met à jour

5. **Voir l'historique**
   - Cliquer sur l'onglet "History"
   - ✅ L'historique des consommations s'affiche

6. **Générer un rapport AI**
   - Cliquer sur "AI Report"
   - ✅ Le rapport AI s'affiche avec analyse détaillée

---

## ✅ ÉTAPE 5: Vérification des Logs

### 5.1 Logs Backend (Terminal 1)

**Lors de l'appel à `/predictions/all`**:
```
================================================================================
🔮 [MATERIALS-SERVICE] PREDICTIONS REQUEST
================================================================================
📊 Total Materials: X
✅ FastAPI ML Service: AVAILABLE
🤖 Using FastAPI for ML predictions...

[1/X] Processing: Ciment Portland
   🔗 [HTTP] Calling FastAPI: POST http://localhost:8000/predict/stock
   📤 Request Data:
      ├─ Material: Ciment Portland
      ├─ Current Stock: 50
      ├─ Consumption Rate: 5/day
      └─ Days to Predict: 7
   📥 FastAPI Response:
      ├─ Days Until Stockout: 10
      ├─ Status: warning
      └─ Confidence: 0.85
   ✅ FastAPI Response: 10 days (warning)

================================================================================
✅ [MATERIALS-SERVICE] PREDICTIONS COMPLETE
   ├─ Total Requested: X
   ├─ Successful: X
   ├─ Failed: 0
   └─ Source: FastAPI ML Service (Port 8000)
================================================================================
```

### 5.2 Logs ML-Prediction (Terminal 2)

**Lors d'une prédiction**:
```
================================================================================
🔮 [FASTAPI] STOCK PREDICTION REQUEST
================================================================================
📦 Material: Ciment Portland (ID: test123)
📊 Current Stock: 50
📉 Consumption Rate: 5/day
⚠️  Minimum Stock: 10
📅 Days to Predict: 7

🎯 [FASTAPI] PREDICTION RESULT:
   ├─ Days Until Stockout: 10 days
   ├─ Predicted Stock in 7 days: 15
   ├─ Consumption Rate (ML-adjusted): 5/day
   ├─ Status: WARNING
   ├─ Recommended Order: 150 units
   └─ Confidence: 85.00%
================================================================================
```

### 5.3 Logs Frontend (Console navigateur)

**Lors du chargement des prédictions**:
```
🔮 Fetching all predictions from /predictions/all
✅ Predictions received: [...]
```

**Lors du chargement de la météo**:
```
🌍 Fetching weather for coordinates: 36.8065, 10.1815
✅ Weather fetched: 22°C, Sunny
```

---

## ❌ ÉTAPE 6: Résolution des Problèmes

### Problème 1: ML Service non disponible

**Symptôme**:
```
⚠️  FastAPI ML Service: NOT AVAILABLE
🔄 Falling back to standard prediction service...
```

**Solution**:
1. Vérifier que FastAPI tourne sur port 8000
2. Vérifier les logs FastAPI pour erreurs
3. Vérifier variable d'environnement `ML_PREDICTION_SERVICE_URL`

### Problème 2: Datasets non trouvés

**Symptôme**:
```
❌ Error training stock prediction model: [Errno 2] No such file or directory: 'stock-prediction.csv'
```

**Solution**:
1. Vérifier que `stock-prediction.csv` et `anomaly-detection.csv` existent
2. Vérifier le chemin relatif dans `main.py`
3. Copier les datasets dans le bon dossier

### Problème 3: MongoDB non connecté

**Symptôme**:
```
❌ Erreur de connexion MongoDB fournisseurs
```

**Solution**:
1. Vérifier que MongoDB tourne
2. Vérifier variable `SUPPLIERS_MONGODB_URI`
3. Vérifier que la base `smartsite-fournisseurs` existe

### Problème 4: Météo non disponible

**Symptôme**:
```
⚠️ Clé API météo non configurée
```

**Solution**:
1. Obtenir une clé API sur https://openweathermap.org/api
2. Ajouter `OPENWEATHER_API_KEY` dans `.env`
3. Redémarrer le backend

### Problème 5: CORS errors

**Symptôme**:
```
Access to XMLHttpRequest at 'http://localhost:3002/api/materials' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution**:
1. Vérifier `CORS_ORIGIN` dans backend `.env`
2. Ajouter `http://localhost:5173` si manquant
3. Redémarrer le backend

---

## 📊 ÉTAPE 7: Checklist Finale

### Backend
- [ ] Service démarré sur port 3002
- [ ] Variables d'environnement configurées
- [ ] MongoDB connecté (materials, sites, fournisseurs)
- [ ] Logs sans erreurs

### ML-Prediction
- [ ] Service démarré sur port 8000
- [ ] Modèles entraînés avec succès
- [ ] Datasets chargés
- [ ] Logs sans erreurs

### Frontend
- [ ] Application démarrée sur port 5173
- [ ] Page Materials accessible
- [ ] Prédictions ML affichées
- [ ] Détails matériaux fonctionnels
- [ ] Anomalies détectées
- [ ] Site Consumption fonctionnel

### Tests
- [ ] Script de test automatique passé (14/14)
- [ ] Tests manuels curl réussis
- [ ] Tests frontend réussis
- [ ] Logs cohérents

---

## 🎉 CONCLUSION

Si tous les tests sont passés, votre système materials est **complètement fonctionnel** et prêt pour la production !

**Prochaines étapes**:
1. Tester avec des données réelles
2. Optimiser les performances
3. Ajouter des tests unitaires
4. Déployer en production

---

**Date**: 2 Mai 2026
**Statut**: ✅ SYSTÈME TESTÉ ET FONCTIONNEL
