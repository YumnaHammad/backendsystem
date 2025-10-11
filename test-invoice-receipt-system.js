const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to register schemas
require('./models/index');

// Import models
const Purchase = require('./models/Purchase');
const Product = require('./models/Product');
const Supplier = require('./models/Supplier');
const User = require('./models/User');
const Warehouse = require('./models/Warehouse');

async function testInvoiceReceiptSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/inventory_system');
    console.log('✅ Connected to MongoDB');

    // Get a sample purchase
    const purchase = await Purchase.findOne({})
      .populate('supplierId', 'name supplierCode email phone address')
      .populate('items.productId', 'name sku category sellingPrice')
      .populate('createdBy', 'firstName lastName email');

    if (!purchase) {
      console.log('❌ No purchases found in database');
      return;
    }

    console.log('\n📋 Testing Purchase:', purchase.purchaseNumber);
    console.log('Supplier:', purchase.supplierId?.name || 'Unknown');
    console.log('Items:', purchase.items.length);
    console.log('Total Amount:', purchase.totalAmount);
    console.log('Payment Status:', purchase.paymentStatus);
    console.log('Invoice Generated:', purchase.invoiceGenerated);
    console.log('Receipt Generated:', purchase.receiptGenerated);

    // Test 1: Generate Invoice
    console.log('\n🧾 Testing Invoice Generation...');
    if (!purchase.invoiceGenerated) {
      const invoiceNumber = await purchase.generateInvoice();
      console.log('✅ Invoice Generated:', invoiceNumber);
      console.log('Invoice Date:', purchase.invoiceDate);
    } else {
      console.log('✅ Invoice Already Generated:', purchase.invoiceNumber);
    }

    // Test 2: Mark Payment as Cleared (this will generate receipt)
    console.log('\n💰 Testing Payment Clearance...');
    if (purchase.paymentStatus !== 'paid') {
      await purchase.markPaymentCleared();
      console.log('✅ Payment Cleared Successfully');
      console.log('Receipt Number:', purchase.receiptNumber);
      console.log('Receipt Date:', purchase.receiptDate);
      console.log('Payment Date:', purchase.paymentDate);
    } else {
      console.log('✅ Payment Already Cleared');
      console.log('Receipt Number:', purchase.receiptNumber);
    }

    // Test 3: Check Final Status
    console.log('\n📊 Final Status:');
    console.log('Purchase Number:', purchase.purchaseNumber);
    console.log('Invoice Number:', purchase.invoiceNumber);
    console.log('Receipt Number:', purchase.receiptNumber);
    console.log('Invoice Generated:', purchase.invoiceGenerated);
    console.log('Receipt Generated:', purchase.receiptGenerated);
    console.log('Payment Status:', purchase.paymentStatus);
    console.log('Final Amount:', purchase.finalAmount || purchase.totalAmount);

    // Test 4: Check Stock Update
    console.log('\n📦 Checking Stock Update...');
    const warehouse = await Warehouse.findOne({ isActive: true });
    if (warehouse) {
      console.log('Warehouse:', warehouse.name);
      console.log('Total Stock Items:', warehouse.currentStock.length);
      console.log('Total Stock Quantity:', warehouse.getTotalStock());
    }

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testInvoiceReceiptSystem();
