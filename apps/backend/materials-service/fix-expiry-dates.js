/**
 * Script pour corriger les dates d'expiration des matériaux
 * Met à jour les dates expirées avec des dates futures
 * 
 * Usage: node fix-expiry-dates.js
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsite-materials';

async function fixExpiryDates() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     CORRECTION DES DATES D\'EXPIRATION                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB (smartsite-materials)\n');

    const db = client.db();
    const materialsCollection = db.collection('materials');

    // 1. Vérifier l'état actuel
    console.log('📊 État actuel:\n');
    const totalMaterials = await materialsCollection.countDocuments();
    const withExpiry = await materialsCollection.countDocuments({
      expiryDate: { $exists: true, $ne: null }
    });
    const expiredMaterials = await materialsCollection.countDocuments({
      expiryDate: { $exists: true, $ne: null, $lt: new Date() }
    });

    console.log(`   • Total matériaux: ${totalMaterials}`);
    console.log(`   • Avec expiryDate: ${withExpiry}`);
    console.log(`   • Déjà expirés: ${expiredMaterials}\n`);

    // 2. Afficher les matériaux avec dates expirées
    if (expiredMaterials > 0) {
      console.log('⚠️  Matériaux avec dates expirées:\n');
      const expired = await materialsCollection
        .find({ expiryDate: { $exists: true, $ne: null, $lt: new Date() } })
        .toArray();

      expired.forEach((m, i) => {
        const daysAgo = Math.ceil((Date.now() - m.expiryDate.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   ${i + 1}. ${m.name} (${m.code})`);
        console.log(`      Date expiration: ${m.expiryDate.toLocaleDateString('fr-FR')}`);
        console.log(`      Expiré depuis: ${daysAgo} jour(s)`);
        console.log(`      Status: ${m.status}\n`);
      });
    }

    // 3. Mettre à jour tous les matériaux avec des dates futures variées
    console.log('🔄 Mise à jour des dates d\'expiration...\n');

    const materials = await materialsCollection
      .find({ status: 'active' })
      .toArray();

    if (materials.length === 0) {
      console.log('⚠️  Aucun matériau actif trouvé\n');
      return;
    }

    // Dates variées pour tester différents scénarios
    const expiryConfigs = [
      { days: 5, label: 'CRITIQUE (5 jours)', severity: '🚨' },
      { days: 10, label: 'URGENT (10 jours)', severity: '⚠️' },
      { days: 15, label: 'ATTENTION (15 jours)', severity: '📅' },
      { days: 20, label: 'À SURVEILLER (20 jours)', severity: '👀' },
      { days: 25, label: 'NORMAL (25 jours)', severity: '✅' },
      { days: 28, label: 'LIMITE (28 jours)', severity: '📊' },
    ];

    let updatedCount = 0;

    for (let i = 0; i < materials.length; i++) {
      const material = materials[i];
      const config = expiryConfigs[i % expiryConfigs.length];
      
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + config.days);

      const result = await materialsCollection.updateOne(
        { _id: material._id },
        { 
          $set: { 
            expiryDate: newExpiryDate,
            status: 'active'
          } 
        }
      );

      if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`${config.severity} ${material.name} (${material.code})`);
        console.log(`   Nouvelle date: ${newExpiryDate.toLocaleDateString('fr-FR')}`);
        console.log(`   Expire dans: ${config.days} jours`);
        console.log(`   Catégorie: ${config.label}\n`);
      }
    }

    console.log(`✅ ${updatedCount} matériau(x) mis à jour\n`);

    // 4. Vérifier les résultats
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
        let severity = '✅ NORMAL';
        if (daysToExpiry <= 7) severity = '🚨 CRITIQUE';
        else if (daysToExpiry <= 14) severity = '⚠️  URGENT';
        else if (daysToExpiry <= 21) severity = '📅 ATTENTION';

        console.log(`   ${index + 1}. ${m.name} (${m.code})`);
        console.log(`      Expire dans: ${daysToExpiry} jour(s)`);
        console.log(`      Date: ${m.expiryDate.toLocaleDateString('fr-FR')}`);
        console.log(`      Sévérité: ${severity}`);
        console.log(`      Quantité: ${m.quantity} ${m.unit}\n`);
      });
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ Correction terminée avec succès!\n');
    console.log('🧪 Testez maintenant:\n');
    console.log('   1. Endpoint expiring:');
    console.log('      curl http://localhost:3009/api/materials/expiring?days=30\n');
    console.log('   2. Endpoint consolidé:');
    console.log('      curl http://localhost:3009/api/materials/anomalies/consolidated?days=30\n');
    console.log('   3. Frontend:');
    console.log('      http://localhost:5173/materials → Section "Matériaux Expirants"\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('✅ Connexion fermée\n');
  }
}

// Exécuter la correction
fixExpiryDates().catch(console.error);
