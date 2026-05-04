#!/usr/bin/env node

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/smartsite';
const SITE_ID = '69f0f069df4fbf107365c34a'; // ID du site qui pose problème

console.log('\n' + '='.repeat(80));
console.log('🔍 VÉRIFICATION SITE SPÉCIFIQUE');
console.log('='.repeat(80) + '\n');

async function checkSite() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connexion MongoDB établie\n');
    
    const db = client.db();
    const sitesCollection = db.collection('sites');
    const materialsCollection = db.collection('materials');
    
    console.log(`🔍 Recherche du site avec ID: ${SITE_ID}\n`);
    
    // Essayer de trouver le site avec ObjectId
    let site = null;
    try {
      site = await sitesCollection.findOne({ _id: new ObjectId(SITE_ID) });
      if (site) {
        console.log('✅ Site trouvé avec ObjectId!\n');
      }
    } catch (e) {
      console.log('⚠️  Impossible de convertir en ObjectId:', e.message);
    }
    
    // Essayer avec string
    if (!site) {
      site = await sitesCollection.findOne({ _id: SITE_ID });
      if (site) {
        console.log('✅ Site trouvé avec string ID!\n');
      }
    }
    
    if (site) {
      console.log('📍 INFORMATIONS DU SITE:\n');
      console.log(`  _id: ${site._id}`);
      console.log(`  nom: ${site.nom || 'N/A'}`);
      console.log(`  adresse: ${site.adresse || 'N/A'}`);
      console.log(`  ville: ${site.ville || 'N/A'}`);
      console.log(`  codePostal: ${site.codePostal || 'N/A'}`);
      console.log(`  coordonnees:`, site.coordonnees || 'MANQUANT');
      
      if (site.coordonnees?.latitude && site.coordonnees?.longitude) {
        console.log(`\n  ✅ GPS: ${site.coordonnees.latitude}, ${site.coordonnees.longitude}`);
      } else {
        console.log(`\n  ❌ GPS MANQUANT!`);
        console.log(`\n  💡 Pour ajouter GPS:`);
        console.log(`     mongo smartsite --eval "db.sites.updateOne({_id: ObjectId('${SITE_ID}')}, {\\$set: {coordonnees: {latitude: 48.8566, longitude: 2.3522}}})"`);
      }
    } else {
      console.log('❌ SITE NON TROUVÉ!\n');
      console.log('Ce site n\'existe pas dans la base de données.\n');
      
      // Lister tous les sites disponibles
      console.log('📋 SITES DISPONIBLES:\n');
      const allSites = await sitesCollection.find({}).toArray();
      
      if (allSites.length === 0) {
        console.log('❌ AUCUN SITE dans la base de données!\n');
        console.log('💡 Vous devez créer des sites d\'abord.\n');
      } else {
        allSites.forEach((s, index) => {
          console.log(`${index + 1}. ${s.nom || 'Sans nom'}`);
          console.log(`   _id: ${s._id}`);
          console.log(`   GPS: ${s.coordonnees?.latitude && s.coordonnees?.longitude ? `${s.coordonnees.latitude}, ${s.coordonnees.longitude}` : 'MANQUANT'}`);
          console.log('');
        });
        
        console.log('💡 SOLUTION: Réassigner les matériaux à un site valide\n');
        const validSite = allSites[0];
        console.log(`Exemple avec le site "${validSite.nom}" (${validSite._id}):\n`);
        console.log(`mongo smartsite --eval "db.materials.updateMany({siteId: ObjectId('${SITE_ID}')}, {\\$set: {siteId: ObjectId('${validSite._id}')}})"`);
      }
    }
    
    // Vérifier combien de matériaux utilisent ce site
    console.log('\n📦 MATÉRIAUX UTILISANT CE SITE:\n');
    
    let count = 0;
    try {
      count = await materialsCollection.countDocuments({ siteId: new ObjectId(SITE_ID) });
    } catch (e) {
      count = await materialsCollection.countDocuments({ siteId: SITE_ID });
    }
    
    console.log(`${count} matériau(x) assigné(s) à ce site\n`);
    
    if (count > 0 && !site) {
      console.log('⚠️  ATTENTION: Des matériaux sont assignés à un site qui n\'existe pas!\n');
      console.log('💡 SOLUTION: Réassigner ces matériaux à un site valide (voir commande ci-dessus)\n');
    }
    
    console.log('='.repeat(80) + '\n');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkSite();
