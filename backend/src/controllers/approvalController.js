const DocumentModel = require('../models/documentModel');
const ApprovalModel = require('../models/approvalModel');
const AuditLogger = require('../services/auditLogger');
const NotificationService = require('../services/notificationService');
const db = require('../config/db');

class ApprovalController {
  /**
   * POST /api/approvals/:docId/submit
   * Submit a document for approval (MANAGER or ADMIN).
   * - Document must be in DRAFT or REJECTED state (not already PENDING/APPROVED)
   */
  static async submit(req, res) {
    try {
      const { docId } = req.params;
      const { submission_note = '' } = req.body;
      const user = req.user;

      const doc = await DocumentModel.findById(docId);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }

      if (doc.approval_status === 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'This document is already pending approval. Wait for review before resubmitting.',
        });
      }

      if (doc.approval_status === 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'This document is already approved. Upload a new version to start a fresh approval cycle.',
        });
      }

      // Create approval request
      const request = await ApprovalModel.create({
        document_id: doc.id,
        version_number: doc.current_version,
        requested_by: user.id,
        submission_note: submission_note.trim(),
      });

      // Update document approval_status to PENDING
      await db.query(`UPDATE documents SET approval_status = 'PENDING' WHERE id = $1;`, [doc.id]);

      await AuditLogger.log({
        user_id: user.id,
        action: 'APPROVAL_SUBMIT',
        entity_type: 'DOCUMENT',
        entity_id: doc.id,
        details: { document_title: doc.title, version: doc.current_version, submission_note },
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      });

      // Notify Admins
      const adminsRes = await db.query(`SELECT id, email FROM users WHERE role = 'ADMIN'`);
      for (const admin of adminsRes.rows) {
        await NotificationService.send({
          user_id: admin.id,
          title: 'New Approval Request',
          message: `${user.first_name} ${user.last_name} submitted "${doc.title}" for approval.`,
          type: 'APPROVAL_REQUEST',
          email: admin.email,
          link: `/admin`,
        });
      }

      return res.status(201).json({
        success: true,
        message: `"${doc.title}" (v${doc.current_version}) submitted for approval.`,
        approval_request: request,
      });
    } catch (err) {
      console.error('Submit for approval error:', err);
      return res.status(500).json({ success: false, message: 'Failed to submit document for approval.' });
    }
  }

  /**
   * POST /api/approvals/:requestId/review
   * Approve or reject a pending approval request (ADMIN only).
   */
  static async review(req, res) {
    try {
      const { requestId } = req.params;
      const { decision, review_comment = '' } = req.body;
      const user = req.user;

      if (!['APPROVED', 'REJECTED'].includes((decision || '').toUpperCase())) {
        return res.status(400).json({ success: false, message: 'Decision must be APPROVED or REJECTED.' });
      }

      const status = decision.toUpperCase();

      // Get the request
      const reqRes = await db.query(
        `SELECT ar.*, d.title AS document_title, d.id AS doc_id
         FROM approval_requests ar
         JOIN documents d ON ar.document_id = d.id
         WHERE ar.id = $1;`,
        [parseInt(requestId, 10)]
      );
      const approvalReq = reqRes.rows[0];

      if (!approvalReq) {
        return res.status(404).json({ success: false, message: 'Approval request not found.' });
      }

      if (approvalReq.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: `This request was already ${approvalReq.status.toLowerCase()}. It cannot be reviewed again.`,
        });
      }

      // Update approval request
      const updated = await ApprovalModel.review(requestId, {
        reviewed_by: user.id,
        status,
        review_comment: review_comment.trim(),
      });

      // Update document approval_status
      await db.query(`UPDATE documents SET approval_status = $1 WHERE id = $2;`, [status, approvalReq.doc_id]);

      await AuditLogger.log({
        user_id: user.id,
        action: 'APPROVAL_REVIEW',
        entity_type: 'APPROVAL',
        entity_id: parseInt(requestId, 10),
        details: { document_title: approvalReq.document_title, decision: status, review_comment },
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      });

      // Notify Requester
      const requesterRes = await db.query(`SELECT email FROM users WHERE id = $1`, [approvalReq.requested_by]);
      if (requesterRes.rows.length > 0) {
        await NotificationService.send({
          user_id: approvalReq.requested_by,
          title: `Document ${status}`,
          message: `Your document "${approvalReq.document_title}" was ${status.toLowerCase()} by ${user.first_name} ${user.last_name}.\nComment: ${review_comment}`,
          type: 'APPROVAL_DECISION',
          email: requesterRes.rows[0].email,
          link: `/documents?search=${encodeURIComponent(approvalReq.document_title)}`,
        });
      }

      return res.status(200).json({
        success: true,
        message: `"${approvalReq.document_title}" has been ${status.toLowerCase()}.`,
        approval_request: updated,
      });
    } catch (err) {
      console.error('Review approval error:', err);
      return res.status(500).json({ success: false, message: 'Failed to process approval decision.' });
    }
  }

  /**
   * GET /api/approvals/pending
   * List all documents currently pending approval (ADMIN only).
   */
  static async getPending(req, res) {
    try {
      const pending = await ApprovalModel.findPending();
      return res.status(200).json({
        success: true,
        count: pending.length,
        approvals: pending,
      });
    } catch (err) {
      console.error('Get pending approvals error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve pending approvals.' });
    }
  }

  /**
   * GET /api/approvals/document/:docId
   * Get the complete approval history for a document (all authenticated users).
   */
  static async getDocumentHistory(req, res) {
    try {
      const { docId } = req.params;

      const doc = await DocumentModel.findById(docId);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }

      const history = await ApprovalModel.findByDocument(docId);

      return res.status(200).json({
        success: true,
        document: {
          id: doc.id,
          title: doc.title,
          approval_status: doc.approval_status,
          current_version: doc.current_version,
        },
        history,
      });
    } catch (err) {
      console.error('Get approval history error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve approval history.' });
    }
  }

  /**
   * GET /api/approvals/stats
   * Quick stats for admin dashboard (ADMIN only).
   */
  static async getStats(req, res) {
    try {
      const result = await db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'PENDING')  AS pending,
          COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved,
          COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected,
          COUNT(*) AS total
        FROM approval_requests;
      `);
      const docStats = await db.query(`
        SELECT
          COUNT(*) FILTER (WHERE approval_status = 'DRAFT')   AS draft,
          COUNT(*) FILTER (WHERE approval_status = 'PENDING')  AS pending,
          COUNT(*) FILTER (WHERE approval_status = 'APPROVED') AS approved,
          COUNT(*) FILTER (WHERE approval_status = 'REJECTED') AS rejected
        FROM documents;
      `);
      return res.status(200).json({
        success: true,
        approval_requests: result.rows[0],
        documents: docStats.rows[0],
      });
    } catch (err) {
      console.error('Get approval stats error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve approval stats.' });
    }
  }
}

module.exports = ApprovalController;
