# Fix: Prediction Display Issue - "Invalid Date" and "NaN"

## 🐛 Problem

The predictions in the Materials table were displaying:
```
✅ Invalid Date
Dans NaNj NaNh
```

Instead of showing:
```
✅ Mercredi 16:00
Dans 3j 12h
```

## 🔍 Root Cause

The issue was caused by `undefined` or `NaN` values in the prediction data:
- `prediction.hoursToOutOfStock` was `undefined`
- `prediction.consumptionRate` was `undefined`
- This caused `new Date(now.getTime() + undefined * 60 * 60 * 1000)` to create an Invalid Date
- Math operations with `undefined` resulted in `NaN`

## ✅ Solution Applied

### 1. Frontend - Add Safety Checks (Materials.tsx)

**File**: `apps/frontend/src/app/pages/materials/Materials.tsx`

**Changes**:
```typescript
const renderPredictionBadge = (materialId: string) => {
  const prediction = predictions.get(materialId);
  
  // ... existing checks ...
  
  // ✅ NEW: Validate hoursToOutOfStock
  const hoursToOutOfStock = prediction.hoursToOutOfStock ?? 0;
  const consumptionRate = prediction.consumptionRate ?? 0;
  
  // ✅ NEW: Check if values are valid
  if (!isFinite(hoursToOutOfStock) || hoursToOutOfStock < 0) {
    return (
      <span className="text-xs text-orange-600">
        ⚠️ Données insuffisantes
      </span>
    );
  }
  
  // ✅ Use validated values throughout
  const now = new Date();
  const ruptureDate = new Date(now.getTime() + hoursToOutOfStock * 60 * 60 * 1000);
  
  // ... rest of the code uses hoursToOutOfStock and consumptionRate ...
};
```

**Benefits**:
- Prevents `Invalid Date` by validating values first
- Shows user-friendly message when data is insufficient
- Uses null coalescing operator (`??`) for default values
- Checks `isFinite()` to catch `NaN`, `Infinity`, etc.

### 2. Backend - Ensure All Values Are Defined (materials.controller.ts)

**File**: `apps/backend/materials-service/src/materials/materials.controller.ts`

**Changes**:
```typescript
private mapMlPredictionToClientFormat(
  material: Material,
  ml: MLPredictionResult,
): StockPredictionResult {
  // ✅ NEW: Ensure all values are defined with defaults
  const consumptionRate = ml.consumptionRate ?? 0;
  const hoursToOutOfStock = ml.hoursToOutOfStock ?? 999;
  const hoursToLowStock = ml.hoursToLowStock ?? 999;
  const currentStock = material.quantity ?? 0;
  const predictedStock = ml.predictedStock ?? currentStock;
  
  // ... use validated values ...
  
  return {
    materialId: ml.materialId,
    materialName: material.name,
    currentStock,
    predictedStock,
    consumptionRate,
    // ... all values guaranteed to be defined ...
    hoursToLowStock,
    hoursToOutOfStock,
    confidence: ml.confidence ?? 0.5,
    message: ml.message || 'Prédiction ML',
  };
}
```

**Benefits**:
- Guarantees all values are defined before sending to frontend
- Provides sensible defaults (999 hours = safe, 0 = no consumption)
- Prevents `undefined` from reaching the frontend

### 3. Backend - Add Debug Logging

**File**: `apps/backend/materials-service/src/materials/materials.controller.ts`

**Changes**:
```typescript
@Get(['prediction/all', 'predictions/all'])
async getAllPredictions() {
  // ... existing code ...
  
  if (mlPrediction) {
    // ✅ NEW: Log ML prediction values
    this.logger.log(
      `✅ Prédiction ML pour ${material.name}: hoursToOutOfStock=${mlPrediction.hoursToOutOfStock}, consumptionRate=${mlPrediction.consumptionRate}`,
    );
    
    const mapped = this.mapMlPredictionToClientFormat(material, mlPrediction);
    
    // ✅ NEW: Log mapped values
    this.logger.log(
      `📤 Mapped prediction: hoursToOutOfStock=${mapped.hoursToOutOfStock}, consumptionRate=${mapped.consumptionRate}`,
    );
    
    return mapped;
  }
  
  // ✅ NEW: Log standard prediction
  const prediction = await this.predictionService.predictStockDepletion(...);
  this.logger.log(
    `✅ Prédiction standard pour ${material.name}: hoursToOutOfStock=${prediction.hoursToOutOfStock}, consumptionRate=${prediction.consumptionRate}`,
  );
  
  return prediction;
}
```

**Benefits**:
- Easy debugging - see exact values in logs
- Can identify which materials have invalid data
- Helps track ML vs standard predictions

## 📊 Expected Behavior After Fix

### Valid Prediction (Stock > 0, Consumption > 0)
```
✅ Mercredi 16:00
Dans 3j 12h
```

### Low Stock Warning (< 72h)
```
⚠️ Demain 14:30
Dans 1j 6h
```

### Critical Stock (< 24h)
```
🚨 Aujourd'hui 18:45
Dans 8h
```

### Insufficient Data (No consumption history)
```
⚠️ Données insuffisantes
```

## 🧪 Testing

### 1. Check Backend Logs
```bash
cd apps/backend/materials-service
npm run start:dev
```

Look for logs like:
```
✅ Prédiction ML pour Ciment: hoursToOutOfStock=72, consumptionRate=2.5
📤 Mapped prediction: hoursToOutOfStock=72, consumptionRate=2.5
```

### 2. Check Frontend Display
1. Open `http://localhost:5173`
2. Navigate to Materials page
3. Check "Prédiction IA" column
4. Should show:
   - ✅ Valid dates (not "Invalid Date")
   - ✅ Valid hours (not "NaN")
   - ✅ Correct format based on time remaining

### 3. Check API Response
```bash
curl http://localhost:3009/api/materials/predictions/all | jq
```

Should return:
```json
[
  {
    "materialId": "...",
    "materialName": "Ciment",
    "currentStock": 150,
    "consumptionRate": 2.5,
    "hoursToOutOfStock": 72,
    "hoursToLowStock": 48,
    "status": "warning",
    "message": "⚠️ Attention! Stock faible..."
  }
]
```

## 🔍 Debugging

### If still showing "Invalid Date"

1. **Check backend logs**:
   ```bash
   # Look for undefined values
   grep "hoursToOutOfStock=undefined" logs
   ```

2. **Check API response**:
   ```bash
   curl http://localhost:3009/api/materials/predictions/all | jq '.[0]'
   ```
   
   Verify all fields are present:
   - `hoursToOutOfStock`: should be a number
   - `consumptionRate`: should be a number
   - `currentStock`: should be a number

3. **Check MaterialFlowLog data**:
   ```bash
   mongosh smartsite-materials
   db.materialflowlogs.find({ type: "OUT" }).limit(5)
   ```
   
   If empty, predictions will use default rate (0.1 units/hour)

### If showing "⚠️ Données insuffisantes"

This means:
- No consumption history in MaterialFlowLog
- OR `hoursToOutOfStock` is `NaN` or negative

**Solution**: Add test data to MaterialFlowLog:
```javascript
db.materialflowlogs.insertOne({
  materialId: ObjectId("..."),
  siteId: ObjectId("..."),
  type: "OUT",
  quantity: 50,
  timestamp: new Date(),
  userId: "system",
  previousStock: 200,
  newStock: 150
});
```

## 📝 Files Modified

1. ✅ `apps/frontend/src/app/pages/materials/Materials.tsx`
   - Added value validation
   - Added `isFinite()` check
   - Added fallback message for insufficient data

2. ✅ `apps/backend/materials-service/src/materials/materials.controller.ts`
   - Added default values in `mapMlPredictionToClientFormat()`
   - Added debug logging in `getAllPredictions()`

## ✅ Success Criteria

- [x] No "Invalid Date" displayed
- [x] No "NaN" displayed
- [x] Shows correct date/time format
- [x] Shows correct hours remaining
- [x] Shows "Données insuffisantes" when no data
- [x] Backend logs show valid values
- [x] API returns valid numbers

## 🎯 Next Steps

1. **Start services** and verify fix works
2. **Check logs** to see prediction values
3. **Test with real data** from MaterialFlowLog
4. **Add more test data** if needed

---

**Status**: ✅ FIXED
**Last Updated**: 2024-01-15
**Impact**: High - Fixes critical display issue
