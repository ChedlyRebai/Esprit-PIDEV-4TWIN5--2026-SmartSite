#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:3002/api/materials';

console.log('\n' + '='.repeat(80));
console.log('🔍 TEST API - RÉCUPÉRATION GPS');
console.log('='.repeat(80) + '\n');

async function testAPI() {
  try {
    console.log('📡 Appel API: GET /api/materials\n');
    
    const response = await axios.get(API_URL);
    const materials = response.data.data || response.data;
    
    console.log(`✅ ${materials.length} matériaux reçus\n`);
    
    if (materials.length === 0) {
      console.log('❌ Aucun matériau! Exécutez: node creer-materiaux-test.cjs\n');
      return;
    }
    
    // Afficher les 3 premiers matériaux
    console.log('📋 DÉTAILS DES MATÉRIAUX:\n');
    
    for (const material of materials.slice(0, 3)) {
      console.log(`📦 ${material.name} (${material.code})`);
      console.log(`   _id: ${material._id}`);
      console.log(`   siteId: ${material.siteId || 'N/A'}`);
      console.log(`   siteName: ${material.siteName || 'N/A'}`);
      console.log(`   siteAddress: ${material.siteAddress || 'N/A'}`);
      console.log(`   siteCoordinates:`, material.siteCoordinates || 'MANQUANT ❌');
      
      if (material.siteCoordinates) {
        console.log(`   ✅ GPS: ${material.siteCoordinates.lat}, ${material.siteCoordinates.lng}`);
      } else {
        console.log(`   ❌ GPS: MANQUANT!`);
      }
      console.log('');
    }
    
    // Statistiques
    const withGPS = materials.filter(m => m.siteCoordinates).length;
    const withoutGPS = materials.length - withGPS;
    
    console.log('='.repeat(80));
    console.log('📊 STATISTIQUES');
    console.log('='.repeat(80));
    console.log(`Total matériaux: ${materials.length}`);
    console.log(`Avec GPS: ${withGPS}`);
    console.log(`Sans GPS: ${withoutGPS}`);
    console.log('');
    
    if (withoutGPS > 0) {
      console.log('❌ PROBLÈME: Le backend ne retourne pas les GPS!\n');
      console.log('💡 SOLUTION:');
      console.log('1. Vérifier que materials.service.ts appelle sitesService.findOne()');
      console.log('2. Vérifier les logs backend (chercher "Site FOUND")');
      console.log('3. Redémarrer le backend\n');
    } else {
      console.log('✅ TOUT EST OK! Les GPS sont retournés par l\'API\n');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   → Backend non démarré! Démarrez-le avec: cd apps/backend/materials-service && npm start\n');
    }
  }
}

testAPI();
