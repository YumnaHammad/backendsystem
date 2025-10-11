const express = require('express');
const {
  generatePurchaseInvoice,
  generateSalesInvoice,
  getAllInvoices,
  getInvoiceById,
  downloadInvoicePDF,
  updateInvoiceStatus,
  deleteInvoice,
  getInvoiceStatistics
} = require('../controllers/invoiceController');
const { authenticateToken, requireManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Public routes (authenticated users)
router.get('/', getAllInvoices);
router.get('/statistics', getInvoiceStatistics);
router.get('/:id', getInvoiceById);
router.get('/:id/pdf', downloadInvoicePDF);

// Protected routes (manager or admin only)
router.post('/purchase/:purchaseId', requireManagerOrAdmin, generatePurchaseInvoice);
router.post('/sales/:salesOrderId', requireManagerOrAdmin, generateSalesInvoice);
router.put('/:id/status', requireManagerOrAdmin, updateInvoiceStatus);
router.delete('/:id', requireManagerOrAdmin, deleteInvoice);

module.exports = router;
