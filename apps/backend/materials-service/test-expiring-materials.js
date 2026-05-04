/**
 * Script de test pour vérifier la détection des matériaux expirants
 * 
 * Usage: node test-expiring-materials.js
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsite-materials';

async function testExpiringMaterials() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     TEST DETECTION MATERIAUX EXPIRANTS                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB\n');

    const db = client.db();
    const materialsCollection = db.collection('materials');

    // 1. Compter tous les matériaux
    const totalCount = await materialsCollection.countDocuments();
    console.log(`📊 Total matériaux dans la base: ${totalCount}\n`);

    // 2. Vérifier les matériaux avec expiryDate
    const withExpiryDate = await materialsCollection.countDocuments({
      expiryDate: { $exists: true, $ne: null }
    });
    console.log(`📅 Matériaux avec expiryDate définie: ${withExpiryDate}\n`);

    // 3. Afficher quelques exemples
    if (withExpiryDate > 0) {
      console.log('📋 Exemples de matériaux avec expiryDate:\n');
      const examples = await materialsCollection
        .find({ expiryDate: { $exists: true, $ne: null } })
        .limit(5)
        .toArray();

      examples.forEach((m, index) => {
        const expiryDate = new Date(m.expiryDate);
        const daysToExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        console.log(`   ${index + 1}. ${m.name} (${m.code})`);
        console.log(`      Date expiration: ${expiryDate.toLocaleDateString('fr-FR')}`);
        console.log(`      Jours restants: ${daysToExpiry}`);
        console.log(`      Status: ${m.status}`);
        console.log('');
      });
    }

    // 4. Tester la requête exacte utilisée par le service
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);

    console.log(`🔍 Test de la requête du service (30 jours):`);
    console.log(`   Date actuelle: ${new Date().toLocaleDateString('fr-FR')}`);
    console.log(`   Date cible: ${targetDate.toLocaleDateString('fr-FR')}\n`);

    const expiringMaterials = await materialsCollection
      .find({
        expiryDate: { $exists: true, $ne: null, $lte: targetDate, $gte: new Date() },
        status: 'active',
      })
      .sort({ expiryDate: 1 })
      .toArray();

    console.log(`✅ Matériaux expirants trouvés: ${expiringMaterials.length}\n`);

    if (expiringMaterials.length > 0) {
      console.log('📋 Liste des matériaux expirants:\n');
      expiringMaterials.forEach((m, index) => {
        const expiryDate = new Date(m.expiryDate);
        const daysToExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        console.log(`   ${index + 1}. ${m.name} (${m.code})`);
        console.log(`      Date expiration: ${expiryDate.toLocaleDateString('fr-FR')}`);
        console.log(`      Jours restants: ${daysToExpiry}`);
        console.log(`      Status: ${m.status}`);
        console.log(`      Site ID: ${m.siteId || 'Non assigné'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  Aucun matériau expirant trouvé avec la requête du service\n');
      
      // Diagnostic
      console.log('🔍 DIAGNOSTIC:\n');
      
      // Vérifier les matériaux avec status != 'active'
      const inactiveWithExpiry = await materialsCollection.countDocuments({
        expiryDate: { $exists: true, $ne: null },
        status: { $ne: 'active' }
      });
      console.log(`   • Matériaux avec expiryDate mais status != 'active': ${inactiveWithExpiry}`);
      
      // Vérifier les matériaux avec expiryDate dans le passé
      const expiredMaterials = await materialsCollection.countDocuments({
        expiryDate: { $exists: true, $ne: null, $lt: new Date() },
        status: 'active'
      });
      console.log(`   • Matériaux déjà expirés (dans le passé): ${expiredMaterials}`);
      
      // Vérifier les matériaux avec expiryDate > 30 jours
      const futureExpiry = await materialsCollection.countDocuments({
        expiryDate: { $exists: true, $ne: null, $gt: targetDate },
        status: 'active'
      });
      console.log(`   • Matériaux expirant dans plus de 30 jours: ${futureExpiry}`);
      
      // Afficher tous les matériaux avec expiryDate (peu importe le status)
      console.log('\n📋 Tous les matériaux avec expiryDate (tous status):\n');
      const allWithExpiry = await materialsCollection
        .find({ expiryDate: { $exists: true, $ne: null } })
        .toArray();
      
      allWithExpiry.forEach((m, index) => {
        const expiryDate = new Date(m.expiryDate);
        const daysToExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        console.log(`   ${index + 1}. ${m.name} (${m.code})`);
        console.log(`      Date expiration: ${expiryDate.toLocaleDateString('fr-FR')}`);
        console.log(`      Jours restants: ${daysToExpiry}`);
        console.log(`      Status: ${m.status}`);
        console.log(`      Dans la période? ${daysToExpiry >= 0 && daysToExpiry <= 30 ? 'OUI ✅' : 'NON ❌'}`);
        console.log('');
      });
    }

    // 5. Proposer d'ajouter des données de test
    if (withExpiryDate === 0) {
      console.log('\n💡 SUGGESTION: Ajouter des dates d\'expiration de test\n');
      console.log('Exécutez ces commandes dans MongoDB:\n');
      console.log('```javascript');
      console.log('// Ajouter une date d\'expiration dans 15 jours');
      console.log('db.materials.updateOne(');
      console.log('  { code: "CIM001" },');
      console.log('  { $set: { expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) } }');
      console.log(');\n');
      console.log('// Ajouter une date d\'expiration dans 25 jours');
      console.log('db.materials.updateOne(');
      console.log('  { code: "PEIN001" },');
      console.log('  { $set: { expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000) } }');
      console.log(');\n');
      console.log('// Vérifier');
      console.log('db.materials.find({ expiryDate: { $exists: true } }).pretty();');
      console.log('```\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('\n✅ Connexion fermée\n');
  }
}

// Exécuter le test
testExpiringMaterials().catch(console.error);
