const axios = require('axios');

const MATERIALS_API = 'http://localhost:3009/api/materials';
const SITES_API = 'http://localhost:3009/api/sites';

async function verificationFinale() {
  console.log('🔍 ========== VÉRIFICATION FINALE ==========\n');
  
  let allTestsPassed = true;
  
  // Test 1: Vérifier que le service materials est accessible
  console.log('📡 Test 1: Service Materials accessible...');
  try {
    const response = await axios.get(`${MATERIALS_API}?page=1&limit=5`);
    if (response.status === 200) {
      console.log('✅ Service Materials OK');
      console.log(`   ${response.data.data?.length || 0} matériaux trouvés\n`);
    }
  } catch (error) {
    console.log('❌ Service Materials inaccessible');
    console.log(`   Erreur: ${error.message}\n`);
    allTestsPassed = false;
  }
  
  // Test 2: Vérifier que les sites sont accessibles via l'API
  console.log('📡 Test 2: Service Sites accessible...');
  try {
    const response = await axios.get(SITES_API);
    if (response.status === 200) {
      const sites = response.data;
      console.log('✅ Service Sites OK');
      console.log(`   ${sites.length} sites trouvés`);
      
      // Vérifier qu'au moins un site a des coordonnées GPS
      const sitesWithGPS = sites.filter(s => s.coordinates && s.coordinates.lat && s.coordinates.lng);
      console.log(`   ${sitesWithGPS.length} sites avec GPS\n`);
      
      if (sitesWithGPS.length > 0) {
        console.log('   Exemple de site avec GPS:');
        const site = sitesWithGPS[0];
        console.log(`   - Nom: ${site.nom}`);
        console.log(`   - GPS: 📍 ${site.coordinates.lat}, ${site.coordinates.lng}\n`);
      }
    }
  } catch (error) {
    console.log('❌ Service Sites inaccessible');
    console.log(`   Erreur: ${error.message}\n`);
    allTestsPassed = false;
  }
  
  // Test 3: Vérifier qu'un matériau a des informations de site avec GPS
  console.log('📡 Test 3: Matériaux avec GPS...');
  try {
    const response = await axios.get(`${MATERIALS_API}/with-sites`);
    if (response.status === 200) {
      const materials = response.data;
      const materialsWithGPS = materials.filter(m => m.siteCoordinates && m.siteCoordinates.lat && m.siteCoordinates.lng);
      
      console.log('✅ Matériaux avec GPS OK');
      console.log(`   ${materialsWithGPS.length}/${materials.length} matériaux ont des coordonnées GPS\n`);
      
      if (materialsWithGPS.length > 0) {
        console.log('   Exemple de matériau avec GPS:');
        const mat = materialsWithGPS[0];
        console.log(`   - Nom: ${mat.name}`);
        console.log(`   - Code: ${mat.code}`);
        console.log(`   - Site: ${mat.siteName}`);
        console.log(`   - GPS: 📍 ${mat.siteCoordinates.lat}, ${mat.siteCoordinates.lng}\n`);
      } else {
        console.log('⚠️  Aucun matériau n\'a de GPS assigné\n');
      }
    }
  } catch (error) {
    console.log('❌ Erreur récupération matériaux avec GPS');
    console.log(`   Erreur: ${error.message}\n`);
    allTestsPassed = false;
  }
  
  // Test 4: Vérifier les statistiques de flow
  console.log('📡 Test 4: Flow Logs et Statistiques...');
  try {
    const response = await axios.get(`${MATERIALS_API}?page=1&limit=1`);
    if (response.status === 200 && response.data.data && response.data.data.length > 0) {
      const material = response.data.data[0];
      
      console.log('✅ Statistiques de stock OK');
      console.log(`   Matériau: ${material.name}`);
      console.log(`   Stock Entree: ${material.stockEntree || 0}`);
      console.log(`   Stock Sortie: ${material.stockSortie || 0}`);
      console.log(`   Stock Actuel: ${material.quantity || 0}\n`);
      
      if ((material.stockEntree || 0) > 0 || (material.stockSortie || 0) > 0) {
        console.log('   ✅ Le matériau a des données de mouvement\n');
      } else {
        console.log('   ⚠️  Le matériau n\'a pas encore de mouvements enregistrés\n');
      }
    }
  } catch (error) {
    console.log('❌ Erreur récupération statistiques');
    console.log(`   Erreur: ${error.message}\n`);
    allTestsPassed = false;
  }
  
  // Test 5: Vérifier l'endpoint de flow logs
  console.log('📡 Test 5: Endpoint Flow Logs...');
  try {
    const response = await axios.get('http://localhost:3009/api/material-flow?limit=5');
    if (response.status === 200) {
      console.log('✅ Endpoint Flow Logs OK');
      console.log(`   ${response.data.total || 0} flow logs dans la base\n`);
    }
  } catch (error) {
    console.log('❌ Endpoint Flow Logs inaccessible');
    console.log(`   Erreur: ${error.message}\n`);
    allTestsPassed = false;
  }
  
  // Résumé final
  console.log('\n========================================');
  if (allTestsPassed) {
    console.log('✅ TOUS LES TESTS SONT PASSÉS!');
    console.log('✅ Le système est opérationnel');
  } else {
    console.log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('⚠️  Vérifiez que tous les services sont démarrés');
  }
  console.log('========================================\n');
  
  // Instructions
  console.log('📋 PROCHAINES ÉTAPES:');
  console.log('1. Ouvrir le frontend: http://localhost:5173');
  console.log('2. Aller dans Materials');
  console.log('3. Cliquer sur un matériau');
  console.log('4. Vérifier que GPS s\'affiche: 📍 33.8439, 9.4001');
  console.log('5. Vérifier Movement Summary affiche les valeurs');
  console.log('6. Vérifier qu\'il n\'y a pas d\'alerte d\'expiration dupliquée\n');
}

verificationFinale().catch(console.error);
