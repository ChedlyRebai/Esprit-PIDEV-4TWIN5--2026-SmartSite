/**
 * 🧪 SCRIPT DE TEST COMPLET - MATERIALS SYSTEM
 * 
 * Ce script teste l'ensemble du système materials:
 * - Backend NestJS (port 3002)
 * - ML-Prediction FastAPI (port 8000)
 * - Connexions MongoDB
 * - Endpoints critiques
 * 
 * Usage: node test-materials-system.js
 */

const axios = require('axios');
const chalk = require('chalk');

// Configuration
const BACKEND_URL = 'http://localhost:3002/api';
const ML_SERVICE_URL = 'http://localhost:8000';
const TIMEOUT = 10000; // 10 secondes

// Compteurs
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Helpers
const log = {
  title: (msg) => console.log(chalk.bold.cyan(`\n${'='.repeat(80)}\n${msg}\n${'='.repeat(80)}`)),
  section: (msg) => console.log(chalk.bold.yellow(`\n📋 ${msg}`)),
  success: (msg) => console.log(chalk.green(`✅ ${msg}`)),
  error: (msg) => console.log(chalk.red(`❌ ${msg}`)),
  info: (msg) => console.log(chalk.blue(`ℹ️  ${msg}`)),
  warn: (msg) => console.log(chalk.yellow(`⚠️  ${msg}`)),
};

async function test(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    log.success(`${name}`);
    return true;
  } catch (error) {
    failedTests++;
    log.error(`${name}`);
    log.error(`   Erreur: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TESTS ML-PREDICTION SERVICE (FastAPI)
// ============================================================================

async function testMLService() {
  log.section('ML-PREDICTION SERVICE (FastAPI - Port 8000)');

  // Test 1: Health check
  await test('Health check ML service', async () => {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: TIMEOUT });
    if (response.status !== 200) throw new Error('Health check failed');
    if (!response.data.models_loaded) throw new Error('Models not loaded');
    log.info(`   Models loaded: Stock=${response.data.models_loaded.stock_prediction}, Anomaly=${response.data.models_loaded.anomaly_detection}`);
  });

  // Test 2: Dataset stats
  await test('Dataset statistics', async () => {
    const response = await axios.get(`${ML_SERVICE_URL}/datasets/stats`, { timeout: TIMEOUT });
    if (response.status !== 200) throw new Error('Dataset stats failed');
    const { stock_prediction, anomaly_detection } = response.data;
    log.info(`   Stock dataset: ${stock_prediction.total_records} records`);
    log.info(`   Anomaly dataset: ${anomaly_detection.total_records} records`);
  });

  // Test 3: Stock prediction
  await test('Stock prediction endpoint', async () => {
    const payload = {
      material_id: 'test123',
      material_name: 'Ciment Portland',
      current_stock: 50,
      minimum_stock: 10,
      consumption_rate: 5,
      days_to_predict: 7,
    };
    const response = await axios.post(`${ML_SERVICE_URL}/predict/stock`, payload, { timeout: TIMEOUT });
    if (response.status !== 200) throw new Error('Stock prediction failed');
    const { days_until_stockout, status, confidence } = response.data;
    log.info(`   Days until stockout: ${days_until_stockout}`);
    log.info(`   Status: ${status}`);
    log.info(`   Confidence: ${(confidence * 100).toFixed(1)}%`);
  });

  // Test 4: Consumption anomaly detection
  await test('Consumption anomaly detection', async () => {
    const payload = {
      material_id: 'test456',
      material_name: 'Béton',
      current_consumption: 150,
      average_consumption: 50,
      std_consumption: 10,
    };
    const response = await axios.post(`${ML_SERVICE_URL}/predict/consumption-anomaly`, payload, { timeout: TIMEOUT });
    if (response.status !== 200) throw new Error('Anomaly detection failed');
    const { consumption_status, severity, deviation_percentage } = response.data;
    log.info(`   Status: ${consumption_status}`);
    log.info(`   Severity: ${severity}`);
    log.info(`   Deviation: ${deviation_percentage.toFixed(1)}%`);
  });
}

// ============================================================================
// TESTS BACKEND MATERIALS SERVICE (NestJS)
// ============================================================================

async function testBackendService() {
  log.section('BACKEND MATERIALS SERVICE (NestJS - Port 3002)');

  // Test 1: Dashboard stats
  await test('Dashboard statistics', async () => {
    const response = await axios.get(`${BACKEND_URL}/materials/dashboard`, { timeout: TIMEOUT });
    if (response.status !== 200) throw new Error('Dashboard failed');
    const { totalMaterials, lowStockCount, outOfStockCount } = response.data;
    log.info(`   Total materials: ${totalMaterials}`);
    log.info(`   Low stock: ${lowStockCount}`);
    log.info(`   Out of stock: ${outOfStockCount}`);
  });

  // Test 2: Get all materials
  await test('Get all materials', async () => {
    const response = await axios.get(`${BACKEND_URL}/materials?limit=10`, { timeout: TIMEOUT });
    if (response.status !== 200) throw new Error('Get materials failed');
    const materials = Array.isArray(response.data) ? response.data : response.data.data || [];
    log.info(`   Materials found: ${materials.length}`);
    if (materials.length > 0) {
      log.info(`   First material: ${materials[0].name} (${materials[0].code})`);
    }
  });

  // Test 3: Get all predictions
  await test('Get all ML predictions', async () => {
    const response = await axios.get(`${BACKEND_URL}/materials/predictions/all`, { timeout: 30000 });
    if (response.status !== 200) throw new Error('Predictions failed');
    const predictions = response.data;
    log.info(`   Predictions generated: ${predictions.length}`);
    if (predictions.length > 0) {
      const first = predictions[0];
      log.info(`   First prediction: ${first.materialName} - ${first.status} (${first.hoursToOutOfStock}h)`);
    }
  });

  // Test 4: Get sites
  await test('Get sites from MongoDB', async () => {
    const response = await axios.get(`${BACKEND_URL}/materials/sites`, { timeout: TIMEOUT });
    if (response.status !== 200) throw new Error('Get sites failed');
    const { success, data, count } = response.data;
    if (!success) throw new Error('Sites query failed');
    log.info(`   Sites found: ${count}`);
    if (data.length > 0) {
      log.info(`   First site: ${data[0].nom} (${data[0].ville})`);
    }
  });

  // Test 5: Get suppliers
  await test('Get suppliers from MongoDB', async () => {
    const response = await axios.get(`${BACKEND_URL}/materials/suppliers`, { timeout: TIMEOUT });
    if (response.status !== 200) throw new Error('Get suppliers failed');
    const { success, data, count } = response.data;
    if (!success) throw new Error('Suppliers query failed');
    log.info(`   Suppliers found: ${count}`);
    if (data.length > 0) {
      log.info(`   First supplier: ${data[0].nom} (${data[0].ville})`);
    }
  });

  // Test 6: Weather endpoint
  await test('Weather API endpoint', async () => {
    const lat = 36.8065;
    const lng = 10.1815;
    const response = await axios.get(`${BACKEND_URL}/materials/weather?lat=${lat}&lng=${lng}`, { timeout: TIMEOUT });
    if (response.status !== 200) throw new Error('Weather API failed');
    const { success, weather } = response.data;
    if (!success || !weather) throw new Error('Weather data not available');
    log.info(`   Location: ${weather.cityName}`);
    log.info(`   Temperature: ${weather.temperature}°C`);
    log.info(`   Condition: ${weather.description}`);
  });

  // Test 7: Anomaly detection
  await test('Batch anomaly detection', async () => {
    const response = await axios.get(`${BACKEND_URL}/materials/anomalies/detect`, { timeout: 30000 });
    if (response.status !== 200) throw new Error('Anomaly detection failed');
    const { success, total_materials, anomalies_detected, theft_risk, waste_risk, over_consumption } = response.data;
    if (!success) throw new Error('Anomaly detection query failed');
    log.info(`   Materials analyzed: ${total_materials}`);
    log.info(`   Anomalies detected: ${anomalies_detected}`);
    log.info(`   Theft risk: ${theft_risk.length}`);
    log.info(`   Waste risk: ${waste_risk.length}`);
    log.info(`   Over consumption: ${over_consumption.length}`);
  });
}

// ============================================================================
// TESTS CONNEXIONS MONGODB
// ============================================================================

async function testMongoDBConnections() {
  log.section('MONGODB CONNECTIONS');

  // Test 1: Sites connection
  await test('MongoDB sites connection', async () => {
    const response = await axios.get(`${BACKEND_URL}/materials/sites/test`, { timeout: TIMEOUT });
    if (response.status !== 200) throw new Error('Sites test failed');
    const { success, data } = response.data;
    if (!success) throw new Error('Sites connection failed');
    log.info(`   Database: ${data.database}`);
    log.info(`   Collection: ${data.collection}`);
    log.info(`   Total sites: ${data.totalSites}`);
  });

  // Test 2: Suppliers connection
  await test('MongoDB suppliers connection', async () => {
    const response = await axios.get(`${BACKEND_URL}/materials/suppliers/test`, { timeout: TIMEOUT });
    if (response.status !== 200) throw new Error('Suppliers test failed');
    const { success, data } = response.data;
    if (!success) throw new Error('Suppliers connection failed');
    log.info(`   Database: ${data.database}`);
    log.info(`   Collection: ${data.collection}`);
    log.info(`   Total suppliers: ${data.totalSuppliers}`);
  });
}

// ============================================================================
// TESTS INTÉGRATION COMPLÈTE
// ============================================================================

async function testFullIntegration() {
  log.section('FULL INTEGRATION TESTS');

  // Test 1: Create material → Get prediction → Get suppliers
  await test('Full workflow: Create → Predict → Suppliers', async () => {
    // 1. Créer un matériau de test
    const materialData = {
      name: `Test Material ${Date.now()}`,
      code: `TEST-${Date.now()}`,
      category: 'béton',
      unit: 'kg',
      quantity: 100,
      minimumStock: 20,
      maximumStock: 500,
      reorderPoint: 30,
      status: 'active',
    };

    const createResponse = await axios.post(`${BACKEND_URL}/materials`, materialData, { timeout: TIMEOUT });
    if (createResponse.status !== 201) throw new Error('Material creation failed');
    const materialId = createResponse.data._id;
    log.info(`   Material created: ${materialId}`);

    // 2. Obtenir prédiction
    const predictionResponse = await axios.get(`${BACKEND_URL}/materials/${materialId}/prediction`, { timeout: 30000 });
    if (predictionResponse.status !== 200) throw new Error('Prediction failed');
    log.info(`   Prediction: ${predictionResponse.data.status} (${predictionResponse.data.hoursToOutOfStock}h)`);

    // 3. Obtenir fournisseurs recommandés
    const suppliersResponse = await axios.get(`${BACKEND_URL}/materials/${materialId}/suppliers`, { timeout: TIMEOUT });
    if (suppliersResponse.status !== 200) throw new Error('Suppliers recommendation failed');
    log.info(`   Suppliers found: ${suppliersResponse.data.count}`);

    // 4. Nettoyer (supprimer le matériau de test)
    await axios.delete(`${BACKEND_URL}/materials/${materialId}`, { timeout: TIMEOUT });
    log.info(`   Test material deleted`);
  });
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  log.title('🧪 TEST COMPLET - MATERIALS SYSTEM');
  log.info('Testing Backend (NestJS), ML-Prediction (FastAPI), and MongoDB connections');
  log.info('');

  const startTime = Date.now();

  try {
    // Test ML Service
    await testMLService();

    // Test Backend Service
    await testBackendService();

    // Test MongoDB Connections
    await testMongoDBConnections();

    // Test Full Integration
    await testFullIntegration();

  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Résumé
  log.title('📊 RÉSUMÉ DES TESTS');
  console.log(chalk.bold(`Total tests: ${totalTests}`));
  console.log(chalk.green.bold(`✅ Passed: ${passedTests}`));
  console.log(chalk.red.bold(`❌ Failed: ${failedTests}`));
  console.log(chalk.blue(`⏱️  Duration: ${duration}s`));
  console.log('');

  if (failedTests === 0) {
    log.success('🎉 TOUS LES TESTS SONT PASSÉS !');
    log.info('Le système materials est complètement fonctionnel.');
    process.exit(0);
  } else {
    log.error('❌ CERTAINS TESTS ONT ÉCHOUÉ');
    log.warn('Vérifiez les logs ci-dessus pour plus de détails.');
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  log.error(`Unhandled rejection: ${error.message}`);
  process.exit(1);
});

// Lancer les tests
main();
