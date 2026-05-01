# Guide du Système de Prédiction IA

## Vue d'ensemble

Le système de prédiction IA combine deux approches :
1. **Prédiction basée sur l'historique** : Calcule le taux de consommation depuis MaterialFlowLog
2. **Prédiction ML (Machine Learning)** : Entraîne un modèle TensorFlow.js avec le dataset test.csv

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Materials Controller                      │
│  GET /api/materials/predictions/all                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├──> AutoMLPredictionService (prioritaire)
                   │    └──> MLTrainingService
                   │         └──> TensorFlow.js Model
                   │
                   └──> StockPredictionService (fallback)
                        └──> MaterialFlowLog (historique)
```

## Fonctionnement

### 1. Au démarrage du serveur

```typescript
MaterialsModule.constructor()
  └──> AutoMLPredictionService.autoTrainOnStartup()
       ├──> Lit test.csv
       ├──> Extrait les matériaux uniques (MAT001, MAT002, ...)
       ├──> Entraîne un modèle pour chaque matériau
       └──> Sauvegarde les modèles dans uploads/models/
```

### 2. Lors d'une requête de prédiction

```typescript
GET /api/materials/predictions/all
  └──> Pour chaque matériau:
       ├──> Essaie AutoMLPredictionService.getPrediction()
       │    ├──> Si modèle ML disponible → Prédiction ML
       │    └──> Sinon → null
       │
       └──> Si null → StockPredictionService.predictStockDepletion()
            └──> Calcule depuis MaterialFlowLog
```

## Format du Dataset (test.csv)

```csv
timestamp,materialId,materialName,siteId,siteName,stockLevel,consumption,hourOfDay,dayOfWeek,weather,projectType,siteActivityLevel
2024-01-01T00:00:00Z,MAT001,Ciment Portland,SITE001,Chantier Nord,1000,0,0,1,sunny,residential,low
2024-01-01T01:00:00Z,MAT001,Ciment Portland,SITE001,Chantier Nord,1000,0,1,1,sunny,residential,low
...
```

### Colonnes requises :
- `materialId` : ID du matériau (MAT001, MAT002, ...)
- `stockLevel` : Niveau de stock à ce moment
- `timestamp` : Date/heure (optionnel, pour référence)

### Colonnes optionnelles :
- `consumption` : Consommation horaire
- `weather` : Conditions météo
- `siteActivityLevel` : Niveau d'activité du chantier

## Endpoints API

### 1. Obtenir toutes les prédictions
```http
GET /api/materials/predictions/all
```

**Réponse :**
```json
[
  {
    "materialId": "MAT001",
    "materialName": "Ciment Portland",
    "currentStock": 100,
    "predictedStock": 76,
    "consumptionRate": 1.5,
    "hoursToOutOfStock": 67,
    "status": "warning",
    "confidence": 0.85,
    "message": "⚠️ Attention! Stock faible. Rupture prévue dans 67h."
  }
]
```

### 2. Statut des modèles ML
```http
GET /api/materials/ml/status
```

**Réponse :**
```json
{
  "success": true,
  "trainedModels": 5,
  "message": "5 modèles ML entraînés"
}
```

### 3. Réentraîner tous les modèles
```http
POST /api/materials/ml/retrain
```

**Réponse :**
```json
{
  "success": true,
  "trainedModels": 5,
  "message": "Tous les modèles ont été réentraînés avec succès"
}
```

### 4. Upload d'un nouveau dataset
```http
POST /api/materials/ml/upload-dataset
Content-Type: multipart/form-data

dataset: [fichier CSV]
materialId: MAT001
```

### 5. Entraîner un modèle spécifique
```http
POST /api/materials/ml/train
Content-Type: application/json

{
  "materialId": "MAT001",
  "datasetPath": "uploads/datasets/dataset-MAT001-1234567890.csv"
}
```

## Calcul du Taux de Consommation

### Depuis MaterialFlowLog (historique)

```typescript
// Récupère les sorties (OUT) des 30 derniers jours
const outMovements = await MaterialFlowLog.aggregate([
  {
    $match: {
      materialId: ObjectId(materialId),
      type: 'OUT',
      timestamp: { $gte: thirtyDaysAgo }
    }
  },
  {
    $group: {
      _id: null,
      totalOut: { $sum: '$quantity' },
      firstDate: { $min: '$timestamp' },
      lastDate: { $max: '$timestamp' }
    }
  }
]);

// Calcule le taux horaire
const hoursDiff = (lastDate - firstDate) / (1000 * 60 * 60);
const hourlyRate = totalOut / hoursDiff;
```

### Combinaison avec le taux fourni

```typescript
// Moyenne pondérée: 70% historique, 30% fourni
effectiveRate = historicalRate * 0.7 + providedRate * 0.3;
```

### Ajustement météo

```typescript
const weatherMultipliers = {
  sunny: 1.0,   // Conditions normales
  cloudy: 1.05, // Légère augmentation
  rainy: 1.3,   // Pluie = travail plus lent
  stormy: 1.5,  // Orage = conditions difficiles
  snowy: 1.4,   // Neige = conditions difficiles
  windy: 1.1    // Vent = légère augmentation
};

effectiveRate = effectiveRate * weatherMultiplier;
```

## Statuts de Prédiction

| Statut | Condition | Badge | Description |
|--------|-----------|-------|-------------|
| `safe` | ≥ 72h | ✅ Vert | Stock sécurisé |
| `warning` | 24h - 72h | ⚠️ Jaune | Stock faible |
| `critical` | < 24h | 🚨 Rouge (pulse) | Rupture imminente |

## Affichage Frontend

### Format de date/heure

```typescript
if (hoursToOutOfStock < 24) {
  // "🚨 Aujourd'hui 14:30"
  return `Aujourd'hui ${ruptureDate.toLocaleTimeString('fr-FR')}`;
} else if (hoursToOutOfStock < 48) {
  // "⚠️ Demain 09:15"
  return `Demain ${ruptureDate.toLocaleTimeString('fr-FR')}`;
} else if (days < 7) {
  // "✅ Mercredi 16:00"
  return `${dayNames[ruptureDate.getDay()]} ${ruptureDate.toLocaleTimeString('fr-FR')}`;
} else {
  // "✅ 15 mai 10:00"
  return ruptureDate.toLocaleDateString('fr-FR');
}
```

### Mise à jour automatique

```typescript
// Recharger les prédictions toutes les 5 minutes
useEffect(() => {
  const interval = setInterval(() => {
    loadPredictions();
  }, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);

// Décrémenter l'affichage toutes les 1 minute
useEffect(() => {
  const interval = setInterval(() => {
    setPredictions(prev => {
      const updated = new Map(prev);
      updated.forEach((prediction, key) => {
        updated.set(key, {
          ...prediction,
          hoursToOutOfStock: Math.max(0, prediction.hoursToOutOfStock - (1/60))
        });
      });
      return updated;
    });
  }, 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

## Dépannage

### Problème : Prédictions identiques pour tous les matériaux

**Cause :** Le service ne filtre pas correctement par matériau

**Solution :**
```typescript
// Vérifier que MaterialFlowLog contient bien materialId
const matchQuery = {
  materialId: new Types.ObjectId(materialId), // ✅ Correct
  type: 'OUT',
  timestamp: { $gte: thirtyDaysAgo }
};
```

### Problème : Valeurs NaN dans les prédictions

**Cause :** Pas de données dans MaterialFlowLog

**Solution :**
```typescript
// Utiliser un taux par défaut si pas d'historique
if (outMovements.length === 0) {
  return 1.5; // 1.5 unités/heure par défaut
}
```

### Problème : Modèles ML non entraînés

**Cause :** test.csv introuvable ou format incorrect

**Solution :**
1. Vérifier que `test.csv` existe à la racine du projet
2. Vérifier le format CSV (colonnes `materialId` et `stockLevel`)
3. Réentraîner manuellement : `POST /api/materials/ml/retrain`

### Problème : Prédictions ne se mettent pas à jour

**Cause :** Intervalles frontend non configurés

**Solution :**
```typescript
// Vérifier que les useEffect sont bien présents dans Materials.tsx
useEffect(() => {
  loadPredictions(); // Chargement initial
  const interval = setInterval(loadPredictions, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

## Logs de Débogage

### Backend (NestJS)

```bash
# Démarrage
🚀 Démarrage entraînement automatique avec test.csv
📊 5 matériaux trouvés dans test.csv
🤖 Entraînement pour matériau MAT001...
✅ Modèle entraîné pour MAT001: uploads/models/model-MAT001-1234567890

# Prédiction
📊 Recherche consommation pour matériau MAT001 depuis 2024-03-30
📊 Taux calculé depuis historique: 1.50 unités/h (360 unités sur 240h, 12 mouvements)
✅ Prédiction ML pour Ciment Portland: 67h
```

### Frontend (React)

```javascript
console.log('🔮 Chargement prédictions...');
console.log('✅ Prédictions chargées:', predictions.size);
console.log('⏱️ Mise à jour automatique dans 5 minutes');
```

## Performance

- **Entraînement initial** : ~30 secondes pour 5 matériaux
- **Prédiction ML** : ~50ms par matériau
- **Prédiction historique** : ~20ms par matériau
- **Requête complète** : ~500ms pour 10 matériaux

## Améliorations Futures

1. **Cache Redis** : Mettre en cache les prédictions pendant 5 minutes
2. **WebSocket** : Push des prédictions en temps réel
3. **Modèles avancés** : LSTM pour capturer les tendances saisonnières
4. **Facteurs externes** : Intégrer météo, jours fériés, événements
5. **Auto-tuning** : Ajuster automatiquement les hyperparamètres
