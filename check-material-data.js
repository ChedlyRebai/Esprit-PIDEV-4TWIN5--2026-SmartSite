/**
 * Script pour vérifier les données du matériau dans MongoDB
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsite-materials';
const MATERIAL_NAME = 'Peinture blanche';

async function checkMaterialData() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Récupérer le matériau
    const Material = mongoose.model('Material', new mongoose.Schema({}, { strict: false }));
    const material = await Material.findOne({ name: MATERIAL_NAME }).lean();

    if (!material) {
      console.error(`❌ Matériau "${MATERIAL_NAME}" non trouvé`);
      process.exit(1);
    }

    console.log('📦 Matériau trouvé:');
    console.log(`   ID: ${material._id}`);
    console.log(`   Nom: ${material.name}`);
    console.log(`   Code: ${material.code}`);
    console.log(`   Catégorie: ${material.category}`);
    console.log(`   Quantité: ${material.quantity} ${material.unit}`);
    console.log(`   Site ID: ${material.siteId || 'NON ASSIGNÉ'}`);

    if (material.siteId) {
      console.log('\n🏗️ Vérification du site...');
      
      // Vérifier dans la base smartsite
      const siteConnection = mongoose.createConnection('mongodb://localhost:27017/smartsite');
      await new Promise((resolve, reject) => {
        siteConnection.once('open', resolve);
        siteConnection.once('error', reject);
      });
      
      const Site = siteConnection.model('Site', new mongoose.Schema({}, { strict: false }), 'sites');
      const site = await Site.findById(material.siteId).lean();

      if (site) {
        console.log('✅ Site trouvé:');
        console.log(`   ID: ${site._id}`);
        console.log(`   Nom: ${site.nom || site.name}`);
        console.log(`   Ville: ${site.ville || site.city}`);
        console.log(`   Adresse: ${site.adresse || site.address}`);
        console.log(`   Coordonnées:`, site.coordinates || site.coordonnees || 'NON DISPONIBLES');
        
        if (site.coordinates) {
          console.log(`   ✅ Format coordinates: { lat: ${site.coordinates.lat}, lng: ${site.coordinates.lng} }`);
        } else if (site.coordonnees) {
          console.log(`   ✅ Format coordonnees: { latitude: ${site.coordonnees.latitude}, longitude: ${site.coordonnees.longitude} }`);
        } else {
          console.log('   ⚠️ Aucune coordonnée trouvée!');
        }
      } else {
        console.log(`❌ Site ${material.siteId} non trouvé dans la base smartsite`);
      }

      await siteConnection.close();
    } else {
      console.log('\n⚠️ Ce matériau n\'a pas de site assigné!');
      console.log('   Pour assigner un site, utilisez l\'interface de l\'application.');
    }

    // Vérifier les mouvements
    console.log('\n📊 Vérification des mouvements...');
    const MaterialFlowLog = mongoose.model('MaterialFlowLog', new mongoose.Schema({}, { strict: false }));
    const movementsCount = await MaterialFlowLog.countDocuments({ materialId: material._id });
    console.log(`   ${movementsCount} mouvements trouvés`);

    if (movementsCount > 0) {
      const movements = await MaterialFlowLog.find({ materialId: material._id })
        .sort({ timestamp: -1 })
        .limit(5)
        .lean();
      
      console.log('\n   Derniers mouvements:');
      movements.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.type}: ${m.quantity} unités - ${m.reason || 'Pas de raison'}`);
      });
    } else {
      console.log('   ⚠️ Aucun mouvement enregistré pour ce matériau');
      console.log('   Utilisez test-create-movements.html pour créer des mouvements de test');
    }

    await mongoose.disconnect();
    console.log('\n✅ Vérification terminée');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkMaterialData();
