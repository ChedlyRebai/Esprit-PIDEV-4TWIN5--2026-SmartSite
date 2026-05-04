const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite-materials';

async function verifyFlowLogs() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    const materialsCollection = db.collection('materials');
    const flowLogsCollection = db.collection('materialflowlogs');
    
    // Get material CIM-001
    const material = await materialsCollection.findOne({ code: 'CIM-001' });
    
    if (!material) {
      console.log('❌ Material CIM-001 not found');
      return;
    }
    
    console.log('📦 MATERIAL: Ciment Portland (CIM-001)');
    console.log(`   _id: ${material._id}`);
    console.log(`   Stock Actuel: ${material.quantity}`);
    console.log(`   Stock Entree: ${material.stockEntree || 0}`);
    console.log(`   Stock Sortie: ${material.stockSortie || 0}`);
    console.log(`   Net Balance: ${(material.stockEntree || 0) - (material.stockSortie || 0)}`);
    console.log('');
    
    // Get flow logs for this material
    const flowLogs = await flowLogsCollection
      .find({ materialId: material._id })
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();
    
    console.log(`📊 FLOW LOGS (${flowLogs.length} total):\n`);
    
    if (flowLogs.length === 0) {
      console.log('⚠️ No flow logs found for this material');
    } else {
      flowLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.type} - ${log.quantity} unités`);
        console.log(`   Date: ${new Date(log.timestamp).toLocaleString()}`);
        console.log(`   Raison: ${log.reason || 'N/A'}`);
        console.log(`   Stock: ${log.previousStock} → ${log.newStock}`);
        if (log.anomalyDetected && log.anomalyDetected !== 'NONE') {
          console.log(`   🚨 ANOMALIE: ${log.anomalyDetected}`);
          if (log.anomalyMessage) {
            console.log(`   Message: ${log.anomalyMessage.substring(0, 80)}...`);
          }
        }
        console.log('');
      });
      
      // Calculate totals
      const totalIn = flowLogs.filter(f => f.type === 'IN' || f.type === 'RETURN').reduce((sum, f) => sum + f.quantity, 0);
      const totalOut = flowLogs.filter(f => f.type === 'OUT' || f.type === 'DAMAGE').reduce((sum, f) => sum + f.quantity, 0);
      const anomalies = flowLogs.filter(f => f.anomalyDetected && f.anomalyDetected !== 'NONE').length;
      
      console.log('📈 AGGREGATE STATS FROM FLOW LOGS:');
      console.log(`   Total Entries: ${totalIn}`);
      console.log(`   Total Exits: ${totalOut}`);
      console.log(`   Net Flow: ${totalIn - totalOut}`);
      console.log(`   Anomalies: ${anomalies}`);
      console.log('');
    }
    
    // Check if anomaly exists (sortie > entree * 1.5)
    const hasAnomaly = material.stockSortie > material.stockEntree * 1.5 && material.stockEntree > 0;
    if (hasAnomaly) {
      console.log('🚨 ANOMALIE GLOBALE DÉTECTÉE!');
      console.log(`   Sorties (${material.stockSortie}) > Entrées (${material.stockEntree}) × 1.5`);
      console.log(`   Ratio: ${(material.stockSortie / material.stockEntree).toFixed(2)}x`);
    } else {
      console.log('✅ Pas d\'anomalie globale détectée');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

console.log('🔍 ========== VERIFY FLOW LOGS ==========\n');
verifyFlowLogs();
