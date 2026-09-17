-- Phase 3: Search & Filtering Performance Indexes
-- Run once against dms_db to improve search query performance

-- Full-text pattern search support (trigram index on title and original_filename)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_documents_title_trgm
  ON documents USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_documents_filename_trgm
  ON documents USING gin (original_filename gin_trgm_ops);

-- Date range filter
CREATE INDEX IF NOT EXISTS idx_documents_updated ON documents(updated_at DESC);

-- Mime type filter
CREATE INDEX IF NOT EXISTS idx_documents_mime ON documents(mime_type);

-- Composite: owner + created_at (common sort after owner filter)
CREATE INDEX IF NOT EXISTS idx_documents_owner_created ON documents(owner_id, created_at DESC);

-- Composite: folder + created_at (already exists for folder_id, adding updated)
CREATE INDEX IF NOT EXISTS idx_documents_folder_updated ON documents(folder_id, updated_at DESC);
