const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function testProductCreation() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Create a simple product
    console.log('\n📦 Test 1: Creating a test product...');
    const testProduct = new Product({
      name: 'Test Product',
      sku: 'TEST-' + Date.now(),
      description: 'This is a test product',
      category: 'Test Category',
      // costPrice: 100,
      sellingPrice: 150,
      reorderLevel: 10,
      isActive: true
    });

    const savedProduct = await testProduct.save();
    console.log('✅ Product created successfully!');
    console.log('Product ID:', savedProduct._id);
    console.log('Product SKU:', savedProduct.sku);
    console.log('Product Name:', savedProduct.name);

    // Test 2: Verify it's in database
    console.log('\n🔍 Test 2: Verifying product in database...');
    const foundProduct = await Product.findById(savedProduct._id);
    if (foundProduct) {
      console.log('✅ Product found in database!');
      console.log('Name:', foundProduct.name);
      console.log('SKU:', foundProduct.sku);
      // console.log('Cost Price:', foundProduct.costPrice);
      console.log('Selling Price:', foundProduct.sellingPrice);
    } else {
      console.log('❌ Product not found in database!');
    }

    // Test 3: Count total products
    console.log('\n📊 Test 3: Counting products...');
    const productCount = await Product.countDocuments();
    console.log('Total products in database:', productCount);

    // Test 4: List all products
    console.log('\n📋 Test 4: Listing all products...');
    const allProducts = await Product.find().limit(10);
    console.log(`Found ${allProducts.length} products (showing max 10):`);
    allProducts.forEach((p, index) => {
      console.log(`  ${index + 1}. ${p.name} (SKU: ${p.sku})`);
    });

    // Clean up: Delete test product
    console.log('\n🗑️  Cleaning up test product...');
    await Product.findByIdAndDelete(savedProduct._id);
    console.log('✅ Test product deleted');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('\n🎉 All tests completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during testing:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    await mongoose.connection.close();
    process.exit(1);
  }
}

testProductCreation();

