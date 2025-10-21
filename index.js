// index.js
// ✅ Main Express App for Backend System (Vercel + Local ready)

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const purchaseRoutes = require('./routes/purchases');
const invoiceRoutes = require('./routes/invoices');
const receiptRoutes = require('./routes/receipts');
const salesRoutes = require('./routes/sales');
const returnRoutes = require('./routes/returns');
const expectedReturnRoutes = require('./routes/expectedReturns');
const stockRoutes = require('./routes/stock');
const customerRoutes = require('./routes/customers');
const userRoutes = require('./routes/users');
const warehouseRoutes = require('./routes/warehouses');
const supplierRoutes = require('./routes/suppliers');
const reportRoutes = require('./routes/reports');

const app = express();

// ✅ CORS Configuration - ONLY your live URLs
const allowedOrigins = [
  'http://localhost:3000',  // For local development
  'http://localhost:5173',  // For local development
  'https://inventory-system-nine-xi.vercel.app'  // YOUR OLD LIVE FRONTEND
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS not allowed for this origin'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ✅ Health check (no DB required)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Backend is running successfully'
  });
});

// ✅ CORS test endpoint (no DB required)
app.get('/api/cors-test', (req, res) => {
  try {
    res.json({ 
      message: 'CORS is working!',
      origin: req.headers.origin,
      timestamp: new Date().toISOString(),
      status: 'success'
    });
  } catch (error) {
    console.error('CORS test error:', error);
    res.status(500).json({ 
      error: 'CORS test failed',
      message: error.message 
    });
  }
});

// ✅ MongoDB connection function
async function connectToMongoDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_system';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// ✅ MongoDB connection middleware (connect before routes that need DB)
app.use(async (req, res, next) => {
  // Skip DB connection for health and CORS test endpoints
  if (req.path === '/api/health' || req.path === '/api/cors-test') {
    return next();
  }

  try {
    await connectToMongoDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      message: 'Unable to connect to database. Please check your MongoDB connection.'
    });
  }
});

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/expected-returns', expectedReturnRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes);

// ✅ 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist.`
  });
});

// ✅ Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

// ✅ Export for Vercel
module.exports = app;

// ✅ Optional: Run locally
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Backend running locally at http://localhost:${PORT}`);
  });
}