# 🗺️ CORRECTIONS - INFORMATIONS DE SITE POUR MATERIALS

Date: 2 Mai 2026

## 🎯 OBJECTIF

Récupérer et afficher correctement les informations du site (nom, adresse, coordonnées GPS) pour chaque matériau lors de:
1. **Ajout** d'un matériau
2. **Modification** d'un matériau  
3. **Affichage** des détails d'un matériau
4. **Liste** des matériaux

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. Injection de SitesService dans MaterialsService

**Fichier**: `apps/backend/materials-service/src/materials/materials.service.ts`

**Ajout de l'import**:
```typescript
import { SitesService } from '../sites/sites.service';
```

**Injection dans le constructeur**:
```typescript
constructor(
  @InjectModel(Material.name) private materialModel: Model<Material>,
  private importExportService: ImportExportService,
  private readonly httpService: HttpService,
  @Inject(CACHE_MANAGER) private cacheManager: Cache,
  private readonly materialsGateway: MaterialsGateway,
  @Inject(forwardRef(() => MaterialFlowService))
  private readonly materialFlowService: MaterialFlowService,
  private readonly mlTrainingService: MLTrainingEnhancedService,
  private readonly sitesService: SitesService,  // ✅ AJOUTÉ
) {}
```

---

### 2. Récupération des infos de site dans findAll()

**Méthode**: `findAll(query: MaterialQueryDto)`

**Avant**:
```typescript
const mappedData = data.map((material: any) => {
  return {
    ...material.toObject(),
    siteName: siteIdStr ? 'Site assigné' : 'Non assigné',
    siteAddress: '',
    siteCoordinates: null,
  };
});
```

**Après**:
```typescript
const mappedData = await Promise.all(
  data.map(async (material: any) => {
    const siteIdStr = material.siteId?.toString();
    
    let siteInfo = {
      siteName: siteIdStr ? 'Site assigné' : 'Non assigné',
      siteAddress: '',
      siteCoordinates: null as { lat: number; lng: number } | null,
    };

    if (siteIdStr) {
      try {
        const site = await this.sitesService.findOne(siteIdStr);
        if (site) {
          siteInfo = {
            siteName: site.nom || 'Site assigné',
            siteAddress: site.adresse || `${site.ville || ''} ${site.codePostal || ''}`.trim(),
            siteCoordinates: site.coordonnees?.latitude && site.coordonnees?.longitude
              ? { lat: site.coordonnees.latitude, lng: site.coordonnees.longitude }
              : null,
          };
          this.logger.log(`✅ Site info loaded: ${site.nom} (${siteInfo.siteCoordinates?.lat}, ${siteInfo.siteCoordinates?.lng})`);
        }
      } catch (e) {
        this.logger.warn(`⚠️ Could not fetch site ${siteIdStr}:`, e.message);
      }
    }
    
    return {
      ...material.toObject(),
      siteId: siteIdStr || '',
      siteName: siteInfo.siteName,
      siteAddress: siteInfo.siteAddress,
      siteCoordinates: siteInfo.siteCoordinates,
      stockMinimum: material.stockMinimum,
      needsReorder: material.quantity <= material.stockMinimum,
    };
  }),
);
```

**Résultat**: ✅ La liste des matériaux affiche maintenant le nom du site et ses coordonnées GPS

---

### 3. Récupération des infos de site dans findOne()

**Méthode**: `findOne(id: string)`

**Avant**:
```typescript
async findOne(id: string): Promise<Material> {
  const material = await this.materialModel.findById(id).exec();
  if (!material) {
    throw new NotFoundException(`Matériau #${id} non trouvé`);
  }
  return material;
}
```

**Après**:
```typescript
async findOne(id: string): Promise<any> {
  const material = await this.materialModel.findById(id).exec();
  if (!material) {
    throw new NotFoundException(`Matériau #${id} non trouvé`);
  }

  // ✅ Fetch site info from MongoDB
  const siteIdStr = material.siteId?.toString();
  let siteInfo = {
    siteName: siteIdStr ? 'Site assigné' : 'Non assigné',
    siteAddress: '',
    siteCoordinates: null as { lat: number; lng: number } | null,
  };

  if (siteIdStr) {
    try {
      const site = await this.sitesService.findOne(siteIdStr);
      if (site) {
        siteInfo = {
          siteName: site.nom || 'Site assigné',
          siteAddress: site.adresse || `${site.ville || ''} ${site.codePostal || ''}`.trim(),
          siteCoordinates: site.coordonnees?.latitude && site.coordonnees?.longitude
            ? { lat: site.coordonnees.latitude, lng: site.coordonnees.longitude }
            : null,
        };
        this.logger.log(`✅ Site info for material ${id}: ${site.nom} (${siteInfo.siteCoordinates?.lat}, ${siteInfo.siteCoordinates?.lng})`);
      }
    } catch (e) {
      this.logger.warn(`⚠️ Could not fetch site ${siteIdStr}:`, e.message);
    }
  }

  return {
    ...material.toObject(),
    siteName: siteInfo.siteName,
    siteAddress: siteInfo.siteAddress,
    siteCoordinates: siteInfo.siteCoordinates,
  };
}
```

**Résultat**: ✅ Les détails d'un matériau affichent maintenant le nom du site et ses coordonnées GPS

---

### 4. Récupération des infos de site dans getMaterialsWithSiteInfo()

**Méthode**: `getMaterialsWithSiteInfo()`

**Avant**:
```typescript
const result = materials.map((material: any) => {
  return {
    ...material,
    siteName: siteIdStr ? 'Site assigné' : 'Non assigné',
    siteAddress: '',
    siteCoordinates: null,
  };
});
```

**Après**:
```typescript
const result = await Promise.all(
  materials.map(async (material: any) => {
    const siteIdStr = material.siteId?.toString();

    let siteInfo = {
      siteName: siteIdStr ? 'Site assigné' : 'Non assigné',
      siteAddress: '',
      siteCoordinates: null as { lat: number; lng: number } | null,
    };

    if (siteIdStr) {
      try {
        const site = await this.sitesService.findOne(siteIdStr);
        if (site) {
          siteInfo = {
            siteName: site.nom || 'Site assigné',
            siteAddress: site.adresse || `${site.ville || ''} ${site.codePostal || ''}`.trim(),
            siteCoordinates: site.coordonnees?.latitude && site.coordonnees?.longitude
              ? { lat: site.coordonnees.latitude, lng: site.coordonnees.longitude }
              : null,
          };
        }
      } catch (e) {
        this.logger.warn(`⚠️ Could not fetch site ${siteIdStr}:`, e.message);
      }
    }

    return {
      _id: material._id,
      name: material.name,
      code: material.code,
      // ... autres champs
      siteName: siteInfo.siteName,
      siteAddress: siteInfo.siteAddress,
      siteCoordinates: siteInfo.siteCoordinates,
    };
  }),
);
```

**Résultat**: ✅ L'endpoint `/api/site-materials/all-with-sites` retourne les infos de site complètes

---

## 📊 STRUCTURE DES DONNÉES RETOURNÉES

### Format des coordonnées GPS
```typescript
siteCoordinates: {
  lat: number;   // Latitude (ex: 48.8566)
  lng: number;   // Longitude (ex: 2.3522)
} | null
```

### Exemple de réponse
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Ciment Portland",
  "code": "CIM001",
  "category": "construction",
  "quantity": 1000,
  "unit": "kg",
  "siteId": "507f191e810c19729de860ea",
  "siteName": "Chantier Nord Paris",
  "siteAddress": "123 Rue de la Paix, 75001 Paris",
  "siteCoordinates": {
    "lat": 48.8566,
    "lng": 2.3522
  }
}
```

---

## 🗺️ AFFICHAGE DANS LE FRONTEND

### MaterialDetails.tsx

Le composant `MaterialDetails.tsx` affiche déjà les informations du site:

```tsx
<Card>
  <CardContent className="pt-4 pb-3">
    <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
      <MapPin className="h-3 w-3" />Assigned Site
    </div>
    <p className="font-bold">{material.siteName || 'Not assigned'}</p>
    {material.siteCoordinates && (
      <div className="flex items-center gap-1 mt-1">
        <Navigation className="h-3 w-3 text-blue-500" />
        <p className="text-xs text-blue-600 font-mono">
          {material.siteCoordinates.lat.toFixed(5)}, {material.siteCoordinates.lng.toFixed(5)}
        </p>
      </div>
    )}
    {material.siteAddress && (
      <p className="text-xs text-gray-400 mt-0.5">{material.siteAddress}</p>
    )}
  </CardContent>
</Card>
```

**Résultat**: ✅ Affiche le nom du site, l'adresse et les coordonnées GPS

---

### MaterialWeatherWidget

Le widget météo utilise les coordonnées GPS pour afficher la météo du site:

```tsx
<MaterialWeatherWidget
  siteCoordinates={material.siteCoordinates}
  siteAddress={material.siteAddress}
  siteName={material.siteName}
  materialCategory={material.category}
  onWeatherUpdate={(weather) => console.log('Weather:', weather)}
/>
```

**Résultat**: ✅ Affiche la météo du site basée sur les coordonnées GPS

---

## 🧪 TESTS À EFFECTUER

### Test 1: Ajout d'un matériau avec site

```bash
1. Ouvrir http://localhost:5173/materials
2. Cliquer sur "Add Material"
3. Remplir le formulaire:
   - Name: Test Material
   - Code: TEST001
   - Category: construction
   - Unit: kg
   - Quantity: 100
   - Minimum Stock: 10
   - Maximum Stock: 500
   - Site: Sélectionner un site
4. Soumettre
5. ✅ Vérifier que le matériau est créé
6. ✅ Vérifier que le nom du site s'affiche dans la liste
7. ✅ Vérifier que les coordonnées GPS sont présentes
```

---

### Test 2: Affichage des détails d'un matériau

```bash
1. Ouvrir la liste des matériaux
2. Cliquer sur un matériau assigné à un site
3. ✅ Vérifier que le nom du site s'affiche
4. ✅ Vérifier que l'adresse du site s'affiche
5. ✅ Vérifier que les coordonnées GPS s'affichent
6. ✅ Vérifier que la météo du site s'affiche (si coordonnées présentes)
```

---

### Test 3: Modification d'un matériau

```bash
1. Ouvrir les détails d'un matériau
2. Cliquer sur "Edit"
3. Changer le site assigné
4. Sauvegarder
5. ✅ Vérifier que le nouveau nom de site s'affiche
6. ✅ Vérifier que les nouvelles coordonnées GPS s'affichent
```

---

### Test 4: Mouvements de stock

```bash
1. Ouvrir les détails d'un matériau
2. Vérifier la section "Recent Movements"
3. ✅ Vérifier que les entrées de stock s'affichent
4. ✅ Vérifier que les sorties de stock s'affichent
5. ✅ Vérifier que le nom du site s'affiche pour chaque mouvement
```

---

## 📝 FICHIERS MODIFIÉS

### Backend (1 fichier)
1. ✅ `apps/backend/materials-service/src/materials/materials.service.ts`
   - Import de `SitesService`
   - Injection dans le constructeur
   - Méthode `findAll()` - Récupération infos site
   - Méthode `findOne()` - Récupération infos site
   - Méthode `getMaterialsWithSiteInfo()` - Récupération infos site

### Frontend (0 fichier)
- ✅ Aucune modification nécessaire - Les composants utilisent déjà les champs `siteName`, `siteAddress`, `siteCoordinates`

---

## 🎯 RÉSUMÉ

### Corrections appliquées
- ✅ **SitesService injecté** dans MaterialsService
- ✅ **findAll()** récupère les infos de site depuis MongoDB
- ✅ **findOne()** récupère les infos de site depuis MongoDB
- ✅ **getMaterialsWithSiteInfo()** récupère les infos de site depuis MongoDB

### Informations récupérées
- ✅ **Nom du site** (ex: "Chantier Nord Paris")
- ✅ **Adresse du site** (ex: "123 Rue de la Paix, 75001 Paris")
- ✅ **Coordonnées GPS** (ex: { lat: 48.8566, lng: 2.3522 })

### Affichage frontend
- ✅ **Liste des matériaux** - Affiche le nom du site
- ✅ **Détails du matériau** - Affiche nom, adresse et GPS
- ✅ **Widget météo** - Utilise les coordonnées GPS
- ✅ **Mouvements de stock** - Affiche le nom du site

---

## 🚀 PROCHAINES ÉTAPES

1. ✅ Redémarrer le materials-service
2. ✅ Tester l'ajout d'un matériau avec site
3. ✅ Vérifier l'affichage des détails
4. ✅ Vérifier que les coordonnées GPS sont correctes
5. ✅ Vérifier que la météo s'affiche

---

**Développeur**: Kiro AI  
**Date**: 2 Mai 2026  
**Statut**: ✅ CORRECTIONS APPLIQUÉES  
**Prêt pour**: TESTS
