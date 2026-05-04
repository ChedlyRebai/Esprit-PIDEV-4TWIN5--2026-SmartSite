# 📚 Exemples d'utilisation - Récupération GPS et Localisation

## 🎯 Cas d'usage

### 1. Affichage des détails du site dans MaterialDetails

**Avant:**
```typescript
// Appel direct à l'API des sites
const response = await fetch(`/api/sites/${material.siteId}`);
const result = await response.json();
```

**Après:**
```typescript
// Utilisation du service centralisé
const response = await materialService.getSiteDetailsWithGPS(material._id);

if (response.success && response.data) {
  const siteData = response.data;
  setSiteDetails({
    id: siteData.siteId,
    nom: siteData.siteName,
    adresse: siteData.siteAddress,
    localisation: siteData.siteLocalisation,
    coordinates: siteData.coordinates,
    status: siteData.status,
    progress: siteData.progress
  });
}
```

## 📡 Appels API

### Endpoint: GET /materials/:id/site-details

**Requête:**
```bash
curl -X GET http://localhost:3000/api/materials/507f1f77bcf86cd799439011/site-details \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Réponse réussie (200):**
```json
{
  "success": true,
  "message": "Détails du site récupérés avec succès",
  "data": {
    "siteId": "507f1f77bcf86cd799439012",
    "siteName": "Chantier Nord - Immeuble Résidentiel",
    "siteAddress": "123 Rue de la Paix, 75001 Paris",
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

**Réponse - Pas de site assigné (200):**
```json
{
  "success": false,
  "message": "Aucun site assigné à ce matériau",
  "data": null
}
```

**Réponse - Erreur (500):**
```json
{
  "success": false,
  "message": "Erreur lors de la récupération des détails du site",
  "error": "Service des sites indisponible",
  "data": null
}
```

## 🔍 Exemples de réponses

### Exemple 1: Matériau assigné à un chantier avec GPS

```json
{
  "success": true,
  "message": "Détails du site récupérés avec succès",
  "data": {
    "siteId": "60d5ec49c1234567890abcde",
    "siteName": "Chantier Centre Commercial",
    "siteAddress": "456 Avenue des Champs, 75008 Paris",
    "siteLocalisation": "Paris 8ème",
    "coordinates": {
      "lat": 48.8698,
      "lng": 2.3076
    },
    "status": "active",
    "progress": 50
  }
}
```

### Exemple 2: Matériau sans site assigné

```json
{
  "success": false,
  "message": "Aucun site assigné à ce matériau",
  "data": null
}
```

### Exemple 3: Matériau avec site mais sans coordonnées GPS

```json
{
  "success": true,
  "message": "Détails du site récupérés avec succès",
  "data": {
    "siteId": "60d5ec49c1234567890abcde",
    "siteName": "Chantier Entrepôt",
    "siteAddress": "789 Route de Lyon, 69000 Lyon",
    "siteLocalisation": "Lyon",
    "coordinates": null,
    "status": "active",
    "progress": 30
  }
}
```

## 💻 Utilisation dans les composants React

### Exemple 1: Affichage simple des coordonnées

```typescript
import { useState, useEffect } from 'react';
import materialService from '../services/materialService';
import { Globe } from 'lucide-react';

export function SiteCoordinatesDisplay({ materialId }) {
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCoordinates = async () => {
      setLoading(true);
      try {
        const response = await materialService.getSiteDetailsWithGPS(materialId);
        if (response.success && response.data?.coordinates) {
          setCoordinates(response.data.coordinates);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCoordinates();
  }, [materialId]);

  if (loading) return <div>Chargement...</div>;
  if (!coordinates) return <div>Pas de coordonnées disponibles</div>;

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4" />
      <span>
        📍 {coordinates.lat.toFixed(6)}°, {coordinates.lng.toFixed(6)}°
      </span>
    </div>
  );
}
```

### Exemple 2: Affichage complet des détails du site

```typescript
import { useState, useEffect } from 'react';
import materialService from '../services/materialService';
import { Card, CardContent } from '../components/ui/card';
import { MapPin, Globe, Building } from 'lucide-react';

export function SiteDetailsCard({ materialId }) {
  const [siteDetails, setSiteDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSiteDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await materialService.getSiteDetailsWithGPS(materialId);
        if (response.success && response.data) {
          setSiteDetails(response.data);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError('Erreur lors du chargement des détails du site');
      } finally {
        setLoading(false);
      }
    };

    loadSiteDetails();
  }, [materialId]);

  if (loading) return <div>Chargement des détails du site...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!siteDetails) return <div>Aucun site assigné</div>;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <div>
              <p className="text-sm text-gray-500">Chantier</p>
              <p className="font-bold">{siteDetails.siteName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <div>
              <p className="text-sm text-gray-500">Adresse</p>
              <p className="font-bold">{siteDetails.siteAddress}</p>
            </div>
          </div>

          {siteDetails.coordinates && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <div>
                <p className="text-sm text-gray-500">Coordonnées GPS</p>
                <p className="font-mono text-sm">
                  {siteDetails.coordinates.lat.toFixed(6)}°, 
                  {siteDetails.coordinates.lng.toFixed(6)}°
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm text-gray-500">Localisation</p>
              <p className="font-bold">{siteDetails.siteLocalisation}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <p className="font-bold capitalize">{siteDetails.status}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm text-gray-500">Progression</p>
              <p className="font-bold">{siteDetails.progress}%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Exemple 3: Intégration avec une carte

```typescript
import { useState, useEffect } from 'react';
import materialService from '../services/materialService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

export function SiteMapView({ materialId }) {
  const [siteDetails, setSiteDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSiteDetails = async () => {
      setLoading(true);
      try {
        const response = await materialService.getSiteDetailsWithGPS(materialId);
        if (response.success && response.data?.coordinates) {
          setSiteDetails(response.data);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSiteDetails();
  }, [materialId]);

  if (loading) return <div>Chargement de la carte...</div>;
  if (!siteDetails?.coordinates) return <div>Pas de coordonnées disponibles</div>;

  const { lat, lng } = siteDetails.coordinates;

  return (
    <MapContainer center={[lat, lng]} zoom={13} style={{ height: '400px' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <Marker position={[lat, lng]}>
        <Popup>
          <div>
            <h3>{siteDetails.siteName}</h3>
            <p>{siteDetails.siteAddress}</p>
            <p>{siteDetails.siteLocalisation}</p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
```

## 🧪 Tests

### Test 1: Vérifier que l'endpoint retourne les bonnes données

```bash
# Remplacer MATERIAL_ID par un ID réel
curl -X GET http://localhost:3000/api/materials/MATERIAL_ID/site-details \
  -H "Authorization: Bearer YOUR_TOKEN"

# Vérifier que la réponse contient:
# - success: true
# - data.siteId
# - data.siteName
# - data.coordinates (si disponible)
```

### Test 2: Vérifier le fallback quand pas de site assigné

```bash
# Utiliser un matériau sans siteId
curl -X GET http://localhost:3000/api/materials/MATERIAL_WITHOUT_SITE/site-details \
  -H "Authorization: Bearer YOUR_TOKEN"

# Vérifier que la réponse contient:
# - success: false
# - message: "Aucun site assigné à ce matériau"
# - data: null
```

### Test 3: Vérifier le fallback quand le service des sites est indisponible

```bash
# Arrêter le service des sites
# Puis appeler l'endpoint

curl -X GET http://localhost:3000/api/materials/MATERIAL_ID/site-details \
  -H "Authorization: Bearer YOUR_TOKEN"

# Vérifier que la réponse contient:
# - success: false
# - message: "Erreur lors de la récupération des détails du site"
# - error: message d'erreur détaillé
```

## 📊 Logs attendus

### Backend
```
📍 Récupération des détails du site pour le matériau 507f1f77bcf86cd799439011
✅ Détails du site récupérés: Chantier Nord
✅ Coordonnées GPS extraites: lat=48.856613, lng=2.352222
```

### Frontend (Console)
```
📍 Récupération des détails du site pour le matériau 507f1f77bcf86cd799439011
✅ Détails du site récupérés: {siteId: "...", siteName: "Chantier Nord", ...}
```

## 🚀 Performance

- **Temps de réponse**: ~100-200ms (dépend de la latence réseau)
- **Cache**: Les données sont mises en cache au niveau du composant
- **Optimisation**: Utilisation de `useEffect` pour éviter les appels inutiles

## 🔐 Sécurité

- ✅ Authentification requise (Bearer token)
- ✅ Validation des paramètres
- ✅ Gestion des erreurs robuste
- ✅ Pas d'exposition de données sensibles
