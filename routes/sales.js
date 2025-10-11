const express = require('express');
const { 
  createSalesOrder, 
  getAllSalesOrders, 
  getSalesOrderById, 
  updateSalesOrderStatus,
  dispatchSalesOrder,
  markDeliveryCompleted,
  deleteSalesOrder 
} = require('../controllers/salesController');
const { authenticateToken, requireManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Public routes (authenticated users)
router.get('/', getAllSalesOrders);
router.get('/:id', getSalesOrderById);

// Protected routes (manager or admin only)
router.post('/', requireManagerOrAdmin, createSalesOrder);
router.put('/:id/status', requireManagerOrAdmin, updateSalesOrderStatus);
router.post('/:id/dispatch', requireManagerOrAdmin, dispatchSalesOrder);
router.post('/:id/deliver', requireManagerOrAdmin, markDeliveryCompleted);
router.delete('/:id', requireManagerOrAdmin, deleteSalesOrder);

module.exports = router;