const db = require('../config/db');
const NotificationService = require('./notificationService');

/**
 * Checks for documents expiring within 7 days that haven't been notified yet.
 */
async function checkExpiringDocuments() {
  try {
    console.log(`[ExpiryJob] Running expiry check at ${new Date().toISOString()}...`);
    
    // Find docs expiring in the next 7 days that we haven't notified about yet.
    // Ensure we don't notify for already expired docs (though you could argue they should get an 'EXPIRED' notice, but let's stick to 'EXPIRING_SOON')
    const query = `
      SELECT d.id, d.title, d.owner_id, d.expires_at, u.email
      FROM documents d
      JOIN users u ON d.owner_id = u.id
      WHERE d.expires_at IS NOT NULL
        AND d.is_expiry_notified = FALSE
        AND d.expires_at <= NOW() + INTERVAL '7 days'
        AND d.expires_at > NOW()
    `;
    
    const res = await db.query(query);
    const expiringDocs = res.rows;
    
    for (const doc of expiringDocs) {
      // 1. Dispatch Notification
      await NotificationService.send({
        user_id: doc.owner_id,
        title: `Document Expiring Soon`,
        message: `Your document "${doc.title}" is set to expire on ${new Date(doc.expires_at).toLocaleDateString()}. Please review or renew it.`,
        type: 'EXPIRING_SOON',
        email: doc.email,
        link: `/documents?search=${encodeURIComponent(doc.title)}`
      });

      // 2. Mark as notified
      await db.query(
        `UPDATE documents SET is_expiry_notified = TRUE WHERE id = $1`,
        [doc.id]
      );
    }
    
    if (expiringDocs.length > 0) {
      console.log(`[ExpiryJob] Found and notified ${expiringDocs.length} expiring documents.`);
    }

  } catch (err) {
    console.error('[ExpiryJob] Error running expiry check:', err);
  }
}

/**
 * Starts the interval job. For testing purposes, we run it every 30 seconds.
 * In a real environment, this would likely be once a day.
 */
function startExpiryJob() {
  console.log('[ExpiryJob] Job registered. Will run every 30 seconds.');
  // Run immediately once
  checkExpiringDocuments();
  // Then every 30 seconds
  setInterval(checkExpiringDocuments, 30 * 1000);
}

module.exports = { startExpiryJob, checkExpiringDocuments };
