const db = require('../config/db');

class FolderModel {
  static async create({ name, parent_id = null, owner_id }) {
    const res = await db.query(
      `INSERT INTO folders (name, parent_id, owner_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, parent_id, owner_id, created_at, updated_at;`,
      [name.trim(), parent_id ? parseInt(parent_id, 10) : null, owner_id]
    );
    return res.rows[0];
  }

  static async findById(id) {
    const res = await db.query(
      `SELECT f.id, f.name, f.parent_id, f.owner_id, f.created_at, f.updated_at,
              u.first_name, u.last_name, u.email as owner_email
       FROM folders f
       LEFT JOIN users u ON f.owner_id = u.id
       WHERE f.id = $1;`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async findByParent(parentId = null) {
    let query;
    let params;

    if (parentId) {
      query = `
        SELECT f.id, f.name, f.parent_id, f.owner_id, f.created_at, f.updated_at,
               u.first_name, u.last_name, u.email as owner_email,
               (SELECT COUNT(*)::int FROM folders c WHERE c.parent_id = f.id) as subfolder_count,
               (SELECT COUNT(*)::int FROM documents d WHERE d.folder_id = f.id) as document_count
        FROM folders f
        LEFT JOIN users u ON f.owner_id = u.id
        WHERE f.parent_id = $1
        ORDER BY f.name ASC;
      `;
      params = [parseInt(parentId, 10)];
    } else {
      query = `
        SELECT f.id, f.name, f.parent_id, f.owner_id, f.created_at, f.updated_at,
               u.first_name, u.last_name, u.email as owner_email,
               (SELECT COUNT(*)::int FROM folders c WHERE c.parent_id = f.id) as subfolder_count,
               (SELECT COUNT(*)::int FROM documents d WHERE d.folder_id = f.id) as document_count
        FROM folders f
        LEFT JOIN users u ON f.owner_id = u.id
        WHERE f.parent_id IS NULL
        ORDER BY f.name ASC;
      `;
      params = [];
    }

    const res = await db.query(query, params);
    return res.rows;
  }

  static async getAll() {
    const res = await db.query(
      `SELECT id, name, parent_id
       FROM folders
       ORDER BY name ASC;`
    );
    return res.rows;
  }

  /**
   * Returns ordered breadcrumb trail from root to the specified folder
   * e.g. [{id: 1, name: 'Documents'}, {id: 4, name: 'Finance'}, {id: 7, name: '2026'}]
   */
  static async getBreadcrumbs(folderId) {
    if (!folderId) return [];

    const query = `
      WITH RECURSIVE folder_path AS (
        SELECT id, name, parent_id, 1 as depth
        FROM folders
        WHERE id = $1

        UNION ALL

        SELECT f.id, f.name, f.parent_id, fp.depth + 1
        FROM folders f
        JOIN folder_path fp ON f.id = fp.parent_id
      )
      SELECT id, name, parent_id
      FROM folder_path
      ORDER BY depth DESC;
    `;

    const res = await db.query(query, [parseInt(folderId, 10)]);
    return res.rows;
  }

  static async update(id, { name, parent_id }) {
    const updates = [];
    const params = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      params.push(name.trim());
    }

    if (parent_id !== undefined) {
      updates.push(`parent_id = $${idx++}`);
      params.push(parent_id ? parseInt(parent_id, 10) : null);
    }

    if (updates.length === 0) return this.findById(id);

    params.push(parseInt(id, 10));
    const query = `
      UPDATE folders
      SET ${updates.join(', ')}
      WHERE id = $${idx}
      RETURNING id, name, parent_id, owner_id, created_at, updated_at;
    `;

    const res = await db.query(query, params);
    return res.rows[0] || null;
  }

  /**
   * Check if candidateDescendantId is a descendant of folderId (to prevent cycles)
   */
  static async isDescendant(folderId, candidateDescendantId) {
    if (!folderId || !candidateDescendantId) return false;
    if (parseInt(folderId, 10) === parseInt(candidateDescendantId, 10)) return true;

    const query = `
      WITH RECURSIVE subtree AS (
        SELECT id, parent_id
        FROM folders
        WHERE parent_id = $1

        UNION ALL

        SELECT f.id, f.parent_id
        FROM folders f
        JOIN subtree s ON f.parent_id = s.id
      )
      SELECT 1 FROM subtree WHERE id = $2;
    `;

    const res = await db.query(query, [parseInt(folderId, 10), parseInt(candidateDescendantId, 10)]);
    return res.rowCount > 0;
  }

  static async delete(id) {
    const res = await db.query(`DELETE FROM folders WHERE id = $1 RETURNING id;`, [parseInt(id, 10)]);
    return res.rowCount > 0;
  }
}

module.exports = FolderModel;
