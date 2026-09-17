const NotificationModel = require('../models/notificationModel');

class NotificationController {
  static async getNotifications(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const notifications = await NotificationModel.getByUserId(req.user.id, limit);
      const unreadCount = await NotificationModel.getUnreadCount(req.user.id);
      
      res.json({ success: true, notifications, unreadCount });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
  }

  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const notif = await NotificationModel.markAsRead(id, req.user.id);
      if (!notif) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
      res.json({ success: true, notification: notif });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
    }
  }

  static async markAllAsRead(req, res) {
    try {
      const count = await NotificationModel.markAllAsRead(req.user.id);
      res.json({ success: true, count, message: `${count} notifications marked as read` });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ success: false, message: 'Failed to mark all as read' });
    }
  }
}

module.exports = NotificationController;
