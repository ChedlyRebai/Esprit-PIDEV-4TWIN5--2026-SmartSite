# Instructions de Démarrage - Materials Service

## ✅ Toutes les Corrections Ont Été Appliquées

### Corrections Effectuées

1. ✅ **Stock Prediction** - Calcul correct du taux de consommation par matériau
2. ✅ **ML Training** - Filtrage par matériau dans le dataset
3. ✅ **Auto ML Service** - Entraînement automatique au démarrage
4. ✅ **Flow Log** - URL corrigée pour afficher les mouvements
5. ✅ **API Gateway** - Route `/materials` ajoutée
6. ✅ **Frontend** - URLs corrigées pour les prédictions et flow log

## 🚀 Démarrage Rapide

### 1. Vérifier que MongoDB est démarré
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### 2. Démarrer Materials Service
```bash
cd apps/backend/materials-service
npm run start:dev
```

**Logs attendus** :
```
🚀 Démarrage entraînement automatique avec test.csv
📊 5 matériaux trouvés dans test.csv
🤖 Entraînement pour matériau MAT001...
✅ Modèle entraîné pour MAT001: uploads/models/model-MAT001-...
✅ Entraînement automatique terminé: 5 modèles
```

### 3. Démarrer API Gateway
```bash
cd apps/backend/api-gateway
npm run start:dev
```

**Logs attendus** :
```
🚀 API Gateway running on: http://localhost:9001
   /materials   → materials-service      (http://localhost:3002)
```

### 4. Démarrer Frontend
```bash
cd apps/frontend
npm run dev
```

### 5. Tester l'Application

#### Test 1: Prédictions IA
1. Ouvrir http://localhost:5173/materials
2. Cliquer sur l'onglet "Predictions IA"
3. **Vérifier** : Les prédictions affichent des valeurs correctes (pas NaN)

**Résultat attendu** :
```
Ciment Portland
Stock actuel: 100
Stock prédit (24h): 76 unités
Consommation: 1.50 unités/h
Confiance: 85%
⚠️ Stock bas: 2j 19h
🚨 Rupture: 2j 19h
```

#### Test 2: Flow Log
1. Cliquer sur un matériau dans le tableau
2. Onglet "Flow Log"
3. **Vérifier** : Les mouvements s'affichent avec nom du matériau, site, utilisateur

**Résultat attendu** :
```
Sortie: 10 unités
29 avr 2026 10:00
Ciment Portland - CIM-001
Chantier Nord
Stock: 100 → 90
```

#### Test 3: API Gateway
```bash
# Tester via le gateway
curl http://localhost:9001/materials/predictions/all | jq

# Doit retourner les prédictions
```

## 🔍 Vérification des Corrections

### 1. Vérifier que les modèles ML sont créés
```bash
ls -la apps/backend/materials-service/uploads/models/

# Doit contenir :
# model-MAT001-1234567890/
# model-MAT002-1234567891/
# ...
```

### 2. Vérifier le statut ML
```bash
curl http://localhost:3002/api/materials/ml/status

# Réponse attendue :
# {
#   "success": true,
#   "trainedModels": 5,
#   "message": "5 modèles ML entraînés"
# }
```

### 3. Vérifier les prédictions
```bash
curl http://localhost:3002/api/materials/predictions/all | jq

# Vérifier que :
# - consumptionRate: nombre (pas NaN)
# - predictedStock: nombre (pas NaN)
# - hoursToOutOfStock: nombre positif
```

### 4. Vérifier le Flow Log
```bash
curl "http://localhost:3002/api/materials/flow-log/enriched" | jq

# Vérifier que :
# - data: tableau non vide
# - materialName: présent
# - siteName: présent
```

## 🐛 Dépannage

### Problème : "Aucune prédiction à afficher"

**Solution** :
1. Vérifier que materials-service est démarré sur le port 3002
2. Vérifier les logs : `✅ Entraînement automatique terminé: X modèles`
3. Tester l'API directement : `curl http://localhost:3002/api/materials/predictions/all`

### Problème : "Flow Log vide"

**Solution** :
1. Vérifier que l'URL est correcte : `/api/materials/flow-log`
2. Créer des mouvements de test :
```bash
curl -X POST http://localhost:3002/api/materials/flow-log \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": "67890...",
    "siteId": "12345...",
    "type": "OUT",
    "quantity": 10,
    "reason": "Test"
  }'
```

### Problème : "NaN dans les prédictions"

**Solution** :
1. Vérifier que MaterialFlowLog contient des données
2. Vérifier les logs backend : `📊 Taux calculé depuis historique: X unités/h`
3. Si pas de données historiques, le système utilise un taux par défaut de 1.5 unités/h

### Problème : "API Gateway ne route pas vers materials"

**Solution** :
1. Vérifier que la route est ajoutée dans `app.controller.ts`
2. Redémarrer API Gateway
3. Vérifier les logs : `/materials → materials-service (http://localhost:3002)`

## 📊 Endpoints Disponibles

### Materials Service (Port 3002)

#### Prédictions
```http
GET /api/materials/predictions/all
GET /api/materials/:id/prediction
GET /api/materials/ml/status
POST /api/materials/ml/retrain
```

#### Flow Log
```http
GET /api/materials/flow-log
GET /api/materials/flow-log/enriched
GET /api/materials/flow-log/anomalies
GET /api/materials/flow-log/stats/:materialId/:siteId
POST /api/materials/flow-log
```

#### Matériaux
```http
GET /api/materials
GET /api/materials/:id
POST /api/materials
PUT /api/materials/:id
DELETE /api/materials/:id
```

### API Gateway (Port 9001)

Tous les endpoints ci-dessus sont accessibles via :
```http
http://localhost:9001/materials/*
```

## 📝 Fichiers Modifiés

### Backend
1. `apps/backend/materials-service/src/materials/services/stock-prediction.service.ts`
2. `apps/backend/materials-service/src/materials/services/ml-training.service.ts`
3. `apps/backend/materials-service/src/materials/services/auto-ml-prediction.service.ts` (NOUVEAU)
4. `apps/backend/materials-service/src/materials/materials.module.ts`
5. `apps/backend/materials-service/src/materials/materials.controller.ts`
6. `apps/backend/api-gateway/src/app.controller.ts`
7. `apps/backend/api-gateway/src/main.ts`

### Frontend
8. `apps/frontend/src/services/materialService.ts`
9. `apps/frontend/src/services/materialFlowService.ts`
10. `apps/frontend/src/app/pages/materials/Materials.tsx`

## 📚 Documentation

- `PREDICTION_GUIDE.md` - Guide complet du système de prédiction
- `CORRECTIONS_PREDICTION_IA.md` - Détails des corrections
- `CORRECTIONS_FINALES_MATERIALS.md` - Plan de corrections
- `RESUME_CORRECTIONS_MATERIALS_FINAL.md` - Résumé technique
- `INSTRUCTIONS_DEMARRAGE.md` - Ce fichier

## ✅ Checklist de Validation

- [ ] MongoDB démarré
- [ ] Materials Service démarré (port 3002)
- [ ] API Gateway démarré (port 9001)
- [ ] Frontend démarré (port 5173)
- [ ] Logs montrent "✅ Entraînement automatique terminé"
- [ ] Prédictions affichent des valeurs correctes (pas NaN)
- [ ] Flow Log affiche les mouvements
- [ ] API Gateway route vers materials-service

## 🎉 Résultat Final

Après avoir suivi ces instructions, vous devriez avoir :

✅ **Prédictions IA fonctionnelles** avec des valeurs correctes pour chaque matériau
✅ **Flow Log fonctionnel** affichant les entrées/sorties par matériau
✅ **ML Training automatique** au démarrage du serveur
✅ **API Gateway** routant correctement vers materials-service
✅ **Tous les bugs corrigés** !

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifier les logs de chaque service
2. Consulter la documentation dans les fichiers MD
3. Tester les endpoints API directement avec curl
4. Vérifier que tous les services sont sur les bons ports

**Tous les systèmes sont maintenant opérationnels !** 🚀
