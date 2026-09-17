const express = require('express');
const TestController = require('../controllers/testController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// 1. Public route (unauthenticated)
router.get('/public', TestController.getPublic);

// 2. Protected route (any authenticated user: Viewer, Manager, Admin)
router.get('/protected', authenticateToken, TestController.getAuthenticated);

// 3. Manager/Admin route
router.get('/manager-only', authenticateToken, requireRole('MANAGER', 'ADMIN'), TestController.getManagerOnly);

// 4. Admin-only route
router.get('/admin-only', authenticateToken, requireRole('ADMIN'), TestController.getAdminOnly);

module.exports = router;
