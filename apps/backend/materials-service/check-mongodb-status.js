/**
 * Script pour vérifier le statut de MongoDB et les bases de données disponibles
 * 
 * Usage: node check-mongodb-status.js
 */

const { MongoClient } = require('mongodb');

async function checkMongoDB() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     VÉRIFICATION STATUT MONGODB                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Essayer différentes URIs
  const uris = [
    'mongodb://localhost:27017',
    'mongodb://127.0.0.1:27017',
  ];

  for (const uri of uris) {
    console.log(`🔍 Test de connexion: ${uri}\n`);
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });

    try {
      await client.connect();
      console.log('✅ Connexion réussie!\n');

      // Lister toutes les bases de données
      const adminDb = client.db().admin();
      const dbs = await adminDb.listDatabases();

      console.log('📊 Bases de données disponibles:\n');
      for (const db of dbs.databases) {
        console.log(`   • ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
      }
      console.log('');

      // Vérifier les bases de données SmartSite
      const smartsiteDbs = ['smartsite', 'smartsite-materials', 'smartsite-fournisseurs'];
      
      for (const dbName of smartsiteDbs) {
        console.log(`\n🔍 Vérification de la base: ${dbName}`);
        console.log('─'.repeat(60));
        
        const db = client.db(dbName);
        
        try {
          const collections = await db.listCollections().toArray();
          
          if (collections.length === 0) {
            console.log(`   ⚠️  Base vide (aucune collection)`);
          } else {
            console.log(`   ✅ ${collections.length} collection(s) trouvée(s):\n`);
            
            for (const coll of collections) {
              const collection = db.collection(coll.name);
              const count = await collection.countDocuments();
              console.log(`      • ${coll.name}: ${count} document(s)`);
            }
          }
        } catch (error) {
          console.log(`   ❌ Erreur: ${error.message}`);
        }
      }

      // Vérifier spécifiquement la collection materials
      console.log('\n\n🔍 Vérification détaillée de la collection "materials"');
      console.log('═'.repeat(60));
      
      for (const dbName of smartsiteDbs) {
        try {
          const db = client.db(dbName);
          const materialsCollection = db.collection('materials');
          const count = await materialsCollection.countDocuments();
          
          if (count > 0) {
            console.log(`\n✅ Trouvé dans: ${dbName}`);
            console.log(`   Total matériaux: ${count}`);
            
            // Vérifier les matériaux avec expiryDate
            const withExpiry = await materialsCollection.countDocuments({
              expiryDate: { $exists: true, $ne: null }
            });
            console.log(`   Avec expiryDate: ${withExpiry}`);
            
            // Afficher quelques exemples
            const samples = await materialsCollection.find().limit(3).toArray();
            console.log('\n   📋 Exemples de matériaux:');
            samples.forEach((m, i) => {
              console.log(`      ${i + 1}. ${m.name} (${m.code})`);
              console.log(`         Status: ${m.status}`);
              console.log(`         ExpiryDate: ${m.expiryDate || 'Non définie'}`);
            });
          } else {
            console.log(`\n⚠️  Collection vide dans: ${dbName}`);
          }
        } catch (error) {
          console.log(`\n❌ Erreur dans ${dbName}: ${error.message}`);
        }
      }

      await client.close();
      console.log('\n\n✅ Vérification terminée\n');
      return; // Succès, on arrête ici

    } catch (error) {
      console.log(`❌ Échec de connexion: ${error.message}\n`);
      await client.close();
    }
  }

  console.log('❌ Impossible de se connecter à MongoDB sur aucune URI\n');
  console.log('💡 SOLUTIONS:\n');
  console.log('   1. Vérifier que MongoDB est installé et démarré');
  console.log('   2. Démarrer MongoDB avec: mongod --dbpath <chemin>');
  console.log('   3. Ou démarrer via Docker: docker run -d -p 27017:27017 mongo:latest');
  console.log('   4. Vérifier le service Windows: services.msc → MongoDB\n');
}

// Exécuter la vérification
checkMongoDB().catch(console.error);
