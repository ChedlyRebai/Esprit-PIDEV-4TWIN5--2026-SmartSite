# 🔍 Guide de Débogage Complet

## 🎯 Problème actuel

Le matériau "Peinture blanche" affiche:
- ❌ "Site Assignment Required" au lieu de la météo
- ❌ Movement Summary: 0 partout
- ❌ Recent Movements: "No movements recorded"

## 📋 Étapes de débogage

### Étape 1: Vérifier les données dans MongoDB

```bash
node check-material-data.js
```

Ce script va vérifier:
- ✅ Si le matériau existe
- ✅ Si le matériau a un `siteId`
- ✅ Si le site existe dans la base `smartsite`
- ✅ Si le site a des coordonnées GPS
- ✅ Si des mouvements existent pour ce matériau

**Résultat attendu**:
```
📦 Matériau trouvé:
   ID: 674a5e3a2c5e8f001c8e4b8a
   Nom: Peinture blanche
   Site ID: 674a5e3a2c5e8f001c8e4b8b

✅ Site trouvé:
   ID: 674a5e3a2c5e8f001c8e4b8b
   Nom: test 4
   Coordonnées: { latitude: 33.8439, longitude: 9.4001 }
```

### Étape 2: Vérifier les logs du backend

1. **Ouvrez le terminal** où le service materials est démarré
2. **Ouvrez les détails** du matériau dans l'application
3. **Cherchez les logs** suivants:

```
🔍 findOne: Material 674a5e3a2c5e8f001c8e4b8a, siteId: 674a5e3a2c5e8f001c8e4b8b
📡 Fetching site data from: http://localhost:3001/api/gestion-sites/674a5e3a2c5e8f001c8e4b8b
✅ Site data received: { ... }
✅ Coordonnées extraites: lat=33.8439, lng=9.4001
✅ Material enriched with site info: { siteCoordinates: { lat: 33.8439, lng: 9.4001 } }
```

**Si vous voyez une erreur**:
```
❌ Error fetching site 674a5e3a2c5e8f001c8e4b8b: ...
```

Cela signifie que le service `gestion-sites` ne répond pas ou que l'URL est incorrecte.

### Étape 3: Vérifier les logs du frontend

1. **Ouvrez la console** du navigateur (F12)
2. **Ouvrez les détails** du matériau
3. **Cherchez les logs** suivants:

```
📦 Loading enriched material data for: 674a5e3a2c5e8f001c8e4b8a
✅ Enriched material loaded: { ... }
🔍 Site info: {
  siteId: "674a5e3a2c5e8f001c8e4b8b",
  siteName: "test 4",
  siteCoordinates: { lat: 33.8439, lng: 9.4001 }
}
✅ GPS Coordinates found: { lat: 33.8439, lng: 9.4001 }
```

**Si vous voyez**:
```
⚠️ No GPS coordinates found in enriched material
```

Cela signifie que le backend n'a pas retourné les coordonnées.

### Étape 4: Vérifier que le service gestion-sites fonctionne

```bash
# PowerShell
Invoke-RestMethod -Uri "http://localhost:3001/api/gestion-sites/VOTRE_SITE_ID"
```

**Résultat attendu**:
```json
{
  "_id": "674a5e3a2c5e8f001c8e4b8b",
  "nom": "test 4",
  "coordonnees": {
    "latitude": 33.8439,
    "longitude": 9.4001
  }
}
```

**Si erreur "Cannot connect"**:
- Le service `gestion-sites` n'est pas démarré
- Le port 3001 est incorrect
- Le service est sur un autre port

### Étape 5: Créer des mouvements de test

```bash
# PowerShell
$body = @{
    materialId = "674a5e3a2c5e8f001c8e4b8a"
    siteId = "674a5e3a2c5e8f001c8e4b8b"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3002/api/material-flow/test-movements" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Résultat attendu**:
```json
{
  "success": true,
  "message": "5 mouvements de test créés avec succès",
  "movements": [...]
}
```

## 🔧 Solutions aux problèmes courants

### Problème 1: Service gestion-sites ne répond pas

**Symptôme**: Logs backend montrent "Error fetching site"

**Solutions**:
1. Vérifiez que le service `gestion-sites` est démarré
2. Vérifiez le port (3001 par défaut)
3. Vérifiez l'URL dans `materials.service.ts` ligne ~260

**Correction temporaire**: Accéder directement à MongoDB

Modifiez `findOne()` pour récupérer le site directement depuis MongoDB au lieu de l'API:

```typescript
// Au lieu de:
const siteResponse = await this.httpService.axiosRef.get(...);

// Utilisez:
const siteConnection = this.materialModel.db.getClient();
const smartsiteDb = siteConnection.db('smartsite');
const sitesCollection = smartsiteDb.collection('sites');
const siteData = await sitesCollection.findOne({ _id: new Types.ObjectId(siteIdStr) });
```

### Problème 2: Format des coordonnées incorrect

**Symptôme**: Logs montrent "Aucune coordonnée trouvée"

**Solution**: La méthode `findOne()` gère maintenant 3 formats:
1. `coordinates.lat` / `coordinates.lng`
2. `coordonnees.latitude` / `coordonnees.longitude`
3. `lat` / `lng` directement

Vérifiez les logs pour voir quel format est utilisé.

### Problème 3: Matériau n'a pas de siteId

**Symptôme**: Logs montrent "Material has no siteId assigned"

**Solution**: Assignez un site au matériau via l'interface:
1. Ouvrez la liste des matériaux
2. Cliquez sur "Edit" pour le matériau
3. Sélectionnez un site dans le dropdown
4. Sauvegardez

### Problème 4: Pas de mouvements enregistrés

**Symptôme**: Movement Summary affiche 0 partout

**Solution**: Créez des mouvements de test:
1. Ouvrez `test-create-movements.html`
2. Entrez les IDs
3. Cliquez sur "Créer les mouvements"
4. Actualisez la page (F5)

## 📊 Checklist de vérification

- [ ] MongoDB est accessible
- [ ] Le matériau existe dans `smartsite-materials.materials`
- [ ] Le matériau a un `siteId` non null
- [ ] Le site existe dans `smartsite.sites`
- [ ] Le site a des coordonnées GPS (format `coordonnees` ou `coordinates`)
- [ ] Le service `materials` est démarré (port 3002)
- [ ] Le service `gestion-sites` est démarré (port 3001)
- [ ] La méthode `findOne()` retourne les coordonnées (vérifier logs backend)
- [ ] Le frontend reçoit les coordonnées (vérifier logs console)
- [ ] Des mouvements existent dans `smartsite-materials.materialflowlogs`

## 🎯 Test final

Après avoir vérifié tous les points:

1. **Actualisez la page** (F5)
2. **Ouvrez les détails** du matériau
3. **Vérifiez** que vous voyez:
   - ✅ Nom du site et coordonnées GPS
   - ✅ Météo du chantier
   - ✅ Movement Summary avec valeurs > 0
   - ✅ Recent Movements avec liste

## 📞 Besoin d'aide?

Si le problème persiste après avoir suivi ce guide:

1. **Copiez les logs** du backend (terminal)
2. **Copiez les logs** du frontend (console F12)
3. **Exécutez** `node check-material-data.js` et copiez le résultat
4. **Partagez** ces informations pour diagnostic

## 🔄 Redémarrage complet

Si rien ne fonctionne, essayez un redémarrage complet:

```powershell
# 1. Arrêter tous les services Node.js
Stop-Process -Name node -Force

# 2. Redémarrer MongoDB (si nécessaire)
# ...

# 3. Redémarrer le service materials
cd apps/backend/materials-service
npm start

# 4. Redémarrer le service gestion-sites
cd apps/backend/gestion-site
npm start

# 5. Redémarrer le frontend
cd apps/frontend
npm run dev
```

Puis suivez à nouveau les étapes de débogage.
