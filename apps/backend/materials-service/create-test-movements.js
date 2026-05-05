/**
 * Script pour créer des mouvements de test dans material-flow-log
 * Usage: node create-test-movements.js <materialId> <siteId>
 */

const mongoose = require('mongoose');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsite-materials';

// Schéma MaterialFlowLog
const materialFlowLogSchema = new mongoose.Schema({
  siteId: { type: mongoose.Schema.Types.ObjectId, required: true },
  materialId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ['IN', 'OUT', 'ADJUSTMENT', 'DAMAGE', 'RETURN', 'RESERVE'], required: true },
  quantity: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  userId: { type: String, default: 'system' },
  previousStock: { type: Number },
  newStock: { type: Number },
  reason: { type: String },
  anomalyDetected: { type: String, enum: ['NONE', 'EXCESSIVE_OUT', 'EXCESSIVE_IN', 'UNEXPECTED_MOVEMENT', 'BELOW_SAFETY_STOCK'], default: 'NONE' },
  emailSent: { type: Boolean, default: false },
  anomalyMessage: { type: String },
  projectId: { type: String },
  reference: { type: String },
}, { timestamps: true });

async function createTestMovements() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const MaterialFlowLog = mongoose.model('MaterialFlowLog', materialFlowLogSchema);

    // Récupérer les arguments
    const materialId = process.argv[2];
    const siteId = process.argv[3];

    if (!materialId || !siteId) {
      console.error('❌ Usage: node create-test-movements.js <materialId> <siteId>');
      process.exit(1);
    }

    console.log(`\n📦 Création de mouvements de test pour:`);
    console.log(`   Material ID: ${materialId}`);
    console.log(`   Site ID: ${siteId}\n`);

    // Créer des mouvements de test
    const movements = [
      {
        siteId: new mongoose.Types.ObjectId(siteId),
        materialId: new mongoose.Types.ObjectId(materialId),
        type: 'IN',
        quantity: 100,
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Il y a 10 jours
        userId: 'system',
        previousStock: 0,
        newStock: 100,
        reason: 'Réception initiale de stock',
        anomalyDetected: 'NONE',
        emailSent: false,
      },
      {
        siteId: new mongoose.Types.ObjectId(siteId),
        materialId: new mongoose.Types.ObjectId(materialId),
        type: 'OUT',
        quantity: 30,
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Il y a 7 jours
        userId: 'system',
        previousStock: 100,
        newStock: 70,
        reason: 'Utilisation sur chantier',
        anomalyDetected: 'NONE',
        emailSent: false,
      },
      {
        siteId: new mongoose.Types.ObjectId(siteId),
        materialId: new mongoose.Types.ObjectId(materialId),
        type: 'IN',
        quantity: 50,
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Il y a 5 jours
        userId: 'system',
        previousStock: 70,
        newStock: 120,
        reason: 'Réapprovisionnement',
        anomalyDetected: 'NONE',
        emailSent: false,
      },
      {
        siteId: new mongoose.Types.ObjectId(siteId),
        materialId: new mongoose.Types.ObjectId(materialId),
        type: 'OUT',
        quantity: 40,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
        userId: 'system',
        previousStock: 120,
        newStock: 80,
        reason: 'Utilisation sur chantier',
        anomalyDetected: 'NONE',
        emailSent: false,
      },
      {
        siteId: new mongoose.Types.ObjectId(siteId),
        materialId: new mongoose.Types.ObjectId(materialId),
        type: 'OUT',
        quantity: 80,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Il y a 1 jour
        userId: 'system',
        previousStock: 80,
        newStock: 0,
        reason: 'Utilisation finale',
        anomalyDetected: 'EXCESSIVE_OUT',
        emailSent: false,
        anomalyMessage: 'Sortie excessive détectée',
      },
    ];

    console.log(`📝 Insertion de ${movements.length} mouvements...`);
    const result = await MaterialFlowLog.insertMany(movements);
    console.log(`✅ ${result.length} mouvements créés avec succès!\n`);

    // Afficher les statistiques
    const stats = await MaterialFlowLog.aggregate([
      { $match: { materialId: new mongoose.Types.ObjectId(materialId) } },
      {
        $group: {
          _id: '$type',
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 },
        },
      },
    ]);

    console.log('📊 Statistiques des mouvements:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.totalQuantity} unités (${stat.count} mouvements)`);
    });

    const totalIn = stats.filter(s => s._id === 'IN').reduce((sum, s) => sum + s.totalQuantity, 0);
    const totalOut = stats.filter(s => s._id === 'OUT').reduce((sum, s) => sum + s.totalQuantity, 0);
    console.log(`\n   Total Entrées: ${totalIn}`);
    console.log(`   Total Sorties: ${totalOut}`);
    console.log(`   Balance nette: ${totalIn - totalOut}\n`);

    await mongoose.disconnect();
    console.log('✅ Déconnecté de MongoDB');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createTestMovements();
