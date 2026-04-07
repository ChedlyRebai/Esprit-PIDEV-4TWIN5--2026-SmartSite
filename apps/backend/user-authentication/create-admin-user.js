const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function createAdminUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/smartsite');
    
    const usersCollection = mongoose.connection.db.collection('users');
    const rolesCollection = mongoose.connection.db.collection('roles');
    
    // Find super_admin role
    const superAdminRole = await rolesCollection.findOne({ name: 'super_admin' });
    if (!superAdminRole) {
      console.log('❌ Super admin role not found. Please run create-all-roles.js first.');
      return;
    }
    
    // Check if admin user already exists
    const existingAdmin = await usersCollection.findOne({ cin: '12345678' });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists. Updating...');
      
      // Update existing admin to be approved
      await usersCollection.updateOne(
        { cin: '12345678' },
        { 
          $set: {
            status: 'approved',
            isActif: true,
            emailVerified: true,
            role: superAdminRole._id
          }
        }
      );
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = {
        cin: '12345678',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@smartsite.com',
        telephone: '+21612345678',
        address: 'Tunis, Tunisia',
        password: hashedPassword,
        role: superAdminRole._id,
        status: 'approved',
        isActif: true,
        emailVerified: true,
        companyName: 'SmartSite',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await usersCollection.insertOne(adminUser);
      console.log('✅ Admin user created successfully');
    }
    
    console.log('🎉 Admin login credentials:');
    console.log('   CIN: 12345678');
    console.log('   Password: admin123');
    console.log('   Status: Approved');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createAdminUser();
