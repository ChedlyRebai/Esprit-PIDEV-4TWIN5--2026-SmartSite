const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite-materials';

async function checkFlowLogs() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const flowLogsCollection = db.collection('materialflowlogs');
    const materialsCollection = db.collection('materials');
    
    // Count total flow logs
    const totalFlows = await flowLogsCollection.countDocuments();
    console.log(`\n📊 Total Flow Logs: ${totalFlows}`);
    
    // Get flow breakdown by type
    const flowsByType = await flowLogsCollection.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\n📈 Flow Logs by Type:');
    flowsByType.forEach(flow => {
      console.log(`  ${flow._id}: ${flow.count} movements, ${flow.totalQuantity} units total`);
    });
    
    // Get anomalies
    const anomalies = await flowLogsCollection.countDocuments({
      anomalyDetected: { $ne: 'NONE' }
    });
    console.log(`\n🚨 Total Anomalies Detected: ${anomalies}`);
    
    // Get recent flows with material names
    console.log('\n📋 Recent Flow Logs (last 10):');
    const recentFlows = await flowLogsCollection.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    for (const flow of recentFlows) {
      const material = await materialsCollection.findOne({ _id: flow.materialId });
      console.log(`\n  ${flow.type} - ${flow.quantity} units`);
      console.log(`    Material: ${material?.name || 'Unknown'} (${material?.code || 'N/A'})`);
      console.log(`    Date: ${new Date(flow.timestamp).toLocaleString()}`);
      console.log(`    Stock: ${flow.previousStock} → ${flow.newStock}`);
      if (flow.anomalyDetected && flow.anomalyDetected !== 'NONE') {
        console.log(`    🚨 ANOMALY: ${flow.anomalyDetected}`);
        console.log(`    Message: ${flow.anomalyMessage}`);
      }
    }
    
    // Check materials with stockEntree/stockSortie
    console.log('\n\n📦 Materials with Stock In/Out data:');
    const materialsWithStock = await materialsCollection.find({
      $or: [
        { stockEntree: { $exists: true, $gt: 0 } },
        { stockSortie: { $exists: true, $gt: 0 } }
      ]
    }).limit(5).toArray();
    
    materialsWithStock.forEach(mat => {
      console.log(`\n  ${mat.name} (${mat.code})`);
      console.log(`    Stock Entree: ${mat.stockEntree || 0}`);
      console.log(`    Stock Sortie: ${mat.stockSortie || 0}`);
      console.log(`    Current Stock: ${mat.quantity || 0}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

checkFlowLogs();
