-- Phase 4 Schema: Document Versioning & Approval Workflow
-- Run against dms_db to apply changes

-- ─── 1. Extend the documents table ─────────────────────────────────────────────
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS current_version  INTEGER      NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS approval_status  VARCHAR(20)  NOT NULL DEFAULT 'DRAFT'
    CHECK (approval_status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED'));

-- ─── 2. Document version history ────────────────────────────────────────────────
-- Stores previous versions when a new version is uploaded.
-- The documents table always holds the LATEST version's file data.
CREATE TABLE IF NOT EXISTS document_versions (
    id              SERIAL PRIMARY KEY,
    document_id     INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number  INTEGER NOT NULL,                          -- historical version num (< current_version)
    storage_key     VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type       VARCHAR(127) NOT NULL,
    file_size       BIGINT NOT NULL,
    uploaded_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    change_notes    TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_dv_document   ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_dv_created    ON document_versions(document_id, created_at DESC);

-- ─── 3. Approval requests ────────────────────────────────────────────────────────
-- Tracks each approval cycle (submit → review). A document may have many over time.
CREATE TABLE IF NOT EXISTS approval_requests (
    id               SERIAL PRIMARY KEY,
    document_id      INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number   INTEGER NOT NULL DEFAULT 1,               -- which version is being approved
    requested_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'PENDING'
      CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    submission_note  TEXT NOT NULL DEFAULT '',
    review_comment   TEXT NOT NULL DEFAULT '',
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at      TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_ar_document   ON approval_requests(document_id);
CREATE INDEX IF NOT EXISTS idx_ar_status     ON approval_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ar_requested  ON approval_requests(requested_by);
