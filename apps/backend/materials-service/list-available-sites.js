/**
 * Script pour lister les sites disponibles et assigner aux matériaux
 * 
 * Usage: node list-available-sites.js
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

async function listAndAssignSites() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     LISTE DES SITES ET ASSIGNATION AUX MATÉRIAUX              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB\n');

    // 1. Lister les sites disponibles
    const sitesDb = client.db('smartsite');
    const sitesCollection = sitesDb.collection('sites');
    const sites = await sitesCollection.find().toArray();

    console.log(`📍 Sites disponibles dans la base 'smartsite': ${sites.length}\n`);

    if (sites.length === 0) {
      console.log('⚠️  Aucun site trouvé dans la base de données\n');
      console.log('💡 Vous devez d\'abord créer des sites dans l\'application\n');
      return;
    }

    console.log('═'.repeat(80));
    sites.forEach((site, index) => {
      console.log(`\n${index + 1}. ${site.nom || site.name}`);
      console.log(`   ID: ${site._id}`);
      console.log(`   Adresse: ${site.adresse || site.address || 'Non définie'}`);
      if (site.coordinates) {
        console.log(`   Coordonnées: lat=${site.coordinates.lat}, lng=${site.coordinates.lng}`);
      }
      console.log(`   Status: ${site.status || 'N/A'}`);
    });
    console.log('\n' + '═'.repeat(80));

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

    // 3. Proposer l'assignation
    if (sites.length > 0 && materials.length > 0) {
      console.log('🔄 Assignation automatique des sites aux matériaux...\n');

      let updatedCount = 0;

      for (let i = 0; i < materials.length; i++) {
        const material = materials[i];
        const site = sites[i % sites.length]; // Rotation circulaire des sites

        // Vérifier si le siteId actuel existe
        let currentSiteExists = false;
        if (material.siteId) {
          const existingSite = await sitesCollection.findOne({ _id: material.siteId });
          currentSiteExists = !!existingSite;
        }

        if (!currentSiteExists) {
          // Assigner un site valide
          const result = await materialsCollection.updateOne(
            { _id: material._id },
            { $set: { siteId: site._id } }
          );

          if (result.modifiedCount > 0) {
            updatedCount++;
            console.log(`✅ ${material.name} (${material.code})`);
            console.log(`   Ancien site: ${material.siteId || 'Aucun'}`);
            console.log(`   Nouveau site: ${site._id} (${site.nom || site.name})\n`);
          }
        } else {
          console.log(`⏭️  ${material.name} (${material.code}) - Site déjà valide\n`);
        }
      }

      console.log('═'.repeat(80));
      console.log(`\n✅ ${updatedCount} matériau(x) mis à jour avec des sites valides\n`);
    }

    // 4. Vérification finale
    console.log('🔍 Vérification finale:\n');

    const materialsWithValidSites = await materialsCollection
      .aggregate([
        {
          $match: {
            expiryDate: { $exists: true, $ne: null, $lte: targetDate, $gte: new Date() },
            status: 'active',
          }
        },
        {
          $lookup: {
            from: 'sites',
            localField: 'siteId',
            foreignField: '_id',
            as: 'siteInfo',
            // Note: lookup cross-database ne fonctionne pas directement
          }
        }
      ])
      .toArray();

    console.log('📋 Matériaux expirants avec leurs sites:\n');

    for (const material of materials) {
      const site = await sitesCollection.findOne({ _id: material.siteId });
      const daysToExpiry = Math.ceil((material.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      console.log(`   • ${material.name} (${material.code})`);
      console.log(`     Expire dans: ${daysToExpiry} jour(s)`);
      console.log(`     Site: ${site ? (site.nom || site.name) : '❌ Non trouvé'}`);
      console.log(`     Site ID: ${material.siteId}\n`);
    }

    console.log('═'.repeat(80));
    console.log('\n💡 PROCHAINES ÉTAPES:\n');
    console.log('   1. Redémarrer le service materials:');
    console.log('      cd apps/backend/materials-service');
    console.log('      npm run start:dev\n');
    console.log('   2. Tester l\'endpoint:');
    console.log('      curl http://localhost:3009/api/materials/expiring?days=30\n');
    console.log('   3. Vérifier le frontend:');
    console.log('      http://localhost:5173/materials\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('✅ Connexion fermée\n');
  }
}

// Exécuter
listAndAssignSites().catch(console.error);
