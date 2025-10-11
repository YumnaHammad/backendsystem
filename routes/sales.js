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

const router = express.Router();

// Public routes (no auth required for testing)
router.get('/', getAllSalesOrders);
router.get('/:id', getSalesOrderById);
router.post('/', createSalesOrder);
router.put('/:id/status', updateSalesOrderStatus);
router.post('/:id/dispatch', dispatchSalesOrder);
router.post('/:id/deliver', markDeliveryCompleted);
router.delete('/:id', deleteSalesOrder);

module.exports = router;