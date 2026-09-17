const fs = require('fs');
const path = require('path');

/**
 * StorageServiceInterface defines the contract for file storage adapters.
 */
class StorageService {
  /**
   * Save a file to storage
   * @param {Buffer|ReadableStream} fileBuffer - The file content
   * @param {string} destinationKey - Unique file identifier or relative path
   * @param {string} mimeType - File MIME type
   * @returns {Promise<{ key: string, size: number, path: string }>}
   */
  async uploadFile(fileBuffer, destinationKey, mimeType) {
    throw new Error('uploadFile method must be implemented by storage provider');
  }

  /**
   * Retrieve file stream from storage
   * @param {string} key - File identifier
   * @returns {Promise<ReadableStream>}
   */
  async getFileStream(key) {
    throw new Error('getFileStream method must be implemented by storage provider');
  }

  /**
   * Delete a file from storage
   * @param {string} key - File identifier
   * @returns {Promise<boolean>}
   */
  async deleteFile(key) {
    throw new Error('deleteFile method must be implemented by storage provider');
  }

  /**
   * Check if file exists in storage
   * @param {string} key - File identifier
   * @returns {Promise<boolean>}
   */
  async fileExists(key) {
    throw new Error('fileExists method must be implemented by storage provider');
  }
}

/**
 * LocalStorageService implements StorageService using local filesystem.
 */
class LocalStorageService extends StorageService {
  constructor(baseUploadDir = null) {
    super();
    this.baseUploadDir = baseUploadDir || path.resolve(__dirname, '../../../uploads');
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  _resolvePath(key) {
    // Prevent directory traversal attacks
    const safeKey = path.normalize(key).replace(/^(\.\.[\/\\])+/, '');
    return path.join(this.baseUploadDir, safeKey);
  }

  async uploadFile(fileBuffer, destinationKey, mimeType) {
    const fullPath = this._resolvePath(destinationKey);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }

    await fs.promises.writeFile(fullPath, fileBuffer);
    const stats = await fs.promises.stat(fullPath);

    return {
      key: destinationKey,
      path: fullPath,
      size: stats.size,
      mimeType,
    };
  }

  async getFileStream(key) {
    const fullPath = this._resolvePath(key);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${key}`);
    }
    return fs.createReadStream(fullPath);
  }

  async deleteFile(key) {
    const fullPath = this._resolvePath(key);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
    return false;
  }

  async fileExists(key) {
    const fullPath = this._resolvePath(key);
    return fs.existsSync(fullPath);
  }
}

// Storage Factory helper
function getStorageService() {
  const type = (process.env.STORAGE_TYPE || 'local').toLowerCase();
  if (type === 'local') {
    return new LocalStorageService();
  }
  // Future S3 implementation:
  // if (type === 's3') return new S3StorageService();
  return new LocalStorageService();
}

module.exports = {
  StorageService,
  LocalStorageService,
  getStorageService,
};
