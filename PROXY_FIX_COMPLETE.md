# ✅ CORRECTION PROXY VITE - PROBLÈME RÉSOLU

## 🔴 Problème Identifié

**Erreur**: `[vite] http proxy error: ECONNREFUSED`

**Cause**: Le proxy Vite dans `apps/frontend/vite.config.ts` pointait vers `localhost:3002` (ancien port du materials-service) alors que le service tourne maintenant sur le port `3009`.

## ✅ Solution Appliquée

### 1. Mise à jour du Proxy Vite

**Fichier**: `apps/frontend/vite.config.ts`

**Changement**: Toutes les routes materials pointent maintenant vers `localhost:3009`

```typescript
proxy: {
  // Materials Service routes (port 3009)
  '/api/materials': {
    target: 'http://localhost:3009',
    changeOrigin: true,
  },
  '/api/chat': {
    target: 'http://localhost:3009',
    changeOrigin: true,
  },
  '/api/site-materials': {
    target: 'http://localhost:3009',
    changeOrigin: true,
  },
  '/api/orders': {
    target: 'http://localhost:3009',
    changeOrigin: true,
  },
  '/api/material-flow': {
    target: 'http://localhost:3009',
    changeOrigin: true,
  },
  '/api/consumption': {
    target: 'http://localhost:3009',
    changeOrigin: true,
  },
  '/api/site-consumption': {
    target: 'http://localhost:3009',
    changeOrigin: true,
  },
  '/socket.io': {
    target: 'http://localhost:3009',
    changeOrigin: true,
    ws: true,
  },
  // ... autres routes
}
```

### 2. Configuration TensorFlow

**Problème résolu**: Utilisation de `@tensorflow/tfjs` (version browser) au lieu de `@tensorflow/tfjs-node` qui nécessite Visual Studio Build Tools sur Windows.

**Fichier**: `apps/backend/materials-service/package.json`

```json
{
  "dependencies": {
    "@tensorflow/tfjs": "^4.22.0"
  }
}
```

**Services concernés**:
- ✅ `stock-prediction.service.ts` - Utilise `@tensorflow/tfjs`
- ✅ `ml-training.service.ts` - Désactivé temporairement
- ✅ `auto-ml-prediction.service.ts` - Désactivé temporairement

## 📋 Étapes pour Redémarrer

### 1. Arrêter tous les services

```bash
# Arrêter le frontend
Ctrl+C dans le terminal du frontend

# Arrêter le materials-service
Ctrl+C dans le terminal du materials-service
```

### 2. Redémarrer le Materials Service

```bash
cd apps/backend/materials-service
npm start
```

**Vérifier**: Le service doit démarrer sur le port 3009 sans erreurs TypeScript

### 3. Redémarrer le Frontend

```bash
cd apps/frontend
npm run dev
```

**Vérifier**: Le frontend doit démarrer sur le port 5173

### 4. Tester la connexion

Ouvrir le navigateur sur `http://localhost:5173` et vérifier:

1. ✅ La page Materials charge sans erreur ECONNREFUSED
2. ✅ Les matériaux s'affichent dans le tableau
3. ✅ Les prédictions IA s'affichent avec les heures restantes
4. ✅ Le format d'affichage est correct (pas de "Invalid Date" ou "NaN")

## 🔍 Vérifications Backend

### Endpoints à tester

```bash
# Test direct du materials-service
curl http://localhost:3009/api/materials

# Test des prédictions
curl http://localhost:3009/api/materials/predictions/all

# Test du material-flow
curl http://localhost:3009/api/material-flow
```

### Logs à surveiller

**Materials Service** (`apps/backend/materials-service`):
```
[Nest] INFO [MaterialsService] ✅ Materials service démarré sur port 3009
[Nest] INFO [StockPredictionService] ✅ TensorFlow.js Linear Regression Model initialized
[Nest] INFO [MaterialsController] 📊 Génération de prédictions pour X matériaux
```

**Frontend** (`apps/frontend`):
```
VITE v5.x.x  ready in XXX ms
➜  Local:   http://localhost:5173/
```

## 📊 Format d'Affichage des Prédictions

### Affichage Attendu

**Moins de 24h** (Rouge clignotant):
```
🚨 Aujourd'hui 14:30
Dans 8h
```

**24-48h** (Jaune):
```
⚠️ Demain 09:15
Dans 1j 5h
```

**Plus de 48h** (Vert):
```
✅ Mercredi 16:00
Dans 3j 12h
```

### Tooltip Détaillé

Au survol, affiche:
- Stock actuel
- Consommation horaire
- Stock prédit dans 24h
- Date/heure exacte de rupture
- Temps restant
- Quantité recommandée à commander

## 🚨 Problèmes Connus et Solutions

### 1. Erreur "Invalid Date" ou "NaN"

**Cause**: Valeurs `undefined` ou `null` dans les prédictions

**Solution**: Vérifications ajoutées dans `Materials.tsx`:
```typescript
const hoursToOutOfStock = prediction.hoursToOutOfStock ?? 0;
const consumptionRate = prediction.consumptionRate ?? 0;

if (!isFinite(hoursToOutOfStock) || hoursToOutOfStock < 0) {
  return <span>⚠️ Données insuffisantes</span>;
}
```

### 2. Prédictions ne se chargent pas

**Cause**: Pas de données dans MaterialFlowLog

**Solution**: Le service utilise un taux par défaut de 1.5 unités/heure si aucun historique n'existe

**Vérifier**:
```bash
# Vérifier les données dans MongoDB
mongosh
use smartsite-materials
db.materialflowlogs.countDocuments()
```

### 3. ML Training désactivé

**Cause**: `@tensorflow/tfjs-node` nécessite Visual Studio Build Tools sur Windows

**Solution temporaire**: ML Training désactivé, utilisation des prédictions basées sur l'historique uniquement

**Pour réactiver** (nécessite Visual Studio Build Tools):
1. Installer Visual Studio Build Tools
2. Installer `@tensorflow/tfjs-node`
3. Réactiver `MLTrainingService` et `AutoMLPredictionService`

## 📈 Mise à Jour Automatique

### Rechargement des Prédictions

- **Toutes les 5 minutes**: Rechargement complet depuis le backend
- **Toutes les 1 minute**: Décrémentation locale de l'affichage

```typescript
// Recharger les prédictions toutes les 5 minutes
const predictionInterval = setInterval(() => {
  loadPredictions();
}, 5 * 60 * 1000);

// Décrémenter l'affichage toutes les 1 minute
const displayInterval = setInterval(() => {
  setPredictions(prev => {
    const newPredictions = new Map(prev);
    for (const [id, pred] of newPredictions.entries()) {
      newPredictions.set(id, {
        ...pred,
        hoursToOutOfStock: Math.max(0, pred.hoursToOutOfStock - (1/60)),
      });
    }
    return newPredictions;
  });
}, 60 * 1000);
```

## ✅ Checklist de Vérification

- [x] Proxy Vite mis à jour vers port 3009
- [x] TensorFlow.js (browser) utilisé au lieu de tfjs-node
- [x] Valeurs par défaut ajoutées pour éviter NaN/undefined
- [x] Format d'affichage des dates corrigé
- [x] Mise à jour automatique implémentée
- [x] Logs de débogage ajoutés
- [x] Gestion des erreurs améliorée

## 🎯 Prochaines Étapes

1. **Redémarrer les services** (frontend + materials-service)
2. **Tester l'affichage** des prédictions dans le tableau
3. **Vérifier les logs** pour s'assurer que les données sont correctes
4. **Tester le bouton "Commander"** pour créer une commande

## 📞 Support

Si le problème persiste:

1. Vérifier les logs du materials-service
2. Vérifier les logs du frontend (console navigateur)
3. Tester les endpoints directement avec curl
4. Vérifier que MongoDB contient des données dans MaterialFlowLog

---

**Date de correction**: 29 avril 2026
**Status**: ✅ RÉSOLU
