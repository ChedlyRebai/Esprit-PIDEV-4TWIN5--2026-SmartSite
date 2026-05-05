/**
 * Script pour assigner des sites valides aux matériaux expirants
 * 
 * Usage: node assign-valid-sites.js
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';

async function assignValidSites() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     ASSIGNATION DE SITES VALIDES AUX MATÉRIAUX                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB\n');

    // 1. Récupérer les sites disponibles
    const sitesDb = client.db('smartsite');
    const sitesCollection = sitesDb.collection('sites');
    const sites = await sitesCollection.find().toArray();

    console.log(`📍 Sites disponibles: ${sites.length}\n`);

    if (sites.length === 0) {
      console.log('❌ Aucun site disponible. Créez d\'abord des sites.\n');
      return;
    }

    sites.forEach((site, i) => {
      console.log(`   ${i + 1}. ${site.nom || site.name} (${site._id})`);
      console.log(`      Adresse: ${site.adresse || site.address || 'N/A'}\n`);
    });

    // 2. Récupérer les matériaux expirants
    const materialsDb = client.db('smartsite-materials');
    const materialsCollection = materialsDb.collection('materials');

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);

    const materials = await materialsCollection
      .find({
        expiryDate: { $exists: true, $ne: null, $lte: targetDate, $gte: new Date() },
        status: 'active',
      })
      .sort({ expiryDate: 1 })
      .toArray();

    console.log(`\n📦 Matériaux expirants: ${materials.length}\n`);
    console.log('═'.repeat(80));

    // 3. Assigner les sites
    console.log('\n🔄 Assignation des sites...\n');

    for (let i = 0; i < materials.length; i++) {
      const material = materials[i];
      const site = sites[i % sites.length]; // Rotation circulaire

      console.log(`${i + 1}. ${material.name} (${material.code})`);
      console.log(`   Ancien siteId: ${material.siteId}`);
      console.log(`   Nouveau siteId: ${site._id}`);
      console.log(`   Nouveau site: ${site.nom || site.name}`);

      // Mise à jour
      const result = await materialsCollection.updateOne(
        { _id: material._id },
        { $set: { siteId: new ObjectId(site._id) } }
      );

      if (result.modifiedCount > 0) {
        console.log(`   ✅ Mis à jour\n`);
      } else {
        console.log(`   ⚠️  Pas de changement\n`);
      }
    }

    console.log('═'.repeat(80));

    // 4. Vérification
    console.log('\n🔍 Vérification après mise à jour:\n');

    const updatedMaterials = await materialsCollection
      .find({
        expiryDate: { $exists: true, $ne: null, $lte: targetDate, $gte: new Date() },
        status: 'active',
      })
      .sort({ expiryDate: 1 })
      .toArray();

    for (const material of updatedMaterials) {
      const site = await sitesCollection.findOne({ _id: material.siteId });
      const daysToExpiry = Math.ceil((material.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      console.log(`   • ${material.name} (${material.code})`);
      console.log(`     Expire dans: ${daysToExpiry} jour(s)`);
      console.log(`     Site ID: ${material.siteId}`);
      console.log(`     Site: ${site ? (site.nom || site.name) : '❌ NON TROUVÉ'}`);
      
      if (site) {
        console.log(`     ✅ Site valide`);
      } else {
        console.log(`     ❌ Site invalide`);
      }
      console.log('');
    }

    console.log('═'.repeat(80));
    console.log('\n✅ Assignation terminée!\n');
    console.log('🧪 Testez maintenant:\n');
    console.log('   1. Redémarrer le service:');
    console.log('      cd apps/backend/materials-service');
    console.log('      npm run start:dev\n');
    console.log('   2. Tester l\'API:');
    console.log('      curl http://localhost:3009/api/materials/expiring?days=30\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('✅ Connexion fermée\n');
  }
}

// Exécuter
assignValidSites().catch(console.error);
