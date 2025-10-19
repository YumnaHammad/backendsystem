const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seedFreshData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Create Admin User
    console.log('👤 Creating Admin User...');
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'AdminPass123',
      role: 'admin',
      isActive: true
    });
    await adminUser.save();
    console.log('✅ Admin user created');
    console.log('   Email: admin@example.com');
    console.log('   Password: AdminPass123\n');

    // Create Manager User (Optional)
    console.log('👤 Creating Manager User...');
    const managerUser = new User({
      firstName: 'Manager',
      lastName: 'User',
      email: 'manager@example.com',
      password: 'ManagerPass123',
      role: 'manager',
      isActive: true
    });
    await managerUser.save();c backend
    console.log('✅ Manager user created');
    console.log('   Email: manager@example.com');
    console.log('   Password: ManagerPass123\n');

    // Create Employee User (Optional)
    console.log('👤 Creating Employee User...');
    const employeeUser = new User({
      firstName: 'Employee',
      lastName: 'User',
      email: 'employee@example.com',
      password: 'EmployeePass123',
      role: 'employee',
      isActive: true
    });
    await employeeUser.save();
    console.log('✅ Employee user created');
    console.log('   Email: employee@example.com');
    console.log('   Password: EmployeePass123\n');

    console.log('🎉 Fresh data seeded successfully!\n');
    console.log('📝 Summary:');
    console.log('  ✅ 3 Users created (Admin, Manager, Employee)');
    console.log('  ✅ Database ready for use\n');
    
    console.log('🚀 Next Steps:');
    console.log('  1. Start backend: npm run dev');
    console.log('  2. Start frontend: npm run dev');
    console.log('  3. Login with: admin@example.com / AdminPass123');
    console.log('  4. Create data through the frontend!\n');

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seedFreshData();

