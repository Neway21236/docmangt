const db = require('../config/db');

class AuditLogger {
  /**
   * Log an action to the audit_logs table.
   * @param {object} params
   * @param {number} [params.user_id]      - ID of the user performing the action
   * @param {string} params.action         - UPLOAD, DOWNLOAD, DELETE, RENAME, MOVE, SHARE, REVIEW, etc.
   * @param {string} params.entity_type    - DOCUMENT, FOLDER, APPROVAL
   * @param {number} [params.entity_id]    - ID of the entity
   * @param {object} [params.details]      - Additional JSON metadata
   * @param {string} [params.ip_address]   - User's IP address (optional)
   */
  static async log({ user_id, action, entity_type, entity_id, details = {}, ip_address = null }) {
    try {
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user_id || null, action, entity_type, entity_id || null, JSON.stringify(details), ip_address]
      );
    } catch (err) {
      console.error('AuditLogger error: Failed to log action', err);
      // We don't throw here to avoid failing the main request if logging fails
    }
  }

  /**
   * Middleware to extract IP and inject an audit logger into the request object.
   * Allows calling req.auditLog({ action: '...', entity_type: '...', ... })
   */
  static middleware() {
    return (req, res, next) => {
      req.auditLog = async ({ action, entity_type, entity_id, details }) => {
        const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const user_id = req.user ? req.user.id : null;
        await AuditLogger.log({ user_id, action, entity_type, entity_id, details, ip_address });
      };
      next();
    };
  }
}

module.exports = AuditLogger;
