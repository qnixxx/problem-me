/* One-time handoffs: no investigation text in URLs; private sessions never write browser storage. */
(function(root) {
  'use strict';
  const KEY = 'problem-me:handoff:one-time:v1';
  const MAX_AGE_MS = 60000;
  const DESTINATIONS = new Set(['5-whys.html','fishbone.html','pareto.html','kepner-tregoe.html']);
  async function clipboardHandoff(target, seed) {
    if (!confirm('PRIVATE SESSION HANDOFF: Copy the starting point to your clipboard and open the next tool? Clipboards can retain text outside problem.me. You will paste it yourself.')) return;
    try {
      if (!navigator.clipboard?.writeText) throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(seed);
    } catch (_) {
      // An explicit copy prompt works when the Clipboard API is blocked.
      if (prompt('Copy the starting point manually before continuing, then choose OK. Cancel to stay here:', seed) === null) return;
    }
    location.assign(target + '#pm_private=1');
  }
  async function navigate({target, seed, from, privateMode}) {
    if (!DESTINATIONS.has(target) || typeof seed !== 'string' || !seed.trim()) return;
    if (privateMode) return clipboardHandoff(target, seed);
    try {
      const token = root.crypto.randomUUID();
      sessionStorage.setItem(KEY, JSON.stringify({token, seed, from, at:Date.now()}));
      location.assign(target + '#pm_handoff=' + encodeURIComponent(token));
    } catch (_) {
      // Never fall back to carrying user text in the address bar.
      alert('Handoff could not be transferred securely. Use Copy Summary instead.');
    }
  }
  function take() {
    if (!location.hash) return null;
    const params = new URLSearchParams(location.hash.slice(1));
    const token = params.get('pm_handoff');
    const privateMode = params.get('pm_private') === '1';
    if (!token && !privateMode) return null;
    history.replaceState(null, '', location.pathname + location.search);
    if (privateMode) return {privateMode:true, seed:'', from:'another technique'};
    let raw = null;
    try {
      raw = sessionStorage.getItem(KEY);
      sessionStorage.removeItem(KEY);
    } catch (_) { return null; }
    if (!raw) return null;
    try {
      const item = JSON.parse(raw);
      if (item.token !== token || typeof item.seed !== 'string' || !item.seed.trim()
          || typeof item.from !== 'string' || !Number.isFinite(item.at)
          || Math.abs(Date.now() - item.at) > MAX_AGE_MS) return null;
      return {privateMode:false, seed:item.seed, from:item.from};
    } catch (_) { return null; }
  }
  root.ProblemMeHandoff = {navigate,take};
})(window);
