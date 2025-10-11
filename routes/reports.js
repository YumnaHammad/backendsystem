const express = require('express');
const { 
  getDashboardSummary,
  getMainDashboardReport,
  getDailyStockReport,
  getWeeklySalesReport,
  getMonthlyInventoryReport,
  getSupplierPerformanceReport,
  getReturnAnalysisReport
} = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Dashboard and reports routes (all authenticated users)
router.get('/dashboard/summary', getDashboardSummary);
router.get('/dashboard/main', getMainDashboardReport);
router.get('/daily-stock', getDailyStockReport);
router.get('/weekly-sales', getWeeklySalesReport);
router.get('/monthly-inventory', getMonthlyInventoryReport);
router.get('/supplier-performance', getSupplierPerformanceReport);
router.get('/return-analysis', getReturnAnalysisReport);

module.exports = router;