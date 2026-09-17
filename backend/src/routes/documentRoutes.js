const express = require('express');
const DocumentController = require('../controllers/documentController');
const VersionController = require('../controllers/versionController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');

const router = express.Router();

// ── SEARCH & DISCOVERY ─────────────────────────────────────────────────────────
router.get('/search', authenticateToken, DocumentController.search);
router.get('/owners', authenticateToken, DocumentController.getOwners);

// ── CRUD OPERATIONS ────────────────────────────────────────────────────────────
router.get('/', authenticateToken, DocumentController.list);
router.get('/:id', authenticateToken, DocumentController.getById);
router.get('/:id/view', authenticateToken, DocumentController.viewInline);
router.get('/:id/download', authenticateToken, DocumentController.download);

router.post('/upload', authenticateToken, requireRole('MANAGER', 'ADMIN'), uploadSingle, DocumentController.upload);
router.patch('/:id/rename', authenticateToken, DocumentController.rename);
router.patch('/:id/move', authenticateToken, DocumentController.move);
router.patch('/:id', authenticateToken, DocumentController.updateMetadata);
router.delete('/:id', authenticateToken, DocumentController.delete);

// ── VERSION ROUTES ─────────────────────────────────────────────────────────────
// List all versions (history + current) for a document
router.get('/:id/versions', authenticateToken, VersionController.list);

// Upload a new version (Owner | Manager | Admin | Shared Edit)
router.post('/:id/versions', authenticateToken, uploadSingle, VersionController.upload);

// View / download a specific historical version inline
router.get('/:id/versions/:versionId/view', authenticateToken, VersionController.viewVersion);
router.get('/:id/versions/:versionId/download', authenticateToken, VersionController.downloadVersion);

module.exports = router;

