# 🔧 Corrections - Anomalies et Matériaux Expirants

**Date:** 1er Mai 2026  
**Objectif:** Améliorer la détection des anomalies, des flux de matériaux et des matériaux expirants

---

## 📋 Problèmes Identifiés

### 1. ❌ Matériaux Expirants Non Détectés
**Problème:** L'interface affiche "0 matériau expire dans les 30 prochains jours" même s'il y a des matériaux avec des dates d'expiration.

**Cause:** 
- La requête MongoDB ne vérifiait pas si le champ `expiryDate` existe
- Pas de logs pour déboguer
- Certains matériaux n'ont peut-être pas de `expiryDate` définie

### 2. ❌ Anomalies de Flux Non Visibles
**Problème:** Les anomalies de flux (entrées/sorties excessives) ne sont pas affichées dans l'interface "Anomalies".

**Cause:**
- Pas d'endpoint consolidé pour récupérer toutes les anomalies
- Les données de `material-flow-log` ne sont pas intégrées dans la vue des anomalies

### 3. ❌ Détection des Risques de Vol/Gaspillage
**Problème:** Besoin de détecter les matériaux avec des sorties excessives par rapport aux entrées.

**Cause:**
- Pas d'analyse des ratios entrées/sorties
- Pas de corrélation avec les chantiers

---

## ✅ Corrections Apportées

### 1. 🔍 Amélioration de la Détection des Matériaux Expirants

**Fichier:** `apps/backend/materials-service/src/materials/materials.service.ts`

**Modifications:**
```typescript
async getExpiringMaterials(days: number = 30): Promise<Material[]> {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);

  this.logger.log(`🔍 Recherche des matériaux expirant dans ${days} jours...`);
  this.logger.log(`📅 Date cible: ${targetDate.toISOString()}`);

  // Rechercher les matériaux avec une date d'expiration définie
  const materials = await this.materialModel
    .find({
      expiryDate: { $exists: true, $ne: null, $lte: targetDate, $gte: new Date() },
      status: 'active',
    })
    .sort({ expiryDate: 1 })
    .exec();

  this.logger.log(`✅ ${materials.length} matériaux expirants trouvés`);
  
  // Log des matériaux trouvés pour debug
  materials.forEach(m => {
    const daysToExpiry = Math.ceil((m.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    this.logger.log(`   - ${m.name}: expire dans ${daysToExpiry} jours (${m.expiryDate.toLocaleDateString()})`);
  });

  return materials;
}
```

**Améliorations:**
- ✅ Vérification explicite que `expiryDate` existe et n'est pas null
- ✅ Logs détaillés pour le débogage
- ✅ Affichage de chaque matériau expirant trouvé

---

### 2. 🔄 Nouveau Contrôleur pour Anomalies Consolidées

**Fichier:** `apps/backend/materials-service/src/materials/controllers/anomalies-consolidated.controller.ts`

**Fonctionnalité:**
Endpoint unique qui consolide toutes les anomalies :
- Anomalies ML (vol, gaspillage, surconsommation) via FastAPI
- Anomalies de flux (entrées/sorties excessives) via `material-flow-log`
- Matériaux expirants

**Endpoint:**
```
GET /api/materials/anomalies/consolidated?siteId=...&days=30
```

**Réponse:**
```json
{
  "success": true,
  "period": "30 days",
  "summary": {
    "totalAnomalies": 15,
    "criticalCount": 3,
    "warningCount": 8,
    "mlAnomalies": {
      "theftRisk": 2,
      "wasteRisk": 1,
      "overConsumption": 3
    },
    "flowAnomalies": {
      "totalMaterials": 50,
      "materialsWithAnomalies": 5,
      "criticalAnomalies": 2,
      "warningAnomalies": 3
    },
    "expiringMaterials": 4
  },
  "anomalies": {
    "mlDetected": {
      "theftRisk": [...],
      "wasteRisk": [...],
      "overConsumption": [...]
    },
    "flowAnalysis": [
      {
        "siteId": "...",
        "siteName": "Chantier Nord",
        "totalAnomalies": 3,
        "criticalCount": 1,
        "materials": [
          {
            "materialId": "...",
            "materialName": "Ciment",
            "totalIn": 100,
            "totalOut": 250,
            "netFlow": -150,
            "anomalyType": "EXCESSIVE_OUT",
            "riskLevel": "CRITICAL",
            "riskReason": "🚨 RISQUE CRITIQUE DE VOL/GASPILLAGE: Sorties (250) sont 250% supérieures aux entrées (100)"
          }
        ]
      }
    ],
    "expiringMaterials": [
      {
        "materialId": "...",
        "materialName": "Peinture",
        "expiryDate": "2026-05-15",
        "daysToExpiry": 14,
        "currentStock": 50,
        "severity": "high"
      }
    ]
  }
}
```

---

### 3. 📊 Analyse des Flux Améliorée

**Fichier:** `apps/backend/materials-service/src/materials/services/material-flow.service.ts`

**Méthode existante améliorée:** `analyzeFlowAnomalies()`

**Fonctionnalités:**
- ✅ Calcul du ratio entrées/sorties par matériau et par site
- ✅ Détection des sorties excessives (> 150% des entrées)
- ✅ Classification des risques : CRITICAL, HIGH, MEDIUM, LOW
- ✅ Messages d'alerte détaillés
- ✅ Identification des chantiers à risque

**Niveaux de Risque:**
```typescript
if (outInRatio > 2) {
  riskLevel = 'CRITICAL';
  riskReason = `🚨 RISQUE CRITIQUE DE VOL/GASPILLAGE: Sorties (${totalOut}) sont ${(outInRatio * 100).toFixed(0)}% supérieures aux entrées (${totalIn})`;
} else if (outInRatio > 1.5) {
  riskLevel = 'HIGH';
  riskReason = `⚠️ RISQUE ÉLEVÉ: Sorties (${totalOut}) dépassent les entrées (${totalIn}) de ${((outInRatio - 1) * 100).toFixed(0)}%`;
}
```

---

### 4. 🔗 Intégration au Module

**Fichier:** `apps/backend/materials-service/src/materials/materials.module.ts`

**Modifications:**
```typescript
import { AnomaliesConsolidatedController } from './controllers/anomalies-consolidated.controller';

@Module({
  controllers: [
    // ... autres contrôleurs
    AnomaliesConsolidatedController,
  ],
  // ...
})
```

---

## 🎯 Utilisation

### 1. Vérifier les Matériaux Expirants

**Endpoint:**
```
GET /api/materials/expiring?days=30
```

**Logs attendus:**
```
🔍 Recherche des matériaux expirant dans 30 jours...
📅 Date cible: 2026-05-31T...
✅ 4 matériaux expirants trouvés
   - Peinture Blanche: expire dans 14 jours (15/05/2026)
   - Colle Carrelage: expire dans 22 jours (23/05/2026)
```

### 2. Obtenir Toutes les Anomalies

**Endpoint:**
```
GET /api/materials/anomalies/consolidated?days=30
```

**Utilisation Frontend:**
```typescript
const response = await fetch('/api/materials/anomalies/consolidated?days=30');
const data = await response.json();

console.log(`Total anomalies: ${data.summary.totalAnomalies}`);
console.log(`Risques de vol: ${data.summary.mlAnomalies.theftRisk}`);
console.log(`Matériaux expirants: ${data.summary.expiringMaterials}`);
```

### 3. Analyser les Flux par Site

**Endpoint:**
```
GET /api/material-flow/analyze-anomalies?siteId=...&days=30
```

**Réponse:**
```json
{
  "summary": {
    "totalMaterials": 50,
    "materialsWithAnomalies": 5,
    "criticalAnomalies": 2,
    "warningAnomalies": 3
  },
  "anomaliesBySite": [...]
}
```

---

## 🧪 Tests Recommandés

### 1. Test des Matériaux Expirants

```bash
# Vérifier les logs
curl http://localhost:3009/api/materials/expiring?days=30

# Vérifier dans MongoDB
db.materials.find({ 
  expiryDate: { $exists: true, $ne: null },
  status: 'active'
}).count()
```

### 2. Test des Anomalies Consolidées

```bash
# Obtenir toutes les anomalies
curl http://localhost:3009/api/materials/anomalies/consolidated?days=30

# Filtrer par site
curl "http://localhost:3009/api/materials/anomalies/consolidated?siteId=SITE_ID&days=30"
```

### 3. Test de l'Analyse des Flux

```bash
# Analyser tous les sites
curl http://localhost:3009/api/material-flow/analyze-anomalies?days=30

# Analyser un site spécifique
curl "http://localhost:3009/api/material-flow/analyze-anomalies?siteId=SITE_ID&days=30"
```

---

## 📝 Modifications Frontend Recommandées

### 1. Mettre à Jour AnomaliesList.tsx

**Ajouter l'appel au nouvel endpoint:**
```typescript
// Remplacer les appels séparés par un seul appel consolidé
const consolidatedResponse = await fetch('/api/materials/anomalies/consolidated?days=30');
const consolidatedData = await consolidatedResponse.json();

// Utiliser les données consolidées
const mlAnomalies = consolidatedData.anomalies.mlDetected;
const flowAnomalies = consolidatedData.anomalies.flowAnalysis;
const expiringMaterials = consolidatedData.anomalies.expiringMaterials;
```

### 2. Afficher les Anomalies de Flux

**Ajouter une section pour les flux:**
```typescript
{flowAnomalies.map(site => (
  <div key={site.siteId}>
    <h3>{site.siteName}</h3>
    {site.materials.map(material => (
      <div key={material.materialId} className={getRiskClass(material.riskLevel)}>
        <p>{material.materialName}</p>
        <p>{material.riskReason}</p>
        <p>Entrées: {material.totalIn} | Sorties: {material.totalOut}</p>
      </div>
    ))}
  </div>
))}
```

### 3. Améliorer l'Affichage des Matériaux Expirants

**Utiliser les données consolidées:**
```typescript
{expiringMaterials.map(material => (
  <div key={material.materialId} className={getSeverityClass(material.severity)}>
    <p>{material.materialName} ({material.materialCode})</p>
    <p>Expire dans {material.daysToExpiry} jours</p>
    <p>Stock actuel: {material.currentStock}</p>
    <p>Date d'expiration: {new Date(material.expiryDate).toLocaleDateString()}</p>
  </div>
))}
```

---

## 🔍 Débogage

### Si les Matériaux Expirants ne s'affichent pas:

1. **Vérifier les logs du backend:**
```bash
# Chercher dans les logs
grep "Recherche des matériaux expirant" logs/materials-service.log
```

2. **Vérifier MongoDB:**
```javascript
// Dans MongoDB Compass ou shell
db.materials.find({ 
  expiryDate: { $exists: true, $ne: null }
}).pretty()
```

3. **Ajouter des dates d'expiration de test:**
```javascript
// Script de test
db.materials.updateOne(
  { code: "CIM001" },
  { $set: { expiryDate: new Date("2026-05-15") } }
)
```

### Si les Anomalies de Flux ne s'affichent pas:

1. **Vérifier que FastAPI est démarré:**
```bash
curl http://localhost:8000/health
```

2. **Vérifier les flux dans MongoDB:**
```javascript
db.materialflowlogs.find({ 
  anomalyDetected: { $ne: "NONE" }
}).count()
```

3. **Tester l'endpoint directement:**
```bash
curl http://localhost:3009/api/material-flow/analyze-anomalies?days=30
```

---

## 📊 Résumé des Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/materials/expiring?days=30` | GET | Matériaux expirants |
| `/api/materials/anomalies/detect` | GET | Anomalies ML (FastAPI) |
| `/api/materials/anomalies/consolidated?days=30` | GET | **NOUVEAU** - Toutes les anomalies consolidées |
| `/api/material-flow/analyze-anomalies?days=30` | GET | Analyse des flux entrées/sorties |
| `/api/material-flow/enriched` | GET | Flux enrichis avec détails |

---

## ✅ Checklist de Vérification

- [ ] Les matériaux expirants s'affichent correctement
- [ ] Les logs montrent le nombre de matériaux expirants trouvés
- [ ] Les anomalies ML (vol, gaspillage) sont détectées
- [ ] Les anomalies de flux (entrées/sorties) sont visibles
- [ ] Le ratio entrées/sorties est calculé correctement
- [ ] Les niveaux de risque (CRITICAL, HIGH, etc.) sont affichés
- [ ] Les chantiers à risque sont identifiés
- [ ] L'endpoint consolidé fonctionne
- [ ] Le frontend affiche toutes les anomalies

---

## 🚀 Prochaines Étapes

1. **Tester les corrections:**
   - Redémarrer le service materials
   - Vérifier les logs
   - Tester chaque endpoint

2. **Mettre à jour le frontend:**
   - Utiliser l'endpoint consolidé
   - Afficher les anomalies de flux
   - Améliorer l'UI des matériaux expirants

3. **Ajouter des alertes:**
   - Email pour les matériaux expirants
   - Notifications pour les risques de vol
   - Alertes pour les sorties excessives

4. **Améliorer la détection:**
   - Affiner les seuils de détection
   - Ajouter plus de critères d'anomalie
   - Intégrer l'historique des anomalies

---

**Corrections effectuées avec succès ! 🎉**
