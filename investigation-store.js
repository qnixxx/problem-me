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
        db.onversionchange = () => { db.close(); dbPromise = null; };
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
    }).catch(error => { dbPromise = null; throw error; });
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

  // Compare and write in ONE transaction: other tabs cannot slip a write
  // between the comparison and the mutation. Success means committed, not queued.
  async function mutate(action, id, value, {expectedText, expectedRecords, isCurrent} = {}) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const items = tx.objectStore(STORE_NAME);
      let failure;
      tx.oncomplete = () => resolve(value);
      tx.onabort = () => reject(failure || tx.error || new Error('Local storage transaction aborted.'));
      tx.onerror = () => {}; // onabort reports the final outcome.
      const write = stored => {
        try {
          if (isCurrent && !isCurrent()) throw new Error('Save cancelled because the session changed.');
          if (expectedRecords) {
            const fingerprint = records => JSON.stringify(records.map(item => JSON.stringify(item)).sort());
            if (fingerprint(stored) !== fingerprint(expectedRecords)) {
              const error = new Error('The local library changed in another tab. Refresh and review before deleting all records.');
              error.code = 'CONFLICT';
              throw error;
            }
          }
          if (expectedText !== undefined) {
            const actual = stored ? root.ProblemMeInvestigation.encode(stored) : null;
            if (actual !== expectedText) {
              const error = new Error('The saved investigation changed in another tab. Export this work or reopen the saved copy.');
              error.code = 'CONFLICT';
              throw error;
            }
          }
          if (action === 'put') items.put(value);
          else if (action === 'delete') items.delete(id);
          else items.clear();
        } catch (error) { failure = error; tx.abort(); }
      };
      if (expectedText !== undefined || expectedRecords) {
        const request = expectedRecords ? items.getAll() : items.get(id);
        request.onsuccess = () => write(request.result);
      } else write();
    });
  }

  async function put(value, options) {
    if (!value || typeof value.id !== 'string' || !value.id) throw new Error('Investigation has no valid ID.');
    await mutate('put', value.id, value, options);
    return value;
  }

  async function remove(id, options) {
    if (!id) return;
    await mutate('delete', id, undefined, options);
  }

  async function list() {
    const values = await requestResult((await store('readonly')).getAll());
    return values.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  }

  async function clear(expectedRecords) {
    await mutate('clear', undefined, undefined, {expectedRecords});
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
      if (!existing) await put(item, {expectedText:null});
      // A same-ID record may contain different work. Never discard that legacy copy.
      if (existing && model.encode(model.decode(model.encode(existing))) !== model.encode(item)) {
        return {migrated:false, reason:'collision', id:item.id};
      }
      try {
        if (root.localStorage.getItem(LEGACY_KEY) === text) root.localStorage.removeItem(LEGACY_KEY);
      } catch (_) {}
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
