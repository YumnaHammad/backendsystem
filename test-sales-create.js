const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const SalesOrder = require('./models/SalesOrder');
const Product = require('./models/Product');
const User = require('./models/User');

async function testSalesOrderCreation() {
  try {
    console.log('\n🧪 Testing Sales Order Creation...\n');
    
    // Get a product
    const product = await Product.findOne();
    if (!product) {
      console.error('❌ No products found. Please create a product first.');
      process.exit(1);
    }
    console.log('✅ Found product:', product.name);
    
    // Get admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('⚠️  No admin user found');
    } else {
      console.log('✅ Found admin user:', admin.email);
    }
    
    // Test sales order data
    const testOrderData = {
      orderNumber: `TEST-${Date.now()}`,
      customerInfo: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+92 300 1234567',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        }
      },
      items: [{
        productId: product._id,
        quantity: 1,
        unitPrice: product.sellingPrice || 100,
        totalPrice: product.sellingPrice || 100
      }],
      totalAmount: product.sellingPrice || 100,
      deliveryAddress: {
        street: '123 Delivery St',
        city: 'Delivery City',
        state: 'Delivery State',
        zipCode: '54321',
        country: 'Delivery Country'
      },
      status: 'pending',
      createdBy: admin ? admin._id : null
    };
    
    console.log('\n📝 Creating test sales order...');
    const salesOrder = new SalesOrder(testOrderData);
    await salesOrder.save();
    
    console.log('✅ Sales order created successfully!');
    console.log('   Order Number:', salesOrder.orderNumber);
    console.log('   Status:', salesOrder.status);
    console.log('   Total Amount:', salesOrder.totalAmount);
    
    // Test status update
    console.log('\n📝 Testing status update to "dispatch"...');
    salesOrder.status = 'dispatch';
    await salesOrder.save();
    console.log('✅ Status updated to:', salesOrder.status);
    
    // Test all status values
    console.log('\n📝 Testing all status values...');
    const statusValues = ['pending', 'confirmed', 'dispatch', 'dispatched', 'expected', 'delivered', 'return', 'returned', 'cancelled'];
    
    for (const status of statusValues) {
      try {
        salesOrder.status = status;
        await salesOrder.validate();
        console.log(`✅ ${status} - Valid`);
      } catch (err) {
        console.log(`❌ ${status} - Invalid: ${err.message}`);
      }
    }
    
    // Clean up - delete test order
    console.log('\n🧹 Cleaning up test order...');
    await SalesOrder.deleteOne({ _id: salesOrder._id });
    console.log('✅ Test order deleted');
    
    console.log('\n✅ All tests passed!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

mongoose.connection.once('open', () => {
  console.log('✅ Connected to MongoDB');
  testSalesOrderCreation();
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

