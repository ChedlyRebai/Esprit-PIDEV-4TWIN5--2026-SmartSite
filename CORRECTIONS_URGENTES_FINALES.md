# 🚨 CORRECTIONS URGENTES - Problèmes Détectés

Date: 2 Mai 2026  
Statut: **CORRECTIONS CRITIQUES NÉCESSAIRES**

---

## 🔴 PROBLÈMES CRITIQUES DÉTECTÉS

### 1. Erreur 500 lors de la mise à jour de matériau
```
api/materials/69f67eabacf133fe908613fd: Failed to load resource: 500 (Internal Server Error)
```

**Cause**: Le backend retourne une erreur 500 lors de l'update

**Données envoyées**:
```javascript
{
  category: "cement",
  code: "CIM-001",
  expiryDate: "2026-04-01",
  name: "Ciment Portland",
  needsReorder: true,
  quantity: 900,
  stockActuel: 900,
  stockEntree: 600,
  stockExistant: 1000,
  stockMinimum: 1000,
  stockSortie: 700,
  unit: "kg"
}
```

**Solution**: Le backend ne reconnaît pas les champs `stockActuel`, `stockEntree`, `stockExistant`, `stockSortie`

---

### 2. AnomalyAlert: anomalyResult is undefined
```
Materials.tsx:142 Uncaught TypeError: Cannot read properties of undefined (reading 'riskLevel')
```

**Cause**: Le composant AnomalyAlert reçoit `undefined` au lieu d'un objet anomalyResult

**Solution**: Vérifier que anomalyResult existe avant d'accéder à ses propriétés

---

### 3. GPS ne s'affiche pas
```
MaterialWeatherWidget.tsx:69 🏙️ Loading weather by city: Site assigné
```

**Cause**: Le site retourne "Site assigné" au lieu du vrai nom, et pas de coordonnées GPS

**Solution**: Vérifier que le backend retourne bien `siteCoordinates`

---

## 🔧 CORRECTIONS À APPLIQUER

### Correction 1: Backend - Méthode update()

**Fichier**: `apps/backend/materials-service/src/materials/materials.service.ts`

**Problème**: La méthode `update()` ne gère pas les nouveaux champs V2

**Solution**:
```typescript
async update(
  id: string,
  updateMaterialDto: UpdateMaterialDto,
  userId: string | null,
): Promise<any> {
  try {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de matériau invalide');
    }

    const material = await this.materialModel.findById(id).exec();
    if (!material) {
      throw new NotFoundException(`Matériau #${id} non trouvé`);
    }

    // ✅ Gérer les champs V2
    const updateData: any = { ...updateMaterialDto };
    
    // Mapper les champs V2 vers les champs standards
    if (updateData.stockActuel !== undefined) {
      updateData.quantity = updateData.stockActuel;
      delete updateData.stockActuel;
    }
    
    if (updateData.stockMinimum !== undefined) {
      updateData.minimumStock = updateData.stockMinimum;
      // Garder aussi stockMinimum pour compatibilité
    }

    // Supprimer les champs temporaires qui ne sont pas dans le schema
    delete updateData.stockEntree;
    delete updateData.stockSortie;
    delete updateData.stockExistant;

    Object.assign(material, updateData);
    const updated = await material.save();

    this.materialsGateway.emitMaterialUpdate('materialUpdated', updated);
    await this.cacheManager.del('materials_dashboard');

    // ✅ Retourner avec les infos de site
    return this.findOne(id);
  } catch (error) {
    this.logger.error(`❌ Erreur mise à jour: ${error.message}`);
    throw error;
  }
}
```

---

### Correction 2: Frontend - AnomalyAlert

**Fichier**: `apps/frontend/src/app/pages/materials/Materials.tsx`

**Problème**: Accès à `anomalyResult.riskLevel` sans vérifier si anomalyResult existe

**Solution**:
```typescript
const handleAnomalyAlert = (event: CustomEvent) => {
  const { materialId, materialName, anomalyResult } = event.detail;
  
  // ✅ Vérifier que anomalyResult existe
  if (!anomalyResult) {
    console.warn('⚠️ anomalyResult is undefined');
    return;
  }
  
  setAnomalyAlert({
    show: true,
    materialId,
    materialName,
    anomalyResult,
  });

  // Afficher un toast selon le niveau de risque
  if (anomalyResult.riskLevel === 'HIGH') {
    toast.error(`🚨 ${anomalyResult.message}`, {
      duration: 10000,
      description: anomalyResult.recommendedAction,
    });
  } else if (anomalyResult.riskLevel === 'MEDIUM') {
    toast.warning(`⚠️ ${anomalyResult.message}`, {
      duration: 8000,
      description: anomalyResult.recommendedAction,
    });
  }
};
```

---

### Correction 3: Frontend - AnomalyAlert Component

**Fichier**: `apps/frontend/src/app/components/materials/AnomalyAlert.tsx`

**Problème**: Le composant ne vérifie pas si anomalyResult existe

**Solution**:
```typescript
interface AnomalyAlertProps {
  show: boolean;
  materialId: string;
  materialName: string;
  anomalyResult: any;
  onClose: () => void;
}

export default function AnomalyAlert({ 
  show, 
  materialId, 
  materialName, 
  anomalyResult, 
  onClose 
}: AnomalyAlertProps) {
  // ✅ Vérifier que anomalyResult existe
  if (!show || !anomalyResult) {
    return null;
  }

  const getRiskColor = () => {
    switch (anomalyResult.riskLevel) {
      case 'HIGH':
        return 'bg-red-50 border-red-500';
      case 'MEDIUM':
        return 'bg-orange-50 border-orange-500';
      case 'LOW':
        return 'bg-yellow-50 border-yellow-500';
      default:
        return 'bg-gray-50 border-gray-500';
    }
  };

  // ... reste du composant
}
```

---

### Correction 4: Vérifier les logs backend

**Commande**:
```bash
cd apps/backend/materials-service
npm start
```

**Chercher dans les logs**:
```
✅ GPS récupéré pour Ciment Portland: Chantier Nord Paris (48.8566, 2.3522)
```

**Si vous voyez**:
```
⚠️ GPS manquant pour Ciment Portland: Site Chantier Nord Paris n'a pas de coordonnées
```
→ Le site n'a pas de coordonnées dans MongoDB

---

## 📊 SCRIPT DE DIAGNOSTIC COMPLET

**Fichier**: `diagnostic-erreurs.cjs`

```javascript
#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

console.log('\n' + '='.repeat(80));
console.log('🔍 DIAGNOSTIC COMPLET - Erreurs Materials Service');
console.log('='.repeat(80) + '\n');

async function runDiagnostic() {
  const results = {
    getMaterials: { success: false, hasGPS: false, error: null },
    getMaterialDetail: { success: false, hasGPS: false, error: null },
    updateMaterial: { success: false, error: null },
  };

  try {
    // Test 1: GET /api/materials
    console.log('📡 Test 1: GET /api/materials\n');
    try {
      const response = await axios.get(`${API_URL}/materials`);
      const materials = response.data.data || response.data;
      results.getMaterials.success = true;
      
      const withGPS = materials.filter(m => m.siteCoordinates);
      results.getMaterials.hasGPS = withGPS.length > 0;
      
      console.log(`   ✅ ${materials.length} matériaux récupérés`);
      console.log(`   📍 ${withGPS.length} avec GPS`);
      
      if (withGPS.length > 0) {
        const sample = withGPS[0];
        console.log(`\n   Exemple: ${sample.name}`);
        console.log(`   - siteName: ${sample.siteName}`);
        console.log(`   - siteAddress: ${sample.siteAddress || 'N/A'}`);
        console.log(`   - GPS: ${sample.siteCoordinates.lat}, ${sample.siteCoordinates.lng}`);
      } else {
        console.log(`\n   ⚠️  Aucun matériau avec GPS`);
        if (materials.length > 0) {
          const sample = materials[0];
          console.log(`   Exemple: ${sample.name}`);
          console.log(`   - siteName: ${sample.siteName || 'N/A'}`);
          console.log(`   - siteId: ${sample.siteId || 'N/A'}`);
          console.log(`   - siteCoordinates: ${sample.siteCoordinates || 'undefined'}`);
        }
      }
    } catch (error) {
      results.getMaterials.error = error.message;
      console.log(`   ❌ Erreur: ${error.message}`);
    }

    // Test 2: GET /api/materials/:id
    console.log('\n📡 Test 2: GET /api/materials/:id\n');
    try {
      const listResponse = await axios.get(`${API_URL}/materials`);
      const materials = listResponse.data.data || listResponse.data;
      
      if (materials.length > 0) {
        const materialId = materials[0]._id;
        const response = await axios.get(`${API_URL}/materials/${materialId}`);
        const material = response.data;
        results.getMaterialDetail.success = true;
        results.getMaterialDetail.hasGPS = !!material.siteCoordinates;
        
        console.log(`   ✅ Matériau: ${material.name}`);
        console.log(`   - siteName: ${material.siteName || 'N/A'}`);
        console.log(`   - siteAddress: ${material.siteAddress || 'N/A'}`);
        
        if (material.siteCoordinates) {
          console.log(`   - GPS: ✅ ${material.siteCoordinates.lat}, ${material.siteCoordinates.lng}`);
        } else {
          console.log(`   - GPS: ❌ Non disponible`);
          console.log(`   - siteId: ${material.siteId || 'N/A'}`);
        }
      }
    } catch (error) {
      results.getMaterialDetail.error = error.message;
      console.log(`   ❌ Erreur: ${error.message}`);
    }

    // Test 3: PUT /api/materials/:id (Test update)
    console.log('\n📡 Test 3: PUT /api/materials/:id (Test update)\n');
    try {
      const listResponse = await axios.get(`${API_URL}/materials`);
      const materials = listResponse.data.data || listResponse.data;
      
      if (materials.length > 0) {
        const material = materials[0];
        const materialId = material._id;
        
        // Test avec des données minimales
        const updateData = {
          name: material.name,
          code: material.code,
          category: material.category,
          unit: material.unit,
          quantity: material.quantity,
        };
        
        console.log(`   Test update pour: ${material.name}`);
        console.log(`   Données: ${JSON.stringify(updateData, null, 2)}`);
        
        const response = await axios.put(`${API_URL}/materials/${materialId}`, updateData);
        results.updateMaterial.success = true;
        
        console.log(`   ✅ Update réussi`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      }
    } catch (error) {
      results.updateMaterial.error = error.message;
      console.log(`   ❌ Erreur: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    // Résumé
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ DU DIAGNOSTIC');
    console.log('='.repeat(80) + '\n');

    console.log('Test                    | Succès | GPS  | Erreur');
    console.log('-'.repeat(60));
    console.log(`GET /api/materials      | ${results.getMaterials.success ? '✅' : '❌'}     | ${results.getMaterials.hasGPS ? '✅' : '❌'} | ${results.getMaterials.error || '-'}`);
    console.log(`GET /api/materials/:id  | ${results.getMaterialDetail.success ? '✅' : '❌'}     | ${results.getMaterialDetail.hasGPS ? '✅' : '❌'} | ${results.getMaterialDetail.error || '-'}`);
    console.log(`PUT /api/materials/:id  | ${results.updateMaterial.success ? '✅' : '❌'}     | -  | ${results.updateMaterial.error || '-'}`);

    console.log('\n' + '='.repeat(80));
    
    if (results.updateMaterial.error) {
      console.log('🔴 PROBLÈME CRITIQUE: Update échoue');
      console.log('   → Vérifier les logs du backend');
      console.log('   → Vérifier le schema Material');
      console.log('   → Vérifier la méthode update() dans materials.service.ts');
    }
    
    if (!results.getMaterials.hasGPS && !results.getMaterialDetail.hasGPS) {
      console.log('🔴 PROBLÈME CRITIQUE: GPS manquant partout');
      console.log('   → Vérifier MongoDB: db.sites.find({}, {nom:1, coordonnees:1})');
      console.log('   → Vérifier que les sites ont: coordonnees.latitude et coordonnees.longitude');
      console.log('   → Vérifier les logs backend pour "GPS récupéré"');
    }
    
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERREUR GLOBALE:', error.message);
  }
}

runDiagnostic();
```

---

## 🚀 ACTIONS IMMÉDIATES

### 1. Exécuter le diagnostic
```bash
node diagnostic-erreurs.cjs
```

### 2. Vérifier les logs backend
```bash
cd apps/backend/materials-service
npm start
# Chercher: "❌ Erreur mise à jour:"
```

### 3. Vérifier MongoDB
```bash
mongo smartsite
db.sites.find({}, { nom: 1, coordonnees: 1 }).pretty()
```

### 4. Appliquer les corrections
- Corriger la méthode `update()` dans materials.service.ts
- Corriger `handleAnomalyAlert` dans Materials.tsx
- Corriger le composant `AnomalyAlert`

---

## 📝 CHECKLIST

- [ ] ❌ Corriger erreur 500 lors de l'update
- [ ] ❌ Corriger AnomalyAlert undefined
- [ ] ❌ Vérifier que GPS est retourné par l'API
- [ ] ❌ Vérifier que GPS s'affiche dans le tableau
- [ ] ❌ Vérifier que GPS s'affiche dans MaterialDetails
- [ ] ❌ Vérifier que GPS s'affiche dans MaterialForm

---

**Développeur**: Kiro AI  
**Date**: 2 Mai 2026  
**Priorité**: 🔴 **CRITIQUE**
