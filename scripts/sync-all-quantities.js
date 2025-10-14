const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SalesOrder = require('../models/SalesOrder');
const ExpectedReturn = require('../models/ExpectedReturn');
const Warehouse = require('../models/Warehouse');

async function syncAllQuantities() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('═══════════════════════════════════════════');
    console.log('  SYNCING DELIVERED & RETURNED QUANTITIES');
    console.log('═══════════════════════════════════════════\n');

    const warehouses = await Warehouse.find({ isActive: true });
    console.log(`📦 Found ${warehouses.length} active warehouses\n`);

    // ============================================
    // STEP 1: Sync Delivered Quantities
    // ============================================
    console.log('📤 STEP 1: Syncing Delivered Quantities...\n');
    
    const deliveredOrders = await SalesOrder.find({ 
      status: 'delivered',
      isActive: true 
    }).populate('items.productId');

    console.log(`   Found ${deliveredOrders.length} delivered orders\n`);

    let deliveredCount = 0;

    for (const order of deliveredOrders) {
      console.log(`   Processing: ${order.orderNumber}`);
      
      for (const item of order.items) {
        if (!item.productId) continue;

        for (const warehouse of warehouses) {
          const stockItem = warehouse.currentStock.find(stock => 
            stock.productId.toString() === item.productId._id.toString() &&
            (stock.variantId || null) === (item.variantId || null)
          );

          if (stockItem) {
            if (!stockItem.deliveredQuantity) {
              stockItem.deliveredQuantity = 0;
            }

            stockItem.deliveredQuantity += item.quantity;
            
            if (stockItem.reservedQuantity > 0) {
              stockItem.reservedQuantity = 0;
            }

            await warehouse.save();
            console.log(`     ✅ ${item.productId.name}: +${item.quantity} delivered in ${warehouse.name}`);
            deliveredCount++;
            break;
          }
        }
      }
    }

    console.log(`\n   ✨ Delivered sync complete: ${deliveredCount} items updated\n`);

    // ============================================
    // STEP 2: Sync Returned Quantities
    // ============================================
    console.log('📥 STEP 2: Syncing Returned Quantities...\n');
    
    const receivedReturns = await ExpectedReturn.find({ 
      status: 'received'
    }).populate('items.productId');

    console.log(`   Found ${receivedReturns.length} received returns\n`);

    let returnedCount = 0;

    for (const returnOrder of receivedReturns) {
      console.log(`   Processing Return: ${returnOrder.orderNumber}`);
      
      const targetWarehouse = await Warehouse.findById(returnOrder.warehouseId);
      if (!targetWarehouse) continue;

      for (const item of returnOrder.items) {
        if (!item.productId) continue;

        const stockItem = targetWarehouse.currentStock.find(stock => 
          stock.productId.toString() === item.productId._id.toString() &&
          (stock.variantId || null) === (item.variantId || null)
        );

        if (stockItem) {
          if (!stockItem.returnedQuantity) {
            stockItem.returnedQuantity = 0;
          }

          stockItem.returnedQuantity += item.quantity;
          
          if (stockItem.deliveredQuantity && stockItem.deliveredQuantity > 0) {
            stockItem.deliveredQuantity = Math.max(0, stockItem.deliveredQuantity - item.quantity);
          }

          console.log(`     ✅ ${item.productId.name}: +${item.quantity} returned`);
          returnedCount++;
        }
      }

      await targetWarehouse.save();
    }

    console.log(`\n   ✨ Returns sync complete: ${returnedCount} items updated\n`);

    // ============================================
    // STEP 3: Summary Report
    // ============================================
    console.log('═══════════════════════════════════════════');
    console.log('           FINAL SUMMARY REPORT');
    console.log('═══════════════════════════════════════════\n');

    console.log(`📊 Total Updates:`);
    console.log(`   - Delivered items: ${deliveredCount}`);
    console.log(`   - Returned items: ${returnedCount}`);
    console.log(`   - Total: ${deliveredCount + returnedCount}\n`);

    console.log('📋 Warehouse Inventory:\n');
    
    for (const warehouse of warehouses) {
      await warehouse.populate('currentStock.productId', 'name sku');
      
      const deliveredItems = warehouse.currentStock.filter(s => (s.deliveredQuantity || 0) > 0);
      const returnedItems = warehouse.currentStock.filter(s => (s.returnedQuantity || 0) > 0);

      if (deliveredItems.length > 0 || returnedItems.length > 0) {
        console.log(`🏭 ${warehouse.name}:`);
        
        if (deliveredItems.length > 0) {
          console.log(`   📤 Delivered:`);
          deliveredItems.forEach(item => {
            console.log(`      - ${item.productId?.name || 'Unknown'}: ${item.deliveredQuantity} out`);
          });
        }
        
        if (returnedItems.length > 0) {
          console.log(`   📥 Returned:`);
          returnedItems.forEach(item => {
            console.log(`      - ${item.productId?.name || 'Unknown'}: ${item.returnedQuantity} received back`);
          });
        }
        
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════');
    console.log('✅ SYNC COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════\n');

    console.log('💡 Next Steps:');
    console.log('   1. Refresh your warehouse page');
    console.log('   2. Check the "Delivered" and "Received Back" columns');
    console.log('   3. Verify the quantities match your sales orders\n');

    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

syncAllQuantities();

