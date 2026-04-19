const mongoose = require('mongoose');

async function createMissingUserRole() {
  try {
    await mongoose.connect('mongodb://localhost:27017/smartsite');
    
    const rolesCollection = mongoose.connection.db.collection('roles');
    
    // Créer le role user manquant
    const userRole = {
      _id: '699e1c79ccc723bcf4a61cb7',
      name: 'user',
      description: 'Utilisateur standard',
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const existingRole = await rolesCollection.findOne({ _id: userRole._id });
    if (!existingRole) {
      await rolesCollection.insertOne(userRole);
      console.log('✅ Role user créé');
    } else {
      console.log('ℹ️  Role user existe déjà');
    }
    
    // Vérifier tous les roles
    const allRoles = await rolesCollection.find({}).toArray();
    console.log('📋 Tous les roles:');
    allRoles.forEach(role => {
      console.log('- ID:', role._id, 'Name:', role.name);
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createMissingUserRole();
