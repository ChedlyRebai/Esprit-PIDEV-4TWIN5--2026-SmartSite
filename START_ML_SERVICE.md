# 🚀 DÉMARRER LE SERVICE ML PYTHON

## 📋 PRÉREQUIS

1. **Python 3.8+** installé
2. **pip** (gestionnaire de packages Python)
3. **Service ML Python** dans le dossier `ml-service/`

---

## 🔧 INSTALLATION

### 1. Naviguer vers le dossier ML

```bash
cd ml-service
```

### 2. Créer un environnement virtuel (recommandé)

**Windows**:
```bash
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac**:
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

**Dépendances principales**:
- `fastapi` - Framework web
- `uvicorn` - Serveur ASGI
- `scikit-learn` - Machine Learning
- `pandas` - Manipulation de données
- `numpy` - Calculs numériques
- `joblib` - Sauvegarde de modèles

---

## ▶️ DÉMARRAGE

### Option 1: Uvicorn (Recommandé)

```bash
uvicorn main:app --reload --port 8000
```

**Paramètres**:
- `--reload` : Redémarre automatiquement lors des changements
- `--port 8000` : Port d'écoute (par défaut: 8000)

### Option 2: Python Direct

```bash
python main.py
```

### Option 3: Avec Host Spécifique

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## ✅ VÉRIFICATION

### 1. Vérifier que le service est démarré

**Logs attendus**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 2. Tester le Health Check

**Commande**:
```bash
curl http://localhost:8000/health
```

**Réponse attendue**:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "version": "1.0.0",
  "endpoints": [
    "/predict/stock",
    "/predict/consumption-anomaly",
    "/retrain/anomaly",
    "/retrain/all"
  ]
}
```

### 3. Tester la Documentation Interactive

Ouvrir dans le navigateur:
```
http://localhost:8000/docs
```

Vous verrez l'interface **Swagger UI** avec tous les endpoints disponibles.

---

## 🧪 TESTER LA DÉTECTION D'ANOMALIES

### Test Direct (via curl)

```bash
curl -X POST http://localhost:8000/predict/consumption-anomaly \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "test123",
    "material_name": "Ciment Portland",
    "current_consumption": 100,
    "average_consumption": 20,
    "std_consumption": 5
  }'
```

**Réponse attendue** (anomalie):
```json
{
  "material_id": "test123",
  "material_name": "Ciment Portland",
  "consumption_status": "overconsumption",
  "anomaly_score": 0.95,
  "deviation_percentage": 400,
  "is_anomaly": true,
  "severity": "critical",
  "message": "🚨 Consommation excessive détectée - Risque de vol ou gaspillage",
  "recommended_action": "Vérifier immédiatement les mouvements de stock"
}
```

### Test via l'Interface

1. Ouvrir `http://localhost:8000/docs`
2. Cliquer sur `POST /predict/consumption-anomaly`
3. Cliquer sur "Try it out"
4. Entrer les données de test
5. Cliquer sur "Execute"
6. Voir la réponse

---

## 🔄 RÉENTRAÎNER LE MODÈLE

### Réentraîner le Modèle d'Anomalies

```bash
curl -X POST http://localhost:8000/retrain/anomaly
```

### Réentraîner Tous les Modèles

```bash
curl -X POST http://localhost:8000/retrain/all
```

**Note**: Le réentraînement peut prendre quelques minutes selon la taille du dataset.

---

## 🐛 DÉPANNAGE

### Problème 1: Port déjà utilisé

**Erreur**:
```
ERROR: [Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000)
```

**Solution**:
```bash
# Utiliser un autre port
uvicorn main:app --reload --port 8001
```

**Ou tuer le processus**:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### Problème 2: Module non trouvé

**Erreur**:
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution**:
```bash
# Vérifier que l'environnement virtuel est activé
# Réinstaller les dépendances
pip install -r requirements.txt
```

### Problème 3: Modèle non chargé

**Erreur**:
```
WARNING: Model file not found, using default model
```

**Solution**:
```bash
# Entraîner le modèle
curl -X POST http://localhost:8000/retrain/anomaly
```

---

## 📊 ENDPOINTS DISPONIBLES

### 1. Health Check
```
GET /health
```
Vérifier l'état du service

### 2. Prédiction de Stock
```
POST /predict/stock
```
Prédire quand un matériau sera en rupture

### 3. Détection d'Anomalies
```
POST /predict/consumption-anomaly
```
Détecter les anomalies de consommation

### 4. Réentraînement
```
POST /retrain/anomaly
POST /retrain/stock
POST /retrain/all
```
Réentraîner les modèles ML

---

## 🔗 INTÉGRATION AVEC NESTJS

### Configuration

**Fichier**: `.env` (backend NestJS)
```env
ML_PREDICTION_SERVICE_URL=http://localhost:8000
```

### Vérification de la Connexion

**Logs NestJS à chercher**:
```
🤖 ML Prediction Service URL: http://localhost:8000
🤖 Using ML model for anomaly detection...
✅ ML Model Response:
   Status: overconsumption
   Severity: high
```

**Si le service n'est pas disponible**:
```
⚠️ ML service not available, using statistical fallback
```

---

## 📝 STRUCTURE DU SERVICE ML

```
ml-service/
├── main.py                 # Point d'entrée FastAPI
├── requirements.txt        # Dépendances Python
├── models/                 # Modèles ML entraînés
│   ├── anomaly_model.pkl
│   └── stock_model.pkl
├── data/                   # Datasets d'entraînement
│   ├── consumption_data.csv
│   └── anomaly_data.csv
└── utils/                  # Utilitaires
    ├── preprocessing.py
    └── training.py
```

---

## 🎯 CHECKLIST DE DÉMARRAGE

- [ ] Python 3.8+ installé
- [ ] Environnement virtuel créé et activé
- [ ] Dépendances installées (`pip install -r requirements.txt`)
- [ ] Service démarré (`uvicorn main:app --reload --port 8000`)
- [ ] Health check réussit (`curl http://localhost:8000/health`)
- [ ] Documentation accessible (`http://localhost:8000/docs`)
- [ ] Test d'anomalie réussit
- [ ] Backend NestJS connecté (logs montrent "Using ML model")

---

## 🚀 COMMANDES RAPIDES

```bash
# Démarrage complet
cd ml-service
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Vérification
curl http://localhost:8000/health

# Test
curl -X POST http://localhost:8000/predict/consumption-anomaly \
  -H "Content-Type: application/json" \
  -d '{"material_id":"test","material_name":"Test","current_consumption":100,"average_consumption":20,"std_consumption":5}'
```

---

## 📞 SUPPORT

Si le service ne démarre pas:
1. Vérifier les logs d'erreur
2. Vérifier que Python 3.8+ est installé
3. Vérifier que toutes les dépendances sont installées
4. Vérifier que le port 8000 est libre
5. Consulter `ANOMALY_DETECTION_ML.md` pour plus de détails

---

**Date**: 3 Mai 2026
**Version**: 1.0.0
**Statut**: ✅ READY TO START
