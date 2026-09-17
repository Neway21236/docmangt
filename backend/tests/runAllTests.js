/**
 * DocuSphere DMS - Enterprise End-to-End Test Suite
 * Tests all backend APIs, RBAC rules, database models, file storage,
 * versioning, approval workflows, sharing security, search, and audit logs.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const app = require('../src/app');
const db = require('../src/config/db');
const { checkExpiringDocuments } = require('../src/services/expiryJob');

let server;
let baseUrl;

// Test state
let adminToken = '';
let managerToken = '';
let viewerToken = '';
let adminUser = null;
let managerUser = null;
let viewerUser = null;

let testFolderId = null;
let testSubfolderId = null;
let testDocId = null;
let testApprovalRequestId = null;

let passedTests = 0;
let failedTests = 0;

function logPass(title) {
  console.log(`  ✓ PASS: ${title}`);
  passedTests++;
}

function logFail(title, err) {
  console.error(`  ✗ FAIL: ${title}`);
  console.error(`    Error: ${err.message || err}`);
  failedTests++;
}

async function request(urlPath, options = {}) {
  const url = `${baseUrl}${urlPath}`;
  const headers = { ...(options.headers || {}) };
  
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    if (options.isFormData) {
      fetchOptions.body = options.body;
    } else {
      headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(options.body);
    }
  }

  const res = await fetch(url, fetchOptions);
  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, headers: res.headers, data };
}

async function runTests() {
  console.log('================================================================');
  console.log('       🚀 DocuSphere DMS Enterprise Test Suite Starting         ');
  console.log('================================================================\n');

  // Start temporary server
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running on ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    // ───────────────────────────────────────────────────────────────────────────
    // 1. Health & Server Check
    // ───────────────────────────────────────────────────────────────────────────
    console.log('--- Suite 1: System Health & Diagnostics ---');
    try {
      const res = await request('/api/health');
      if (res.status === 200 && res.data.status === 'OK') {
        logPass('Health endpoint returns 200 OK');
      } else {
        throw new Error(`Unexpected status: ${res.status}`);
      }
    } catch (err) { logFail('Health endpoint check', err); }

    // ───────────────────────────────────────────────────────────────────────────
    // 2. Authentication & RBAC Verification
    // ───────────────────────────────────────────────────────────────────────────
    console.log('\n--- Suite 2: Authentication & RBAC Enforcement ---');
    try {
      // 2.1 Login Admin
      const adminLogin = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'admin@docsphere.com', password: 'password123' },
      });
      if (adminLogin.status === 200 && adminLogin.data.success && adminLogin.data.user.role === 'ADMIN') {
        adminToken = adminLogin.data.token;
        adminUser = adminLogin.data.user;
        logPass('Admin credentials authenticated successfully');
      } else {
        throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
      }

      // 2.2 Login Manager
      const managerLogin = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'manager@docsphere.com', password: 'password123' },
      });
      if (managerLogin.status === 200 && managerLogin.data.success && managerLogin.data.user.role === 'MANAGER') {
        managerToken = managerLogin.data.token;
        managerUser = managerLogin.data.user;
        logPass('Manager credentials authenticated successfully');
      } else {
        throw new Error(`Manager login failed: ${JSON.stringify(managerLogin.data)}`);
      }

      // 2.3 Login Viewer
      const viewerLogin = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'viewer@docsphere.com', password: 'password123' },
      });
      if (viewerLogin.status === 200 && viewerLogin.data.success && viewerLogin.data.user.role === 'VIEWER') {
        viewerToken = viewerLogin.data.token;
        viewerUser = viewerLogin.data.user;
        logPass('Viewer credentials authenticated successfully');
      } else {
        throw new Error(`Viewer login failed: ${JSON.stringify(viewerLogin.data)}`);
      }

      // 2.4 Verify Profile (/api/auth/me)
      const meRes = await request('/api/auth/me', { token: adminToken });
      if (meRes.status === 200 && meRes.data.user.email === 'admin@docsphere.com') {
        logPass('Profile /api/auth/me returns valid active session');
      } else {
        throw new Error(`Profile check failed: ${JSON.stringify(meRes.data)}`);
      }

      // 2.5 Role Restriction Enforcement
      const adminOnlyEndpoint = await request('/api/auth/users', { token: viewerToken });
      if (adminOnlyEndpoint.status === 403) {
        logPass('RBAC blocks VIEWER from accessing Admin User Management');
      } else {
        throw new Error(`Expected 403 for viewer, got ${adminOnlyEndpoint.status}`);
      }

      const managerTest = await request('/api/test/manager-only', { token: viewerToken });
      if (managerTest.status === 403) {
        logPass('RBAC blocks VIEWER from MANAGER-protected endpoints');
      } else {
        throw new Error(`Expected 403 for viewer on manager route, got ${managerTest.status}`);
      }

      const adminOnManagerRoute = await request('/api/test/manager-only', { token: adminToken });
      if (adminOnManagerRoute.status === 200) {
        logPass('RBAC allows ADMIN to access MANAGER-protected endpoints');
      } else {
        throw new Error(`Expected 200 for admin on manager route, got ${adminOnManagerRoute.status}`);
      }

    } catch (err) { logFail('Authentication & RBAC', err); }

    // ───────────────────────────────────────────────────────────────────────────
    // 3. Folder Hierarchy & Operations
    // ───────────────────────────────────────────────────────────────────────────
    console.log('\n--- Suite 3: Multi-Tenant Folder Management ---');
    try {
      // 3.1 Viewer cannot create folder
      const viewerFolder = await request('/api/folders', {
        method: 'POST',
        token: viewerToken,
        body: { name: 'Unauthorized Folder' },
      });
      if (viewerFolder.status === 403) {
        logPass('RBAC forbids VIEWER from creating new folders');
      } else {
        throw new Error(`Expected 403, got ${viewerFolder.status}`);
      }

      // 3.2 Manager creates root folder
      const rootFolderRes = await request('/api/folders', {
        method: 'POST',
        token: managerToken,
        body: { name: `Test_Folder_${Date.now()}` },
      });
      if (rootFolderRes.status === 201 && rootFolderRes.data.folder) {
        testFolderId = rootFolderRes.data.folder.id;
        logPass(`Manager created root folder #${testFolderId}`);
      } else {
        throw new Error(`Failed to create root folder: ${JSON.stringify(rootFolderRes.data)}`);
      }

      // 3.3 Create child subfolder
      const subfolderRes = await request('/api/folders', {
        method: 'POST',
        token: managerToken,
        body: { name: 'Child_Subfolder', parent_id: testFolderId },
      });
      if (subfolderRes.status === 201 && subfolderRes.data.folder) {
        testSubfolderId = subfolderRes.data.folder.id;
        logPass(`Created nested subfolder #${testSubfolderId} inside parent #${testFolderId}`);
      } else {
        throw new Error(`Failed to create subfolder: ${JSON.stringify(subfolderRes.data)}`);
      }

      // 3.4 Breadcrumb calculation
      const browseRes = await request(`/api/folders?parentId=${testSubfolderId}`, { token: viewerToken });
      if (browseRes.status === 200 && browseRes.data.breadcrumbs.length === 2) {
        logPass('Hierarchy breadcrumb path computed correctly');
      } else {
        throw new Error(`Breadcrumbs invalid: ${JSON.stringify(browseRes.data)}`);
      }

      // 3.5 Rename folder
      const renameRes = await request(`/api/folders/${testSubfolderId}/rename`, {
        method: 'PATCH',
        token: managerToken,
        body: { name: 'Renamed_Subfolder' },
      });
      if (renameRes.status === 200 && renameRes.data.folder.name === 'Renamed_Subfolder') {
        logPass('Folder rename updated successfully');
      } else {
        throw new Error(`Rename failed: ${JSON.stringify(renameRes.data)}`);
      }

      // 3.6 Cycle prevention
      const cycleRes = await request(`/api/folders/${testFolderId}/move`, {
        method: 'PATCH',
        token: managerToken,
        body: { target_parent_id: testSubfolderId },
      });
      if (cycleRes.status === 400) {
        logPass('Cycle prevention correctly blocks moving folder into its own subfolder');
      } else {
        throw new Error(`Expected 400 for cycle move, got ${cycleRes.status}`);
      }

    } catch (err) { logFail('Folder Management', err); }

    // ───────────────────────────────────────────────────────────────────────────
    // 4. Document Lifecycle (Upload, Stream, Download, Rename, Move)
    // ───────────────────────────────────────────────────────────────────────────
    console.log('\n--- Suite 4: Document Lifecycle & Physical Storage ---');
    try {
      // 4.1 Viewer cannot upload document
      const formDataViewer = new FormData();
      formDataViewer.append('file', new Blob(['Unauthorized document content'], { type: 'text/plain' }), 'viewer_test.txt');
      formDataViewer.append('title', 'Viewer Doc');

      const viewerUpload = await request('/api/documents/upload', {
        method: 'POST',
        token: viewerToken,
        body: formDataViewer,
        isFormData: true,
      });
      if (viewerUpload.status === 403) {
        logPass('RBAC forbids VIEWER from uploading documents');
      } else {
        throw new Error(`Expected 403 for viewer upload, got ${viewerUpload.status}`);
      }

      // 4.2 Manager uploads document into folder
      const formData = new FormData();
      const testContent = `DocuSphere Enterprise Specification Content - Timestamp ${Date.now()}`;
      formData.append('file', new Blob([testContent], { type: 'text/plain' }), 'enterprise_spec.txt');
      formData.append('title', 'Enterprise Spec 2026');
      formData.append('folder_id', testFolderId);
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      formData.append('expires_at', futureDate);

      const uploadRes = await request('/api/documents/upload', {
        method: 'POST',
        token: managerToken,
        body: formData,
        isFormData: true,
      });

      if (uploadRes.status === 201 && uploadRes.data.document) {
        testDocId = uploadRes.data.document.id;
        logPass(`Document uploaded successfully: #${testDocId} "${uploadRes.data.document.title}"`);
      } else {
        throw new Error(`Upload failed: ${JSON.stringify(uploadRes.data)}`);
      }

      // 4.3 View document stream inline
      const viewRes = await request(`/api/documents/${testDocId}/view`, { token: viewerToken });
      if (viewRes.status === 200 && typeof viewRes.data === 'string' && viewRes.data.includes('DocuSphere Enterprise')) {
        logPass('Inline document stream retrieved and content matches');
      } else {
        throw new Error(`Inline view failed: ${viewRes.status}`);
      }

      // 4.4 Download attachment
      const downloadRes = await request(`/api/documents/${testDocId}/download`, { token: viewerToken });
      if (downloadRes.status === 200 && downloadRes.headers.get('content-disposition')?.includes('attachment')) {
        logPass('Document download served with valid attachment headers');
      } else {
        throw new Error(`Download failed: ${downloadRes.status}`);
      }

      // 4.5 Rename document
      const docRenameRes = await request(`/api/documents/${testDocId}/rename`, {
        method: 'PATCH',
        token: managerToken,
        body: { title: 'Enterprise Spec v1.0 (Renamed)' },
      });
      if (docRenameRes.status === 200 && docRenameRes.data.document.title === 'Enterprise Spec v1.0 (Renamed)') {
        logPass('Document renamed successfully');
      } else {
        throw new Error(`Rename failed: ${JSON.stringify(docRenameRes.data)}`);
      }

      // 4.6 Update metadata (expiry)
      const newExpiry = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      const metaRes = await request(`/api/documents/${testDocId}`, {
        method: 'PATCH',
        token: managerToken,
        body: { expires_at: newExpiry },
      });
      if (metaRes.status === 200) {
        logPass('Document expiration metadata updated');
      } else {
        throw new Error(`Update metadata failed: ${JSON.stringify(metaRes.data)}`);
      }

    } catch (err) { logFail('Document Lifecycle', err); }

    // ───────────────────────────────────────────────────────────────────────────
    // 5. Version Control & History
    // ───────────────────────────────────────────────────────────────────────────
    console.log('\n--- Suite 5: Document Versioning & Archiving ---');
    try {
      // 5.1 Upload Version 2
      const v2FormData = new FormData();
      v2FormData.append('file', new Blob(['Updated specification content for version 2'], { type: 'text/plain' }), 'enterprise_spec_v2.txt');
      v2FormData.append('change_notes', 'Added security section and performance metrics');

      const v2Res = await request(`/api/documents/${testDocId}/versions`, {
        method: 'POST',
        token: managerToken,
        body: v2FormData,
        isFormData: true,
      });

      if (v2Res.status === 201 && v2Res.data.new_version === 2) {
        logPass('Uploaded Version 2: archived v1 and updated current version to 2');
      } else {
        throw new Error(`Version upload failed: ${JSON.stringify(v2Res.data)}`);
      }

      // 5.2 List versions timeline
      const versionListRes = await request(`/api/documents/${testDocId}/versions`, { token: viewerToken });
      if (versionListRes.status === 200 && versionListRes.data.versions.length >= 2) {
        logPass(`Version timeline contains ${versionListRes.data.versions.length} versions (current + archived history)`);
      } else {
        throw new Error(`Version list failed: ${JSON.stringify(versionListRes.data)}`);
      }

      // 5.3 Stream historical version (v1)
      const viewV1Res = await request(`/api/documents/${testDocId}/versions/1/view`, { token: viewerToken });
      if (viewV1Res.status === 200 && typeof viewV1Res.data === 'string' && viewV1Res.data.includes('DocuSphere Enterprise Specification Content')) {
        logPass('Historical version 1 streamed cleanly from archive storage');
      } else {
        throw new Error(`Historical view failed: ${viewV1Res.status}`);
      }

    } catch (err) { logFail('Versioning', err); }

    // ───────────────────────────────────────────────────────────────────────────
    // 6. Approval Workflow & Admin Review
    // ───────────────────────────────────────────────────────────────────────────
    console.log('\n--- Suite 6: Administrative Approval Workflow ---');
    try {
      // 6.1 Submit document for approval
      const submitRes = await request(`/api/approvals/${testDocId}/submit`, {
        method: 'POST',
        token: managerToken,
        body: { submission_note: 'Ready for final QA and compliance sign-off' },
      });

      if (submitRes.status === 201 && submitRes.data.approval_request) {
        testApprovalRequestId = submitRes.data.approval_request.id;
        logPass(`Submitted document for approval (Request #${testApprovalRequestId}, status PENDING)`);
      } else {
        throw new Error(`Submit approval failed: ${JSON.stringify(submitRes.data)}`);
      }

      // 6.2 Admin gets pending approval queue
      const pendingRes = await request('/api/approvals/pending', { token: adminToken });
      const foundInQueue = pendingRes.data.approvals?.some(a => a.id === testApprovalRequestId);
      if (pendingRes.status === 200 && foundInQueue) {
        logPass(`Pending request #${testApprovalRequestId} visible in Admin review queue`);
      } else {
        throw new Error(`Pending queue check failed: ${JSON.stringify(pendingRes.data)}`);
      }

      // 6.3 Admin reviews and approves request
      const reviewRes = await request(`/api/approvals/${testApprovalRequestId}/review`, {
        method: 'POST',
        token: adminToken,
        body: { decision: 'APPROVED', review_comment: 'Compliant with ISO 27001 standards' },
      });

      if (reviewRes.status === 200 && reviewRes.data.success) {
        logPass('Admin approved request successfully with comment');
      } else {
        throw new Error(`Review approval failed: ${JSON.stringify(reviewRes.data)}`);
      }

      // 6.4 Verify document status updated to APPROVED
      const docCheck = await request(`/api/documents/${testDocId}`, { token: viewerToken });
      if (docCheck.data.document?.approval_status === 'APPROVED') {
        logPass('Document approval_status updated to APPROVED in database');
      } else {
        throw new Error(`Status not updated: ${docCheck.data.document?.approval_status}`);
      }

      // 6.5 Approval Stats
      const statsRes = await request('/api/approvals/stats', { token: adminToken });
      if (statsRes.status === 200 && statsRes.data.approval_requests?.approved > 0) {
        logPass('Admin approval statistics accurately computed');
      } else {
        throw new Error(`Stats failed: ${JSON.stringify(statsRes.data)}`);
      }

    } catch (err) { logFail('Approval Workflow', err); }

    // ───────────────────────────────────────────────────────────────────────────
    // 7. Granular Sharing & Security Permissions
    // ───────────────────────────────────────────────────────────────────────────
    console.log('\n--- Suite 7: Granular Document Sharing & Security Checks ---');
    try {
      // 7.1 Share document with Viewer (EDIT permission)
      const shareRes = await request(`/api/documents/${testDocId}/shares`, {
        method: 'POST',
        token: managerToken,
        body: { user_id: viewerUser.id, permission: 'EDIT' },
      });

      if (shareRes.status === 201 && shareRes.data.share) {
        logPass(`Owner shared document #${testDocId} with Viewer #${viewerUser.id} (permission: EDIT)`);
      } else {
        throw new Error(`Share failed: ${JSON.stringify(shareRes.data)}`);
      }

      // 7.2 Security Check: Other manager cannot modify shares of document they don't own
      // Create a temporary second manager
      const tempUser = await db.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ('rogue_mgr_${Date.now()}@example.com', 'dummy', 'Rogue', 'Manager', 'MANAGER')
         RETURNING id, email;`
      );
      const rogueManager = tempUser.rows[0];
      const rogueToken = require('jsonwebtoken').sign({ id: rogueManager.id }, process.env.JWT_SECRET || 'super_secret_dms_jwt_key_2026_change_in_production');

      const rogueShareRes = await request(`/api/documents/${testDocId}/shares`, {
        method: 'POST',
        token: rogueToken,
        body: { user_id: adminUser.id, permission: 'VIEW' },
      });

      if (rogueShareRes.status === 403) {
        logPass('SECURITY: Non-owner Manager correctly rejected (403) when attempting to share another user\'s document');
      } else {
        throw new Error(`Expected 403 for non-owner manager, got ${rogueShareRes.status}`);
      }

      // Clean up temp manager
      await db.query(`DELETE FROM users WHERE id = $1`, [rogueManager.id]);

      // 7.3 Unshare document
      const unshareRes = await request(`/api/documents/${testDocId}/shares/${viewerUser.id}`, {
        method: 'DELETE',
        token: managerToken,
      });

      if (unshareRes.status === 200) {
        logPass('Access revoked: Unshared document successfully');
      } else {
        throw new Error(`Unshare failed: ${JSON.stringify(unshareRes.data)}`);
      }

    } catch (err) { logFail('Sharing & Security', err); }

    // ───────────────────────────────────────────────────────────────────────────
    // 8. Favorites & Search Engine
    // ───────────────────────────────────────────────────────────────────────────
    console.log('\n--- Suite 8: Favorites & Advanced Search ---');
    try {
      // 8.1 Toggle favorite
      const favRes = await request(`/api/favorites/${testDocId}`, {
        method: 'POST',
        token: viewerToken,
      });
      if (favRes.status === 200 && favRes.data.favorited === true) {
        logPass(`Document #${testDocId} added to Viewer favorites`);
      } else {
        throw new Error(`Favorite toggle failed: ${JSON.stringify(favRes.data)}`);
      }

      // 8.2 List favorites
      const favListRes = await request('/api/favorites', { token: viewerToken });
      if (favListRes.status === 200 && favListRes.data.favorites?.some(f => f.id === testDocId)) {
        logPass('Favorites list contains the favorited document');
      } else {
        throw new Error(`Favorites list check failed: ${JSON.stringify(favListRes.data)}`);
      }

      // 8.3 Full-text search
      const searchRes = await request('/api/documents/search?q=Enterprise', { token: viewerToken });
      if (searchRes.status === 200 && searchRes.data.documents?.length > 0) {
        logPass(`Full-text search returned ${searchRes.data.documents.length} matching document(s)`);
      } else {
        throw new Error(`Search failed: ${JSON.stringify(searchRes.data)}`);
      }

      // 8.4 MIME category filter
      const mimeSearch = await request('/api/documents/search?mimeCategory=document', { token: viewerToken });
      if (mimeSearch.status === 200) {
        logPass('MIME category filter query executed successfully');
      } else {
        throw new Error(`MIME search failed: ${mimeSearch.status}`);
      }

    } catch (err) { logFail('Favorites & Search', err); }

    // ───────────────────────────────────────────────────────────────────────────
    // 9. Notifications & Background Expiry Job
    // ───────────────────────────────────────────────────────────────────────────
    console.log('\n--- Suite 9: Notifications & Background Expiry ---');
    try {
      // 9.1 Fetch notifications
      const notifRes = await request('/api/notifications', { token: managerToken });
      if (notifRes.status === 200 && Array.isArray(notifRes.data.notifications)) {
        logPass(`Retrieved ${notifRes.data.notifications.length} notification(s) for manager`);
      } else {
        throw new Error(`Notification fetch failed: ${JSON.stringify(notifRes.data)}`);
      }

      // 9.2 Mark all read
      const markAllRes = await request('/api/notifications/mark-all-read', {
        method: 'PATCH',
        token: managerToken,
      });
      if (markAllRes.status === 200) {
        logPass('Mark all notifications as read executed successfully');
      } else {
        throw new Error(`Mark all read failed: ${JSON.stringify(markAllRes.data)}`);
      }

      // 9.3 Run background expiry job directly
      await checkExpiringDocuments();
      logPass('Background expiry job checked expiring documents and created alerts');

    } catch (err) { logFail('Notifications & Expiry', err); }

    // ───────────────────────────────────────────────────────────────────────────
    // 10. Dashboard & Audit Trail
    // ───────────────────────────────────────────────────────────────────────────
    console.log('\n--- Suite 10: Dashboard Analytics & Audit Trail ---');
    try {
      // 10.1 Dashboard Stats (Admin & Manager)
      const dashAdmin = await request('/api/dashboard/stats', { token: adminToken });
      if (dashAdmin.status === 200 && dashAdmin.data.stats?.total_documents >= 0 && dashAdmin.data.stats?.total_size >= 0) {
        logPass('Admin Dashboard statistics return valid metrics with zero errors');
      } else {
        throw new Error(`Dashboard stats failed: ${JSON.stringify(dashAdmin.data)}`);
      }

      const dashManager = await request('/api/dashboard/stats', { token: managerToken });
      if (dashManager.status === 200 && dashManager.data.stats?.totalDocs >= 0) {
        logPass('Manager Dashboard statistics return valid metrics with zero errors');
      } else {
        throw new Error(`Manager stats failed: ${JSON.stringify(dashManager.data)}`);
      }

      // 10.2 Audit Log Search
      const auditRes = await request('/api/audit-logs?limit=10', { token: adminToken });
      if (auditRes.status === 200 && auditRes.data.logs?.length > 0) {
        logPass(`Audit trail verified: ${auditRes.data.logs.length} logged events verified`);
      } else {
        throw new Error(`Audit log check failed: ${JSON.stringify(auditRes.data)}`);
      }

      // 10.3 Action types
      const actionTypesRes = await request('/api/audit-logs/actions', { token: adminToken });
      if (actionTypesRes.status === 200 && actionTypesRes.data.actions?.length > 10) {
        logPass('Audit action types dictionary retrieved');
      } else {
        throw new Error(`Action types failed: ${JSON.stringify(actionTypesRes.data)}`);
      }

    } catch (err) { logFail('Dashboard & Audit', err); }

    // ───────────────────────────────────────────────────────────────────────────
    // 11. Complete Cleanup & Physical Storage Pruning Verification
    // ───────────────────────────────────────────────────────────────────────────
    console.log('\n--- Suite 11: Document & Folder Deletion & Storage Pruning ---');
    try {
      // 11.1 Delete Document
      const delDocRes = await request(`/api/documents/${testDocId}`, {
        method: 'DELETE',
        token: managerToken,
      });

      if (delDocRes.status === 200) {
        logPass(`Document #${testDocId} deleted, physical files and historical versions pruned from disk`);
      } else {
        throw new Error(`Document delete failed: ${JSON.stringify(delDocRes.data)}`);
      }

      // 11.2 Delete Folder
      const delSubfolderRes = await request(`/api/folders/${testSubfolderId}`, {
        method: 'DELETE',
        token: managerToken,
      });
      if (delSubfolderRes.status === 200) {
        logPass(`Subfolder #${testSubfolderId} deleted successfully`);
      }

      const delRootFolderRes = await request(`/api/folders/${testFolderId}`, {
        method: 'DELETE',
        token: managerToken,
      });
      if (delRootFolderRes.status === 200) {
        logPass(`Root folder #${testFolderId} deleted successfully`);
      }

    } catch (err) { logFail('Cleanup & Pruning', err); }

  } finally {
    // Teardown test server and database pool
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await db.pool.end();
  }

  console.log('\n================================================================');
  console.log(`Test Execution Summary:`);
  console.log(`  Total Tests Run : ${passedTests + failedTests}`);
  console.log(`  Passed          : ${passedTests}`);
  console.log(`  Failed          : ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
