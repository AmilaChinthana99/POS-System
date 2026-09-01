const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/role');

router.post('/', authenticateToken, checkRole(['ADMIN', 'MANAGER']), returnController.processReturn);
router.get('/', authenticateToken, returnController.getReturns);

module.exports = router;
