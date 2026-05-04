#!/usr/bin/env node

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite';

// Coordonnées GPS de quelques villes françaises
const GPS_COORDINATES = {
  'Paris': { latitude: 48.8566, longitude: 2.3522 },
  'Lyon': { latitude: 45.7640, longitude: 4.8357 },
  'Marseille': { latitude: 43.2965, longitude: 5.3698 },
  'Toulouse': { latitude: 43.6047, longitude: 1.4442 },
  'Nice': { latitude: 43.7102, longitude: 7.2620 },
  'Nantes': { latitude: 47.2184, longitude: -1.5536 },
  'Strasbourg': { latitude: 48.5734, longitude: 7.7521 },
  'Montpellier': { latitude: 43.6108, longitude: 3.8767 },
  'Bordeaux': { latitude: 44.8378, longitude: -0.5792 },
  'Lille': { latitude: 50.6292, longitude: 3.0573 },
};

console.log('\n' + '='.repeat(80));
console.log('🗺️  AJOUT COORDONNÉES GPS AUX SITES');
console.log('='.repeat(80) + '\n');

async function addGPSToSites() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connexion MongoDB établie\n');
    
    const db = client.db();
    const sitesCollection = db.collection('sites');
    
    // Récupérer tous les sites
    const sites = await sitesCollection.find({}).toArray();
    console.log(`📍 ${sites.length} sites trouvés\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const site of sites) {
      // Vérifier si le site a déjà des coordonnées valides
      if (site.coordonnees?.latitude && site.coordonnees?.longitude) {
        console.log(`⏭️  ${site.nom} - GPS déjà présent (${site.coordonnees.latitude}, ${site.coordonnees.longitude})`);
        skipped++;
        continue;
      }
      
      // Essayer de trouver des coordonnées basées sur la ville
      let coords = null;
      
      // Chercher dans le nom du site
      for (const [city, gps] of Object.entries(GPS_COORDINATES)) {
        if (site.nom?.toLowerCase().includes(city.toLowerCase()) ||
            site.ville?.toLowerCase().includes(city.toLowerCase()) ||
            site.adresse?.toLowerCase().includes(city.toLowerCase())) {
          coords = gps;
          break;
        }
      }
      
      // Si pas trouvé, utiliser Paris par défaut
      if (!coords) {
        coords = GPS_COORDINATES['Paris'];
        console.log(`📍 ${site.nom} - Utilisation coordonnées Paris par défaut`);
      } else {
        console.log(`📍 ${site.nom} - Coordonnées détectées automatiquement`);
      }
      
      // Mettre à jour le site
      await sitesCollection.updateOne(
        { _id: site._id },
        { 
          $set: { 
            coordonnees: {
              latitude: coords.latitude,
              longitude: coords.longitude
            }
          } 
        }
      );
      
      console.log(`   ✅ GPS ajouté: ${coords.latitude}, ${coords.longitude}`);
      updated++;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(80));
    console.log(`✅ Sites mis à jour: ${updated}`);
    console.log(`⏭️  Sites déjà avec GPS: ${skipped}`);
    console.log(`📍 Total sites: ${sites.length}\n`);
    
    // Vérification finale
    console.log('🔍 VÉRIFICATION FINALE\n');
    const sitesAfter = await sitesCollection.find({}).toArray();
    const withGPS = sitesAfter.filter(s => s.coordonnees?.latitude && s.coordonnees?.longitude);
    
    console.log(`✅ Sites avec GPS: ${withGPS.length}/${sitesAfter.length}`);
    
    if (withGPS.length === sitesAfter.length) {
      console.log('\n🎉 SUCCÈS! Tous les sites ont maintenant des coordonnées GPS!\n');
    } else {
      console.log(`\n⚠️  ${sitesAfter.length - withGPS.length} sites sans GPS\n`);
    }
    
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.close();
  }
}

addGPSToSites();
