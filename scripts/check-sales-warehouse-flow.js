const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SalesOrder = require('../models/SalesOrder');
const Warehouse = require('../models/Warehouse');

async function checkSalesWarehouseFlow() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    console.log('═══════════════════════════════════════════');
    console.log('  CHECKING SALES → WAREHOUSE FLOW');
    console.log('═══════════════════════════════════════════\n');

    // Get all sales orders
    const salesOrders = await SalesOrder.find({ isActive: true })
      .populate('items.productId')
      .sort({ createdAt: -1 });

    console.log(`📦 Found ${salesOrders.length} sales orders\n`);

    // Analyze each order
    for (const order of salesOrders) {
      console.log(`\n📋 Order: ${order.orderNumber}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Items: ${order.items.length}`);
      
      for (const item of order.items) {
        const productName = item.productId?.name || 'Unknown';
        console.log(`   - ${productName}: ${item.quantity} units`);
      }

      // Check warehouse for this order's products
      const warehouses = await Warehouse.find({ isActive: true })
        .populate('currentStock.productId');

      for (const item of order.items) {
        if (!item.productId) continue;

        for (const warehouse of warehouses) {
          const stockItem = warehouse.currentStock.find(s =>
            s.productId && s.productId._id.toString() === item.productId._id.toString() &&
            (s.variantId || null) === (item.variantId || null)
          );

          if (stockItem) {
            console.log(`\n   📊 Warehouse: ${warehouse.name}`);
            console.log(`      Product: ${item.productId.name}`);
            console.log(`      Total Stock: ${stockItem.quantity}`);
            console.log(`      Reserved: ${stockItem.reservedQuantity || 0}`);
            console.log(`      Delivered: ${stockItem.deliveredQuantity || 0}`);
            console.log(`      Expected Returns: ${stockItem.expectedReturns || 0}`);
            console.log(`      Returned: ${stockItem.returnedQuantity || 0}`);
            
            // Check for issues
            const issues = [];
            
            if (order.status === 'delivered' && (stockItem.reservedQuantity || 0) > 0) {
              issues.push('⚠️ ISSUE: Order is delivered but reserved quantity > 0!');
            }
            
            if (order.status === 'delivered' && (stockItem.deliveredQuantity || 0) === 0) {
              issues.push('⚠️ ISSUE: Order is delivered but deliveredQuantity is 0!');
            }
            
            if (order.status === 'pending' && (stockItem.reservedQuantity || 0) === 0) {
              issues.push('⚠️ ISSUE: Order is pending but reservedQuantity is 0!');
            }

            if (order.status === 'dispatch' && (stockItem.reservedQuantity || 0) > 0) {
              issues.push('⚠️ ISSUE: Order is dispatched but reserved quantity > 0!');
            }

            if (issues.length > 0) {
              console.log(`\n      ❌ PROBLEMS FOUND:`);
              issues.forEach(issue => console.log(`         ${issue}`));
            } else {
              console.log(`      ✅ Flow looks correct for this order status`);
            }
          }
        }
      }
    }

    console.log('\n\n═══════════════════════════════════════════');
    console.log('  WAREHOUSE SUMMARY');
    console.log('═══════════════════════════════════════════\n');

    const allWarehouses = await Warehouse.find({ isActive: true })
      .populate('currentStock.productId');

    for (const warehouse of allWarehouses) {
      console.log(`\n🏭 ${warehouse.name}:`);
      
      const itemsWithReserved = warehouse.currentStock.filter(s => (s.reservedQuantity || 0) > 0);
      const itemsDelivered = warehouse.currentStock.filter(s => (s.deliveredQuantity || 0) > 0);
      const itemsExpectedReturn = warehouse.currentStock.filter(s => (s.expectedReturns || 0) > 0);
      
      if (itemsWithReserved.length > 0) {
        console.log(`   📦 Items with Reserved Stock:`);
        itemsWithReserved.forEach(item => {
          console.log(`      - ${item.productId?.name || 'Unknown'}: ${item.reservedQuantity} reserved`);
        });
      }
      
      if (itemsDelivered.length > 0) {
        console.log(`   🚚 Items Delivered:`);
        itemsDelivered.forEach(item => {
          console.log(`      - ${item.productId?.name || 'Unknown'}: ${item.deliveredQuantity} delivered`);
        });
      } else {
        console.log(`   ⚠️  NO DELIVERED ITEMS TRACKED (Run sync script!)`);
      }
      
      if (itemsExpectedReturn.length > 0) {
        console.log(`   ⏳ Items Expected Return:`);
        itemsExpectedReturn.forEach(item => {
          console.log(`      - ${item.productId?.name || 'Unknown'}: ${item.expectedReturns} expected`);
        });
      }
    }

    console.log('\n\n═══════════════════════════════════════════');
    console.log('  RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════\n');

    const hasDeliveredOrders = salesOrders.some(o => o.status === 'delivered');
    const hasDeliveredTracking = allWarehouses.some(w => 
      w.currentStock.some(s => (s.deliveredQuantity || 0) > 0)
    );

    if (hasDeliveredOrders && !hasDeliveredTracking) {
      console.log('⚠️  You have delivered orders but no delivered tracking!');
      console.log('📝 ACTION NEEDED:');
      console.log('   1. Run: node scripts/sync-all-quantities.js');
      console.log('   2. This will sync all delivered quantities');
      console.log('   3. Refresh your warehouse page\n');
    } else {
      console.log('✅ Everything looks good!\n');
    }

    await mongoose.connection.close();
    console.log('🔌 Connection closed\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkSalesWarehouseFlow();


