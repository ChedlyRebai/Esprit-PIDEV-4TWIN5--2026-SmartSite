#!/usr/bin/env node

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite';

console.log('\n' + '='.repeat(80));
console.log('🔧 CORRECTION AUTOMATIQUE - Sites Manquants');
console.log('='.repeat(80) + '\n');

async function fixMissingSites() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connexion MongoDB établie\n');
    
    const db = client.db();
    const sitesCollection = db.collection('sites');
    const materialsCollection = db.collection('materials');
    
    // 1. Récupérer tous les matériaux
    const materials = await materialsCollection.find({}).toArray();
    console.log(`📦 ${materials.length} matériaux trouvés\n`);
    
    // 2. Récupérer tous les sites
    const sites = await sitesCollection.find({}).toArray();
    console.log(`📍 ${sites.length} sites trouvés\n`);
    
    if (sites.length === 0) {
      console.log('❌ AUCUN SITE! Création d\'un site par défaut...\n');
      
      const defaultSite = {
        nom: "Chantier Principal",
        adresse: "123 Rue de Paris",
        ville: "Paris",
        codePostal: "75001",
        pays: "France",
        coordonnees: {
          latitude: 48.8566,
          longitude: 2.3522
        },
        isActive: true,
        createdAt: new Date()
      };
      
      const result = await sitesCollection.insertOne(defaultSite);
      console.log(`✅ Site créé: ${result.insertedId}\n`);
      sites.push({ _id: result.insertedId, ...defaultSite });
    }
    
    // 3. Vérifier chaque matériau
    let fixed = 0;
    let alreadyOk = 0;
    
    for (const material of materials) {
      if (!material.siteId) {
        // Pas de site assigné → assigner au premier site
        await materialsCollection.updateOne(
          { _id: material._id },
          { $set: { siteId: sites[0]._id } }
        );
        console.log(`✅ ${material.name}: Site assigné → ${sites[0].nom}`);
        fixed++;
      } else {
        // Vérifier si le site existe
        let siteId = material.siteId;
        if (typeof siteId === 'string') {
          try {
            siteId = new ObjectId(siteId);
          } catch (e) {
            // Ignore
          }
        }
        
        const siteExists = sites.some(s => s._id.toString() === siteId.toString());
        
        if (!siteExists) {
          // Site n'existe pas → réassigner au premier site
          await materialsCollection.updateOne(
            { _id: material._id },
            { $set: { siteId: sites[0]._id } }
          );
          console.log(`✅ ${material.name}: Site invalide → ${sites[0].nom}`);
          fixed++;
        } else {
          alreadyOk++;
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(80));
    console.log(`✅ Matériaux corrigés: ${fixed}`);
    console.log(`✅ Matériaux déjà OK: ${alreadyOk}`);
    console.log(`📍 Total matériaux: ${materials.length}\n`);
    
    // 4. Ajouter GPS aux sites si manquant
    console.log('📍 Vérification GPS des sites...\n');
    
    let gpsAdded = 0;
    for (const site of sites) {
      if (!site.coordonnees?.latitude || !site.coordonnees?.longitude) {
        // Détecter la ville et ajouter GPS
        const GPS_COORDINATES = {
          'Paris': { latitude: 48.8566, longitude: 2.3522 },
          'Lyon': { latitude: 45.7640, longitude: 4.8357 },
          'Marseille': { latitude: 43.2965, longitude: 5.3698 },
        };
        
        let coords = GPS_COORDINATES['Paris']; // Par défaut
        
        for (const [city, gps] of Object.entries(GPS_COORDINATES)) {
          if (site.nom?.toLowerCase().includes(city.toLowerCase()) ||
              site.ville?.toLowerCase().includes(city.toLowerCase())) {
            coords = gps;
            break;
          }
        }
        
        await sitesCollection.updateOne(
          { _id: site._id },
          { $set: { coordonnees: coords } }
        );
        
        console.log(`✅ GPS ajouté à ${site.nom}: ${coords.latitude}, ${coords.longitude}`);
        gpsAdded++;
      }
    }
    
    if (gpsAdded > 0) {
      console.log(`\n✅ ${gpsAdded} site(s) avec GPS ajouté\n`);
    } else {
      console.log(`\n✅ Tous les sites ont déjà des GPS\n`);
    }
    
    console.log('='.repeat(80));
    console.log('🎉 CORRECTION TERMINÉE!');
    console.log('='.repeat(80) + '\n');
    console.log('💡 Redémarrez le backend pour voir les changements:\n');
    console.log('   cd apps/backend/materials-service && npm start\n');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  }
}

fixMissingSites();
