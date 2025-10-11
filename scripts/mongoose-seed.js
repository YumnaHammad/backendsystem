const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { 
  User, 
  Product, 
  Warehouse, 
  Supplier,
  Purchase,
  SalesOrder,
  StockMovement,
  Return,
  SalesShipment
} = require('../models');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/inventory_system');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create sample users
const createUsers = async () => {
  console.log('Creating users...');
  
  // Clear existing users
  await User.deleteMany({});
  
  const hashedPassword = await bcrypt.hash('AdminPass123', 10);
  
  const users = [
    {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    },
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: hashedPassword,
      role: 'manager',
      isActive: true
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      password: hashedPassword,
      role: 'employee',
      isActive: true
    }
  ];

  const createdUsers = await User.insertMany(users);
  console.log(`Created ${createdUsers.length} users`);
  return createdUsers;
};

// Create sample warehouses
const createWarehouses = async () => {
  console.log('Creating warehouses...');
  
  // Clear existing warehouses
  await Warehouse.deleteMany({});
  
  const warehouses = [
    {
      name: 'Main Warehouse',
      location: 'Karachi, Pakistan',
      capacity: 10000,
      currentStock: [],
      isActive: true,
      createdBy: null // Will be set later
    },
    {
      name: 'Secondary Warehouse',
      location: 'Lahore, Pakistan',
      capacity: 5000,
      currentStock: [],
      isActive: true,
      createdBy: null // Will be set later
    },
    {
      name: 'Regional Warehouse',
      location: 'Islamabad, Pakistan',
      capacity: 3000,
      currentStock: [],
      isActive: true,
      createdBy: null // Will be set later
    }
  ];

  const createdWarehouses = await Warehouse.insertMany(warehouses);
  console.log(`Created ${createdWarehouses.length} warehouses`);
  return createdWarehouses;
};

// Create sample suppliers
const createSuppliers = async () => {
  console.log('Creating suppliers...');
  
  // Clear existing suppliers
  await Supplier.deleteMany({});
  
  const suppliers = [
    {
      name: 'Ahmed Ali',
      company: 'TechCorp Pakistan',
      supplierCode: 'SUP-001',
      email: 'orders@techcorp.pk',
      phone: '+92-21-1234567',
      address: {
        street: '123 Tech Street',
        city: 'Karachi',
        state: 'Sindh',
        zipCode: '75000',
        country: 'Pakistan'
      },
      paymentTerms: 'net30',
      isActive: true
    },
    {
      name: 'Sara Khan',
      company: 'Office Supplies Ltd',
      supplierCode: 'SUP-002',
      email: 'sales@officesupplies.pk',
      phone: '+92-42-7654321',
      address: {
        street: '456 Business Avenue',
        city: 'Lahore',
        state: 'Punjab',
        zipCode: '54000',
        country: 'Pakistan'
      },
      paymentTerms: 'net15',
      isActive: true
    },
    {
      name: 'Muhammad Hassan',
      company: 'Electronics Hub',
      supplierCode: 'SUP-003',
      email: 'orders@electronics.pk',
      phone: '+92-51-9876543',
      address: {
        street: '789 Electronics Plaza',
        city: 'Islamabad',
        state: 'Federal',
        zipCode: '44000',
        country: 'Pakistan'
      },
      paymentTerms: 'net45',
      isActive: true
    }
  ];

  const createdSuppliers = await Supplier.insertMany(suppliers);
  console.log(`Created ${createdSuppliers.length} suppliers`);
  return createdSuppliers;
};

// Create sample products
const createProducts = async () => {
  console.log('Creating products...');
  
  // Clear existing products
  await Product.deleteMany({});
  
  const products = [
    {
      name: 'Laptop Computer',
      sku: 'LAPTOP-001',
      description: 'High-performance laptop computers for business and personal use',
      category: 'Electronics',
      unit: 'pcs',
      costPrice: 180000,
      sellingPrice: 250000,
      isActive: true
    },
    {
      name: 'Office Chair',
      sku: 'CHAIR-001',
      description: 'Ergonomic office chairs for comfortable working',
      category: 'Furniture',
      unit: 'pcs',
      costPrice: 35000,
      sellingPrice: 45000,
      isActive: true
    },
    {
      name: 'Wireless Mouse',
      sku: 'MOUSE-001',
      description: 'Wireless computer mice for enhanced productivity',
      category: 'Electronics',
      unit: 'pcs',
      costPrice: 3500,
      sellingPrice: 5000,
      isActive: true
    },
    {
      name: 'Desk Lamp',
      sku: 'LAMP-001',
      description: 'LED desk lamps for optimal lighting',
      category: 'Furniture',
      unit: 'pcs',
      costPrice: 6000,
      sellingPrice: 8000,
      isActive: true
    },
    {
      name: 'Notebook Set',
      sku: 'NOTEBOOK-001',
      description: 'Premium and basic notebook sets for office use',
      category: 'Stationery',
      unit: 'boxes',
      costPrice: 1500,
      sellingPrice: 2000,
      isActive: true
    },
    {
      name: 'Monitor 24"',
      sku: 'MONITOR-001',
      description: '24-inch LED monitors for office use',
      category: 'Electronics',
      unit: 'pcs',
      costPrice: 45000,
      sellingPrice: 60000,
      isActive: true
    },
    {
      name: 'Keyboard',
      sku: 'KEYBOARD-001',
      description: 'Mechanical keyboards for enhanced typing experience',
      category: 'Electronics',
      unit: 'pcs',
      costPrice: 8000,
      sellingPrice: 12000,
      isActive: true
    },
    {
      name: 'Printer',
      sku: 'PRINTER-001',
      description: 'Laser printers for office documentation',
      category: 'Electronics',
      unit: 'pcs',
      costPrice: 65000,
      sellingPrice: 85000,
      isActive: true
    }
  ];

  const createdProducts = await Product.insertMany(products);
  console.log(`Created ${createdProducts.length} products`);
  return createdProducts;
};

// Create sample stock movements and populate warehouses
const createStockMovements = async (products, warehouses, users) => {
  console.log('Creating stock movements and populating warehouses...');
  
  // Clear existing stock movements
  await StockMovement.deleteMany({});
  
  // Clear warehouse stock
  for (const warehouse of warehouses) {
    warehouse.currentStock = [];
    await warehouse.save();
  }

  const stockMovements = [];
  
  // Add initial stock to warehouses
  for (const product of products) {
    for (let i = 0; i < warehouses.length; i++) {
      const warehouse = warehouses[i];
      const quantity = Math.floor(Math.random() * 100) + 20; // 20-120 units
      
      // Add to warehouse stock
      warehouse.currentStock.push({
        productId: product._id,
        quantity: quantity,
        reservedQuantity: Math.floor(Math.random() * 5) // 0-5 reserved
      });
      
      // Create stock movement record
      const stockMovement = new StockMovement({
        productId: product._id,
        warehouseId: warehouse._id,
        movementType: 'in',
        quantity: quantity,
        previousQuantity: 0,
        newQuantity: quantity,
        referenceType: 'adjustment',
        referenceId: users[0]._id, // Use admin user as reference for initial setup
        notes: 'Initial stock setup',
        createdBy: users[0]._id // Admin user
      });
      
      stockMovements.push(stockMovement);
    }
  }
  
  // Save stock movements
  await StockMovement.insertMany(stockMovements);
  
  // Save warehouses with updated stock
  for (const warehouse of warehouses) {
    await warehouse.save();
  }
  
  console.log(`Created ${stockMovements.length} stock movements`);
  return stockMovements;
};

// Create sample purchases
const createPurchases = async (products, suppliers, warehouses, users) => {
  console.log('Creating purchases...');
  
  // Clear existing purchases
  await Purchase.deleteMany({});
  
  const purchases = [];
  
  // Create 20 purchase orders over the last 3 months
  for (let i = 0; i < 20; i++) {
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const createdBy = users[Math.floor(Math.random() * users.length)];
    const purchaseDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    
    // Select 1-3 random products
    const numProducts = Math.floor(Math.random() * 3) + 1;
    const selectedProducts = [];
    for (let j = 0; j < numProducts; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      if (!selectedProducts.find(p => p.productId.toString() === product._id.toString())) {
        const quantity = Math.floor(Math.random() * 50) + 10;
        const unitPrice = product.costPrice + (Math.random() * 1000 - 500);
        selectedProducts.push({
          productId: product._id,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: quantity * unitPrice
        });
      }
    }
    
    const totalAmount = selectedProducts.reduce((sum, item) => sum + item.totalPrice, 0);
    
    const purchase = new Purchase({
      purchaseNumber: `PUR-${(i + 1).toString().padStart(4, '0')}`,
      supplierId: supplier._id,
      items: selectedProducts,
      totalAmount: totalAmount,
      expectedDeliveryDate: new Date(purchaseDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      notes: `Purchase order for ${selectedProducts.length} products`,
      paymentMethod: ['cash', 'bank_transfer', 'credit_card'][Math.floor(Math.random() * 3)],
      status: Math.random() > 0.2 ? 'received' : 'ordered',
      createdBy: createdBy._id
    });
    
    await purchase.save();
    purchases.push(purchase);
  }
  console.log(`Created ${purchases.length} purchases`);
  return purchases;
};

// Create sample sales orders
const createSalesOrders = async (products, warehouses, users) => {
  console.log('Creating sales orders...');
  
  // Clear existing sales orders
  await SalesOrder.deleteMany({});
  
  const salesOrders = [];
  
  // Create 30 sales orders over the last 2 months
  for (let i = 0; i < 30; i++) {
    const createdBy = users[Math.floor(Math.random() * users.length)];
    const orderDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
    
    // Select 1-3 random products
    const numProducts = Math.floor(Math.random() * 3) + 1;
    const selectedProducts = [];
    for (let j = 0; j < numProducts; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      if (!selectedProducts.find(p => p.productId.toString() === product._id.toString())) {
        const quantity = Math.floor(Math.random() * 20) + 1;
        const unitPrice = product.sellingPrice + (Math.random() * 500 - 250);
        selectedProducts.push({
          productId: product._id,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: quantity * unitPrice
        });
      }
    }
    
    const totalAmount = selectedProducts.reduce((sum, item) => sum + item.totalPrice, 0);
    const status = ['pending', 'confirmed', 'dispatched', 'delivered'][Math.floor(Math.random() * 4)];
    
    const salesOrder = new SalesOrder({
      orderNumber: `SO-${(i + 1).toString().padStart(4, '0')}`,
      customerInfo: {
        name: `Customer ${i + 1}`,
        email: `customer${i + 1}@example.com`,
        phone: `+92-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        address: {
          street: `${Math.floor(Math.random() * 999) + 1} Customer Street`,
          city: 'Karachi',
          state: 'Sindh',
          zipCode: '75000',
          country: 'Pakistan'
        }
      },
      items: selectedProducts,
      totalAmount: totalAmount,
      status: status,
      paymentStatus: ['pending', 'paid'][Math.floor(Math.random() * 2)],
      orderDate: orderDate,
      actualDeliveryDate: status === 'delivered' ? new Date(orderDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
      notes: `Sales order for ${selectedProducts.length} products`,
      createdBy: createdBy._id
    });
    
    await salesOrder.save();
    salesOrders.push(salesOrder);
  }
  console.log(`Created ${salesOrders.length} sales orders`);
  return salesOrders;
};

// Create sample sales shipments
const createSalesShipments = async (salesOrders, warehouses, users) => {
  console.log('Creating sales shipments...');
  
  // Clear existing sales shipments
  await SalesShipment.deleteMany({});
  
  const shipments = [];
  
  // Create shipments for dispatched/delivered orders
  const dispatchedOrders = salesOrders.filter(order => 
    order.status === 'dispatched' || order.status === 'delivered'
  );
  
  for (let i = 0; i < dispatchedOrders.length; i++) {
    const order = dispatchedOrders[i];
    const warehouse = warehouses[Math.floor(Math.random() * warehouses.length)];
    const dispatchDate = order.actualDeliveryDate ? new Date(order.orderDate.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000) : new Date(order.orderDate.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);
    
    const shipment = new SalesShipment({
      shipmentNumber: `SH-${(i + 1).toString().padStart(4, '0')}`,
      salesOrderId: order._id,
      items: order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        warehouseId: warehouse._id
      })),
      status: order.status === 'delivered' ? 'delivered' : 'dispatched',
      dispatchDate: dispatchDate,
      actualDeliveryDate: order.status === 'delivered' ? order.actualDeliveryDate : null,
      trackingNumber: `TRK-${order._id.toString().slice(-6)}`,
      carrier: ['FedEx', 'UPS', 'DHL', 'Pakistan Post'][Math.floor(Math.random() * 4)],
      deliveryAddress: order.customerInfo.address,
      notes: `Shipment for order ${order.orderNumber}`,
      createdBy: users[Math.floor(Math.random() * users.length)]._id
    });
    
    await shipment.save();
    shipments.push(shipment);
  }
  
  console.log(`Created ${shipments.length} sales shipments`);
  return shipments;
};

// Create sample returns
const createReturns = async (salesOrders, users) => {
  console.log('Creating returns...');
  
  // Clear existing returns
  await Return.deleteMany({});
  
  const returns = [];
  
  // Create returns for some delivered orders
  const deliveredOrders = salesOrders.filter(order => order.status === 'delivered');
  const ordersToReturn = deliveredOrders.slice(0, Math.floor(deliveredOrders.length * 0.2)); // 20% return rate
  
  for (let i = 0; i < ordersToReturn.length; i++) {
    const order = ordersToReturn[i];
    const returnDate = new Date(order.actualDeliveryDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000); // Within 2 weeks
    
    const warehouses = await Warehouse.find({ isActive: true });
    const returnItems = order.items.map(item => ({
      productId: item.productId,
      quantity: Math.floor(Math.random() * item.quantity) + 1, // Return 1 to full quantity
      returnReason: ['defective', 'wrong_item', 'customer_request', 'damaged'][Math.floor(Math.random() * 4)],
      condition: ['good', 'damaged', 'defective'][Math.floor(Math.random() * 3)],
      warehouseId: warehouses[Math.floor(Math.random() * warehouses.length)]._id
    }));
    
    const returnOrder = new Return({
      salesOrderId: order._id,
      returnNumber: `RT-${(i + 1).toString().padStart(4, '0')}`,
      items: returnItems,
      returnDate: returnDate,
      status: ['pending', 'received', 'processed', 'rejected'][Math.floor(Math.random() * 4)],
      refundAmount: Math.floor(Math.random() * (order.totalAmount * 0.8)) + (order.totalAmount * 0.2),
      notes: `Return for order ${order.orderNumber}`,
      createdBy: users[Math.floor(Math.random() * users.length)]._id
    });
    
    await returnOrder.save();
    returns.push(returnOrder);
  }
  console.log(`Created ${returns.length} returns`);
  return returns;
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    await connectDB();
    
    // Create data in order
    const users = await createUsers();
    const warehouses = await createWarehouses();
    const suppliers = await createSuppliers();
    const products = await createProducts();
    
    // Update createdBy fields
    const adminUser = users.find(u => u.role === 'admin');
    
    // Update warehouses with createdBy
    await Warehouse.updateMany({}, { createdBy: adminUser._id });
    
    // Update suppliers with createdBy
    await Supplier.updateMany({}, { createdBy: adminUser._id });
    
    // Update products with createdBy
    await Product.updateMany({}, { createdBy: adminUser._id });
    
    // Create dependent data
    const stockMovements = await createStockMovements(products, warehouses, users);
    const purchases = await createPurchases(products, suppliers, warehouses, users);
    const salesOrders = await createSalesOrders(products, warehouses, users);
    const shipments = await createSalesShipments(salesOrders, warehouses, users);
    const returns = await createReturns(salesOrders, users);
    
    console.log('\n=== SEED DATA SUMMARY ===');
    console.log(`Users created: ${users.length}`);
    console.log(`Warehouses created: ${warehouses.length}`);
    console.log(`Suppliers created: ${suppliers.length}`);
    console.log(`Products created: ${products.length}`);
    console.log(`Stock movements created: ${stockMovements.length}`);
    console.log(`Purchases created: ${purchases.length}`);
    console.log(`Sales orders created: ${salesOrders.length}`);
    console.log(`Shipments created: ${shipments.length}`);
    console.log(`Returns created: ${returns.length}`);
    
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Admin: email=admin@example.com, password=AdminPass123');
    console.log('Manager: email=john@example.com, password=AdminPass123');
    console.log('Employee: email=jane@example.com, password=AdminPass123');
    
    console.log('\nDatabase seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run seeding
seedDatabase();
