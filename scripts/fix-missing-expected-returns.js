const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SalesOrder = require('../models/SalesOrder');
const ExpectedReturn = require('../models/ExpectedReturn');
const Warehouse = require('../models/Warehouse');

async function fixMissingExpectedReturns() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('═══════════════════════════════════════════');
    console.log(' FIX MISSING EXPECTED RETURN RECORDS');
    console.log('═══════════════════════════════════════════\n');

    // Find all sales orders with 'expected_return' status
    const expectedReturnOrders = await SalesOrder.find({ 
      status: 'expected_return',
      isActive: true 
    }).populate('items.productId');

    console.log(`📦 Found ${expectedReturnOrders.length} orders with 'expected_return' status\n`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const order of expectedReturnOrders) {
      console.log(`Processing: ${order.orderNumber}`);
      
      // Check if ExpectedReturn record already exists
      const existingExpectedReturn = await ExpectedReturn.findOne({
        salesOrderId: order._id,
        status: 'expected'
      });

      if (existingExpectedReturn) {
        console.log(`  ⏭️  Record already exists - skipping`);
        skippedCount++;
        continue;
      }

      // Get first active warehouse
      const warehouses = await Warehouse.find({ isActive: true });
      if (warehouses.length === 0) {
        console.log(`  ⚠️  No active warehouse found - skipping`);
        continue;
      }
      const warehouse = warehouses[0];

      // Create ExpectedReturn record
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
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        returnReason: 'Customer return request',
        warehouseId: warehouse._id,
        notes: 'Auto-created by fix script for missing expected return records',
        refundAmount: order.totalAmount || 0,
        status: 'expected',
        createdBy: order.createdBy
      });

      await expectedReturn.save();
      console.log(`  ✅ Created ExpectedReturn record: ${expectedReturn._id}`);
      createdCount++;
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('           SUMMARY');
    console.log('═══════════════════════════════════════════\n');
    console.log(`📊 Results:`);
    console.log(`   ✅ Created: ${createdCount} new records`);
    console.log(`   ⏭️  Skipped: ${skippedCount} (already existed)`);
    console.log(`   📦 Total processed: ${expectedReturnOrders.length}\n`);

    if (createdCount > 0) {
      console.log('✅ Fix completed successfully!');
      console.log('💡 Now the red "Return Received" button should work!\n');
    } else {
      console.log('ℹ️  No missing records found - everything is already correct!\n');
    }

    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixMissingExpectedReturns();

