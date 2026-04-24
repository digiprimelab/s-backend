require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    // 1. Connect to Database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 2. Check if Admin Exists
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (adminExists) {
      console.log('🛑 Admin account already exists. Skipping...');
      console.log(`\n📋 Existing Admin Details:`);
      console.log(`   Username: ${adminExists.username}`);
      console.log(`   Name: ${adminExists.name?.first || ''} ${adminExists.name?.last || ''}`);
      console.log(`   Email: ${adminExists.email || 'Not set'}`);
      console.log(`\n🔑 Login with: admin / admin123`);
    } else {
      // 3. Create New Admin with All Fields ✅
      const admin = new User({
        // Auth
        username: 'admin',
        password: 'admin123', // Will be hashed automatically
        
        // Personal Info ✅ NEW
        name: {
          first: 'School',
          last: 'Administrator'
        },
        email: 'admin@school.edu',
        dateOfBirth: new Date('1990-01-01'),
        userId: 'ADM001',
        
        // System
        role: 'admin',
        isActive: true
      });

      await admin.save();
      
      console.log('✅ Admin account created successfully!');
      console.log('\n' + '━'.repeat(50));
      console.log('👤 ADMIN LOGIN CREDENTIALS');
      console.log('━'.repeat(50));
      console.log(`   Username:    admin`);
      console.log(`   Password:    admin123`);
      console.log(`   User ID:     ADM001`);
      console.log(`   Email:       admin@school.edu`);
      console.log(`   Name:        School Administrator`);
      console.log(`   DOB:         1990-01-01`);
      console.log('━'.repeat(50));
      console.log('\n🔐 First login? Change password immediately!');
      console.log('🌐 Login at: http://localhost:5173/admin/login\n');
    }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    console.error('💡 Tip: Check your MONGODB_URI in .env file');
    process.exit(1);
  }
};

seedAdmin();