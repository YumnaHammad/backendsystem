const mongoose = require('mongoose');
const { Product, Warehouse, Supplier, User, Purchase, SalesOrder } = require('../models');
require('dotenv').config();

const advancedCleanup = async () => {
  try {
    console.log('🔍 Starting advanced database cleanup...');
    
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_system';
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    let totalDeleted = 0;

    // 1. Clean up inactive products and their references
    console.log('\n📦 Cleaning up products...');
    const inactiveProducts = await Product.find({ isActive: false });
    console.log(`Found ${inactiveProducts.length} inactive products`);
    
    for (const product of inactiveProducts) {
      console.log(`  - Deleting product: ${product.name} (${product.sku})`);
      
      // Remove product from warehouse stock
      await Warehouse.updateMany(
        { 'currentStock.productId': product._id },
        { $pull: { currentStock: { productId: product._id } } }
      );
      
      await Product.findByIdAndDelete(product._id);
      totalDeleted++;
    }

    // 2. Clean up inactive warehouses and their stock
    console.log('\n🏭 Cleaning up warehouses...');
    const inactiveWarehouses = await Warehouse.find({ isActive: false });
    console.log(`Found ${inactiveWarehouses.length} inactive warehouses`);
    
    for (const warehouse of inactiveWarehouses) {
      console.log(`  - Deleting warehouse: ${warehouse.name} (${warehouse.location})`);
      await Warehouse.findByIdAndDelete(warehouse._id);
      totalDeleted++;
    }

    // 3. Clean up inactive suppliers
    console.log('\n🏢 Cleaning up suppliers...');
    const inactiveSuppliers = await Supplier.find({ isActive: false });
    console.log(`Found ${inactiveSuppliers.length} inactive suppliers`);
    
    for (const supplier of inactiveSuppliers) {
      console.log(`  - Deleting supplier: ${supplier.name} (${supplier.supplierCode})`);
      await Supplier.findByIdAndDelete(supplier._id);
      totalDeleted++;
    }

    // 4. Clean up inactive users (except admin)
    console.log('\n👤 Cleaning up users...');
    const inactiveUsers = await User.find({ 
      isActive: false, 
      role: { $ne: 'admin' } // Don't delete admin users
    });
    console.log(`Found ${inactiveUsers.length} inactive non-admin users`);
    
    for (const user of inactiveUsers) {
      console.log(`  - Deleting user: ${user.firstName} ${user.lastName} (${user.email})`);
      await User.findByIdAndDelete(user._id);
      totalDeleted++;
    }

    // 5. Find and clean orphaned references
    console.log('\n🔗 Cleaning up orphaned references...');
    
    // Find products that don't exist but are referenced in warehouses
    const allProducts = await Product.find({}, '_id');
    const productIds = allProducts.map(p => p._id.toString());
    
    const warehousesWithOrphanedProducts = await Warehouse.find({
      'currentStock.productId': { $nin: productIds }
    });
    
    console.log(`Found ${warehousesWithOrphanedProducts.length} warehouses with orphaned product references`);
    
    for (const warehouse of warehousesWithOrphanedProducts) {
      console.log(`  - Cleaning orphaned references in warehouse: ${warehouse.name}`);
      
      // Remove orphaned stock entries
      const validStock = warehouse.currentStock.filter(stock => 
        productIds.includes(stock.productId.toString())
      );
      
      await Warehouse.findByIdAndUpdate(warehouse._id, {
        currentStock: validStock
      });
    }

    // 6. Clean up any documents with missing required fields
    console.log('\n🧽 Cleaning up invalid documents...');
    
    // Products without required fields
    const invalidProducts = await Product.find({
      $or: [
        { name: { $exists: false } },
        { name: '' },
        { sku: { $exists: false } },
        { sku: '' }
      ]
    });
    
    console.log(`Found ${invalidProducts.length} invalid products`);
    for (const product of invalidProducts) {
      console.log(`  - Deleting invalid product: ${product.name || 'Unknown'} (${product.sku || 'No SKU'})`);
      await Product.findByIdAndDelete(product._id);
      totalDeleted++;
    }

    // 7. Summary
    console.log('\n📊 Advanced Cleanup Summary:');
    console.log(`  - Products deleted: ${inactiveProducts.length + invalidProducts.length}`);
    console.log(`  - Warehouses deleted: ${inactiveWarehouses.length}`);
    console.log(`  - Suppliers deleted: ${inactiveSuppliers.length}`);
    console.log(`  - Users deleted: ${inactiveUsers.length}`);
    console.log(`  - Warehouses with orphaned references cleaned: ${warehousesWithOrphanedProducts.length}`);
    
    console.log(`\n🎉 Total records deleted: ${totalDeleted}`);
    console.log('✅ Advanced database cleanup completed successfully!');

    // 8. Final verification
    console.log('\n🔍 Final verification:');
    const remainingProducts = await Product.countDocuments({ isActive: false });
    const remainingWarehouses = await Warehouse.countDocuments({ isActive: false });
    const remainingSuppliers = await Supplier.countDocuments({ isActive: false });
    const remainingUsers = await User.countDocuments({ isActive: false });
    
    console.log(`  - Remaining inactive products: ${remainingProducts}`);
    console.log(`  - Remaining inactive warehouses: ${remainingWarehouses}`);
    console.log(`  - Remaining inactive suppliers: ${remainingSuppliers}`);
    console.log(`  - Remaining inactive users: ${remainingUsers}`);
    
    if (remainingProducts === 0 && remainingWarehouses === 0 && 
        remainingSuppliers === 0 && remainingUsers === 0) {
      console.log('🎉 Perfect! Database is now clean and matches frontend data!');
    } else {
      console.log('⚠️  Some inactive records still remain. Run the script again if needed.');
    }

  } catch (error) {
    console.error('❌ Advanced cleanup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the advanced cleanup
advancedCleanup();
