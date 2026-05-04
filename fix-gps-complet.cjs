#!/usr/bin/env node

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite';

// Coordonnées GPS Tunisia
const TUNISIA_GPS = {
  latitude: 33.8439,
  longitude: 9.4001
};

console.log('\n' + '='.repeat(80));
console.log('🔧 CORRECTION COMPLÈTE GPS - TUNISIA');
console.log('='.repeat(80) + '\n');
console.log(`📍 Coordonnées GPS: ${TUNISIA_GPS.latitude}, ${TUNISIA_GPS.longitude}\n`);

async function fixGPSComplet() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connexion MongoDB établie\n');
    
    const db = client.db();
    const sitesCollection = db.collection('sites');
    const materialsCollection = db.collection('materials');
    
    // ========== ÉTAPE 1: SITES ==========
    console.log('📍 ÉTAPE 1: CORRECTION DES SITES\n');
    
    let sites = await sitesCollection.find({}).toArray();
    console.log(`   ${sites.length} site(s) trouvé(s)`);
    
    if (sites.length === 0) {
      console.log('   ❌ Aucun site! Création d\'un site par défaut...');
      
      const defaultSite = {
        nom: "Chantier Tunisia",
        adresse: "Tunis",
        ville: "Tunis",
        codePostal: "1000",
        pays: "Tunisia",
        coordonnees: TUNISIA_GPS,
        isActive: true,
        createdAt: new Date()
      };
      
      const result = await sitesCollection.insertOne(defaultSite);
      console.log(`   ✅ Site créé: ${result.insertedId}`);
      sites = [{ _id: result.insertedId, ...defaultSite }];
    }
    
    // Ajouter GPS aux sites sans coordonnées
    let sitesUpdated = 0;
    for (const site of sites) {
      if (!site.coordonnees?.latitude || !site.coordonnees?.longitude) {
        await sitesCollection.updateOne(
          { _id: site._id },
          { $set: { coordonnees: TUNISIA_GPS } }
        );
        console.log(`   ✅ GPS ajouté à: ${site.nom}`);
        sitesUpdated++;
      }
    }
    
    if (sitesUpdated > 0) {
      console.log(`   ✅ ${sitesUpdated} site(s) mis à jour avec GPS`);
    } else {
      console.log(`   ✓  Tous les sites ont déjà des GPS`);
    }
    
    // Recharger les sites
    sites = await sitesCollection.find({}).toArray();
    console.log('');
    
    // ========== ÉTAPE 2: MATÉRIAUX ==========
    console.log('📦 ÉTAPE 2: CORRECTION DES MATÉRIAUX\n');
    
    const materials = await materialsCollection.find({}).toArray();
    console.log(`   ${materials.length} matériau(x) trouvé(s)`);
    
    let materialsFixed = 0;
    let materialsOk = 0;
    
    for (const material of materials) {
      let needsUpdate = false;
      let newSiteId = null;
      
      if (!material.siteId) {
        // Pas de site → assigner au premier site
        needsUpdate = true;
        newSiteId = sites[0]._id;
      } else {
        // Vérifier si le site existe
        const siteExists = sites.some(s => s._id.toString() === material.siteId.toString());
        if (!siteExists) {
          // Site invalide → réassigner
          needsUpdate = true;
          newSiteId = sites[0]._id;
        }
      }
      
      if (needsUpdate) {
        await materialsCollection.updateOne(
          { _id: material._id },
          { $set: { siteId: newSiteId } }
        );
        console.log(`   ✅ ${material.name}: Site assigné → ${sites[0].nom}`);
        materialsFixed++;
      } else {
        materialsOk++;
      }
    }
    
    if (materialsFixed > 0) {
      console.log(`   ✅ ${materialsFixed} matériau(x) corrigé(s)`);
    }
    if (materialsOk > 0) {
      console.log(`   ✓  ${materialsOk} matériau(x) déjà OK`);
    }
    console.log('');
    
    // ========== ÉTAPE 3: VÉRIFICATION ==========
    console.log('🔍 ÉTAPE 3: VÉRIFICATION FINALE\n');
    
    const finalSites = await sitesCollection.find({}).toArray();
    const sitesWithGPS = finalSites.filter(s => s.coordonnees?.latitude && s.coordonnees?.longitude);
    const sitesWithoutGPS = finalSites.filter(s => !s.coordonnees?.latitude || !s.coordonnees?.longitude);
    
    console.log(`   Sites avec GPS: ${sitesWithGPS.length}/${finalSites.length}`);
    
    if (sitesWithoutGPS.length > 0) {
      console.log(`   ❌ Sites SANS GPS:`);
      sitesWithoutGPS.forEach(s => console.log(`      - ${s.nom}`));
    }
    
    const finalMaterials = await materialsCollection.find({}).toArray();
    let validMaterials = 0;
    let invalidMaterials = 0;
    
    for (const material of finalMaterials) {
      if (material.siteId) {
        const siteExists = finalSites.some(s => s._id.toString() === material.siteId.toString());
        if (siteExists) {
          validMaterials++;
        } else {
          invalidMaterials++;
        }
      } else {
        invalidMaterials++;
      }
    }
    
    console.log(`   Matériaux avec site valide: ${validMaterials}/${finalMaterials.length}`);
    
    if (invalidMaterials > 0) {
      console.log(`   ❌ ${invalidMaterials} matériau(x) avec site invalide`);
    }
    console.log('');
    
    // ========== RÉSUMÉ ==========
    console.log('='.repeat(80));
    console.log('📊 RÉSUMÉ FINAL');
    console.log('='.repeat(80));
    console.log(`\n📍 SITES:`);
    console.log(`   Total: ${finalSites.length}`);
    console.log(`   Avec GPS: ${sitesWithGPS.length}`);
    console.log(`   Sans GPS: ${sitesWithoutGPS.length}`);
    console.log(`\n📦 MATÉRIAUX:`);
    console.log(`   Total: ${finalMaterials.length}`);
    console.log(`   Avec site valide: ${validMaterials}`);
    console.log(`   Site invalide/manquant: ${invalidMaterials}`);
    console.log('');
    
    if (sitesWithoutGPS.length === 0 && invalidMaterials === 0) {
      console.log('✅ TOUT EST OK!\n');
      console.log('📍 Tous les sites ont des GPS: ' + TUNISIA_GPS.latitude + ', ' + TUNISIA_GPS.longitude);
      console.log('📦 Tous les matériaux ont un site valide\n');
      console.log('🚀 Prochaines étapes:\n');
      console.log('1. Redémarrer le backend:');
      console.log('   cd apps/backend/materials-service && npm start\n');
      console.log('2. Ouvrir l\'application et vérifier que les GPS s\'affichent\n');
    } else {
      console.log('⚠️  PROBLÈMES DÉTECTÉS!\n');
      if (sitesWithoutGPS.length > 0) {
        console.log(`   - ${sitesWithoutGPS.length} site(s) sans GPS`);
      }
      if (invalidMaterials > 0) {
        console.log(`   - ${invalidMaterials} matériau(x) avec site invalide`);
      }
      console.log('\n💡 Relancer ce script pour corriger:\n');
      console.log('   node fix-gps-complet.cjs\n');
    }
    
    console.log('='.repeat(80) + '\n');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixGPSComplet();
