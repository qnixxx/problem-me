(function(root) {
  'use strict';

  const DB_NAME = 'problem.me';
  const DB_VERSION = 1;
  const STORE_NAME = 'investigations';
  const LEGACY_KEY = 'problem-me:investigation:pilot:v2';
  let dbPromise = null;

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Browser storage request failed.'));
    });
  }

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!root.indexedDB) {
        reject(new Error('IndexedDB is unavailable in this browser.'));
        return;
      }
      const request = root.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        const store = db.objectStoreNames.contains(STORE_NAME)
          ? request.transaction.objectStore(STORE_NAME)
          : db.createObjectStore(STORE_NAME, {keyPath: 'id'});
        if (!store.indexNames.contains('updatedAt')) store.createIndex('updatedAt', 'updatedAt');
        if (!store.indexNames.contains('status')) store.createIndex('status', 'status');
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };
      request.onerror = () => {
        dbPromise = null;
        reject(request.error || new Error('Could not open local investigation storage.'));
      };
      request.onblocked = () => {
        dbPromise = null;
        reject(new Error('Local investigation storage is blocked by another open problem.me tab.'));
      };
    });
    return dbPromise;
  }

  async function store(mode) {
    const db = await open();
    return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
  }

  async function get(id) {
    if (!id) return null;
    return (await requestResult((await store('readonly')).get(id))) || null;
  }

  async function put(value) {
    if (!value || typeof value.id !== 'string' || !value.id) throw new Error('Investigation has no valid ID.');
    await requestResult((await store('readwrite')).put(value));
    return value;
  }

  async function remove(id) {
    if (!id) return;
    await requestResult((await store('readwrite')).delete(id));
  }

  async function list() {
    const values = await requestResult((await store('readonly')).getAll());
    return values.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  }

  async function clear() {
    await requestResult((await store('readwrite')).clear());
  }

  async function count() {
    return requestResult((await store('readonly')).count());
  }

  async function migrateLegacy(model) {
    let text = null;
    try { text = root.localStorage?.getItem(LEGACY_KEY) || null; }
    catch (_) { return {migrated:false, reason:'legacy-storage-unavailable'}; }
    if (!text) return {migrated:false, reason:'none'};

    try {
      const item = model.decode(text);
      const existing = await get(item.id);
      if (!existing) await put(item);
      try { root.localStorage.removeItem(LEGACY_KEY); } catch (_) {}
      return {migrated:!existing, existing:Boolean(existing), id:item.id};
    } catch (error) {
      return {migrated:false, reason:'invalid', error};
    }
  }

  root.ProblemMeInvestigationStore = {
    DB_NAME,
    DB_VERSION,
    STORE_NAME,
    LEGACY_KEY,
    open,
    get,
    put,
    remove,
    list,
    clear,
    count,
    migrateLegacy
  };
})(globalThis);
