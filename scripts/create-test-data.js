const mongoose = require('mongoose');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');

mongoose.connect('mongodb://localhost:27017/inventory_management')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Create a test product
    const testProduct = new Product({
      name: 'Testing',
      sku: 'TESTING8702-1',
      category: 'Electronics',
      unit: 'pcs',
      sellingPrice: 100,
      hasVariants: true,
      variants: [{
        name: 'Red / Large',
        sku: 'TESTING8702-1-RED-LAR',
        sellingPrice: 100,
        attributes: [
          { name: 'Color', value: 'Red' },
          { name: 'Size', value: 'Large' }
        ]
      }]
    });
    
    await testProduct.save();
    console.log('✅ Created test product:', testProduct.name);
    
    // Create a test warehouse
    const testWarehouse = new Warehouse({
      name: 'Main Warehouse',
      location: 'Karachi',
      capacity: 1000,
      currentStock: [{
        productId: testProduct._id,
        variantId: testProduct.variants[0]._id.toString(),
        variantName: 'Red / Large',
        quantity: 30,
        reservedQuantity: 0,
        deliveredQuantity: 10,  // This should show as "out"
        expectedReturns: 0,     // This should be 0 until you click "Expected Return"
        returnedQuantity: 0
      }]
    });
    
    await testWarehouse.save();
    console.log('✅ Created test warehouse:', testWarehouse.name);
    
    console.log('📊 Test data created successfully!');
    console.log('   - Product: Testing (Red / Large)');
    console.log('   - Warehouse: Main Warehouse');
    console.log('   - Stock: 30 total, 10 delivered, 0 expected returns');
    console.log('   - Available: 20 (30 - 0 - 10)');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
