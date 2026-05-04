const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite-materials';

/**
 * COMPRENDRE LE SYSTÈME FLOW LOG
 * 
 * Flow Log = Historique détaillé des mouvements de stock
 * 
 * Types de mouvements:
 * - IN: Entrée de stock (livraison, achat)
 * - OUT: Sortie de stock (utilisation, consommation)
 * - DAMAGE: Matériau endommagé
 * - RETURN: Retour de matériau
 * - RESERVE: Réservation
 * - ADJUSTMENT: Ajustement manuel
 * 
 * Détection d'anomalies:
 * - NONE: Pas d'anomalie
 * - EXCESSIVE_OUT: Sortie > usage normal + 30%
 * - EXCESSIVE_IN: Entrée anormalement élevée
 * - BELOW_SAFETY_STOCK: Stock en dessous du minimum
 */

async function testFlowLogSystem() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    const materialsCollection = db.collection('materials');
    const flowLogsCollection = db.collection('materialflowlogs');
    
    // Get a material to test with
    const material = await materialsCollection.findOne({ code: 'CIM-001' });
    
    if (!material) {
      console.log('❌ Material CIM-001 not found');
      return;
    }
    
    console.log('📦 Material:', material.name);
    console.log('   Stock Actuel:', material.quantity);
    console.log('   Stock Entree:', material.stockEntree || 0);
    console.log('   Stock Sortie:', material.stockSortie || 0);
    console.log('   Site ID:', material.siteId);
    console.log('');
    
    // Create test flow logs
    console.log('📝 Creating test flow logs...\n');
    
    const userId = new ObjectId('675a123456789012345678ab'); // Test user ID
    const siteId = material.siteId;
    const materialId = material._id;
    
    // 1. Entrée normale (IN)
    const flow1 = {
      siteId: siteId,
      materialId: materialId,
      type: 'IN',
      quantity: 50,
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      userId: userId,
      previousStock: material.quantity,
      newStock: material.quantity + 50,
      reason: 'Livraison fournisseur',
      anomalyDetected: 'NONE',
      emailSent: false,
    };
    
    // 2. Sortie normale (OUT)
    const flow2 = {
      siteId: siteId,
      materialId: materialId,
      type: 'OUT',
      quantity: 20,
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      userId: userId,
      previousStock: material.quantity + 50,
      newStock: material.quantity + 30,
      reason: 'Utilisation chantier',
      anomalyDetected: 'NONE',
      emailSent: false,
    };
    
    // 3. Sortie normale (OUT)
    const flow3 = {
      siteId: siteId,
      materialId: materialId,
      type: 'OUT',
      quantity: 15,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      userId: userId,
      previousStock: material.quantity + 30,
      newStock: material.quantity + 15,
      reason: 'Utilisation chantier',
      anomalyDetected: 'NONE',
      emailSent: false,
    };
    
    // 4. Sortie EXCESSIVE (OUT avec anomalie)
    const flow4 = {
      siteId: siteId,
      materialId: materialId,
      type: 'OUT',
      quantity: 80,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      userId: userId,
      previousStock: material.quantity + 15,
      newStock: material.quantity - 65,
      reason: 'Utilisation chantier',
      anomalyDetected: 'EXCESSIVE_OUT',
      anomalyMessage: '🚨 ALERTE: Sortie excessive détectée! Quantité: 80 unités, Normale: 20 unités/jour. Déviation: 300%. RISQUE DE VOL OU GASPILLAGE!',
      emailSent: false,
    };
    
    // 5. Entrée pour compenser (IN)
    const flow5 = {
      siteId: siteId,
      materialId: materialId,
      type: 'IN',
      quantity: 100,
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      userId: userId,
      previousStock: material.quantity - 65,
      newStock: material.quantity + 35,
      reason: 'Réapprovisionnement urgent',
      anomalyDetected: 'NONE',
      emailSent: false,
    };
    
    // 6. Matériau endommagé (DAMAGE)
    const flow6 = {
      siteId: siteId,
      materialId: materialId,
      type: 'DAMAGE',
      quantity: 5,
      timestamp: new Date(),
      userId: userId,
      previousStock: material.quantity + 35,
      newStock: material.quantity + 30,
      reason: 'Sacs endommagés par l\'humidité',
      anomalyDetected: 'NONE',
      emailSent: false,
    };
    
    const flowLogs = [flow1, flow2, flow3, flow4, flow5, flow6];
    
    // Insert flow logs
    const result = await flowLogsCollection.insertMany(flowLogs);
    console.log(`✅ ${result.insertedCount} flow logs created\n`);
    
    // Display flow logs
    console.log('📊 FLOW LOGS CREATED:\n');
    flowLogs.forEach((flow, index) => {
      console.log(`${index + 1}. ${flow.type} - ${flow.quantity} unités`);
      console.log(`   Date: ${flow.timestamp.toLocaleDateString()}`);
      console.log(`   Raison: ${flow.reason}`);
      console.log(`   Stock: ${flow.previousStock} → ${flow.newStock}`);
      if (flow.anomalyDetected !== 'NONE') {
        console.log(`   🚨 ANOMALIE: ${flow.anomalyDetected}`);
        console.log(`   Message: ${flow.anomalyMessage}`);
      }
      console.log('');
    });
    
    // Calculate statistics
    const totalIn = flowLogs.filter(f => f.type === 'IN').reduce((sum, f) => sum + f.quantity, 0);
    const totalOut = flowLogs.filter(f => f.type === 'OUT').reduce((sum, f) => sum + f.quantity, 0);
    const totalDamage = flowLogs.filter(f => f.type === 'DAMAGE').reduce((sum, f) => sum + f.quantity, 0);
    const anomalies = flowLogs.filter(f => f.anomalyDetected !== 'NONE').length;
    
    console.log('📈 STATISTIQUES:');
    console.log(`   Total Entrées (IN): ${totalIn}`);
    console.log(`   Total Sorties (OUT): ${totalOut}`);
    console.log(`   Total Endommagés (DAMAGE): ${totalDamage}`);
    console.log(`   Net Balance: ${totalIn - totalOut - totalDamage}`);
    console.log(`   Anomalies détectées: ${anomalies}`);
    console.log('');
    
    // Update material with flow log data
    console.log('📝 Updating material with flow log data...');
    await materialsCollection.updateOne(
      { _id: materialId },
      {
        $set: {
          stockEntree: (material.stockEntree || 0) + totalIn,
          stockSortie: (material.stockSortie || 0) + totalOut + totalDamage,
        }
      }
    );
    console.log('✅ Material updated\n');
    
    // Verify
    const updatedMaterial = await materialsCollection.findOne({ _id: materialId });
    console.log('📦 MATERIAL APRÈS UPDATE:');
    console.log(`   Stock Entree: ${updatedMaterial.stockEntree}`);
    console.log(`   Stock Sortie: ${updatedMaterial.stockSortie}`);
    console.log(`   Net Balance: ${updatedMaterial.stockEntree - updatedMaterial.stockSortie}`);
    
    // Check for anomaly
    const hasAnomaly = updatedMaterial.stockSortie > updatedMaterial.stockEntree * 1.5 && updatedMaterial.stockEntree > 0;
    if (hasAnomaly) {
      console.log(`   🚨 ANOMALIE GLOBALE DÉTECTÉE!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

console.log('🧪 ========== TEST FLOW LOG SYSTEM ==========\n');
console.log('📚 COMPRENDRE LE SYSTÈME:\n');
console.log('Flow Log = Historique détaillé des mouvements de stock\n');
console.log('Types de mouvements:');
console.log('  • IN: Entrée de stock (livraison, achat)');
console.log('  • OUT: Sortie de stock (utilisation, consommation)');
console.log('  • DAMAGE: Matériau endommagé');
console.log('  • RETURN: Retour de matériau');
console.log('  • RESERVE: Réservation');
console.log('  • ADJUSTMENT: Ajustement manuel\n');
console.log('Détection d\'anomalies:');
console.log('  • NONE: Pas d\'anomalie');
console.log('  • EXCESSIVE_OUT: Sortie > usage normal + 30%');
console.log('  • EXCESSIVE_IN: Entrée anormalement élevée');
console.log('  • BELOW_SAFETY_STOCK: Stock en dessous du minimum\n');
console.log('='.repeat(50) + '\n');

testFlowLogSystem();
