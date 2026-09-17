# DocuSphere 🌐

DocuSphere is an enterprise-grade Document Management System (DMS) built with Node.js, Express, PostgreSQL, and React. It features robust Role-Based Access Control (RBAC), nested folder hierarchies, version control, administrative approval workflows, document sharing permissions, and an automated background expiry notification engine.

---

## 🚀 Key Features

- **Robust RBAC (Role-Based Access Control)**
  - Three distinct roles: `ADMIN`, `MANAGER`, and `VIEWER`.
  - Granular permissions enforced at the API route level, controller authorization guards, and database queries.
  - Granular Document Sharing with `VIEW` and `EDIT` permissions (only document owners and Admins can manage shares).
- **Enterprise Storage & Folders**
  - Nestable folders with full hierarchy breadcrumb traversal.
  - Abstracted local file storage service (`StorageService`), designed for drop-in S3 / Azure Blob cloud adapter upgrades.
  - Automatic cleanup of all physical version files on document deletion.
- **Document Versioning & History**
  - Upload incremental versions of documents (`v1`, `v2`, etc.) with change comments.
  - Version history timeline and instant rollback capability.
  - View audit logs and history for individual documents.
- **Administrative Approval Workflows**
  - Submit documents in `DRAFT` status for admin approval.
  - Dedicated **Pending Approvals** tab in the Admin Panel for approving/rejecting requests with review notes.
  - In-context approval/rejection modal directly accessible from the document version modal.
- **Automated Expiry & Notifications**
  - Set expiration dates (`expires_at`) for compliance-sensitive documents.
  - Background worker checks periodically for documents approaching expiration within 7 days.
  - Real-time in-app notification dropdown for approvals, shares, and expiring documents with status counters.
- **Comprehensive Audit Logging**
  - Every system mutation is logged (`UPLOAD`, `DELETE`, `APPROVE`, `REJECT`, `ROLE_CHANGE`, `SHARE`).
  - Dedicated Admin view with sortable and filterable system logs.

---

## 🛠️ Tech Stack

- **Backend**: Node.js (v18+), Express 4, `jsonwebtoken`, `bcryptjs`, `multer`, `pg` (node-postgres)
- **Database**: PostgreSQL 14+ (Tested on PostgreSQL 18)
- **Frontend**: React 19, Vite, TailwindCSS, `lucide-react`, `axios`
- **Testing**: Automated end-to-end integration test runner (`tests/runAllTests.js`)

---

## ⚙️ Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the `backend/` directory (or copy from `backend/.env.example`):

```env
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=super_secret_dms_jwt_key_2026_change_in_production
JWT_EXPIRES_IN=7d

# PostgreSQL Database Configuration
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=dms_db

# Storage Configuration (local / s3)
STORAGE_TYPE=local
UPLOAD_DIR=./uploads
```

### 2. Database Initialization & Seeding

Ensure PostgreSQL is running and the database specified by `PGDATABASE` exists (e.g., `dms_db`).
Run the automated schema migration and seed script:

```bash
cd backend
npm run db:init
```

This sequentially executes all 6 database schema phases:
1. `init.sql` (Users table and core schema)
2. `phase2_schema.sql` (Folders and documents tables)
3. `phase3_search_indexes.sql` (Performance & full-text search indexes)
4. `phase4_schema.sql` (Document versions, approval requests, document shares)
5. `phase5_schema.sql` (Favorites and audit logs)
6. `phase6_schema.sql` (Expiry notifications and background tracking)

And automatically provisions the default seed accounts with secure bcrypt-hashed credentials.

### 3. Install Dependencies

```bash
# In backend
cd backend
npm install

# In frontend
cd ../frontend
npm install
```

### 4. Run the Application

Start the backend API server:
```bash
cd backend
npm start
# Server starts on http://localhost:5000
```

Start the frontend Vite dev server:
```bash
cd frontend
npm run dev
# Vite runs on http://localhost:5173
```

---

## 🧪 Automated Testing

DocuSphere includes a comprehensive end-to-end integration test suite covering authentication, folder hierarchies, document lifecycle, versioning, RBAC enforcement, sharing security, approval workflows, audit logs, notifications, and physical file cleanup:

```bash
cd backend
npm test
```

Expected result:
```
============================================================
  DocuSphere DMS - Comprehensive Test Suite
============================================================
...
Test Suite Complete: 45 passed, 0 failed.
```

To run frontend linting and production build verification:
```bash
cd frontend
npm run lint    # Oxlint static check (0 errors)
npm run build   # Production Vite bundle build
```

---

## 🧑‍💻 Pre-Configured Test Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@docsphere.com` | `password123` | Full access: User management, pending approvals, audit logs, all documents & folders |
| **Manager** | `manager@docsphere.com` | `password123` | Upload, edit, delete own documents, manage own shares, submit for approval |
| **Viewer** | `viewer@docsphere.com` | `password123` | Read-only access to authorized documents, view permitted shares |

*(Note: In production deployments, change default passwords and rotate `JWT_SECRET` immediately.)*

---

## 📖 Feature Walkthrough & Verification

1. **Dashboard Analytics**: Sign in as `admin@docsphere.com` to view live system metrics (total documents, storage utilization, pending approvals, recent audit events).
2. **Document & Folder Management**: Navigate to **Explorer**. Create nested folders, breadcrumb-traverse directories, upload documents, and set expiration dates.
3. **Document Versioning**: Open document options and choose **Versions / History**. Upload incremental revisions and preview previous versions.
4. **Administrative Approvals**:
   - As a Manager or Viewer, submit a draft document for approval.
   - Switch to the Admin account, open the **Admin** section in the sidebar, and switch to the **Pending Approvals** tab.
   - Review the document preview and approve or reject with review notes.
5. **Secure Sharing**: Open the share dialog on any owned document to grant `VIEW` or `EDIT` access to specific users. Authorization checks ensure non-owners cannot alter access lists.
6. **Automated Expiry & Notifications**: Documents with an `expires_at` date within 7 days automatically trigger alerts handled by the background notification worker, visible in the navbar bell.

---

## 🏛️ Architecture & Enterprise Extensibility

- **Storage Adapter Pattern**: The local disk storage in `backend/src/services/storageService.js` adheres to an abstracted interface. Cloud providers such as AWS S3 or Google Cloud Storage can be integrated seamlessly.
- **Audit Trail**: Every critical action generates a non-repudiable entry in the `audit_logs` table capturing `user_id`, `action`, `entity_type`, `entity_id`, and JSON payload details.
- **Security Posture**: Password hashing with `bcryptjs`, route-level JWT authentication with custom authorization middlewares (`requireRole`, `requireAdmin`), and strict ownership enforcement on sharing and deletion.
