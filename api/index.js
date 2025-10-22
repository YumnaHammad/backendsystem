// Main API handler for Vercel
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import route files
const authRoutes = require('../routes/auth');
const productRoutes = require('../routes/products');
const supplierRoutes = require('../routes/suppliers');
const salesRoutes = require('../routes/sales');
const purchaseRoutes = require('../routes/purchases');
const salesOrderRoutes = require('../routes/salesOrders');
const purchaseOrderRoutes = require('../routes/purchaseOrders');
const warehouseRoutes = require('../routes/warehouses');
const dispatchRoutes = require('../routes/dispatches');
const receiptRoutes = require('../routes/receipts');
const returnRoutes = require('../routes/returns');
const invoiceRoutes = require('../routes/invoices');
const stockRoutes = require('../routes/stock');
const userRoutes = require('../routes/users');
const dashboardRoutes = require('../routes/dashboard');
const reportRoutes = require('../routes/reports');
const cityReportRoutes = require('../routes/cityReports');
const expectedReturnRoutes = require('../routes/expectedReturns');
const customerRoutes = require('../routes/customers');

const app = express();

// CORS - Simple configuration for Vercel
app.use(cors({
  origin: [
    'https://inventory-system-amber-beta.vercel.app',
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:8080'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true
}));

app.use(express.json());

// Use route files
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/dispatches', dispatchRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/city-reports', cityReportRoutes);
app.use('/api/expected-returns', expectedReturnRoutes);
app.use('/api/customers', customerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://inventory:leader12@cluster0.earrfsb.mongodb.net/inventory_system?retryWrites=true&w=majority';

// Connect to MongoDB with better error handling
async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      serverApi: { version: '1', strict: false }
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
  }
}

connectToMongoDB();

module.exports = app;