const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite-materials';

async function addStockMovementData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    const materialsCollection = db.collection('materials');
    
    // Get all materials
    const materials = await materialsCollection.find().toArray();
    
    console.log(`📦 Found ${materials.length} materials\n`);
    
    for (const material of materials) {
      // Generate realistic stock movement data
      const currentStock = material.quantity || 0;
      
      // Simulate stock movements based on current stock
      let stockEntree, stockSortie;
      
      if (currentStock > 0) {
        // If there's stock, simulate that there were entries and some exits
        stockEntree = Math.floor(currentStock * 1.5 + Math.random() * 50);
        stockSortie = stockEntree - currentStock;
      } else {
        // If no stock, all entries were consumed
        stockEntree = Math.floor(Math.random() * 100 + 50);
        stockSortie = stockEntree;
      }
      
      // Ensure sortie doesn't exceed entree
      if (stockSortie > stockEntree) {
        stockSortie = stockEntree;
      }
      
      // Update material with stock movement data
      const result = await materialsCollection.updateOne(
        { _id: material._id },
        {
          $set: {
            stockEntree: stockEntree,
            stockSortie: stockSortie,
            stockExistant: currentStock,
          }
        }
      );
      
      console.log(`✅ Updated: ${material.name}`);
      console.log(`   Stock Entree: ${stockEntree}`);
      console.log(`   Stock Sortie: ${stockSortie}`);
      console.log(`   Stock Existant: ${currentStock}`);
      console.log(`   Net Balance: ${stockEntree - stockSortie}`);
      
      // Check for anomaly
      if (stockSortie > stockEntree * 1.5 && stockEntree > 0) {
        console.log(`   🚨 ANOMALIE: Sortie excessive!`);
      }
      console.log('');
    }
    
    console.log('✅ All materials updated with stock movement data!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

addStockMovementData();
