/**
 * Script pour ajouter des dates d'expiration de test aux matériaux
 * 
 * Usage: node add-expiry-dates-test.js
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsite-materials';

async function addExpiryDates() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     AJOUT DATES EXPIRATION DE TEST                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB\n');

    const db = client.db();
    const materialsCollection = db.collection('materials');

    // Récupérer quelques matériaux actifs
    const materials = await materialsCollection
      .find({ status: 'active' })
      .limit(5)
      .toArray();

    if (materials.length === 0) {
      console.log('⚠️  Aucun matériau actif trouvé dans la base\n');
      return;
    }

    console.log(`📦 ${materials.length} matériaux trouvés\n`);

    // Ajouter des dates d'expiration variées
    const expiryDates = [
      { days: 5, label: '5 jours (CRITIQUE)' },
      { days: 14, label: '14 jours (URGENT)' },
      { days: 21, label: '21 jours (ATTENTION)' },
      { days: 28, label: '28 jours (À SURVEILLER)' },
      { days: 35, label: '35 jours (HORS PÉRIODE)' },
    ];

    console.log('🔄 Ajout des dates d\'expiration...\n');

    for (let i = 0; i < Math.min(materials.length, expiryDates.length); i++) {
      const material = materials[i];
      const expiryConfig = expiryDates[i];
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryConfig.days);

      const result = await materialsCollection.updateOne(
        { _id: material._id },
        { 
          $set: { 
            expiryDate: expiryDate,
            status: 'active' // S'assurer que le status est 'active'
          } 
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ ${material.name} (${material.code})`);
        console.log(`   Date expiration: ${expiryDate.toLocaleDateString('fr-FR')}`);
        console.log(`   Jours restants: ${expiryConfig.days}`);
        console.log(`   Catégorie: ${expiryConfig.label}\n`);
      } else {
        console.log(`⚠️  Échec pour ${material.name}\n`);
      }
    }

    // Vérifier les résultats
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 Vérification des résultats:\n');

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);

    const expiringCount = await materialsCollection.countDocuments({
      expiryDate: { $exists: true, $ne: null, $lte: targetDate, $gte: new Date() },
      status: 'active',
    });

    console.log(`✅ Matériaux expirant dans les 30 prochains jours: ${expiringCount}\n`);

    if (expiringCount > 0) {
      const expiringMaterials = await materialsCollection
        .find({
          expiryDate: { $exists: true, $ne: null, $lte: targetDate, $gte: new Date() },
          status: 'active',
        })
        .sort({ expiryDate: 1 })
        .toArray();

      console.log('📋 Liste des matériaux expirants:\n');
      expiringMaterials.forEach((m, index) => {
        const daysToExpiry = Math.ceil((m.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const severity = daysToExpiry <= 7 ? '🚨 CRITIQUE' : daysToExpiry <= 14 ? '⚠️  URGENT' : '📅 ATTENTION';
        console.log(`   ${index + 1}. ${m.name} (${m.code})`);
        console.log(`      Expire dans: ${daysToExpiry} jours`);
        console.log(`      Date: ${m.expiryDate.toLocaleDateString('fr-FR')}`);
        console.log(`      Sévérité: ${severity}\n`);
      });
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ Données de test ajoutées avec succès!\n');
    console.log('🧪 Testez maintenant l\'endpoint:\n');
    console.log('   curl http://localhost:3009/api/materials/expiring?days=30\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('✅ Connexion fermée\n');
  }
}

// Exécuter le script
addExpiryDates().catch(console.error);
