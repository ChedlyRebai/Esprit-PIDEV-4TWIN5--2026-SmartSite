# 🧪 Guide de Test - Anomalies et Matériaux Expirants

**Date:** 1er Mai 2026

---

## 🚀 Démarrage Rapide

### 1. Redémarrer le Service Materials

```bash
cd apps/backend/materials-service
npm run start:dev
```

**Vérifier les logs:**
```
[Nest] INFO [MaterialsService] ✅ Materials Service démarré
[Nest] INFO [AnomaliesConsolidatedController] ✅ Contrôleur anomalies consolidées chargé
```

---

## 🧪 Tests à Effectuer

### Test 1: Matériaux Expirants

**Endpoint:**
```bash
curl http://localhost:3009/api/materials/expiring?days=30
```

**Résultat attendu:**
```json
[
  {
    "_id": "...",
    "name": "Peinture Blanche",
    "code": "PEIN001",
    "expiryDate": "2026-05-15T00:00:00.000Z",
    "quantity": 50,
    "unit": "L"
  }
]
```

**Logs attendus:**
```
🔍 Recherche des matériaux expirant dans 30 jours...
📅 Date cible: 2026-05-31T...
✅ 4 matériaux expirants trouvés
   - Peinture Blanche: expire dans 14 jours (15/05/2026)
```

**Si aucun matériau trouvé:**
```bash
# Ajouter des dates d'expiration de test dans MongoDB
mongosh smartsite

db.materials.updateOne(
  { code: "CIM001" },
  { $set: { expiryDate: new Date("2026-05-15") } }
)

db.materials.updateOne(
  { code: "PEIN001" },
  { $set: { expiryDate: new Date("2026-05-20") } }
)
```

---

### Test 2: Anomalies ML (Vol, Gaspillage)

**Endpoint:**
```bash
curl http://localhost:3009/api/materials/anomalies/detect
```

**Résultat attendu:**
```json
{
  "success": true,
  "total_materials": 50,
  "anomalies_detected": 5,
  "theft_risk": [
    {
      "material_id": "...",
      "material_name": "Ciment",
      "severity": "critical",
      "message": "Theft risk detected",
      "deviation_percentage": 150.5,
      "current_consumption": 75.2,
      "average_consumption": 30.0
    }
  ],
  "waste_risk": [...],
  "over_consumption": [...]
}
```

**Prérequis:**
- FastAPI doit être démarré sur le port 8000
- Le fichier `anomaly-detection.csv` doit exister

**Vérifier FastAPI:**
```bash
curl http://localhost:8000/health
```

---

### Test 3: Anomalies de Flux (Entrées/Sorties)

**Endpoint:**
```bash
curl "http://localhost:3009/api/material-flow/analyze-anomalies?days=30"
```

**Résultat attendu:**
```json
{
  "summary": {
    "totalMaterials": 50,
    "materialsWithAnomalies": 5,
    "criticalAnomalies": 2,
    "warningAnomalies": 3
  },
  "anomaliesBySite": [
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
  ]
}
```

**Si aucune anomalie:**
```bash
# Créer des flux de test dans MongoDB
mongosh smartsite

# Ajouter des entrées
db.materialflowlogs.insertOne({
  siteId: ObjectId("SITE_ID"),
  materialId: ObjectId("MATERIAL_ID"),
  type: "IN",
  quantity: 100,
  timestamp: new Date(),
  userId: ObjectId("USER_ID"),
  previousStock: 50,
  newStock: 150
})

# Ajouter des sorties excessives
db.materialflowlogs.insertOne({
  siteId: ObjectId("SITE_ID"),
  materialId: ObjectId("MATERIAL_ID"),
  type: "OUT",
  quantity: 250,
  timestamp: new Date(),
  userId: ObjectId("USER_ID"),
  previousStock: 150,
  newStock: -100,
  anomalyDetected: "EXCESSIVE_OUT"
})
```

---

### Test 4: Anomalies Consolidées (NOUVEAU)

**Endpoint:**
```bash
curl "http://localhost:3009/api/materials/anomalies/consolidated?days=30"
```

**Résultat attendu:**
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
    "flowAnalysis": [...],
    "expiringMaterials": [...]
  }
}
```

**Logs attendus:**
```
🔍 [MATERIALS-SERVICE] CONSOLIDATED ANOMALIES REQUEST
================================================================================
📊 [MATERIALS-SERVICE] CONSOLIDATED ANOMALIES RESULTS:
   ├─ Total Anomalies: 15
   ├─ Critical: 3
   ├─ Warning: 8
   ├─ ML Theft Risk: 2
   ├─ ML Waste Risk: 1
   ├─ Flow Anomalies: 5
   └─ Expiring Materials: 4
================================================================================
```

---

## 🎨 Test Frontend

### 1. Ouvrir la Page Anomalies

```
http://localhost:5173/materials/anomalies-alerts
```

### 2. Vérifier l'Affichage

**Sections attendues:**
- 🚨 Theft Risk (Risque de vol)
- 📉 Waste Risk (Risque de gaspillage)
- 📊 Over-consumption (Surconsommation)
- 📦 Low stock (Stock bas)
- ⏰ Expiring (Matériaux expirants)

### 3. Vérifier les Détails

**Pour chaque anomalie:**
- ✅ Nom du matériau
- ✅ Code du matériau
- ✅ Type d'anomalie
- ✅ Niveau de sévérité (critical, high, medium)
- ✅ Message descriptif
- ✅ Consommation actuelle vs moyenne (pour ML)
- ✅ Ratio entrées/sorties (pour flux)
- ✅ Date d'expiration (pour expirants)

---

## 🔍 Débogage

### Problème: Aucun Matériau Expirant

**1. Vérifier MongoDB:**
```javascript
db.materials.find({ 
  expiryDate: { $exists: true, $ne: null }
}).count()
```

**2. Vérifier les logs:**
```bash
grep "Recherche des matériaux expirant" logs/materials-service.log
```

**3. Ajouter des données de test:**
```javascript
// Ajouter des dates d'expiration
db.materials.updateMany(
  { category: "Peinture" },
  { $set: { expiryDate: new Date("2026-05-20") } }
)
```

---

### Problème: Anomalies ML Non Détectées

**1. Vérifier FastAPI:**
```bash
curl http://localhost:8000/health
```

**2. Vérifier le dataset:**
```bash
ls -lh anomaly-detection.csv
head -n 5 anomaly-detection.csv
```

**3. Démarrer FastAPI:**
```bash
cd apps/backend/ml-prediction-service
uvicorn main:app --reload --port 8000
```

---

### Problème: Anomalies de Flux Non Détectées

**1. Vérifier les flux dans MongoDB:**
```javascript
db.materialflowlogs.find({}).count()
db.materialflowlogs.find({ type: "OUT" }).count()
db.materialflowlogs.find({ type: "IN" }).count()
```

**2. Vérifier les anomalies:**
```javascript
db.materialflowlogs.find({ 
  anomalyDetected: { $ne: "NONE" }
}).count()
```

**3. Créer des flux de test:**
```javascript
// Script de test
const siteId = ObjectId("SITE_ID");
const materialId = ObjectId("MATERIAL_ID");
const userId = ObjectId("USER_ID");

// Entrée normale
db.materialflowlogs.insertOne({
  siteId, materialId, userId,
  type: "IN",
  quantity: 100,
  timestamp: new Date(),
  previousStock: 50,
  newStock: 150,
  anomalyDetected: "NONE"
});

// Sortie excessive (anomalie)
db.materialflowlogs.insertOne({
  siteId, materialId, userId,
  type: "OUT",
  quantity: 250,
  timestamp: new Date(),
  previousStock: 150,
  newStock: -100,
  anomalyDetected: "EXCESSIVE_OUT",
  anomalyMessage: "Sortie excessive détectée"
});
```

---

## 📊 Vérification des Résultats

### Checklist

- [ ] **Matériaux Expirants**
  - [ ] Endpoint `/expiring` retourne des résultats
  - [ ] Logs affichent le nombre de matériaux trouvés
  - [ ] Frontend affiche les matériaux expirants
  - [ ] Dates d'expiration correctes

- [ ] **Anomalies ML**
  - [ ] FastAPI est démarré
  - [ ] Endpoint `/anomalies/detect` fonctionne
  - [ ] Risques de vol détectés
  - [ ] Risques de gaspillage détectés
  - [ ] Surconsommation détectée

- [ ] **Anomalies de Flux**
  - [ ] Endpoint `/analyze-anomalies` fonctionne
  - [ ] Ratio entrées/sorties calculé
  - [ ] Sorties excessives détectées
  - [ ] Niveaux de risque corrects
  - [ ] Chantiers identifiés

- [ ] **Anomalies Consolidées**
  - [ ] Endpoint `/consolidated` fonctionne
  - [ ] Toutes les anomalies présentes
  - [ ] Statistiques correctes
  - [ ] Logs détaillés

- [ ] **Frontend**
  - [ ] Page anomalies accessible
  - [ ] Toutes les sections affichées
  - [ ] Filtres fonctionnels
  - [ ] Détails complets pour chaque anomalie

---

## 🎯 Résultats Attendus

### Tableau de Bord Anomalies

```
╔════════════════════════════════════════════════════════════╗
║                  ANOMALIES & ALERTS                        ║
║                                                            ║
║  🚨 3 critical    ⚠️ 8 high                               ║
╚════════════════════════════════════════════════════════════╝

🚨 Theft Risk (2)
  • Ciment Portland - Chantier Nord
    Sortie: 250 unités | Entrée: 100 unités
    Déviation: +150% | RISQUE CRITIQUE

📉 Waste Risk (1)
  • Sable - Chantier Sud
    Consommation: 45/jour | Moyenne: 20/jour
    Déviation: +125%

⏰ Expiring (4)
  • Peinture Blanche - Expire dans 14 jours
  • Colle Carrelage - Expire dans 22 jours
```

---

## 🚀 Prochaines Étapes

1. **Tester tous les endpoints**
2. **Vérifier les logs**
3. **Valider l'affichage frontend**
4. **Créer des données de test si nécessaire**
5. **Documenter les résultats**

---

**Bon test ! 🧪**
