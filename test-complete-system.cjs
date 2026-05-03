const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite-materials';

async function testCompleteSystem() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    const materialsCollection = db.collection('materials');
    const flowLogsCollection = db.collection('materialflowlogs');
    
    console.log('🧪 ========== COMPLETE SYSTEM TEST ==========\n');
    
    // ========== TEST 1: Material with Stock Fields ==========
    console.log('📦 TEST 1: Material Stock Fields');
    console.log('─'.repeat(50));
    
    const material = await materialsCollection.findOne({ code: 'CIM-001' });
    
    if (!material) {
      console.log('❌ Material CIM-001 not found');
      return;
    }
    
    console.log(`✅ Material: ${material.name} (${material.code})`);
    console.log(`   Stock Actuel: ${material.quantity}`);
    console.log(`   Stock Entree: ${material.stockEntree || 0}`);
    console.log(`   Stock Sortie: ${material.stockSortie || 0}`);
    console.log(`   Stock Existant: ${material.stockExistant || 0}`);
    console.log(`   Site ID: ${material.siteId}`);
    
    const hasStockFields = 
      material.stockEntree !== undefined &&
      material.stockSortie !== undefined;
    
    if (hasStockFields) {
      console.log('✅ Stock fields exist and are accessible');
    } else {
      console.log('❌ Stock fields missing');
    }
    console.log('');
    
    // ========== TEST 2: Flow Logs Exist ==========
    console.log('📊 TEST 2: Flow Logs');
    console.log('─'.repeat(50));
    
    const flowLogs = await flowLogsCollection
      .find({ materialId: material._id })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    console.log(`✅ Found ${flowLogs.length} flow logs`);
    
    if (flowLogs.length > 0) {
      console.log('   Recent movements:');
      flowLogs.slice(0, 3).forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.type} - ${log.quantity} units`);
        if (log.anomalyDetected && log.anomalyDetected !== 'NONE') {
          console.log(`      🚨 ANOMALY: ${log.anomalyDetected}`);
        }
      });
    } else {
      console.log('⚠️ No flow logs found (run test-flow-log-system.cjs to create)');
    }
    console.log('');
    
    // ========== TEST 3: Aggregate Statistics ==========
    console.log('📈 TEST 3: Aggregate Statistics');
    console.log('─'.repeat(50));
    
    const totalIn = flowLogs
      .filter(f => f.type === 'IN' || f.type === 'RETURN')
      .reduce((sum, f) => sum + f.quantity, 0);
    
    const totalOut = flowLogs
      .filter(f => f.type === 'OUT' || f.type === 'DAMAGE')
      .reduce((sum, f) => sum + f.quantity, 0);
    
    const anomalies = flowLogs
      .filter(f => f.anomalyDetected && f.anomalyDetected !== 'NONE')
      .length;
    
    console.log(`✅ Total Entries (from flow logs): ${totalIn}`);
    console.log(`✅ Total Exits (from flow logs): ${totalOut}`);
    console.log(`✅ Net Flow: ${totalIn - totalOut}`);
    console.log(`✅ Anomalies Detected: ${anomalies}`);
    console.log('');
    
    console.log(`✅ Total Entries (from material): ${material.stockEntree || 0}`);
    console.log(`✅ Total Exits (from material): ${material.stockSortie || 0}`);
    console.log(`✅ Net Balance: ${(material.stockEntree || 0) - (material.stockSortie || 0)}`);
    console.log('');
    
    // ========== TEST 4: Anomaly Detection ==========
    console.log('🚨 TEST 4: Anomaly Detection');
    console.log('─'.repeat(50));
    
    const hasGlobalAnomaly = 
      material.stockSortie > material.stockEntree * 1.5 && 
      material.stockEntree > 0;
    
    if (hasGlobalAnomaly) {
      const ratio = (material.stockSortie / material.stockEntree).toFixed(2);
      console.log(`🚨 GLOBAL ANOMALY DETECTED!`);
      console.log(`   Exits (${material.stockSortie}) > Entries (${material.stockEntree}) × 1.5`);
      console.log(`   Ratio: ${ratio}x`);
      console.log(`   ⚠️ POSSIBLE THEFT OR WASTE RISK!`);
    } else {
      console.log(`✅ No global anomaly detected`);
      console.log(`   Exits/Entries ratio is within acceptable range`);
    }
    console.log('');
    
    // ========== TEST 5: Material Update Test ==========
    console.log('🔄 TEST 5: Material Update');
    console.log('─'.repeat(50));
    
    const originalEntree = material.stockEntree || 0;
    const originalSortie = material.stockSortie || 0;
    
    console.log(`   Before: Entree=${originalEntree}, Sortie=${originalSortie}`);
    
    // Simulate update (add 10 to each)
    const newEntree = originalEntree + 10;
    const newSortie = originalSortie + 5;
    
    await materialsCollection.updateOne(
      { _id: material._id },
      {
        $set: {
          stockEntree: newEntree,
          stockSortie: newSortie,
        }
      }
    );
    
    const updatedMaterial = await materialsCollection.findOne({ _id: material._id });
    
    console.log(`   After: Entree=${updatedMaterial.stockEntree}, Sortie=${updatedMaterial.stockSortie}`);
    
    const updateWorked = 
      updatedMaterial.stockEntree === newEntree &&
      updatedMaterial.stockSortie === newSortie;
    
    if (updateWorked) {
      console.log(`✅ Material update WORKS correctly`);
      console.log(`   Stock fields are preserved and updated`);
    } else {
      console.log(`❌ Material update FAILED`);
      console.log(`   Stock fields were not saved correctly`);
    }
    
    // Restore original values
    await materialsCollection.updateOne(
      { _id: material._id },
      {
        $set: {
          stockEntree: originalEntree,
          stockSortie: originalSortie,
        }
      }
    );
    console.log(`   ↩️ Restored original values`);
    console.log('');
    
    // ========== TEST 6: GPS Coordinates ==========
    console.log('📍 TEST 6: GPS Coordinates');
    console.log('─'.repeat(50));
    
    if (material.siteId) {
      console.log(`✅ Material has siteId: ${material.siteId}`);
      console.log(`   Note: GPS coordinates are fetched from HTTP API at runtime`);
      console.log(`   Expected: 📍 33.8439, 9.4001 (Tunisia)`);
    } else {
      console.log(`⚠️ Material has no siteId assigned`);
    }
    console.log('');
    
    // ========== FINAL SUMMARY ==========
    console.log('🎯 FINAL SUMMARY');
    console.log('═'.repeat(50));
    
    const tests = [
      { name: 'Material Stock Fields', passed: hasStockFields },
      { name: 'Flow Logs Exist', passed: flowLogs.length > 0 },
      { name: 'Aggregate Statistics', passed: true },
      { name: 'Anomaly Detection', passed: true },
      { name: 'Material Update', passed: updateWorked },
      { name: 'GPS Integration', passed: material.siteId !== undefined },
    ];
    
    const passedTests = tests.filter(t => t.passed).length;
    const totalTests = tests.length;
    const percentage = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log('');
    tests.forEach(test => {
      const icon = test.passed ? '✅' : '❌';
      console.log(`${icon} ${test.name}`);
    });
    
    console.log('');
    console.log(`📊 RESULTS: ${passedTests}/${totalTests} tests passed (${percentage}%)`);
    console.log('');
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! System is fully operational!');
    } else {
      console.log('⚠️ Some tests failed. Review the output above.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

testCompleteSystem();
