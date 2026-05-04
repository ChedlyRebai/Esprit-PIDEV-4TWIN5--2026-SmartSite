#!/usr/bin/env node

const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite';
const API_URL = 'http://localhost:3002/api';

console.log('\n' + '='.repeat(80));
console.log('🚨 DIAGNOSTIC GPS URGENT');
console.log('='.repeat(80) + '\n');

async function diagnose() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connexion MongoDB établie\n');
    
    const db = client.db();
    const sitesCollection = db.collection('sites');
    const materialsCollection = db.collection('materials');
    
    // 1. Vérifier les sites
    console.log('📍 ÉTAPE 1: VÉRIFICATION DES SITES\n');
    const sites = await sitesCollection.find({}).toArray();
    console.log(`Total sites: ${sites.length}\n`);
    
    if (sites.length === 0) {
      console.log('❌ AUCUN SITE TROUVÉ!');
      console.log('   → Vous devez créer des sites d\'abord\n');
      await client.close();
      return;
    }
    
    // Afficher tous les sites avec détails
    sites.forEach((site, index) => {
      console.log(`Site ${index + 1}:`);
      console.log(`  _id: ${site._id}`);
      console.log(`  nom: ${site.nom || 'N/A'}`);
      console.log(`  adresse: ${site.adresse || 'N/A'}`);
      console.log(`  ville: ${site.ville || 'N/A'}`);
      console.log(`  coordonnees:`, site.coordonnees || 'MANQUANT');
      
      if (site.coordonnees?.latitude && site.coordonnees?.longitude) {
        console.log(`  ✅ GPS: ${site.coordonnees.latitude}, ${site.coordonnees.longitude}`);
      } else {
        console.log(`  ❌ GPS: MANQUANT`);
      }
      console.log('');
    });
    
    const sitesWithGPS = sites.filter(s => s.coordonnees?.latitude && s.coordonnees?.longitude);
    console.log(`📊 Résumé: ${sitesWithGPS.length}/${sites.length} sites avec GPS\n`);
    
    // 2. Vérifier les matériaux
    console.log('📦 ÉTAPE 2: VÉRIFICATION DES MATÉRIAUX\n');
    const materials = await materialsCollection.find({}).limit(5).toArray();
    console.log(`Total matériaux (échantillon): ${materials.length}\n`);
    
    if (materials.length === 0) {
      console.log('❌ AUCUN MATÉRIAU TROUVÉ!\n');
      await client.close();
      return;
    }
    
    for (const material of materials) {
      console.log(`Matériau: ${material.name}`);
      console.log(`  _id: ${material._id}`);
      console.log(`  siteId: ${material.siteId || 'NON ASSIGNÉ'}`);
      
      if (material.siteId) {
        // Chercher le site correspondant
        let siteId = material.siteId;
        
        // Convertir en ObjectId si c'est une string
        if (typeof siteId === 'string') {
          try {
            siteId = new ObjectId(siteId);
          } catch (e) {
            console.log(`  ⚠️  siteId est une string invalide: ${material.siteId}`);
          }
        }
        
        const site = await sitesCollection.findOne({ _id: siteId });
        
        if (site) {
          console.log(`  ✅ Site trouvé: ${site.nom}`);
          console.log(`     adresse: ${site.adresse || 'N/A'}`);
          
          if (site.coordonnees?.latitude && site.coordonnees?.longitude) {
            console.log(`     ✅ GPS: ${site.coordonnees.latitude}, ${site.coordonnees.longitude}`);
          } else {
            console.log(`     ❌ GPS: MANQUANT`);
            console.log(`     Structure coordonnees:`, JSON.stringify(site.coordonnees, null, 2));
          }
        } else {
          console.log(`  ❌ SITE NON TROUVÉ avec _id: ${material.siteId}`);
          console.log(`     Type de siteId: ${typeof material.siteId}`);
          console.log(`     Valeur: ${material.siteId}`);
        }
      } else {
        console.log(`  ⚠️  Pas de siteId assigné`);
      }
      console.log('');
    }
    
    // 3. Tester l'API
    console.log('📡 ÉTAPE 3: TEST API\n');
    
    try {
      const response = await axios.get(`${API_URL}/materials`);
      const apiMaterials = response.data.data || response.data;
      
      console.log(`✅ API répond: ${apiMaterials.length} matériaux\n`);
      
      if (apiMaterials.length > 0) {
        const sample = apiMaterials[0];
        console.log(`Exemple API: ${sample.name}`);
        console.log(`  siteName: ${sample.siteName || 'N/A'}`);
        console.log(`  siteAddress: ${sample.siteAddress || 'N/A'}`);
        console.log(`  siteCoordinates:`, sample.siteCoordinates || 'NULL');
        
        if (sample.siteCoordinates) {
          console.log(`  ✅ GPS dans API: ${sample.siteCoordinates.lat}, ${sample.siteCoordinates.lng}`);
        } else {
          console.log(`  ❌ GPS MANQUANT dans API`);
        }
      }
    } catch (error) {
      console.error('❌ Erreur API:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.error('   → Le backend n\'est pas démarré!');
      }
    }
    
    // 4. Recommandations
    console.log('\n' + '='.repeat(80));
    console.log('💡 RECOMMANDATIONS\n');
    
    if (sitesWithGPS.length === 0) {
      console.log('🔴 PROBLÈME CRITIQUE: Aucun site n\'a de coordonnées GPS!');
      console.log('\n✅ SOLUTION:');
      console.log('   node add-gps-to-sites.cjs\n');
    } else if (sitesWithGPS.length < sites.length) {
      console.log(`⚠️  ${sites.length - sitesWithGPS.length} sites sans GPS`);
      console.log('\n✅ SOLUTION:');
      console.log('   node add-gps-to-sites.cjs\n');
    } else {
      console.log('✅ Tous les sites ont des GPS!');
      console.log('\nSi le problème persiste:');
      console.log('1. Vérifier les logs du backend (npm start)');
      console.log('2. Chercher: "🔍 Attempting to fetch site with ID"');
      console.log('3. Vérifier si le site est trouvé ou non\n');
    }
    
    console.log('='.repeat(80) + '\n');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  }
}

diagnose();
