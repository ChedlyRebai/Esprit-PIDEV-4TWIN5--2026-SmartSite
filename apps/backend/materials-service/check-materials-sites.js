/**
 * Script pour vérifier les siteId des matériaux expirants
 * 
 * Usage: node check-materials-sites.js
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsite-materials';

async function checkMaterialsSites() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     VÉRIFICATION SITES DES MATÉRIAUX EXPIRANTS                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB (smartsite-materials)\n');

    const db = client.db();
    const materialsCollection = db.collection('materials');

    // Récupérer les matériaux expirants
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

    if (materials.length === 0) {
      console.log('⚠️  Aucun matériau expirant trouvé\n');
      return;
    }

    console.log('📋 Détails des matériaux:\n');
    console.log('═'.repeat(80));

    for (const material of materials) {
      const daysToExpiry = Math.ceil((material.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      console.log(`\n${material.name} (${material.code})`);
      console.log('─'.repeat(80));
      console.log(`   Expire dans: ${daysToExpiry} jour(s)`);
      console.log(`   Date expiration: ${material.expiryDate.toLocaleDateString('fr-FR')}`);
      console.log(`   Quantité: ${material.quantity} ${material.unit}`);
      console.log(`   Status: ${material.status}`);
      
      if (material.siteId) {
        console.log(`   ✅ Site ID: ${material.siteId}`);
        console.log(`   Type: ${typeof material.siteId}`);
        
        // Vérifier si le site existe dans la base smartsite
        try {
          const sitesDb = client.db('smartsite');
          const sitesCollection = sitesDb.collection('sites');
          const site = await sitesCollection.findOne({ _id: material.siteId });
          
          if (site) {
            console.log(`   ✅ Site trouvé: ${site.nom || site.name}`);
            console.log(`   Adresse: ${site.adresse || site.address || 'Non définie'}`);
            if (site.coordinates) {
              console.log(`   Coordonnées: lat=${site.coordinates.lat}, lng=${site.coordinates.lng}`);
            }
          } else {
            console.log(`   ⚠️  Site non trouvé dans la base 'smartsite'`);
          }
        } catch (error) {
          console.log(`   ❌ Erreur lors de la recherche du site: ${error.message}`);
        }
      } else {
        console.log(`   ❌ Pas de siteId assigné`);
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 Résumé:\n');

    const withSite = materials.filter(m => m.siteId).length;
    const withoutSite = materials.filter(m => !m.siteId).length;

    console.log(`   • Matériaux avec site assigné: ${withSite}`);
    console.log(`   • Matériaux sans site: ${withoutSite}`);

    if (withoutSite > 0) {
      console.log('\n💡 SUGGESTION: Assigner des sites aux matériaux\n');
      console.log('Exemple de commande MongoDB:\n');
      console.log('```javascript');
      console.log('// Récupérer un site existant');
      console.log('const site = db.getSiblingDB("smartsite").sites.findOne();');
      console.log('console.log("Site ID:", site._id);\n');
      console.log('// Assigner le site à un matériau');
      console.log('db.materials.updateOne(');
      console.log('  { code: "CIM-001" },');
      console.log('  { $set: { siteId: site._id } }');
      console.log(');\n');
      console.log('// Vérifier');
      console.log('db.materials.findOne({ code: "CIM-001" }, { name: 1, siteId: 1 });');
      console.log('```\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('✅ Connexion fermée\n');
  }
}

// Exécuter la vérification
checkMaterialsSites().catch(console.error);
