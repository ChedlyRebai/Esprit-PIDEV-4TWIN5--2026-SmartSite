#!/usr/bin/env node

const axios = require('axios');
const { MongoClient } = require('mongodb');

const API_URL = 'http://localhost:3002/api';
const MONGODB_URI = 'mongodb://localhost:27017/smartsite';

console.log('\n' + '='.repeat(80));
console.log('🔍 TEST COMPLET - GPS & STOCK');
console.log('='.repeat(80) + '\n');

async function runCompleteTest() {
  const results = {
    mongodb: { success: false, sitesWithGPS: 0, totalSites: 0 },
    api: { success: false, materialsWithGPS: 0, totalMaterials: 0 },
    stockFields: { success: false, materialsWithStock: 0 },
  };

  // ========== TEST 1: MONGODB ==========
  console.log('📊 TEST 1: VÉRIFICATION MONGODB\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const sitesCollection = db.collection('sites');
    const materialsCollection = db.collection('materials');
    
    // Vérifier les sites
    const sites = await sitesCollection.find({}).toArray();
    results.mongodb.totalSites = sites.length;
    
    const sitesWithGPS = sites.filter(s => s.coordonnees?.latitude && s.coordonnees?.longitude);
    results.mongodb.sitesWithGPS = sitesWithGPS.length;
    results.mongodb.success = sitesWithGPS.length > 0;
    
    console.log(`✅ Sites trouvés: ${sites.length}`);
    console.log(`📍 Sites avec GPS: ${sitesWithGPS.length}`);
    
    if (sitesWithGPS.length > 0) {
      const sample = sitesWithGPS[0];
      console.log(`\nExemple: ${sample.nom}`);
      console.log(`  GPS: ${sample.coordonnees.latitude}, ${sample.coordonnees.longitude}`);
    }
    
    if (sitesWithGPS.length < sites.length) {
      console.log(`\n⚠️  ${sites.length - sitesWithGPS.length} sites SANS GPS!`);
      console.log(`   → Exécuter: node add-gps-to-sites.cjs`);
    } else {
      console.log(`\n✅ Tous les sites ont des GPS!`);
    }
    
    // Vérifier les matériaux
    console.log('\n📦 Vérification matériaux...\n');
    const materials = await materialsCollection.find({}).limit(5).toArray();
    
    let materialsWithStockFields = 0;
    for (const material of materials) {
      const hasStockFields = 
        material.stockExistant !== undefined ||
        material.stockEntree !== undefined ||
        material.stockSortie !== undefined;
      
      if (hasStockFields) materialsWithStockFields++;
      
      console.log(`Matériau: ${material.name}`);
      console.log(`  siteId: ${material.siteId || 'N/A'}`);
      console.log(`  stockExistant: ${material.stockExistant !== undefined ? material.stockExistant : 'N/A'}`);
      console.log(`  stockEntree: ${material.stockEntree !== undefined ? material.stockEntree : 'N/A'}`);
      console.log(`  stockSortie: ${material.stockSortie !== undefined ? material.stockSortie : 'N/A'}`);
      console.log('');
    }
    
    results.stockFields.materialsWithStock = materialsWithStockFields;
    results.stockFields.success = materialsWithStockFields > 0;
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Erreur MongoDB:', error.message);
  }
  
  // ========== TEST 2: API ==========
  console.log('\n📡 TEST 2: VÉRIFICATION API\n');
  
  try {
    const response = await axios.get(`${API_URL}/materials`);
    const materials = response.data.data || response.data;
    
    results.api.totalMaterials = materials.length;
    
    const materialsWithGPS = materials.filter(m => m.siteCoordinates);
    results.api.materialsWithGPS = materialsWithGPS.length;
    results.api.success = materialsWithGPS.length > 0;
    
    console.log(`✅ Matériaux récupérés: ${materials.length}`);
    console.log(`📍 Matériaux avec GPS: ${materialsWithGPS.length}`);
    
    if (materialsWithGPS.length > 0) {
      const sample = materialsWithGPS[0];
      console.log(`\nExemple: ${sample.name}`);
      console.log(`  Site: ${sample.siteName}`);
      console.log(`  Adresse: ${sample.siteAddress || 'N/A'}`);
      console.log(`  GPS: ${sample.siteCoordinates.lat}, ${sample.siteCoordinates.lng}`);
      
      // Vérifier les champs de stock
      if (sample.stockExistant !== undefined) {
        console.log(`  Stock Existant: ${sample.stockExistant}`);
      }
      if (sample.stockEntree !== undefined) {
        console.log(`  Stock Entrée: ${sample.stockEntree}`);
      }
      if (sample.stockSortie !== undefined) {
        console.log(`  Stock Sortie: ${sample.stockSortie}`);
      }
    }
    
    if (materialsWithGPS.length < materials.length) {
      console.log(`\n⚠️  ${materials.length - materialsWithGPS.length} matériaux SANS GPS!`);
      console.log(`   → Vérifier que les sites ont des GPS`);
      console.log(`   → Vérifier que les matériaux ont un siteId valide`);
    } else {
      console.log(`\n✅ Tous les matériaux ont des GPS!`);
    }
    
  } catch (error) {
    console.error('❌ Erreur API:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   → Le backend n\'est pas démarré!');
      console.error('   → Exécuter: cd apps/backend/materials-service && npm start');
    }
  }
  
  // ========== TEST 3: DÉTAILS MATÉRIAU ==========
  console.log('\n📋 TEST 3: DÉTAILS MATÉRIAU\n');
  
  try {
    const listResponse = await axios.get(`${API_URL}/materials`);
    const materials = listResponse.data.data || listResponse.data;
    
    if (materials.length > 0) {
      const materialId = materials[0]._id;
      const response = await axios.get(`${API_URL}/materials/${materialId}`);
      const material = response.data;
      
      console.log(`✅ Matériau: ${material.name}`);
      console.log(`\nInformations de site:`);
      console.log(`  Nom: ${material.siteName || 'N/A'}`);
      console.log(`  Adresse: ${material.siteAddress || 'N/A'}`);
      console.log(`  GPS: ${material.siteCoordinates ? `${material.siteCoordinates.lat}, ${material.siteCoordinates.lng}` : 'N/A'}`);
      
      console.log(`\nInformations de stock:`);
      console.log(`  Quantité actuelle: ${material.quantity}`);
      console.log(`  Stock existant: ${material.stockExistant !== undefined ? material.stockExistant : 'N/A'}`);
      console.log(`  Entrées: ${material.stockEntree !== undefined ? material.stockEntree : 'N/A'}`);
      console.log(`  Sorties: ${material.stockSortie !== undefined ? material.stockSortie : 'N/A'}`);
      
      if (!material.siteCoordinates) {
        console.log(`\n⚠️  GPS manquant pour ce matériau!`);
      }
      
      if (material.stockExistant === undefined && material.stockEntree === undefined && material.stockSortie === undefined) {
        console.log(`\n⚠️  Champs de stock V2 manquants!`);
        console.log(`   → Ces champs sont optionnels mais utiles pour l'affichage`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur détails:', error.message);
  }
  
  // ========== RÉSUMÉ ==========
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ FINAL');
  console.log('='.repeat(80) + '\n');
  
  console.log('Test                          | Statut | Détails');
  console.log('-'.repeat(80));
  console.log(`MongoDB - Sites avec GPS      | ${results.mongodb.success ? '✅' : '❌'}     | ${results.mongodb.sitesWithGPS}/${results.mongodb.totalSites}`);
  console.log(`API - Matériaux avec GPS      | ${results.api.success ? '✅' : '❌'}     | ${results.api.materialsWithGPS}/${results.api.totalMaterials}`);
  console.log(`MongoDB - Champs stock V2     | ${results.stockFields.success ? '✅' : '⚠️ '}     | ${results.stockFields.materialsWithStock} matériaux`);
  
  console.log('\n' + '='.repeat(80));
  
  // Recommandations
  const problems = [];
  
  if (!results.mongodb.success || results.mongodb.sitesWithGPS < results.mongodb.totalSites) {
    problems.push('🔴 PROBLÈME: Sites sans GPS dans MongoDB');
    problems.push('   → Solution: node add-gps-to-sites.cjs');
  }
  
  if (!results.api.success || results.api.materialsWithGPS < results.api.totalMaterials) {
    problems.push('🔴 PROBLÈME: GPS non retourné par l\'API');
    problems.push('   → Vérifier que les sites ont des GPS');
    problems.push('   → Vérifier que materials.service.ts récupère bien les GPS');
  }
  
  if (!results.stockFields.success) {
    problems.push('⚠️  INFO: Champs stock V2 manquants (optionnel)');
    problems.push('   → Ces champs sont utilisés pour l\'affichage détaillé');
    problems.push('   → Ils seront créés lors de la prochaine mise à jour');
  }
  
  if (problems.length > 0) {
    console.log('\n🚨 ACTIONS REQUISES:\n');
    problems.forEach(p => console.log(p));
  } else {
    console.log('\n✅ TOUT EST OK!');
    console.log('   - Tous les sites ont des GPS');
    console.log('   - L\'API retourne les GPS correctement');
    console.log('   - Les champs de stock sont présents');
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

runCompleteTest();
