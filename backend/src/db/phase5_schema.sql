-- Phase 5 Schema: Sharing, Audit Logs, Favorites
-- Run against dms_db to apply changes

-- ─── 1. Document Sharing ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_shares (
    id            SERIAL PRIMARY KEY,
    document_id   INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission    VARCHAR(20) NOT NULL DEFAULT 'VIEW' CHECK (permission IN ('VIEW', 'EDIT')),
    shared_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_doc_shares_doc ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_shares_user ON document_shares(user_id);

-- ─── 2. Audit Logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action        VARCHAR(50) NOT NULL,
    entity_type   VARCHAR(50) NOT NULL, -- e.g., 'DOCUMENT', 'FOLDER', 'APPROVAL'
    entity_id     INTEGER,              -- nullable, in case entity is deleted or global action
    details       JSONB,                -- flexible metadata (e.g., old_name, new_name, permissions)
    ip_address    VARCHAR(45),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ─── 3. User Favorites ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_favorites (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id   INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favs_user ON user_favorites(user_id);
