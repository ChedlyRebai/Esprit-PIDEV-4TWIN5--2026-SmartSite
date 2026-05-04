# 🚀 GUIDE DE REDÉMARRAGE - SYSTÈME DE PRÉDICTIONS

## ✅ Problème Résolu

Le proxy Vite a été corrigé pour pointer vers le bon port (3009) du materials-service.

## 📋 Étapes de Redémarrage

### 1️⃣ Arrêter tous les services en cours

Dans chaque terminal où un service tourne, appuyez sur `Ctrl+C`

### 2️⃣ Redémarrer le Materials Service

```bash
cd apps/backend/materials-service
npm start
```

**✅ Vérifier que vous voyez**:
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] MaterialsModule dependencies initialized
[Nest] INFO [StockPredictionService] ✅ TensorFlow.js Linear Regression Model initialized
[Nest] INFO [NestApplication] Nest application successfully started
[Nest] INFO Materials Service listening on port 3009
```

**❌ Si vous voyez des erreurs TypeScript**:
```bash
# Nettoyer et réinstaller
rm -rf node_modules dist
npm install
npm run build
npm start
```

### 3️⃣ Redémarrer le Frontend

**Dans un NOUVEAU terminal**:

```bash
cd apps/frontend
npm run dev
```

**✅ Vérifier que vous voyez**:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 4️⃣ Tester dans le Navigateur

1. Ouvrir `http://localhost:5173`
2. Aller sur la page **Materials**
3. Vérifier que:
   - ✅ Les matériaux s'affichent
   - ✅ Les prédictions IA s'affichent (colonne "Prédiction IA")
   - ✅ Le format est correct: `🚨 Aujourd'hui 14:30` ou `✅ Mercredi 16:00`
   - ✅ Pas d'erreur "Invalid Date" ou "NaN"

## 🔍 Tests de Vérification

### Test 1: Vérifier la connexion backend

```bash
# Test direct du materials-service
curl http://localhost:3009/api/materials

# Devrait retourner un JSON avec la liste des matériaux
```

### Test 2: Vérifier les prédictions

```bash
# Test des prédictions
curl http://localhost:3009/api/materials/predictions/all

# Devrait retourner un JSON avec les prédictions pour tous les matériaux
```

### Test 3: Vérifier le proxy Vite

Ouvrir la console du navigateur (F12) et vérifier:

```
✅ GET http://localhost:5173/api/materials 200 OK
✅ GET http://localhost:5173/api/materials/predictions/all 200 OK
```

**❌ Si vous voyez encore ECONNREFUSED**:
1. Vérifier que le materials-service tourne bien sur le port 3009
2. Redémarrer le frontend (Ctrl+C puis `npm run dev`)

## 🎯 Affichage Attendu des Prédictions

### Format dans le Tableau

| Matériau | Stock | Prédiction IA |
|----------|-------|---------------|
| Ciment | 150 | 🚨 Aujourd'hui 14:30<br>Dans 8h |
| Sable | 500 | ⚠️ Demain 09:15<br>Dans 1j 5h |
| Gravier | 1000 | ✅ Mercredi 16:00<br>Dans 3j 12h |

### Tooltip au Survol

Quand vous survolez une prédiction, vous devriez voir:

```
Ciment Portland
─────────────────────────
Stock actuel: 150 unités
Consommation: 2.5 unités/h
Stock prédit (24h): 90 unités
─────────────────────────
Rupture prévue: Mercredi 29 avril 14:30
Temps restant: 0j 8h
─────────────────────────
📦 Commander: 300 unités
```

## 🚨 Dépannage

### Problème: "Invalid Date" ou "NaN" dans les prédictions

**Cause**: Pas de données dans MaterialFlowLog

**Solution**:
1. Vérifier MongoDB:
   ```bash
   mongosh
   use smartsite-materials
   db.materialflowlogs.countDocuments()
   ```

2. Si aucune donnée, le système utilise un taux par défaut de 1.5 unités/heure

3. Pour ajouter des données de test:
   - Utiliser la page "Material Flow Log"
   - Ajouter des entrées/sorties manuellement

### Problème: Prédictions ne se chargent pas

**Vérifier les logs du materials-service**:

```
[Nest] INFO [MaterialsController] 📊 Génération de prédictions pour X matériaux
[Nest] INFO [StockPredictionService] 📊 Recherche consommation pour matériau...
[Nest] INFO [StockPredictionService] 📊 Taux calculé depuis historique: X unités/h
```

**Si vous voyez des erreurs**:
- Vérifier que MongoDB est démarré
- Vérifier la connexion MongoDB dans `.env`

### Problème: Bouton "Commander" ne fonctionne pas

**Vérifier les logs dans la console du navigateur**:

```javascript
🛒 handleReorder called: { materialId, materialName, ... }
✅ Dialog should open now
```

**Si le dialog ne s'ouvre pas**:
1. Vérifier que `CreateOrderDialog` est bien importé
2. Vérifier que `showOrderDialog` est bien à `true`
3. Vérifier les logs dans la console

## 📊 Monitoring en Temps Réel

### Mise à Jour Automatique

Le système met à jour automatiquement:

- **Toutes les 5 minutes**: Rechargement complet des prédictions depuis le backend
- **Toutes les 1 minute**: Décrémentation locale de l'affichage (les heures diminuent)

**Vous devriez voir**:
- Les heures diminuer progressivement
- Les badges changer de couleur quand le seuil critique est atteint
- Les notifications toast pour les alertes critiques

## ✅ Checklist Finale

Avant de considérer que tout fonctionne:

- [ ] Materials-service démarre sans erreur sur port 3009
- [ ] Frontend démarre sans erreur sur port 5173
- [ ] Page Materials charge sans erreur ECONNREFUSED
- [ ] Les matériaux s'affichent dans le tableau
- [ ] Les prédictions IA s'affichent avec le bon format
- [ ] Le tooltip affiche les détails au survol
- [ ] Le bouton "Commander" ouvre le dialog
- [ ] Les heures diminuent automatiquement toutes les minutes
- [ ] Les prédictions se rechargent toutes les 5 minutes

## 🎉 Succès !

Si tous les points de la checklist sont validés, le système fonctionne correctement !

**Prochaines étapes**:
1. Ajouter des données de test dans MaterialFlowLog
2. Tester la création de commandes
3. Tester les alertes d'anomalie
4. Tester le rapport quotidien IA

---

**Besoin d'aide ?**

Si un problème persiste:
1. Vérifier les logs du materials-service
2. Vérifier la console du navigateur (F12)
3. Tester les endpoints avec curl
4. Vérifier MongoDB

**Date**: 29 avril 2026
**Status**: ✅ PRÊT À REDÉMARRER
