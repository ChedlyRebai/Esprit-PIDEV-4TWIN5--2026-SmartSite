# SmartSite ML Prediction Service

FastAPI service for machine learning predictions in SmartSite platform.

## Features

1. **Stock Prediction** - Predict when materials will be out of stock
2. **Consumption Anomaly Detection** - Detect overconsumption or underconsumption

## Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Running the Service

```bash
# Development mode with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Health Check
- `GET /` - Service status
- `GET /health` - Detailed health check

### Predictions
- `POST /predict/stock` - Predict stock depletion
- `POST /predict/consumption-anomaly` - Detect consumption anomalies

### Model Management
- `POST /retrain/stock` - Retrain stock prediction model
- `POST /retrain/anomaly` - Retrain anomaly detection model
- `POST /retrain/all` - Retrain all models

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Datasets

The service uses two CSV datasets:

1. **stock-prediction.csv** - For stock depletion predictions
   - Columns: material_id, current_stock, minimum_stock, consumption_rate, days_until_stockout

2. **anomaly-detection.csv** - For consumption anomaly detection
   - Columns: material_id, consumption, average_consumption, std_consumption, is_anomaly

## Example Requests

### Stock Prediction
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

### Consumption Anomaly Detection
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

## Integration with Materials Service

The materials-service (NestJS) consumes this FastAPI service via HTTP requests.

Configuration in materials-service `.env`:
```env
ML_PREDICTION_SERVICE_URL=http://localhost:8000
```
