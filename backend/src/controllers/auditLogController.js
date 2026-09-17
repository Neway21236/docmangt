const AuditLogModel = require('../models/auditLogModel');

class AuditLogController {
  /**
   * GET /api/audit-logs
   * Search/filter audit logs with pagination (Admin only).
   */
  static async search(req, res) {
    try {
      const {
        action, entityType, userId, dateFrom, dateTo,
        page = 1, limit = 50,
      } = req.query;

      const result = await AuditLogModel.search({
        action, entityType, userId, dateFrom, dateTo, page, limit,
      });

      return res.json({
        success: true,
        logs: result.rows,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      console.error('Audit log search error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
    }
  }

  /**
   * GET /api/audit-logs/recent
   * Get recent activity for the current user (dashboard widget).
   * Query params: actions (comma-separated), limit
   */
  static async getRecent(req, res) {
    try {
      const { actions = '', limit = 10 } = req.query;
      const actionTypes = actions ? actions.split(',').map(a => a.trim().toUpperCase()) : [];
      const rows = await AuditLogModel.getRecentUserActivity(req.user.id, actionTypes, parseInt(limit, 10));
      return res.json({ success: true, activity: rows });
    } catch (err) {
      console.error('Recent activity error:', err);
      return res.status(500).json({ success: false, message: 'Failed to load recent activity.' });
    }
  }

  /**
   * GET /api/audit-logs/actions
   * Return the list of distinct action types for filter dropdowns (Admin only).
   */
  static async getActionTypes(req, res) {
    return res.json({
      success: true,
      actions: [
        'UPLOAD', 'DOWNLOAD', 'VIEW', 'DELETE', 'RENAME', 'MOVE',
        'SHARE', 'UNSHARE', 'APPROVAL_SUBMIT', 'APPROVAL_REVIEW',
        'VERSION_UPLOAD', 'FAVORITE_ADD', 'FOLDER_CREATE', 'FOLDER_DELETE',
        'FOLDER_RENAME', 'FOLDER_MOVE',
      ],
    });
  }
}

module.exports = AuditLogController;
