# 🗺️ CORRECTIONS FINALES - AFFICHAGE GPS PARTOUT

Date: 2 Mai 2026  
Statut: **EN COURS - CORRECTIONS COMPLÈTES**

---

## 🎯 OBJECTIF

Afficher les informations complètes du site (nom, localisation/adresse, coordonnées GPS) dans **TOUS** les contextes:

1. ✅ **Liste des matériaux** - Afficher nom, adresse et GPS du site
2. ✅ **Ajout de matériau** - Afficher GPS du site sélectionné
3. ✅ **Modification de matériau** - Afficher GPS du site actuel et nouveau
4. ✅ **Détails de matériau** - Afficher GPS du site assigné
5. ✅ **Matériaux expirants** - Afficher GPS du site
6. ✅ **Recherche par code-barres/QR** - Afficher GPS du site

---

## 📊 VÉRIFICATION ACTUELLE

### Backend - Méthodes qui retournent les infos de site

✅ **Déjà corrigées**:
- `findAll()` - Retourne siteName, siteAddress, siteCoordinates
- `findOne()` - Retourne siteName, siteAddress, siteCoordinates
- `findByCode()` - Retourne siteName, siteAddress, siteCoordinates
- `findByBarcode()` - Retourne siteName, siteAddress, siteCoordinates
- `findByQRCode()` - Retourne siteName, siteAddress, siteCoordinates
- `getMaterialsWithSiteInfo()` - Retourne siteName, siteAddress, siteCoordinates
- `getExpiringMaterials()` - Retourne siteName, siteAddress, siteCoordinates

### Frontend - Composants qui affichent les infos de site

✅ **Déjà corrigés**:
- `MaterialDetails.tsx` - Affiche nom, adresse, GPS
- `MaterialForm.tsx` - Affiche GPS du site sélectionné
- `ExpiringMaterials.tsx` - Affiche nom, adresse, GPS

❌ **À corriger**:
- `Materials.tsx` (liste principale) - N'affiche pas GPS dans le tableau

---

## 🔧 CORRECTIONS À APPLIQUER

### 1. Liste des Matériaux (Materials.tsx)

**Fichier**: `apps/frontend/src/app/pages/materials/Materials.tsx`

**Problème**: Le tableau n'affiche que le nom du site, pas l'adresse ni les GPS

**Solution**: Ajouter une colonne "Site / Localisation" avec:
- Nom du site
- Adresse
- Coordonnées GPS

**Code à ajouter**:
```tsx
// Dans la définition des colonnes du tableau
{
  field: 'site',
  headerName: 'Site / Localisation',
  width: 250,
  renderCell: (params: any) => {
    const material = params.row;
    return (
      <div className="py-2">
        <p className="font-semibold text-sm">{material.siteName || 'Non assigné'}</p>
        {material.siteAddress && (
          <p className="text-xs text-gray-500">{material.siteAddress}</p>
        )}
        {material.siteCoordinates && (
          <p className="text-xs text-blue-600 font-mono">
            📍 {material.siteCoordinates.lat.toFixed(5)}, {material.siteCoordinates.lng.toFixed(5)}
          </p>
        )}
      </div>
    );
  },
}
```

---

### 2. Vérification Backend - Logs de Diagnostic

**Fichier**: `apps/backend/materials-service/src/materials/materials.service.ts`

**Ajout de logs pour vérifier que les GPS sont bien récupérés**:

```typescript
// Dans findAll()
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
      
      // ✅ LOG DE DIAGNOSTIC
      if (siteInfo.siteCoordinates) {
        this.logger.log(`✅ GPS récupéré pour ${material.name}: ${site.nom} (${siteInfo.siteCoordinates.lat}, ${siteInfo.siteCoordinates.lng})`);
      } else {
        this.logger.warn(`⚠️ GPS manquant pour ${material.name}: Site ${site.nom} n'a pas de coordonnées`);
      }
    }
  } catch (e) {
    this.logger.warn(`⚠️ Could not fetch site ${siteIdStr}:`, e.message);
  }
}
```

---

## 🧪 SCRIPT DE TEST COMPLET

**Fichier**: `test-gps-complet.cjs`

```javascript
#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

console.log('\n' + '='.repeat(80));
console.log('🔍 TEST COMPLET - Affichage GPS dans tous les contextes');
console.log('='.repeat(80) + '\n');

async function testAllEndpoints() {
  const results = {
    findAll: { tested: false, hasGPS: false, count: 0 },
    findOne: { tested: false, hasGPS: false },
    findByCode: { tested: false, hasGPS: false },
    findByBarcode: { tested: false, hasGPS: false },
    expiringMaterials: { tested: false, hasGPS: false, count: 0 },
  };

  try {
    // Test 1: GET /api/materials (findAll)
    console.log('📡 Test 1: GET /api/materials (Liste des matériaux)\n');
    try {
      const response = await axios.get(`${API_URL}/materials`);
      const materials = response.data.data || response.data;
      results.findAll.tested = true;
      results.findAll.count = materials.length;
      
      const materialsWithGPS = materials.filter(m => m.siteCoordinates);
      results.findAll.hasGPS = materialsWithGPS.length > 0;
      
      console.log(`   ✅ ${materials.length} matériaux récupérés`);
      console.log(`   📍 ${materialsWithGPS.length} matériaux avec GPS`);
      
      if (materialsWithGPS.length > 0) {
        const sample = materialsWithGPS[0];
        console.log(`   Exemple: ${sample.name}`);
        console.log(`   - Site: ${sample.siteName}`);
        console.log(`   - Adresse: ${sample.siteAddress || 'N/A'}`);
        console.log(`   - GPS: ${sample.siteCoordinates.lat}, ${sample.siteCoordinates.lng}`);
      } else {
        console.log(`   ⚠️  Aucun matériau avec GPS trouvé`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }

    // Test 2: GET /api/materials/:id (findOne)
    console.log('\n📡 Test 2: GET /api/materials/:id (Détails d\'un matériau)\n');
    try {
      const listResponse = await axios.get(`${API_URL}/materials`);
      const materials = listResponse.data.data || listResponse.data;
      
      if (materials.length > 0) {
        const materialId = materials[0]._id;
        const response = await axios.get(`${API_URL}/materials/${materialId}`);
        const material = response.data;
        results.findOne.tested = true;
        results.findOne.hasGPS = !!material.siteCoordinates;
        
        console.log(`   ✅ Matériau récupéré: ${material.name}`);
        console.log(`   - Site: ${material.siteName || 'Non assigné'}`);
        console.log(`   - Adresse: ${material.siteAddress || 'N/A'}`);
        
        if (material.siteCoordinates) {
          console.log(`   - GPS: ✅ ${material.siteCoordinates.lat}, ${material.siteCoordinates.lng}`);
        } else {
          console.log(`   - GPS: ❌ Non disponible`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }

    // Test 3: GET /api/materials/expiring (Matériaux expirants)
    console.log('\n📡 Test 3: GET /api/materials/expiring (Matériaux expirants)\n');
    try {
      const response = await axios.get(`${API_URL}/materials/expiring?days=30`);
      const materials = response.data;
      results.expiringMaterials.tested = true;
      results.expiringMaterials.count = materials.length;
      
      const materialsWithGPS = materials.filter(m => m.siteCoordinates);
      results.expiringMaterials.hasGPS = materialsWithGPS.length > 0;
      
      console.log(`   ✅ ${materials.length} matériaux expirants récupérés`);
      console.log(`   📍 ${materialsWithGPS.length} matériaux avec GPS`);
      
      if (materialsWithGPS.length > 0) {
        const sample = materialsWithGPS[0];
        console.log(`   Exemple: ${sample.name}`);
        console.log(`   - Site: ${sample.siteName}`);
        console.log(`   - GPS: ${sample.siteCoordinates.lat}, ${sample.siteCoordinates.lng}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }

    // Résumé
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(80) + '\n');

    console.log('Endpoint                    | Testé | GPS Disponible');
    console.log('-'.repeat(60));
    console.log(`GET /api/materials          | ${results.findAll.tested ? '✅' : '❌'}    | ${results.findAll.hasGPS ? '✅' : '❌'} (${results.findAll.count} matériaux)`);
    console.log(`GET /api/materials/:id      | ${results.findOne.tested ? '✅' : '❌'}    | ${results.findOne.hasGPS ? '✅' : '❌'}`);
    console.log(`GET /api/materials/expiring | ${results.expiringMaterials.tested ? '✅' : '❌'}    | ${results.expiringMaterials.hasGPS ? '✅' : '❌'} (${results.expiringMaterials.count} matériaux)`);

    const allTested = Object.values(results).every(r => r.tested);
    const allHaveGPS = Object.values(results).every(r => r.hasGPS);

    console.log('\n' + '='.repeat(80));
    if (allTested && allHaveGPS) {
      console.log('✅ TOUS LES TESTS PASSÉS - GPS DISPONIBLE PARTOUT');
    } else if (allTested && !allHaveGPS) {
      console.log('⚠️  TESTS PASSÉS MAIS GPS MANQUANT');
      console.log('\nActions recommandées:');
      console.log('1. Vérifier que les sites ont des coordonnées dans MongoDB');
      console.log('2. Vérifier les logs du backend pour voir les erreurs');
      console.log('3. Exécuter: db.sites.find({}, { nom: 1, coordonnees: 1 })');
    } else {
      console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ');
      console.log('\nVérifiez que le materials-service est démarré sur le port 3002');
    }
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERREUR GLOBALE:', error.message);
  }
}

testAllEndpoints();
```

---

## 📝 CHECKLIST DE VÉRIFICATION

### Backend
- [x] ✅ `findAll()` retourne siteCoordinates
- [x] ✅ `findOne()` retourne siteCoordinates
- [x] ✅ `findByCode()` retourne siteCoordinates
- [x] ✅ `findByBarcode()` retourne siteCoordinates
- [x] ✅ `findByQRCode()` retourne siteCoordinates
- [x] ✅ `getExpiringMaterials()` retourne siteCoordinates
- [x] ✅ `getMaterialsWithSiteInfo()` retourne siteCoordinates

### Frontend - Affichage GPS
- [x] ✅ `MaterialDetails.tsx` - Affiche GPS
- [x] ✅ `MaterialForm.tsx` - Affiche GPS du site sélectionné
- [x] ✅ `ExpiringMaterials.tsx` - Affiche GPS
- [ ] ❌ `Materials.tsx` - Liste principale (À CORRIGER)

### Logs Backend
- [ ] ❌ Ajouter logs de diagnostic pour GPS

---

## 🚀 COMMANDES DE TEST

### 1. Compiler le backend
```bash
cd apps/backend/materials-service
npm run build
```

### 2. Démarrer le backend
```bash
cd apps/backend/materials-service
npm start
# Chercher dans les logs: "✅ GPS récupéré pour..."
```

### 3. Exécuter le test complet
```bash
node test-gps-complet.cjs
```

### 4. Tester le frontend
```bash
# Ouvrir http://localhost:5173/materials
# Vérifier que chaque matériau affiche:
# - Nom du site
# - Adresse
# - 📍 GPS: lat, lng
```

---

## 🔍 DIAGNOSTIC SI GPS MANQUANT

### Étape 1: Vérifier MongoDB
```bash
# Se connecter à MongoDB
mongo smartsite

# Vérifier les sites
db.sites.find({}, { nom: 1, adresse: 1, coordonnees: 1 }).pretty()

# Vérifier qu'un site a des coordonnées
db.sites.findOne({ nom: "Chantier Nord Paris" })

# Résultat attendu:
{
  "_id": ObjectId("..."),
  "nom": "Chantier Nord Paris",
  "adresse": "123 Rue de la Paix",
  "coordonnees": {
    "latitude": 48.8566,
    "longitude": 2.3522
  }
}
```

### Étape 2: Vérifier les logs backend
```bash
cd apps/backend/materials-service
npm start

# Chercher:
# "✅ GPS récupéré pour..." - GPS trouvé
# "⚠️ GPS manquant pour..." - Site sans coordonnées
# "⚠️ Could not fetch site..." - Erreur de récupération
```

### Étape 3: Tester l'API directement
```bash
# Test 1: Liste des matériaux
curl http://localhost:3002/api/materials | jq '.[0] | {name, siteName, siteCoordinates}'

# Test 2: Détails d'un matériau
curl http://localhost:3002/api/materials/{materialId} | jq '{name, siteName, siteCoordinates}'

# Test 3: Matériaux expirants
curl http://localhost:3002/api/materials/expiring | jq '.[0] | {name, siteName, siteCoordinates}'
```

---

## 📊 FORMAT DES DONNÉES ATTENDU

### Réponse API avec GPS
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

### Affichage Frontend Attendu
```
┌─────────────────────────────────────────────────────────────┐
│ Ciment Portland (CIM001)                                    │
│                                                             │
│ Site / Localisation:                                        │
│ Chantier Nord Paris                                         │
│ 123 Rue de la Paix, 75001 Paris                           │
│ 📍 GPS: 48.85660, 2.35220                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Créer le script de test complet (`test-gps-complet.cjs`)
2. ✅ Exécuter le script pour identifier les problèmes
3. ❌ Corriger `Materials.tsx` pour afficher GPS dans le tableau
4. ❌ Ajouter logs de diagnostic dans le backend
5. ❌ Vérifier que tous les sites ont des coordonnées dans MongoDB

---

**Développeur**: Kiro AI  
**Date**: 2 Mai 2026  
**Statut**: 🔄 **EN COURS - DIAGNOSTIC CRÉÉ**
