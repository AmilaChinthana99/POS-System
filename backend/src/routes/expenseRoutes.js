const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/role');

router.get('/', authenticateToken, expenseController.getExpenses);
router.post('/', authenticateToken, checkRole(['ADMIN', 'MANAGER']), expenseController.createExpense);
router.get('/categories', authenticateToken, expenseController.getExpenseCategories);

module.exports = router;
