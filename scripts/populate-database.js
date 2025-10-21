const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const SalesOrder = require('../models/SalesOrder');
const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');

async function populateDatabase() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    console.log('Connected to database');

    // Clear existing data
    await Product.deleteMany({});
    await Warehouse.deleteMany({});
    await SalesOrder.deleteMany({});
    await Purchase.deleteMany({});
    await Supplier.deleteMany({});
    console.log('Cleared existing data');

    // Get admin user for createdBy
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found, creating one...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      await adminUser.save();
    }

    // Create suppliers
    const suppliers = await Supplier.insertMany([
      {
        name: 'Tech Supplier Ltd',
        email: 'info@techsupplier.com',
        phone: '0300-1111111',
        address: '123 Tech Street, Karachi',
        isActive: true
      },
      {
        name: 'Office Supplies Co',
        email: 'sales@officesupplies.com',
        phone: '0300-2222222',
        address: '456 Office Avenue, Lahore',
        isActive: true
      }
    ]);
    console.log('Created suppliers');

    // Create warehouses
    const warehouses = await Warehouse.insertMany([
      {
        name: 'Main Warehouse',
        location: 'Karachi',
        capacity: 1000,
        isActive: true
      },
      {
        name: 'Secondary Warehouse',
        location: 'Lahore',
        capacity: 500,
        isActive: true
      }
    ]);
    console.log('Created warehouses');

    // Create products one by one to avoid index conflicts
    const products = [];
    
    const product1 = new Product({
      name: 'Laptop Computer',
      sku: 'LAPTOP-001',
      category: 'Electronics',
      unit: 'pcs',
      sellingPrice: 60000,
      isActive: true,
      hasVariants: false
    });
    await product1.save();
    products.push(product1);

    const product2 = new Product({
      name: 'Office Chair',
      sku: 'CHAIR-001',
      category: 'Furniture',
      unit: 'pcs',
      sellingPrice: 20000,
      isActive: true,
      hasVariants: false
    });
    await product2.save();
    products.push(product2);

    const product3 = new Product({
      name: 'Printer Paper',
      sku: 'PAPER-001',
      category: 'Office Supplies',
      unit: 'pcs',
      sellingPrice: 800,
      isActive: true,
      hasVariants: false
    });
    await product3.save();
    products.push(product3);

    const product4 = new Product({
      name: 'Desk Lamp',
      sku: 'LAMP-001',
      category: 'Electronics',
      unit: 'pcs',
      sellingPrice: 3000,
      isActive: true,
      hasVariants: false
    });
    await product4.save();
    products.push(product4);

    console.log('Created products');

    // Create sales orders
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const salesOrders = await SalesOrder.insertMany([
      {
        customerInfo: {
          name: 'ABC Company',
          email: 'abc@company.com',
          phone: '0300-1234567'
        },
        items: [{
          productId: products[0]._id,
          quantity: 2,
          unitPrice: 60000,
          totalPrice: 120000
        }],
        totalAmount: 120000,
        status: 'completed',
        orderDate: today,
        createdBy: adminUser._id
      },
      {
        customerInfo: {
          name: 'XYZ Corp',
          email: 'xyz@corp.com',
          phone: '0300-7654321'
        },
        items: [{
          productId: products[1]._id,
          quantity: 3,
          unitPrice: 20000,
          totalPrice: 60000
        }],
        totalAmount: 60000,
        status: 'pending',
        orderDate: today,
        createdBy: adminUser._id
      },
      {
        customerInfo: {
          name: 'DEF Ltd',
          email: 'def@ltd.com',
          phone: '0300-9876543'
        },
        items: [{
          productId: products[2]._id,
          quantity: 50,
          unitPrice: 800,
          totalPrice: 40000
        }],
        totalAmount: 40000,
        status: 'completed',
        orderDate: yesterday,
        createdBy: adminUser._id
      }
    ]);
    console.log('Created sales orders');

    // Create purchases
    const purchases = await Purchase.insertMany([
      {
        supplierId: suppliers[0]._id,
        items: [{
          productId: products[0]._id,
          quantity: 10,
          unitPrice: 50000,
          totalPrice: 500000
        }],
        totalAmount: 500000,
        status: 'received',
        purchaseDate: today,
        createdBy: adminUser._id
      },
      {
        supplierId: suppliers[1]._id,
        items: [{
          productId: products[1]._id,
          quantity: 5,
          unitPrice: 15000,
          totalPrice: 75000
        }],
        totalAmount: 75000,
        status: 'pending',
        purchaseDate: today,
        createdBy: adminUser._id
      },
      {
        supplierId: suppliers[0]._id,
        items: [{
          productId: products[2]._id,
          quantity: 100,
          unitPrice: 500,
          totalPrice: 50000
        }],
        totalAmount: 50000,
        status: 'received',
        purchaseDate: yesterday,
        createdBy: adminUser._id
      }
    ]);
    console.log('Created purchases');

    console.log('\n=== SAMPLE DATA CREATED ===');
    console.log(`Suppliers: ${suppliers.length}`);
    console.log(`Warehouses: ${warehouses.length}`);
    console.log(`Products: ${products.length}`);
    console.log(`Sales Orders: ${salesOrders.length}`);
    console.log(`Purchases: ${purchases.length}`);
    console.log('\nDashboard should now show real data!');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error populating database:', error);
  }
}

populateDatabase();
