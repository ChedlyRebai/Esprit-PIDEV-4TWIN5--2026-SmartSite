# Intégration FastAPI ML - Guide Complet

## 🎯 Objectif

Remplacer la logique de prédiction locale du materials-service par des appels à FastAPI ML service.

## 📋 Modifications Nécessaires

### 1. Modifier le Controller pour Utiliser FastAPI

**Fichier**: `apps/backend/materials-service/src/materials/materials.controller.ts`

**Remplacer l'endpoint `/predictions/all`**:

```typescript
@Get(['prediction/all', 'predictions/all'])
async getAllPredictions() {
  const materials = await this.materialsService.findAll({ limit: 100 });
  const materialList = Array.isArray(materials)
    ? materials
    : (materials as any).data || [];

  this.logger.log(`📊 Génération de prédictions ML pour ${materialList.length} matériaux`);

  // Vérifier si le service ML est disponible
  const isMLAvailable = await this.mlPredictionService.isServiceAvailable();
  
  if (!isMLAvailable) {
    this.logger.warn('⚠️ ML Service non disponible, utilisation de la prédiction standard');
    // Fallback vers prédiction standard
    return this.getStandardPredictions(materialList);
  }

  // Utiliser FastAPI pour les prédictions
  const predictions = await Promise.all(
    materialList.map(async (material: any) => {
      try {
        // Appeler FastAPI pour la prédiction
        const mlPrediction = await this.mlPredictionService.predictStockDepletion({
          material_id: material._id.toString(),
          material_name: material.name,
          current_stock: material.quantity || 0,
          minimum_stock: material.minimumStock || 0,
          consumption_rate: material.consumptionRate || 10,
          days_to_predict: 7
        });

        // Convertir la réponse FastAPI au format attendu par le frontend
        return {
          materialId: mlPrediction.material_id,
          materialName: mlPrediction.material_name,
          currentStock: mlPrediction.current_stock,
          predictedStock: mlPrediction.predicted_stock_in_days,
          consumptionRate: material.consumptionRate || 10,
          minimumStock: material.minimumStock || 0,
          maximumStock: material.maximumStock || material.quantity * 2,
          reorderPoint: material.stockMinimum || material.minimumStock || 0,
          hoursToLowStock: mlPrediction.days_until_stockout ? mlPrediction.days_until_stockout * 24 : 999,
          hoursToOutOfStock: mlPrediction.days_until_stockout ? mlPrediction.days_until_stockout * 24 : 999,
          status: mlPrediction.status,
          recommendedOrderQuantity: mlPrediction.recommended_order_quantity,
          predictionModelUsed: true,
          confidence: mlPrediction.confidence,
          simulationData: [],
          message: mlPrediction.message,
        };
      } catch (error) {
        this.logger.error(
          `❌ Erreur prédiction ML ${material.name}: ${error.message}`,
        );
        // Fallback vers prédiction standard pour ce matériau
        return this.getStandardPredictionForMaterial(material);
      }
    }),
  );

  const validPredictions = predictions.filter((p) => p !== null);
  this.logger.log(`✅ ${validPredictions.length} prédictions ML générées avec succès`);
  
  return validPredictions;
}

// Méthode fallback pour prédiction standard
private async getStandardPredictions(materialList: any[]) {
  const predictions = await Promise.all(
    materialList.map(async (material: any) => {
      try {
        return await this.predictionService.predictStockDepletion(
          material._id.toString(),
          material.name,
          material.quantity,
          material.minimumStock || 0,
          material.maximumStock || material.quantity * 2,
          material.stockMinimum || material.minimumStock || 0,
          material.consumptionRate || 0,
        );
      } catch (error) {
        return null;
      }
    }),
  );
  return predictions.filter((p) => p !== null);
}

private getStandardPredictionForMaterial(material: any) {
  const consumptionRate = material.consumptionRate || 10;
  const currentStock = material.quantity || 0;
  const minimumStock = material.minimumStock || 0;
  
  const daysUntilStockout = consumptionRate > 0 
    ? currentStock / consumptionRate 
    : 999;
  
  let status = 'normal';
  if (daysUntilStockout <= 2) status = 'critical';
  else if (daysUntilStockout <= 10) status = 'warning';
  
  return {
    materialId: material._id.toString(),
    materialName: material.name,
    currentStock,
    predictedStock: currentStock - (consumptionRate * 7),
    consumptionRate,
    minimumStock,
    maximumStock: material.maximumStock || currentStock * 2,
    reorderPoint: material.stockMinimum || minimumStock,
    hoursToLowStock: daysUntilStockout * 24,
    hoursToOutOfStock: daysUntilStockout * 24,
    status,
    recommendedOrderQuantity: Math.max(0, (consumptionRate * 30) + minimumStock - currentStock),
    predictionModelUsed: false,
    confidence: 0.5,
    simulationData: [],
    message: `Prédiction standard: ${daysUntilStockout.toFixed(1)} jours`,
  };
}
```

### 2. Ajouter l'Injection du Service ML

Dans le constructor du MaterialsController:

```typescript
constructor(
  private readonly materialsService: MaterialsService,
  private readonly predictionService: StockPredictionService,
  private readonly mlTrainingService: MLTrainingService,
  private readonly autoMLService: AutoMLPredictionService,
  private readonly intelligentRecommendationService: IntelligentRecommendationService,
  private readonly sitesService: SitesService,
  private readonly anomalyEmailService: AnomalyEmailService,
  private readonly dailyReportService: DailyReportService,
  private readonly mlPredictionService: MLPredictionClientService, // AJOUTER CETTE LIGNE
) {}
```

### 3. Créer un Endpoint pour Détection d'Anomalies

Ajouter dans `materials.controller.ts`:

```typescript
@Post('consumption/detect-anomaly')
async detectConsumptionAnomaly(@Body() body: {
  materialId: string;
  currentConsumption: number;
  averageConsumption: number;
  stdConsumption: number;
}) {
  try {
    const material = await this.materialsService.findOne(body.materialId);
    
    if (!material) {
      throw new BadRequestException('Matériau non trouvé');
    }

    // Appeler FastAPI pour la détection d'anomalie
    const anomalyResult = await this.mlPredictionService.detectConsumptionAnomaly({
      material_id: body.materialId,
      material_name: material.name,
      current_consumption: body.currentConsumption,
      average_consumption: body.averageConsumption,
      std_consumption: body.stdConsumption,
    });

    this.logger.log(
      `🔍 Anomalie détectée pour ${material.name}: ${anomalyResult.consumption_status}`,
    );

    return {
      success: true,
      data: anomalyResult,
    };
  } catch (error) {
    this.logger.error(`❌ Erreur détection anomalie: ${error.message}`);
    return {
      success: false,
      message: error.message,
    };
  }
}
```

### 4. Désactiver les Appels en Boucle dans le Frontend

**Fichier**: `apps/frontend/src/app/pages/materials/Materials.tsx`

Chercher et modifier la fonction qui appelle `/predictions/all`:

```typescript
// Charger les prédictions UNE SEULE FOIS au montage du composant
useEffect(() => {
  const loadPredictions = async () => {
    try {
      const predictions = await materialService.getAllPredictions();
      setPredictions(predictions);
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  loadPredictions();
  
  // Recharger toutes les 5 minutes (pas en boucle!)
  const interval = setInterval(loadPredictions, 5 * 60 * 1000);
  
  return () => clearInterval(interval);
}, []); // Dépendances vides = exécution une seule fois
```

## 🚀 Commandes pour Appliquer les Modifications

### Étape 1: Arrêter materials-service

Dans le terminal où tourne materials-service, appuyez sur `CTRL+C`

### Étape 2: Appliquer les modifications

Les modifications ci-dessus doivent être appliquées manuellement dans les fichiers.

### Étape 3: Redémarrer materials-service

```bash
cd apps/backend/materials-service
npm run start:dev
```

### Étape 4: Vérifier les logs

Vous devriez voir:
```
🤖 ML Prediction Service URL: http://localhost:8000
📊 Génération de prédictions ML pour X matériaux
✅ X prédictions ML générées avec succès
```

## 🧪 Test

### Test 1: Vérifier que FastAPI est appelé

Dans les logs de FastAPI, vous devriez voir:
```
🔵 Stock prediction request for: Ciment
✅ Prediction: 5.0 days until stockout (warning)
```

### Test 2: Vérifier le Frontend

Le frontend devrait afficher les prédictions **sans boucle infinie**.

## 📊 Architecture Finale

```
Frontend (React)
    ↓ GET /api/materials/predictions/all
Materials Service (NestJS)
    ↓ POST http://localhost:8000/predict/stock
FastAPI ML Service (Python)
    ↓ Utilise les datasets
    ↓ Retourne prédictions ML
Materials Service
    ↓ Formate les résultats
Frontend
    ↓ Affiche les prédictions
```

## ✅ Checklist

- [ ] MLPredictionClientService injecté dans MaterialsController
- [ ] Endpoint `/predictions/all` modifié pour utiliser FastAPI
- [ ] Méthode fallback implémentée
- [ ] Endpoint `/consumption/detect-anomaly` ajouté
- [ ] Frontend modifié pour éviter la boucle infinie
- [ ] Materials-service redémarré
- [ ] FastAPI toujours en cours d'exécution
- [ ] Tests effectués

## 🐛 Dépannage

### Problème: "ML Service non disponible"

**Vérifier**:
1. FastAPI tourne sur port 8000
2. Variable `ML_PREDICTION_SERVICE_URL=http://localhost:8000` dans `.env`
3. Pas de firewall bloquant

### Problème: Boucle infinie persiste

**Solution**: Vérifier que `useEffect` a des dépendances vides `[]` dans Materials.tsx

### Problème: Prédictions incorrectes

**Solution**: Vérifier que les données envoyées à FastAPI sont correctes (stock, consumption_rate, etc.)
