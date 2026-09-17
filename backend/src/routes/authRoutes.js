const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();

// Registration
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long.'),
    body('first_name').trim().notEmpty().withMessage('First name is required.'),
    body('last_name').trim().notEmpty().withMessage('Last name is required.'),
    body('role')
      .optional()
      .isIn(['ADMIN', 'MANAGER', 'VIEWER', 'EMPLOYEE'])
      .withMessage('Invalid role specified.'),
  ],
  validateRequest,
  AuthController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validateRequest,
  AuthController.login
);

// Get current user profile
router.get('/me', authenticateToken, AuthController.getMe);

// Logout
router.post('/logout', authenticateToken, AuthController.logout);

// Admin-only user management routes
router.get('/users', authenticateToken, requireRole('ADMIN'), AuthController.getAllUsers);
router.patch(
  '/users/:id/role',
  authenticateToken,
  requireRole('ADMIN'),
  [
    body('role')
      .isIn(['ADMIN', 'MANAGER', 'VIEWER', 'EMPLOYEE'])
      .withMessage('Role must be ADMIN, MANAGER, VIEWER, or EMPLOYEE'),
  ],
  validateRequest,
  AuthController.updateUserRole
);

module.exports = router;
