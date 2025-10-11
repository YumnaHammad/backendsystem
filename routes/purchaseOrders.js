const express = require('express');
const router = express.Router();
const {
  createPurchaseOrder,
  getAllPurchaseOrders,
  updatePurchaseOrder,
  submitPurchaseOrder
} = require('../controllers/purchaseOrderController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// @route   POST /api/purchase-orders
// @desc    Create draft purchase order
// @access  Private
router.post('/', authenticateToken, createPurchaseOrder);

// @route   GET /api/purchase-orders
// @desc    Get all purchase orders
// @access  Private
router.get('/', authenticateToken, getAllPurchaseOrders);

// @route   PUT /api/purchase-orders/:id
// @desc    Update draft purchase order
// @access  Private
router.put('/:id', authenticateToken, updatePurchaseOrder);

// @route   POST /api/purchase-orders/:id/submit
// @desc    Submit purchase order
// @access  Private
router.post('/:id/submit', authenticateToken, submitPurchaseOrder);

module.exports = router;
