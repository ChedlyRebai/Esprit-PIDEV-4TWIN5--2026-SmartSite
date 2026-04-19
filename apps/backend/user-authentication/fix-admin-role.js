const mongoose = require('mongoose');

async function fixAdminRole() {
  try {
    await mongoose.connect('mongodb://localhost:27017/smartsite');
    
    const usersCollection = mongoose.connection.db.collection('users');
    
    // Mettre à jour l'admin pour avoir le bon role
    const result = await usersCollection.updateOne(
      { cin: 'admin001' },
      { 
        $set: { 
          role: '699e1c79ccc723bcf4a61cad', // super_admin role ID
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Admin role mis à jour:', result.modifiedCount, 'documents modifiés');
    
    // Mettre à jour l'utilisateur mm123 pour avoir le bon role
    const result2 = await usersCollection.updateOne(
      { cin: 'mm123' },
      { 
        $set: { 
          role: '699e1c79ccc723bcf4a61cb7', // user role ID
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ User mm123 role mis à jour:', result2.modifiedCount, 'documents modifiés');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixAdminRole();
