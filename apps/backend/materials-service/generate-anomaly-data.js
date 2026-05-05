/**
 * Script pour générer des données d'anomalies basées sur les matériaux existants
 * Usage: node generate-anomaly-data.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsite-materials';

async function generateAnomalyData() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const Material = mongoose.model('Material', new mongoose.Schema({}, { strict: false }));

    // Récupérer tous les matériaux
    const materials = await Material.find().limit(20);
    console.log(`📦 ${materials.length} matériaux trouvés`);

    if (materials.length === 0) {
      console.log('⚠️ Aucun matériau trouvé.');
      process.exit(0);
    }

    // Préparer les données CSV
    const csvLines = [
      'timestamp,materialId,materialName,siteId,siteName,expectedConsumption,actualConsumption,deviation,hourOfDay,dayOfWeek,weather,projectType,siteActivityLevel,isAnomaly,anomalyType,anomalySeverity'
    ];

    const weatherTypes = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'windy'];
    const projectTypes = ['residential', 'commercial', 'industrial'];
    const activityLevels = ['low', 'medium', 'high'];
    const siteNames = ['Chantier Nord', 'Chantier Sud', 'Chantier Est', 'Chantier Ouest', 'Chantier Centre'];

    const now = new Date();

    // Générer 500 lignes de données
    for (let i = 0; i < 500; i++) {
      const material = materials[Math.floor(Math.random() * materials.length)];
      const materialId = material._id.toString();
      const materialName = material.name;
      
      // Date aléatoire dans les 30 derniers jours
      const daysAgo = Math.floor(Math.random() * 30);
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(Math.floor(Math.random() * 24));
      
      const hourOfDay = timestamp.getHours();
      const dayOfWeek = timestamp.getDay();
      const weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
      const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
      const activityLevel = activityLevels[Math.floor(Math.random() * activityLevels.length)];
      
      const siteId = material.siteId ? material.siteId.toString() : `SITE00${Math.floor(Math.random() * 5) + 1}`;
      const siteName = siteNames[Math.floor(Math.random() * siteNames.length)];
      
      // Consommation attendue (basée sur l'heure et l'activité)
      let expectedConsumption = 0;
      if (hourOfDay >= 7 && hourOfDay <= 18) {
        // Heures de travail
        if (activityLevel === 'high') {
          expectedConsumption = Math.floor(Math.random() * 30) + 20;
        } else if (activityLevel === 'medium') {
          expectedConsumption = Math.floor(Math.random() * 15) + 10;
        } else {
          expectedConsumption = Math.floor(Math.random() * 5) + 2;
        }
      }
      
      // Consommation réelle avec possibilité d'anomalie
      let actualConsumption = expectedConsumption;
      let isAnomaly = 0;
      let anomalyType = 'NONE';
      let anomalySeverity = 'NONE';
      
      const anomalyChance = Math.random();
      
      if (anomalyChance < 0.15) {
        // 15% de chance d'anomalie
        const anomalyTypeRand = Math.random();
        
        if (anomalyTypeRand < 0.4) {
          // Vol (40% des anomalies) - consommation 2x à 3x supérieure
          actualConsumption = Math.floor(expectedConsumption * (2 + Math.random()));
          isAnomaly = 1;
          anomalyType = 'THEFT';
          anomalySeverity = actualConsumption > expectedConsumption * 2.5 ? 'HIGH' : 'MEDIUM';
        } else if (anomalyTypeRand < 0.7) {
          // Gaspillage (30% des anomalies) - consommation 1.5x à 2x supérieure
          actualConsumption = Math.floor(expectedConsumption * (1.5 + Math.random() * 0.5));
          isAnomaly = 1;
          anomalyType = 'WASTE';
          anomalySeverity = 'MEDIUM';
        } else {
          // Surconsommation (30% des anomalies) - consommation 1.2x à 1.5x supérieure
          actualConsumption = Math.floor(expectedConsumption * (1.2 + Math.random() * 0.3));
          isAnomaly = 1;
          anomalyType = 'OVER_CONSUMPTION';
          anomalySeverity = 'LOW';
        }
      } else {
        // Consommation normale avec petite variation
        actualConsumption = Math.floor(expectedConsumption * (0.9 + Math.random() * 0.2));
      }
      
      const deviation = expectedConsumption > 0 
        ? ((actualConsumption - expectedConsumption) / expectedConsumption * 100).toFixed(2)
        : 0;
      
      csvLines.push([
        timestamp.toISOString(),
        materialId,
        materialName,
        siteId,
        siteName,
        expectedConsumption,
        actualConsumption,
        deviation,
        hourOfDay,
        dayOfWeek,
        weather,
        projectType,
        activityLevel,
        isAnomaly,
        anomalyType,
        anomalySeverity
      ].join(','));
    }

    // Écrire le fichier CSV
    const csvPath = path.join(__dirname, 'anomaly-detection.csv');
    fs.writeFileSync(csvPath, csvLines.join('\n'));
    
    console.log(`✅ ${csvLines.length - 1} lignes générées dans ${csvPath}`);
    
    // Statistiques
    const anomalyCount = csvLines.filter(line => line.includes(',1,')).length;
    const theftCount = csvLines.filter(line => line.includes(',THEFT,')).length;
    const wasteCount = csvLines.filter(line => line.includes(',WASTE,')).length;
    const overConsCount = csvLines.filter(line => line.includes(',OVER_CONSUMPTION,')).length;
    
    console.log('\n📊 Statistiques:');
    console.log(`   Total: ${csvLines.length - 1} lignes`);
    console.log(`   Anomalies: ${anomalyCount}`);
    console.log(`   - Vol: ${theftCount}`);
    console.log(`   - Gaspillage: ${wasteCount}`);
    console.log(`   - Surconsommation: ${overConsCount}`);
    console.log(`   Normal: ${csvLines.length - 1 - anomalyCount}`);

    console.log('\n✅ Fichier CSV généré avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

generateAnomalyData();
