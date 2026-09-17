const FolderModel = require('../models/folderModel');

class FolderController {
  static async list(req, res) {
    try {
      const parentId = req.query.parentId ? parseInt(req.query.parentId, 10) : null;

      let currentFolder = null;
      if (parentId) {
        currentFolder = await FolderModel.findById(parentId);
        if (!currentFolder) {
          return res.status(404).json({
            success: false,
            message: 'Folder not found.',
          });
        }
      }

      const folders = await FolderModel.findByParent(parentId);
      const breadcrumbs = parentId ? await FolderModel.getBreadcrumbs(parentId) : [];

      return res.status(200).json({
        success: true,
        currentFolder,
        folders,
        breadcrumbs,
      });
    } catch (err) {
      console.error('List folders error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve folders.',
      });
    }
  }

  static async getAll(req, res) {
    try {
      const allFolders = await FolderModel.getAll();
      return res.status(200).json({
        success: true,
        folders: allFolders,
      });
    } catch (err) {
      console.error('Get all folders error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve folder directory.',
      });
    }
  }

  static async create(req, res) {
    try {
      const { name, parent_id } = req.body;
      const user = req.user;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Folder name is required.',
        });
      }

      if (parent_id) {
        const parent = await FolderModel.findById(parent_id);
        if (!parent) {
          return res.status(404).json({
            success: false,
            message: 'Target parent folder not found.',
          });
        }
      }

      const folder = await FolderModel.create({
        name: name.trim(),
        parent_id: parent_id || null,
        owner_id: user.id,
      });

      return res.status(201).json({
        success: true,
        message: `Folder "${folder.name}" created successfully.`,
        folder,
      });
    } catch (err) {
      console.error('Create folder error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to create folder.',
      });
    }
  }

  static async rename(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const user = req.user;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'New folder name is required.',
        });
      }

      const folder = await FolderModel.findById(id);
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found.',
        });
      }

      // Permission check: Owner, MANAGER, or ADMIN
      const isOwner = folder.owner_id === user.id;
      const isAdminOrManager = ['ADMIN', 'MANAGER'].includes((user.role || '').toUpperCase());

      if (!isOwner && !isAdminOrManager) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: You do not have permission to rename this folder.',
        });
      }

      const updated = await FolderModel.update(id, { name: name.trim() });
      return res.status(200).json({
        success: true,
        message: 'Folder renamed successfully.',
        folder: updated,
      });
    } catch (err) {
      console.error('Rename folder error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to rename folder.',
      });
    }
  }

  static async move(req, res) {
    try {
      const { id } = req.params;
      const { target_parent_id } = req.body;
      const user = req.user;

      const folder = await FolderModel.findById(id);
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found.',
        });
      }

      // Permission check: Owner, MANAGER, or ADMIN
      const isOwner = folder.owner_id === user.id;
      const isAdminOrManager = ['ADMIN', 'MANAGER'].includes((user.role || '').toUpperCase());

      if (!isOwner && !isAdminOrManager) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: You do not have permission to move this folder.',
        });
      }

      const newParentId = target_parent_id ? parseInt(target_parent_id, 10) : null;

      if (newParentId) {
        if (newParentId === folder.id) {
          return res.status(400).json({
            success: false,
            message: 'Cannot move a folder into itself.',
          });
        }

        const isCycle = await FolderModel.isDescendant(folder.id, newParentId);
        if (isCycle) {
          return res.status(400).json({
            success: false,
            message: 'Invalid destination: Cannot move a folder into its own subfolder.',
          });
        }

        const destFolder = await FolderModel.findById(newParentId);
        if (!destFolder) {
          return res.status(404).json({
            success: false,
            message: 'Target destination folder does not exist.',
          });
        }
      }

      const updated = await FolderModel.update(id, { parent_id: newParentId });
      return res.status(200).json({
        success: true,
        message: 'Folder moved successfully.',
        folder: updated,
      });
    } catch (err) {
      console.error('Move folder error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to move folder.',
      });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      const folder = await FolderModel.findById(id);
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found.',
        });
      }

      // Strict deletion rule: Owner or ADMIN only
      const isOwner = folder.owner_id === user.id;
      const isAdmin = (user.role || '').toUpperCase() === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: Only the folder owner or an Administrator can delete this folder.',
        });
      }

      await FolderModel.delete(id);
      return res.status(200).json({
        success: true,
        message: `Folder "${folder.name}" and its sub-contents deleted successfully.`,
      });
    } catch (err) {
      console.error('Delete folder error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete folder.',
      });
    }
  }
}

module.exports = FolderController;
