const DocumentModel = require('../models/documentModel');
const VersionModel = require('../models/versionModel');
const ApprovalModel = require('../models/approvalModel');
const AuditLogger = require('../services/auditLogger');
const ShareModel = require('../models/shareModel');
const { getStorageService } = require('../services/storage/StorageService');

const storageService = getStorageService();

class VersionController {
  /**
   * GET /api/documents/:id/versions
   * Returns all versions for a document:
   *   - current version (from documents table)
   *   - previous versions (from document_versions table)
   */
  static async list(req, res) {
    try {
      const { id } = req.params;
      const doc = await DocumentModel.findById(id);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }

      const previousVersions = await VersionModel.findByDocument(id);

      // Build unified timeline: current version first, then history descending
      const currentEntry = {
        id: null, // not a history record
        document_id: doc.id,
        version_number: doc.current_version,
        storage_key: doc.storage_key,
        original_filename: doc.original_filename,
        mime_type: doc.mime_type,
        file_size: doc.file_size,
        uploaded_by: doc.owner_id,
        first_name: doc.owner_first_name,
        last_name: doc.owner_last_name,
        email: doc.owner_email,
        change_notes: '(current)',
        created_at: doc.updated_at,
        is_current: true,
      };

      return res.status(200).json({
        success: true,
        document: {
          id: doc.id,
          title: doc.title,
          current_version: doc.current_version,
          approval_status: doc.approval_status,
        },
        versions: [currentEntry, ...previousVersions.map(v => ({ ...v, is_current: false }))],
      });
    } catch (err) {
      console.error('List versions error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve version history.' });
    }
  }

  /**
   * POST /api/documents/:id/versions
   * Upload a new version of an existing document.
   * - Archives current file to document_versions
   * - Replaces document record with new file data
   * - Cancels any pending approval requests
   */
  static async upload(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;
      const changeNotes = (req.body.change_notes || '').trim();

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file provided for the new version.' });
      }

      const doc = await DocumentModel.findById(id);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }

      // Permission: Owner, MANAGER, ADMIN, or Shared with EDIT
      const isOwner = doc.owner_id === user.id;
      const isAdminOrManager = ['ADMIN', 'MANAGER'].includes((user.role || '').toUpperCase());
      
      let hasEditShare = false;
      if (!isOwner && !isAdminOrManager) {
        const share = await ShareModel.findUserShare(id, user.id);
        if (share && share.permission === 'EDIT') {
          hasEditShare = true;
        }
      }

      if (!isOwner && !isAdminOrManager && !hasEditShare) {
        return res.status(403).json({
          success: false,
          message: 'Only the document owner, a Manager, an Admin, or a user with Edit access can upload a new version.',
        });
      }

      // 1. Archive current version to history
      await VersionModel.create({
        document_id: doc.id,
        version_number: doc.current_version,
        storage_key: doc.storage_key,
        original_filename: doc.original_filename,
        mime_type: doc.mime_type,
        file_size: doc.file_size,
        uploaded_by: doc.owner_id,
        change_notes: changeNotes || `Replaced by version ${doc.current_version + 1}`,
      });

      // 2. Upload new file to storage
      const safeFilename = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newStorageKey = `documents/${uniqueSuffix}_${safeFilename}`;
      await storageService.uploadFile(req.file.buffer, newStorageKey, req.file.mimetype);

      // 3. Update document record with new file + increment version + reset approval
      const newVersion = doc.current_version + 1;
      const updatedDoc = await DocumentModel.uploadNewVersion(id, {
        storage_key: newStorageKey,
        original_filename: req.file.originalname,
        mime_type: req.file.mimetype,
        file_size: req.file.size,
        current_version: newVersion,
        uploaded_by: user.id,
      });

      // 4. Cancel any pending approval requests (auto-reject with note)
      await ApprovalModel.cancelPendingForDocument(doc.id, user.id);

      await AuditLogger.log({
        user_id: user.id,
        action: 'VERSION_UPLOAD',
        entity_type: 'DOCUMENT',
        entity_id: doc.id,
        details: {
          document_title: doc.title,
          old_version: doc.current_version,
          new_version: newVersion,
          change_notes: changeNotes,
        },
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      });

      return res.status(201).json({
        success: true,
        message: `Version ${newVersion} of "${doc.title}" uploaded successfully. Approval status reset to DRAFT.`,
        document: updatedDoc,
        new_version: newVersion,
      });
    } catch (err) {
      console.error('Upload version error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to upload new version.' });
    }
  }

  /**
   * GET /api/documents/:id/versions/:versionId/view
   * Stream a historical version inline.
   */
  static async viewVersion(req, res) {
    try {
      const { id, versionId } = req.params;
      const version = await VersionModel.findByDocumentAndVersion(id, versionId);
      if (!version) {
        return res.status(404).json({ success: false, message: 'Version not found.' });
      }

      const exists = await storageService.fileExists(version.storage_key);
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Version file no longer exists in storage.' });
      }

      res.setHeader('Content-Type', version.mime_type);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(version.original_filename)}"`);
      const stream = await storageService.getFileStream(version.storage_key);
      stream.pipe(res);
    } catch (err) {
      console.error('View version error:', err);
      return res.status(500).json({ success: false, message: 'Failed to stream version.' });
    }
  }

  /**
   * GET /api/documents/:id/versions/:versionId/download
   * Download a historical version as an attachment.
   */
  static async downloadVersion(req, res) {
    try {
      const { id, versionId } = req.params;
      const version = await VersionModel.findByDocumentAndVersion(id, versionId);
      if (!version) {
        return res.status(404).json({ success: false, message: 'Version not found.' });
      }

      const exists = await storageService.fileExists(version.storage_key);
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Version file no longer exists in storage.' });
      }

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(version.original_filename)}"`);
      const stream = await storageService.getFileStream(version.storage_key);
      stream.pipe(res);
    } catch (err) {
      console.error('Download version error:', err);
      return res.status(500).json({ success: false, message: 'Failed to download version.' });
    }
  }
}

module.exports = VersionController;
