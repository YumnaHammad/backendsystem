const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ExpectedReturn = require('../models/ExpectedReturn');
const Warehouse = require('../models/Warehouse');

async function syncReturnedQuantities() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all received (confirmed) returns
    const receivedReturns = await ExpectedReturn.find({ 
      status: 'received'
    }).populate('items.productId');

    console.log(`📦 Found ${receivedReturns.length} received returns to sync\n`);

    let updatedCount = 0;
    const warehouses = await Warehouse.find({ isActive: true });

    for (const returnOrder of receivedReturns) {
      console.log(`Processing Return from Order: ${returnOrder.orderNumber}`);
      
      const targetWarehouse = await Warehouse.findById(returnOrder.warehouseId);
      
      if (!targetWarehouse) {
        console.log(`  ⚠️  Warehouse not found for this return`);
        continue;
      }

      for (const item of returnOrder.items) {
        if (!item.productId) {
          console.log(`  ⚠️  Skipping item with missing product`);
          continue;
        }

        const stockItem = targetWarehouse.currentStock.find(stock => 
          stock.productId.toString() === item.productId._id.toString() &&
          (stock.variantId || null) === (item.variantId || null)
        );

        if (stockItem) {
          // Initialize returnedQuantity if it doesn't exist
          if (!stockItem.returnedQuantity) {
            stockItem.returnedQuantity = 0;
          }

          // Make sure this quantity is counted in returned
          if (!stockItem.returnedQuantity || stockItem.returnedQuantity < item.quantity) {
            const qtyToAdd = item.quantity - (stockItem.returnedQuantity || 0);
            stockItem.returnedQuantity += qtyToAdd;
            
            // Reduce from delivered quantity
            if (stockItem.deliveredQuantity && stockItem.deliveredQuantity > 0) {
              stockItem.deliveredQuantity = Math.max(0, stockItem.deliveredQuantity - qtyToAdd);
            }
            
            console.log(`  ✅ ${item.productId.name}: Added ${qtyToAdd} to returned`);
            updatedCount++;
          }
        }
      }

      await targetWarehouse.save();
      console.log('');
    }

    console.log(`\n✨ Sync Complete!`);
    console.log(`📊 Updated ${updatedCount} stock items with returned quantities\n`);

    // Show summary
    console.log('📋 Summary by Warehouse:');
    for (const warehouse of warehouses) {
      await warehouse.populate('currentStock.productId', 'name sku');
      
      const itemsWithReturns = warehouse.currentStock.filter(s => 
        (s.returnedQuantity || 0) > 0
      );

      if (itemsWithReturns.length > 0) {
        console.log(`\n🏭 ${warehouse.name}:`);
        itemsWithReturns.forEach(item => {
          console.log(`  - ${item.productId?.name || 'Unknown'}: ${item.returnedQuantity} returned, ${item.deliveredQuantity || 0} still delivered`);
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

syncReturnedQuantities();

