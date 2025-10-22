const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 5000;

// CORS - Allow everything for local development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://inventory:leader12@cluster0.earrfsb.mongodb.net/inventory_system?retryWrites=true&w=majority')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

// Products
app.get('/api/products', async (req, res) => {
  try {
    const productSchema = new mongoose.Schema({}, { strict: false });
    const Product = mongoose.model('Product', productSchema, 'products');
    const products = await Product.find({ isActive: true });
    console.log(`📦 Found ${products.length} products`);
    res.json({ products });
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sales (from salesorders collection)
app.get('/api/sales', async (req, res) => {
  try {
    const salesSchema = new mongoose.Schema({}, { strict: false });
    const Sales = mongoose.model('Sales', salesSchema, 'salesorders');
    const sales = await Sales.find();
    console.log(`💰 Found ${sales.length} sales`);
    res.json({ sales });
  } catch (error) {
    console.error('Sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Purchases
app.get('/api/purchases', async (req, res) => {
  try {
    const purchaseSchema = new mongoose.Schema({}, { strict: false });
    const Purchase = mongoose.model('Purchase', purchaseSchema, 'purchases');
    const purchases = await Purchase.find();
    console.log(`🛒 Found ${purchases.length} purchases`);
    res.json({ purchases });
  } catch (error) {
    console.error('Purchases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Suppliers
app.get('/api/suppliers', async (req, res) => {
  try {
    const supplierSchema = new mongoose.Schema({}, { strict: false });
    const Supplier = mongoose.model('Supplier', supplierSchema, 'suppliers');
    const suppliers = await Supplier.find();
    console.log(`🏢 Found ${suppliers.length} suppliers`);
    res.json({ suppliers });
  } catch (error) {
    console.error('Suppliers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const productSchema = new mongoose.Schema({}, { strict: false });
    const Product = mongoose.model('Product', productSchema, 'products');
    
    const salesSchema = new mongoose.Schema({}, { strict: false });
    const Sales = mongoose.model('Sales', salesSchema, 'salesorders');
    
    const purchaseSchema = new mongoose.Schema({}, { strict: false });
    const Purchase = mongoose.model('Purchase', purchaseSchema, 'purchases');
    
    const supplierSchema = new mongoose.Schema({}, { strict: false });
    const Supplier = mongoose.model('Supplier', supplierSchema, 'suppliers');
    
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalSales = await Sales.countDocuments();
    const totalPurchases = await Purchase.countDocuments();
    const totalSuppliers = await Supplier.countDocuments();
    const lowStockProducts = await Product.countDocuments({ currentStock: { $lte: 5 }, isActive: true });
    
    console.log(`📊 Stats: Products: ${totalProducts}, Sales: ${totalSales}, Purchases: ${totalPurchases}, Suppliers: ${totalSuppliers}`);
    
    res.json({
      totalProducts,
      totalSales,
      totalPurchases,
      totalSuppliers,
      lowStockProducts
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', userSchema, 'users');
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Simple password check
    if (password === 'AdminPass123' && email === 'admin@example.com') {
      res.json({
        token: 'fake-jwt-token',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      });
    } else if (password === 'Yumna123' && email === 'yumnahammad4884@gmail.com') {
      res.json({
        token: 'fake-jwt-token',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Profile
app.get('/api/auth/profile', (req, res) => {
  res.json({
    user: {
      id: '68ecbe517080d98997448cb7',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: 'admin'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 MongoDB connected`);
});