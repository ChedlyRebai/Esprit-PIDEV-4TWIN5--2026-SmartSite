# 🗺️ API Map - Resource Optimization Service

## 📍 Navigation globale

```
http://localhost:3007/api/

┌─────────────────────────────────────────────────────────────────┐
│              Resource Optimization Service (v1.0)               │
│                   Port: 3007 | MongoDB: Local                   │
└────────┬────────────────┬────────────────┬────────────────┬─────┘
         │                │                │                │
    ┌────▼─────┐   ┌─────▼──────┐   ┌─────▼──────┐   ┌───▼────┐
    │ DATA-COL │   │ RES-ANALY   │   │ RECOMMEND  │   │ ALERT  │
    │ LECTION  │   │ SIS         │   │ ATIONS     │   │        │
    └────┬─────┘   └─────┬──────┘   └─────┬──────┘   └───┬────┘
         │                │                │                │
    Collect Data      Analyze Resources  Generate Ideas    Notify
         │                │                │                │
         └────────────────┴────────────────┴────────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  REPORTING   │
                   │  Dashboard   │
                   └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ FRONTEND UI  │
                   │  (React)     │
                   └──────────────┘
```

---

## 📊 1️⃣ DATA COLLECTION - `/data-collection`

**Rôle:** Collecte et gestion des données de ressources

```
POST   /equipment                    ┐
GET    /equipment/:siteId            ├─ ÉQUIPEMENTS
PUT    /equipment/:id                │
DELETE /equipment/:id                ┘

POST   /worker                       ┐
GET    /worker/:siteId               ├─ TRAVAILLEURS
PUT    /worker/:id                   │
DELETE /worker/:id                   ┘

POST   /energy-consumption           ┐
GET    /energy-consumption/:siteId   ├─ CONSOMMATION ÉNERGIE
                                     ┘
```

### Exemples

```bash
# Créer équipement
curl -X POST http://localhost:3007/api/data-collection/equipment \
  -H "Content-Type: application/json" \
  -d '{"deviceName":"Excavatrice","siteId":"site-001","type":"excavator","utilizationRate":65}'

# Lister équipements du site
curl http://localhost:3007/api/data-collection/equipment/site-001

# Enregistrer énergie
curl -X POST http://localhost:3007/api/data-collection/energy-consumption \
  -H "Content-Type: application/json" \
  -d '{"siteId":"site-001","dateLogged":"2024-01-15T10:00:00Z","electricity":450,"fuelConsumption":120,"carbonEmissions":104.55}'
```

---

## 🔍 2️⃣ RESOURCE ANALYSIS - `/resource-analysis`

**Rôle:** Analyser les données pour détecter gaspillage

```
GET /idle-equipment/:siteId          ┐ 🚜 Machines < 20% utilisation
GET /energy-consumption/:siteId      ├ ⚡ Pics consommation
GET /worker-productivity/:siteId     ├ 👷 Productivité ouvriers
GET /resource-costs/:siteId          ├ 💰 Coûts par ressource
GET /full-analysis/:siteId           ┘ 🧠 ANALYSE COMPLÈTE (⭐)
```

### Exemples

```bash
# Analyser les machines inutilisées
curl http://localhost:3007/api/resource-analysis/idle-equipment/site-001

# Analyse énergétique
curl http://localhost:3007/api/resource-analysis/energy-consumption/site-001

# ANALYSE COMPLÈTE (recommandé)
curl http://localhost:3007/api/resource-analysis/full-analysis/site-001 | jq

# Response: {
#   "idleEquipment": [...],
#   "peakConsumptionPeriods": [...],
#   "workerProductivity": [...],
#   "costBreakdown": {...},
#   "environmentalImpact": {...}
# }
```

---

## 💡 3️⃣ RECOMMENDATIONS - `/recommendations`

**Rôle:** Moteur intelligent générant recommandations

```
POST  /generate/:siteId              🧠 GÉNÉRER RECOMMANDATIONS (⭐)
GET   /:siteId                       📋 Lister all
GET   /:siteId?status=pending        📋 Lister filtrées
GET   /:siteId/summary               💰 Résumé économies
GET   /item/:id                      🔍 Détails
PUT   /:id/status                    ✅ Approuver/Rejeter/Implémenter
```

### Types générés automatiquement

```
⚡ ENERGY          - Optimiser pics énergétiques
🚜 EQUIPMENT       - Réduire machines inutilisées
👷 WORKFORCE       - Améliorer productivité ouvriers
📅 SCHEDULING      - Optimiser horaires
🌍 ENVIRONMENTAL   - Réduire empreinte carbone
```

### Exemples

```bash
# Générer recommandations
curl -X POST http://localhost:3007/api/recommendations/generate/site-001

# Voir toutes les recommandations
curl http://localhost:3007/api/recommendations/site-001 | jq

# Voir résumé économies
curl http://localhost:3007/api/recommendations/site-001/summary
# Response: {
#   "totalPotentialSavings": "5250.00",
#   "approvedSavings": "0.00",
#   "realizedSavings": "0.00",
#   "totalCO2Reduction": "1050"
# }

# Approuver une recommandation
curl -X PUT http://localhost:3007/api/recommendations/[ID]/status \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'

# Implémenter une recommandation
curl -X PUT http://localhost:3007/api/recommendations/[ID]/status \
  -H "Content-Type: application/json" \
  -d '{"status":"implemented"}'
```

---

## 🚨 4️⃣ ALERTS - `/alerts`

**Rôle:** Système d'alertes temps réel

```
POST  /generate/:siteId              🚨 GÉNÉRER ALERTES (⭐)
GET   /:siteId                       📢 Toutes
GET   /unread/:siteId                📢 Non lues
GET   /critical/:siteId              ⚠️ CRITIQUES
GET   /:siteId/summary               📊 Résumé
PUT   /:id/read                      ✅ Marquer lue
PUT   /:id/resolve                   ✅ Résoudre
POST  /:siteId/cleanup               🧹 Nettoyer
```

### Types d'alertes

```
🔴 CRITICAL        - Empreinte carbone > 1000 kg
🟠 HIGH            - Machines inutilisées (< 20%)
🟡 MEDIUM          - Pics énergétiques (> 3)
🟡 MEDIUM          - Budget dépassé (> €10k)
🟡 MEDIUM          - Risque retard
```

### Exemples

```bash
# Générer alertes
curl -X POST http://localhost:3007/api/alerts/generate/site-001

# Voir toutes les alertes
curl http://localhost:3007/api/alerts/site-001 | jq

# Voir alertes critiques
curl http://localhost:3007/api/alerts/critical/site-001

# Voir résumé
curl http://localhost:3007/api/alerts/site-001/summary
# Response: {
#   "total": 5,
#   "unread": 3,
#   "critical": 1,
#   "high": 1,
#   "byType": {...}
# }

# Marquer alerte comme lue
curl -X PUT http://localhost:3007/api/alerts/[ID]/read

# Marquer comme résolue
curl -X PUT http://localhost:3007/api/alerts/[ID]/resolve
```

---

## 📈 5️⃣ REPORTING - `/reports`

**Rôle:** Rapports et tableaux de bord

```
GET /performance/:siteId             📊 Performance (30j)
GET /environmental/:siteId           🌍 Impact environnemental
GET /financial/:siteId               💰 Analyse financière
GET /dashboard/:siteId               🎯 DASHBOARD COMPLET (⭐)
GET /export/:siteId?format=json      💾 Export JSON/CSV
```

### Exemples

```bash
# Dashboard complet
curl http://localhost:3007/api/reports/dashboard/site-001 | jq

# Response structure:
# {
#   "performance": {
#     "totalSavings": 4500,
#     "co2Reduction": 850,
#     "implementedRecommendations": 3
#   },
#   "financial": {
#     "currentResourcesCosts": 17000,
#     "realizedSavings": "4500",
#     "roi": "26.5%"
#   },
#   "environmental": {
#     "currentCO2Emissions": "2500",
#     "actualCO2Reduction": "850",
#     "reductionPercentage": "34%"
#   },
#   "recommendations": {
#     "total": 5,
#     "pending": 0,
#     "approved": 1,
#     "implemented": 4
#   }
# }

# Rapport performance
curl http://localhost:3007/api/reports/performance/site-001

# Rapport environnemental
curl http://localhost:3007/api/reports/environmental/site-001

# Rapport financier
curl http://localhost:3007/api/reports/financial/site-001

# Export JSON
curl http://localhost:3007/api/reports/export/site-001?format=json > report.json

# Export CSV
curl http://localhost:3007/api/reports/export/site-001?format=csv > report.csv
```

---

## 🧭 Workflow recommandé d'utilisation

```
┌─── SEMAINE 1 ───┐
│                 │
│ 1. POST /data-collection/*          ← Ajouter données
│    (Equipment, Worker, Energy)
│                 │
▼                 │
│ 2. GET /resource-analysis/full      ← Analyser ressources
│                 │
▼                 │
│ 3. POST /recommendations/generate    ← Générer idées
│                 │
▼                 │
│ 4. POST /alerts/generate             ← Générer alertes
│                 │
▼                 ─
│ 5. GET /reports/dashboard            ← Afficher dashboard
│                 
├─── SEMAINE 2 ───┤
│                 │
│ 6. PUT /recommendations/:id/status   ← Approuver
│    {status: "approved"}
│                 │
▼                 │
│ 7. PUT /recommendations/:id/status   ← Implémenter
│    {status: "implemented"}
│                 │
▼                 │
│ 8. GET /reports/financi              ← Mesurer impact
│                 ─
└─────────────────┘
  RÉSULTAT: €2,350/mois économisés + 350 kg CO₂ réduit
```

---

## 🔗 Endpoint Groups Summary

| Group | Endpoints | Purpose |
|-------|-----------|---------|
| **Data Collection** | 10 | CRUD Equipment, Worker, Energy |
| **Analysis** | 5 | Détection gaspillage, Patterns |
| **Recommendations** | 5 | Génération, Listing, Approbation |
| **Alerts** | 7 | Génération, Notification, Tracking |
| **Reporting** | 5 | Dashboards, Rapports, Export |
| **TOTAL** | **32** | **Système complet** |

---

## 🆘 Dépannage par endpoint

### `/data-collection` ne répond pas
```bash
# Vérifier MongoDB
mongosh --eval "db.adminCommand('ping')"

# Vérifier connection URL
echo $MONGODB_URI

# Vérifier logs
npm run start:dev | grep -i error
```

### `/resource-analysis` retourne vide
```bash
# Vérifier que des données existent
curl http://localhost:3007/api/data-collection/equipment/site-001

# Au minimum 3 items + 2 workers
```

### `/recommendations/generate` prend trop longtemps
```bash
# Vérifier données volume
# Si > 1000 items, créer indexes MongoDB

db.equipment.createIndex({ siteId: 1, utilizationRate: 1 })
db.worker.createIndex({ siteId: 1, productivityScore: 1 })
db.energyconsumption.createIndex({ siteId: 1, dateLogged: 1 })
```

### `/alerts/generate` génère les mêmes alertes
```bash
# Nettoyer les alertes résolues
curl -X POST http://localhost:3007/api/alerts/site-001/cleanup

# Ou manuellement supprimer:
db.alert.deleteMany({ siteId: "site-001", status: "resolved" })
```

---

## 📚 Quick Reference

### IDs de test rapides

```bash
# Créer un site de test complete
SITE="site-test-$(date +%s)"

# Ajouter 5 items rapidement
for i in {1..5}; do
  curl -X POST http://localhost:3007/api/data-collection/equipment \
    -H "Content-Type: application/json" \
    -d "{\"deviceName\":\"Equipment-$i\",\"siteId\":\"$SITE\",\"type\":\"excavator\",\"utilizationRate\":$((RANDOM % 100))}"
done

# Générer tout
curl -X POST http://localhost:3007/api/recommendations/generate/$SITE
curl -X POST http://localhost:3007/api/alerts/generate/$SITE

# Voir résultat
curl http://localhost:3007/api/reports/dashboard/$SITE | jq
```

---

## 🎯 Points clés

✅ Tous les endpoints retournent **JSON**  
✅ IDs: Utiliser les **`_id` ObjectId** MongoDB  
✅ Site: Tous require **`siteId`** valide  
✅ Dates: Format **ISO 8601** (2024-01-15T10:00:00Z)  
✅ Statuts: **pending** → **approved** → **implemented**  
✅ Sévérités: **low** < **medium** < **high** < **critical**  

---

*Version: 1.0.0 | Last Updated: 2024-01-15 | Ready to Production*
