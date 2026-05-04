/**
 * Script simple pour créer des mouvements de test
 * Usage: node create-movements-simple.js
 */

const axios = require('axios');

// ⚠️ MODIFIEZ CES VALEURS AVEC VOS IDs
const MATERIAL_ID = '674a5e3a2c5e8f001c8e4b8a'; // Remplacez par l'ID de votre matériau
const SITE_ID = '674a5e3a2c5e8f001c8e4b8b';     // Remplacez par l'ID de votre site

const API_URL = 'http://localhost:3002/api/material-flow/test-movements';

async function createTestMovements() {
  console.log('🔧 Création de mouvements de test...\n');
  console.log(`📦 Material ID: ${MATERIAL_ID}`);
  console.log(`🏗️  Site ID: ${SITE_ID}\n`);

  try {
    console.log('📡 Envoi de la requête...');
    const response = await axios.post(API_URL, {
      materialId: MATERIAL_ID,
      siteId: SITE_ID,
    });

    if (response.data.success) {
      console.log('\n✅ SUCCÈS!');
      console.log(`📊 ${response.data.message}`);
      console.log('\n📋 Mouvements créés:');
      response.data.movements.forEach((movement, index) => {
        console.log(`   ${index + 1}. ${movement.type}: ${movement.quantity} unités - ${movement.reason}`);
      });
      console.log('\n🔄 Actualisez la page des détails du matériau pour voir les changements!');
    } else {
      console.error('\n❌ ERREUR:', response.data.message);
    }
  } catch (error) {
    console.error('\n❌ ERREUR DE CONNEXION:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.message}`);
    } else if (error.request) {
      console.error('   Le serveur ne répond pas.');
      console.error('   Assurez-vous que le service materials est démarré sur le port 3002.');
    } else {
      console.error(`   ${error.message}`);
    }
  }
}

// Vérifier si axios est installé
try {
  require.resolve('axios');
  createTestMovements();
} catch (e) {
  console.error('❌ axios n\'est pas installé.');
  console.error('📦 Installez-le avec: npm install axios');
  console.error('Ou utilisez le fichier test-create-movements.html à la place.');
}
