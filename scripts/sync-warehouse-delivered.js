const mongoose = require('mongoose');
const { Warehouse, SalesOrder, StockMovement } = require('../models');
require('dotenv').config();

async function syncWarehouseDelivered() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    console.log('✅ Connected to MongoDB');

    // Find all delivered sales orders
    const deliveredOrders = await SalesOrder.find({ 
      status: { $in: ['delivered', 'expected_return'] }
    }).populate('items.productId', 'name sku');

    console.log(`\nFound ${deliveredOrders.length} delivered/expected return orders`);

    const warehouses = await Warehouse.find({ isActive: true });
    
    if (warehouses.length === 0) {
      console.log('❌ No active warehouses found');
      process.exit(1);
    }

    for (const order of deliveredOrders) {
      console.log(`\n📦 Processing Order: ${order.orderNumber} (Status: ${order.status})`);
      
      for (const item of order.items) {
        const product = item.productId;
        console.log(`  Product: ${product?.name} - ${item.variantName || 'No variant'}`);
        console.log(`  Quantity: ${item.quantity}`);
        
        for (const warehouse of warehouses) {
          const stockItem = warehouse.currentStock.find(stock => 
            stock.productId.toString() === item.productId.toString() &&
            (stock.variantId || null) === (item.variantId || null)
          );
          
          if (stockItem) {
            console.log(`\n  📊 Current Stock in ${warehouse.name}:`);
            console.log(`    Total: ${stockItem.quantity}`);
            console.log(`    Reserved: ${stockItem.reservedQuantity || 0}`);
            console.log(`    Delivered: ${stockItem.deliveredQuantity || 0}`);
            console.log(`    Expected Returns: ${stockItem.expectedReturns || 0}`);
            
            // Check if delivered quantity is properly set
            if (order.status === 'delivered' || order.status === 'expected_return') {
              const expectedDelivered = item.quantity;
              const actualDelivered = stockItem.deliveredQuantity || 0;
              
              if (actualDelivered < expectedDelivered) {
                const missingDelivered = expectedDelivered - actualDelivered;
                console.log(`    ⚠️  Missing ${missingDelivered} in delivered quantity!`);
                console.log(`    → Fixing: Adding ${missingDelivered} to deliveredQuantity`);
                
                if (!stockItem.deliveredQuantity) {
                  stockItem.deliveredQuantity = 0;
                }
                stockItem.deliveredQuantity += missingDelivered;
                
                // If total quantity wasn't reduced, reduce it now
                if (stockItem.quantity >= missingDelivered) {
                  console.log(`    → Reducing total quantity from ${stockItem.quantity} to ${stockItem.quantity - missingDelivered}`);
                  stockItem.quantity -= missingDelivered;
                }
                
                await warehouse.save();
                console.log(`    ✅ Fixed!`);
              } else {
                console.log(`    ✓ Delivered quantity is correct`);
              }
              
              // Check expected returns for expected_return status
              if (order.status === 'expected_return') {
                const expectedReturns = stockItem.expectedReturns || 0;
                if (expectedReturns < expectedDelivered) {
                  const missing = expectedDelivered - expectedReturns;
                  console.log(`    ⚠️  Missing ${missing} in expected returns!`);
                  console.log(`    → Fixing: Adding ${missing} to expectedReturns`);
                  
                  if (!stockItem.expectedReturns) {
                    stockItem.expectedReturns = 0;
                  }
                  stockItem.expectedReturns += missing;
                  
                  await warehouse.save();
                  console.log(`    ✅ Fixed expected returns!`);
                }
              }
            }
          } else {
            console.log(`  ⚠️  No stock found in ${warehouse.name} for this product/variant`);
          }
        }
      }
    }

    console.log('\n✅ Warehouse sync completed!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

syncWarehouseDelivered();

