// Vercel serverless function entry point
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const authRoutes = require('../routes/auth');
const productRoutes = require('../routes/products');
const purchaseRoutes = require('../routes/purchases');
const invoiceRoutes = require('../routes/invoices');
const receiptRoutes = require('../routes/receipts');
const salesRoutes = require('../routes/sales');
const returnRoutes = require('../routes/returns');
const stockRoutes = require('../routes/stock');
const customerRoutes = require('../routes/customers');
const userRoutes = require('../routes/users');
const warehouseRoutes = require('../routes/warehouses');
const supplierRoutes = require('../routes/suppliers');
const reportRoutes = require('../routes/reports');
const cityReportRoutes = require('../routes/cityReports');

const app = express();

// Middleware - CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    console.log('🌐 CORS Request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ Allowing request with no origin');
      return callback(null, true);
    }
    
    // List of allowed origins
    const allowedOrigins = [
      'https://inventory-system-nine-xi.vercel.app',
      'https://inventory-system-nine-xi.vercel.app/',
      'https://inventory-system-beta-smoky.vercel.app',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    console.log('📋 Allowed origins:', allowedOrigins);
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('⚠️  Origin not in allowed list:', origin);
      console.log('🔓 Allowing anyway...');
      callback(null, true); // Allow all for now
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // For legacy browser support
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check (no DB required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// MongoDB connection middleware (connect before routes)
app.use(async (req, res, next) => {
  try {
    await connectToMongoDB();
    next();
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      message: 'Please ensure MONGODB_URI is set in environment variables'
    });
  }
});

let isConnected = false;
async function connectToMongoDB() {
  if (isConnected) return;
  
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    throw error;
  }
}


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/city-reports', cityReportRoutes);

// Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_system', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => {
//   console.log('Connected to MongoDB');
// }).catch(err => {
//   console.error('MongoDB connection error:', err);
// });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'API route not found',
    path: req.originalUrl,
    method: req.method 
  });
});

module.exports = app;
