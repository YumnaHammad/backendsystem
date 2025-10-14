const mongoose = require('mongoose');
const SalesOrder = require('../models/SalesOrder');
const Warehouse = require('../models/Warehouse');

mongoose.connect('mongodb://localhost:27017/inventory_management')
  .then(async () => {
    console.log('🔍 Testing delivered quantity update...');
    
    // Find a delivered sales order
    const deliveredOrder = await SalesOrder.findOne({ status: 'delivered' })
      .populate('items.productId');
    
    if (!deliveredOrder) {
      console.log('❌ No delivered orders found');
      process.exit(0);
    }
    
    console.log('📦 Found delivered order:', deliveredOrder.orderNumber);
    console.log('   Items:', deliveredOrder.items.length);
    
    // Check warehouse stock before
    const warehouses = await Warehouse.find({ isActive: true });
    console.log('📦 Found warehouses:', warehouses.length);
    
    for (const warehouse of warehouses) {
      console.log(`\n🏪 Warehouse: ${warehouse.name}`);
      console.log('   Stock items:', warehouse.currentStock.length);
      
      for (const stockItem of warehouse.currentStock) {
        if (stockItem.productId) {
          const product = await mongoose.model('Product').findById(stockItem.productId);
          if (product) {
            console.log(`   - ${product.name} (${stockItem.variantName || 'No variant'}):`);
            console.log(`     Quantity: ${stockItem.quantity}`);
            console.log(`     Reserved: ${stockItem.reservedQuantity}`);
            console.log(`     Delivered: ${stockItem.deliveredQuantity || 0}`);
            console.log(`     Expected Returns: ${stockItem.expectedReturns || 0}`);
          }
        }
      }
    }
    
    // Now let's manually update a delivered order to see what happens
    console.log('\n🔄 Testing manual delivered update...');
    
    // Find the first warehouse
    const warehouse = warehouses[0];
    if (warehouse) {
      // Find a stock item that matches our delivered order
      for (const orderItem of deliveredOrder.items) {
        const stockItem = warehouse.currentStock.find(stock => 
          stock.productId.toString() === orderItem.productId._id.toString() &&
          (stock.variantId || null) === (orderItem.variantId || null)
        );
        
        if (stockItem) {
          console.log(`\n📦 Found matching stock item for ${orderItem.productId.name}:`);
          console.log('   Before update:');
          console.log(`     Quantity: ${stockItem.quantity}`);
          console.log(`     Delivered: ${stockItem.deliveredQuantity || 0}`);
          
          // Update delivered quantity
          if (!stockItem.deliveredQuantity) {
            stockItem.deliveredQuantity = 0;
          }
          stockItem.deliveredQuantity += orderItem.quantity;
          
          await warehouse.save();
          
          console.log('   After update:');
          console.log(`     Quantity: ${stockItem.quantity}`);
          console.log(`     Delivered: ${stockItem.deliveredQuantity}`);
          
          break;
        }
      }
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
