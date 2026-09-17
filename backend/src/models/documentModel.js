const db = require('../config/db');

// Allowed sort columns mapped to safe SQL expressions
const SORT_COLUMN_MAP = {
  title: 'd.title',
  created_at: 'd.created_at',
  updated_at: 'd.updated_at',
  file_size: 'd.file_size',
  mime_type: 'd.mime_type',
  owner: 'u.last_name',
};

const SORT_DIR_SAFE = new Set(['ASC', 'DESC']);

class DocumentModel {
  static async create({
    title,
    original_filename,
    storage_key,
    mime_type,
    file_size,
    folder_id = null,
    owner_id,
    expires_at = null,
  }) {
    const res = await db.query(
      `INSERT INTO documents (title, original_filename, storage_key, mime_type, file_size, folder_id, owner_id, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, original_filename, storage_key, mime_type, file_size, folder_id, owner_id, created_at, updated_at, expires_at;`,
      [
        title.trim(),
        original_filename,
        storage_key,
        mime_type,
        file_size,
        folder_id ? parseInt(folder_id, 10) : null,
        owner_id,
        expires_at || null,
      ]
    );
    return res.rows[0];
  }

  static async findById(id) {
    const res = await db.query(
      `SELECT d.id, d.title, d.original_filename, d.storage_key, d.mime_type, d.file_size,
              d.folder_id, d.owner_id, d.created_at, d.updated_at, d.expires_at,
              d.current_version, d.approval_status,
              u.first_name as owner_first_name, u.last_name as owner_last_name, u.email as owner_email,
              u.role as owner_role,
              f.name as folder_name
       FROM documents d
       LEFT JOIN users u ON d.owner_id = u.id
       LEFT JOIN folders f ON d.folder_id = f.id
       WHERE d.id = $1;`,
      [parseInt(id, 10)]
    );
    return res.rows[0] || null;
  }

  static async findByFolder(folderId = null) {
    let query;
    let params;

    if (folderId) {
      query = `
        SELECT d.id, d.title, d.original_filename, d.storage_key, d.mime_type, d.file_size,
               d.folder_id, d.owner_id, d.created_at, d.updated_at, d.expires_at,
               d.current_version, d.approval_status,
               u.first_name as owner_first_name, u.last_name as owner_last_name, u.email as owner_email,
               u.role as owner_role
        FROM documents d
        LEFT JOIN users u ON d.owner_id = u.id
        WHERE d.folder_id = $1
        ORDER BY d.created_at DESC;
      `;
      params = [parseInt(folderId, 10)];
    } else {
      query = `
        SELECT d.id, d.title, d.original_filename, d.storage_key, d.mime_type, d.file_size,
               d.folder_id, d.owner_id, d.created_at, d.updated_at, d.expires_at,
               d.current_version, d.approval_status,
               u.first_name as owner_first_name, u.last_name as owner_last_name, u.email as owner_email,
               u.role as owner_role
        FROM documents d
        LEFT JOIN users u ON d.owner_id = u.id
        WHERE d.folder_id IS NULL
        ORDER BY d.created_at DESC;
      `;
      params = [];
    }

    const res = await db.query(query, params);
    return res.rows;
  }

  /**
   * Full-text search with filtering, sorting, and pagination.
   * @param {object} opts
   * @param {string}   [opts.query]        - Search term matched against title and original_filename
   * @param {string}   [opts.mimeCategory] - 'pdf' | 'image' | 'spreadsheet' | 'archive' | 'code' | 'other'
   * @param {number}   [opts.ownerId]      - Filter by specific owner user ID
   * @param {string}   [opts.dateFrom]     - ISO date string for created_at lower bound
   * @param {string}   [opts.dateTo]       - ISO date string for created_at upper bound
   * @param {number}   [opts.folderId]     - null = root only, -1 = all folders, number = specific folder
   * @param {string}   [opts.sortBy]       - Column to sort (title|created_at|updated_at|file_size|mime_type|owner)
   * @param {string}   [opts.sortDir]      - 'ASC' | 'DESC'
   * @param {number}   [opts.page]         - 1-indexed page number
   * @param {number}   [opts.limit]        - Results per page (max 100)
   * @returns {{ rows: object[], total: number }}
   */
  static async search({
    query = '',
    mimeCategory = '',
    ownerId = null,
    dateFrom = null,
    dateTo = null,
    folderId = undefined, // undefined = all folders (global search)
    sortBy = 'created_at',
    sortDir = 'DESC',
    page = 1,
    limit = 20,
  } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    // --- Full-text / keyword search on title + original_filename ---
    if (query && query.trim()) {
      const term = `%${query.trim().toLowerCase()}%`;
      conditions.push(`(LOWER(d.title) LIKE $${idx} OR LOWER(d.original_filename) LIKE $${idx})`);
      params.push(term);
      idx++;
    }

    // --- MIME category filter ---
    if (mimeCategory) {
      switch (mimeCategory) {
        case 'pdf':
          conditions.push(`d.mime_type ILIKE $${idx}`);
          params.push('%pdf%');
          idx++;
          break;
        case 'image':
          conditions.push(`d.mime_type ILIKE $${idx}`);
          params.push('image/%');
          idx++;
          break;
        case 'spreadsheet':
          conditions.push(
            `(d.mime_type ILIKE $${idx} OR d.mime_type ILIKE $${idx + 1} OR d.original_filename ILIKE $${idx + 2})`
          );
          params.push('%spreadsheet%', '%excel%', '%.csv');
          idx += 3;
          break;
        case 'archive':
          conditions.push(
            `(d.mime_type ILIKE $${idx} OR d.mime_type ILIKE $${idx + 1} OR d.mime_type ILIKE $${idx + 2})`
          );
          params.push('%zip%', '%compressed%', '%tar%');
          idx += 3;
          break;
        case 'code':
          conditions.push(
            `(d.mime_type ILIKE $${idx} OR d.mime_type ILIKE $${idx + 1} OR d.mime_type ILIKE $${idx + 2})`
          );
          params.push('%json%', '%javascript%', '%html%');
          idx += 3;
          break;
        case 'document':
          conditions.push(
            `(d.mime_type ILIKE $${idx} OR d.mime_type ILIKE $${idx + 1} OR d.mime_type ILIKE $${idx + 2})`
          );
          params.push('%word%', '%msword%', 'text/plain');
          idx += 3;
          break;
        case 'other':
          conditions.push(
            `(d.mime_type NOT ILIKE '%pdf%' AND d.mime_type NOT ILIKE 'image/%' AND d.mime_type NOT ILIKE '%spreadsheet%' AND d.mime_type NOT ILIKE '%excel%' AND d.mime_type NOT ILIKE '%zip%' AND d.mime_type NOT ILIKE '%compressed%' AND d.mime_type NOT ILIKE '%json%' AND d.mime_type NOT ILIKE '%javascript%' AND d.mime_type NOT ILIKE '%html%' AND d.mime_type NOT ILIKE '%word%' AND d.mime_type NOT ILIKE '%msword%' AND d.mime_type NOT ILIKE 'text/plain')`
          );
          break;
      }
    }

    // --- Owner filter ---
    if (ownerId) {
      conditions.push(`d.owner_id = $${idx}`);
      params.push(parseInt(ownerId, 10));
      idx++;
    }

    // --- Date range filter (on created_at) ---
    if (dateFrom) {
      conditions.push(`d.created_at >= $${idx}`);
      params.push(new Date(dateFrom).toISOString());
      idx++;
    }
    if (dateTo) {
      // Include the full day by adding 1 day to dateTo
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(`d.created_at < $${idx}`);
      params.push(endDate.toISOString());
      idx++;
    }

    // --- Folder scope filter ---
    // folderId === undefined → no folder filter (search all)
    // folderId === null      → root only (folder_id IS NULL)
    // folderId > 0           → specific folder
    if (folderId === null) {
      conditions.push(`d.folder_id IS NULL`);
    } else if (folderId !== undefined && folderId !== '' && !isNaN(parseInt(folderId))) {
      conditions.push(`d.folder_id = $${idx}`);
      params.push(parseInt(folderId, 10));
      idx++;
    }

    // --- Build WHERE clause ---
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // --- Sorting (whitelist validated) ---
    const safeSortCol = SORT_COLUMN_MAP[sortBy] || 'd.created_at';
    const safeSortDir = SORT_DIR_SAFE.has((sortDir || '').toUpperCase()) ? sortDir.toUpperCase() : 'DESC';

    // --- Pagination ---
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;

    // --- Count query ---
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM documents d
      LEFT JOIN users u ON d.owner_id = u.id
      LEFT JOIN folders f ON d.folder_id = f.id
      ${where};
    `;

    // --- Data query ---
    const dataQuery = `
      SELECT d.id, d.title, d.original_filename, d.storage_key, d.mime_type, d.file_size,
             d.folder_id, d.owner_id, d.created_at, d.updated_at, d.expires_at,
             d.current_version, d.approval_status,
             u.first_name as owner_first_name, u.last_name as owner_last_name, u.email as owner_email,
             u.role as owner_role,
             f.name as folder_name
      FROM documents d
      LEFT JOIN users u ON d.owner_id = u.id
      LEFT JOIN folders f ON d.folder_id = f.id
      ${where}
      ORDER BY ${safeSortCol} ${safeSortDir}
      LIMIT $${idx} OFFSET $${idx + 1};
    `;
    params.push(safeLimit, offset);

    const [countRes, dataRes] = await Promise.all([
      db.query(countQuery, params.slice(0, idx - 1)), // count uses same params except LIMIT/OFFSET
      db.query(dataQuery, params),
    ]);

    return {
      rows: dataRes.rows,
      total: parseInt(countRes.rows[0].total, 10),
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(parseInt(countRes.rows[0].total, 10) / safeLimit),
    };
  }

  static async update(id, { title, folder_id, expires_at }) {
    const updates = [];
    const params = [];
    let idx = 1;

    if (title !== undefined) {
      updates.push(`title = $${idx++}`);
      params.push(title.trim());
    }

    if (folder_id !== undefined) {
      updates.push(`folder_id = $${idx++}`);
      params.push(folder_id ? parseInt(folder_id, 10) : null);
    }
    
    if (expires_at !== undefined) {
      updates.push(`expires_at = $${idx++}`);
      params.push(expires_at || null);
    }

    if (updates.length === 0) return this.findById(id);

    params.push(parseInt(id, 10));
    const query = `
      UPDATE documents
      SET ${updates.join(', ')}
      WHERE id = $${idx}
      RETURNING id, title, original_filename, storage_key, mime_type, file_size, folder_id, owner_id, created_at, updated_at, expires_at;
    `;

    const res = await db.query(query, params);
    return res.rows[0] || null;
  }

  /**
   * Replace document file data with a new version.
   * Called by VersionController.upload after archiving the old version.
   */
  static async uploadNewVersion(id, {
    storage_key,
    original_filename,
    mime_type,
    file_size,
    current_version,
  }) {
    const res = await db.query(
      `UPDATE documents
       SET storage_key = $1, original_filename = $2, mime_type = $3, file_size = $4,
           current_version = $5, approval_status = 'DRAFT'
       WHERE id = $6
       RETURNING id, title, original_filename, storage_key, mime_type, file_size,
                 folder_id, owner_id, created_at, updated_at, current_version, approval_status;`,
      [storage_key, original_filename, mime_type, file_size, current_version, parseInt(id, 10)]
    );
    return res.rows[0] || null;
  }

  static async delete(id) {
    const res = await db.query(`DELETE FROM documents WHERE id = $1 RETURNING id, storage_key;`, [
      parseInt(id, 10),
    ]);
    return res.rows[0] || null;
  }
}

module.exports = DocumentModel;
