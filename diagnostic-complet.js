/**
 * Script de diagnostic complet pour identifier le problème
 */

import mongoose from 'mongoose';
import axios from 'axios';

const MONGODB_URI = 'mongodb://localhost:27017';
const MATERIAL_NAME = 'Peinture blanche';
const MATERIALS_API = 'http://localhost:3002/api/materials';

async function runDiagnostic() {
  console.log('🔍 DIAGNOSTIC COMPLET\n');
  console.log('='.repeat(80));

  try {
    // 1. Vérifier MongoDB
    console.log('\n1️⃣ VÉRIFICATION MONGODB');
    console.log('-'.repeat(80));
    
    await mongoose.connect(`${MONGODB_URI}/smartsite-materials`);
    console.log('✅ Connecté à MongoDB');

    // Récupérer le matériau
    const Material = mongoose.model('Material', new mongoose.Schema({}, { strict: false }));
    const material = await Material.findOne({ name: MATERIAL_NAME }).lean();

    if (!material) {
      console.error(`❌ Matériau "${MATERIAL_NAME}" non trouvé`);
      process.exit(1);
    }

    console.log(`✅ Matériau trouvé:`);
    console.log(`   ID: ${material._id}`);
    console.log(`   Nom: ${material.name}`);
    console.log(`   Code: ${material.code}`);
    console.log(`   Site ID: ${material.siteId || '❌ PAS DE SITE ASSIGNÉ'}`);

    const materialId = material._id.toString();
    const siteId = material.siteId?.toString();

    // 2. Vérifier le site dans MongoDB
    if (siteId) {
      console.log('\n2️⃣ VÉRIFICATION DU SITE DANS MONGODB');
      console.log('-'.repeat(80));
      
      const siteConnection = mongoose.createConnection(`${MONGODB_URI}/smartsite`);
      await new Promise((resolve, reject) => {
        siteConnection.once('open', resolve);
        siteConnection.once('error', reject);
      });
      
      const Site = siteConnection.model('Site', new mongoose.Schema({}, { strict: false }), 'sites');
      const site = await Site.findById(siteId).lean();

      if (site) {
        console.log('✅ Site trouvé dans MongoDB:');
        console.log(`   ID: ${site._id}`);
        console.log(`   Nom: ${site.nom || site.name || '❌ PAS DE NOM'}`);
        console.log(`   Ville: ${site.ville || site.city || '❌ PAS DE VILLE'}`);
        console.log(`   Adresse: ${site.adresse || site.address || '❌ PAS D\'ADRESSE'}`);
        
        // Vérifier les coordonnées
        if (site.coordinates) {
          console.log(`   ✅ Coordonnées (format coordinates):`);
          console.log(`      lat: ${site.coordinates.lat}`);
          console.log(`      lng: ${site.coordinates.lng}`);
        } else if (site.coordonnees) {
          console.log(`   ✅ Coordonnées (format coordonnees):`);
          console.log(`      latitude: ${site.coordonnees.latitude}`);
          console.log(`      longitude: ${site.coordonnees.longitude}`);
        } else {
          console.log(`   ❌ AUCUNE COORDONNÉE TROUVÉE`);
          console.log(`   Structure complète du site:`, JSON.stringify(site, null, 2));
        }
      } else {
        console.log(`❌ Site ${siteId} NON TROUVÉ dans MongoDB`);
      }

      await siteConnection.close();
    } else {
      console.log('\n2️⃣ ❌ PAS DE SITE ASSIGNÉ AU MATÉRIAU');
    }

    // 3. Vérifier l'API materials
    console.log('\n3️⃣ VÉRIFICATION API MATERIALS');
    console.log('-'.repeat(80));
    
    try {
      const response = await axios.get(`${MATERIALS_API}/${materialId}`);
      const enrichedMaterial = response.data;
      
      console.log('✅ API materials répond:');
      console.log(`   siteId: ${enrichedMaterial.siteId || '❌ MANQUANT'}`);
      console.log(`   siteName: ${enrichedMaterial.siteName || '❌ MANQUANT'}`);
      console.log(`   siteAddress: ${enrichedMaterial.siteAddress || '❌ MANQUANT'}`);
      
      if (enrichedMaterial.siteCoordinates) {
        console.log(`   ✅ siteCoordinates:`);
        console.log(`      lat: ${enrichedMaterial.siteCoordinates.lat}`);
        console.log(`      lng: ${enrichedMaterial.siteCoordinates.lng}`);
      } else {
        console.log(`   ❌ siteCoordinates: MANQUANT`);
      }
    } catch (error) {
      console.log(`❌ Erreur API materials: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data:`, error.response.data);
      }
    }

    // 4. Vérifier les mouvements
    console.log('\n4️⃣ VÉRIFICATION DES MOUVEMENTS');
    console.log('-'.repeat(80));
    
    const MaterialFlowLog = mongoose.model('MaterialFlowLog', new mongoose.Schema({}, { strict: false }));
    const movementsCount = await MaterialFlowLog.countDocuments({ 
      materialId: new mongoose.Types.ObjectId(materialId) 
    });
    
    console.log(`   ${movementsCount} mouvements trouvés dans MongoDB`);

    if (movementsCount > 0) {
      const movements = await MaterialFlowLog.find({ 
        materialId: new mongoose.Types.ObjectId(materialId) 
      })
        .sort({ timestamp: -1 })
        .limit(5)
        .lean();
      
      console.log('\n   Derniers mouvements:');
      movements.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.type}: ${m.quantity} unités - ${m.reason || 'Pas de raison'} (${new Date(m.timestamp).toLocaleString()})`);
      });
    }

    // Vérifier l'API movements
    try {
      const response = await axios.get(`${MATERIALS_API}/movements/${materialId}`);
      console.log(`\n   ✅ API movements répond: ${response.data.length} mouvements`);
    } catch (error) {
      console.log(`\n   ❌ Erreur API movements: ${error.message}`);
    }

    // 5. Vérifier les statistiques agrégées
    console.log('\n5️⃣ VÉRIFICATION STATISTIQUES AGRÉGÉES');
    console.log('-'.repeat(80));
    
    if (siteId) {
      try {
        const response = await axios.get(`http://localhost:3002/api/material-flow/aggregate/${materialId}?siteId=${siteId}`);
        const stats = response.data;
        
        console.log('✅ API aggregate répond:');
        console.log(`   Total Entrées: ${stats.totalEntries}`);
        console.log(`   Total Sorties: ${stats.totalExits}`);
        console.log(`   Solde Net: ${stats.netFlow}`);
        console.log(`   Anomalies: ${stats.totalAnomalies}`);
      } catch (error) {
        console.log(`❌ Erreur API aggregate: ${error.message}`);
      }
    } else {
      console.log('❌ Pas de siteId, impossible de récupérer les statistiques');
    }

    // 6. Résumé et recommandations
    console.log('\n6️⃣ RÉSUMÉ ET RECOMMANDATIONS');
    console.log('='.repeat(80));
    
    const issues = [];
    const solutions = [];

    if (!siteId) {
      issues.push('❌ Le matériau n\'a pas de site assigné');
      solutions.push('→ Assignez un site au matériau via l\'interface');
    }

    if (movementsCount === 0) {
      issues.push('❌ Aucun mouvement enregistré');
      solutions.push('→ Créez des mouvements de test avec test-create-movements.html');
    }

    if (issues.length === 0) {
      console.log('✅ TOUT EST CORRECT!');
      console.log('\nSi le problème persiste dans l\'interface:');
      console.log('1. Redémarrez le service materials (npm start)');
      console.log('2. Actualisez la page (F5)');
      console.log('3. Vérifiez les logs de la console (F12)');
    } else {
      console.log('PROBLÈMES DÉTECTÉS:\n');
      issues.forEach(issue => console.log(issue));
      console.log('\nSOLUTIONS:\n');
      solutions.forEach(solution => console.log(solution));
    }

    await mongoose.disconnect();
    console.log('\n✅ Diagnostic terminé');

  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error);
    process.exit(1);
  }
}

runDiagnostic();
