// Test CORS configuration
const cors = require('cors');
const express = require('express');

const app = express();

// Test the CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    console.log('Request origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('No origin - allowing');
      return callback(null, true);
    }
    
    // List of allowed origins
    const allowedOrigins = [
      'https://inventory-system-nine-xi.vercel.app',
      'https://inventory-system-nine-xi.vercel.app/',
      'https://inventory-system-beta-smoky.vercel.app',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173'
    ];
    
    console.log('Allowed origins:', allowedOrigins);
    console.log('Checking if origin is allowed...');
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('⚠️  Origin not in list:', origin);
      console.log('Allowing anyway for testing...');
      callback(null, true); // Allow all for now
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ 
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

app.post('/test', (req, res) => {
  res.json({ 
    message: 'POST test successful',
    origin: req.headers.origin,
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`CORS test server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/test`);
});

