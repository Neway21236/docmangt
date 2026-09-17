const NotificationModel = require('../models/notificationModel');

class NotificationService {
  /**
   * Dispatches a notification to the database and simulates sending an email.
   * 
   * @param {Object} params
   * @param {number} params.user_id - Target user ID
   * @param {string} params.title - Notification title
   * @param {string} params.message - Notification body
   * @param {string} params.type - Type of notification (e.g. 'DOCUMENT_SHARED', 'EXPIRING_SOON')
   * @param {string} [params.link] - Optional URL/path
   * @param {string} [params.email] - User's email address (for simulation logging)
   */
  static async send({ user_id, title, message, type, link, email }) {
    try {
      // 1. Save to database for in-app notifications
      const notif = await NotificationModel.create({
        user_id, title, message, type, link
      });

      // 2. Simulate sending an email
      if (email) {
        console.log(`\n======================================================`);
        console.log(`[SIMULATED EMAIL DISPATCH] To: ${email}`);
        console.log(`Subject: ${title}`);
        console.log(`\n${message}`);
        if (link) console.log(`\nLink: ${link}`);
        console.log(`======================================================\n`);
      }

      return notif;
    } catch (err) {
      console.error('Failed to dispatch notification:', err);
      // Don't throw to prevent interrupting the main workflow
    }
  }
}

module.exports = NotificationService;
