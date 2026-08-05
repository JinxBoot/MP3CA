// Minimal IndexedDB helper for storing shared file
const idbName = 'pwa-file-db';
const idbStore = 'files';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(idbName, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(idbStore);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDb();
  const tx = db.transaction(idbStore, 'readwrite');
  tx.objectStore(idbStore).put(value, key);
  return tx.complete || new Promise((res, rej) => {
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}

async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(idbStore, 'readonly');
    const req = tx.objectStore(idbStore).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(key) {
  const db = await openDb();
  const tx = db.transaction(idbStore, 'readwrite');
  tx.objectStore(idbStore).delete(key);
  return tx.complete || new Promise((res, rej) => {
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}

// expose to global scope for sw and pages
self.idbSet = idbSet;
self.idbGet = idbGet;
self.idbDelete = idbDelete;
window.idbSet = idbSet;
window.idbGet = idbGet;
window.idbDelete = idbDelete;
