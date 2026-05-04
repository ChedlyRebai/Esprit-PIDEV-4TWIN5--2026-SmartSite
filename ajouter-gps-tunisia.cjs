#!/usr/bin/env node

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite';

console.log('\n' + '='.repeat(80));
console.log('🇹🇳 AJOUT GPS TUNISIA - 33.8439, 9.4001');
console.log('='.repeat(80) + '\n');

async function addGPSTunisia() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connexion MongoDB établie\n');
    
    const db = client.db();
    const sitesCollection = db.collection('sites');
    
    // Coordonnées GPS de Tunisia (33.8439, 9.4001)
    const tunisiaGPS = {
      latitude: 33.8439,
      longitude: 9.4001
    };
    
    console.log(`📍 Coordonnées GPS à ajouter: ${tunisiaGPS.latitude}, ${tunisiaGPS.longitude}\n`);
    
    // Récupérer tous les sites
    const allSites = await sitesCollection.find({}).toArray();
    console.log(`📍 ${allSites.length} site(s) trouvé(s)\n`);
    
    if (allSites.length === 0) {
      console.log('❌ AUCUN SITE! Création d\'un site Tunisia par défaut...\n');
      
      const defaultSite = {
        nom: "Chantier Tunisia",
        adresse: "Tunis",
        ville: "Tunis",
        codePostal: "1000",
        pays: "Tunisia",
        coordonnees: tunisiaGPS,
        isActive: true,
        createdAt: new Date()
      };
      
      const result = await sitesCollection.insertOne(defaultSite);
      console.log(`✅ Site créé: ${result.insertedId}`);
      console.log(`   Nom: ${defaultSite.nom}`);
      console.log(`   GPS: ${tunisiaGPS.latitude}, ${tunisiaGPS.longitude}\n`);
      
      console.log('='.repeat(80));
      console.log('🎉 TERMINÉ!');
      console.log('='.repeat(80) + '\n');
      
      await client.close();
      return;
    }
    
    // Mettre à jour tous les sites
    let updated = 0;
    let alreadyOk = 0;
    
    for (const site of allSites) {
      if (!site.coordonnees?.latitude || !site.coordonnees?.longitude) {
        // Pas de GPS → ajouter Tunisia GPS
        await sitesCollection.updateOne(
          { _id: site._id },
          { $set: { coordonnees: tunisiaGPS } }
        );
        console.log(`✅ ${site.nom}: GPS ajouté (${tunisiaGPS.latitude}, ${tunisiaGPS.longitude})`);
        updated++;
      } else {
        console.log(`✓  ${site.nom}: GPS déjà présent (${site.coordonnees.latitude}, ${site.coordonnees.longitude})`);
        alreadyOk++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(80));
    console.log(`✅ Sites mis à jour: ${updated}`);
    console.log(`✓  Sites déjà OK: ${alreadyOk}`);
    console.log(`📍 Total sites: ${allSites.length}\n`);
    
    console.log('='.repeat(80));
    console.log('🎉 TERMINÉ!');
    console.log('='.repeat(80) + '\n');
    console.log('💡 Prochaines étapes:\n');
    console.log('1. Vérifier: node check-sites-gps.cjs');
    console.log('2. Corriger matériaux: node corriger-sites-manquants.cjs');
    console.log('3. Redémarrer backend: cd apps/backend/materials-service && npm start\n');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  }
}

addGPSTunisia();
