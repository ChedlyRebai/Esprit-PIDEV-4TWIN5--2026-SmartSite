# 🚀 Commandes à Exécuter

## ✅ Étape 1: Vérifier que le service compile

```powershell
cd apps/backend/materials-service
npm run build
```

**Résultat attendu**: `Exit Code: 0` (pas d'erreurs)

## ✅ Étape 2: Démarrer le service

```powershell
cd apps/backend/materials-service
npm start
```

**Résultat attendu**: Le service démarre sur le port 3002

## ✅ Étape 3: Créer des mouvements de test

### Option A: Via l'interface HTML (Plus simple)

1. Ouvrez `test-create-movements.html` dans votre navigateur
2. Remplissez le formulaire avec vos IDs
3. Cliquez sur "Créer les mouvements de test"

### Option B: Via PowerShell (cURL)

```powershell
# Remplacez MATERIAL_ID et SITE_ID par vos valeurs
$materialId = "674a5e3a2c5e8f001c8e4b8a"
$siteId = "674a5e3a2c5e8f001c8e4b8b"

$body = @{
    materialId = $materialId
    siteId = $siteId
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3002/api/material-flow/test-movements" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Option C: Via Node.js

```powershell
# 1. Modifiez les IDs dans create-movements-simple.js
# 2. Installez axios si nécessaire
npm install axios

# 3. Exécutez le script
node create-movements-simple.js
```

## ✅ Étape 4: Vérifier les résultats

### Dans l'application web:
1. Ouvrez les détails du matériau "Peinture blanche"
2. Appuyez sur F5 pour actualiser
3. Vérifiez que Movement Summary affiche des valeurs > 0
4. Vérifiez que Recent Movements affiche une liste

### Via l'API:

```powershell
# Vérifier les mouvements
Invoke-RestMethod -Uri "http://localhost:3002/api/materials/movements/MATERIAL_ID"

# Vérifier les statistiques
Invoke-RestMethod -Uri "http://localhost:3002/api/material-flow/aggregate/MATERIAL_ID?siteId=SITE_ID"
```

### Via MongoDB:

```javascript
// Connexion à MongoDB
use smartsite-materials

// Compter les mouvements
db.materialflowlogs.countDocuments({ materialId: ObjectId("MATERIAL_ID") })

// Afficher les mouvements
db.materialflowlogs.find({ materialId: ObjectId("MATERIAL_ID") }).sort({ timestamp: -1 })
```

## 🔍 Comment trouver vos IDs

### Material ID:

**Via la console du navigateur**:
```javascript
// Ouvrez les détails du matériau
// Ouvrez la console (F12)
// Cherchez: "📥 Loading movements for material: 674a5e3a2c5e8f001c8e4b8a"
```

**Via MongoDB**:
```javascript
use smartsite-materials
db.materials.findOne({ name: "Peinture blanche" })._id
```

### Site ID:

**Via la console du navigateur**:
```javascript
// Ouvrez les détails du matériau
// Ouvrez la console (F12)
// Cherchez les logs qui mentionnent le site
```

**Via MongoDB**:
```javascript
use smartsite
db.sites.findOne({ nom: "test 4" })._id
```

## 📊 Résultat Attendu

Après avoir créé les mouvements, vous devriez voir:

```
Movement Summary
├─ Total Entries: 150
├─ Total Exits: 80
├─ Net Balance: 70
└─ Anomalies: 0

Recent Movements
├─ +100 m³ - Réception initiale de stock (test)
├─ -30 m³ - Utilisation sur chantier (test)
├─ +50 m³ - Réapprovisionnement (test)
├─ -40 m³ - Utilisation sur chantier (test)
└─ -10 m³ - Matériel endommagé (test)

Météo du Chantier
├─ Température: 17°C
├─ Condition: peu nuageux
├─ Humidité: 71%
├─ Vent: 36 km/h
└─ Ville: Gabès

Site Assigné
├─ Nom: test 4
└─ Coordonnées: 33.8439, 9.4001
```

## 🐛 Dépannage Rapide

### Erreur de compilation:
```powershell
cd apps/backend/materials-service
npm install
npm run build
```

### Service ne démarre pas:
```powershell
# Arrêter tous les processus Node.js
Stop-Process -Name node -Force

# Redémarrer
cd apps/backend/materials-service
npm start
```

### Mouvements ne s'affichent pas:
1. Actualisez la page (F5)
2. Vérifiez la console du navigateur (F12)
3. Vérifiez que les IDs sont corrects
4. Vérifiez MongoDB

## ✅ Checklist Finale

- [ ] Service compile sans erreurs (`npm run build`)
- [ ] Service démarré sur port 3002 (`npm start`)
- [ ] IDs récupérés (Material ID et Site ID)
- [ ] Mouvements créés (via HTML, PowerShell, ou Node.js)
- [ ] Page actualisée (F5)
- [ ] Movement Summary affiche des valeurs > 0
- [ ] Recent Movements affiche une liste
- [ ] Météo s'affiche correctement

## 🎉 C'est Terminé!

Si tous les points de la checklist sont cochés, votre problème est résolu! 🎊

Les futurs mouvements seront automatiquement enregistrés lorsque vous utilisez les fonctions de mise à jour de stock dans l'application.
