// MongoDB Atlas Connection Test Script
// This script will test if your Atlas database is working properly

require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 TESTING MONGODB ATLAS CONNECTION...\n');

// Test 1: Check Environment Variables
console.log('1️⃣ Checking Environment Variables:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Not set'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Not set'}`);

if (process.env.MONGODB_URI) {
    console.log(`   Connection String Preview: ${process.env.MONGODB_URI.substring(0, 50)}...`);
}
console.log('');

// Test 2: Test Connection
console.log('2️⃣ Testing MongoDB Connection:');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_system')
    .then(() => {
        console.log('   ✅ MongoDB connection successful!');
        console.log(`   📍 Connected to: ${mongoose.connection.host}:${mongoose.connection.port}`);
        console.log(`   🗄️  Database: ${mongoose.connection.name}`);
        return testDatabaseOperations();
    })
    .catch((error) => {
        console.log('   ❌ MongoDB connection failed!');
        console.log(`   🔍 Error: ${error.message}`);
        console.log('');
        console.log('🛠️  TROUBLESHOOTING STEPS:');
        console.log('   1. Check your .env file has correct MONGODB_URI');
        console.log('   2. Verify Atlas Network Access is ACTIVE');
        console.log('   3. Check your database user credentials');
        console.log('   4. Ensure your IP is whitelisted in Atlas');
        process.exit(1);
    });

// Test 3: Database Operations
async function testDatabaseOperations() {
    console.log('');
    console.log('3️⃣ Testing Database Operations:');
    
    try {
        // Test User Model
        const User = require('./models/User');
        const userCount = await User.countDocuments();
        console.log(`   ✅ Users collection: ${userCount} documents`);
        
        // Test Product Model
        const Product = require('./models/Product');
        const productCount = await Product.countDocuments();
        console.log(`   ✅ Products collection: ${productCount} documents`);
        
        // Test Warehouse Model
        const Warehouse = require('./models/Warehouse');
        const warehouseCount = await Warehouse.countDocuments();
        console.log(`   ✅ Warehouses collection: ${warehouseCount} documents`);
        
        // Test Purchase Model
        const Purchase = require('./models/Purchase');
        const purchaseCount = await Purchase.countDocuments();
        console.log(`   ✅ Purchases collection: ${purchaseCount} documents`);
        
        console.log('');
        console.log('4️⃣ Testing Data Integrity:');
        
        // Check if admin user exists
        const adminUser = await User.findOne({ email: 'admin@example.com' });
        if (adminUser) {
            console.log('   ✅ Admin user found');
            console.log(`   📧 Email: ${adminUser.email}`);
            console.log(`   📅 Created: ${adminUser.createdAt}`);
        } else {
            console.log('   ⚠️  Admin user not found (run seed:flow to create)');
        }
        
        // Check products
        if (productCount > 0) {
            const products = await Product.find().limit(3);
            console.log(`   ✅ Found ${productCount} products:`);
            products.forEach(product => {
                console.log(`      - ${product.name} (SKU: ${product.sku})`);
            });
        } else {
            console.log('   ⚠️  No products found (run seed:flow to create)');
        }
        
        // Check warehouses
        if (warehouseCount > 0) {
            const warehouses = await Warehouse.find();
            console.log(`   ✅ Found ${warehouseCount} warehouses:`);
            warehouses.forEach(warehouse => {
                console.log(`      - ${warehouse.name} (Capacity: ${warehouse.capacity})`);
            });
        } else {
            console.log('   ⚠️  No warehouses found (run seed:flow to create)');
        }
        
        console.log('');
        console.log('5️⃣ Testing API Endpoints:');
        
        // Test if we can create a test document
        const testProduct = new Product({
            name: 'Test Product',
            sku: 'TEST-001',
            category: 'Test',
            unit: 'piece',
            // costPrice: 10,
            sellingPrice: 15,
            currentStock: 0,
            warehouses: []
        });
        
        await testProduct.save();
        console.log('   ✅ Create operation: Success');
        
        await Product.findByIdAndDelete(testProduct._id);
        console.log('   ✅ Delete operation: Success');
        
        console.log('');
        console.log('🎉 ALL TESTS PASSED!');
        console.log('✅ Your MongoDB Atlas is working perfectly!');
        console.log('');
        console.log('📋 SUMMARY:');
        console.log(`   🌐 Connection: ✅ Working`);
        console.log(`   🗄️  Database: ${mongoose.connection.name}`);
        console.log(`   👤 Users: ${userCount}`);
        console.log(`   📦 Products: ${productCount}`);
        console.log(`   🏢 Warehouses: ${warehouseCount}`);
        console.log(`   📋 Purchases: ${purchaseCount}`);
        console.log('');
        console.log('🚀 Your system is ready to use!');
        
    } catch (error) {
        console.log('   ❌ Database operations failed!');
        console.log(`   🔍 Error: ${error.message}`);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed.');
    }
}
