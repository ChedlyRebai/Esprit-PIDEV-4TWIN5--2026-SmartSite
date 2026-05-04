const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite-materials';

async function checkMaterialStockData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    const materialsCollection = db.collection('materials');
    
    // Get all materials
    const materials = await materialsCollection.find().limit(10).toArray();
    
    console.log(`📦 Total Materials: ${materials.length}\n`);
    
    console.log('📊 Materials with Stock Data:\n');
    materials.forEach((mat, index) => {
      console.log(`${index + 1}. ${mat.name} (${mat.code})`);
      console.log(`   Stock Actuel: ${mat.quantity || 0}`);
      console.log(`   Stock Entree: ${mat.stockEntree || 0}`);
      console.log(`   Stock Sortie: ${mat.stockSortie || 0}`);
      console.log(`   Stock Existant: ${mat.stockExistant || 0}`);
      console.log(`   Minimum Stock: ${mat.minimumStock || 0}`);
      console.log(`   Maximum Stock: ${mat.maximumStock || 0}`);
      console.log(`   Stock Minimum: ${mat.stockMinimum || 0}`);
      
      // Calculate if there's anomaly
      const entree = mat.stockEntree || 0;
      const sortie = mat.stockSortie || 0;
      const hasAnomaly = sortie > entree * 1.5 && entree > 0;
      
      if (hasAnomaly) {
        console.log(`   🚨 ANOMALIE DÉTECTÉE: Sortie (${sortie}) > Entrée (${entree}) × 1.5`);
      }
      
      console.log('');
    });
    
    // Statistics
    const stats = {
      totalMaterials: materials.length,
      withStockEntree: materials.filter(m => (m.stockEntree || 0) > 0).length,
      withStockSortie: materials.filter(m => (m.stockSortie || 0) > 0).length,
      withAnomalies: materials.filter(m => {
        const entree = m.stockEntree || 0;
        const sortie = m.stockSortie || 0;
        return sortie > entree * 1.5 && entree > 0;
      }).length,
    };
    
    console.log('📈 STATISTIQUES:');
    console.log(`   Total matériaux: ${stats.totalMaterials}`);
    console.log(`   Avec Stock Entree > 0: ${stats.withStockEntree}`);
    console.log(`   Avec Stock Sortie > 0: ${stats.withStockSortie}`);
    console.log(`   Avec Anomalies: ${stats.withAnomalies}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

checkMaterialStockData();
