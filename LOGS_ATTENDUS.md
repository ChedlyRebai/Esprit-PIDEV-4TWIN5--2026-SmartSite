# 📋 Logs Attendus - Après les corrections

## 🖥️ Backend Logs

### Lors de l'appel GET /api/materials/:id

```
[Nest] 2472  - 05/01/2026, 6:28:13 PM     LOG [MaterialsService] 🔍 findOne: Material 69f022c79cb4e820b5bc9a9d, siteId: 69d14ad9b03e727645d81aec

[Nest] 2472  - 05/01/2026, 6:28:13 PM     LOG [MaterialsService] 📡 Fetching site data from MongoDB for siteId: 69d14ad9b03e727645d81aec

[Nest] 2472  - 05/01/2026, 6:28:13 PM     LOG [MaterialsService] ✅ Site data found:
{
  "_id": "69d14ad9b03e727645d81aec",
  "nom": "site1",
  "adresse": "medjez el beb",
  "localisation": "medjez el beb",
  "budget": 2500000,
  "isActif": true,
  "area": 5000,
  "status": "planning",
  "progress": 0,
  "workStartDate": "2026-04-04T17:31:05.904Z",
  "projectId": "2",
  "coordinates": {
    "lat": 33.902025209016024,
    "lng": 9.501040769903268
  },
  "createdBy": null,
  "updatedBy": null,
  "teams": [],
  "teamIds": [],
  "createdAt": "2026-04-04T17:31:05.970Z",
  "updatedAt": "2026-04-04T18:14:42.353Z",
  "__v": 0
}

[Nest] 2472  - 05/01/2026, 6:28:13 PM     LOG [MaterialsService] ✅ Coordonnées extraites (format coordinates): lat=33.902025209016024, lng=9.501040769903268

[Nest] 2472  - 05/01/2026, 6:28:13 PM     LOG [MaterialsService] ✅ Material enriched with site info:
{
  "siteId": "69d14ad9b03e727645d81aec",
  "siteName": "site1",
  "siteAddress": "medjez el beb",
  "siteLocalisation": "medjez el beb",
  "siteCoordinates": {
    "lat": 33.902025209016024,
    "lng": 9.501040769903268
  }
}
```

### Lors de l'appel GET /api/materials/:id/order-status

```
[Nest] 2472  - 05/01/2026, 6:28:40 PM     LOG [MaterialsController] 📊 Récupération du statut de commande pour le matériau 69f022c79cb4e820b5bc9a9d

[Nest] 2472  - 05/01/2026, 6:28:40 PM     LOG [MaterialsController] ✅ Statut de commande récupéré:
{
  "success": true,
  "isOrdered": true,
  "orderId": "ORD-1-abc123",
  "orderDate": "2026-05-01T10:00:00.000Z",
  "expectedDelivery": "2026-05-08T10:00:00.000Z",
  "progress": 50,
  "statusMessage": "En cours d'expédition",
  "daysSinceOrder": 3,
  "reorderCount": 1
}
```

## 🌐 Frontend Logs (Console du navigateur)

### Lors du chargement de MaterialDetails

```
📍 Récupération des détails du site pour le matériau: {
  siteId: '69d14ad9b03e727645d81aec',
  siteName: 'site1',
  siteLocalisation: 'medjez el beb',
  siteCoordinates: {
    lat: 33.902025209016024,
    lng: 9.501040769903268
  }
}

✅ Données du site trouvées dans le matériau: {
  siteName: 'site1',
  siteLocalisation: 'medjez el beb',
  coordinates: {
    lat: 33.902025209016024,
    lng: 9.501040769903268
  }
}

📊 Données du matériau récupérées: {
  stockEntree: 150,
  stockSortie: 50
}
```

### Lors du chargement du statut de commande

```
✅ Order status loaded: {
  success: true,
  isOrdered: true,
  orderId: 'ORD-1-abc123',
  orderDate: '2026-05-01T10:00:00.000Z',
  expectedDelivery: '2026-05-08T10:00:00.000Z',
  progress: 50,
  statusMessage: 'En cours d\'expédition',
  daysSinceOrder: 3,
  reorderCount: 1
}
```

## 📊 Affichage dans MaterialDetails

### Section: Chantier Assigné

```
Chantier Assigné
site1
medjez el beb
📍 33.902025°, 9.501041°
medjez el beb
```

### Section: Statut de commande

```
Statut de commande
✅ Commande en cours
Réf: ORD-1-abc123

Progrès de la commande: 50%
Confirmée | Préparation | Expédition | Transit | Livraison
En cours d'expédition

Commandé le: 01/05/2026
Livraison prévue: 08/05/2026
```

### Section: Synthèse des Mouvements

```
Synthèse des Mouvements
Total Entrées: 150
Total Sorties: 50
Solde Net: 100
```

## 🔍 Diagnostic

### Vérifier que tout fonctionne

1. **Ouvrir la console du navigateur (F12)**
   - Vérifier les logs du frontend
   - Vérifier qu'il n'y a pas d'erreurs

2. **Ouvrir les logs du backend**
   - Vérifier que le site est récupéré depuis MongoDB
   - Vérifier que les coordonnées GPS sont extraites
   - Vérifier que le matériau est enrichi

3. **Vérifier l'affichage dans MaterialDetails**
   - Vérifier que le nom du site s'affiche
   - Vérifier que les coordonnées GPS s'affichent
   - Vérifier que la localisation s'affiche
   - Vérifier que le statut de commande s'affiche

## ✅ Checklist de vérification

- [ ] Backend logs montrent "✅ Site data found"
- [ ] Backend logs montrent "✅ Coordonnées extraites"
- [ ] Backend logs montrent "✅ Material enriched with site info"
- [ ] Frontend logs montrent "✅ Données du site trouvées"
- [ ] Frontend affiche le nom du site (site1)
- [ ] Frontend affiche les coordonnées GPS (33.902025°, 9.501041°)
- [ ] Frontend affiche la localisation (medjez el beb)
- [ ] Frontend affiche le statut de commande (Commande en cours)
- [ ] Frontend affiche le progrès de la commande (50%)
- [ ] Frontend affiche les statistiques des mouvements (150, 50, 100)

## 🚨 Erreurs possibles

### Erreur: "Site data not found in MongoDB"

**Cause:** Le site n'existe pas dans MongoDB

**Solution:**
1. Vérifier que le site existe dans la base de données
2. Vérifier que le siteId du matériau est correct
3. Vérifier que le matériau a un siteId assigné

### Erreur: "Aucune coordonnée trouvée pour le site"

**Cause:** Le site n'a pas de coordonnées GPS

**Solution:**
1. Vérifier que le site a des coordonnées GPS
2. Vérifier le format des coordonnées (lat/lng)
3. Ajouter les coordonnées GPS au site

### Erreur: "Ce matériau n'a pas encore été commandé"

**Cause:** Le matériau n'a pas de lastOrdered ou reorderCount

**Solution:**
1. Passer une commande pour le matériau
2. Vérifier que lastOrdered et reorderCount sont enregistrés
3. Vérifier que l'endpoint /order-status retourne les bonnes données

## 📞 Support

Si vous rencontrez un problème:

1. Vérifier les logs du backend
2. Vérifier les logs du frontend (F12)
3. Vérifier la base de données MongoDB
4. Consulter ce fichier pour les logs attendus
