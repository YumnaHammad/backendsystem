const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SalesOrder = require('../models/SalesOrder');
const Warehouse = require('../models/Warehouse');

async function syncDeliveredQuantities() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all delivered sales orders
    const deliveredOrders = await SalesOrder.find({ 
      status: 'delivered',
      isActive: true 
    }).populate('items.productId');

    console.log(`📦 Found ${deliveredOrders.length} delivered orders to sync\n`);

    let updatedCount = 0;
    const warehouses = await Warehouse.find({ isActive: true });

    for (const order of deliveredOrders) {
      console.log(`Processing Order: ${order.orderNumber}`);
      
      for (const item of order.items) {
        if (!item.productId) {
          console.log(`  ⚠️  Skipping item with missing product`);
          continue;
        }

        // Find the warehouse that has this product
        for (const warehouse of warehouses) {
          const stockItem = warehouse.currentStock.find(stock => 
            stock.productId.toString() === item.productId._id.toString() &&
            (stock.variantId || null) === (item.variantId || null)
          );

          if (stockItem) {
            // Initialize deliveredQuantity if it doesn't exist
            if (!stockItem.deliveredQuantity) {
              stockItem.deliveredQuantity = 0;
            }

            // Add this order's quantity to delivered
            stockItem.deliveredQuantity += item.quantity;
            
            // Make sure reserved is 0 for delivered orders
            if (stockItem.reservedQuantity > 0) {
              console.log(`  ⚠️  Clearing ${stockItem.reservedQuantity} reserved for delivered order`);
              stockItem.reservedQuantity = 0;
            }

            await warehouse.save();
            
            console.log(`  ✅ ${item.productId.name}: Added ${item.quantity} to delivered in ${warehouse.name}`);
            updatedCount++;
            break; // Found the warehouse, move to next item
          }
        }
      }
      console.log('');
    }

    console.log(`\n✨ Sync Complete!`);
    console.log(`📊 Updated ${updatedCount} stock items with delivered quantities\n`);

    // Show summary
    console.log('📋 Summary by Warehouse:');
    for (const warehouse of warehouses) {
      await warehouse.populate('currentStock.productId', 'name sku');
      
      const itemsWithDelivered = warehouse.currentStock.filter(s => 
        (s.deliveredQuantity || 0) > 0
      );

      if (itemsWithDelivered.length > 0) {
        console.log(`\n🏭 ${warehouse.name}:`);
        itemsWithDelivered.forEach(item => {
          console.log(`  - ${item.productId?.name || 'Unknown'}: ${item.deliveredQuantity} delivered`);
        });
      }
    }

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

syncDeliveredQuantities();

