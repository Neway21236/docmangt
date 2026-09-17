const db = require('../config/db');

class NotificationModel {
  static async create({ user_id, title, message, type, link = null }) {
    const result = await db.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, title, message, type, link]
    );
    return result.rows[0];
  }

  static async getByUserId(user_id, limit = 50) {
    const result = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [user_id, limit]
    );
    return result.rows;
  }

  static async getUnreadCount(user_id) {
    const result = await db.query(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
      [user_id]
    );
    return parseInt(result.rows[0].count, 10);
  }

  static async markAsRead(id, user_id) {
    const result = await db.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, user_id]
    );
    return result.rows[0];
  }

  static async markAllAsRead(user_id) {
    const result = await db.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = $1 AND is_read = false
       RETURNING *`,
      [user_id]
    );
    return result.rowCount;
  }
}

module.exports = NotificationModel;
