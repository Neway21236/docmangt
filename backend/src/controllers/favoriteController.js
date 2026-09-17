const FavoriteModel = require('../models/favoriteModel');
const AuditLogger = require('../services/auditLogger');

class FavoriteController {
  /**
   * POST /api/favorites/:documentId
   * Toggle favorite status for the current user.
   */
  static async toggle(req, res) {
    try {
      const { documentId } = req.params;
      const user = req.user;

      const result = await FavoriteModel.toggle(user.id, documentId);

      if (result.added) {
        await AuditLogger.log({
          user_id: user.id,
          action: 'FAVORITE_ADD',
          entity_type: 'DOCUMENT',
          entity_id: parseInt(documentId, 10),
          details: {},
          ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        });
      }

      return res.json({
        success: true,
        favorited: result.added,
        message: result.added ? 'Document added to favorites.' : 'Document removed from favorites.',
      });
    } catch (err) {
      console.error('Favorite toggle error:', err);
      return res.status(500).json({ success: false, message: 'Failed to toggle favorite.' });
    }
  }

  /**
   * GET /api/favorites
   * Get all favorites for the current user.
   */
  static async list(req, res) {
    try {
      const docs = await FavoriteModel.findByUser(req.user.id);
      return res.json({ success: true, favorites: docs });
    } catch (err) {
      console.error('Favorite list error:', err);
      return res.status(500).json({ success: false, message: 'Failed to load favorites.' });
    }
  }
}

module.exports = FavoriteController;
