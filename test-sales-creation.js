require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Warehouse = require('./models/Warehouse');
const SalesOrder = require('./models/SalesOrder');

async function testSalesCreation() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Check products
    console.log('📦 Checking Products...');
    const products = await Product.find({ isActive: true });
    console.log(`   Found ${products.length} active products:`);
    products.forEach(p => {
      console.log(`   - ${p.name} (ID: ${p._id})`);
    });
    console.log('');

    // Step 2: Check warehouses and stock
    console.log('🏢 Checking Warehouses and Stock...');
    const warehouses = await Warehouse.find({ isActive: true }).populate('currentStock.productId', 'name');
    console.log(`   Found ${warehouses.length} active warehouses:\n`);
    
    warehouses.forEach(w => {
      console.log(`   📍 ${w.name}:`);
      if (w.currentStock && w.currentStock.length > 0) {
        w.currentStock.forEach(stock => {
          const productName = stock.productId?.name || 'Unknown Product';
          const quantity = stock.quantity || 0;
          const reserved = stock.reservedQuantity || 0;
          const available = quantity - reserved;
          console.log(`      • ${productName}: Total=${quantity}, Reserved=${reserved}, Available=${available}`);
        });
      } else {
        console.log('      No stock in this warehouse');
      }
      console.log('');
    });

    // Step 3: Try to create a test sales order
    if (products.length > 0 && warehouses.length > 0) {
      const firstProduct = products[0];
      
      // Find stock for this product
      let availableStock = 0;
      for (const warehouse of warehouses) {
        const stockItem = warehouse.currentStock.find(s => 
          s.productId && s.productId._id.toString() === firstProduct._id.toString()
        );
        if (stockItem) {
          const reserved = stockItem.reservedQuantity || 0;
          const available = (stockItem.quantity || 0) - reserved;
          availableStock += Math.max(0, available);
        }
      }

      console.log(`\n🧪 Test Sales Order Creation:`);
      console.log(`   Product: ${firstProduct.name}`);
      console.log(`   Available Stock: ${availableStock}`);
      
      if (availableStock > 0) {
        const testQuantity = Math.min(1, availableStock);
        console.log(`   Test Quantity: ${testQuantity}`);
        console.log(`   ✅ Stock is available - sales order can be created!\n`);
        
        // Show sample request body
        console.log(`📋 Sample Request Body for Sales Order:`);
        console.log(JSON.stringify({
          customerInfo: {
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '1234567890',
            address: {
              street: '123 Test St',
              city: 'Test City',
              state: 'Test State',
              zipCode: '12345',
              country: 'Test Country'
            }
          },
          deliveryAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'Test Country'
          },
          items: [
            {
              productId: firstProduct._id,
              quantity: testQuantity,
              unitPrice: firstProduct.sellingPrice || 100
            }
          ],
          expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Test order'
        }, null, 2));
      } else {
        console.log(`   ❌ No stock available - sales order CANNOT be created!`);
        console.log(`   💡 Please purchase products first to add stock to warehouse.\n`);
      }
    } else {
      console.log('\n❌ Cannot test sales order creation:');
      if (products.length === 0) {
        console.log('   • No products found');
      }
      if (warehouses.length === 0) {
        console.log('   • No warehouses found');
      }
      console.log('');
    }

    // Step 4: Check recent sales orders
    console.log('📊 Recent Sales Orders:');
    const recentOrders = await SalesOrder.find().sort({ createdAt: -1 }).limit(5);
    if (recentOrders.length > 0) {
      recentOrders.forEach(order => {
        console.log(`   • ${order.orderNumber} - ${order.status} - $${order.totalAmount}`);
      });
    } else {
      console.log('   No sales orders found');
    }
    console.log('');

    await mongoose.connection.close();
    console.log('✅ Test completed!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testSalesCreation();

