// IndexedDB Helper for Storing Large Quran PDF files offline
const DB_NAME = 'sut_quran_db';
const STORE_NAME = 'quran_files';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface StoredPdfRecord {
  file: Blob;
  fileName: string;
  fileSize: number;
  uploadedAt: number;
}

export async function saveQuranPdf(file: Blob, fileName: string): Promise<boolean> {
  try {
    const db = await openDB();
    const record: StoredPdfRecord = {
      file,
      fileName,
      fileSize: file.size,
      uploadedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record, 'current_quran_pdf');

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save Quran PDF to IndexedDB:', err);
    return false;
  }
}

export async function getStoredQuranPdf(): Promise<StoredPdfRecord | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('current_quran_pdf');

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to get Quran PDF from IndexedDB:', err);
    return null;
  }
}

export async function deleteStoredQuranPdf(): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete('current_quran_pdf');

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to delete Quran PDF from IndexedDB:', err);
    return false;
  }
}

const LAST_PAGE_KEY = 'sut_quran_last_page';

export function saveLastReadPage(page: number): void {
  try {
    localStorage.setItem(LAST_PAGE_KEY, page.toString());
  } catch (e) {
    console.warn('Storage save error:', e);
  }
}

export function getLastReadPage(): number {
  try {
    const saved = localStorage.getItem(LAST_PAGE_KEY);
    return saved ? parseInt(saved, 10) : 1;
  } catch {
    return 1;
  }
}
