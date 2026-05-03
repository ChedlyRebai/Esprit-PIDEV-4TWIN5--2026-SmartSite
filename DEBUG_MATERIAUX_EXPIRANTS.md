# 🔍 Guide de Débogage - Matériaux Expirants

**Problème:** "0 matériau expire dans les 30 prochains jours" même après avoir ajouté des dates d'expiration

---

## 🎯 Étapes de Diagnostic

### Étape 1: Vérifier MongoDB Directement

**Ouvrir MongoDB Compass ou mongosh:**

```javascript
// Se connecter à la base
use smartsite

// 1. Compter tous les matériaux
db.materials.countDocuments()

// 2. Vérifier les matériaux avec expiryDate
db.materials.countDocuments({ expiryDate: { $exists: true, $ne: null } })

// 3. Afficher les matériaux avec expiryDate
db.materials.find({ 
  expiryDate: { $exists: true, $ne: null } 
}).pretty()

// 4. Vérifier le type du champ expiryDate
db.materials.findOne({ expiryDate: { $exists: true } })
```

**Résultats attendus:**
- Si `countDocuments` retourne 0 → Aucune date d'expiration dans la base
- Si le champ existe mais est de type String → Problème de type de données
- Si le champ existe mais status != 'active' → Problème de filtre

---

### Étape 2: Utiliser le Script de Test

**Exécuter le script de diagnostic:**

```bash
cd apps/backend/materials-service
node test-expiring-materials.js
```

**Ce script va:**
- ✅ Compter tous les matériaux
- ✅ Compter les matériaux avec expiryDate
- ✅ Afficher des exemples
- ✅ Tester la requête exacte du service
- ✅ Faire un diagnostic complet
- ✅ Proposer des solutions

**Sortie attendue:**
```
╔════════════════════════════════════════════════════════════════╗
║     TEST DETECTION MATERIAUX EXPIRANTS                         ║
╚════════════════════════════════════════════════════════════════╝

✅ Connecté à MongoDB

📊 Total matériaux dans la base: 25

📅 Matériaux avec expiryDate définie: 0

⚠️  Aucun matériau expirant trouvé avec la requête du service

🔍 DIAGNOSTIC:
   • Matériaux avec expiryDate mais status != 'active': 0
   • Matériaux déjà expirés (dans le passé): 0
   • Matériaux expirant dans plus de 30 jours: 0
```

---

### Étape 3: Ajouter des Données de Test

**Si aucune date d'expiration n'existe, exécuter:**

```bash
cd apps/backend/materials-service
node add-expiry-dates-test.js
```

**Ce script va:**
- ✅ Trouver 5 matériaux actifs
- ✅ Ajouter des dates d'expiration variées:
  - 5 jours (CRITIQUE)
  - 14 jours (URGENT)
  - 21 jours (ATTENTION)
  - 28 jours (À SURVEILLER)
  - 35 jours (HORS PÉRIODE)
- ✅ Vérifier les résultats
- ✅ Afficher la liste des matériaux expirants

**Sortie attendue:**
```
╔════════════════════════════════════════════════════════════════╗
║     AJOUT DATES EXPIRATION DE TEST                             ║
╚════════════════════════════════════════════════════════════════╝

✅ Connecté à MongoDB

📦 5 matériaux trouvés

🔄 Ajout des dates d'expiration...

✅ Ciment Portland (CIM001)
   Date expiration: 06/05/2026
   Jours restants: 5
   Catégorie: 5 jours (CRITIQUE)

✅ Peinture Blanche (PEIN001)
   Date expiration: 15/05/2026
   Jours restants: 14
   Catégorie: 14 jours (URGENT)

...

✅ Matériaux expirant dans les 30 prochains jours: 4
```

---

### Étape 4: Tester l'Endpoint API

**Après avoir ajouté les données de test:**

```bash
# Test 1: Endpoint expiring
curl http://localhost:3009/api/materials/expiring?days=30

# Test 2: Endpoint consolidé
curl http://localhost:3009/api/materials/anomalies/consolidated?days=30
```

**Résultat attendu (Test 1):**
```json
[
  {
    "_id": "...",
    "name": "Ciment Portland",
    "code": "CIM001",
    "expiryDate": "2026-05-06T00:00:00.000Z",
    "quantity": 150,
    "unit": "sac",
    "status": "active"
  },
  {
    "_id": "...",
    "name": "Peinture Blanche",
    "code": "PEIN001",
    "expiryDate": "2026-05-15T00:00:00.000Z",
    "quantity": 50,
    "unit": "L",
    "status": "active"
  }
]
```

---

### Étape 5: Vérifier les Logs du Service

**Redémarrer le service en mode dev:**

```bash
cd apps/backend/materials-service
npm run start:dev
```

**Appeler l'endpoint et vérifier les logs:**

```bash
curl http://localhost:3009/api/materials/expiring?days=30
```

**Logs attendus dans le terminal:**
```
[Nest] INFO [MaterialsService] 🔍 Recherche des matériaux expirant dans 30 jours...
[Nest] INFO [MaterialsService] 📅 Date cible: 2026-05-31T...
[Nest] INFO [MaterialsService] ✅ 4 matériaux expirants trouvés
[Nest] INFO [MaterialsService]    - Ciment Portland: expire dans 5 jours (06/05/2026)
[Nest] INFO [MaterialsService]    - Peinture Blanche: expire dans 14 jours (15/05/2026)
[Nest] INFO [MaterialsService]    - Colle Carrelage: expire dans 21 jours (22/05/2026)
[Nest] INFO [MaterialsService]    - Vernis: expire dans 28 jours (29/05/2026)
```

**Si les logs montrent "0 matériaux expirants trouvés":**
→ Problème avec la requête MongoDB ou les données

---

## 🐛 Problèmes Courants et Solutions

### Problème 1: Type de Données Incorrect

**Symptôme:** Le champ `expiryDate` existe mais est de type String au lieu de Date

**Vérification:**
```javascript
db.materials.findOne({ expiryDate: { $exists: true } })
// Regarder le type du champ expiryDate
```

**Solution:**
```javascript
// Convertir les strings en dates
db.materials.updateMany(
  { expiryDate: { $type: "string" } },
  [{ $set: { expiryDate: { $toDate: "$expiryDate" } } }]
)
```

---

### Problème 2: Status Incorrect

**Symptôme:** Les matériaux ont expiryDate mais status != 'active'

**Vérification:**
```javascript
db.materials.find({ 
  expiryDate: { $exists: true },
  status: { $ne: 'active' }
}).count()
```

**Solution:**
```javascript
// Mettre à jour le status
db.materials.updateMany(
  { expiryDate: { $exists: true } },
  { $set: { status: 'active' } }
)
```

---

### Problème 3: Dates dans le Passé

**Symptôme:** Les dates d'expiration sont déjà passées

**Vérification:**
```javascript
db.materials.find({ 
  expiryDate: { $lt: new Date() }
}).count()
```

**Solution:**
```javascript
// Mettre à jour avec des dates futures
db.materials.updateMany(
  { expiryDate: { $lt: new Date() } },
  [{ $set: { expiryDate: { $add: [new Date(), 15 * 24 * 60 * 60 * 1000] } } }]
)
```

---

### Problème 4: Dates Trop Lointaines

**Symptôme:** Les dates d'expiration sont dans plus de 30 jours

**Vérification:**
```javascript
const targetDate = new Date();
targetDate.setDate(targetDate.getDate() + 30);

db.materials.find({ 
  expiryDate: { $gt: targetDate }
}).count()
```

**Solution:**
```javascript
// Ajuster les dates pour qu'elles soient dans les 30 jours
db.materials.updateMany(
  { expiryDate: { $gt: targetDate } },
  [{ $set: { expiryDate: { $add: [new Date(), 15 * 24 * 60 * 60 * 1000] } } }]
)
```

---

### Problème 5: Champ expiryDate Manquant

**Symptôme:** Aucun matériau n'a de champ expiryDate

**Vérification:**
```javascript
db.materials.countDocuments({ expiryDate: { $exists: true } })
// Retourne 0
```

**Solution:**
```bash
# Utiliser le script d'ajout de données de test
node add-expiry-dates-test.js
```

**Ou manuellement:**
```javascript
// Ajouter des dates d'expiration à quelques matériaux
db.materials.updateOne(
  { code: "CIM001" },
  { $set: { 
    expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    status: 'active'
  }}
)

db.materials.updateOne(
  { code: "PEIN001" },
  { $set: { 
    expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    status: 'active'
  }}
)
```

---

## 🧪 Tests Complets

### Test 1: Vérification MongoDB

```javascript
// Dans mongosh ou MongoDB Compass
use smartsite

// Requête exacte du service
const targetDate = new Date();
targetDate.setDate(targetDate.getDate() + 30);

db.materials.find({
  expiryDate: { $exists: true, $ne: null, $lte: targetDate, $gte: new Date() },
  status: 'active',
}).sort({ expiryDate: 1 })
```

### Test 2: Vérification API

```bash
# Terminal 1: Démarrer le service
cd apps/backend/materials-service
npm run start:dev

# Terminal 2: Tester l'endpoint
curl -v http://localhost:3009/api/materials/expiring?days=30
```

### Test 3: Vérification Frontend

```
1. Ouvrir http://localhost:5173/materials
2. Aller dans la section "Matériaux Expirants"
3. Vérifier l'affichage
```

---

## 📋 Checklist de Vérification

- [ ] MongoDB est démarré
- [ ] La base de données 'smartsite' existe
- [ ] La collection 'materials' contient des documents
- [ ] Au moins un matériau a un champ `expiryDate`
- [ ] Le champ `expiryDate` est de type Date (pas String)
- [ ] Le champ `status` est 'active'
- [ ] La date d'expiration est dans le futur
- [ ] La date d'expiration est dans les 30 prochains jours
- [ ] Le service materials est démarré
- [ ] L'endpoint `/expiring` est accessible
- [ ] Les logs montrent le nombre de matériaux trouvés

---

## 🔧 Commandes Utiles

### MongoDB

```javascript
// Compter les matériaux avec expiryDate
db.materials.countDocuments({ expiryDate: { $exists: true } })

// Afficher les types de données
db.materials.aggregate([
  { $match: { expiryDate: { $exists: true } } },
  { $project: { 
    name: 1, 
    expiryDate: 1, 
    expiryDateType: { $type: "$expiryDate" }
  }}
])

// Supprimer toutes les dates d'expiration
db.materials.updateMany({}, { $unset: { expiryDate: "" } })

// Ajouter une date d'expiration à tous les matériaux actifs
db.materials.updateMany(
  { status: 'active' },
  { $set: { expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) } }
)
```

### API

```bash
# Test avec curl
curl http://localhost:3009/api/materials/expiring?days=30 | jq

# Test avec différentes périodes
curl http://localhost:3009/api/materials/expiring?days=7
curl http://localhost:3009/api/materials/expiring?days=60

# Test endpoint consolidé
curl http://localhost:3009/api/materials/anomalies/consolidated?days=30 | jq
```

---

## 📞 Support

Si le problème persiste après avoir suivi ce guide:

1. **Exécuter les scripts de diagnostic:**
   ```bash
   node test-expiring-materials.js > diagnostic.log
   ```

2. **Vérifier les logs du service:**
   ```bash
   grep "Recherche des matériaux expirant" logs/*.log
   ```

3. **Exporter les données MongoDB:**
   ```bash
   mongoexport --db=smartsite --collection=materials --query='{"expiryDate":{"$exists":true}}' --out=materials-with-expiry.json
   ```

4. **Partager les résultats** pour analyse

---

**Bon débogage ! 🔍**
