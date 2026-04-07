const mongoose = require('mongoose');

async function fixRoleIds() {
  try {
    await mongoose.connect('mongodb://localhost:27017/smartsite');
    
    const rolesCollection = mongoose.connection.db.collection('roles');
    const usersCollection = mongoose.connection.db.collection('users');
    
    // Obtenir les vrais IDs des roles
    const roles = await rolesCollection.find({}).toArray();
    const roleMap = {};
    
    roles.forEach(role => {
      roleMap[role.name] = role._id.toString();
    });
    
    console.log('📋 Mapping des roles:', roleMap);
    
    // Mettre à jour tous les utilisateurs avec les bons IDs de role
    const users = await usersCollection.find({}).toArray();
    let updatedCount = 0;
    
    for (const user of users) {
      if (user.role) {
        const currentRoleId = user.role.toString();
        const roleName = Object.keys(roleMap).find(key => roleMap[key] === currentRoleId);
        
        if (roleName) {
          // L'utilisateur a un role valide, on le garde
          console.log('✅ Utilisateur', user.cin, 'role déjà valide:', roleName);
        } else {
          // L'utilisateur a un role invalide, on lui assigne le role 'user'
          const userRoleId = roleMap['user'];
          if (userRoleId) {
            await usersCollection.updateOne(
              { _id: user._id },
              { $set: { role: userRoleId } }
            );
            updatedCount++;
            console.log('🔄 Utilisateur', user.cin, 'role mis à jour: user');
          }
        }
      } else {
        // L'utilisateur n'a pas de role, on lui assigne le role 'user'
        const userRoleId = roleMap['user'];
        if (userRoleId) {
          await usersCollection.updateOne(
            { _id: user._id },
            { $set: { role: userRoleId } }
          );
          updatedCount++;
          console.log('🔄 Utilisateur', user.cin, 'role assigné: user');
        }
      }
    }
    
    console.log('✅ Mise à jour terminée:', updatedCount, 'utilisateurs modifiés');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixRoleIds();
