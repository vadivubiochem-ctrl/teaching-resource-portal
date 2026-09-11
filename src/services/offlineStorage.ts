import type { TeachingFile, Folder } from '../types.js';

const DB_NAME = 'TeacherResourceHubOfflineDB';
const DB_VERSION = 2;

const STORE_RECENT = 'recently_accessed_files';
const STORE_BLOBS = 'cached_file_blobs';
const STORE_CATALOG = 'offline_file_catalog';

export interface CachedFileRecord {
  id: string;
  file: TeachingFile;
  accessed_at: string;
  cached_offline: boolean;
  has_blob: boolean;
  text_content?: string;
  file_size: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this browser environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_RECENT)) {
        const recentStore = db.createObjectStore(STORE_RECENT, { keyPath: 'id' });
        recentStore.createIndex('accessed_at', 'accessed_at', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS);
      }

      if (!db.objectStoreNames.contains(STORE_CATALOG)) {
        db.createObjectStore(STORE_CATALOG, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Record a file access in IndexedDB so teachers can browse and open it offline
 */
export async function recordFileAccess(
  file: TeachingFile,
  blob?: Blob | null,
  textContent?: string | null
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_RECENT, STORE_BLOBS], 'readwrite');
    const recentStore = tx.objectStore(STORE_RECENT);
    const blobStore = tx.objectStore(STORE_BLOBS);

    const record: CachedFileRecord = {
      id: file.id,
      file: { ...file },
      accessed_at: new Date().toISOString(),
      cached_offline: true,
      has_blob: !!blob,
      text_content: textContent || undefined,
      file_size: file.file_size,
    };

    recentStore.put(record);

    if (blob) {
      blobStore.put(blob, file.id);
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve(); // Non-blocking fallback
    });
  } catch (err) {
    console.warn('IndexedDB recordFileAccess warning:', err);
  }
}

/**
 * Get all recently accessed files sorted chronologically (newest first)
 */
export async function getRecentlyAccessedFiles(): Promise<TeachingFile[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_RECENT, 'readonly');
    const store = tx.objectStore(STORE_RECENT);
    const index = store.index('accessed_at');

    return new Promise((resolve) => {
      const request = index.openCursor(null, 'prev');
      const files: TeachingFile[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const val: CachedFileRecord = cursor.value;
          files.push(val.file);
          cursor.continue();
        } else {
          resolve(files);
        }
      };

      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('IndexedDB getRecentlyAccessedFiles error:', err);
    return [];
  }
}

/**
 * Check if a specific file is stored in IndexedDB for offline use
 */
export async function isFileCachedOffline(fileId: string): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_RECENT, 'readonly');
    const store = tx.objectStore(STORE_RECENT);
    const req = store.get(fileId);

    return new Promise((resolve) => {
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Get the set of all cached file IDs in IndexedDB
 */
export async function getCachedFileIds(): Promise<Set<string>> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_RECENT, 'readonly');
    const store = tx.objectStore(STORE_RECENT);
    const req = store.getAllKeys();

    return new Promise((resolve) => {
      req.onsuccess = () => {
        const keys = req.result as string[];
        resolve(new Set(keys));
      };
      req.onerror = () => resolve(new Set());
    });
  } catch {
    return new Set();
  }
}

/**
 * Retrieve cached Blob from IndexedDB
 */
export async function getCachedBlob(fileId: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_BLOBS, 'readonly');
    const store = tx.objectStore(STORE_BLOBS);
    const req = store.get(fileId);

    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Remove a cached file from IndexedDB
 */
export async function removeCachedFile(fileId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_RECENT, STORE_BLOBS], 'readwrite');
    tx.objectStore(STORE_RECENT).delete(fileId);
    tx.objectStore(STORE_BLOBS).delete(fileId);
  } catch (err) {
    console.warn('Failed to remove cached file:', err);
  }
}

/**
 * Synchronize full file catalog to IndexedDB for offline browsing
 */
export async function syncAllFilesToOffline(files: TeachingFile[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CATALOG, 'readwrite');
    const store = tx.objectStore(STORE_CATALOG);
    store.clear();

    for (const f of files) {
      store.put(f);
    }
  } catch (err) {
    console.warn('Failed to sync files to offline catalog:', err);
  }
}

/**
 * Retrieve full offline catalog from IndexedDB
 */
export async function getOfflineFiles(): Promise<TeachingFile[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CATALOG, 'readonly');
    const store = tx.objectStore(STORE_CATALOG);
    const req = store.getAll();

    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// Aliases for convenience
export const cacheFileMetadata = syncAllFilesToOffline;
export const getCachedFiles = getOfflineFiles;
