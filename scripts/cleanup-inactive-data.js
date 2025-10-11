const mongoose = require('mongoose');
const { Product, Warehouse, Supplier, User } = require('../models');
require('dotenv').config();

const cleanupInactiveData = async () => {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_system';
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // 1. Delete inactive products (not shown in frontend)
    console.log('\n📦 Cleaning up inactive products...');
    const inactiveProducts = await Product.find({ isActive: false });
    console.log(`Found ${inactiveProducts.length} inactive products to delete`);
    
    for (const product of inactiveProducts) {
      console.log(`  - Deleting product: ${product.name} (${product.sku})`);
      await Product.findByIdAndDelete(product._id);
    }
    
    if (inactiveProducts.length > 0) {
      console.log(`✅ Deleted ${inactiveProducts.length} inactive products`);
    } else {
      console.log('✅ No inactive products found');
    }

    // 2. Delete inactive warehouses (not shown in frontend)
    console.log('\n🏭 Cleaning up inactive warehouses...');
    const inactiveWarehouses = await Warehouse.find({ isActive: false });
    console.log(`Found ${inactiveWarehouses.length} inactive warehouses to delete`);
    
    for (const warehouse of inactiveWarehouses) {
      console.log(`  - Deleting warehouse: ${warehouse.name} (${warehouse.location})`);
      await Warehouse.findByIdAndDelete(warehouse._id);
    }
    
    if (inactiveWarehouses.length > 0) {
      console.log(`✅ Deleted ${inactiveWarehouses.length} inactive warehouses`);
    } else {
      console.log('✅ No inactive warehouses found');
    }

    // 3. Delete inactive suppliers (not shown in frontend)
    console.log('\n🏢 Cleaning up inactive suppliers...');
    const inactiveSuppliers = await Supplier.find({ isActive: false });
    console.log(`Found ${inactiveSuppliers.length} inactive suppliers to delete`);
    
    for (const supplier of inactiveSuppliers) {
      console.log(`  - Deleting supplier: ${supplier.name} (${supplier.supplierCode})`);
      await Supplier.findByIdAndDelete(supplier._id);
    }
    
    if (inactiveSuppliers.length > 0) {
      console.log(`✅ Deleted ${inactiveSuppliers.length} inactive suppliers`);
    } else {
      console.log('✅ No inactive suppliers found');
    }

    // 4. Delete inactive users (not shown in frontend)
    console.log('\n👤 Cleaning up inactive users...');
    const inactiveUsers = await User.find({ isActive: false });
    console.log(`Found ${inactiveUsers.length} inactive users to delete`);
    
    for (const user of inactiveUsers) {
      console.log(`  - Deleting user: ${user.firstName} ${user.lastName} (${user.email})`);
      await User.findByIdAndDelete(user._id);
    }
    
    if (inactiveUsers.length > 0) {
      console.log(`✅ Deleted ${inactiveUsers.length} inactive users`);
    } else {
      console.log('✅ No inactive users found');
    }

    // 5. Summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`  - Products deleted: ${inactiveProducts.length}`);
    console.log(`  - Warehouses deleted: ${inactiveWarehouses.length}`);
    console.log(`  - Suppliers deleted: ${inactiveSuppliers.length}`);
    console.log(`  - Users deleted: ${inactiveUsers.length}`);
    
    const totalDeleted = inactiveProducts.length + inactiveWarehouses.length + 
                        inactiveSuppliers.length + inactiveUsers.length;
    
    console.log(`\n🎉 Total records deleted: ${totalDeleted}`);
    console.log('✅ Database cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the cleanup
cleanupInactiveData();
