# 🧪 Test FastAPI ML Integration

## Quick Test Commands

### 1. Start FastAPI ML Service

Open Terminal 1:
```bash
cd apps/backend/ml-prediction-service
python main.py
```

**Expected Output:**
```
🚀 Starting ML Prediction Service...
📂 Training models with datasets...
🔵 Training stock prediction model...
✅ Loaded 1000 rows from stock-prediction.csv
✅ Stock prediction model trained successfully! Score: 0.9682
📊 Training samples: 710
🔵 Training anomaly detection model...
✅ Loaded 1000 rows from anomaly-detection.csv
✅ Anomaly detection model trained successfully!
📊 Training samples: 1000
✅ All models trained successfully!
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

---

### 2. Start Materials Service

Open Terminal 2:
```bash
cd apps/backend/materials-service
npm run start:dev
```

**Expected Output:**
```
[Nest] INFO [MaterialsModule] 🤖 ML Prediction Service URL: http://localhost:8000
[Nest] INFO [NestApplication] Nest application successfully started
```

---

### 3. Test FastAPI Health Check

Open Terminal 3:
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "models": {
    "stock_prediction": "trained",
    "anomaly_detection": "trained"
  }
}
```

---

### 4. Test Predictions Endpoint

```bash
curl http://localhost:3009/materials/predictions/all
```

**Expected Response:**
```json
[
  {
    "materialId": "...",
    "materialName": "Ciment",
    "currentStock": 100,
    "predictedStock": 50,
    "consumptionRate": 5,
    "hoursToOutOfStock": 240,
    "status": "warning",
    "confidence": 0.96,
    "message": "Stock will be depleted in 10 days"
  },
  ...
]
```

---

### 5. Check Frontend Console

Open browser at `http://localhost:5173/materials`

**Expected Console Output:**
```
🔮 Fetching all predictions from /predictions/all
✅ 5 predictions loaded from FastAPI ML service
```

**NOT:**
```
❌ 🔮 Fetching all predictions from /predictions/all (repeated infinitely)
```

---

## 🔍 Troubleshooting

### FastAPI Not Starting?

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
cd apps/backend/ml-prediction-service
pip install -r requirements.txt
```

---

### Materials Service Can't Connect to FastAPI?

**Error:** `ML Prediction Service is not available`

**Check:**
1. FastAPI is running on port 8000
2. `.env` file has: `ML_PREDICTION_SERVICE_URL=http://localhost:8000`
3. No firewall blocking port 8000

**Test Connection:**
```bash
curl http://localhost:8000/health
```

---

### Frontend Still Shows Infinite Loop?

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check console for errors
4. Restart frontend dev server

---

### Predictions Not Showing?

**Check:**
1. Materials exist in database
2. Backend logs show: `🤖 Using FastAPI ML Prediction Service`
3. FastAPI logs show incoming requests
4. No CORS errors in browser console

---

## 📊 Expected Behavior

### Initial Load:
1. Frontend loads materials
2. Frontend calls `/predictions/all` **ONCE**
3. Backend checks if FastAPI is available
4. Backend calls FastAPI for each material
5. FastAPI returns ML predictions
6. Backend converts to frontend format
7. Frontend displays predictions

### After 5 Minutes:
1. Frontend automatically calls `/predictions/all` again
2. Process repeats

### NOT:
- ❌ Infinite loop of prediction calls
- ❌ Predictions every second
- ❌ Browser freezing

---

## ✅ Success Indicators

- [x] FastAPI shows 96.82% accuracy on startup
- [x] Materials service logs: `🤖 Using FastAPI ML Prediction Service`
- [x] Frontend console: `✅ X predictions loaded from FastAPI ML service`
- [x] No infinite loop in console
- [x] Predictions update every 5 minutes
- [x] UI shows prediction cards with confidence scores

---

## 🎯 Quick Verification

Run this command to see if everything is working:

```bash
# Terminal 1: Start FastAPI
cd apps/backend/ml-prediction-service && python main.py &

# Terminal 2: Wait 5 seconds, then test
sleep 5 && curl http://localhost:8000/health

# Terminal 3: Start Materials Service
cd apps/backend/materials-service && npm run start:dev &

# Terminal 4: Wait 10 seconds, then test predictions
sleep 10 && curl http://localhost:3009/materials/predictions/all | jq '.[0]'
```

If you see JSON output with predictions, **IT WORKS!** 🎉

---

## 📝 Notes

- FastAPI must be running BEFORE materials-service starts
- If FastAPI is not available, materials-service will fallback to standard predictions
- Predictions are cached for 5 minutes to avoid overloading the ML service
- The ML models are trained on startup using the CSV datasets

---

**Status:** ✅ READY TO TEST
**Date:** 2026-04-30
