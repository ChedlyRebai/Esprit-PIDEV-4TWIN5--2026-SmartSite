# 🚀 Guide Rapide - Créer des mouvements pour le matériau

## ✅ Problème résolu

L'erreur TypeScript a été corrigée! Le service compile maintenant sans erreurs.

## 📝 Étapes pour créer des mouvements

### Méthode 1: Interface HTML (Plus simple) ⭐

1. **Ouvrez** le fichier `test-create-movements.html` dans votre navigateur
2. **Récupérez les IDs** de votre matériau:
   - Ouvrez les détails du matériau "Peinture blanche" dans l'application
   - Ouvrez la console du navigateur (F12)
   - Cherchez les logs qui affichent l'ID du matériau et du site
3. **Collez les IDs** dans le formulaire HTML
4. **Cliquez** sur "Créer les mouvements de test"
5. **Actualisez** la page des détails du matériau (F5)

### Méthode 2: Script Node.js

1. **Modifiez** le fichier `create-movements-simple.js`:
   ```javascript
   const MATERIAL_ID = 'VOTRE_MATERIAL_ID'; // Remplacez ici
   const SITE_ID = 'VOTRE_SITE_ID';         // Remplacez ici
   ```

2. **Installez axios** (si nécessaire):
   ```bash
   npm install axios
   ```

3. **Exécutez** le script:
   ```bash
   node create-movements-simple.js
   ```

### Méthode 3: Via cURL (Terminal)

```bash
curl -X POST http://localhost:3002/api/material-flow/test-movements \
  -H "Content-Type: application/json" \
  -d "{\"materialId\": \"VOTRE_MATERIAL_ID\", \"siteId\": \"VOTRE_SITE_ID\"}"
```

### Méthode 4: Via Postman ou Insomnia

**URL**: `POST http://localhost:3002/api/material-flow/test-movements`

**Headers**:
```
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "materialId": "VOTRE_MATERIAL_ID",
  "siteId": "VOTRE_SITE_ID"
}
```

## 🔍 Comment trouver les IDs

### Material ID

**Option 1 - Console du navigateur**:
1. Ouvrez les détails du matériau
2. Ouvrez la console (F12)
3. Cherchez: `📥 Loading movements for material: 674a5e3a2c5e8f001c8e4b8a`
4. Copiez l'ID après "material:"

**Option 2 - URL**:
1. Ouvrez les détails du matériau
2. Regardez l'URL dans la barre d'adresse
3. L'ID est généralement dans l'URL

**Option 3 - Depuis MongoDB**:
```javascript
use smartsite-materials
db.materials.findOne({ name: "Peinture blanche" })
```

### Site ID

**Option 1 - Console du navigateur**:
1. Ouvrez les détails du matériau
2. Ouvrez la console (F12)
3. Cherchez les logs qui mentionnent le site
4. Copiez l'ID du site

**Option 2 - Depuis MongoDB**:
```javascript
use smartsite
db.sites.findOne({ nom: "test 4" })
```

## 📊 Résultat attendu

Après avoir créé les mouvements, vous devriez voir:

### Movement Summary
```
Total Entries: 150
Total Exits: 80
Net Balance: 70
Anomalies: 0
```

### Recent Movements
```
1. +100 m³ - Réception initiale de stock (test)
2. -30 m³ - Utilisation sur chantier (test)
3. +50 m³ - Réapprovisionnement (test)
4. -40 m³ - Utilisation sur chantier (test)
5. -10 m³ - Matériel endommagé (test)
```

## 🐛 Dépannage

### Le service ne démarre pas

```bash
# Vérifiez les processus Node.js en cours
Get-Process -Name node

# Arrêtez tous les processus Node.js si nécessaire
Stop-Process -Name node -Force

# Redémarrez le service
cd apps/backend/materials-service
npm start
```

### Erreur "Cannot connect to server"

1. Vérifiez que le service materials est démarré sur le port 3002
2. Vérifiez les logs du service pour voir les erreurs
3. Vérifiez que MongoDB est accessible

### Les mouvements ne s'affichent pas

1. **Actualisez la page** (F5) après avoir créé les mouvements
2. **Vérifiez la console** du navigateur pour voir les logs
3. **Vérifiez MongoDB**:
   ```javascript
   use smartsite-materials
   db.materialflowlogs.find({ materialId: ObjectId("VOTRE_ID") }).count()
   ```

### Erreur "materialId et siteId sont requis"

1. Vérifiez que vous avez bien fourni les deux IDs
2. Vérifiez que les IDs sont au bon format (24 caractères hexadécimaux)
3. Vérifiez qu'il n'y a pas d'espaces avant/après les IDs

## ✅ Checklist

- [ ] Le service materials est démarré (port 3002)
- [ ] MongoDB est accessible
- [ ] J'ai récupéré le Material ID
- [ ] J'ai récupéré le Site ID
- [ ] J'ai créé les mouvements (via HTML, script, ou cURL)
- [ ] J'ai actualisé la page des détails du matériau
- [ ] Les statistiques s'affichent correctement
- [ ] Les mouvements récents s'affichent

## 🎉 Succès!

Si tout fonctionne, vous devriez maintenant voir:
- ✅ Météo du chantier avec température, humidité, vent
- ✅ Coordonnées GPS du site
- ✅ Movement Summary avec des valeurs > 0
- ✅ Recent Movements avec une liste de mouvements

Les futurs mouvements seront automatiquement enregistrés lorsque vous utilisez les fonctions de mise à jour de stock dans l'application!
