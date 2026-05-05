const { MongoClient, ObjectId } = require('mongodb');
const readline = require('readline');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite-materials';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testMaterialFlowManual() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    const materialsCollection = db.collection('materials');
    const flowLogsCollection = db.collection('materialflowlogs');
    
    console.log('🧪 ========== TEST MATERIAL FLOW LOG MANUEL ==========\n');
    
    // Liste des matériaux disponibles
    const materials = await materialsCollection.find({}).limit(10).toArray();
    
    console.log('📦 MATÉRIAUX DISPONIBLES:\n');
    materials.forEach((mat, index) => {
      console.log(`${index + 1}. ${mat.name} (${mat.code})`);
      console.log(`   Stock Actuel: ${mat.quantity}`);
      console.log(`   Stock Entree: ${mat.stockEntree || 0}`);
      console.log(`   Stock Sortie: ${mat.stockSortie || 0}`);
      console.log(`   Site ID: ${mat.siteId || 'Non assigné'}`);
      console.log('');
    });
    
    // Sélectionner un matériau
    const materialIndex = await question('Choisir un matériau (1-' + materials.length + '): ');
    const selectedMaterial = materials[parseInt(materialIndex) - 1];
    
    if (!selectedMaterial) {
      console.log('❌ Matériau invalide');
      rl.close();
      return;
    }
    
    console.log(`\n✅ Matériau sélectionné: ${selectedMaterial.name} (${selectedMaterial.code})\n`);
    
    // Choisir le type de mouvement
    console.log('📝 TYPES DE MOUVEMENTS:');
    console.log('1. IN - Entrée de stock');
    console.log('2. OUT - Sortie de stock');
    console.log('3. DAMAGE - Matériau endommagé');
    console.log('4. RETURN - Retour de matériau');
    console.log('5. RESERVE - Réservation');
    console.log('6. ADJUSTMENT - Ajustement manuel\n');
    
    const typeChoice = await question('Choisir le type (1-6): ');
    const types = ['IN', 'OUT', 'DAMAGE', 'RETURN', 'RESERVE', 'ADJUSTMENT'];
    const selectedType = types[parseInt(typeChoice) - 1];
    
    if (!selectedType) {
      console.log('❌ Type invalide');
      rl.close();
      return;
    }
    
    // Entrer la quantité
    const quantity = await question('Entrer la quantité: ');
    const quantityNum = parseInt(quantity);
    
    if (isNaN(quantityNum) || quantityNum <= 0) {
      console.log('❌ Quantité invalide');
      rl.close();
      return;
    }
    
    // Entrer la raison
    const reason = await question('Entrer la raison (optionnel): ');
    
    // Calculer le nouveau stock
    const previousStock = selectedMaterial.quantity;
    let newStock = previousStock;
    
    switch (selectedType) {
      case 'IN':
      case 'RETURN':
        newStock = previousStock + quantityNum;
        break;
      case 'OUT':
      case 'DAMAGE':
        newStock = previousStock - quantityNum;
        break;
      case 'ADJUSTMENT':
        newStock = quantityNum;
        break;
      case 'RESERVE':
        newStock = previousStock; // Pas de changement de stock
        break;
    }
    
    // Détecter les anomalies
    let anomalyDetected = 'NONE';
    let anomalyMessage = '';
    
    // Pour les sorties, vérifier si c'est excessif
    if (selectedType === 'OUT') {
      const normalDailyConsumption = 20; // Valeur par défaut
      const threshold = normalDailyConsumption * 1.3; // +30%
      
      if (quantityNum > threshold) {
        anomalyDetected = 'EXCESSIVE_OUT';
        const deviation = ((quantityNum - normalDailyConsumption) / normalDailyConsumption) * 100;
        anomalyMessage = `🚨 ALERTE: Sortie excessive détectée! Quantité: ${quantityNum} unités, Normale: ${normalDailyConsumption} unités/jour. Déviation: ${deviation.toFixed(1)}%. RISQUE DE VOL OU GASPILLAGE!`;
      }
    }
    
    // Créer le flow log
    const userId = new ObjectId('675a123456789012345678ab'); // Test user ID
    const siteId = selectedMaterial.siteId || new ObjectId();
    
    const flowLog = {
      siteId: siteId,
      materialId: selectedMaterial._id,
      type: selectedType,
      quantity: quantityNum,
      timestamp: new Date(),
      userId: userId,
      previousStock: previousStock,
      newStock: newStock,
      reason: reason || `${selectedType} via test manuel`,
      anomalyDetected: anomalyDetected,
      anomalyMessage: anomalyMessage,
      emailSent: false,
    };
    
    console.log('\n📝 CRÉATION DU FLOW LOG...\n');
    console.log('Type:', selectedType);
    console.log('Quantité:', quantityNum);
    console.log('Stock Avant:', previousStock);
    console.log('Stock Après:', newStock);
    console.log('Anomalie:', anomalyDetected);
    if (anomalyMessage) {
      console.log('Message:', anomalyMessage);
    }
    console.log('');
    
    // Insérer le flow log
    const result = await flowLogsCollection.insertOne(flowLog);
    console.log('✅ Flow log créé avec ID:', result.insertedId);
    console.log('');
    
    // Mettre à jour le matériau
    const updateData = {
      quantity: newStock,
    };
    
    // Mettre à jour stockEntree ou stockSortie
    if (selectedType === 'IN' || selectedType === 'RETURN') {
      updateData.stockEntree = (selectedMaterial.stockEntree || 0) + quantityNum;
    } else if (selectedType === 'OUT' || selectedType === 'DAMAGE') {
      updateData.stockSortie = (selectedMaterial.stockSortie || 0) + quantityNum;
    }
    
    await materialsCollection.updateOne(
      { _id: selectedMaterial._id },
      { $set: updateData }
    );
    
    console.log('✅ Matériau mis à jour');
    console.log('');
    
    // Afficher le résultat
    const updatedMaterial = await materialsCollection.findOne({ _id: selectedMaterial._id });
    console.log('📦 MATÉRIAU APRÈS UPDATE:');
    console.log(`   Stock Actuel: ${updatedMaterial.quantity}`);
    console.log(`   Stock Entree: ${updatedMaterial.stockEntree || 0}`);
    console.log(`   Stock Sortie: ${updatedMaterial.stockSortie || 0}`);
    console.log(`   Net Balance: ${(updatedMaterial.stockEntree || 0) - (updatedMaterial.stockSortie || 0)}`);
    console.log('');
    
    // Vérifier l'anomalie globale
    const hasGlobalAnomaly = updatedMaterial.stockSortie > updatedMaterial.stockEntree * 1.5 && updatedMaterial.stockEntree > 0;
    if (hasGlobalAnomaly) {
      console.log('🚨 ANOMALIE GLOBALE DÉTECTÉE!');
      console.log(`   Sorties (${updatedMaterial.stockSortie}) > Entrées (${updatedMaterial.stockEntree}) × 1.5`);
      console.log(`   Ratio: ${(updatedMaterial.stockSortie / updatedMaterial.stockEntree).toFixed(2)}x`);
    } else {
      console.log('✅ Pas d\'anomalie globale');
    }
    console.log('');
    
    // Afficher tous les flow logs pour ce matériau
    const allFlowLogs = await flowLogsCollection
      .find({ materialId: selectedMaterial._id })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    console.log(`📊 FLOW LOGS RÉCENTS (${allFlowLogs.length} total):\n`);
    allFlowLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.type} - ${log.quantity} unités`);
      console.log(`   Date: ${new Date(log.timestamp).toLocaleString('fr-FR')}`);
      console.log(`   Raison: ${log.reason || 'N/A'}`);
      console.log(`   Stock: ${log.previousStock} → ${log.newStock}`);
      if (log.anomalyDetected && log.anomalyDetected !== 'NONE') {
        console.log(`   🚨 ANOMALIE: ${log.anomalyDetected}`);
      }
      console.log('');
    });
    
    console.log('🎉 TEST TERMINÉ AVEC SUCCÈS!');
    console.log('');
    console.log('💡 PROCHAINES ÉTAPES:');
    console.log('   1. Ouvrir l\'interface frontend');
    console.log('   2. Aller dans MaterialDetails pour ce matériau');
    console.log('   3. Vérifier que le flow log apparaît dans "Recent Movements"');
    console.log('   4. Vérifier que les statistiques sont mises à jour');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    rl.close();
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

console.log('🧪 ========== TEST MATERIAL FLOW LOG MANUEL ==========\n');
console.log('Ce script vous permet de créer des flow logs manuellement\n');
console.log('Vous pouvez choisir:');
console.log('  • Le matériau');
console.log('  • Le type de mouvement (IN, OUT, DAMAGE, etc.)');
console.log('  • La quantité');
console.log('  • La raison\n');
console.log('Le système détectera automatiquement les anomalies!\n');
console.log('='.repeat(60) + '\n');

testMaterialFlowManual();
