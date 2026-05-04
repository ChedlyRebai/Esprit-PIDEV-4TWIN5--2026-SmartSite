#!/usr/bin/env node

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite';

console.log('\n' + '='.repeat(80));
console.log('📦 CRÉATION MATÉRIAUX DE TEST AVEC GPS');
console.log('='.repeat(80) + '\n');

async function creerMateriauxTest() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connexion MongoDB établie\n');
    
    const db = client.db();
    const sitesCollection = db.collection('sites');
    const materialsCollection = db.collection('materials');
    
    // 1. Récupérer le premier site
    const site = await sitesCollection.findOne({});
    
    if (!site) {
      console.log('❌ Aucun site trouvé! Créez d\'abord un site.\n');
      await client.close();
      return;
    }
    
    console.log(`📍 Site trouvé: ${site.nom}`);
    console.log(`   _id: ${site._id}`);
    console.log(`   GPS: ${site.coordonnees?.latitude}, ${site.coordonnees?.longitude}\n`);
    
    // 2. Vérifier si des matériaux existent déjà
    const existingCount = await materialsCollection.countDocuments({});
    console.log(`📦 Matériaux existants: ${existingCount}\n`);
    
    if (existingCount > 0) {
      console.log('⚠️  Des matériaux existent déjà. Voulez-vous continuer? (Ctrl+C pour annuler)\n');
      // Attendre 3 secondes
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // 3. Créer des matériaux de test
    const materiaux = [
      {
        name: 'Ciment Portland',
        code: 'CIM001',
        category: 'cement',
        unit: 'bag',
        quantity: 100,
        minimumStock: 20,
        maximumStock: 200,
        stockMinimum: 20,
        reorderPoint: 30,
        siteId: site._id,
        status: 'active',
        barcode: `MAT-${Date.now()}-001`,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Fer à Béton 12mm',
        code: 'FER012',
        category: 'iron',
        unit: 'kg',
        quantity: 500,
        minimumStock: 100,
        maximumStock: 1000,
        stockMinimum: 100,
        reorderPoint: 150,
        siteId: site._id,
        status: 'active',
        barcode: `MAT-${Date.now()}-002`,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Sable Fin',
        code: 'SAB001',
        category: 'sand',
        unit: 'm³',
        quantity: 50,
        minimumStock: 10,
        maximumStock: 100,
        stockMinimum: 10,
        reorderPoint: 15,
        siteId: site._id,
        status: 'active',
        barcode: `MAT-${Date.now()}-003`,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Gravier 15/25',
        code: 'GRA001',
        category: 'gravel',
        unit: 'm³',
        quantity: 30,
        minimumStock: 10,
        maximumStock: 80,
        stockMinimum: 10,
        reorderPoint: 15,
        siteId: site._id,
        status: 'active',
        barcode: `MAT-${Date.now()}-004`,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Brique Rouge',
        code: 'BRI001',
        category: 'brick',
        unit: 'pieces',
        quantity: 1000,
        minimumStock: 200,
        maximumStock: 5000,
        stockMinimum: 200,
        reorderPoint: 300,
        siteId: site._id,
        status: 'active',
        barcode: `MAT-${Date.now()}-005`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    console.log('📦 Création de 5 matériaux de test...\n');
    
    const result = await materialsCollection.insertMany(materiaux);
    
    console.log(`✅ ${result.insertedCount} matériaux créés!\n`);
    
    // 4. Afficher les matériaux créés
    console.log('📋 MATÉRIAUX CRÉÉS:\n');
    
    for (const [index, material] of materiaux.entries()) {
      console.log(`${index + 1}. ${material.name} (${material.code})`);
      console.log(`   Quantité: ${material.quantity} ${material.unit}`);
      console.log(`   Site: ${site.nom}`);
      console.log(`   GPS: ${site.coordonnees?.latitude}, ${site.coordonnees?.longitude}`);
      console.log('');
    }
    
    console.log('='.repeat(80));
    console.log('🎉 TERMINÉ!');
    console.log('='.repeat(80) + '\n');
    console.log('🚀 Prochaines étapes:\n');
    console.log('1. Ouvrir l\'application');
    console.log('2. Aller dans Materials');
    console.log('3. Vérifier que les GPS s\'affichent: 📍 33.8439, 9.4001\n');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

creerMateriauxTest();
