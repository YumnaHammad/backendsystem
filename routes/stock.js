const express = require('express');
const { 
  getStockAlerts, 
  getProductStockMovements, 
  getCurrentStockLevels, 
  transferStock,
  adjustStock 
} = require('../controllers/stockController');
const { authenticateToken, requireManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Public routes (authenticated users)
router.get('/alerts', getStockAlerts);
router.get('/movements/:productId', getProductStockMovements);
router.get('/levels', getCurrentStockLevels);

// Protected routes (manager or admin only)
router.post('/transfer', requireManagerOrAdmin, transferStock);
router.post('/adjust', requireManagerOrAdmin, adjustStock);

module.exports = router;