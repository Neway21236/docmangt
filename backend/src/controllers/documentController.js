const path = require('path');
const DocumentModel = require('../models/documentModel');
const FolderModel = require('../models/folderModel');
const ShareModel = require('../models/shareModel');
const VersionModel = require('../models/versionModel');
const { getStorageService } = require('../services/storage/StorageService');
const AuditLogger = require('../services/auditLogger');
const db = require('../config/db');

const storageService = getStorageService();

class DocumentController {
  static async list(req, res) {
    try {
      const folderId = req.query.folderId ? parseInt(req.query.folderId, 10) : null;
      const documents = await DocumentModel.findByFolder(folderId);

      return res.status(200).json({
        success: true,
        documents,
      });
    } catch (err) {
      console.error('List documents error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve documents.',
      });
    }
  }

  static async search(req, res) {
    try {
      const {
        q = '',
        mimeCategory = '',
        ownerId = null,
        dateFrom = null,
        dateTo = null,
        folderId,          // undefined = all, 'null' = root, number = specific
        sortBy = 'created_at',
        sortDir = 'DESC',
        page = 1,
        limit = 20,
      } = req.query;

      // Parse folderId: 'null' string -> null, absent -> undefined (all folders)
      let parsedFolderId;
      if (folderId === undefined || folderId === '') {
        parsedFolderId = undefined; // no folder constraint → search all
      } else if (folderId === 'null') {
        parsedFolderId = null;      // root only
      } else {
        parsedFolderId = parseInt(folderId, 10);
      }

      const result = await DocumentModel.search({
        query: q,
        mimeCategory,
        ownerId: ownerId ? parseInt(ownerId, 10) : null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        folderId: parsedFolderId,
        sortBy,
        sortDir,
        page: parseInt(page, 10) || 1,
        limit: Math.min(100, parseInt(limit, 10) || 20),
      });

      return res.status(200).json({
        success: true,
        documents: result.rows,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      console.error('Search documents error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to execute document search.',
      });
    }
  }

  static async getOwners(req, res) {
    try {
      const result = await db.query(
        `SELECT DISTINCT u.id, u.first_name, u.last_name, u.email, u.role
         FROM documents d
         JOIN users u ON d.owner_id = u.id
         ORDER BY u.last_name, u.first_name;`
      );
      return res.status(200).json({
        success: true,
        owners: result.rows,
      });
    } catch (err) {
      console.error('Get document owners error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve document owners.',
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const doc = await DocumentModel.findById(id);

      if (!doc) {
        return res.status(404).json({
          success: false,
          message: 'Document not found.',
        });
      }

      return res.status(200).json({
        success: true,
        document: doc,
      });
    } catch (err) {
      console.error('Get document error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve document details.',
      });
    }
  }

  static async upload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file was uploaded.',
        });
      }

      const user = req.user;
      const folderId = req.body.folder_id ? parseInt(req.body.folder_id, 10) : null;
      const title = (req.body.title || '').trim() || req.file.originalname;
      const expiresAt = req.body.expires_at || null;

      if (folderId) {
        const folder = await FolderModel.findById(folderId);
        if (!folder) {
          return res.status(404).json({
            success: false,
            message: 'Target folder does not exist.',
          });
        }
      }

      // Generate unique storage key
      const safeFilename = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const storageKey = `documents/${uniqueSuffix}_${safeFilename}`;

      // Upload file via StorageService abstraction
      await storageService.uploadFile(req.file.buffer, storageKey, req.file.mimetype);

      // Create document record in PostgreSQL
      const newDoc = await DocumentModel.create({
        title,
        original_filename: req.file.originalname,
        storage_key: storageKey,
        mime_type: req.file.mimetype,
        file_size: req.file.size,
        folder_id: folderId,
        owner_id: user.id,
        expires_at: expiresAt || null,
      });

      await AuditLogger.log({
        user_id: user.id,
        action: 'UPLOAD',
        entity_type: 'DOCUMENT',
        entity_id: newDoc.id,
        details: { title: newDoc.title, mime_type: newDoc.mime_type, file_size: newDoc.file_size },
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      });

      return res.status(201).json({
        success: true,
        message: `Document "${newDoc.title}" uploaded successfully.`,
        document: newDoc,
      });
    } catch (err) {
      console.error('Upload document error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to process document upload.',
      });
    }
  }

  static async viewInline(req, res) {
    try {
      const { id } = req.params;
      const doc = await DocumentModel.findById(id);

      if (!doc) {
        return res.status(404).json({
          success: false,
          message: 'Document not found.',
        });
      }

      const fileExists = await storageService.fileExists(doc.storage_key);
      if (!fileExists) {
        return res.status(404).json({
          success: false,
          message: 'Document file missing from physical storage.',
        });
      }

      res.setHeader('Content-Type', doc.mime_type);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.original_filename)}"`);

      await AuditLogger.log({
        user_id: req.user ? req.user.id : null,
        action: 'VIEW',
        entity_type: 'DOCUMENT',
        entity_id: doc.id,
        details: { title: doc.title },
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      });

      const stream = await storageService.getFileStream(doc.storage_key);
      stream.pipe(res);
    } catch (err) {
      console.error('View document error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to view document stream.',
      });
    }
  }

  static async download(req, res) {
    try {
      const { id } = req.params;
      const doc = await DocumentModel.findById(id);

      if (!doc) {
        return res.status(404).json({
          success: false,
          message: 'Document not found.',
        });
      }

      const fileExists = await storageService.fileExists(doc.storage_key);
      if (!fileExists) {
        return res.status(404).json({
          success: false,
          message: 'Document file missing from storage.',
        });
      }

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.original_filename)}"`);

      await AuditLogger.log({
        user_id: req.user ? req.user.id : null,
        action: 'DOWNLOAD',
        entity_type: 'DOCUMENT',
        entity_id: doc.id,
        details: { title: doc.title, filename: doc.original_filename },
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      });

      const stream = await storageService.getFileStream(doc.storage_key);
      stream.pipe(res);
    } catch (err) {
      console.error('Download document error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to download document.',
      });
    }
  }

  static async rename(req, res) {
    try {
      const { id } = req.params;
      const { title } = req.body;
      const user = req.user;

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Document title is required.',
        });
      }

      const doc = await DocumentModel.findById(id);
      if (!doc) {
        return res.status(404).json({
          success: false,
          message: 'Document not found.',
        });
      }

      // Permission check: Owner, MANAGER, ADMIN, or Shared with EDIT
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
          message: 'Access forbidden: You do not have permission to rename this document.',
        });
      }

      const updated = await DocumentModel.update(id, { title: title.trim() });

      await AuditLogger.log({
        user_id: user.id,
        action: 'RENAME',
        entity_type: 'DOCUMENT',
        entity_id: parseInt(id, 10),
        details: { old_title: doc.title, new_title: title.trim() },
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      });

      return res.status(200).json({
        success: true,
        message: 'Document title updated successfully.',
        document: updated,
      });
    } catch (err) {
      console.error('Rename document error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to rename document.',
      });
    }
  }

  static async updateMetadata(req, res) {
    try {
      const { id } = req.params;
      const { expires_at } = req.body;
      const user = req.user;

      const doc = await DocumentModel.findById(id);
      if (!doc) {
        return res.status(404).json({
          success: false,
          message: 'Document not found.',
        });
      }

      // Permission check: Owner, MANAGER, ADMIN, or Shared with EDIT
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
          message: 'Access forbidden: You do not have permission to update this document.',
        });
      }

      const updated = await DocumentModel.update(id, { expires_at });

      await AuditLogger.log({
        user_id: user.id,
        action: 'RENAME', // Generic for now, ideally 'UPDATE_METADATA'
        entity_type: 'DOCUMENT',
        entity_id: parseInt(id, 10),
        details: { old_expires_at: doc.expires_at, new_expires_at: expires_at },
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      });

      return res.status(200).json({
        success: true,
        message: 'Document metadata updated successfully.',
        document: updated,
      });
    } catch (err) {
      console.error('Update document metadata error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to update document metadata.',
      });
    }
  }

  static async move(req, res) {
    try {
      const { id } = req.params;
      const { target_folder_id } = req.body;
      const user = req.user;

      const doc = await DocumentModel.findById(id);
      if (!doc) {
        return res.status(404).json({
          success: false,
          message: 'Document not found.',
        });
      }

      // Permission check: Owner, MANAGER, ADMIN, or Shared with EDIT
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
          message: 'Access forbidden: You do not have permission to move this document.',
        });
      }

      const newFolderId = target_folder_id ? parseInt(target_folder_id, 10) : null;
      if (newFolderId) {
        const folder = await FolderModel.findById(newFolderId);
        if (!folder) {
          return res.status(404).json({
            success: false,
            message: 'Target destination folder does not exist.',
          });
        }
      }

      const updated = await DocumentModel.update(id, { folder_id: newFolderId });

      await AuditLogger.log({
        user_id: user.id,
        action: 'MOVE',
        entity_type: 'DOCUMENT',
        entity_id: parseInt(id, 10),
        details: { title: doc.title, from_folder_id: doc.folder_id, to_folder_id: newFolderId },
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      });

      return res.status(200).json({
        success: true,
        message: 'Document moved successfully.',
        document: updated,
      });
    } catch (err) {
      console.error('Move document error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to move document.',
      });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      const doc = await DocumentModel.findById(id);
      if (!doc) {
        return res.status(404).json({
          success: false,
          message: 'Document not found.',
        });
      }

      // Strict deletion rule: Owner or ADMIN only
      const isOwner = doc.owner_id === user.id;
      const isAdmin = (user.role || '').toUpperCase() === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: Only the document owner or an Administrator can delete this document.',
        });
      }

      // Delete historical version files from storage before deleting document
      const historicalVersions = await VersionModel.deleteByDocument(id);
      if (Array.isArray(historicalVersions)) {
        for (const hv of historicalVersions) {
          if (hv.storage_key) {
            try {
              await storageService.deleteFile(hv.storage_key);
            } catch (e) {
              console.warn(`Failed to clean historical storage file ${hv.storage_key}:`, e.message);
            }
          }
        }
      }

      // Delete current file from disk via abstracted storage service
      await storageService.deleteFile(doc.storage_key);

      // Delete database record
      await DocumentModel.delete(id);

      await AuditLogger.log({
        user_id: user.id,
        action: 'DELETE',
        entity_type: 'DOCUMENT',
        entity_id: parseInt(id, 10),
        details: { title: doc.title, mime_type: doc.mime_type },
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      });

      return res.status(200).json({
        success: true,
        message: `Document "${doc.title}" deleted successfully.`,
      });
    } catch (err) {
      console.error('Delete document error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete document.',
      });
    }
  }
}

module.exports = DocumentController;
