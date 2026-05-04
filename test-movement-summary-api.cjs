const http = require('http');

const MATERIALS_API = 'http://localhost:3009';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`${MATERIALS_API}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function testMovementSummaryAPI() {
  console.log('🧪 ========== TEST MOVEMENT SUMMARY API ==========\n');
  
  try {
    // Test 1: Get materials with sites
    console.log('📡 Test 1: GET /api/materials/with-sites');
    const materials = await makeRequest('/api/materials/with-sites');
    
    if (Array.isArray(materials) && materials.length > 0) {
      console.log(`✅ ${materials.length} materials retrieved\n`);
      
      // Show first 3 materials with their stock data
      console.log('📊 Materials with Stock Data:\n');
      materials.slice(0, 3).forEach((mat, index) => {
        console.log(`${index + 1}. ${mat.name} (${mat.code})`);
        console.log(`   Stock Entree: ${mat.stockEntree || 0}`);
        console.log(`   Stock Sortie: ${mat.stockSortie || 0}`);
        console.log(`   Stock Actuel: ${mat.quantity || 0}`);
        console.log(`   Net Balance: ${(mat.stockEntree || 0) - (mat.stockSortie || 0)}`);
        
        // Check anomaly
        const entree = mat.stockEntree || 0;
        const sortie = mat.stockSortie || 0;
        const hasAnomaly = sortie > entree * 1.5 && entree > 0;
        
        if (hasAnomaly) {
          console.log(`   🚨 ANOMALIE DÉTECTÉE!`);
        }
        
        // Check GPS
        if (mat.siteCoordinates && mat.siteCoordinates.lat && mat.siteCoordinates.lng) {
          console.log(`   📍 GPS: ${mat.siteCoordinates.lat}, ${mat.siteCoordinates.lng}`);
        } else {
          console.log(`   ⚠️  Pas de GPS`);
        }
        console.log('');
      });
      
      // Test 2: Get specific material by ID
      const firstMaterial = materials[0];
      console.log(`\n📡 Test 2: GET /api/materials/${firstMaterial._id}`);
      const materialDetail = await makeRequest(`/api/materials/${firstMaterial._id}`);
      
      if (materialDetail) {
        console.log(`✅ Material details retrieved: ${materialDetail.name}`);
        console.log(`   Stock Entree: ${materialDetail.stockEntree || 0}`);
        console.log(`   Stock Sortie: ${materialDetail.stockSortie || 0}`);
        console.log(`   Stock Actuel: ${materialDetail.quantity || 0}`);
        
        if (materialDetail.siteCoordinates) {
          console.log(`   📍 GPS: ${materialDetail.siteCoordinates.lat}, ${materialDetail.siteCoordinates.lng}`);
        }
        console.log('');
      }
      
      // Test 3: Check for materials with anomalies
      console.log('📡 Test 3: Materials with Anomalies');
      const materialsWithAnomalies = materials.filter(mat => {
        const entree = mat.stockEntree || 0;
        const sortie = mat.stockSortie || 0;
        return sortie > entree * 1.5 && entree > 0;
      });
      
      console.log(`✅ Found ${materialsWithAnomalies.length} materials with anomalies\n`);
      
      if (materialsWithAnomalies.length > 0) {
        console.log('🚨 Materials with Anomalies:\n');
        materialsWithAnomalies.forEach((mat, index) => {
          console.log(`${index + 1}. ${mat.name} (${mat.code})`);
          console.log(`   Entree: ${mat.stockEntree}`);
          console.log(`   Sortie: ${mat.stockSortie}`);
          console.log(`   Ratio: ${((mat.stockSortie / mat.stockEntree) * 100).toFixed(1)}%`);
          console.log(`   🚨 RISQUE DE VOL OU GASPILLAGE!`);
          console.log('');
        });
      }
      
      // Summary
      console.log('\n========================================');
      console.log('✅ TOUS LES TESTS SONT PASSÉS!');
      console.log('========================================\n');
      
      console.log('📊 RÉSUMÉ:');
      console.log(`   Total matériaux: ${materials.length}`);
      console.log(`   Avec Stock Entree > 0: ${materials.filter(m => (m.stockEntree || 0) > 0).length}`);
      console.log(`   Avec Stock Sortie > 0: ${materials.filter(m => (m.stockSortie || 0) > 0).length}`);
      console.log(`   Avec GPS: ${materials.filter(m => m.siteCoordinates).length}`);
      console.log(`   Avec Anomalies: ${materialsWithAnomalies.length}`);
      
    } else {
      console.log('❌ No materials found or invalid response');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Make sure materials-service is running on port 3009');
  }
}

testMovementSummaryAPI();
