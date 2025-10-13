const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkAndSeedUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin user exists
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    
    if (adminUser) {
      console.log('✅ Admin user already exists');
      console.log('Email:', adminUser.email);
      console.log('Role:', adminUser.role);
      console.log('Active:', adminUser.isActive);
    } else {
      console.log('❌ Admin user not found. Creating...');
      
      const newAdmin = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'AdminPass123', // Will be hashed by the model
        role: 'admin',
        isActive: true
      });

      await newAdmin.save();
      console.log('✅ Admin user created successfully!');
      console.log('Email: admin@example.com');
      console.log('Password: AdminPass123');
    }

    // Count total users
    const userCount = await User.countDocuments();
    console.log(`\nTotal users in database: ${userCount}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

checkAndSeedUser();

