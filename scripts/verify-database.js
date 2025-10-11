const mongoose = require('mongoose');
const { Product, Warehouse, Supplier, User } = require('../models');
require('dotenv').config();

const verifyDatabase = async () => {
  try {
    console.log('🔍 Verifying database contents...');
    
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_system';
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Count all documents
    const productCount = await Product.countDocuments();
    const warehouseCount = await Warehouse.countDocuments();
    const supplierCount = await Supplier.countDocuments();
    const userCount = await User.countDocuments();

    console.log('\n📊 Database Contents:');
    console.log(`  📦 Products: ${productCount}`);
    console.log(`  🏭 Warehouses: ${warehouseCount}`);
    console.log(`  🏢 Suppliers: ${supplierCount}`);
    console.log(`  👤 Users: ${userCount}`);

    // Show active vs inactive counts
    const activeProducts = await Product.countDocuments({ isActive: true });
    const inactiveProducts = await Product.countDocuments({ isActive: false });
    
    const activeWarehouses = await Warehouse.countDocuments({ isActive: true });
    const inactiveWarehouses = await Warehouse.countDocuments({ isActive: false });
    
    const activeSuppliers = await Supplier.countDocuments({ isActive: true });
    const inactiveSuppliers = await Supplier.countDocuments({ isActive: false });
    
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    console.log('\n📈 Active vs Inactive:');
    console.log(`  📦 Products: ${activeProducts} active, ${inactiveProducts} inactive`);
    console.log(`  🏭 Warehouses: ${activeWarehouses} active, ${inactiveWarehouses} inactive`);
    console.log(`  🏢 Suppliers: ${activeSuppliers} active, ${inactiveSuppliers} inactive`);
    console.log(`  👤 Users: ${activeUsers} active, ${inactiveUsers} inactive`);

    // Show sample data
    if (productCount > 0) {
      console.log('\n📦 Sample Products:');
      const products = await Product.find({}, 'name sku isActive').limit(5);
      products.forEach(product => {
        console.log(`  - ${product.name} (${product.sku}) - ${product.isActive ? 'Active' : 'Inactive'}`);
      });
    }

    if (warehouseCount > 0) {
      console.log('\n🏭 Sample Warehouses:');
      const warehouses = await Warehouse.find({}, 'name location isActive').limit(5);
      warehouses.forEach(warehouse => {
        console.log(`  - ${warehouse.name} (${warehouse.location}) - ${warehouse.isActive ? 'Active' : 'Inactive'}`);
      });
    }

    if (supplierCount > 0) {
      console.log('\n🏢 Sample Suppliers:');
      const suppliers = await Supplier.find({}, 'name supplierCode isActive').limit(5);
      suppliers.forEach(supplier => {
        console.log(`  - ${supplier.name} (${supplier.supplierCode}) - ${supplier.isActive ? 'Active' : 'Inactive'}`);
      });
    }

    if (userCount > 0) {
      console.log('\n👤 Sample Users:');
      const users = await User.find({}, 'firstName lastName email role isActive').limit(5);
      users.forEach(user => {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`);
      });
    }

    // Summary
    const totalActive = activeProducts + activeWarehouses + activeSuppliers + activeUsers;
    const totalInactive = inactiveProducts + inactiveWarehouses + inactiveSuppliers + inactiveUsers;
    
    console.log('\n🎯 Summary:');
    console.log(`  ✅ Total Active Records: ${totalActive}`);
    console.log(`  ❌ Total Inactive Records: ${totalInactive}`);
    
    if (totalInactive === 0) {
      console.log('🎉 Perfect! Database is completely clean - all records are active!');
    } else {
      console.log(`⚠️  Found ${totalInactive} inactive records. Run cleanup scripts to remove them.`);
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the verification
verifyDatabase();
