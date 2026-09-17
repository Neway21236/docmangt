const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const DashboardController = require('../controllers/dashboardController');
const NotificationController = require('../controllers/notificationController');

// Dashboard Routes
router.get('/dashboard/stats', authenticateToken, DashboardController.getStats);

// Notification Routes
router.get('/notifications', authenticateToken, NotificationController.getNotifications);
router.patch('/notifications/mark-all-read', authenticateToken, NotificationController.markAllAsRead);
router.patch('/notifications/:id/read', authenticateToken, NotificationController.markAsRead);

module.exports = router;
