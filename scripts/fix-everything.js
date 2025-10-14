const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SalesOrder = require('../models/SalesOrder');
const ExpectedReturn = require('../models/ExpectedReturn');
const Warehouse = require('../models/Warehouse');

async function fixEverything() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    console.log('═══════════════════════════════════════════');
    console.log('       🔧 FIXING ALL ISSUES - ONE SHOT');
    console.log('═══════════════════════════════════════════\n');

    const warehouses = await Warehouse.find({ isActive: true });
    let fixCount = 0;

    // ============================================
    // FIX 1: Clear Reserved for Dispatched/Delivered Orders
    // ============================================
    console.log('🔧 FIX 1: Clearing Reserved Stock for Dispatched/Delivered Orders...\n');
    
    const dispatchedOrDelivered = await SalesOrder.find({
      status: { $in: ['dispatch', 'dispatched', 'delivered', 'expected_return'] },
      isActive: true
    }).populate('items.productId');

    for (const order of dispatchedOrDelivered) {
      console.log(`   Processing: ${order.orderNumber} (${order.status})`);
      
      for (const item of order.items) {
        if (!item.productId) continue;

        for (const warehouse of warehouses) {
          const stockItem = warehouse.currentStock.find(s =>
            s.productId.toString() === item.productId._id.toString() &&
            (s.variantId || null) === (item.variantId || null)
          );

          if (stockItem && (stockItem.reservedQuantity || 0) > 0) {
            console.log(`      ✅ Clearing ${stockItem.reservedQuantity} reserved for ${item.productId.name}`);
            stockItem.reservedQuantity = 0;
            await warehouse.save();
            fixCount++;
          }
        }
      }
    }

    // ============================================
    // FIX 2: Add Delivered Quantities
    // ============================================
    console.log('\n🔧 FIX 2: Adding Delivered Quantities...\n');
    
    const deliveredOrders = await SalesOrder.find({
      status: 'delivered',
      isActive: true
    }).populate('items.productId');

    for (const order of deliveredOrders) {
      console.log(`   Processing: ${order.orderNumber}`);
      
      for (const item of order.items) {
        if (!item.productId) continue;

        for (const warehouse of warehouses) {
          const stockItem = warehouse.currentStock.find(s =>
            s.productId.toString() === item.productId._id.toString() &&
            (s.variantId || null) === (item.variantId || null)
          );

          if (stockItem) {
            if (!stockItem.deliveredQuantity) {
              stockItem.deliveredQuantity = 0;
            }
            
            // Only add if not already added (avoid duplicates)
            const currentDelivered = stockItem.deliveredQuantity || 0;
            if (currentDelivered === 0) {
              stockItem.deliveredQuantity += item.quantity;
              console.log(`      ✅ Added ${item.quantity} to delivered for ${item.productId.name}`);
              await warehouse.save();
              fixCount++;
            }
          }
        }
      }
    }

    // ============================================
    // FIX 3: Create Missing Expected Return Records
    // ============================================
    console.log('\n🔧 FIX 3: Creating Missing Expected Return Records...\n');
    
    const expectedReturnOrders = await SalesOrder.find({
      status: 'expected_return',
      isActive: true
    }).populate('items.productId');

    for (const order of expectedReturnOrders) {
      const existingExpectedReturn = await ExpectedReturn.findOne({
        salesOrderId: order._id,
        status: 'expected'
      });

      if (!existingExpectedReturn) {
        console.log(`   Creating for: ${order.orderNumber}`);
        
        const warehouse = warehouses[0];
        const expectedReturnItems = order.items.map(item => ({
          productId: item.productId._id || item.productId,
          variantId: item.variantId || null,
          variantName: item.variantName || null,
          quantity: item.quantity,
          productName: item.productId.name || 'Unknown Product'
        }));

        const expectedReturn = new ExpectedReturn({
          salesOrderId: order._id,
          orderNumber: order.orderNumber,
          customerName: order.customerInfo?.name || order.customerName || 'Unknown',
          customerEmail: order.customerInfo?.email || '',
          customerPhone: order.customerInfo?.phone || '',
          items: expectedReturnItems,
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          returnReason: 'Customer return request',
          warehouseId: warehouse._id,
          notes: 'Auto-created by fix script',
          refundAmount: order.totalAmount || 0,
          status: 'expected',
          createdBy: order.createdBy
        });

        await expectedReturn.save();
        console.log(`      ✅ Created ExpectedReturn record`);
        fixCount++;
      }
    }

    // ============================================
    // FIX 4: Sync Returned Quantities
    // ============================================
    console.log('\n🔧 FIX 4: Syncing Returned Quantities...\n');
    
    const receivedReturns = await ExpectedReturn.find({
      status: 'received'
    }).populate('items.productId');

    for (const returnOrder of receivedReturns) {
      const targetWarehouse = await Warehouse.findById(returnOrder.warehouseId);
      if (!targetWarehouse) continue;

      for (const item of returnOrder.items) {
        if (!item.productId) continue;

        const stockItem = targetWarehouse.currentStock.find(s =>
          s.productId.toString() === item.productId._id.toString() &&
          (s.variantId || null) === (item.variantId || null)
        );

        if (stockItem) {
          if (!stockItem.returnedQuantity) {
            stockItem.returnedQuantity = 0;
          }
          
          // Only add if not already added
          if (stockItem.returnedQuantity === 0) {
            stockItem.returnedQuantity += item.quantity;
            
            if (stockItem.deliveredQuantity && stockItem.deliveredQuantity > 0) {
              stockItem.deliveredQuantity = Math.max(0, stockItem.deliveredQuantity - item.quantity);
            }
            
            console.log(`   ✅ ${item.productId.name}: +${item.quantity} returned`);
            await targetWarehouse.save();
            fixCount++;
          }
        }
      }
    }

    // ============================================
    // FINAL SUMMARY
    // ============================================
    console.log('\n═══════════════════════════════════════════');
    console.log('           ✅ ALL FIXES COMPLETE!');
    console.log('═══════════════════════════════════════════\n');
    console.log(`📊 Total Fixes Applied: ${fixCount}\n`);

    console.log('📋 Warehouse Status:\n');
    for (const warehouse of warehouses) {
      await warehouse.populate('currentStock.productId');
      console.log(`🏭 ${warehouse.name}:`);
      
      warehouse.currentStock.forEach(item => {
        if ((item.reservedQuantity || 0) > 0 || 
            (item.deliveredQuantity || 0) > 0 || 
            (item.expectedReturns || 0) > 0 ||
            (item.returnedQuantity || 0) > 0) {
          console.log(`   - ${item.productId?.name || 'Unknown'}:`);
          console.log(`     Total: ${item.quantity}, Reserved: ${item.reservedQuantity || 0}, Delivered: ${item.deliveredQuantity || 0}`);
          console.log(`     Expected Return: ${item.expectedReturns || 0}, Returned: ${item.returnedQuantity || 0}`);
        }
      });
      console.log('');
    }

    console.log('✅ ALL DONE! Refresh your warehouse page!\n');

    await mongoose.connection.close();
    console.log('🔌 Connection closed\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixEverything();


