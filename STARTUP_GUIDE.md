# Materials Service - Complete Startup Guide

## 🚀 Quick Start

### 1. Prerequisites
- MongoDB running on `localhost:27017`
- Node.js installed
- All dependencies installed (`npm install` in each service)

### 2. Port Configuration

**IMPORTANT**: Materials Service now runs on **PORT 3009** (changed from 3002 to avoid conflict with Planning Service)

| Service | Port |
|---------|------|
| User Authentication | 3000 |
| Gestion Site | 3001 |
| Gestion Planning | 3002 |
| Incident Management | 3003 |
| Notification | 3004 |
| Resource Optimization | 3007 |
| Paiement | 3008 |
| **Materials Service** | **3009** |
| Gestion Projects | 3010 |
| API Gateway | 9001 |
| Frontend | 5173 |

### 3. Start Services

#### Option A: Start All Services
```bash
# Terminal 1: MongoDB (if not running as service)
mongod

# Terminal 2: API Gateway
cd apps/backend/api-gateway
npm run start:dev

# Terminal 3: Materials Service
cd apps/backend/materials-service
npm run start:dev

# Terminal 4: Frontend
cd apps/frontend
npm run dev
```

#### Option B: Start Only Materials Service
```bash
cd apps/backend/materials-service
npm run start:dev
```

### 4. Verify Services

#### Check Materials Service
```bash
curl http://localhost:3009/api/materials
```

#### Check API Gateway Routing
```bash
curl http://localhost:9001/materials
```

#### Check Frontend Connection
Open browser: `http://localhost:5173`
Navigate to Materials page

---

## 🔧 Configuration Files Updated

### 1. `apps/backend/materials-service/.env`
```env
PORT=3009  # Changed from 3002
MONGODB_URI=mongodb://localhost:27017/smartsite-materials
```

### 2. `apps/backend/api-gateway/.env`
```env
MATERIALS_SERVICE_URL=http://localhost:3009  # Added
INCIDENT_URL=http://localhost:3003  # Added
```

### 3. `apps/backend/api-gateway/src/app.controller.ts`
- Added materials service routing
- Added material-flow routing

### 4. `apps/frontend/src/services/materialFlowService.ts`
```typescript
const API_URL = '/api/material-flow';  // Changed from '/api/materials/flow-log'
```

---

## 🐛 Bug Fixes Applied

### 1. Frontend - Materials.tsx (Line 604)
**Issue**: `Cannot read properties of undefined (reading 'toFixed')`

**Fix**: Added null coalescing operator
```typescript
// Before
{prediction.consumptionRate.toFixed(2)}

// After
{(prediction.consumptionRate ?? 0).toFixed(2)}
```

### 2. Backend - Stock Prediction Service
**Issue**: Consumption rate calculation not using real data from MaterialFlowLog

**Fix**: 
- Implemented `calculateRealConsumptionRate()` method
- Filters by `materialId` and `siteId`
- Calculates hourly rate based on actual time period
- Combines 70% historical + 30% provided rate
- Minimum rate of 0.1 units/hour

### 3. Backend - ML Training Service
**Issue**: Not filtering dataset by materialId

**Fix**:
- Added filtering in `trainModel()` method
- Supports multiple column names (stockLevel, stock_level, quantity)
- Validates minimum 10 data points per material

### 4. Backend - Auto ML Prediction Service
**Issue**: Models not trained automatically on startup

**Fix**:
- Created `AutoMLPredictionService`
- Reads `test.csv` on startup
- Trains one model per material
- Caches trained models

### 5. Backend - Materials Controller
**Issue**: Predictions not using ML models

**Fix**:
- Prioritizes ML predictions over historical predictions
- Falls back to `StockPredictionService` if no ML model
- Added `/ml/status` and `/ml/retrain` endpoints

---

## 📊 API Endpoints

### Materials
- `GET /api/materials` - Get all materials
- `GET /api/materials/:id` - Get material by ID
- `POST /api/materials` - Create material
- `PUT /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Delete material

### Predictions
- `GET /api/materials/predictions/all` - Get all predictions (ML + Historical)
- `GET /api/materials/:id/prediction` - Get prediction for specific material

### ML Training
- `POST /api/materials/ml/upload-dataset` - Upload CSV dataset
- `POST /api/materials/ml/train` - Train ML model
- `POST /api/materials/ml/predict` - Get ML prediction
- `GET /api/materials/ml/status` - Get ML training status
- `POST /api/materials/ml/retrain` - Retrain all models

### Material Flow
- `GET /api/material-flow` - Get all flow logs
- `POST /api/material-flow` - Record movement
- `GET /api/material-flow/anomalies` - Get anomalies
- `GET /api/material-flow/stats/:materialId/:siteId` - Get statistics
- `GET /api/material-flow/aggregate/:materialId` - Get aggregate stats
- `GET /api/material-flow/enriched` - Get enriched flows

### Reports
- `POST /api/materials/reports/daily/send` - Generate daily report

---

## 🧪 Testing

### 1. Test Materials Service
```bash
curl http://localhost:3009/api/materials
```

### 2. Test Predictions
```bash
curl http://localhost:3009/api/materials/predictions/all
```

### 3. Test ML Status
```bash
curl http://localhost:3009/api/materials/ml/status
```

### 4. Test Flow Log
```bash
curl http://localhost:3009/api/material-flow
```

### 5. Test Through API Gateway
```bash
curl http://localhost:9001/materials
curl http://localhost:9001/material-flow
```

---

## 🔍 Troubleshooting

### Issue: "ECONNREFUSED localhost:3002"
**Solution**: Materials service moved to port 3009. Update any hardcoded references.

### Issue: "Flow log returns empty"
**Solution**: 
1. Check MongoDB has data in `smartsite-materials.materialflowlogs`
2. Verify API gateway routing: `curl http://localhost:9001/material-flow`
3. Check frontend is calling `/api/material-flow` (not `/api/materials/flow-log`)

### Issue: "Predictions show NaN"
**Solution**:
1. Check `consumptionRate` is defined in backend response
2. Frontend now uses `(prediction.consumptionRate ?? 0).toFixed(2)`
3. Verify MaterialFlowLog has OUT movements for the material

### Issue: "ML predictions not working"
**Solution**:
1. Check `test.csv` exists in materials-service root
2. Verify auto-training ran: Check logs for "✅ Entraînement automatique terminé"
3. Check ML status: `curl http://localhost:3009/api/materials/ml/status`
4. Retrain if needed: `curl -X POST http://localhost:3009/api/materials/ml/retrain`

### Issue: "Materials service won't start"
**Solution**:
1. Check MongoDB is running: `mongosh`
2. Check port 3009 is free: `netstat -ano | findstr :3009`
3. Check .env file has `PORT=3009`
4. Check logs for errors

---

## 📝 Next Steps

1. **Start MongoDB** (if not running)
2. **Start API Gateway** on port 9001
3. **Start Materials Service** on port 3009
4. **Start Frontend** on port 5173
5. **Test predictions** - Should show real data with correct consumption rates
6. **Test flow log** - Should show IN/OUT movements per material
7. **Test ML training** - Upload dataset, train, predict

---

## 🎯 Expected Behavior

### Predictions
- ✅ One automatic prediction for ALL materials on page load
- ✅ Shows exact date/time of stock depletion
- ✅ Updates every 5 minutes (auto-refresh)
- ✅ Display decrements every 1 minute
- ✅ Format:
  - < 24h: "🚨 Aujourd'hui 14:30" (red, blinking)
  - 24-48h: "⚠️ Demain 09:15" (yellow)
  - > 48h: "✅ Mercredi 16:00" or "✅ 15 mai 10:00" (green)

### Flow Log
- ✅ Shows IN/OUT movements per material
- ✅ Filters by materialId
- ✅ Shows timestamp, quantity, type, user
- ✅ Detects anomalies (excessive IN/OUT)

### ML Training
- ✅ Upload CSV dataset
- ✅ Train model per material
- ✅ Predict stock depletion
- ✅ Save trained models
- ✅ Auto-train on startup from test.csv

---

## 📚 Documentation

- [ANALYSE_LOGIQUE_CONSOMMATION.md](./ANALYSE_LOGIQUE_CONSOMMATION.md) - Consumption logic analysis
- [API-MAP.md](./API-MAP.md) - Complete API documentation
- [BACKEND_IMPROVEMENTS_SUMMARY.md](./BACKEND_IMPROVEMENTS_SUMMARY.md) - Backend improvements summary

---

## ✅ Checklist

- [x] Port changed to 3009
- [x] API Gateway configured
- [x] Frontend URLs updated
- [x] toFixed error fixed
- [x] Stock prediction uses real data
- [x] ML training filters by materialId
- [x] Auto ML training on startup
- [x] Materials controller prioritizes ML
- [x] Flow log routing fixed
- [ ] MongoDB running
- [ ] Services started
- [ ] Tests passing
