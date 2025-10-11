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

const router = express.Router();

// Public routes (no auth required for testing)
router.get('/', getAllPurchases);
router.get('/:id', getPurchaseById);
router.post('/', createPurchase);
router.put('/:id/status', updatePurchaseStatus);
router.post('/:id/receipt', generateReceipt);
router.post('/:id/invoice', generateInvoice);
router.post('/:id/clear-payment', markPaymentCleared);
router.get('/:id/download', downloadDocument);
router.delete('/:id', deletePurchase);

module.exports = router;