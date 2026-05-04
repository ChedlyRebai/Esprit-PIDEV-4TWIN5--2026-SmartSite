// Script de test pour vérifier les données du matériau
const axios = require('axios');

const MATERIAL_ID = ''; // À remplir avec l'ID du matériau

async function testMaterialData() {
  try {
    console.log('🔍 Test des données du matériau...\n');

    // 1. Récupérer le matériau
    console.log('1️⃣ Récupération du matériau...');
    const materialResponse = await axios.get(`http://localhost:3002/api/materials/${MATERIAL_ID}`);
    const material = materialResponse.data;
    console.log('✅ Matériau récupéré:', {
      _id: material._id,
      name: material.name,
      code: material.code,
      siteId: material.siteId,
      siteName: material.siteName,
      siteCoordinates: material.siteCoordinates,
    });

    // 2. Récupérer les mouvements
    console.log('\n2️⃣ Récupération des mouvements...');
    const movementsResponse = await axios.get(`http://localhost:3002/api/materials/movements/${MATERIAL_ID}`);
    const movements = movementsResponse.data;
    console.log(`✅ ${movements.length} mouvements trouvés`);
    if (movements.length > 0) {
      console.log('Premier mouvement:', movements[0]);
    }

    // 3. Récupérer les statistiques agrégées
    console.log('\n3️⃣ Récupération des statistiques agrégées...');
    const statsUrl = material.siteId 
      ? `http://localhost:3002/api/material-flow/aggregate/${MATERIAL_ID}?siteId=${material.siteId}`
      : `http://localhost:3002/api/material-flow/aggregate/${MATERIAL_ID}`;
    const statsResponse = await axios.get(statsUrl);
    const stats = statsResponse.data;
    console.log('✅ Statistiques:', stats);

    // 4. Vérifier la météo si coordonnées disponibles
    if (material.siteCoordinates?.lat && material.siteCoordinates?.lng) {
      console.log('\n4️⃣ Test de la météo...');
      const weatherResponse = await axios.get(
        `http://localhost:3002/api/materials/weather?lat=${material.siteCoordinates.lat}&lng=${material.siteCoordinates.lng}`
      );
      console.log('✅ Météo:', weatherResponse.data);
    } else {
      console.log('\n⚠️ Pas de coordonnées GPS disponibles pour la météo');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

testMaterialData();
