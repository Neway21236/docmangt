const db = require('../config/db');

class UserModel {
  static async findByEmail(email) {
    const res = await db.query(
      `SELECT id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at
       FROM users
       WHERE LOWER(email) = LOWER($1);`,
      [email]
    );
    return res.rows[0] || null;
  }

  static async findById(id) {
    const res = await db.query(
      `SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at
       FROM users
       WHERE id = $1;`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async create({ email, password_hash, first_name, last_name, role = 'VIEWER' }) {
    const res = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES (LOWER($1), $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, role, is_active, created_at, updated_at;`,
      [email, password_hash, first_name, last_name, role]
    );
    return res.rows[0];
  }

  static async findAll() {
    const res = await db.query(
      `SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at
       FROM users
       ORDER BY id ASC;`
    );
    return res.rows;
  }

  static async updateRole(id, role) {
    const res = await db.query(
      `UPDATE users
       SET role = $1
       WHERE id = $2
       RETURNING id, email, first_name, last_name, role, is_active, updated_at;`,
      [role, id]
    );
    return res.rows[0] || null;
  }
}

module.exports = UserModel;
