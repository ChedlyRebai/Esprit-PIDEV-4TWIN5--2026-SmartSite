const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite-materials';

async function testMaterialUpdate() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    const materialsCollection = db.collection('materials');
    
    // Get material CIM-001
    const material = await materialsCollection.findOne({ code: 'CIM-001' });
    
    if (!material) {
      console.log('❌ Material CIM-001 not found');
      return;
    }
    
    console.log('📦 BEFORE UPDATE:');
    console.log(`   Material: ${material.name} (${material.code})`);
    console.log(`   Stock Actuel: ${material.quantity}`);
    console.log(`   Stock Entree: ${material.stockEntree || 0}`);
    console.log(`   Stock Sortie: ${material.stockSortie || 0}`);
    console.log(`   Stock Existant: ${material.stockExistant || 0}`);
    console.log('');
    
    // Simulate an update with new stockEntree and stockSortie values
    const newStockEntree = (material.stockEntree || 0) + 50;
    const newStockSortie = (material.stockSortie || 0) + 20;
    
    console.log('📝 UPDATING MATERIAL...');
    console.log(`   Adding 50 to stockEntree: ${material.stockEntree || 0} → ${newStockEntree}`);
    console.log(`   Adding 20 to stockSortie: ${material.stockSortie || 0} → ${newStockSortie}`);
    console.log('');
    
    // Update the material
    const result = await materialsCollection.updateOne(
      { _id: material._id },
      {
        $set: {
          stockEntree: newStockEntree,
          stockSortie: newStockSortie,
          updatedAt: new Date(),
        }
      }
    );
    
    if (result.modifiedCount === 0) {
      console.log('⚠️ No documents were modified');
    } else {
      console.log('✅ Material updated successfully');
    }
    console.log('');
    
    // Verify the update
    const updatedMaterial = await materialsCollection.findOne({ _id: material._id });
    
    console.log('📦 AFTER UPDATE:');
    console.log(`   Material: ${updatedMaterial.name} (${updatedMaterial.code})`);
    console.log(`   Stock Actuel: ${updatedMaterial.quantity}`);
    console.log(`   Stock Entree: ${updatedMaterial.stockEntree || 0}`);
    console.log(`   Stock Sortie: ${updatedMaterial.stockSortie || 0}`);
    console.log(`   Stock Existant: ${updatedMaterial.stockExistant || 0}`);
    console.log('');
    
    // Verify the values changed
    const entreeChanged = updatedMaterial.stockEntree === newStockEntree;
    const sortieChanged = updatedMaterial.stockSortie === newStockSortie;
    
    console.log('✅ VERIFICATION:');
    console.log(`   Stock Entree updated: ${entreeChanged ? '✅ YES' : '❌ NO'}`);
    console.log(`   Stock Sortie updated: ${sortieChanged ? '✅ YES' : '❌ NO'}`);
    console.log('');
    
    if (entreeChanged && sortieChanged) {
      console.log('🎉 SUCCESS! Material update is working correctly!');
      console.log('   stockEntree and stockSortie are being saved properly.');
    } else {
      console.log('❌ FAILURE! Material update is NOT working correctly!');
      console.log('   stockEntree or stockSortie are NOT being saved.');
    }
    
    // Calculate net balance
    const netBalance = updatedMaterial.stockEntree - updatedMaterial.stockSortie;
    console.log('');
    console.log('📊 STATISTICS:');
    console.log(`   Total Entries: ${updatedMaterial.stockEntree}`);
    console.log(`   Total Exits: ${updatedMaterial.stockSortie}`);
    console.log(`   Net Balance: ${netBalance}`);
    
    // Check for anomaly
    const hasAnomaly = updatedMaterial.stockSortie > updatedMaterial.stockEntree * 1.5 && updatedMaterial.stockEntree > 0;
    if (hasAnomaly) {
      console.log(`   🚨 ANOMALIE: Sorties > Entrées × 1.5`);
      console.log(`   Ratio: ${(updatedMaterial.stockSortie / updatedMaterial.stockEntree).toFixed(2)}x`);
    } else {
      console.log(`   ✅ Pas d'anomalie détectée`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

console.log('🧪 ========== TEST MATERIAL UPDATE ==========\n');
testMaterialUpdate();
