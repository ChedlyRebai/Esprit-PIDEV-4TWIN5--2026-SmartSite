const axios = require('axios');

const MATERIALS_SERVICE_URL = 'http://localhost:3009';
const TEST_EMAIL = 'jamar.wisoky@ethereal.email';

async function testEmailReport() {
  console.log('🧪 Test de Génération de Rapport Email');
  console.log('=====================================\n');

  try {
    console.log('📊 Envoi de la requête de rapport quotidien...');
    console.log(`   URL: ${MATERIALS_SERVICE_URL}/api/materials/reports/daily/send`);
    console.log(`   Email: ${TEST_EMAIL}\n`);

    const response = await axios.post(
      `${MATERIALS_SERVICE_URL}/api/materials/reports/daily/send`,
      { email: TEST_EMAIL },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000, // 30 secondes
      }
    );

    console.log('✅ Réponse reçue:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    if (response.data.success) {
      console.log('✅ SUCCÈS: Rapport envoyé avec succès!');
      console.log('📬 Vérifiez votre email sur: https://ethereal.email/messages');
      console.log('   Username: jamar.wisoky@ethereal.email');
      console.log('   Password: ppg5A4AUcaFHWFP3DY');
    } else {
      console.log('❌ ÉCHEC: Le rapport n\'a pas été envoyé');
      console.log(`   Message: ${response.data.message}`);
    }
  } catch (error) {
    console.log('❌ ERREUR lors de la requête:');
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.statusText}`);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('   Aucune réponse reçue du serveur');
      console.log('   Le service materials-service est-il démarré sur le port 3009?');
    } else {
      console.log(`   ${error.message}`);
    }
  }

  console.log('\n=====================================');
}

// Test de connexion au service
async function testServiceConnection() {
  console.log('🔍 Test de connexion au service...');
  try {
    const response = await axios.get(`${MATERIALS_SERVICE_URL}/api/materials/dashboard`, {
      timeout: 5000,
    });
    console.log('✅ Service materials accessible\n');
    return true;
  } catch (error) {
    console.log('❌ Service materials NON accessible');
    console.log('   Démarrez le service avec: cd apps/backend/materials-service && npm run start:dev\n');
    return false;
  }
}

// Exécution
(async () => {
  const isConnected = await testServiceConnection();
  if (isConnected) {
    await testEmailReport();
  }
})();
