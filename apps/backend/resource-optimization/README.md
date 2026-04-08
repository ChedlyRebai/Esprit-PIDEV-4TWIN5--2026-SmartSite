# 🎯 Système Intelligent d'Optimisation des Ressources

## 📦 Vue d'ensemble

Le **Resource Optimization Service** est un système intelligent basé sur IA qui analyse les ressources de vos chantiers (équipements, ouvriers, énergie) et génère automatiquement des recommandations pour:

- 💰 **Réduire les coûts** (jusqu'à 30% d'économies)
- 🌍 **Diminuer l'empreinte carbone** (réduction CO₂)
- 📊 **Optimiser la productivité** (meilleure utilisation des ressources)
- 🚨 **Alertes en temps réel** (notification des problèmes)

---

## 🏗️ Architecture du système

```
┌─────────────────────────────────────────────────────┐
│           Director Dashboard (Frontend)              │
│  React + TanStack Query + Recharts (UI moderne)     │
└──────────────────┬──────────────────────────────────┘
                  │
         API HTTP + JSON
                  │
┌──────────────────▼──────────────────────────────────┐
│    Resource Optimization Service (NestJS)            │
├────┬──────────┬─────────┬────────┬──────────────┤
│ DC │   RA    │   REQ   │  ALR  │    RPT       │
└────┴──────────┴─────────┴────────┴──────────────┘
              │
    MongoDB + Mongoose
              │
┌─────────────▼───────────────────────────────────────┐
│  Schémas : Equipment, Worker, Energy, Alert, Rec... │
└──────────────────────────────────────────────────────┘
```

**Légende:**
- **DC**: Data Collection (Collecte de données)
- **RA**: Resource Analysis (Analyse des ressources)
- **REQ**: Recommendation Engine (Moteur de recommandations)
- **ALR**: Alert System (Système d'alertes)
- **RPT**: Reporting (Rapports)

---

## 🚀 Installation et configuration

### Backend

```bash
cd apps/backend/resource-optimization
npm install
```

**Fichier `.env`:**
```env
PORT=3007
MONGODB_URI=mongodb://localhost:27017/smartsite-optimization
NODE_ENV=development
```

**Démarrer le service:**
```bash
npm run start:dev
```

Le service sera accessible sur `http://localhost:3007/api`

### Frontend

Le dashboard est intégré dans l'application React principale:

```bash
cd apps/frontend
npm install
npm run dev
```

Accédez au dashboard: `http://localhost:5173/director/optimization`

---

## 📊 Modules et fonctionnalités

### 1️⃣ Data Collection Module

**Responsabilité:** Collecte et stockage des données de ressources

**Endpoints:**

```
POST   /api/data-collection/equipment              # Créer équipement
GET    /api/data-collection/equipment/:siteId      # Lister équipements
PUT    /api/data-collection/equipment/:id          # Mettre à jour
DELETE /api/data-collection/equipment/:id          # Supprimer

POST   /api/data-collection/worker                 # Créer ouvrier
GET    /api/data-collection/worker/:siteId         # Lister ouvriers
PUT    /api/data-collection/worker/:id             # Mettre à jour
DELETE /api/data-collection/worker/:id             # Supprimer

POST   /api/data-collection/energy-consumption     # Enregistrer consommation
GET    /api/data-collection/energy-consumption/:siteId  # Récupérer
```

**Exemples d'usage:**

```javascript
// Créer un équipement
POST http://localhost:3007/api/data-collection/equipment
{
  "deviceName": "Excavatrice CAT 320",
  "siteId": "site-001",
  "type": "excavator",
  "isActive": true,
  "hoursOperating": 45.5
}

// Enregistrer consommation énergétique
POST http://localhost:3007/api/data-collection/energy-consumption
{
  "siteId": "site-001",
  "dateLogged": "2024-01-15T10:00:00Z",
  "electricity": 450,      // kWh
  "fuelConsumption": 120,  // litres
  "waterConsumption": 50,  // m³
  "wasteGenerated": 75     // kg
}
```

---

### 2️⃣ Resource Analysis Module

**Responsabilité:** Analyser les données pour détecter le gaspillage

**Endpoints:**

```
GET /api/resource-analysis/idle-equipment/:siteId
GET /api/resource-analysis/energy-consumption/:siteId
GET /api/resource-analysis/worker-productivity/:siteId
GET /api/resource-analysis/resource-costs/:siteId
GET /api/resource-analysis/full-analysis/:siteId  # 🔥 COMPLET
```

**Réponse de l'analyse complète:**

```json
{
  "idleEquipment": [
    {
      "name": "Compresseur",
      "utilizationRate": 15,
      "wastePercentage": 85,
      "type": "compressor"
    }
  ],
  "peakConsumptionPeriods": [
    {
      "date": "2024-01-15",
      "electricity": 750,
      "co2": 175
    }
  ],
  "workerProductivity": [
    {
      "name": "Jean Dupont",
      "productivityScore": 45,
      "efficiency": "low"
    }
  ],
  "costBreakdown": {
    "equipment": 5000,
    "workers": 12000,
    "total": 17000
  },
  "environmentalImpact": {
    "totalCO2": 2500,
    "totalWaste": 450
  }
}
```

---

### 3️⃣ Recommendation Engine (CŒUR INTELLIGENT)

**Responsabilité:** Générer les recommandations basées sur l'analyse

**Endpoints:**

```
POST  /api/recommendations/generate/:siteId         # 🧠 Générer TOUT
GET   /api/recommendations/:siteId                  # Lister
GET   /api/recommendations/:siteId/summary          # Résumé économies
PUT   /api/recommendations/:id/status               # Approuver/Rejeter
```

**Types de recommandations générées automatiquement:**

| Type | Exemple | Bénéfice |
|------|---------|----------|
| ⚡ **Énergie** | Décaler les opérations aux heures creuses | -30% énergie |
| 🚜 **Équipements** | Arrêter les machines inutilisées | -€500/jour |
| 👷 **Travailleurs** | Former/réorganiser équipes faibles | +25% productivité |
| 📅 **Planification** | Optimiser les horaires | -15% frais généraux |
| 🌍 **Environnement** | Utiliser énergies renouvelables | -40% CO₂ |

**Exemple de réponse:**

```json
[
  {
    "type": "equipment",
    "title": "🚜 Réduire les machines inutilisées",
    "description": "3 machines fonctionnent à moins de 20%...",
    "estimatedSavings": 1500,
    "estimatedCO2Reduction": 750,
    "priority": 9,
    "confidenceScore": 95,
    "actionItems": [
      "Arrêter les machines inutilisées",
      "Regrouper les tâches"
    ]
  }
]
```

**Workflow d'une recommandation:**

```
pending (En attente)
    ↓ [Approuver]
approved (Approuvée)
    ↓ [Mettre en place]
implemented (Mise en place) ✓
    ↓
Économies réalisées! 💰
```

---

### 4️⃣ Alert System

**Responsabilité:** Alertes en temps réel sur les problèmes

**Endpoints:**

```
POST  /api/alerts/generate/:siteId          # Générer alertes
GET   /api/alerts/:siteId                   # Toutes les alertes
GET   /api/alerts/unread/:siteId            # Non lues
GET   /api/alerts/critical/:siteId          # Critiques
PUT   /api/alerts/:id/read                  # Marquer lue
PUT   /api/alerts/:id/resolve               # Résoudre
GET   /api/alerts/:siteId/summary           # Résumé
```

**Types d'alertes générées:**

| Sévérité | Type | Condition |
|----------|------|-----------|
| 🔴 CRITIQUE | high-waste | CO₂ > 1000 kg |
| 🟠 HAUTE | equipment-idle | Utilisation < 20% |
| 🟡 MOYEN | energy-spike | Plus de 3 pics énergétiques |
| 🟡 MOYEN | budget-exceed | Coûts > €10,000 |
| 🟡 MOYEN | deadline-risk | Retards détectés |

---

### 5️⃣ Reporting Module

**Responsabilité:** Rapports et tableaux de bord

**Endpoints:**

```
GET /api/reports/performance/:siteId         # Performance 30 jours
GET /api/reports/environmental/:siteId       # Impact environnemental
GET /api/reports/financial/:siteId           # Analyse financière
GET /api/reports/dashboard/:siteId           # 📊 DASHBOARD COMPLET
GET /api/reports/export/:siteId?format=json  # Export JSON/CSV
```

**Exemple de dashboard:**

```json
{
  "performance": {
    "totalSavings": 4500,
    "co2Reduction": 850,
    "implementedRecommendations": 3
  },
  "financial": {
    "currentResourcesCosts": 17000,
    "realizedSavings": 4500,
    "roi": "26.5%"
  },
  "environmental": {
    "currentCO2Emissions": "2500",
    "actualCO2Reduction": "850",
    "reductionPercentage": "34%"
  },
  "recommendations": {
    "total": 5,
    "pending": 1,
    "approved": 1,
    "implemented": 3
  }
}
```

---

## 💻 Frontend - Director Dashboard

### Composants

**1. RecommendationsList** - Liste des recommandations avec:
- Filtre par type (⚡ Énergie, 🚜 Équipements, etc.)
- Actions: Approuver / Rejeter / Mettre en place
- Affichage: Économies potentielles + CO₂ réduit

**2. AlertsList** - Alertes avec:
- Code couleur par sévérité (CRITIQUE, HAUTE, MOYEN, BASSE)
- Actions: Marquer comme lue / Résoudre
- Auto-refresh

**3. DashboardCharts** - Visualisations:
- 📊 Économies par catégorie (BarChart)
- 📉 Réduction CO₂ (LineChart)
- 🥧 Statut recommandations (PieChart)
- 💰 Statistiques clés (cartes résumé)

### Utilisation

```tsx
import ResourceOptimizationDashboard from '@/features/resource-optimization/pages/ResourceOptimizationDashboard';

function App() {
  return (
    <ResourceOptimizationDashboard siteId="site-001" />
  );
}
```

---

## 🧪 Tests et validation

### Tests unitaires (Service)

```bash
npm run test
npm run test:cov  # Coverage
```

### Tests d'intégration E2E

```bash
npm run test:e2e
```

### Postman Collection

Utilisez le fichier `feature-team-assignment-api.postman_collection.json` du projet pour tester les endpoints.

---

## 📈 Cas d'usage réels

### Cas 1: Réduire les machines inutilisées

1. **Données collectées:** Compresseur utilisation 15%
2. **Analyse:** Gaspillage 85%, coût €500/jour
3. **Recommandation:** Arrêter la machine → -€500/jour
4. **Alerte:** ⚠️ "Machines inutilisées détectées"
5. **Action:** Directeur → Approuve → Implémente
6. **Résultat:** €15,000/mois économisés! 💰

### Cas 2: Optimiser l'énergie

1. **Données:** 3 pics d'électricité coûteux (heures de pointe)
2. **Analyse:** Tarif heures pleines €0.25/kWh vs creuses €0.12/kWh
3. **Recommandation:** Décaler 30% de la charge aux heures creuses
4. **Alerte:** ⚡ "Pics de consommation énergétique"
5. **Résultat:** -30% facture électricité 📉

### Cas 3: Améliorer la productivité

1. **Données:** 3 ouvriers score productivité < 50
2. **Analyse:** Coût inutil €1,800/mois
3. **Recommandation:** Formation + réorganisation équipes
4. **Alerte:** 👷 "Faible productivité détectée"
5. **Résultat:** +25% productivité + €450 économisés 📈

---

## 🔧 Configuration MongoDB

### Collections automatiquement créées

```javascript
// Equipment - Équipements/machines
db.equipment.insertOne({
  deviceName: "Excavatrice",
  siteId: "site-001",
  type: "excavator",
  utilizationRate: 65,
  hoursOperating: 240,
  fuelConsumption: 1200,
  createdAt: new Date()
})

// Worker - Travailleurs
db.worker.insertOne({
  workerId: "WKR-001",
  siteId: "site-001",
  name: "Jean Dupont",
  role: "operator",
  hoursWorked: 168,
  costhourlyRate: 25,
  productivityScore: 75
})

// EnergyConsumption - Consommation énergétique
db.energyconsumption.insertOne({
  siteId: "site-001",
  dateLogged: new Date(),
  electricity: 450,
  fuelConsumption: 120,
  carbonEmissions: 104.55
})

// Recommendation - Recommandations générées
db.recommendation.insertOne({
  siteId: "site-001",
  type: "energy",
  title: "Optimiser les pics énergétiques",
  status: "pending",
  estimatedSavings: 1500,
  estimatedCO2Reduction: 750,
  priority: 8,
  confidenceScore: 85
})

// Alert - Alertes en temps réel
db.alert.insertOne({
  siteId: "site-001",
  type: "equipment-idle",
  severity: "high",
  title: "Machines inutilisées",
  isRead: false,
  status: "pending"
})
```

---

## 📚 API complète

### 🔵 Collecte de données

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/data-collection/equipment` | Créer équipement |
| GET | `/data-collection/equipment/:siteId` | Lister équipements |
| PUT | `/data-collection/equipment/:id` | Mettre à jour équipement |
| DELETE | `/data-collection/equipment/:id` | Supprimer équipement |
| POST | `/data-collection/worker` | Créer ouvrier |
| GET | `/data-collection/worker/:siteId` | Lister ouvriers |
| POST | `/data-collection/energy-consumption` | Enregistrer énergie |

### 🟢 Analyse

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/resource-analysis/idle-equipment/:siteId` | Machines inutilisées |
| GET | `/resource-analysis/energy-consumption/:siteId` | Pics énergétiques |
| GET | `/resource-analysis/worker-productivity/:siteId` | Productivité |
| GET | `/resource-analysis/full-analysis/:siteId` | **Analyse complète** |

### 🟡 Recommandations

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/recommendations/generate/:siteId` | **Générer recommandations** |
| GET | `/recommendations/:siteId` | Lister |
| GET | `/recommendations/:siteId/summary` | Résumé économies |
| PUT | `/recommendations/:id/status` | Approuver/Implémenter |

### 🔴 Alertes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/alerts/generate/:siteId` | **Générer alertes** |
| GET | `/alerts/:siteId` | Toutes les alertes |
| GET | `/alerts/unread/:siteId` | Non lues |
| PUT | `/alerts/:id/read` | Marquer lue |
| GET | `/alerts/:siteId/summary` | Résumé alertes |

### 📊 Rapports

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/reports/performance/:siteId` | Performance |
| GET | `/reports/environmental/:siteId` | Impact environnemental |
| GET | `/reports/financial/:siteId` | Analyse financière |
| GET | `/reports/dashboard/:siteId` | **Dashboard complet** |
| GET | `/reports/export/:siteId` | Export JSON/CSV |

---

## 🎯 Guide de démarrage rapide

### 1️⃣ Démarrer le backend

```bash
cd apps/backend/resource-optimization
npm install
npm run start:dev
```

### 2️⃣ Ajouter des données test

```bash
curl -X POST http://localhost:3007/api/data-collection/equipment \
  -H "Content-Type: application/json" \
  -d '{
    "deviceName": "Excavatrice CAT",
    "siteId": "site-001",
    "type": "excavator",
    "isActive": true,
    "hoursOperating": 45,
    "utilizationRate": 65
  }'
```

### 3️⃣ Générer les recommandations

```bash
curl -X POST http://localhost:3007/api/recommendations/generate/site-001
```

### 4️⃣ Générer les alertes

```bash
curl -X POST http://localhost:3007/api/alerts/generate/site-001
```

### 5️⃣ Voir le dashboard

```bash
curl http://localhost:3007/api/reports/dashboard/site-001
```

### 6️⃣ Démarrer le frontend

```bash
cd apps/frontend
npm run dev
```

---

## 🚀 Prochaines améliorations

- [ ] Intégration IA/ML pour prédictions (TensorFlow.js)
- [ ] WebSockets pour alertes en temps réel
- [ ] Export PDF des rapports
- [ ] Intégration SMS/Email pour notifications critiques
- [ ] Dashboard mobile (React Native)
- [ ] Support multi-langue (i18n)
- [ ] Authentification OAuth2
- [ ] Historique et versioning des recommandations
- [ ] Comparaison avant/après implémentation
- [ ] Gamification (badges, scores)

---

## 📞 Support et contact

Pour toute question ou problème:
- 📧 Email: optimization@smartsite.fr
- 📌 Issues: GitHub project
- 💬 Slack: #resource-optimization

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2024-01-15  
**Auteur:** SmartSite Team
