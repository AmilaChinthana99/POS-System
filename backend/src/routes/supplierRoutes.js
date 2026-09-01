const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/role');

router.get('/', authenticateToken, supplierController.getSuppliers);
router.post('/', authenticateToken, checkRole(['ADMIN', 'MANAGER']), supplierController.createSupplier);

router.get('/po', authenticateToken, supplierController.getPurchaseOrders);
router.post('/po', authenticateToken, checkRole(['ADMIN', 'MANAGER']), supplierController.createPurchaseOrder);
router.post('/po/:id/receive', authenticateToken, checkRole(['ADMIN', 'MANAGER']), supplierController.receiveGoods);

module.exports = router;
