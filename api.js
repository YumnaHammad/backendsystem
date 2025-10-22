// Simple API Connection File
// This file provides easy access to your backend server

const express = require('express');
const cors = require('cors');

const app = express();

// ✅ Simple CORS - Allow your frontend
app.use(cors({
  origin: [
    'https://inventory-system-nine-xi.vercel.app',
    'https://frontend-i0d99owat-yumnas-projects-cde3c46c.vercel.app'
  ],
  credentials: true
}));

// ✅ Body parsing
app.use(express.json());

// ✅ Health check - Simple response
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// ✅ CORS test - Simple response
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// ✅ Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend connection successful!',
    server: 'Vercel Serverless Function',
    timestamp: new Date().toISOString()
  });
});

// ✅ Export for Vercel
module.exports = app;

// ✅ Run locally if needed
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Simple backend running at http://localhost:${PORT}`);
  });
}