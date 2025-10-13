const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const net = require('net');
require('dotenv').config();

// Import routes
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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://inventory-system-nine-xi.vercel.app',  // Your Vercel frontend (NEW)
        'https://inventory-system-nine-xi.vercel.app/', // With trailing slash
        'https://inventory-system-beta-smoky.vercel.app',  // Old URL (keep for backwards compatibility)
        process.env.FRONTEND_URL // Allow custom frontend URL from env
      ].filter(Boolean)
    : ['http://localhost:3002', 'http://localhost:3001', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Catch all handler - serve React app in production, API 404 in development
app.use('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    // Serve React app for any non-API routes
    const path = require('path');
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  } else {
    // Development: return 404 for API routes
    res.status(404).json({ error: 'Route not found' });
  }
});

// Function to check if port is available
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
};

// Function to find available port starting from basePort
const findAvailablePort = async (basePort = 5000) => {
  for (let port = basePort; port <= basePort + 10; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found between ${basePort} and ${basePort + 10}`);
};

// Database connection and server start
const startServer = async () => {
  try {
    // Find available port
    const basePort = parseInt(process.env.PORT) || 5000;
    const availablePort = await findAvailablePort(basePort);
    
    if (availablePort !== basePort) {
      console.log(`Port ${basePort} is busy, using port ${availablePort} instead`);
    }

    // Try to connect to MongoDB, but don't fail if it's not available
    try {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_system';
      
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      console.log('MongoDB connection established successfully.');
    } catch (dbError) {
      console.log('MongoDB connection failed, running without database:', dbError.message);
    }
    
    const server = app.listen(availablePort, () => {
      console.log(`🚀 Server is running on port ${availablePort}`);
      console.log(`📚 API Documentation available at http://localhost:${availablePort}/api-docs`);
      console.log(`🔗 Health check: http://localhost:${availablePort}/health`);
    });

    // Handle server errors gracefully
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${availablePort} is already in use. Trying next port...`);
        // Try the next port
        const nextPort = availablePort + 1;
        server.listen(nextPort, () => {
          console.log(`🚀 Server is running on port ${nextPort}`);
          console.log(`📚 API Documentation available at http://localhost:${nextPort}/api-docs`);
          console.log(`🔗 Health check: http://localhost:${nextPort}/health`);
        });
      } else {
        console.error('Server error:', error);
      }
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();