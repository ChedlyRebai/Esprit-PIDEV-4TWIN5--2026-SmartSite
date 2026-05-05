/**
 * Script pour insérer des données de test dans MaterialFlowLog
 * Usage: node seed-flow-data.js
 */

const mongoose = require('mongoose');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsite-materials';

// Schéma MaterialFlowLog
const MaterialFlowLogSchema = new mongoose.Schema({
  siteId: { type: mongoose.Schema.Types.ObjectId, required: true },
  materialId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ['IN', 'OUT', 'ADJUSTMENT', 'DAMAGE', 'RETURN', 'RESERVE'], required: true },
  quantity: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  reason: String,
  projectId: String,
  reference: String,
  anomalyDetected: { type: String, enum: ['NONE', 'EXCESSIVE_OUT', 'EXCESSIVE_IN', 'UNEXPECTED_MOVEMENT', 'BELOW_SAFETY_STOCK'], default: 'NONE' },
  anomalyMessage: String,
  emailSent: { type: Boolean, default: false },
}, { timestamps: true });

async function seedFlowData() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const MaterialFlowLog = mongoose.model('MaterialFlowLog', MaterialFlowLogSchema);
    const Material = mongoose.model('Material', new mongoose.Schema({}, { strict: false }));

    // Récupérer tous les matériaux
    const materials = await Material.find().limit(10);
    console.log(`📦 ${materials.length} matériaux trouvés`);

    if (materials.length === 0) {
      console.log('⚠️ Aucun matériau trouvé. Veuillez d\'abord créer des matériaux.');
      process.exit(0);
    }

    // Supprimer les anciennes données de test
    await MaterialFlowLog.deleteMany({});
    console.log('🧹 Anciennes données supprimées');

    // Générer des mouvements de test pour chaque matériau
    const flowLogs = [];
    const now = new Date();

    for (const material of materials) {
      let currentStock = material.quantity || 100;
      const siteId = material.siteId || new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      // Générer 20 mouvements sur les 30 derniers jours
      for (let i = 0; i < 20; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const timestamp = new Date(now);
        timestamp.setDate(timestamp.getDate() - daysAgo);
        timestamp.setHours(Math.floor(Math.random() * 24));

        // Alterner entre entrées et sorties
        const isEntry = Math.random() > 0.4; // 60% sorties, 40% entrées
        const type = isEntry ? 'IN' : 'OUT';
        const quantity = Math.floor(Math.random() * 50) + 10;

        const previousStock = currentStock;
        let newStock = currentStock;
        let anomalyDetected = 'NONE';
        let anomalyMessage = null;

        if (type === 'IN') {
          newStock = previousStock + quantity;
          currentStock = newStock;
        } else {
          // Sortie
          if (quantity > previousStock) {
            // Anomalie: sortie excessive
            anomalyDetected = 'EXCESSIVE_OUT';
            anomalyMessage = `Sortie excessive: ${quantity} unités demandées mais seulement ${previousStock} disponibles`;
            newStock = 0;
            currentStock = 0;
          } else {
            newStock = previousStock - quantity;
            currentStock = newStock;

            // Détecter anomalie si sortie > 80% du stock
            if (quantity > previousStock * 0.8) {
              anomalyDetected = 'EXCESSIVE_OUT';
              anomalyMessage = `Sortie importante: ${quantity} unités (${Math.round(quantity/previousStock*100)}% du stock)`;
            }

            // Détecter stock critique
            if (newStock < (material.stockMinimum || material.minimumStock || 10)) {
              anomalyDetected = 'BELOW_SAFETY_STOCK';
              anomalyMessage = `Stock critique: ${newStock} unités (seuil: ${material.stockMinimum || material.minimumStock || 10})`;
            }
          }
        }

        flowLogs.push({
          siteId,
          materialId: material._id,
          type,
          quantity,
          timestamp,
          userId,
          previousStock,
          newStock,
          reason: type === 'IN' ? 'Réapprovisionnement' : 'Consommation chantier',
          anomalyDetected,
          anomalyMessage,
          emailSent: false,
        });
      }
    }

    // Insérer tous les mouvements
    await MaterialFlowLog.insertMany(flowLogs);
    console.log(`✅ ${flowLogs.length} mouvements insérés`);

    // Statistiques
    const stats = await MaterialFlowLog.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        }
      }
    ]);

    console.log('\n📊 Statistiques:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} mouvements, ${stat.totalQuantity} unités`);
    });

    const anomalies = await MaterialFlowLog.countDocuments({ anomalyDetected: { $ne: 'NONE' } });
    console.log(`   Anomalies: ${anomalies}`);

    console.log('\n✅ Données de test insérées avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

seedFlowData();
