const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/role');

router.get('/', authenticateToken, productController.getProducts);
router.get('/barcode/:barcode', authenticateToken, productController.getProductByBarcode);
router.get('/export/csv', authenticateToken, productController.exportCSV);
router.post('/', authenticateToken, checkRole(['ADMIN', 'MANAGER']), productController.createProduct);
router.put('/:id', authenticateToken, checkRole(['ADMIN', 'MANAGER']), productController.updateProduct);
router.delete('/:id', authenticateToken, checkRole(['ADMIN']), productController.deleteProduct);

router.get('/categories', authenticateToken, productController.getCategories);
router.post('/categories', authenticateToken, checkRole(['ADMIN', 'MANAGER']), productController.createCategory);

router.post('/adjust-stock', authenticateToken, checkRole(['ADMIN', 'MANAGER']), productController.adjustStock);

module.exports = router;
