const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/role');

router.get('/', authenticateToken, settingsController.getSettings);
router.put('/', authenticateToken, checkRole(['ADMIN']), settingsController.updateSettings);
router.get('/backup', authenticateToken, checkRole(['ADMIN']), settingsController.backupDatabase);

module.exports = router;
