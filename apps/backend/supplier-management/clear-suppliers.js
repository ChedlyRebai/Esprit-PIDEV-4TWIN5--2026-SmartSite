const mongoose = require('mongoose');

async function clearSuppliersCollection() {
  try {
    await mongoose.connect('mongodb://localhost:27017/smartsite');
    const db = mongoose.connection.db;
    
    // Supprimer la collection suppliers
    await db.collection('suppliers').drop();
    console.log('✅ Collection "suppliers" supprimée');
    
    // Vérifier les collections restantes
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Collections dans la base:');
    collections.forEach(col => console.log(` - ${col.name}`));
    
    await mongoose.connection.close();
    console.log('\n✅ La collection sera recréée automatiquement au premier POST /suppliers');
  } catch (error) {
    if (error.code === 26) {
      console.log('ℹ️ Collection "suppliers" n\'existait pas déjà');
    } else {
      console.error('❌ Erreur:', error.message);
    }
    await mongoose.connection.close();
  }
}

clearSuppliersCollection();
