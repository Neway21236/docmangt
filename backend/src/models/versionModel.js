const db = require('../config/db');

class VersionModel {
  /**
   * Save a previous version to the history table when a new file is uploaded.
   * @param {object} params
   * @param {number} params.document_id
   * @param {number} params.version_number   - The version number being archived (e.g. 1 when uploading v2)
   * @param {string} params.storage_key      - Storage key of the OLD file
   * @param {string} params.original_filename
   * @param {string} params.mime_type
   * @param {number} params.file_size
   * @param {number} params.uploaded_by      - User ID who originally uploaded this version
   * @param {string} [params.change_notes]   - Notes for the NEW version being uploaded
   */
  static async create({
    document_id,
    version_number,
    storage_key,
    original_filename,
    mime_type,
    file_size,
    uploaded_by,
    change_notes = '',
  }) {
    const res = await db.query(
      `INSERT INTO document_versions
         (document_id, version_number, storage_key, original_filename, mime_type, file_size, uploaded_by, change_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [document_id, version_number, storage_key, original_filename, mime_type, file_size, uploaded_by, change_notes]
    );
    return res.rows[0];
  }

  /**
   * List all historical versions for a document (excludes current — current is in documents table).
   */
  static async findByDocument(documentId) {
    const res = await db.query(
      `SELECT dv.*, u.first_name, u.last_name, u.email, u.role
       FROM document_versions dv
       LEFT JOIN users u ON dv.uploaded_by = u.id
       WHERE dv.document_id = $1
       ORDER BY dv.version_number DESC;`,
      [parseInt(documentId, 10)]
    );
    return res.rows;
  }

  /**
   * Get a specific historical version by version number.
   */
  static async findByDocumentAndVersion(documentId, versionNumber) {
    const res = await db.query(
      `SELECT dv.*, u.first_name, u.last_name, u.email
       FROM document_versions dv
       LEFT JOIN users u ON dv.uploaded_by = u.id
       WHERE dv.document_id = $1 AND dv.version_number = $2;`,
      [parseInt(documentId, 10), parseInt(versionNumber, 10)]
    );
    return res.rows[0] || null;
  }

  /**
   * Delete all version history for a document (called when document is deleted).
   */
  static async deleteByDocument(documentId) {
    const res = await db.query(
      `DELETE FROM document_versions WHERE document_id = $1 RETURNING storage_key;`,
      [parseInt(documentId, 10)]
    );
    return res.rows; // array of { storage_key } for cleanup
  }
}

module.exports = VersionModel;
