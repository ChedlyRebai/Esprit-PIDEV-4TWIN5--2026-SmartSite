# ⚡ Quick Start - Vérification Rapide

## 🚀 3 Commandes pour Tout Tester

### 1️⃣ Démarrer FastAPI
```bash
cd apps/backend/ml-prediction-service
python main.py
```
**Attendu:** `✅ Stock prediction model trained successfully! Score: 0.9682`

---

### 2️⃣ Démarrer Materials Service
```bash
cd apps/backend/materials-service
npm run start:dev
```
**Attendu:** `🤖 ML Prediction Service URL: http://localhost:8000`

---

### 3️⃣ Ouvrir Frontend
```
http://localhost:5173/materials
```
**Attendu:** Section "🧠 AI Predictions" avec vraies valeurs

---

## ✅ Checklist Rapide (30 secondes)

### Dans FastAPI (Terminal 1):
```
🔮 [FASTAPI] STOCK PREDICTION REQUEST  ← Vous DEVEZ voir ça
🎯 [FASTAPI] PREDICTION RESULT
```

### Dans Materials Service (Terminal 2):
```
🔗 [HTTP] Calling FastAPI  ← Vous DEVEZ voir ça
📥 FastAPI Response
```

### Dans Frontend (Browser):
```
🧠 AI Predictions

🟢 Ciment Portland [Safe]
   Current stock: 100
   Consumption: 5/day  ← DOIT être /day (pas /h)
   Confidence: 85%  ← DOIT être 85% (pas 50%)
   Stockout in: 18d 12h  ← DOIT être réaliste (pas 999h)
   📦 Order: 130 units
   
   🤖 FastAPI ML: ✅ Stock level is healthy...  ← Message de FastAPI
```

---

## ❌ Si Ça Ne Marche Pas

### Problème 1: FastAPI ne démarre pas
```bash
cd apps/backend/ml-prediction-service
pip install -r requirements.txt
python main.py
```

### Problème 2: Materials Service ne trouve pas FastAPI
Vérifier `.env`:
```
ML_PREDICTION_SERVICE_URL=http://localhost:8000
```

### Problème 3: Frontend affiche des valeurs par défaut
1. Vérifier que FastAPI tourne (port 8000)
2. Vérifier que Materials Service tourne (port 3009)
3. Rafraîchir le frontend (Ctrl+Shift+R)

---

## 🎯 Résultat Attendu

**✅ SI TOUT FONCTIONNE:**
- FastAPI logs: `🔮 [FASTAPI] STOCK PREDICTION REQUEST`
- Materials logs: `🔗 [HTTP] Calling FastAPI`
- Frontend: Prédictions avec vraies valeurs (85% confidence, jours réalistes)

**❌ SI ÇA NE FONCTIONNE PAS:**
- Pas de logs FastAPI → FastAPI ne tourne pas
- Pas de logs HTTP → Materials Service n'appelle pas FastAPI
- Valeurs par défaut (999h, 50%) → Frontend n'utilise pas les données FastAPI

---

## 📚 Documentation Complète

Pour plus de détails, voir:
- `VERIFICATION_FINALE_PREDICTIONS.md` - Guide complet
- `FRONTEND_DISPLAY_GUIDE.md` - Ce qui doit apparaître
- `RESUME_FINAL_INTEGRATION.md` - Résumé de l'intégration

---

**Status:** ✅ PRÊT À TESTER
**Temps:** 2 minutes
**Difficulté:** Facile
