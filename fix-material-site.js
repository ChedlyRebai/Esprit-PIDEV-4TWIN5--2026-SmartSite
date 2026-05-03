/**
 * Script pour assigner un site avec coordonnées GPS au matériau
 */

import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017';
const MATERIAL_NAME = 'Peinture blanche';
const SITE_NAME = 'test 4';

async function fixMaterialSite() {
  console.log('🔧 CORRECTION DU SITE ET DES COORDONNÉES\n');
  console.log('='.repeat(80));

  try {
    // Connexion à smartsite-materials
    await mongoose.connect(`${MONGODB_URI}/smartsite-materials`);
    console.log('✅ Connecté à smartsite-materials');

    // Récupérer le matériau
    const Material = mongoose.model('Material', new mongoose.Schema({}, { strict: false }));
    const material = await Material.findOne({ name: MATERIAL_NAME });

    if (!material) {
      console.error(`❌ Matériau "${MATERIAL_NAME}" non trouvé`);
      process.exit(1);
    }

    console.log(`✅ Matériau trouvé: ${material._id}`);

    // Connexion à smartsite
    const siteConnection = mongoose.createConnection(`${MONGODB_URI}/smartsite`);
    await new Promise((resolve, reject) => {
      siteConnection.once('open', resolve);
      siteConnection.once('error', reject);
    });
    console.log('✅ Connecté à smartsite');

    // Récupérer ou créer le site
    const Site = siteConnection.model('Site', new mongoose.Schema({}, { strict: false }), 'sites');
    let site = await Site.findOne({ nom: SITE_NAME });

    if (!site) {
      console.log(`⚠️ Site "${SITE_NAME}" non trouvé, création...`);
      
      site = new Site({
        nom: SITE_NAME,
        ville: 'Gabès',
        adresse: 'Gabès, Tunisie',
        coordonnees: {
          latitude: 33.8439,
          longitude: 9.4001
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await site.save();
      console.log(`✅ Site créé: ${site._id}`);
    } else {
      console.log(`✅ Site trouvé: ${site._id}`);
      
      // Vérifier et ajouter les coordonnées si manquantes
      if (!site.coordonnees || !site.coordonnees.latitude || !site.coordonnees.longitude) {
        console.log('⚠️ Coordonnées manquantes, ajout...');
        
        site.coordonnees = {
          latitude: 33.8439,
          longitude: 9.4001
        };
        
        await site.save();
        console.log('✅ Coordonnées ajoutées au site');
      } else {
        console.log(`✅ Coordonnées existantes: ${site.coordonnees.latitude}, ${site.coordonnees.longitude}`);
      }
    }

    // Assigner le site au matériau
    if (!material.siteId || material.siteId.toString() !== site._id.toString()) {
      console.log('⚠️ Assignation du site au matériau...');
      
      material.siteId = site._id;
      await material.save();
      
      console.log('✅ Site assigné au matériau');
    } else {
      console.log('✅ Site déjà assigné au matériau');
    }

    // Résumé
    console.log('\n' + '='.repeat(80));
    console.log('✅ CORRECTION TERMINÉE\n');
    console.log('Résumé:');
    console.log(`   Matériau: ${material.name} (${material._id})`);
    console.log(`   Site: ${site.nom} (${site._id})`);
    console.log(`   Coordonnées: ${site.coordonnees.latitude}, ${site.coordonnees.longitude}`);
    console.log('\nProchaines étapes:');
    console.log('1. Redémarrez le service materials: npm start');
    console.log('2. Actualisez la page (F5)');
    console.log('3. Vérifiez que la météo et le GPS s\'affichent');

    await siteConnection.close();
    await mongoose.disconnect();

  } catch (error) {
    console.error('\n❌ ERREUR:', error);
    process.exit(1);
  }
}

fixMaterialSite();
