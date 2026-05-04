#!/usr/bin/env node

/**
 * DIAGNOSTIC - Affichage GPS du Site Assigné
 * 
 * Ce script teste si les coordonnées GPS sont correctement retournées par l'API
 */

const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

console.log('\n' + '='.repeat(80));
console.log('🔍 DIAGNOSTIC - Affichage GPS du Site Assigné');
console.log('='.repeat(80) + '\n');

async function testGPSDisplay() {
  try {
    console.log('📡 Test 1: Récupération de la liste des matériaux...\n');
    
    const response = await axios.get(`${API_URL}/materials`);
    const materials = response.data.data || response.data;
    
    if (!materials || materials.length === 0) {
      console.log('❌ Aucun matériau trouvé\n');
      return;
    }
    
    console.log(`✅ ${materials.length} matériaux trouvés\n`);
    
    // Analyser les 5 premiers matériaux
    console.log('📊 Analyse des matériaux:\n');
    console.log('-'.repeat(80));
    
    let materialsWithSite = 0;
    let materialsWithGPS = 0;
    let materialsWithoutGPS = 0;
    
    for (let i = 0; i < Math.min(5, materials.length); i++) {
      const material = materials[i];
      console.log(`\n[${i + 1}] ${material.name} (${material.code})`);
      console.log(`    siteId: ${material.siteId || 'NON ASSIGNÉ'}`);
      console.log(`    siteName: ${material.siteName || 'N/A'}`);
      console.log(`    siteAddress: ${material.siteAddress || 'N/A'}`);
      
      if (material.siteId) {
        materialsWithSite++;
      }
      
      if (material.siteCoordinates) {
        materialsWithGPS++;
        console.log(`    ✅ GPS: ${material.siteCoordinates.lat}, ${material.siteCoordinates.lng}`);
      } else {
        materialsWithoutGPS++;
        console.log(`    ❌ GPS: NON DISPONIBLE`);
        
        // Si le matériau a un site mais pas de GPS, c'est un problème
        if (material.siteId) {
          console.log(`    ⚠️  PROBLÈME: Le matériau a un site mais pas de coordonnées GPS`);
        }
      }
    }
    
    console.log('\n' + '-'.repeat(80));
    console.log('\n📊 RÉSUMÉ:');
    console.log(`   Total matériaux analysés: ${Math.min(5, materials.length)}`);
    console.log(`   Matériaux avec site: ${materialsWithSite}`);
    console.log(`   Matériaux avec GPS: ${materialsWithGPS}`);
    console.log(`   Matériaux sans GPS: ${materialsWithoutGPS}`);
    
    if (materialsWithoutGPS > 0 && materialsWithSite > 0) {
      console.log('\n⚠️  PROBLÈME DÉTECTÉ:');
      console.log('   Des matériaux ont un site assigné mais pas de coordonnées GPS.');
      console.log('   Cela peut être dû à:');
      console.log('   1. Le site n\'a pas de coordonnées dans MongoDB');
      console.log('   2. Le backend ne récupère pas correctement les coordonnées');
      console.log('   3. Le champ coordonnees.latitude ou coordonnees.longitude est manquant');
    }
    
    // Test détaillé sur un matériau spécifique
    if (materials.length > 0 && materials[0]._id) {
      console.log('\n' + '='.repeat(80));
      console.log('📡 Test 2: Récupération détaillée d\'un matériau...\n');
      
      const materialId = materials[0]._id;
      const detailResponse = await axios.get(`${API_URL}/materials/${materialId}`);
      const materialDetail = detailResponse.data;
      
      console.log(`Matériau: ${materialDetail.name} (${materialDetail.code})`);
      console.log(`siteId: ${materialDetail.siteId || 'NON ASSIGNÉ'}`);
      console.log(`siteName: ${materialDetail.siteName || 'N/A'}`);
      console.log(`siteAddress: ${materialDetail.siteAddress || 'N/A'}`);
      
      if (materialDetail.siteCoordinates) {
        console.log(`✅ GPS: ${materialDetail.siteCoordinates.lat}, ${materialDetail.siteCoordinates.lng}`);
      } else {
        console.log(`❌ GPS: NON DISPONIBLE`);
        
        if (materialDetail.siteId) {
          console.log('\n⚠️  DIAGNOSTIC:');
          console.log('   Le matériau a un siteId mais pas de coordonnées GPS.');
          console.log('   Vérifiez que le site a des coordonnées dans MongoDB:');
          console.log(`   db.sites.findOne({ _id: ObjectId("${materialDetail.siteId}") })`);
          console.log('   Vérifiez que les champs coordonnees.latitude et coordonnees.longitude existent.');
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ DIAGNOSTIC TERMINÉ');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    console.log('\n⚠️  Assurez-vous que le materials-service est démarré sur le port 3002\n');
  }
}

testGPSDisplay();
