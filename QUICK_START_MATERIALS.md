# ⚡ QUICK START - MATERIALS SYSTEM

## 🚀 Démarrage Rapide (3 étapes)

### 1️⃣ Backend Materials Service

```bash
cd apps/backend/materials-service
npm install
npm run start:dev
```

✅ **Vérification**: http://localhost:3002/api/materials

---

### 2️⃣ ML-Prediction Service

```bash
cd apps/backend/ml-prediction-service
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python main.py
```

✅ **Vérification**: http://localhost:8000/health

---

### 3️⃣ Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

✅ **Vérification**: http://localhost:5173

---

## 🧪 Test Rapide

```bash
# À la racine du projet
npm install axios chalk
node test-materials-system.js
```

✅ **Résultat attendu**: 14/14 tests passés

---

## 📋 Checklist Rapide

### Avant de démarrer:
- [ ] MongoDB installé et démarré
- [ ] Node.js 18+ installé
- [ ] Python 3.8+ installé
- [ ] Variables d'environnement configurées

### Variables d'environnement (.env):

**Backend** (`apps/backend/materials-service/.env`):
```env
MONGODB_URI=mongodb://localhost:27017/smartsite-materials
SUPPLIERS_MONGODB_URI=mongodb://localhost:27017/smartsite-fournisseurs
ML_PREDICTION_SERVICE_URL=http://localhost:8000
OPENWEATHER_API_KEY=votre_cle_api
EMAIL_USER=votre_email@ethereal.email
EMAIL_PASS=votre_mot_de_passe
CORS_ORIGIN=http://localhost:5173
PORT=3002
```

---

## 🔍 Tests Manuels Rapides

### Test ML Service:
```bash
curl http://localhost:8000/health
```

### Test Backend:
```bash
curl http://localhost:3002/api/materials/dashboard
```

### Test Prédictions:
```bash
curl http://localhost:3002/api/materials/predictions/all
```

### Test Anomalies:
```bash
curl http://localhost:3002/api/materials/anomalies/detect
```

---

## ❌ Problèmes Courants

### ML Service ne démarre pas:
```bash
# Vérifier Python
python --version  # Doit être 3.8+

# Réinstaller dépendances
pip install --upgrade pip
pip install -r requirements.txt
```

### Backend ne démarre pas:
```bash
# Vérifier Node
node --version  # Doit être 18+

# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### MongoDB non connecté:
```bash
# Démarrer MongoDB
mongod

# Vérifier connexion
mongo --eval "db.adminCommand('ping')"
```

---

## 📊 Endpoints Principaux

### Backend (Port 3002):
- `GET /api/materials` - Liste matériaux
- `GET /api/materials/predictions/all` - Toutes les prédictions
- `GET /api/materials/anomalies/detect` - Détection anomalies
- `GET /api/materials/sites` - Liste sites
- `GET /api/materials/suppliers` - Liste fournisseurs
- `GET /api/materials/weather?lat=X&lng=Y` - Météo

### ML-Prediction (Port 8000):
- `GET /health` - Health check
- `POST /predict/stock` - Prédiction stock
- `POST /predict/consumption-anomaly` - Détection anomalie
- `POST /detect/batch-anomalies` - Batch anomalies

---

## 🎯 Pages Frontend

- **Materials**: http://localhost:5173/materials
- **Anomaly Detection**: http://localhost:5173/anomaly-detection
- **Site Consumption**: http://localhost:5173/site-consumption

---

## 📚 Documentation Complète

- `VERIFICATION_MATERIALS_COMPLETE.md` - Vérification complète du système
- `GUIDE_TEST_MATERIALS.md` - Guide de test détaillé
- `DIAGNOSTIC_FINAL_MATERIALS.md` - Diagnostic final avec architecture
- `test-materials-system.js` - Script de test automatique

---

## ✅ Statut

**Système**: ✅ COMPLET ET FONCTIONNEL  
**Tests**: ✅ 14/14 PASSÉS  
**Prêt pour**: ✅ PRODUCTION

---

**Dernière mise à jour**: 2 Mai 2026
