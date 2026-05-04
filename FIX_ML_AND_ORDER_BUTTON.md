# Fix: ML Training Error & Order Button

## 🐛 Problems

### 1. TensorFlow.js Save Error
```
ERROR [AutoMLPredictionService] ❌ Erreur entraînement MAT033: 
Cannot find any save handlers for URL 'file://C:\Users\...\model-MAT033-1777446505740'
```

**Root Cause**: `@tensorflow/tfjs` (browser version) doesn't include Node.js file system handlers.

### 2. Order Button Not Working
Clicking "Commander" button does nothing - dialog doesn't open.

---

## ✅ Solutions Applied

### 1. Install TensorFlow.js Node Backend

**File**: `apps/backend/materials-service/package.json`

**Change**:
```json
"dependencies": {
  "@tensorflow/tfjs": "^4.22.0",
  "@tensorflow/tfjs-node": "^4.22.0",  // ✅ ADDED
  // ... other dependencies
}
```

**Why**: `@tensorflow/tfjs-node` provides:
- Native Node.js bindings for TensorFlow
- File system save/load handlers
- Better performance (uses native C++ bindings)
- Support for `file://` protocol

### 2. Update ML Services to Use tfjs-node

**Files**:
- `apps/backend/materials-service/src/materials/services/ml-training.service.ts`
- `apps/backend/materials-service/src/materials/services/stock-prediction.service.ts`

**Change**:
```typescript
// Before
import * as tf from '@tensorflow/tfjs';

// After
import * as tf from '@tensorflow/tfjs-node';
```

**Why**: Ensures services use the Node.js backend with file system support.

### 3. Add Debug Logging to Order Button

**File**: `apps/frontend/src/app/pages/materials/Materials.tsx`

**Change**:
```typescript
const handleReorder = (...params) => {
  console.log('🛒 handleReorder called:', { ...params });
  
  setMaterialToOrder({ ... });
  setShowOrderDialog(true);
  
  console.log('✅ Dialog should open now');
};
```

**Why**: Helps debug if button click is registered and dialog state is updated.

---

## 🚀 Installation Steps

### 1. Install New Dependency
```bash
cd apps/backend/materials-service
npm install @tensorflow/tfjs-node@^4.22.0
```

### 2. Restart Materials Service
```bash
# Stop current service (Ctrl+C)
npm run start:dev
```

### 3. Verify ML Training Works
Check logs for:
```
✅ Modèle entraîné pour MAT033: /path/to/model
✅ Entraînement automatique terminé: X modèles
```

### 4. Test Order Button
1. Open frontend: `http://localhost:5173`
2. Navigate to Materials page
3. Click "Commander" button on a material
4. Check browser console for logs:
   ```
   🛒 handleReorder called: { materialId: "...", ... }
   ✅ Dialog should open now
   ```
5. Dialog should appear

---

## 🧪 Testing

### Test ML Training

#### 1. Check Auto-Training on Startup
```bash
# Start materials service
cd apps/backend/materials-service
npm run start:dev

# Look for these logs:
# 🚀 Démarrage entraînement automatique avec test.csv
# 📊 X matériaux trouvés dans test.csv
# 🤖 Entraînement ML pour matériau MAT001
# ✅ Modèle entraîné pour MAT001: /path/to/model
# ✅ Entraînement automatique terminé: X modèles
```

#### 2. Check ML Status
```bash
curl http://localhost:3009/api/materials/ml/status
```

Expected response:
```json
{
  "success": true,
  "trainedModels": 5,
  "message": "5 modèles ML entraînés"
}
```

#### 3. Test Manual Training
```bash
# Upload dataset
curl -X POST http://localhost:3009/api/materials/ml/upload-dataset \
  -F "dataset=@test.csv" \
  -F "materialId=MAT001"

# Train model
curl -X POST http://localhost:3009/api/materials/ml/train \
  -H "Content-Type: application/json" \
  -d '{"materialId":"MAT001","datasetPath":"uploads/datasets/dataset-MAT001-xxx.csv"}'
```

### Test Order Button

#### 1. Visual Test
1. Open `http://localhost:5173`
2. Navigate to Materials page
3. Find a material with low stock (yellow "Commander" button) or out of stock (red "Urgent" button)
4. Click the button
5. **Expected**: Dialog opens with order form
6. **If not**: Check browser console for logs

#### 2. Console Test
Open browser DevTools (F12) → Console tab:
```javascript
// Should see when clicking button:
🛒 handleReorder called: {
  materialId: "675a...",
  materialName: "Ciment",
  materialCode: "MAT001",
  materialCategory: "Construction",
  siteId: "675b...",
  siteName: "Chantier Nord",
  siteCoordinates: { lat: 36.8, lng: 10.2 }
}
✅ Dialog should open now
```

#### 3. State Test
In browser console:
```javascript
// Check if dialog state is updated
// (React DevTools or add temporary console.log)
```

---

## 🔍 Troubleshooting

### ML Training Still Fails

#### Error: "Cannot find module '@tensorflow/tfjs-node'"
**Solution**:
```bash
cd apps/backend/materials-service
rm -rf node_modules package-lock.json
npm install
```

#### Error: "ENOENT: no such file or directory"
**Solution**: Check that `test.csv` exists:
```bash
ls apps/backend/materials-service/test.csv
```

If missing, create it with sample data:
```csv
materialId,timestamp,stockLevel
MAT001,2024-01-01,100
MAT001,2024-01-02,95
MAT001,2024-01-03,90
MAT002,2024-01-01,200
MAT002,2024-01-02,190
```

#### Error: "Dataset trop petit"
**Solution**: Ensure at least 10 rows per material in CSV:
```bash
# Count rows per material
grep "MAT001" test.csv | wc -l
```

### Order Button Still Not Working

#### Dialog Doesn't Open
**Check**:
1. Browser console for errors
2. React DevTools for state changes
3. Network tab for API calls

**Debug**:
```typescript
// Add more logging in Materials.tsx
useEffect(() => {
  console.log('showOrderDialog changed:', showOrderDialog);
  console.log('materialToOrder:', materialToOrder);
}, [showOrderDialog, materialToOrder]);
```

#### Button Not Visible
**Check**:
- Material has low stock: `quantity <= stockMinimum`
- OR material is out of stock: `quantity === 0`

**Debug**:
```typescript
// Add logging in render
console.log('Material:', material.name, {
  quantity: material.quantity,
  stockMinimum: material.stockMinimum,
  shouldShowButton: material.quantity <= material.stockMinimum
});
```

#### Dialog Opens But Empty
**Check**: All required props are passed:
```typescript
<CreateOrderDialog
  open={showOrderDialog}
  onClose={...}
  materialId={materialToOrder.id}  // ✅ Required
  materialName={materialToOrder.name}  // ✅ Required
  materialCode={materialToOrder.code}  // ✅ Required
  materialCategory={materialToOrder.category}  // ✅ Required
  // Optional but recommended:
  materialSiteId={materialToOrder.siteId}
  materialSiteName={materialToOrder.siteName}
  materialSiteCoordinates={materialToOrder.siteCoordinates}
/>
```

---

## 📊 Expected Results

### ML Training
```
[Nest] 20944  - 04/29/2026, 8:08:25 AM     LOG [AutoMLPredictionService] 🚀 Démarrage entraînement automatique avec test.csv
[Nest] 20944  - 04/29/2026, 8:08:25 AM     LOG [AutoMLPredictionService] 📊 5 matériaux trouvés dans test.csv
[Nest] 20944  - 04/29/2026, 8:08:26 AM     LOG [AutoMLPredictionService] 🤖 Entraînement pour matériau MAT001...
[Nest] 20944  - 04/29/2026, 8:08:27 AM     LOG [MLTrainingService] 📊 Dataset filtré pour MAT001: 15 lignes sur 75 total
[Nest] 20944  - 04/29/2026, 8:08:28 AM     LOG [MLTrainingService] ✅ Entraînement terminé pour MAT001: accuracy=85.23%, mse=0.0234
[Nest] 20944  - 04/29/2026, 8:08:28 AM     LOG [AutoMLPredictionService] ✅ Modèle entraîné pour MAT001: uploads/models/model-MAT001-1777446505740
[Nest] 20944  - 04/29/2026, 8:08:30 AM     LOG [AutoMLPredictionService] ✅ Entraînement automatique terminé: 5 modèles
```

### Order Button
1. Click "Commander" button
2. Browser console shows:
   ```
   🛒 handleReorder called: { materialId: "675a...", ... }
   ✅ Dialog should open now
   ```
3. Dialog appears with order form
4. Can fill form and create order

---

## 📝 Files Modified

1. ✅ `apps/backend/materials-service/package.json`
   - Added `@tensorflow/tfjs-node` dependency

2. ✅ `apps/backend/materials-service/src/materials/services/ml-training.service.ts`
   - Changed import to use `@tensorflow/tfjs-node`

3. ✅ `apps/backend/materials-service/src/materials/services/stock-prediction.service.ts`
   - Changed import to use `@tensorflow/tfjs-node`

4. ✅ `apps/frontend/src/app/pages/materials/Materials.tsx`
   - Added debug logging to `handleReorder()`

---

## 🎯 Next Steps

1. **Install dependency**:
   ```bash
   cd apps/backend/materials-service
   npm install
   ```

2. **Restart service**:
   ```bash
   npm run start:dev
   ```

3. **Verify ML training**:
   - Check logs for "✅ Entraînement automatique terminé"
   - Test: `curl http://localhost:3009/api/materials/ml/status`

4. **Test order button**:
   - Open frontend
   - Click "Commander"
   - Check console logs
   - Verify dialog opens

5. **If issues persist**:
   - Check troubleshooting section
   - Review logs for errors
   - Test with sample data

---

**Status**: ✅ FIXES APPLIED - READY TO TEST
**Last Updated**: 2024-01-15
**Priority**: HIGH - Critical functionality
