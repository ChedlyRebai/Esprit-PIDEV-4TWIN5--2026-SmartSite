/**
 * Script pour tester l'enrichissement des matériaux avec les sites
 * Simule ce que fait getExpiringMaterials()
 * 
 * Usage: node test-site-enrichment.js
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';

async function testSiteEnrichment() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     TEST ENRICHISSEMENT SITES POUR MATÉRIAUX EXPIRANTS         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB\n');

    // 1. Récupérer les matériaux expirants
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

    console.log(`📦 ${materials.length} matériaux expirants trouvés\n`);

    // 2. Récupérer la collection sites
    const sitesDb = client.db('smartsite');
    const sitesCollection = sitesDb.collection('sites');

    console.log('═'.repeat(80));
    console.log('\n🔄 Enrichissement des matériaux avec les sites:\n');

    // 3. Enrichir chaque matériau
    const enrichedMaterials = [];

    for (const material of materials) {
      const siteIdStr = material.siteId?.toString();
      const daysToExpiry = Math.ceil((material.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      let siteData = null;
      if (material.siteId) {
        try {
          siteData = await sitesCollection.findOne({ _id: material.siteId });
        } catch (e) {
          console.log(`   ❌ Erreur récupération site: ${e.message}`);
        }
      }

      const siteName = siteData?.nom || siteData?.name || (siteIdStr ? 'Site assigné' : 'Non assigné');
      const siteAddress = siteData?.adresse || siteData?.address || '';
      const siteCoordinates = siteData?.coordinates || null;

      const enriched = {
        _id: material._id,
        name: material.name,
        code: material.code,
        quantity: material.quantity,
        unit: material.unit,
        expiryDate: material.expiryDate,
        daysToExpiry,
        siteId: siteIdStr || '',
        siteName,
        siteAddress,
        siteCoordinates,
      };

      enrichedMaterials.push(enriched);

      // Afficher le résultat
      console.log(`${material.name} (${material.code})`);
      console.log(`   Expire dans: ${daysToExpiry} jour(s)`);
      console.log(`   Site ID: ${siteIdStr || 'Aucun'}`);
      console.log(`   Site trouvé: ${siteData ? '✅ OUI' : '❌ NON'}`);
      console.log(`   Site Name: ${siteName}`);
      console.log(`   Site Address: ${siteAddress || 'N/A'}`);
      if (siteCoordinates) {
        console.log(`   Coordonnées: lat=${siteCoordinates.lat}, lng=${siteCoordinates.lng}`);
      }
      console.log('');
    }

    console.log('═'.repeat(80));
    console.log('\n📊 Résumé:\n');

    const withValidSite = enrichedMaterials.filter(m => m.siteName !== 'Non assigné' && m.siteName !== 'Site assigné').length;
    const withSiteAssigned = enrichedMaterials.filter(m => m.siteName === 'Site assigné').length;
    const withoutSite = enrichedMaterials.filter(m => m.siteName === 'Non assigné').length;

    console.log(`   • Matériaux avec site valide: ${withValidSite} ✅`);
    console.log(`   • Matériaux avec siteId mais site non trouvé: ${withSiteAssigned} ⚠️`);
    console.log(`   • Matériaux sans site: ${withoutSite} ❌`);

    console.log('\n═'.repeat(80));
    console.log('\n📋 Données enrichies (format JSON):\n');
    console.log(JSON.stringify(enrichedMaterials, null, 2));

    console.log('\n═'.repeat(80));
    console.log('\n💡 RÉSULTAT:\n');

    if (withValidSite === materials.length) {
      console.log('   ✅ SUCCÈS: Tous les matériaux ont des sites valides!');
      console.log('   ✅ Le frontend devrait afficher les noms de sites correctement.\n');
    } else if (withSiteAssigned > 0) {
      console.log('   ⚠️  ATTENTION: Certains matériaux ont un siteId mais le site n\'existe pas.');
      console.log('   ⚠️  Ces matériaux afficheront "Site assigné" au lieu du nom réel.\n');
      console.log('   💡 Solution: Exécuter assign-valid-sites.js pour corriger\n');
    } else {
      console.log('   ❌ PROBLÈME: Aucun site valide trouvé.');
      console.log('   ❌ Tous les matériaux afficheront "Non assigné".\n');
    }

    console.log('🧪 Prochaines étapes:\n');
    console.log('   1. Si des sites sont invalides, exécuter:');
    console.log('      node assign-valid-sites.js\n');
    console.log('   2. Redémarrer le service materials:');
    console.log('      cd apps/backend/materials-service');
    console.log('      npm run start:dev\n');
    console.log('   3. Tester l\'API:');
    console.log('      curl http://localhost:3009/api/materials/expiring?days=30\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('✅ Connexion fermée\n');
  }
}

// Exécuter le test
testSiteEnrichment().catch(console.error);
