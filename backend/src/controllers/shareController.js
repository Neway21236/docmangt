const DocumentModel = require('../models/documentModel');
const ShareModel = require('../models/shareModel');
const UserModel = require('../models/userModel');
const AuditLogger = require('../services/auditLogger');
const NotificationService = require('../services/notificationService');

class ShareController {
  /**
   * GET /api/documents/:id/shares
   * List all shares for a document (owner, manager, admin).
   */
  static async list(req, res) {
    try {
      const doc = await DocumentModel.findById(req.params.id);
      if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

      const isOwner = doc.owner_id === req.user.id;
      const isAdmin = (req.user.role || '').toUpperCase() === 'ADMIN';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Access forbidden: Only the document owner or an Administrator can view shares.' });
      }

      const shares = await ShareModel.findByDocument(req.params.id);
      return res.json({ success: true, shares });
    } catch (err) {
      console.error('Share list error:', err);
      return res.status(500).json({ success: false, message: 'Failed to list shares.' });
    }
  }

  /**
   * POST /api/documents/:id/shares
   * Share a document with a user.
   * Body: { user_id, permission }  (permission: 'VIEW' | 'EDIT')
   */
  static async share(req, res) {
    try {
      const { id } = req.params;
      const { user_id, permission = 'VIEW' } = req.body;
      const actor = req.user;

      if (!user_id) return res.status(400).json({ success: false, message: 'user_id is required.' });
      if (!['VIEW', 'EDIT'].includes(permission))
        return res.status(400).json({ success: false, message: 'permission must be VIEW or EDIT.' });

      const doc = await DocumentModel.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

      const isOwner = doc.owner_id === actor.id;
      const isAdmin = (actor.role || '').toUpperCase() === 'ADMIN';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Access forbidden: Only the document owner or an Administrator can share this document.' });
      }

      // Can't share with yourself
      if (parseInt(user_id, 10) === actor.id)
        return res.status(400).json({ success: false, message: 'You cannot share a document with yourself.' });

      // Verify target user exists
      const targetUser = await UserModel.findById(user_id);
      if (!targetUser) return res.status(404).json({ success: false, message: 'Target user not found.' });

      const share = await ShareModel.share({
        document_id: id,
        user_id,
        permission,
        shared_by: actor.id,
      });

      await AuditLogger.log({
        user_id: actor.id,
        action: 'SHARE',
        entity_type: 'DOCUMENT',
        entity_id: parseInt(id, 10),
        details: {
          shared_with_user_id: parseInt(user_id, 10),
          shared_with_email: targetUser.email,
          permission,
          document_title: doc.title,
        },
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      });

      // Notify Target User
      await NotificationService.send({
        user_id: user_id,
        title: 'Document Shared With You',
        message: `${actor.first_name} ${actor.last_name} shared "${doc.title}" with you (${permission} access).`,
        type: 'DOCUMENT_SHARED',
        email: targetUser.email,
        link: `/documents?search=${encodeURIComponent(doc.title)}`,
      });

      return res.status(201).json({
        success: true,
        message: `Document shared with ${targetUser.first_name} ${targetUser.last_name} (${permission}).`,
        share,
      });
    } catch (err) {
      console.error('Share error:', err);
      return res.status(500).json({ success: false, message: 'Failed to share document.' });
    }
  }

  /**
   * DELETE /api/documents/:id/shares/:userId
   * Remove a user's access to a document.
   */
  static async unshare(req, res) {
    try {
      const { id, userId } = req.params;
      const actor = req.user;

      const doc = await DocumentModel.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

      const isOwner = doc.owner_id === actor.id;
      const isAdmin = (actor.role || '').toUpperCase() === 'ADMIN';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Access forbidden: Only the document owner or an Administrator can modify shares.' });
      }

      const removed = await ShareModel.unshare({ document_id: id, user_id: userId });
      if (!removed)
        return res.status(404).json({ success: false, message: 'This user does not have access to this document.' });

      await AuditLogger.log({
        user_id: actor.id,
        action: 'UNSHARE',
        entity_type: 'DOCUMENT',
        entity_id: parseInt(id, 10),
        details: { removed_user_id: parseInt(userId, 10), document_title: doc.title },
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      });

      return res.json({ success: true, message: 'Access removed successfully.' });
    } catch (err) {
      console.error('Unshare error:', err);
      return res.status(500).json({ success: false, message: 'Failed to remove access.' });
    }
  }
}

module.exports = ShareController;
