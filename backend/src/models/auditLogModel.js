const db = require('../config/db');

class AuditLogModel {
  /**
   * Search and filter audit logs with pagination (Admin only).
   */
  static async search({
    action = '',
    entityType = '',
    userId = null,
    dateFrom = null,
    dateTo = null,
    page = 1,
    limit = 50,
  } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (action) {
      conditions.push(`al.action = $${idx++}`);
      params.push(action);
    }
    if (entityType) {
      conditions.push(`al.entity_type = $${idx++}`);
      params.push(entityType);
    }
    if (userId) {
      conditions.push(`al.user_id = $${idx++}`);
      params.push(parseInt(userId, 10));
    }
    if (dateFrom) {
      conditions.push(`al.created_at >= $${idx++}`);
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push(`al.created_at <= $${idx++}`);
      params.push(dateTo);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 50, 100));
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const offset = (safePage - 1) * safeLimit;

    const countQuery = `SELECT COUNT(*) AS total FROM audit_logs al ${where}`;
    const dataQuery = `
      SELECT al.*, 
             u.first_name, u.last_name, u.email, u.role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${where}
      ORDER BY al.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1};
    `;

    params.push(safeLimit, offset);

    const [countRes, dataRes] = await Promise.all([
      db.query(countQuery, params.slice(0, idx - 1)),
      db.query(dataQuery, params),
    ]);

    return {
      rows: dataRes.rows,
      total: parseInt(countRes.rows[0].total, 10),
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(parseInt(countRes.rows[0].total, 10) / safeLimit),
    };
  }

  /**
   * Get recent activity for a specific user (for dashboard).
   * E.g. recently viewed, recently uploaded.
   */
  static async getRecentUserActivity(userId, actionTypes = [], limit = 10) {
    let actionFilter = '';
    const params = [parseInt(userId, 10), parseInt(limit, 10)];
    
    if (actionTypes.length > 0) {
      const placeholders = actionTypes.map((_, i) => `$${i + 3}`).join(', ');
      actionFilter = `AND al.action IN (${placeholders})`;
      params.push(...actionTypes);
    }

    const query = `
      SELECT al.*,
             d.title as document_title, d.original_filename, d.mime_type
      FROM audit_logs al
      LEFT JOIN documents d ON al.entity_type = 'DOCUMENT' AND al.entity_id = d.id
      WHERE al.user_id = $1 ${actionFilter}
      ORDER BY al.created_at DESC
      LIMIT $2;
    `;

    const res = await db.query(query, params);
    return res.rows;
  }
}

module.exports = AuditLogModel;
