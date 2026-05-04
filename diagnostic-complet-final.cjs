#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

console.log('\n' + '='.repeat(80));
console.log('🔍 DIAGNOSTIC COMPLET FINAL - Materials Service');
console.log('='.repeat(80) + '\n');

async function runDiagnostic() {
  const results = {
    getMaterials: { success: false, hasGPS: false, error: null, count: 0 },
    getMaterialDetail: { success: false, hasGPS: false, error: null },
    updateMaterial: { success: false, error: null },
    expiringMaterials: { success: false, hasGPS: false, error: null, count: 0 },
    barcodeSearch: { success: false, hasGPS: false, error: null },
  };

  try {
    // Test 1: GET /api/materials
    console.log('📡 Test 1: GET /api/materials\n');
    try {
      const response = await axios.get(`${API_URL}/materials`);
      const materials = response.data.data || response.data;
      results.getMaterials.success = true;
      results.getMaterials.count = materials.length;
      
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

    // Test 3: PUT /api/materials/:id (Test update avec champs V2)
    console.log('\n📡 Test 3: PUT /api/materials/:id (Test update V2)\n');
    try {
      const listResponse = await axios.get(`${API_URL}/materials`);
      const materials = listResponse.data.data || listResponse.data;
      
      if (materials.length > 0) {
        const material = materials[0];
        const materialId = material._id;
        
        // Test avec des données V2 (comme le formulaire frontend)
        const updateData = {
          name: material.name,
          code: material.code,
          category: material.category,
          unit: material.unit,
          quantity: material.quantity,
          stockActuel: material.quantity + 10, // Champ V2
          stockEntree: 10, // Champ V2
          stockSortie: 5, // Champ V2
          stockExistant: material.quantity, // Champ V2
          stockMinimum: material.minimumStock || 10, // Champ V2
        };
        
        console.log(`   Test update pour: ${material.name}`);
        console.log(`   Données V2: stockActuel=${updateData.stockActuel}, stockEntree=${updateData.stockEntree}, stockSortie=${updateData.stockSortie}`);
        
        const response = await axios.put(`${API_URL}/materials/${materialId}`, updateData);
        results.updateMaterial.success = true;
        
        console.log(`   ✅ Update réussi`);
        console.log(`   - Matériau: ${response.data.name}`);
        console.log(`   - Quantity: ${response.data.quantity}`);
        console.log(`   - GPS: ${response.data.siteCoordinates ? `${response.data.siteCoordinates.lat}, ${response.data.siteCoordinates.lng}` : 'N/A'}`);
      }
    } catch (error) {
      results.updateMaterial.error = error.message;
      console.log(`   ❌ Erreur: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    // Test 4: GET /api/materials/expiring
    console.log('\n📡 Test 4: GET /api/materials/expiring\n');
    try {
      const response = await axios.get(`${API_URL}/materials/expiring?days=30`);
      const expiringMaterials = response.data;
      results.expiringMaterials.success = true;
      results.expiringMaterials.count = expiringMaterials.length;
      
      const withGPS = expiringMaterials.filter(m => m.siteCoordinates);
      results.expiringMaterials.hasGPS = withGPS.length > 0;
      
      console.log(`   ✅ ${expiringMaterials.length} matériaux expirants`);
      console.log(`   📍 ${withGPS.length} avec GPS`);
      
      if (expiringMaterials.length > 0) {
        const sample = expiringMaterials[0];
        console.log(`\n   Exemple: ${sample.name}`);
        console.log(`   - Expiry: ${sample.expiryDate}`);
        console.log(`   - Site: ${sample.siteName || 'N/A'}`);
        console.log(`   - GPS: ${sample.siteCoordinates ? `${sample.siteCoordinates.lat}, ${sample.siteCoordinates.lng}` : 'N/A'}`);
      }
    } catch (error) {
      results.expiringMaterials.error = error.message;
      console.log(`   ❌ Erreur: ${error.message}`);
    }

    // Test 5: GET /api/materials/barcode/:barcode
    console.log('\n📡 Test 5: GET /api/materials/barcode/:barcode\n');
    try {
      const listResponse = await axios.get(`${API_URL}/materials`);
      const materials = listResponse.data.data || listResponse.data;
      
      if (materials.length > 0 && materials[0].barcode) {
        const barcode = materials[0].barcode;
        const response = await axios.get(`${API_URL}/materials/barcode/${barcode}`);
        const material = response.data;
        results.barcodeSearch.success = true;
        results.barcodeSearch.hasGPS = !!material.siteCoordinates;
        
        console.log(`   ✅ Matériau trouvé: ${material.name}`);
        console.log(`   - Barcode: ${material.barcode}`);
        console.log(`   - Site: ${material.siteName || 'N/A'}`);
        console.log(`   - GPS: ${material.siteCoordinates ? `${material.siteCoordinates.lat}, ${material.siteCoordinates.lng}` : 'N/A'}`);
      } else {
        console.log(`   ⚠️  Aucun matériau avec barcode`);
      }
    } catch (error) {
      results.barcodeSearch.error = error.message;
      console.log(`   ❌ Erreur: ${error.message}`);
    }

    // Résumé
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ DU DIAGNOSTIC');
    console.log('='.repeat(80) + '\n');

    console.log('Test                          | Succès | GPS  | Count | Erreur');
    console.log('-'.repeat(80));
    console.log(`GET /api/materials            | ${results.getMaterials.success ? '✅' : '❌'}     | ${results.getMaterials.hasGPS ? '✅' : '❌'}   | ${results.getMaterials.count}     | ${results.getMaterials.error || '-'}`);
    console.log(`GET /api/materials/:id        | ${results.getMaterialDetail.success ? '✅' : '❌'}     | ${results.getMaterialDetail.hasGPS ? '✅' : '❌'}   | -     | ${results.getMaterialDetail.error || '-'}`);
    console.log(`PUT /api/materials/:id (V2)   | ${results.updateMaterial.success ? '✅' : '❌'}     | -    | -     | ${results.updateMaterial.error || '-'}`);
    console.log(`GET /api/materials/expiring   | ${results.expiringMaterials.success ? '✅' : '❌'}     | ${results.expiringMaterials.hasGPS ? '✅' : '❌'}   | ${results.expiringMaterials.count}     | ${results.expiringMaterials.error || '-'}`);
    console.log(`GET /api/materials/barcode    | ${results.barcodeSearch.success ? '✅' : '❌'}     | ${results.barcodeSearch.hasGPS ? '✅' : '❌'}   | -     | ${results.barcodeSearch.error || '-'}`);

    console.log('\n' + '='.repeat(80));
    
    // Analyse des problèmes
    const problems = [];
    
    if (results.updateMaterial.error) {
      problems.push('🔴 PROBLÈME CRITIQUE: Update échoue avec champs V2');
      problems.push('   → Vérifier la méthode update() dans materials.service.ts');
      problems.push('   → Vérifier que les champs V2 sont correctement mappés');
    }
    
    if (!results.getMaterials.hasGPS && !results.getMaterialDetail.hasGPS) {
      problems.push('🔴 PROBLÈME CRITIQUE: GPS manquant partout');
      problems.push('   → Vérifier MongoDB: db.sites.find({}, {nom:1, coordonnees:1})');
      problems.push('   → Vérifier que les sites ont: coordonnees.latitude et coordonnees.longitude');
      problems.push('   → Vérifier les logs backend pour "GPS récupéré"');
    }
    
    if (!results.expiringMaterials.hasGPS && results.expiringMaterials.count > 0) {
      problems.push('⚠️  ATTENTION: GPS manquant pour matériaux expirants');
      problems.push('   → Vérifier getExpiringMaterials() dans materials.service.ts');
    }
    
    if (!results.barcodeSearch.hasGPS && results.barcodeSearch.success) {
      problems.push('⚠️  ATTENTION: GPS manquant pour recherche barcode');
      problems.push('   → Vérifier findByBarcode() dans materials.service.ts');
    }
    
    if (problems.length > 0) {
      console.log('\n🚨 PROBLÈMES DÉTECTÉS:\n');
      problems.forEach(p => console.log(p));
    } else {
      console.log('\n✅ TOUS LES TESTS SONT PASSÉS!');
      console.log('   - Update avec champs V2: OK');
      console.log('   - GPS affiché partout: OK');
      console.log('   - Matériaux expirants: OK');
      console.log('   - Recherche barcode: OK');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERREUR GLOBALE:', error.message);
  }
}

runDiagnostic();
