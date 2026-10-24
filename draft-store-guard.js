/* Detect stale standalone drafts before writing; no silent multi-tab overwrites. */
(function(root) {
  'use strict';
  const observed = new Map();
  const conflicted = new Set();
  function read(key) {
    const value = localStorage.getItem(key);
    if (!observed.has(key)) observed.set(key, value);
    else if (observed.get(key) !== value) conflicted.add(key);
    return value;
  }
  function save(key, value) {
    const current = localStorage.getItem(key);
    if (!observed.has(key)) observed.set(key, current);
    if (conflicted.has(key) || observed.get(key) !== current) {
      conflicted.add(key);
      const error = new Error('This draft changed in another tab. Copy your work or reload before saving.');
      error.code = 'CONFLICT';
      throw error;
    }
    localStorage.setItem(key, value);
    observed.set(key, value);
  }
  function remove(key) {
    localStorage.removeItem(key); // explicit user reset is allowed
    observed.set(key, null);
    conflicted.delete(key);
  }
  root.addEventListener('storage', event => {
    if (event.storageArea !== localStorage) return;
    if (event.key === null) {
      for (const key of observed.keys()) conflicted.add(key);
    } else if (observed.has(event.key) && observed.get(event.key) !== event.newValue) {
      conflicted.add(event.key);
    }
  });
  root.addEventListener('pm-clear-all', () => {
    for (const key of observed.keys()) observed.set(key, localStorage.getItem(key));
    conflicted.clear();
  });
  root.ProblemMeDraftStore = {read,save,remove};
})(window);
