# 🚀 Guide de démarrage rapide (5 minutes)

## ⏱️ Étapes pour tester immédiatement

### 1️⃣ Démarrer le backend (30 secondes)

```bash
cd apps/backend/resource-optimization

# Installer dépendances
npm install

# Start le service
npm run start:dev
```

✅ Vous verrez: `🚀 Resource Optimization Service listening on port 3007`

---

### 2️⃣ Créer des données de test (2 minutes)

Ouvrir Postman ou utiliser curl. Créer équipement:

```bash
curl -X POST http://localhost:3007/api/data-collection/equipment \
  -H "Content-Type: application/json" \
  -d '{
    "deviceName": "Excavatrice CAT 320",
    "siteId": "site-demo-001",
    "type": "excavator",
    "isActive": true,
    "hoursOperating": 45.5,
    "fuelConsumption": 120,
    "utilizationRate": 15
  }'
```

Ajouter plus d'équipements avec différents utilization rates:

```bash
# Machine inutilisée (sera détectée!)
curl -X POST http://localhost:3007/api/data-collection/equipment \
  -H "Content-Type: application/json" \
  -d '{
    "deviceName": "Compresseur pneumatique",
    "siteId": "site-demo-001",
    "type": "compressor",
    "isActive": true,
    "utilizationRate": 10
  }'

# Compressor (inactif)
curl -X POST http://localhost:3007/api/data-collection/equipment \
  -H "Content-Type: application/json" \
  -d '{
    "deviceName": "Générateur diesel",
    "siteId": "site-demo-001",
    "type": "generator",
    "isActive": true,
    "utilizationRate": 8
  }'
```

Ajouter des ouvriers:

```bash
curl -X POST http://localhost:3007/api/data-collection/worker \
  -H "Content-Type: application/json" \
  -d '{
    "workerId": "WKR-001",
    "siteId": "site-demo-001",
    "name": "Jean Dupont",
    "role": "operator",
    "hoursWorked": 160,
    "costhourlyRate": 25,
    "productivityScore": 35
  }'

curl -X POST http://localhost:3007/api/data-collection/worker \
  -H "Content-Type: application/json" \
  -d '{
    "workerId": "WKR-002",
    "siteId": "site-demo-001",
    "name": "Marie Martin",
    "role": "engineer",
    "hoursWorked": 160,
    "costhourlyRate": 35,
    "productivityScore": 85
  }'
```

Ajouter consommation énergétique:

```bash
curl -X POST http://localhost:3007/api/data-collection/energy-consumption \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "site-demo-001",
    "dateLogged": "2024-01-15T08:00:00Z",
    "electricity": 450,
    "fuelConsumption": 120,
    "waterConsumption": 50,
    "wasteGenerated": 75
  }'

# Ajouter un pic énergétique
curl -X POST http://localhost:3007/api/data-collection/energy-consumption \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "site-demo-001",
    "dateLogged": "2024-01-15T14:00:00Z",
    "electricity": 850,
    "fuelConsumption": 200,
    "waterConsumption": 100,
    "wasteGenerated": 120
  }'
```

---

### 3️⃣ Générer les recommandations (30 secondes)

```bash
curl -X POST http://localhost:3007/api/recommendations/generate/site-demo-001
```

**Résultat attendu:** 5 recommandations:
- 🚜 Réduire machines inutilisées
- ⚡ Optimiser pics énergétiques
- 👷 Améliorer productivité
- 📅 Optimiser planification
- 🌍 Réduire empreinte carbone

---

### 4️⃣ Générer les alertes (30 secondes)

```bash
curl -X POST http://localhost:3007/api/alerts/generate/site-demo-001
```

**Résultat attendu:** 5 alertes:
- 🔴 CRITIQUE: Empreinte carbone élevée
- 🟠 HAUTE: Machines inutilisées
- 🟡 MOYEN: Faible productivité

---

### 5️⃣ Voir le dashboard (30 secondes)

```bash
curl http://localhost:3007/api/reports/dashboard/site-demo-001 | json_pp
```

**Ou dans le navigateur:**
```
http://localhost:3007/api/reports/dashboard/site-demo-001
```

---

## 📊 Résultat du test

Vous verrez quelque chose comme:

```json
{
  "performance": {
    "period": "30 jours",
    "totalSavings": 5250,
    "co2Reduction": 1050,
    "implementedRecommendations": 0
  },
  "financial": {
    "currentResourcesCosts": 17500,
    "realizedSavings": "0.00",
    "potentialSavings": "5250.00",
    "roi": "0%"
  },
  "environmental": {
    "currentCO2Emissions": "2550",
    "actualCO2Reduction": "0",
    "potentialCO2Reduction": "1050"
  },
  "recommendations": {
    "total": 5,
    "pending": 5,
    "approved": 0,
    "implemented": 0
  }
}
```

---

## 🎬 Frontend (optionnel)

Démarrer le frontend:

```bash
cd apps/frontend
npm install
npm run dev
```

Puis accéder au:
```
http://localhost:5173/director/optimization?siteId=site-demo-001
```

Vous verrez:
- ✅ 5 recommandations avec filtres
- ✅ 5 alertes avec couleurs
- ✅ Graphiques économies & CO₂
- ✅ Boutons pour approuver/implémenter

---

## 🧪 Test les endpoints clés

### Lister les recommandations

```bash
curl http://localhost:3007/api/recommendations/site-demo-001
```

### Approuver une recommandation

```bash
# D'abord, récupérer l'ID d'une recommendation
RECID=$(curl -s http://localhost:3007/api/recommendations/site-demo-001 | jq -r '.[0]._id')

# Puis approuver
curl -X PUT http://localhost:3007/api/recommendations/$RECID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

### Lister les alertes

```bash
curl http://localhost:3007/api/alerts/site-demo-001
```

### Voir résumé alertes

```bash
curl http://localhost:3007/api/alerts/site-demo-001/summary
```

### Analyser les ressources

```bash
curl http://localhost:3007/api/resource-analysis/full-analysis/site-demo-001
```

---

## 📈 Workflow complet (5 min)

```
1. POST /data-collection/equipment ✅
2. POST /data-collection/worker ✅
3. POST /data-collection/energy-consumption ✅
4. GET /resource-analysis/full-analysis ✅
   └─> Détecte: 3 machines inutilisées
   └─> Détecte: 1 pic énergétique
   └─> Détecte: 1 ouvrier faible productivité
5. POST /recommendations/generate ✅
   └─> Génère: 5 recommandations
6. POST /alerts/generate ✅
   └─> Génère: 5 alertes
7. GET /reports/dashboard ✅
   └─> Affiche: €5,250 économies potentielles
   └─> Affiche: 1,050 kg CO₂ à réduire
8. PUT /recommendations/:id/status ✅
   └─> Approuve les recommandations
9. Dashboard met à jour ✅
   └─> Affiche les changements
```

---

## 🎯 Cas d'usage immédiat

Après 5 minutes, le système détecte:

| Problème | Détection | Solution | Impact |
|----------|-----------|----------|---------|
| 3 machines < 15% utilisation | ✅ | Arrêter | -€1,500/mois |
| Pic énergie 14h | ✅ | Décaler 30% heures creuses | -€400/mois |
| Ouvrier productivité 35% | ✅ | Former | +€450/mois |
| CO₂ trop haut | ✅ | Énergies renouvelables | -40% CO₂ |

**Total: €2,350/mois économisés + impact environnemental**

---

## 🆘 Dépannage rapide

### Erreur MongoDB

```bash
# Vérifier si MongoDB tourne
mongosh

# Si non, installer:
# macOS: brew install mongodb-community
# Windows: Télécharger depuis mongodb.com
```

### Erreur port 3007

```bash
# Port déjà utilisé
lsof -i :3007
kill -9 <PID>
```

### Erreur npm

```bash
npm cache clean --force
rm -rf node_modules
npm install
```

---

## 📱 Interface utilisateur attendue

### Onglet Recommandations

```
┌─────────────────────────────────────────┐
│ 🎯 Recommandations d'optimisation       │
├─────────────────────────────────────────┤
│                                         │
│ ⏳ EN ATTENTE (5)                       │
│ ✅ APPROUVÉES (0)                      │
│ 🎉 IMPLÉMENTÉES (0)                    │
│                                         │
│ 1. 🚜 Réduire machines inutilisées      │
│    €1,500/mois | 750 kg CO₂ | [APPROUVER]│
│                                         │
│ 2. ⚡ Optimiser pics énergétiques       │
│    €400/mois | 200 kg CO₂ | [APPROUVER]│
│                                         │
│ 3. 👷 Améliorer productivité            │
│    €450/mois | 100 kg CO₂ | [APPROUVER]│
│                                         │
│ 4. 📅 Optimiser planification           │
│    €1,050/mois | 0 kg CO₂ | [APPROUVER]│
│                                         │
│ 5. 🌍 Réduire empreinte carbone        │
│    €750/mois | 1,050 kg CO₂ | [APPROUVER]│
│                                         │
└─────────────────────────────────────────┘
```

### Onglet Alertes

```
┌─────────────────────────────────────────┐
│ 🚨 Alertes en temps réel (5)            │
├─────────────────────────────────────────┤
│                                         │
│ 🔴 CRITIQUE: Empreinte carbone élevée  │
│    2,550 kg CO₂ - [LIRE] [RÉSOUDRE]   │
│                                         │
│ 🟠 HAUTE: Machines inutilisées         │
│    3 machines < 20% - [LIRE] [RÉSOUDRE]│
│                                         │
│ 🟡 MOYEN: Pics énergétiques            │
│    3 pics détectés - [LIRE] [RÉSOUDRE] │
│                                         │
│ 🟡 MOYEN: Faible productivité          │
│    1 ouvrier < 50% - [LIRE] [RÉSOUDRE] │
│                                         │
│ 🟡 MOYEN: Budget dépassé               │
│    €17,500 > seuil - [LIRE] [RÉSOUDRE] │
│                                         │
└─────────────────────────────────────────┘
```

### Onglet Analytique

```
Cartes résumé:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 💰 Économies │  │ 🌍 CO₂ réduit │  │ 📈 ROI      │
│ €5,250       │  │ 1,050 kg     │  │ 30%         │
└──────────────┘  └──────────────┘  └──────────────┘

Graphiques:
- Économies par catégorie (Bar chart)
- Réduction CO₂ (Line chart)
- Statut recommandations (Pie chart)
```

---

## ✅ Checklist après 5 minutes

- [ ] Backend lancé sur port 3007
- [ ] Au moins 3 équipements créés
- [ ] Au moins 2 ouvriers créés
- [ ] Énergie enregistrée
- [ ] Recommandations générées (5)
- [ ] Alertes générées (5)
- [ ] Dashboard visible
- [ ] Voir €5,250 économies potentielles
- [ ] Voir 1,050 kg CO₂ à réduire

---

## 🎉 Prochains pas

1. **Approuver recommandations**
   ```bash
   curl -X PUT http://localhost:3007/api/recommendations/:id/status \
     -H "Content-Type: application/json" \
     -d '{"status": "approved"}'
   ```

2. **Implémenter une recommandation**
   ```bash
   curl -X PUT http://localhost:3007/api/recommendations/:id/status \
     -H "Content-Type: application/json" \
     -d '{"status": "implemented"}'
   ```

3. **Voir les économies réalisées**
   ```bash
   curl http://localhost:3007/api/recommendations/site-demo-001/summary
   ```

4. **Générer un rapport**
   ```bash
   curl http://localhost:3007/api/reports/financial/site-demo-001
   ```

---

**Félicitations! 🎉 Vous avez un système intelligent en 5 minutes!**
