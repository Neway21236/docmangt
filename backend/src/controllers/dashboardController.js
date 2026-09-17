const DashboardModel = require('../models/dashboardModel');

class DashboardController {
  static async getStats(req, res) {
    try {
      const stats = await DashboardModel.getStatistics(req.user.id, req.user.role);
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ success: false, message: 'Failed to load dashboard statistics' });
    }
  }
}

module.exports = DashboardController;
