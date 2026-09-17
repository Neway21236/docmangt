const express = require('express');
const ShareController = require('../controllers/shareController');
const FavoriteController = require('../controllers/favoriteController');
const AuditLogController = require('../controllers/auditLogController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const UserModel = require('../models/userModel');

const router = express.Router();

// ── Users list for share picker (all authenticated) ─────────────────────────────
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await UserModel.findAll();
    // strip password_hash just in case
    return res.json({ success: true, users: users.map(u => ({
      id: u.id, email: u.email, first_name: u.first_name, last_name: u.last_name, role: u.role, is_active: u.is_active
    }))});
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to list users.' });
  }
});

// ── Audit Logs (Admin only for search, all authenticated for recent) ──────────
router.get('/audit-logs', authenticateToken, requireRole('ADMIN'), AuditLogController.search);
router.get('/audit-logs/recent', authenticateToken, AuditLogController.getRecent);
router.get('/audit-logs/actions', authenticateToken, requireRole('ADMIN'), AuditLogController.getActionTypes);

// ── Favorites (all authenticated users) ────────────────────────────────────────
router.get('/favorites', authenticateToken, FavoriteController.list);
router.post('/favorites/:documentId', authenticateToken, FavoriteController.toggle);

// ── Document Shares (owner, manager, admin) ─────────────────────────────────────
router.get('/documents/:id/shares', authenticateToken, requireRole('MANAGER', 'ADMIN'), ShareController.list);
router.post('/documents/:id/shares', authenticateToken, requireRole('MANAGER', 'ADMIN'), ShareController.share);
router.delete('/documents/:id/shares/:userId', authenticateToken, requireRole('MANAGER', 'ADMIN'), ShareController.unshare);

module.exports = router;
