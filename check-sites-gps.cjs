#!/usr/bin/env node

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite';

console.log('\n' + '='.repeat(80));
console.log('🔍 VÉRIFICATION GPS DES SITES');
console.log('='.repeat(80) + '\n');

async function checkSitesGPS() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connexion MongoDB établie\n');
    
    const db = client.db();
    const sitesCollection = db.collection('sites');
    const materialsCollection = db.collection('materials');
    
    // 1. Récupérer tous les sites
    const sites = await sitesCollection.find({}).toArray();
    console.log(`📍 Total sites: ${sites.length}\n`);
    
    if (sites.length === 0) {
      console.log('❌ AUCUN SITE TROUVÉ!\n');
      console.log('💡 Créez un site avec GPS:\n');
      console.log('db.sites.insertOne({');
      console.log('  nom: "Chantier Tunisia",');
      console.log('  adresse: "Tunis",');
      console.log('  ville: "Tunis",');
      console.log('  codePostal: "1000",');
      console.log('  pays: "Tunisia",');
      console.log('  coordonnees: { latitude: 33.8439, longitude: 9.4001 },');
      console.log('  isActive: true');
      console.log('})\n');
      await client.close();
      return;
    }
    
    // 2. Vérifier chaque site
    console.log('📋 DÉTAILS DES SITES:\n');
    
    let sitesWithGPS = 0;
    let sitesWithoutGPS = 0;
    
    for (const site of sites) {
      console.log(`📍 ${site.nom}`);
      console.log(`   _id: ${site._id}`);
      console.log(`   adresse: ${site.adresse || 'N/A'}`);
      console.log(`   ville: ${site.ville || 'N/A'}`);
      
      if (site.coordonnees?.latitude && site.coordonnees?.longitude) {
        console.log(`   ✅ GPS: ${site.coordonnees.latitude}, ${site.coordonnees.longitude}`);
        sitesWithGPS++;
      } else {
        console.log(`   ❌ GPS: MANQUANT`);
        console.log(`   coordonnees:`, site.coordonnees || 'undefined');
        sitesWithoutGPS++;
      }
      console.log('');
    }
    
    // 3. Vérifier les matériaux
    const materials = await materialsCollection.find({}).toArray();
    console.log(`📦 Total matériaux: ${materials.length}\n`);
    
    let materialsWithSite = 0;
    let materialsWithoutSite = 0;
    let materialsWithInvalidSite = 0;
    
    for (const material of materials) {
      if (!material.siteId) {
        materialsWithoutSite++;
      } else {
        const siteExists = sites.some(s => s._id.toString() === material.siteId.toString());
        if (siteExists) {
          materialsWithSite++;
        } else {
          materialsWithInvalidSite++;
          console.log(`❌ ${material.name}: Site invalide (${material.siteId})`);
        }
      }
    }
    
    console.log('='.repeat(80));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(80));
    console.log(`\n📍 SITES:`);
    console.log(`   ✅ Avec GPS: ${sitesWithGPS}`);
    console.log(`   ❌ Sans GPS: ${sitesWithoutGPS}`);
    console.log(`\n📦 MATÉRIAUX:`);
    console.log(`   ✅ Avec site valide: ${materialsWithSite}`);
    console.log(`   ❌ Sans site: ${materialsWithoutSite}`);
    console.log(`   ❌ Site invalide: ${materialsWithInvalidSite}`);
    console.log('');
    
    if (sitesWithoutGPS > 0) {
      console.log('💡 SOLUTION: Ajouter GPS aux sites');
      console.log('   node ajouter-gps-tunisia.cjs\n');
    }
    
    if (materialsWithoutSite > 0 || materialsWithInvalidSite > 0) {
      console.log('💡 SOLUTION: Corriger les sites des matériaux');
      console.log('   node corriger-sites-manquants.cjs\n');
    }
    
    if (sitesWithGPS > 0 && materialsWithSite > 0 && sitesWithoutGPS === 0 && materialsWithInvalidSite === 0) {
      console.log('✅ TOUT EST OK! Redémarrez le backend:\n');
      console.log('   cd apps/backend/materials-service');
      console.log('   npm start\n');
    }
    
    console.log('='.repeat(80) + '\n');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  }
}

checkSitesGPS();
