const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_system';

// Import Product model
const Product = require('../models/Product');

// Import the SKU generation function
const { nanoid } = require('nanoid');

// Generate unique SKU function (same as in controller)
const generateUniqueSKU = async (productName) => {
  if (!productName) {
    throw new Error('Product name is required to generate SKU');
  }
  
  const cleanName = productName
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .substring(0, 6);
  
  if (cleanName.length === 0) {
    throw new Error('Product name must contain at least one alphanumeric character');
  }
  
  let sku;
  let attempts = 0;
  const maxAttempts = 50;
  
  while (attempts < maxAttempts) {
    const uniqueId = nanoid(6).toUpperCase();
    sku = `${cleanName}${uniqueId}`;
    
    const existingProduct = await Product.findOne({ sku });
    
    if (!existingProduct) {
      return sku;
    }
    
    attempts++;
    
    if (attempts > 10) {
      const counter = (attempts - 10).toString().padStart(3, '0');
      sku = `${cleanName}${uniqueId}${counter}`;
      const existingProduct2 = await Product.findOne({ sku });
      if (!existingProduct2) {
        return sku;
      }
    }
  }
  
  const randomSuffix = nanoid(8).toUpperCase();
  sku = `${cleanName}${randomSuffix}`;
  
  const existingProduct = await Product.findOne({ sku });
  if (existingProduct) {
    const timestamp = Date.now().toString().slice(-6);
    sku = `${cleanName}${timestamp}${nanoid(4).toUpperCase()}`;
  }
  
  return sku;
};

async function testSKUGeneration() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    console.log('🧪 Testing SKU Generation...\n');
    console.log('='.repeat(60));

    // Test 1: Generate multiple SKUs for same product name
    console.log('\n📝 Test 1: Generate 5 SKUs for "Test Product"');
    console.log('-'.repeat(60));
    const testProductName = 'Test Product';
    const generatedSKUs = [];

    for (let i = 1; i <= 5; i++) {
      const sku = await generateUniqueSKU(testProductName);
      generatedSKUs.push(sku);
      console.log(`${i}. ${sku}`);
    }

    // Check for duplicates
    const uniqueSKUs = new Set(generatedSKUs);
    if (uniqueSKUs.size === generatedSKUs.length) {
      console.log('\n✅ SUCCESS: All SKUs are unique!');
    } else {
      console.log('\n❌ FAILED: Found duplicate SKUs!');
    }

    // Test 2: Create actual products
    console.log('\n📝 Test 2: Create 3 products with same name');
    console.log('-'.repeat(60));
    
    for (let i = 1; i <= 3; i++) {
      const productName = `Test Product ${i}`;
      const sku = await generateUniqueSKU(productName);
      
      try {
        const product = await Product.create({
          name: productName,
          sku: sku,
          category: 'Electronics',
          unit: 'pcs',
          sellingPrice: 1000,
          hasVariants: false
        });
        
        console.log(`✅ Product ${i} created: ${product.sku}`);
      } catch (error) {
        console.log(`❌ Product ${i} failed: ${error.message}`);
      }
    }

    // Test 3: Generate SKUs for different product names
    console.log('\n📝 Test 3: Generate SKUs for different products');
    console.log('-'.repeat(60));
    
    const productNames = [
      'Capri Bag',
      'Hijab Bag',
      'IPL',
      'Tester',
      'Sample Product'
    ];

    for (const name of productNames) {
      const sku = await generateUniqueSKU(name);
      console.log(`${name.padEnd(20)} → ${sku}`);
    }

    // Test 4: Check existing products
    console.log('\n📝 Test 4: Check existing products in database');
    console.log('-'.repeat(60));
    
    const existingProducts = await Product.find({}).select('name sku').limit(10);
    console.log(`Found ${existingProducts.length} products:`);
    existingProducts.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name.padEnd(30)} → ${p.sku || 'No SKU (has variants)'}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✨ All tests completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the test
testSKUGeneration();

