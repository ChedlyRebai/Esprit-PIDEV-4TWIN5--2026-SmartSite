# 🚨 CORRECTION URGENTE - 2 PROBLÈMES

## ✅ PROBLÈME 1: Brain is not defined - RÉSOLU

**Erreur**: `ReferenceError: Brain is not defined`

**Cause**: Import manquant dans `CreateOrderDialog.tsx`

**Solution**: ✅ Import ajouté

```typescript
// AVANT
import { MapPin, Package, Truck, ... } from "lucide-react";

// APRÈS
import { MapPin, Package, Truck, ..., Loader2, Brain } from "lucide-react";
```

---

## 🚨 PROBLÈME 2: ECONNREFUSED - CRITIQUE

**Erreur**: `AggregateError [ECONNREFUSED]`

**Cause**: **Le materials-service n'est PAS démarré sur le port 3009**

**Impact**:
- ❌ Prédictions ne se chargent pas
- ❌ Bouton "Commander" ne fonctionne pas
- ❌ Aucune donnée materials disponible

---

## 🚀 SOLUTION IMMÉDIATE

### 1. Démarrer le Materials Service

**Ouvrir un NOUVEAU terminal** et exécuter:

```bash
cd apps/backend/materials-service
npm start
```

**✅ Attendre de voir**:
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] MaterialsModule dependencies initialized
[Nest] INFO [StockPredictionService] ✅ TensorFlow.js Linear Regression Model initialized
[Nest] INFO [NestApplication] Nest application successfully started
[Nest] INFO Materials Service listening on port 3009
```

### 2. Redémarrer le Frontend

**Dans le terminal du frontend**:

```bash
# Arrêter (Ctrl+C)
# Puis redémarrer
npm run dev
```

---

## 🧪 VÉRIFICATION

### Test 1: Materials Service

```bash
curl http://localhost:3009/api/materials
```

**✅ Devrait retourner**: JSON avec liste des matériaux

### Test 2: Prédictions

```bash
curl http://localhost:3009/api/materials/predictions/all
```

**✅ Devrait retourner**: JSON avec prédictions

### Test 3: Frontend

1. Ouvrir: `http://localhost:5173`
2. Aller sur: **Materials**
3. ✅ Vérifier: Prédictions s'affichent
4. ✅ Vérifier: Bouton "Commander" fonctionne

---

## 📊 État Actuel

### Services Requis

| Service | Port | Status | Action |
|---------|------|--------|--------|
| MongoDB | 27017 | ❓ | Vérifier qu'il tourne |
| Materials Service | 3009 | ❌ **NON DÉMARRÉ** | **DÉMARRER MAINTENANT** |
| Frontend | 5173 | ✅ Démarré | Redémarrer après materials-service |

---

## 🔧 Si Materials Service ne démarre pas

### Erreur: Port déjà utilisé

```bash
# Windows
netstat -ano | findstr :3009
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3009 | xargs kill -9
```

### Erreur: Dépendances manquantes

```bash
cd apps/backend/materials-service
rm -rf node_modules
npm install
npm start
```

### Erreur: MongoDB non connecté

1. Vérifier que MongoDB tourne:
   ```bash
   mongosh
   ```

2. Vérifier `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/smartsite-materials
   ```

---

## ✅ Checklist Rapide

- [ ] Materials Service démarré (port 3009)
- [ ] Voir le message: "Materials Service listening on port 3009"
- [ ] Frontend redémarré
- [ ] Page Materials accessible
- [ ] Prédictions affichées
- [ ] Bouton "Commander" fonctionne
- [ ] Pas d'erreur ECONNREFUSED

---

## 🎯 Résultat Attendu

### Après Démarrage

**Terminal Materials Service**:
```
[Nest] INFO Materials Service listening on port 3009
```

**Terminal Frontend**:
```
VITE v5.x.x  ready in XXX ms
➜  Local:   http://localhost:5173/
```

**Navigateur**:
- ✅ Prédictions affichées: `🚨 Aujourd'hui 14:30`
- ✅ Bouton "Commander" ouvre le dialog
- ✅ Quantité recommandée affichée: `🧠 IA recommande: X unités`

---

**DÉMARRER LE MATERIALS SERVICE MAINTENANT !**

```bash
cd apps/backend/materials-service
npm start
```
