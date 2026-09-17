const express = require('express');
const ApprovalController = require('../controllers/approvalController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Stats (Admin only) ──────────────────────────────────────────────────────────
router.get('/stats', authenticateToken, requireRole('ADMIN'), ApprovalController.getStats);

// ── Pending queue (Admin only) ──────────────────────────────────────────────────
router.get('/pending', authenticateToken, requireRole('ADMIN'), ApprovalController.getPending);

// ── Per-document approval history (All authenticated) ───────────────────────────
router.get('/document/:docId', authenticateToken, ApprovalController.getDocumentHistory);

// ── Submit document for approval (Manager or Admin) ─────────────────────────────
router.post('/:docId/submit', authenticateToken, requireRole('MANAGER', 'ADMIN'), ApprovalController.submit);

// ── Review (approve/reject) a pending request (Admin only) ──────────────────────
router.post('/:requestId/review', authenticateToken, requireRole('ADMIN'), ApprovalController.review);

module.exports = router;
