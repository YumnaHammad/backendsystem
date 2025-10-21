// Simple Express App for Vercel - No Complex MongoDB Logic
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// ✅ Simple CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://inventory-system-nine-xi.vercel.app'
  ],
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

// ✅ Health check (NO DATABASE REQUIRED)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Backend is running successfully'
  });
});

// ✅ CORS test endpoint (NO DATABASE REQUIRED)
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

// ✅ Simple MongoDB connection (only when needed)
async function connectDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      return; // Already connected
    }
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log('No MongoDB URI provided, skipping database connection');
      return;
    }
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.log('MongoDB connection failed:', error.message);
    // Don't throw error, just log it
  }
}

// ✅ Connect to database (non-blocking)
connectDB().catch(console.log);

// ✅ Import routes (only if they exist)
try {
  const authRoutes = require('./routes/auth');
  const productRoutes = require('./routes/products');
  const purchaseRoutes = require('./routes/purchases');
  const invoiceRoutes = require('./routes/invoices');
  const receiptRoutes = require('./routes/receipts');
  const salesRoutes = require('./routes/sales');
  const returnRoutes = require('./routes/returns');
  const stockRoutes = require('./routes/stock');
  const customerRoutes = require('./routes/customers');
  const userRoutes = require('./routes/users');
  const warehouseRoutes = require('./routes/warehouses');
  const supplierRoutes = require('./routes/suppliers');
  const reportRoutes = require('./routes/reports');

  // ✅ API Routes
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
} catch (error) {
  console.log('Some routes failed to load:', error.message);
}

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
    message: 'Something went wrong'
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