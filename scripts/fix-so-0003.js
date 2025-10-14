const mongoose = require('mongoose');
const { Warehouse, SalesOrder } = require('../models');
require('dotenv').config();

async function fixSO0003() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    console.log('✅ Connected to MongoDB\n');

    const so3 = await SalesOrder.findOne({ orderNumber: 'SO-0003' });
    
    if (!so3) {
      console.log('❌ SO-0003 not found');
      process.exit(1);
    }

    console.log(`📦 SO-0003 Status: ${so3.status}`);
    console.log(`   Items: ${so3.items.length}\n`);

    const warehouse = await Warehouse.findOne({ name: 'Main Warehouse' });
    
    if (!warehouse) {
      console.log('❌ Main Warehouse not found');
      process.exit(1);
    }

    for (const item of so3.items) {
      console.log(`🔧 Processing: ${item.variantName}`);
      console.log(`   Quantity to deliver: ${item.quantity}`);
      console.log(`   VariantId: ${item.variantId}\n`);
      
      const stockItem = warehouse.currentStock.find(stock => 
        stock.productId.toString() === item.productId.toString() &&
        stock.variantId === item.variantId
      );

      if (!stockItem) {
        console.log('   ❌ Stock not found!');
        continue;
      }

      console.log(`   📊 Current Stock:`);
      console.log(`      Quantity: ${stockItem.quantity}`);
      console.log(`      Delivered: ${stockItem.deliveredQuantity || 0}`);
      console.log(`      Expected Returns: ${stockItem.expectedReturns || 0}\n`);

      // Fix the delivered quantity
      if (!stockItem.deliveredQuantity || stockItem.deliveredQuantity === 0) {
        console.log(`   🔨 Setting deliveredQuantity to ${item.quantity}`);
        stockItem.deliveredQuantity = item.quantity;
      }

      // The quantity is already correct (30), no need to reduce further
      // The expected returns is already set (10), which is correct

      console.log(`\n   ✅ Fixed Stock:`);
      console.log(`      Quantity: ${stockItem.quantity}`);
      console.log(`      Delivered: ${stockItem.deliveredQuantity}`);
      console.log(`      Expected Returns: ${stockItem.expectedReturns || 0}`);
    }

    await warehouse.save();
    console.log('\n✅ SO-0003 warehouse stock fixed!');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

fixSO0003();

