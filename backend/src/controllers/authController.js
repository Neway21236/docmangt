const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dms_jwt_key_2026_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

class AuthController {
  static async register(req, res) {
    try {
      const { email, password, first_name, last_name, role } = req.body;

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Default role to VIEWER if not provided or valid
      const validRoles = ['ADMIN', 'MANAGER', 'VIEWER', 'EMPLOYEE'];
      const assignedRole = validRoles.includes((role || '').toUpperCase())
        ? role.toUpperCase()
        : 'VIEWER';

      const newUser = await UserModel.create({
        email,
        password_hash,
        first_name,
        last_name,
        role: assignedRole,
      });

      const token = generateToken(newUser);

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        token,
        user: newUser,
      });
    } catch (err) {
      console.error('Registration error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to complete registration due to server error.',
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'This account is deactivated. Contact an administrator.',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      const token = generateToken(user);

      // Do not return password hash
      const { password_hash, ...safeUser } = user;

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        token,
        user: safeUser,
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to process login.',
      });
    }
  }

  static async getMe(req, res) {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  }

  static async logout(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  }

  static async getAllUsers(req, res) {
    try {
      const users = await UserModel.findAll();
      return res.status(200).json({
        success: true,
        users,
      });
    } catch (err) {
      console.error('Fetch users error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch users list.',
      });
    }
  }

  static async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const validRoles = ['ADMIN', 'MANAGER', 'VIEWER', 'EMPLOYEE'];
      if (!validRoles.includes((role || '').toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid role specified. Must be one of: ${validRoles.join(', ')}`,
        });
      }

      const updated = await UserModel.updateRole(id, role.toUpperCase());
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }

      return res.status(200).json({
        success: true,
        message: `User role updated to ${role.toUpperCase()}.`,
        user: updated,
      });
    } catch (err) {
      console.error('Update role error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user role.',
      });
    }
  }
}

module.exports = AuthController;
