const express = require('express');
const FolderController = require('../controllers/folderController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// 1. Browse/List folders inside a parent (or root) + breadcrumbs (All authenticated users: Viewer, Manager, Admin)
router.get('/', authenticateToken, FolderController.list);

// 2. Get all folders for move picker dialog (All authenticated users)
router.get('/all', authenticateToken, FolderController.getAll);

// 3. Create new folder (Role-based: Manager or Admin only)
router.post('/', authenticateToken, requireRole('MANAGER', 'ADMIN'), FolderController.create);

// 4. Rename folder (Role-based: Manager or Admin only)
router.patch('/:id/rename', authenticateToken, requireRole('MANAGER', 'ADMIN'), FolderController.rename);

// 5. Move folder to another parent (Role-based: Manager or Admin only)
router.patch('/:id/move', authenticateToken, requireRole('MANAGER', 'ADMIN'), FolderController.move);

// 6. Delete folder (Role-based: Owner if Manager, or Admin)
router.delete('/:id', authenticateToken, requireRole('MANAGER', 'ADMIN'), FolderController.delete);

module.exports = router;
