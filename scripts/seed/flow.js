require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import all models
const {
  User,
  Product,
  Warehouse,
  Supplier,
  Purchase,
  Invoice,
  Receipt,
  SalesOrder,
  SalesShipment,
  Return,
  Report,
  AuditLog
} = require('../../models');

const formatTimestamp = (date) => {
  const pakistanTime = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Karachi"}));
  return {
    iso: pakistanTime.toISOString(),
    display: pakistanTime.toLocaleString('en-US', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  };
};

const createAuditLog = async (actorId, actorRole, action, resourceType, resourceId, oldValues, newValues, metadata) => {
  const timestamps = formatTimestamp(new Date());
  
  await AuditLog.create({
    actorId,
    actorRole,
    action,
    resourceType,
    resourceId,
    oldValues,
    newValues,
    metadata,
    timestampISO: timestamps.iso,
    timestampDisplay: timestamps.display
  });
};

const seedFlow = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_system';
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    console.log('\n=== SEED FLOW LOG ===');
    
    let stepCounter = 1;
    let createdEntities = {};
    
    // Step 1: Create warehouses
    console.log(`${stepCounter++}) Creating warehouses...`);
    
    const centralWarehouse = await Warehouse.create({
      name: "Central Warehouse",
      location: "Karachi, Pakistan",
      capacity: 1000,
      createdAt: new Date('2025-10-01T09:00:00+05:00')
    });
    
    const overflowWarehouse = await Warehouse.create({
      name: "Overflow Warehouse",
      location: "Lahore, Pakistan",
      capacity: 500,
      createdAt: new Date('2025-10-01T09:05:00+05:00')
    });
    
    createdEntities.warehouses = { central: centralWarehouse, overflow: overflowWarehouse };
    console.log(`   Created Central Warehouse (id: ${centralWarehouse._id})`);
    console.log(`   Created Overflow Warehouse (id: ${overflowWarehouse._id})`);
    
    // Step 2: Create supplier
    console.log(`${stepCounter++}) Creating supplier...`);
    
    const supplier = await Supplier.create({
      name: "Ahmed Khan",
      company: "Global Supplies Ltd",
      email: "ahmed@globalsupplies.com",
      phone: "+92-300-1234567",
      address: {
        street: "123 Industrial Area",
        city: "Karachi",
        state: "Sindh",
        zipCode: "75000",
        country: "Pakistan"
      },
      supplierCode: "SUP-001",
      paymentTerms: "net30"
    });
    
    createdEntities.supplier = supplier;
    console.log(`   Created supplier: Global Supplies Ltd (id: ${supplier._id})`);
    
    // Step 3: Create admin user
    console.log(`${stepCounter++}) Creating admin user...`);
    
    const adminUser = await User.create({
      email: "admin@example.com",
      password: "AdminPass123",
      firstName: "System",
      lastName: "Administrator",
      role: "admin"
    });
    
    createdEntities.adminUser = adminUser;
    console.log(`   Created admin user: admin@example.com (id: ${adminUser._id})`);
    
    // Step 4: Create products
    console.log(`${stepCounter++}) Creating products...`);
    
    const productA = await Product.create({
      name: "Product A - Fully Delivered",
      sku: "PROD-DELIVERED-001",
      category: "Electronics",
      unit: "pcs",
      // costPrice: 100,
      sellingPrice: 150,
      createdAt: new Date('2025-10-01T09:10:00+05:00')
    });
    
    const productB = await Product.create({
      name: "Product B - Returned Flow",
      sku: "PROD-RETURNED-002",
      category: "Accessories",
      unit: "pcs",
      // costPrice: 20,
      sellingPrice: 35,
      createdAt: new Date('2025-10-01T09:12:00+05:00')
    });
    
    const productC = await Product.create({
      name: "Product C - Purchased Only",
      sku: "PROD-PURCHASED-003",
      category: "Spare Parts",
      unit: "pcs",
      // costPrice: 5,
      sellingPrice: 10,
      createdAt: new Date('2025-10-01T09:14:00+05:00')
    });
    
    createdEntities.products = { a: productA, b: productB, c: productC };
    console.log(`   Created Product A: ${productA.sku} (id: ${productA._id})`);
    console.log(`   Created Product B: ${productB.sku} (id: ${productB._id})`);
    console.log(`   Created Product C: ${productC.sku} (id: ${productC._id})`);
    
    // Step 5: Create purchases and payments
    console.log(`${stepCounter++}) Creating purchases and processing payments...`);
    
    // Purchase for Product A
    const purchaseA = await Purchase.create({
      purchaseNumber: "PUR-20251001-001",
      supplierId: supplier._id,
      productId: productA._id,
      quantity: 50,
      unitCost: 100,
      totalCost: 5000,
      warehouseId: centralWarehouse._id,
      purchaseDate: new Date('2025-10-01T10:00:00+05:00'),
      status: 'pending',
      paymentStatus: 'pending',
      actorId: adminUser._id,
      actorRole: 'admin'
    });
    
    // Confirm payment for Product A
    purchaseA.paymentStatus = 'paid';
    purchaseA.paymentDate = new Date('2025-10-01T11:00:00+05:00');
    purchaseA.status = 'received';
    await purchaseA.save();
    
    // Create invoice for Product A
    const invoiceA = await Invoice.create({
      invoiceNumber: "INV-PUR-20251001-001",
      purchaseId: purchaseA._id,
      supplierId: supplier._id,
      subtotal: 5000,
      taxAmount: 0,
      totalAmount: 5000,
      status: 'paid',
      dueDate: new Date('2025-10-01T11:00:00+05:00'),
      paidDate: new Date('2025-10-01T11:00:00+05:00'),
      paymentMethod: 'bank_transfer',
      actorId: adminUser._id,
      actorRole: 'admin'
    });
    
    // Create receipt for Product A
    const receiptA = await Receipt.create({
      receiptNumber: "RCP-20251001-001",
      purchaseId: purchaseA._id,
      invoiceId: invoiceA._id,
      supplierId: supplier._id,
      amount: 5000,
      paymentMethod: 'bank_transfer',
      paymentDate: new Date('2025-10-01T11:00:00+05:00'),
      actorId: adminUser._id,
      actorRole: 'admin'
    });
    
    // Allocate stock for Product A
    await centralWarehouse.updateStock(productA._id, 50);
    console.log(`   Created purchase ${purchaseA.purchaseNumber} for ${productA.sku} qty:50 -> Payment recorded at 2025-10-01T11:00:00+05:00 -> Stock allocated to Central: +50`);
    
    // Purchase for Product B
    const purchaseB = await Purchase.create({
      purchaseNumber: "PUR-20251001-002",
      supplierId: supplier._id,
      productId: productB._id,
      quantity: 30,
      unitCost: 20,
      totalCost: 600,
      warehouseId: centralWarehouse._id,
      purchaseDate: new Date('2025-10-01T10:30:00+05:00'),
      status: 'pending',
      paymentStatus: 'pending',
      actorId: adminUser._id,
      actorRole: 'admin'
    });
    
    // Confirm payment for Product B
    purchaseB.paymentStatus = 'paid';
    purchaseB.paymentDate = new Date('2025-10-01T11:30:00+05:00');
    purchaseB.status = 'received';
    await purchaseB.save();
    
    // Create invoice and receipt for Product B
    const invoiceB = await Invoice.create({
      invoiceNumber: "INV-PUR-20251001-002",
      purchaseId: purchaseB._id,
      supplierId: supplier._id,
      subtotal: 600,
      taxAmount: 0,
      totalAmount: 600,
      status: 'paid',
      dueDate: new Date('2025-10-01T11:30:00+05:00'),
      paidDate: new Date('2025-10-01T11:30:00+05:00'),
      paymentMethod: 'bank_transfer',
      actorId: adminUser._id,
      actorRole: 'admin'
    });
    
    const receiptB = await Receipt.create({
      receiptNumber: "RCP-20251001-002",
      purchaseId: purchaseB._id,
      invoiceId: invoiceB._id,
      supplierId: supplier._id,
      amount: 600,
      paymentMethod: 'bank_transfer',
      paymentDate: new Date('2025-10-01T11:30:00+05:00'),
      actorId: adminUser._id,
      actorRole: 'admin'
    });
    
    // Allocate stock for Product B
    await centralWarehouse.updateStock(productB._id, 30);
    console.log(`   Created purchase ${purchaseB.purchaseNumber} for ${productB.sku} qty:30 -> Payment recorded at 2025-10-01T11:30:00+05:00 -> Stock allocated to Central: +30`);
    
    // Purchase for Product C
    const purchaseC = await Purchase.create({
      purchaseNumber: "PUR-20251002-001",
      supplierId: supplier._id,
      productId: productC._id,
      quantity: 100,
      unitCost: 5,
      totalCost: 500,
      warehouseId: overflowWarehouse._id,
      purchaseDate: new Date('2025-10-02T09:00:00+05:00'),
      status: 'pending',
      paymentStatus: 'pending',
      actorId: adminUser._id,
      actorRole: 'admin'
    });
    
    // Confirm payment for Product C
    purchaseC.paymentStatus = 'paid';
    purchaseC.paymentDate = new Date('2025-10-02T10:00:00+05:00');
    purchaseC.status = 'received';
    await purchaseC.save();
    
    // Create invoice and receipt for Product C
    const invoiceC = await Invoice.create({
      invoiceNumber: "INV-PUR-20251002-001",
      purchaseId: purchaseC._id,
      supplierId: supplier._id,
      subtotal: 500,
      taxAmount: 0,
      totalAmount: 500,
      status: 'paid',
      dueDate: new Date('2025-10-02T10:00:00+05:00'),
      paidDate: new Date('2025-10-02T10:00:00+05:00'),
      paymentMethod: 'bank_transfer',
      actorId: adminUser._id,
      actorRole: 'admin'
    });
    
    const receiptC = await Receipt.create({
      receiptNumber: "RCP-20251002-001",
      purchaseId: purchaseC._id,
      invoiceId: invoiceC._id,
      supplierId: supplier._id,
      amount: 500,
      paymentMethod: 'bank_transfer',
      paymentDate: new Date('2025-10-02T10:00:00+05:00'),
      actorId: adminUser._id,
      actorRole: 'admin'
    });
    
    // Allocate stock for Product C
    await overflowWarehouse.updateStock(productC._id, 100);
    console.log(`   Created purchase ${purchaseC.purchaseNumber} for ${productC.sku} qty:100 -> Payment recorded at 2025-10-02T10:00:00+05:00 -> Stock allocated to Overflow: +100`);
    
    // Step 6: Create sales orders
    console.log(`${stepCounter++}) Creating sales orders...`);
    
    // Sales order for Product A
    const salesOrderA = await SalesOrder.create({
      orderNumber: "SO-20251003-001",
      customerName: "Customer A",
      customerEmail: "customerA@example.com",
      customerPhone: "+92-300-1111111",
      items: [{
        productId: productA._id,
        quantity: 10,
        unitPrice: 150,
        totalPrice: 1500,
        warehouseId: centralWarehouse._id
      }],
      subtotal: 1500,
      taxAmount: 0,
      totalAmount: 1500,
      status: 'pending',
      orderDate: new Date('2025-10-03T09:00:00+05:00'),
      shippingAddress: {
        street: "123 Main Street",
        city: "Karachi",
        state: "Sindh",
        zipCode: "75000",
        country: "Pakistan"
      },
      actorId: adminUser._id,
      actorRole: 'admin'
    });
    
    salesOrderA.status = 'confirmed';
    await salesOrderA.save();
    
    console.log(`   Created sales order ${salesOrderA.orderNumber} for ${productA.sku} qty:10`);
    
    // Sales order for Product B
    const salesOrderB = await SalesOrder.create({
      orderNumber: "SO-20251003-002",
      customerName: "Customer B",
      customerEmail: "customerB@example.com",
      customerPhone: "+92-300-2222222",
      items: [{
        productId: productB._id,
        quantity: 5,
        unitPrice: 35,
        totalPrice: 175,
        warehouseId: centralWarehouse._id
      }],
      subtotal: 175,
      taxAmount: 0,
      totalAmount: 175,
      status: 'pending',
      orderDate: new Date('2025-10-03T09:30:00+05:00'),
      shippingAddress: {
        street: "456 Oak Avenue",
        city: "Lahore",
        state: "Punjab",
        zipCode: "54000",
        country: "Pakistan"
      },
      actorId: adminUser._id,
      actorRole: 'admin'
    });
    
    salesOrderB.status = 'confirmed';
    await salesOrderB.save();
    
    console.log(`   Created sales order ${salesOrderB.orderNumber} for ${productB.sku} qty:5`);
    
    // Step 7: Dispatch orders
    console.log(`${stepCounter++}) Dispatching orders...`);
    
    // Dispatch Product A
    const shipmentA = await SalesShipment.create({
      shipmentNumber: "SHIP-20251003-001",
      orderId: salesOrderA._id,
      items: [{
        productId: productA._id,
        quantity: 10,
        warehouseId: centralWarehouse._id
      }],
      status: 'dispatched',
      dispatchDate: new Date('2025-10-03T10:00:00+05:00'),
      trackingNumber: "TRK-20251003-001",
      carrier: "Internal Delivery",
      shippingAddress: salesOrderA.shippingAddress,
      actorId: adminUser._id,
      actorRole: 'admin'
    });
    
    salesOrderA.status = 'dispatched';
    await salesOrderA.save();
    
    console.log(`   Dispatched ${productA.sku} qty:10 -> dispatched at 2025-10-03T10:00:00+05:00`);
    
    // Dispatch Product B
    const shipmentB = await SalesShipment.create({
      shipmentNumber: "SHIP-20251003-002",
      orderId: salesOrderB._id,
      items: [{
        productId: productB._id,
        quantity: 5,
        warehouseId: centralWarehouse._id
      }],
      status: 'dispatched',
      dispatchDate: new Date('2025-10-03T11:00:00+05:00'),
      trackingNumber: "TRK-20251003-002",
      carrier: "Internal Delivery",
      shippingAddress: salesOrderB.shippingAddress,
      actorId: adminUser._id,
      actorRole: 'admin'
    });
    
    salesOrderB.status = 'dispatched';
    await salesOrderB.save();
    
    console.log(`   Dispatched ${productB.sku} qty:5 -> dispatched at 2025-10-03T11:00:00+05:00`);
    
    // Step 8: Deliver Product A and return Product B
    console.log(`${stepCounter++}) Processing deliveries and returns...`);
    
    // Deliver Product A
    shipmentA.status = 'delivered';
    shipmentA.deliveryDate = new Date('2025-10-04T15:30:00+05:00');
    await shipmentA.save();
    
    salesOrderA.status = 'delivered';
    await salesOrderA.save();
    
    // Remove stock for Product A
    const stockItemA = centralWarehouse.currentStock.find(item => 
      item.productId.toString() === productA._id.toString()
    );
    stockItemA.quantity -= 10;
    await centralWarehouse.save();
    
    console.log(`   Delivered ${productA.sku} qty:10 -> delivered at 2025-10-04T15:30:00+05:00 -> Stock Central now ${stockItemA.quantity}`);
    
    // Return Product B
    shipmentB.status = 'returned';
    shipmentB.returnDate = new Date('2025-10-04T18:00:00+05:00');
    await shipmentB.save();
    
    // Create return record
    const returnB = await Return.create({
      returnNumber: "RTN-20251004-001",
      orderId: salesOrderB._id,
      shipmentId: shipmentB._id,
      items: [{
        productId: productB._id,
        quantity: 5,
        reason: 'customer_change_mind',
        condition: 'new',
        warehouseId: centralWarehouse._id
      }],
      status: 'received',
      returnDate: new Date('2025-10-04T18:00:00+05:00'),
      customerName: salesOrderB.customerName,
      customerEmail: salesOrderB.customerEmail,
      actorId: adminUser._id,
      actorRole: 'admin'
    });
    
    // Add stock back for Product B with returned tag
    await centralWarehouse.updateStock(productB._id, 5, ['returned']);
    
    console.log(`   Returned ${productB.sku} qty:5 -> returned at 2025-10-04T18:00:00+05:00 -> Stock Central back to ${centralWarehouse.currentStock.find(item => item.productId.toString() === productB._id.toString()).quantity}; return record created`);
    
    // Step 9: Transfer Product C and delete Overflow Warehouse
    console.log(`${stepCounter++}) Transferring stock and deleting warehouse...`);
    
    // Transfer Product C from Overflow to Central
    const stockItemC = overflowWarehouse.currentStock.find(item => 
      item.productId.toString() === productC._id.toString()
    );
    
    if (stockItemC) {
      // Remove from Overflow
      overflowWarehouse.currentStock = overflowWarehouse.currentStock.filter(
        item => item.productId.toString() !== productC._id.toString()
      );
      await overflowWarehouse.save();
      
      // Add to Central
      await centralWarehouse.updateStock(productC._id, stockItemC.quantity);
      
      console.log(`   Transferred ${productC.sku} qty:${stockItemC.quantity} from Overflow -> Central`);
      
      // Create audit log for transfer
      await createAuditLog(
        adminUser._id,
        'admin',
        'stock_transferred',
        'Warehouse',
        overflowWarehouse._id,
        { overflowStock: [{ productId: productC._id, quantity: stockItemC.quantity }] },
        { centralStock: [{ productId: productC._id, quantity: stockItemC.quantity }] },
        { 
          fromWarehouse: 'Overflow Warehouse',
          toWarehouse: 'Central Warehouse',
          productSku: productC.sku,
          quantity: stockItemC.quantity
        }
      );
    }
    
    // Delete Overflow Warehouse
    await Warehouse.findByIdAndUpdate(overflowWarehouse._id, { isActive: false });
    console.log(`   Deleted Overflow Warehouse successfully`);
    
    // Step 10: Final verification
    console.log(`${stepCounter++}) Final verification...`);
    
    // Get final counts
    const finalProducts = await Product.countDocuments({ isActive: true });
    const finalWarehouses = await Warehouse.countDocuments({ isActive: true });
    
    // Calculate total stock
    const finalCentralWarehouse = await Warehouse.findById(centralWarehouse._id);
    const totalStock = finalCentralWarehouse.currentStock.reduce((total, item) => total + item.quantity, 0);
    
    // Calculate dispatched products
    const dispatchedShipments = await SalesShipment.find({
      status: { $in: ['dispatched', 'delivered', 'returned'] }
    });
    const totalDispatched = dispatchedShipments.reduce((total, shipment) => {
      return total + shipment.items.reduce((shipmentTotal, item) => shipmentTotal + item.quantity, 0);
    }, 0);
    
    // Calculate returns
    const returns = await Return.find({});
    const totalReturns = returns.reduce((total, ret) => {
      return total + ret.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0);
    }, 0);
    
    // Calculate successful deliveries
    const deliveredShipments = await SalesShipment.find({ status: 'delivered' });
    const totalDelivered = deliveredShipments.reduce((total, shipment) => {
      return total + shipment.items.reduce((shipmentTotal, item) => shipmentTotal + item.quantity, 0);
    }, 0);
    
    console.log(`   FINAL COUNTS:`);
    console.log(`   - totalProducts: ${finalProducts}`);
    console.log(`   - totalItemsInStock: ${totalStock}`);
    console.log(`   - totalWarehouses: ${finalWarehouses}`);
    console.log(`   - totalDispatchedProducts: ${totalDispatched}`);
    console.log(`   - returns: ${totalReturns}`);
    console.log(`   - delivered: ${totalDelivered}`);
    
    // Expected final state verification
    const expectedStock = 40 + 30 + 100; // Product A (50-10) + Product B (30-5+5) + Product C (100)
    const expectedWarehouses = 1;
    const expectedDispatched = 10 + 5; // 10 from A + 5 from B
    const expectedReturns = 5; // 5 from B
    const expectedDelivered = 10; // 10 from A
    
    console.log(`\n=== VERIFICATION ===`);
    console.log(`Expected vs Actual:`);
    console.log(`- Products: 3 vs ${finalProducts} ${finalProducts === 3 ? '✓' : '✗'}`);
    console.log(`- Stock: ${expectedStock} vs ${totalStock} ${totalStock === expectedStock ? '✓' : '✗'}`);
    console.log(`- Warehouses: ${expectedWarehouses} vs ${finalWarehouses} ${finalWarehouses === expectedWarehouses ? '✓' : '✗'}`);
    console.log(`- Dispatched: ${expectedDispatched} vs ${totalDispatched} ${totalDispatched === expectedDispatched ? '✓' : '✗'}`);
    console.log(`- Returns: ${expectedReturns} vs ${totalReturns} ${totalReturns === expectedReturns ? '✓' : '✗'}`);
    console.log(`- Delivered: ${expectedDelivered} vs ${totalDelivered} ${totalDelivered === expectedDelivered ? '✓' : '✗'}`);
    
    const allCorrect = (
      finalProducts === 3 &&
      totalStock === expectedStock &&
      finalWarehouses === expectedWarehouses &&
      totalDispatched === expectedDispatched &&
      totalReturns === expectedReturns &&
      totalDelivered === expectedDelivered
    );
    
    console.log(`\n${allCorrect ? '✅ ALL VERIFICATIONS PASSED' : '❌ SOME VERIFICATIONS FAILED'}`);
    
    console.log('\n=== SEED FLOW COMPLETED SUCCESSFULLY ===');
    
  } catch (error) {
    console.error('Error in seed flow:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seed flow
seedFlow();
