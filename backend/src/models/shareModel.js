const db = require('../config/db');

class ShareModel {
  /**
   * Share a document with a user (or update existing permission).
   */
  static async share({ document_id, user_id, permission, shared_by }) {
    const res = await db.query(
      `INSERT INTO document_shares (document_id, user_id, permission, shared_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (document_id, user_id)
       DO UPDATE SET permission = EXCLUDED.permission, shared_by = EXCLUDED.shared_by
       RETURNING *;`,
      [parseInt(document_id, 10), parseInt(user_id, 10), permission, shared_by]
    );
    return res.rows[0];
  }

  /**
   * Remove a share from a document for a specific user.
   */
  static async unshare({ document_id, user_id }) {
    const res = await db.query(
      `DELETE FROM document_shares WHERE document_id = $1 AND user_id = $2 RETURNING *;`,
      [parseInt(document_id, 10), parseInt(user_id, 10)]
    );
    return res.rows[0] || null;
  }

  /**
   * Get all shares for a document (with user details).
   */
  static async findByDocument(document_id) {
    const res = await db.query(
      `SELECT ds.*, 
              u.first_name, u.last_name, u.email, u.role,
              sb.first_name AS shared_by_first, sb.last_name AS shared_by_last
       FROM document_shares ds
       JOIN users u ON ds.user_id = u.id
       LEFT JOIN users sb ON ds.shared_by = sb.id
       WHERE ds.document_id = $1
       ORDER BY ds.created_at DESC;`,
      [parseInt(document_id, 10)]
    );
    return res.rows;
  }

  /**
   * Check if a user has access to a document via sharing.
   */
  static async findUserShare(document_id, user_id) {
    const res = await db.query(
      `SELECT * FROM document_shares WHERE document_id = $1 AND user_id = $2;`,
      [parseInt(document_id, 10), parseInt(user_id, 10)]
    );
    return res.rows[0] || null;
  }
}

module.exports = ShareModel;
