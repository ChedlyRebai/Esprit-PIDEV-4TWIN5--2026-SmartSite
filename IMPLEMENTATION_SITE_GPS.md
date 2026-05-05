# Implémentation: Récupération du GPS et Localisation du Chantier dans Material Details

## 📋 Résumé des changements

Cette implémentation ajoute la capacité à récupérer automatiquement les coordonnées GPS et le nom de localisation du chantier assigné à un matériau dans le composant `MaterialDetails`.

## 🔧 Changements effectués

### 1. Backend - Service Materials (`apps/backend/materials-service/src/materials/materials.service.ts`)

**Nouvelle méthode ajoutée:**
```typescript
async getSiteDetailsWithGPS(materialId: string): Promise<{
  siteId: string;
  siteName: string;
  siteAddress: string;
  siteLocalisation: string;
  coordinates: { lat: number; lng: number } | null;
  status: string;
  progress: number;
} | null>
```

**Fonctionnalités:**
- Récupère le matériau par ID
- Vérifie si un site est assigné
- Appelle l'API des sites pour récupérer les détails complets
- Extrait les coordonnées GPS (lat/lng)
- Retourne les informations du site avec localisation
- Gère les erreurs avec fallback gracieux

### 2. Backend - Contrôleur Materials (`apps/backend/materials-service/src/materials/materials.controller.ts`)

**Nouvel endpoint ajouté:**
```
GET /materials/:id/site-details
```

**Réponse:**
```json
{
  "success": true,
  "message": "Détails du site récupérés avec succès",
  "data": {
    "siteId": "...",
    "siteName": "Chantier Nord",
    "siteAddress": "123 Rue de la Paix",
    "siteLocalisation": "Paris",
    "coordinates": {
      "lat": 48.8566,
      "lng": 2.3522
    },
    "status": "active",
    "progress": 75
  }
}
```

### 3. Frontend - Service Materials (`apps/frontend/src/services/materialService.ts`)

**Mise à jour de l'interface Material:**
- Ajout de `stockEntree?: number` - Quantité entrée dans le chantier
- Ajout de `stockSortie?: number` - Quantité sortie du chantier
- Ajout de `siteAddress?: string` - Adresse du site assigné

**Nouvelle méthode ajoutée:**
```typescript
async getSiteDetailsWithGPS(materialId: string): Promise<{
  success: boolean;
  message: string;
  data: {
    siteId: string;
    siteName: string;
    siteAddress: string;
    siteLocalisation: string;
    coordinates: { lat: number; lng: number } | null;
    status: string;
    progress: number;
  } | null;
}>
```

### 4. Frontend - Composant MaterialDetails (`apps/frontend/src/app/pages/materials/MaterialDetails.tsx`)

**Mise à jour de la fonction `loadSiteDetails`:**
- Utilise maintenant `materialService.getSiteDetailsWithGPS()` au lieu de `fetch()`
- Récupère les détails du site directement depuis le backend
- Affiche les coordonnées GPS avec l'icône Globe
- Affiche le nom de localisation du site

**Affichage des informations:**
```
Chantier Assigné: Chantier Nord
Adresse: 123 Rue de la Paix
📍 48.856600°, 2.352200°
```

## 🎯 Flux de données

```
MaterialDetails Component
    ↓
materialService.getSiteDetailsWithGPS(materialId)
    ↓
GET /api/materials/:id/site-details
    ↓
MaterialsController.getSiteDetailsWithGPS()
    ↓
MaterialsService.getSiteDetailsWithGPS()
    ↓
GET http://localhost:3001/api/gestion-sites/:siteId
    ↓
Retour des coordonnées GPS et localisation
```

## 📍 Affichage des coordonnées GPS

Les coordonnées GPS sont affichées dans une section dédiée avec:
- Icône Globe (🌍)
- Format: `lat.xxxxxx°, lng.xxxxxx°`
- Fond bleu clair pour meilleure visibilité
- Affichage conditionnel (seulement si coordonnées disponibles)

## ✅ Avantages

1. **Centralisation**: Les détails du site sont récupérés depuis une seule source (le backend)
2. **Performance**: Utilisation du service au lieu de fetch direct
3. **Fiabilité**: Gestion d'erreurs robuste avec fallback
4. **Maintenabilité**: Code centralisé et réutilisable
5. **Flexibilité**: Facile d'ajouter d'autres informations du site

## 🔄 Fallback

Si la récupération des détails du site échoue:
1. Le composant utilise les informations stockées dans le matériau (`material.siteName`, `material.siteCoordinates`)
2. Si aucune information n'est disponible, affiche "Non assigné"
3. L'utilisateur peut toujours voir les données de base du matériau

## 🧪 Test

Pour tester cette implémentation:

1. **Ouvrir un matériau assigné à un chantier** dans MaterialDetails
2. **Vérifier que les informations du site s'affichent:**
   - Nom du chantier
   - Adresse
   - Coordonnées GPS
   - Localisation

3. **Vérifier les logs du backend:**
   ```
   📍 Récupération des détails du site pour le matériau [ID]
   ✅ Détails du site récupérés: [Nom du site]
   ```

## 📝 Notes

- Les coordonnées GPS sont au format décimal (latitude, longitude)
- La localisation est le nom de la ville/région du site
- Le service gère automatiquement les erreurs de connexion
- Les données sont mises en cache au niveau du composant

## 🚀 Prochaines étapes possibles

1. Ajouter une carte interactive avec les coordonnées GPS
2. Calculer la distance entre le matériau et le chantier
3. Afficher la météo du chantier basée sur les coordonnées
4. Intégrer avec un service de géolocalisation
5. Ajouter des alertes basées sur la localisation
