const DB_NAME = 'disha-stt-v1';
const TRANSCRIPT_STORE = 'transcripts';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(TRANSCRIPT_STORE)) db.createObjectStore(TRANSCRIPT_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveTranscript(sessionId: string, segment: { id: string; startMs: number; endMs: number; text: string; interim?: boolean }) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(TRANSCRIPT_STORE, 'readwrite');
    const store = tx.objectStore(TRANSCRIPT_STORE);
    const existingReq = store.get(sessionId);
    existingReq.onsuccess = () => {
      const existing = existingReq.result || { id: sessionId, segments: [] };
      existing.segments.push(segment);
      store.put(existing);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getTranscript(sessionId: string) {
  const db = await openDB();
  return new Promise<any>((resolve, reject) => {
    const tx = db.transaction(TRANSCRIPT_STORE, 'readonly');
    const store = tx.objectStore(TRANSCRIPT_STORE);
    const req = store.get(sessionId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
