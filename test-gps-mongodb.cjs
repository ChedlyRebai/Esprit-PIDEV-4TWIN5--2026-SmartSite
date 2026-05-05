#!/usr/bin/env node

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite';

console.log('\n' + '='.repeat(80));
console.log('🔍 DIAGNOSTIC GPS - Vérification MongoDB');
console.log('='.repeat(80) + '\n');

async function checkGPS() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connexion MongoDB établie\n');
    
    const db = client.db();
    const sitesCollection = db.collection('sites');
    const materialsCollection = db.collection('materials');
    
    // 1. Vérifier les sites
    console.log('📍 VÉRIFICATION DES SITES\n');
    const sites = await sitesCollection.find({}).toArray();
    console.log(`Total sites: ${sites.length}\n`);
    
    let sitesWithGPS = 0;
    let sitesWithoutGPS = 0;
    
    sites.forEach((site, index) => {
      const hasGPS = site.coordonnees?.latitude && site.coordonnees?.longitude;
      
      if (index < 5) { // Afficher les 5 premiers
        console.log(`Site ${index + 1}: ${site.nom}`);
        console.log(`  _id: ${site._id}`);
        console.log(`  adresse: ${site.adresse || 'N/A'}`);
        console.log(`  coordonnees:`, site.coordonnees || 'N/A');
        
        if (hasGPS) {
          console.log(`  ✅ GPS: ${site.coordonnees.latitude}, ${site.coordonnees.longitude}`);
          sitesWithGPS++;
        } else {
          console.log(`  ❌ GPS: MANQUANT`);
          sitesWithoutGPS++;
        }
        console.log('');
      } else {
        if (hasGPS) sitesWithGPS++;
        else sitesWithoutGPS++;
      }
    });
    
    console.log('📊 RÉSUMÉ SITES:');
    console.log(`  ✅ Avec GPS: ${sitesWithGPS}`);
    console.log(`  ❌ Sans GPS: ${sitesWithoutGPS}\n`);
    
    // 2. Vérifier les matériaux
    console.log('📦 VÉRIFICATION DES MATÉRIAUX\n');
    const materials = await materialsCollection.find({}).limit(10).toArray();
    console.log(`Total matériaux (échantillon): ${materials.length}\n`);
    
    for (const material of materials) {
      console.log(`Matériau: ${material.name}`);
      console.log(`  _id: ${material._id}`);
      console.log(`  siteId: ${material.siteId || 'N/A'}`);
      
      if (material.siteId) {
        // Chercher le site correspondant
        const siteId = material.siteId.toString();
        const site = sites.find(s => s._id.toString() === siteId);
        
        if (site) {
          console.log(`  ✅ Site trouvé: ${site.nom}`);
          console.log(`  adresse: ${site.adresse || 'N/A'}`);
          
          if (site.coordonnees?.latitude && site.coordonnees?.longitude) {
            console.log(`  ✅ GPS: ${site.coordonnees.latitude}, ${site.coordonnees.longitude}`);
          } else {
            console.log(`  ❌ GPS: MANQUANT dans le site`);
            console.log(`  Structure coordonnees:`, JSON.stringify(site.coordonnees, null, 2));
          }
        } else {
          console.log(`  ❌ Site non trouvé avec _id: ${siteId}`);
        }
      } else {
        console.log(`  ⚠️  Pas de siteId assigné`);
      }
      console.log('');
    }
    
    // 3. Recommandations
    console.log('='.repeat(80));
    console.log('💡 RECOMMANDATIONS\n');
    
    if (sitesWithoutGPS > 0) {
      console.log('🔴 PROBLÈME: Certains sites n\'ont pas de coordonnées GPS');
      console.log('\nPour ajouter des coordonnées GPS à un site:');
      console.log('```javascript');
      console.log('db.sites.updateOne(');
      console.log('  { nom: "Nom du site" },');
      console.log('  { $set: { coordonnees: { latitude: 48.8566, longitude: 2.3522 } } }');
      console.log(')');
      console.log('```\n');
      
      console.log('Ou pour tous les sites sans GPS (exemple Paris):');
      console.log('```javascript');
      console.log('db.sites.updateMany(');
      console.log('  { "coordonnees.latitude": { $exists: false } },');
      console.log('  { $set: { coordonnees: { latitude: 48.8566, longitude: 2.3522 } } }');
      console.log(')');
      console.log('```\n');
    } else {
      console.log('✅ Tous les sites ont des coordonnées GPS!');
    }
    
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.close();
  }
}

checkGPS();
