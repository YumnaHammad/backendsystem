const express = require('express');
const router = express.Router();
const {
  createSalesOrder,
  getAllSalesOrders,
  updateSalesOrder,
  submitSalesOrder
} = require('../controllers/salesOrderController');
const { authenticateToken } = require('../middleware/auth');

// @route   POST /api/sales-orders
// @desc    Create draft sales order
// @access  Private
router.post('/', authenticateToken, createSalesOrder);

// @route   GET /api/sales-orders
// @desc    Get all sales orders
// @access  Private
router.get('/', authenticateToken, getAllSalesOrders);

// @route   PUT /api/sales-orders/:id
// @desc    Update draft sales order
// @access  Private
router.put('/:id', authenticateToken, updateSalesOrder);

// @route   POST /api/sales-orders/:id/submit
// @desc    Submit sales order
// @access  Private
router.post('/:id/submit', authenticateToken, submitSalesOrder);

module.exports = router;
