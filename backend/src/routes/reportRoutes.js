const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/role');

router.get('/dashboard', authenticateToken, reportController.getDashboardSummary);
router.get('/sales', authenticateToken, checkRole(['ADMIN', 'MANAGER']), reportController.getSalesReport);
router.get('/profit-loss', authenticateToken, checkRole(['ADMIN', 'MANAGER']), reportController.getProfitLossReport);
router.get('/stock', authenticateToken, reportController.getStockReport);

module.exports = router;
