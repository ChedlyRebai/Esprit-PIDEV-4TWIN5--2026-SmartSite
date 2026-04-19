const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createSpecificAdminUser() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartsite';
    console.log(`📡 Connecting to MongoDB: ${mongoUri.replace(/([^:]*):([^@]*)@/, '$1:***@')}`);
    await mongoose.connect(mongoUri);
    
    const usersCollection = mongoose.connection.db.collection('users');
    const rolesCollection = mongoose.connection.db.collection('roles');
    
    // Find super_admin role
    const superAdminRole = await rolesCollection.findOne({ name: 'super_admin' });
    if (!superAdminRole) {
      console.log('❌ Super admin role not found. Please run create-all-roles.js first.');
      return;
    }
    
    // Check if admin user already exists
    const existingAdmin = await usersCollection.findOne({ cin: 'admin001' });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists. Updating...');
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      // Update existing admin to be approved with new password
      await usersCollection.updateOne(
        { cin: 'admin001' },
        { 
          $set: {
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@smartsite.com',
            password: hashedPassword,
            status: 'approved',
            isActif: true,
            emailVerified: true,
            role: superAdminRole._id,
            updatedAt: new Date()
          }
        }
      );
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      const adminUser = {
        cin: 'admin001',
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
    console.log('   CIN: admin001');
    console.log('   Password: Admin@123');
    console.log('   Status: Approved');
    console.log('   Role: Super Admin');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createSpecificAdminUser();
