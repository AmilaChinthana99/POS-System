const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/role');

router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe);
router.get('/users', authenticateToken, checkRole(['ADMIN', 'MANAGER']), authController.getUsers);
router.post('/users', authenticateToken, checkRole(['ADMIN']), authController.createUser);
router.put('/users/:id', authenticateToken, checkRole(['ADMIN']), authController.updateUser);
router.get('/logs', authenticateToken, checkRole(['ADMIN', 'MANAGER']), authController.getActivityLogs);

module.exports = router;
