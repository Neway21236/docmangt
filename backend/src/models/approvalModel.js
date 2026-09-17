const db = require('../config/db');

class ApprovalModel {
  /**
   * Create a new approval request (when document is submitted for review).
   */
  static async create({ document_id, version_number, requested_by, submission_note = '' }) {
    const res = await db.query(
      `INSERT INTO approval_requests (document_id, version_number, requested_by, submission_note)
       VALUES ($1, $2, $3, $4)
       RETURNING *;`,
      [parseInt(document_id, 10), version_number, requested_by, submission_note]
    );
    return res.rows[0];
  }

  /**
   * Update an approval request (approve or reject with comment).
   */
  static async review(id, { reviewed_by, status, review_comment = '' }) {
    const res = await db.query(
      `UPDATE approval_requests
       SET reviewed_by = $1, status = $2, review_comment = $3, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *;`,
      [reviewed_by, status, review_comment, parseInt(id, 10)]
    );
    return res.rows[0] || null;
  }

  /**
   * Get all pending approval requests (for admin review queue).
   */
  static async findPending() {
    const res = await db.query(
      `SELECT ar.*,
              d.title AS document_title, d.original_filename, d.mime_type, d.file_size, d.current_version,
              d.folder_id, f.name AS folder_name,
              requester.first_name AS requester_first_name, requester.last_name AS requester_last_name,
              requester.email AS requester_email, requester.role AS requester_role
       FROM approval_requests ar
       JOIN documents d ON ar.document_id = d.id
       LEFT JOIN folders f ON d.folder_id = f.id
       LEFT JOIN users requester ON ar.requested_by = requester.id
       WHERE ar.status = 'PENDING'
       ORDER BY ar.created_at ASC;`
    );
    return res.rows;
  }

  /**
   * Get all approval history for a specific document.
   */
  static async findByDocument(documentId) {
    const res = await db.query(
      `SELECT ar.*,
              requester.first_name AS requester_first_name, requester.last_name AS requester_last_name,
              requester.email AS requester_email,
              reviewer.first_name AS reviewer_first_name, reviewer.last_name AS reviewer_last_name,
              reviewer.email AS reviewer_email
       FROM approval_requests ar
       LEFT JOIN users requester ON ar.requested_by = requester.id
       LEFT JOIN users reviewer  ON ar.reviewed_by  = reviewer.id
       WHERE ar.document_id = $1
       ORDER BY ar.created_at DESC;`,
      [parseInt(documentId, 10)]
    );
    return res.rows;
  }

  /**
   * Get the most recent active (PENDING) approval request for a document.
   */
  static async findActivePendingByDocument(documentId) {
    const res = await db.query(
      `SELECT * FROM approval_requests
       WHERE document_id = $1 AND status = 'PENDING'
       ORDER BY created_at DESC
       LIMIT 1;`,
      [parseInt(documentId, 10)]
    );
    return res.rows[0] || null;
  }

  /**
   * Cancel/reject all PENDING requests for a document (e.g., when a new version is uploaded).
   */
  static async cancelPendingForDocument(documentId, reviewerId) {
    await db.query(
      `UPDATE approval_requests
       SET status = 'REJECTED', review_comment = 'Automatically cancelled — a new version was uploaded.',
           reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP
       WHERE document_id = $2 AND status = 'PENDING';`,
      [reviewerId, parseInt(documentId, 10)]
    );
  }
}

module.exports = ApprovalModel;
