#!/usr/bin/env node

const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite';
const API_URL = 'http://localhost:3002/api';

console.log('\n' + '='.repeat(80));
console.log('🔍 TEST FINAL GPS - Analyse Complète');
console.log('='.repeat(80) + '\n');

async function testFinal() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connexion MongoDB établie\n');
    
    const db = client.db();
    const sitesCollection = db.collection('sites');
    const materialsCollection = db.collection('materials');
    
    // ========== ÉTAPE 1: SITES ==========
    console.log('📍 ÉTAPE 1: VÉRIFICATION DES SITES\n');
    
    const sites = await sitesCollection.find({}).toArray();
    console.log(`Total sites: ${sites.length}\n`);
    
    const sitesWithGPS = sites.filter(s => s.coordonnees?.latitude && s.coordonnees?.longitude);
    const sitesWithoutGPS = sites.filter(s => !s.coordonnees?.latitude || !s.coordonnees?.longitude);
    
    console.log(`✅ Sites avec GPS: ${sitesWithGPS.length}`);
    console.log(`❌ Sites sans GPS: ${sitesWithoutGPS.length}\n`);
    
    if (sitesWithoutGPS.length > 0) {
      console.log('⚠️  Sites SANS GPS:\n');
      sitesWithoutGPS.forEach(s => {
        console.log(`  - ${s.nom} (${s._id})`);
        console.log(`    coordonnees:`, s.coordonnees || 'MANQUANT');
      });
      console.log('\n💡 SOLUTION: node ajouter-gps-tunisia.cjs\n');
    }
    
    // Afficher tous les sites avec GPS
    if (sitesWithGPS.length > 0) {
      console.log('✅ Sites AVEC GPS:\n');
      sitesWithGPS.forEach(s => {
        console.log(`  - ${s.nom}`);
        console.log(`    _id: ${s._id}`);
        console.log(`    GPS: ${s.coordonnees.latitude}, ${s.coordonnees.longitude}`);
      });
      console.log('');
    }
    
    // ========== ÉTAPE 2: MATÉRIAUX ==========
    console.log('📦 ÉTAPE 2: VÉRIFICATION DES MATÉRIAUX\n');
    
    const materials = await materialsCollection.find({}).toArray();
    console.log(`Total matériaux: ${materials.length}\n`);
    
    let materialsWithValidSite = 0;
    let materialsWithInvalidSite = 0;
    let materialsWithoutSite = 0;
    
    for (const material of materials) {
      if (!material.siteId) {
        materialsWithoutSite++;
      } else {
        let siteId = material.siteId;
        if (typeof siteId === 'string') {
          try {
            siteId = new ObjectId(siteId);
          } catch (e) {}
        }
        
        const site = sites.find(s => s._id.toString() === siteId.toString());
        
        if (site) {
          materialsWithValidSite++;
        } else {
          materialsWithInvalidSite++;
          console.log(`❌ ${material.name}: Site invalide (${material.siteId})`);
        }
      }
    }
    
    console.log(`✅ Matériaux avec site valide: ${materialsWithValidSite}`);
    console.log(`❌ Matériaux avec site invalide: ${materialsWithInvalidSite}`);
    console.log(`⚠️  Matériaux sans site: ${materialsWithoutSite}\n`);
    
    if (materialsWithInvalidSite > 0 || materialsWithoutSite > 0) {
      console.log('💡 SOLUTION: node corriger-sites-manquants.cjs\n');
    }
    
    // ========== ÉTAPE 3: API ==========
    console.log('📡 ÉTAPE 3: TEST API\n');
    
    try {
      const response = await axios.get(`${API_URL}/materials`);
      const apiMaterials = response.data.data || response.data;
      
      console.log(`✅ API répond: ${apiMaterials.length} matériaux\n`);
      
      const apiWithGPS = apiMaterials.filter(m => m.siteCoordinates);
      const apiWithoutGPS = apiMaterials.filter(m => !m.siteCoordinates);
      
      console.log(`✅ Matériaux avec GPS dans API: ${apiWithGPS.length}`);
      console.log(`❌ Matériaux sans GPS dans API: ${apiWithoutGPS.length}\n`);
      
      if (apiWithGPS.length > 0) {
        console.log('✅ Exemples avec GPS:\n');
        apiWithGPS.slice(0, 3).forEach(m => {
          console.log(`  - ${m.name}`);
          console.log(`    Site: ${m.siteName}`);
          console.log(`    GPS: ${m.siteCoordinates.lat}, ${m.siteCoordinates.lng}`);
        });
        console.log('');
      }
      
      if (apiWithoutGPS.length > 0) {
        console.log('❌ Exemples SANS GPS:\n');
        apiWithoutGPS.slice(0, 3).forEach(m => {
          console.log(`  - ${m.name}`);
          console.log(`    Site: ${m.siteName || 'N/A'}`);
          console.log(`    siteId: ${m.siteId || 'N/A'}`);
        });
        console.log('');
      }
      
    } catch (error) {
      console.error('❌ Erreur API:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.error('   → Backend non démarré!\n');
      }
    }
    
    // ========== RÉSUMÉ ==========
    console.log('='.repeat(80));
    console.log('📊 RÉSUMÉ FINAL');
    console.log('='.repeat(80) + '\n');
    
    const problems = [];
    
    if (sitesWithoutGPS.length > 0) {
      problems.push(`🔴 ${sitesWithoutGPS.length} site(s) sans GPS`);
      problems.push('   → Solution: node ajouter-gps-tunisia.cjs');
    }
    
    if (materialsWithInvalidSite > 0 || materialsWithoutSite > 0) {
      problems.push(`🔴 ${materialsWithInvalidSite + materialsWithoutSite} matériau(x) avec site invalide/manquant`);
      problems.push('   → Solution: node corriger-sites-manquants.cjs');
    }
    
    if (problems.length > 0) {
      console.log('🚨 PROBLÈMES DÉTECTÉS:\n');
      problems.forEach(p => console.log(p));
      console.log('');
    } else {
      console.log('✅ TOUT EST OK!\n');
      console.log('Si le GPS ne s\'affiche toujours pas:');
      console.log('1. Vérifier les logs backend (chercher "🔍 [findAll]")');
      console.log('2. Redémarrer le backend');
      console.log('3. Vider le cache du navigateur\n');
    }
    
    console.log('='.repeat(80) + '\n');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  }
}

testFinal();
