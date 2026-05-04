# 🧪 Guide de test - Corrections appliquées

## 🎯 Objectif

Vérifier que les corrections appliquées fonctionnent correctement:
1. ✅ Récupération du GPS et localisation du site
2. ✅ Affichage des statistiques des mouvements
3. ✅ Gestion des erreurs robuste

## 📋 Checklist de test

### 1. Vérifier que le backend compile

```bash
cd apps/backend/materials-service
npm run build
# ✅ Succès
```

### 2. Vérifier que le frontend compile

```bash
cd apps/frontend
npm run build
# ✅ Succès
```

### 3. Démarrer les services

**Terminal 1: Service des sites**
```bash
cd apps/backend/gestion-site
npm run start:dev
# Attendre: [Nest] ... - ... LOG [NestFactory] Application successfully started
```

**Terminal 2: Service materials**
```bash
cd apps/backend/materials-service
npm run start:dev
# Attendre: [Nest] ... - ... LOG [NestFactory] Application successfully started
```

**Terminal 3: Frontend**
```bash
cd apps/frontend
npm run dev
# Attendre: VITE v6.3.5 ready in ... ms
```

## 🧪 Tests manuels

### Test 1: Diagnostic des sites

**Objectif:** Vérifier que les sites sont correctement configurés

**Commande:**
```bash
curl -X GET http://localhost:3000/api/materials/diagnostic/sites \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Résultat attendu:**
```json
{
  "success": true,
  "message": "Diagnostic complété",
  "data": {
    "totalMaterials": 10,
    "materialsWithSites": 5,
    "siteCheckResults": [
      {
        "materialId": "...",
        "materialName": "Ciment Portland",
        "siteId": "69d14ad9b03e727645d81aec",
        "siteFound": true,
        "siteName": "Chantier Nord",
        "hasCoordinates": true
      }
    ]
  }
}
```

**Interprétation:**
- ✅ `siteFound: true` = Site trouvé
- ✅ `hasCoordinates: true` = Coordonnées GPS disponibles
- ❌ `siteFound: false` = Site non trouvé (erreur 404)

### Test 2: Récupérer les détails du site avec GPS

**Objectif:** Vérifier que les coordonnées GPS sont récupérées

**Commande:**
```bash
# Remplacer MATERIAL_ID par un ID réel
curl -X GET http://localhost:3000/api/materials/MATERIAL_ID/site-details \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Résultat attendu (succès):**
```json
{
  "success": true,
  "message": "Détails du site récupérés avec succès",
  "data": {
    "siteId": "69d14ad9b03e727645d81aec",
    "siteName": "Chantier Nord",
    "siteAddress": "123 Rue de la Paix",
    "siteLocalisation": "Paris",
    "coordinates": {
      "lat": 48.856613,
      "lng": 2.352222
    },
    "status": "active",
    "progress": 75
  }
}
```

**Résultat attendu (pas de site):**
```json
{
  "success": false,
  "message": "Aucun site assigné à ce matériau",
  "data": null
}
```

### Test 3: Récupérer les statistiques des mouvements

**Objectif:** Vérifier que les statistiques sont correctement calculées

**Commande:**
```bash
# Remplacer MATERIAL_ID par un ID réel
curl -X GET http://localhost:3000/api/materials/MATERIAL_ID/aggregate-stats \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Résultat attendu:**
```json
{
  "success": true,
  "message": "Statistiques récupérées avec succès",
  "data": {
    "totalEntries": 150,
    "totalExits": 50,
    "netFlow": 100,
    "totalAnomalies": 0
  }
}
```

### Test 4: Récupérer les statistiques avec filtre par site

**Objectif:** Vérifier que les statistiques sont filtrées par site

**Commande:**
```bash
# Remplacer MATERIAL_ID et SITE_ID par des IDs réels
curl -X GET "http://localhost:3000/api/materials/MATERIAL_ID/aggregate-stats?siteId=SITE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Résultat attendu:**
```json
{
  "success": true,
  "message": "Statistiques récupérées avec succès",
  "data": {
    "totalEntries": 100,
    "totalExits": 30,
    "netFlow": 70,
    "totalAnomalies": 0
  }
}
```

## 🖥️ Tests dans l'interface utilisateur

### Test 5: Affichage des coordonnées GPS dans MaterialDetails

**Étapes:**
1. Ouvrir l'application frontend
2. Naviguer vers la page Materials
3. Cliquer sur un matériau assigné à un chantier
4. Vérifier que les coordonnées GPS s'affichent

**Résultat attendu:**
```
Chantier Assigné
Chantier Nord
123 Rue de la Paix
📍 48.856600°, 2.352200°
```

**Logs attendus (console du navigateur):**
```
📍 Récupération des détails du site pour le matériau 69f022c79cb4e820b5bc9a9d
✅ Détails du site récupérés: Object
```

### Test 6: Affichage des statistiques des mouvements

**Étapes:**
1. Ouvrir MaterialDetails pour un matériau
2. Scroller jusqu'à la section "Synthèse des Mouvements"
3. Vérifier que les statistiques s'affichent

**Résultat attendu:**
```
Synthèse des Mouvements
Total Entrées: 150
Total Sorties: 50
Solde Net: 100
```

**Logs attendus (console du navigateur):**
```
📊 Récupération des statistiques pour le matériau 69f022c79cb4e820b5bc9a9d
✅ Statistiques récupérées: Object
```

### Test 7: Fallback quand pas de site assigné

**Étapes:**
1. Ouvrir MaterialDetails pour un matériau sans site assigné
2. Vérifier que le message "Non assigné" s'affiche

**Résultat attendu:**
```
Chantier Assigné
Non assigné
(Pas de coordonnées GPS)
```

### Test 8: Fallback quand le service des sites est indisponible

**Étapes:**
1. Arrêter le service des sites
2. Ouvrir MaterialDetails pour un matériau
3. Vérifier que le fallback fonctionne

**Résultat attendu:**
```
Chantier Assigné
Site assigné
(Pas de coordonnées GPS)
```

**Logs attendus (backend):**
```
❌ Erreur lors de la récupération du site 69d14ad9b03e727645d81aec: 
   connect ECONNREFUSED 127.0.0.1:3001
```

## 📊 Logs à vérifier

### Backend - Logs normaux

```
📍 Récupération des détails du site pour le matériau 69f022c79cb4e820b5bc9a9d
📍 Récupération site 69d14ad9b03e727645d81aec: Chantier Nord
✅ Coordonnées GPS extraites (format 1): lat=48.856613, lng=2.352222
✅ Détails du site récupérés: Chantier Nord
```

### Backend - Logs d'erreur

```
❌ Erreur lors de la récupération du site 69d14ad9b03e727645d81aec: 
   Request failed with status code 404
```

### Frontend - Logs normaux

```
📍 Récupération des détails du site pour le matériau 69f022c79cb4e820b5bc9a9d
✅ Détails du site récupérés: Object
📊 Récupération des statistiques pour le matériau 69f022c79cb4e820b5bc9a9d
✅ Statistiques récupérées: Object
```

## 🔍 Dépannage

### Problème: Erreur 404 lors de la récupération du site

**Cause:** Le site n'existe pas ou le siteId est invalide

**Solution:**
1. Vérifier que le matériau a un siteId assigné
2. Vérifier que le site existe dans la base de données
3. Exécuter le diagnostic: `GET /materials/diagnostic/sites`

### Problème: Pas de coordonnées GPS

**Cause:** Le site n'a pas de coordonnées GPS

**Solution:**
1. Vérifier que le site a des coordonnées GPS dans la base de données
2. Vérifier le format des coordonnées (lat/lng ou latitude/longitude)

### Problème: Statistiques affichent 0

**Cause:** Les mouvements ne sont pas enregistrés dans `material-flow-log`

**Solution:**
1. Vérifier que les mouvements ont été enregistrés
2. Vérifier que le matériau a des `stockEntree` et `stockSortie`
3. Vérifier la collection `material-flow-log` dans MongoDB

### Problème: Service des sites indisponible

**Cause:** Le service des sites n'est pas en cours d'exécution

**Solution:**
1. Vérifier que le service est démarré
2. Vérifier que le port 3001 est accessible
3. Vérifier les logs du service des sites

## ✅ Checklist de validation

- [ ] Backend compile sans erreurs
- [ ] Frontend compile sans erreurs
- [ ] Service des sites est en cours d'exécution
- [ ] Service materials est en cours d'exécution
- [ ] Frontend est en cours d'exécution
- [ ] Diagnostic des sites retourne des résultats
- [ ] Coordonnées GPS s'affichent dans MaterialDetails
- [ ] Statistiques des mouvements s'affichent
- [ ] Fallback fonctionne quand pas de site assigné
- [ ] Fallback fonctionne quand service indisponible
- [ ] Logs du backend sont corrects
- [ ] Logs du frontend sont corrects

## 📞 Support

Si vous rencontrez un problème:

1. Vérifier les logs du backend et du frontend
2. Exécuter le diagnostic: `GET /materials/diagnostic/sites`
3. Vérifier la base de données MongoDB
4. Consulter le guide de dépannage: `TROUBLESHOOTING.md`
