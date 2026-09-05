/* 青魚工具箱 — IndexedDB 輔助工具
   負責把使用者匯入的影片／音檔（Blob）存起來，重新整理頁面後還在。 */
const AoyuDB = (() => {
  const DB_NAME = 'aoyu-toolbox';
  const DB_VERSION = 1;
  const STORE = 'media';

  function open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('order', 'order');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function addFile(file) {
    const db = await open();
    const all = await getAll();
    const order = all.length;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      id,
      name: file.name,
      mime: file.type || (file.name.match(/\.(mp3|wav|m4a|aac|ogg|flac)$/i) ? 'audio/*' : 'video/*'),
      blob: file,
      order,
      addedAt: Date.now(),
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve(record);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getAll() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        const items = req.result || [];
        items.sort((a, b) => a.order - b.order);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async function removeFile(id) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function clearAll() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  return { addFile, getAll, removeFile, clearAll };
})();
