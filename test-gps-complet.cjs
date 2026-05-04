#!/usr/bin/env node

/**
 * TEST COMPLET - Affichage GPS dans tous les contextes
 * 
 * Ce script teste tous les endpoints pour vérifier que les coordonnées GPS
 * sont correctement retournées et affichées
 */

const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

console.log('\n' + '='.repeat(80));
console.log('🔍 TEST COMPLET - Affichage GPS dans tous les contextes');
console.log('='.repeat(80) + '\n');

async function testAllEndpoints() {
  const results = {
    findAll: { tested: false, hasGPS: false, count: 0, withGPS: 0 },
    findOne: { tested: false, hasGPS: false },
    findByCode: { tested: false, hasGPS: false },
    findByBarcode: { tested: false, hasGPS: false },
    expiringMaterials: { tested: false, hasGPS: false, count: 0, withGPS: 0 },
    withSites: { tested: false, hasGPS: false, count: 0, withGPS: 0 },
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
      results.findAll.withGPS = materialsWithGPS.length;
      results.findAll.hasGPS = materialsWithGPS.length > 0;
      
      console.log(`   ✅ ${materials.length} matériaux récupérés`);
      console.log(`   📍 ${materialsWithGPS.length} matériaux avec GPS`);
      
      if (materialsWithGPS.length > 0) {
        const sample = materialsWithGPS[0];
        console.log(`\n   Exemple: ${sample.name} (${sample.code})`);
        console.log(`   - Site: ${sample.siteName}`);
        console.log(`   - Adresse: ${sample.siteAddress || 'N/A'}`);
        console.log(`   - GPS: ✅ ${sample.siteCoordinates.lat}, ${sample.siteCoordinates.lng}`);
      } else if (materials.length > 0) {
        console.log(`\n   ⚠️  Aucun matériau avec GPS trouvé`);
        const sample = materials[0];
        console.log(`   Exemple: ${sample.name} (${sample.code})`);
        console.log(`   - Site: ${sample.siteName || 'Non assigné'}`);
        console.log(`   - siteId: ${sample.siteId || 'N/A'}`);
        console.log(`   - GPS: ❌ Non disponible`);
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
        
        console.log(`   ✅ Matériau récupéré: ${material.name} (${material.code})`);
        console.log(`   - Site: ${material.siteName || 'Non assigné'}`);
        console.log(`   - Adresse: ${material.siteAddress || 'N/A'}`);
        
        if (material.siteCoordinates) {
          console.log(`   - GPS: ✅ ${material.siteCoordinates.lat}, ${material.siteCoordinates.lng}`);
        } else {
          console.log(`   - GPS: ❌ Non disponible`);
          if (material.siteId) {
            console.log(`   - siteId présent: ${material.siteId}`);
            console.log(`   ⚠️  Le matériau a un site mais pas de GPS`);
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }

    // Test 3: GET /api/materials/with-sites
    console.log('\n📡 Test 3: GET /api/materials/with-sites (Matériaux avec sites)\n');
    try {
      const response = await axios.get(`${API_URL}/materials/with-sites`);
      const materials = response.data;
      results.withSites.tested = true;
      results.withSites.count = materials.length;
      
      const materialsWithGPS = materials.filter(m => m.siteCoordinates);
      results.withSites.withGPS = materialsWithGPS.length;
      results.withSites.hasGPS = materialsWithGPS.length > 0;
      
      console.log(`   ✅ ${materials.length} matériaux récupérés`);
      console.log(`   📍 ${materialsWithGPS.length} matériaux avec GPS`);
      
      if (materialsWithGPS.length > 0) {
        const sample = materialsWithGPS[0];
        console.log(`\n   Exemple: ${sample.name}`);
        console.log(`   - Site: ${sample.siteName}`);
        console.log(`   - GPS: ✅ ${sample.siteCoordinates.lat}, ${sample.siteCoordinates.lng}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }

    // Test 4: GET /api/materials/expiring (Matériaux expirants)
    console.log('\n📡 Test 4: GET /api/materials/expiring (Matériaux expirants)\n');
    try {
      const response = await axios.get(`${API_URL}/materials/expiring?days=30`);
      const materials = response.data;
      results.expiringMaterials.tested = true;
      results.expiringMaterials.count = materials.length;
      
      const materialsWithGPS = materials.filter(m => m.siteCoordinates);
      results.expiringMaterials.withGPS = materialsWithGPS.length;
      results.expiringMaterials.hasGPS = materialsWithGPS.length > 0;
      
      console.log(`   ✅ ${materials.length} matériaux expirants récupérés`);
      console.log(`   📍 ${materialsWithGPS.length} matériaux avec GPS`);
      
      if (materialsWithGPS.length > 0) {
        const sample = materialsWithGPS[0];
        console.log(`\n   Exemple: ${sample.name}`);
        console.log(`   - Site: ${sample.siteName}`);
        console.log(`   - GPS: ✅ ${sample.siteCoordinates.lat}, ${sample.siteCoordinates.lng}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }

    // Résumé
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(80) + '\n');

    console.log('Endpoint                         | Testé | GPS Disponible | Détails');
    console.log('-'.repeat(80));
    console.log(`GET /api/materials               | ${results.findAll.tested ? '✅' : '❌'}    | ${results.findAll.hasGPS ? '✅' : '❌'}             | ${results.findAll.withGPS}/${results.findAll.count} avec GPS`);
    console.log(`GET /api/materials/:id           | ${results.findOne.tested ? '✅' : '❌'}    | ${results.findOne.hasGPS ? '✅' : '❌'}             | Détails`);
    console.log(`GET /api/materials/with-sites    | ${results.withSites.tested ? '✅' : '❌'}    | ${results.withSites.hasGPS ? '✅' : '❌'}             | ${results.withSites.withGPS}/${results.withSites.count} avec GPS`);
    console.log(`GET /api/materials/expiring      | ${results.expiringMaterials.tested ? '✅' : '❌'}    | ${results.expiringMaterials.hasGPS ? '✅' : '❌'}             | ${results.expiringMaterials.withGPS}/${results.expiringMaterials.count} avec GPS`);

    const allTested = Object.values(results).every(r => r.tested);
    const allHaveGPS = Object.values(results).every(r => r.hasGPS);

    console.log('\n' + '='.repeat(80));
    if (allTested && allHaveGPS) {
      console.log('✅ TOUS LES TESTS PASSÉS - GPS DISPONIBLE PARTOUT');
      console.log('\n🎉 Le backend retourne correctement les coordonnées GPS!');
      console.log('   Vérifiez maintenant que le frontend les affiche correctement.');
    } else if (allTested && !allHaveGPS) {
      console.log('⚠️  TESTS PASSÉS MAIS GPS MANQUANT POUR CERTAINS MATÉRIAUX');
      console.log('\n📋 Actions recommandées:');
      console.log('   1. Vérifier que les sites ont des coordonnées dans MongoDB');
      console.log('   2. Vérifier les logs du backend pour voir les erreurs');
      console.log('   3. Exécuter dans MongoDB:');
      console.log('      db.sites.find({}, { nom: 1, coordonnees: 1 }).pretty()');
      console.log('   4. Vérifier qu\'un site a bien:');
      console.log('      coordonnees: { latitude: 48.8566, longitude: 2.3522 }');
    } else {
      console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ');
      console.log('\n📋 Actions recommandées:');
      console.log('   1. Vérifiez que le materials-service est démarré sur le port 3002');
      console.log('   2. Vérifiez les logs du backend pour voir les erreurs');
      console.log('   3. Testez manuellement: curl http://localhost:3002/api/materials');
    }
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERREUR GLOBALE:', error.message);
    console.error('\n📋 Vérifiez que:');
    console.error('   1. Le materials-service est démarré (npm start)');
    console.error('   2. Le service écoute sur le port 3002');
    console.error('   3. MongoDB est accessible');
  }
}

testAllEndpoints();
