const db = require('../config/db');

class DashboardModel {
  static async getStatistics(userId, role) {
    const stats = {
      totalDocs: 0,
      totalSize: 0,
      pendingApprovals: 0,
      expiringSoon: 0,
      byType: [],
    };

    try {
      // 1. Total docs and size accessible by user
      // For simplicity, we count docs owned by user OR shared with user OR if user is admin.
      let baseDocQuery = `
        SELECT COUNT(DISTINCT d.id) as count, COALESCE(SUM(d.file_size), 0) as size
        FROM documents d
        LEFT JOIN document_shares ds ON d.id = ds.document_id
      `;
      let baseDocParams = [];
      let baseDocWhere = `WHERE (d.owner_id = $1 OR ds.user_id = $1)`;
      
      if (role === 'ADMIN') {
        baseDocWhere = ``;
      } else {
        baseDocParams.push(userId);
      }

      const totalRes = await db.query(`${baseDocQuery} ${baseDocWhere}`, baseDocParams);
      stats.totalDocs = parseInt(totalRes.rows[0].count, 10);
      stats.totalSize = parseInt(totalRes.rows[0].size, 10);

      // 2. Docs by Type
      let typeQuery = `
        SELECT SPLIT_PART(d.mime_type, '/', 1) as type_group, COUNT(DISTINCT d.id) as count
        FROM documents d
        LEFT JOIN document_shares ds ON d.id = ds.document_id
        ${baseDocWhere}
        GROUP BY type_group
      `;
      const typeRes = await db.query(typeQuery, baseDocParams);
      stats.byType = typeRes.rows.map(r => ({
        type: r.type_group,
        count: parseInt(r.count, 10)
      }));

      // 3. Pending Approvals (Only relevant for MANAGER/ADMIN)
      if (role === 'MANAGER' || role === 'ADMIN') {
        const approvalRes = await db.query(`
          SELECT COUNT(*) as count FROM approval_requests 
          WHERE status = 'PENDING'
        `);
        stats.pendingApprovals = parseInt(approvalRes.rows[0].count, 10);
      }

      // 4. Expiring Soon (Owned by user, expiring in next 7 days, or already expired)
      const expiringRes = await db.query(`
        SELECT COUNT(*) as count FROM documents 
        WHERE owner_id = $1 AND expires_at IS NOT NULL AND expires_at <= NOW() + INTERVAL '7 days'
      `, [userId]);
      stats.expiringSoon = parseInt(expiringRes.rows[0].count, 10);

      return {
        ...stats,
        total_documents: stats.totalDocs,
        total_size: stats.totalSize,
        pending_approvals: stats.pendingApprovals,
        expiring_soon: stats.expiringSoon,
        by_type: stats.byType,
      };
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      throw err;
    }
  }
}

module.exports = DashboardModel;
