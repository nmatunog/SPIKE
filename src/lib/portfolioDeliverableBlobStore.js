const DB_NAME = 'spike_portfolio_deliverables';
const DB_VERSION = 1;
const STORE = 'blobs';

/** @returns {Promise<IDBDatabase>} */
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

/** @param {string} id @param {Blob} blob */
export async function saveDeliverableBlob(id, blob) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('IndexedDB write failed'));
    };
    tx.objectStore(STORE).put(blob, id);
  });
}

/** @param {string} id */
export async function loadDeliverableBlob(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('IndexedDB read failed'));
    };
    const request = tx.objectStore(STORE).get(id);
    request.onsuccess = () => resolve(/** @type {Blob | undefined} */ (request.result));
    request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'));
  });
}

/** @param {string} id */
export async function deleteDeliverableBlob(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('IndexedDB delete failed'));
    };
    tx.objectStore(STORE).delete(id);
  });
}
