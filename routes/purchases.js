const express = require('express');
const { 
  createPurchase, 
  getAllPurchases, 
  getPurchaseById, 
  updatePurchaseStatus,
  generateReceipt,
  generateInvoice,
  markPaymentCleared,
  downloadDocument,
  deletePurchase 
} = require('../controllers/purchaseController');
const { authenticateToken, requireManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Public routes (authenticated users)
router.get('/', getAllPurchases);
router.get('/:id', getPurchaseById);

// Protected routes (manager or admin only)
router.post('/', requireManagerOrAdmin, createPurchase);
router.put('/:id/status', requireManagerOrAdmin, updatePurchaseStatus);
router.post('/:id/receipt', requireManagerOrAdmin, generateReceipt);
router.post('/:id/invoice', requireManagerOrAdmin, generateInvoice);
router.post('/:id/clear-payment', requireManagerOrAdmin, markPaymentCleared);
router.get('/:id/download', downloadDocument);
router.delete('/:id', requireManagerOrAdmin, deletePurchase);

module.exports = router;