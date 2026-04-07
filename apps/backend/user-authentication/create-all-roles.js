const mongoose = require('mongoose');

async function createAllRoles() {
  try {
    await mongoose.connect('mongodb://localhost:27017/smartsite');
    
    const rolesCollection = mongoose.connection.db.collection('roles');
    
    // Liste de tous les roles
    const allRoles = [
      { _id: '699e1c79ccc723bcf4a61cad', name: 'super_admin', description: 'Administrateur système' },
      { _id: '699e1c79ccc723bcf4a61cae', name: 'director', description: 'Directeur' },
      { _id: '699e1c79ccc723bcf4a61caf', name: 'project_manager', description: 'Chef de projet' },
      { _id: '699e1c79ccc723bcf4a61cb0', name: 'site_manager', description: 'Gestionnaire de site' },
      { _id: '699e1c79ccc723bcf4a61cb1', name: 'works_manager', description: 'Gestionnaire des travaux' },
      { _id: '699e1c79ccc723bcf4a61cb2', name: 'accountant', description: 'Comptable' },
      { _id: '699e1c79ccc723bcf4a61cb3', name: 'procurement_manager', description: 'Gestionnaire des achats' },
      { _id: '699e1c79ccc723bcf4a61cb4', name: 'qhse_manager', description: 'Gestionnaire QHSE' },
      { _id: '699e1c79ccc723bcf4a61cb5', name: 'client', description: 'Client' },
      { _id: '699e1c79ccc723bcf4a61cb6', name: 'subcontractor', description: 'Sous-traitant' },
      { _id: '699e1c79ccc723bcf4a61cb7', name: 'user', description: 'Utilisateur standard' }
    ];
    
    // Insérer tous les roles
    for (const role of allRoles) {
      const existingRole = await rolesCollection.findOne({ _id: role._id });
      if (!existingRole) {
        await rolesCollection.insertOne({
          ...role,
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('✅ Role créé:', role.name);
      } else {
        console.log('ℹ️  Role existe déjà:', role.name);
      }
    }
    
    console.log('🎉 Tous les roles sont maintenant disponibles!');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createAllRoles();
