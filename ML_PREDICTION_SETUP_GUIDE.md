# Guide Complet - ML Prediction Service avec FastAPI

## 🎯 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              Frontend (React)                                 │
│              Port 5173                                        │
└────────────────────┬─────────────────────────────────────────┘
                     │ HTTP
                     ↓
┌──────────────────────────────────────────────────────────────┐
│         Materials Service (NestJS)                            │
│              Port 3009                                        │
│                                                               │
│  - MLPredictionClientService                                 │
│  - Consomme FastAPI via HTTP                                 │
└────────────────────┬─────────────────────────────────────────┘
                     │ HTTP
                     ↓
┌──────────────────────────────────────────────────────────────┐
│         ML Prediction Service (FastAPI/Python)                │
│              Port 8000                                        │
│                                                               │
│  1. Stock Prediction Model                                   │
│     Dataset: stock-prediction.csv                            │
│     → Prédire quand rupture de stock                         │
│                                                               │
│  2. Consumption Anomaly Detection Model                      │
│     Dataset: anomaly-detection.csv                           │
│     → Détecter surconsommation/sous-consommation             │
└──────────────────────────────────────────────────────────────┘
```

## 📦 Installation

### Étape 1: Installer Python et Dépendances

```bash
# Vérifier Python (version 3.8+)
python --version

# Aller dans le dossier ml-prediction-service
cd apps/backend/ml-prediction-service

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

### Étape 2: Vérifier les Datasets

Les datasets doivent être dans `apps/backend/materials-service/`:
- ✅ `stock-prediction.csv`
- ✅ `anomaly-detection.csv`

## 🚀 Démarrage

### 1. Démarrer FastAPI ML Service

```bash
# Dans apps/backend/ml-prediction-service
cd apps/backend/ml-prediction-service

# Activer l'environnement virtuel
venv\Scripts\activate

# Démarrer le service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Logs attendus:**
```
🚀 Starting ML Prediction Service...
📂 Training models with datasets...
🔵 Training stock prediction model...
✅ Loaded X rows from stock-prediction.csv
✅ Stock prediction model trained successfully! Score: 0.XXXX
🔵 Training anomaly detection model...
✅ Loaded X rows from anomaly-detection.csv
✅ Anomaly detection model trained successfully!
✅ All models trained successfully!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Vérifier FastAPI

Ouvrir dans le navigateur:
- **Swagger UI**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### 3. Démarrer Materials Service

```bash
# Dans apps/backend/materials-service
cd apps/backend/materials-service

# Démarrer le service
npm run start:dev
```

**Vérifier les logs:**
```
🤖 ML Prediction Service URL: http://localhost:8000
```

### 4. Démarrer Frontend

```bash
# Dans apps/frontend
cd apps/frontend

# Démarrer le frontend
npm run dev
```

## 🧪 Tests

### Test 1: Health Check FastAPI

```bash
curl http://localhost:8000/health
```

**Réponse attendue:**
```json
{
  "status": "healthy",
  "timestamp": "2026-04-30T...",
  "models_loaded": {
    "stock_prediction": true,
    "anomaly_detection": true
  }
}
```

### Test 2: Stock Prediction

```bash
curl -X POST "http://localhost:8000/predict/stock" \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "MAT001",
    "material_name": "Ciment",
    "current_stock": 100,
    "minimum_stock": 20,
    "consumption_rate": 15,
    "days_to_predict": 7
  }'
```

**Réponse attendue:**
```json
{
  "material_id": "MAT001",
  "material_name": "Ciment",
  "current_stock": 100,
  "predicted_stock_in_days": -5,
  "days_until_stockout": 6.67,
  "status": "warning",
  "recommended_order_quantity": 470,
  "confidence": 0.85,
  "message": "⚡ WARNING: Stock will be depleted in 6.7 days. Order soon."
}
```

### Test 3: Consumption Anomaly Detection

```bash
curl -X POST "http://localhost:8000/predict/consumption-anomaly" \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "MAT001",
    "material_name": "Ciment",
    "current_consumption": 150,
    "average_consumption": 100,
    "std_consumption": 20
  }'
```

**Réponse attendue:**
```json
{
  "material_id": "MAT001",
  "material_name": "Ciment",
  "consumption_status": "overconsumption",
  "anomaly_score": -0.234,
  "deviation_percentage": 50.0,
  "is_anomaly": true,
  "severity": "critical",
  "message": "🚨 Overconsumption detected: +50.0% above average (150.0 vs 100.0)",
  "recommended_action": "URGENT: Investigate excessive consumption..."
}
```

## 📊 Endpoints FastAPI

### Health & Status
- `GET /` - Service status
- `GET /health` - Detailed health check

### Predictions
- `POST /predict/stock` - Prédire rupture de stock
- `POST /predict/consumption-anomaly` - Détecter anomalies de consommation

### Model Management
- `POST /retrain/stock` - Réentraîner modèle stock
- `POST /retrain/anomaly` - Réentraîner modèle anomalies
- `POST /retrain/all` - Réentraîner tous les modèles

## 🔧 Configuration

### Materials Service `.env`

```env
# ML Prediction Service Configuration
ML_PREDICTION_SERVICE_URL=http://localhost:8000
```

### Utilisation dans NestJS

```typescript
import { MLPredictionClientService } from './services/ml-prediction-client.service';

constructor(
  private readonly mlPredictionService: MLPredictionClientService
) {}

// Prédire rupture de stock
const prediction = await this.mlPredictionService.predictStockDepletion({
  material_id: material._id.toString(),
  material_name: material.name,
  current_stock: material.quantity,
  minimum_stock: material.minimumStock,
  consumption_rate: material.consumptionRate || 10,
  days_to_predict: 7
});

// Détecter anomalie de consommation
const anomaly = await this.mlPredictionService.detectConsumptionAnomaly({
  material_id: material._id.toString(),
  material_name: material.name,
  current_consumption: currentConsumption,
  average_consumption: avgConsumption,
  std_consumption: stdConsumption
});
```

## 📝 Datasets

### stock-prediction.csv

Colonnes requises:
- `material_id` - ID du matériau
- `current_stock` - Stock actuel
- `minimum_stock` - Stock minimum
- `consumption_rate` - Taux de consommation (unités/jour)
- `days_since_last_order` - Jours depuis dernière commande
- `days_until_stockout` - Jours avant rupture (TARGET)

### anomaly-detection.csv

Colonnes requises:
- `material_id` - ID du matériau
- `consumption` - Consommation actuelle
- `average_consumption` - Consommation moyenne
- `std_consumption` - Écart-type de consommation
- `deviation_percentage` - Pourcentage de déviation
- `is_anomaly` - Booléen (0 ou 1)

## 🎯 Résultats Attendus

### Stock Prediction

**Status**:
- `critical` - Rupture dans ≤ 2 jours
- `warning` - Rupture dans 3-10 jours
- `normal` - Rupture dans > 10 jours

**Recommended Order Quantity**:
- Calculé pour 30 jours + stock de sécurité

### Consumption Anomaly

**Consumption Status**:
- `normal` - Déviation < 15%
- `overconsumption` - Déviation > +15%
- `underconsumption` - Déviation < -15%

**Severity**:
- `low` - Déviation 15-30%
- `medium` - Déviation 30-50%
- `high` - Déviation 50-100%
- `critical` - Déviation > 100%

## 🐛 Dépannage

### Problème: FastAPI ne démarre pas

**Solution**:
```bash
# Vérifier Python
python --version

# Réinstaller les dépendances
pip install -r requirements.txt --force-reinstall

# Vérifier les datasets
ls ../materials-service/*.csv
```

### Problème: Models not trained

**Vérifier les logs FastAPI**:
- Datasets trouvés?
- Colonnes correctes?
- Erreurs de training?

**Solution**:
```bash
# Réentraîner manuellement
curl -X POST http://localhost:8000/retrain/all
```

### Problème: Materials Service ne peut pas se connecter

**Vérifier**:
1. FastAPI est démarré sur port 8000
2. Variable `ML_PREDICTION_SERVICE_URL` dans `.env`
3. Pas de firewall bloquant

## 📚 Documentation

- **FastAPI Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Source Code**: `apps/backend/ml-prediction-service/main.py`
- **Client Service**: `apps/backend/materials-service/src/materials/services/ml-prediction-client.service.ts`

## ✅ Checklist

- [ ] Python 3.8+ installé
- [ ] Environnement virtuel créé
- [ ] Dépendances installées (`pip install -r requirements.txt`)
- [ ] Datasets présents (`stock-prediction.csv`, `anomaly-detection.csv`)
- [ ] FastAPI démarré (port 8000)
- [ ] Health check OK (`http://localhost:8000/health`)
- [ ] Models trained (logs FastAPI)
- [ ] Variable `ML_PREDICTION_SERVICE_URL` dans materials-service `.env`
- [ ] Materials Service démarré (port 3009)
- [ ] Frontend démarré (port 5173)
- [ ] Tests de prédiction fonctionnels

## 🚀 Commandes Rapides

```bash
# Démarrer FastAPI
cd apps/backend/ml-prediction-service
venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Démarrer Materials Service
cd apps/backend/materials-service
npm run start:dev

# Démarrer Frontend
cd apps/frontend
npm run dev

# Test rapide
curl http://localhost:8000/health
```
