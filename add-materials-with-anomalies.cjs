const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite-materials';
const SITE_ID = '69ec61d9e0335d072e73b7c0'; // Site existant

const materials = [
  {
    name: 'Sable Fin',
    code: 'SAB-001',
    category: 'sable',
    quantity: 50,
    unit: 'm³',
    stockEntree: 200,
    stockSortie: 150, // Normal
    minimumStock: 20,
    maximumStock: 300,
    stockMinimum: 20,
  },
  {
    name: 'Gravier 15/25',
    code: 'GRA-001',
    category: 'gravier',
    quantity: 30,
    unit: 'm³',
    stockEntree: 100,
    stockSortie: 70, // Normal
    minimumStock: 15,
    maximumStock: 200,
    stockMinimum: 15,
  },
  {
    name: 'Fer à Béton 12mm',
    code: 'FER-012',
    category: 'fer',
    quantity: 20,
    unit: 'tonnes',
    stockEntree: 50,
    stockSortie: 80, // 🚨 ANOMALIE: Sortie > Entrée!
    minimumStock: 10,
    maximumStock: 100,
    stockMinimum: 10,
  },
  {
    name: 'Briques Creuses',
    code: 'BRI-001',
    category: 'briques',
    quantity: 5000,
    unit: 'unités',
    stockEntree: 10000,
    stockSortie: 5000, // Normal
    minimumStock: 2000,
    maximumStock: 15000,
    stockMinimum: 2000,
  },
  {
    name: 'Peinture Blanche',
    code: 'PEI-001',
    category: 'peinture',
    quantity: 10,
    unit: 'litres',
    stockEntree: 50,
    stockSortie: 90, // 🚨 ANOMALIE: Sortie excessive!
    minimumStock: 20,
    maximumStock: 100,
    stockMinimum: 20,
  },
];

async function addMaterialsWithAnomalies() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    const materialsCollection = db.collection('materials');
    
    console.log('📦 Adding materials with stock movement data...\n');
    
    for (const mat of materials) {
      // Check if material already exists
      const existing = await materialsCollection.findOne({ code: mat.code });
      
      if (existing) {
        console.log(`⚠️  Material ${mat.code} already exists, skipping...`);
        continue;
      }
      
      // Create material document
      const materialDoc = {
        ...mat,
        siteId: new ObjectId(SITE_ID),
        stockExistant: mat.quantity,
        status: 'active',
        barcode: `MAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = await materialsCollection.insertOne(materialDoc);
      
      console.log(`✅ Added: ${mat.name} (${mat.code})`);
      console.log(`   Stock Entree: ${mat.stockEntree}`);
      console.log(`   Stock Sortie: ${mat.stockSortie}`);
      console.log(`   Stock Actuel: ${mat.quantity}`);
      console.log(`   Net Balance: ${mat.stockEntree - mat.stockSortie}`);
      
      // Check for anomaly
      const hasAnomaly = mat.stockSortie > mat.stockEntree * 1.5 && mat.stockEntree > 0;
      if (hasAnomaly) {
        console.log(`   🚨 ANOMALIE DÉTECTÉE: Sortie (${mat.stockSortie}) > Entrée (${mat.stockEntree}) × 1.5`);
      } else if (mat.stockSortie > mat.stockEntree) {
        console.log(`   ⚠️  ATTENTION: Sortie (${mat.stockSortie}) > Entrée (${mat.stockEntree})`);
      }
      console.log('');
    }
    
    console.log('✅ All materials added successfully!');
    
    // Show summary
    const total = await materialsCollection.countDocuments();
    const withAnomalies = await materialsCollection.countDocuments({
      $expr: {
        $gt: ['$stockSortie', { $multiply: ['$stockEntree', 1.5] }]
      }
    });
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Total materials: ${total}`);
    console.log(`   Materials with anomalies: ${withAnomalies}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

addMaterialsWithAnomalies();
