const express = require('express');
const router = express.Router();
const posController = require('../controllers/posController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/role');

router.post('/sales', authenticateToken, posController.createSale);
router.get('/sales', authenticateToken, posController.getSalesHistory);
router.get('/sales/held', authenticateToken, posController.getHeldSales);
router.delete('/sales/held/:id', authenticateToken, posController.deleteHeldSale);
router.get('/sales/:id', authenticateToken, posController.getSaleDetails);
router.post('/sales/:id/void', authenticateToken, checkRole(['ADMIN', 'MANAGER']), posController.voidSale);
router.post('/sales/sync', authenticateToken, posController.syncOfflineSales);

module.exports = router;
