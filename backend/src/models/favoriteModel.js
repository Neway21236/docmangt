const db = require('../config/db');

class FavoriteModel {
  /**
   * Toggle a document favorite for a user.
   * Returns { added: true } or { added: false } depending on what happened.
   */
  static async toggle(user_id, document_id) {
    const existing = await db.query(
      `SELECT id FROM user_favorites WHERE user_id = $1 AND document_id = $2;`,
      [user_id, parseInt(document_id, 10)]
    );
    if (existing.rows.length > 0) {
      await db.query(`DELETE FROM user_favorites WHERE user_id = $1 AND document_id = $2;`,
        [user_id, parseInt(document_id, 10)]);
      return { added: false };
    } else {
      await db.query(
        `INSERT INTO user_favorites (user_id, document_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
        [user_id, parseInt(document_id, 10)]
      );
      return { added: true };
    }
  }

  /**
   * Get all favorited documents for a user (with document metadata).
   */
  static async findByUser(user_id) {
    const res = await db.query(
      `SELECT uf.created_at AS favorited_at,
              d.id, d.title, d.original_filename, d.mime_type, d.file_size,
              d.folder_id, d.owner_id, d.created_at, d.updated_at,
              d.current_version, d.approval_status,
              u.first_name AS owner_first_name, u.last_name AS owner_last_name,
              u.email AS owner_email, u.role AS owner_role,
              f.name AS folder_name
       FROM user_favorites uf
       JOIN documents d ON uf.document_id = d.id
       LEFT JOIN users u ON d.owner_id = u.id
       LEFT JOIN folders f ON d.folder_id = f.id
       WHERE uf.user_id = $1
       ORDER BY uf.created_at DESC;`,
      [user_id]
    );
    return res.rows;
  }

  /**
   * Get set of document IDs that a user has favorited (for marking in lists).
   */
  static async getUserFavoriteIds(user_id) {
    const res = await db.query(
      `SELECT document_id FROM user_favorites WHERE user_id = $1;`,
      [user_id]
    );
    return new Set(res.rows.map(r => r.document_id));
  }
}

module.exports = FavoriteModel;
