(() => {
  'use strict';
  const M = ProblemMeInvestigation;
  const KEY = 'problem-me:investigation:pilot:v2';
  const $ = id => document.getElementById(id);
  let state = M.fresh(), privateMode = true, ready = false, applying = false;
  let expected = null;
  const frames = {}, adapters = {};
  const tell = text => { $('message').textContent = text; };
  function resizeFrame(frame) {
    if (!frame || frame.hidden) return;
    const doc = frame.contentDocument;
    if (!doc?.body) return;
    const height = Math.ceil(doc.body.scrollHeight);
    if (!Number.isFinite(height) || height < 1) return;
    const current = Math.round(parseFloat(frame.style.height) || 0);
    if (Math.abs(current - height) > 1) frame.style.height = `${height}px`;
  }
  function render() {
    $('identity').textContent = `ID ${state.id} · Updated ${new Date(state.updatedAt).toLocaleString()}`;
    $('mode').textContent = privateMode ? 'START LOCAL SAVE' : 'ENTER PRIVATE SESSION';
    $('save').disabled = !ready || privateMode;
    $('privacy').textContent = privateMode
      ? "PRIVATE SESSION — kept in this page's memory. Refreshing or closing discards changes. Export to keep a copy."
      : 'LOCAL SAVE — both workspaces and the shared ledger auto-save in this browser. Other standalone drafts are separate.';
    M.TECHNIQUES.forEach(tool => { frames[tool].hidden = state.currentTechnique !== tool; });
    requestAnimationFrame(() => resizeFrame(frames[state.currentTechnique]));
    $('five').setAttribute('aria-pressed', String(state.currentTechnique === '5-whys'));
    $('fish').setAttribute('aria-pressed', String(state.currentTechnique === 'fishbone'));
    $('causePanel').hidden = state.currentTechnique !== 'fishbone';
    const previous = $('cause').value;
    $('cause').replaceChildren();
    state.toolData.fishbone.categories.forEach((category, ci) => category.causes.forEach((cause, ri) => {
      if (!cause.text.trim()) return;
      const option = document.createElement('option');
      option.value = `${ci}:${ri}`;
      option.textContent = `${category.name}: ${cause.text}`;
      $('cause').append(option);
    }));
    if ([...$('cause').options].some(x=>x.value === previous)) $('cause').value = previous;
    $('examine').disabled = !ready || !$('cause').options.length;
  }
  function capture() {
    if (!ready || applying) return;
    M.TECHNIQUES.forEach(tool => { state.toolData[tool] = adapters[tool].get(); });
    const ledger = adapters[state.currentTechnique].evidence().filter(x=>x.text.trim());
    if (JSON.stringify(ledger) !== JSON.stringify(state.evidence)) {
      state.evidence = ledger;
      applying = true;
      M.TECHNIQUES.filter(t=>t!==state.currentTechnique).forEach(t=>adapters[t].setEvidence(ledger));
      applying = false;
    }
    state.title = $('name').value;
    state.status = $('status').value;
  }
  function persist() {
    if (privateMode) { tell('PRIVATE SESSION — export to keep your work.'); return false; }
    try {
      if (localStorage.getItem(KEY) !== expected) throw Error('The saved pilot changed in another tab. Export this work, or open the saved copy before continuing local saves.');
      const text = M.encode(state);
      localStorage.setItem(KEY, text);
      expected = text;
      tell('BOTH WORKSPACES + SHARED LEDGER SAVED LOCALLY_');
      return true;
    } catch (error) { tell(`NOT SAVED — ${error.message} Export to keep a copy.`); return false; }
  }
  function changed(tool) {
    if (!ready || applying) return;
    const before = JSON.stringify(state);
    capture();
    if (tool) {
      const evidence = adapters[tool].evidence().filter(x=>x.text.trim());
      if (JSON.stringify(evidence) !== JSON.stringify(state.evidence)) {
        state.evidence = evidence;
        applying = true;
        M.TECHNIQUES.filter(t=>t!==tool).forEach(t=>adapters[t].setEvidence(evidence));
        applying = false;
      }
      if (!state.techniquesUsed.includes(tool)) state.techniquesUsed.push(tool);
    }
    if (JSON.stringify(state) !== before) {
      state.updatedAt = new Date().toISOString();
      persist();
      render();
    }
  }
  function apply(next) {
    applying = true;
    state = next;
    M.TECHNIQUES.forEach(tool => {
      adapters[tool].set(state.toolData[tool]);
      adapters[tool].setEvidence(state.evidence);
    });
    $('name').value = state.title;
    $('status').value = state.status;
    applying = false;
    render();
  }
  function switchTo(tool) {
    capture();
    state.currentTechnique = tool;
    if (!state.techniquesUsed.includes(tool)) state.techniquesUsed.push(tool);
    state.updatedAt = new Date().toISOString();
    persist(); render();
  }
  function confirmReplace() {
    capture();
    return confirm('Replace the investigation currently on screen, including BOTH workspaces and the shared ledger? Export first if you need to keep it.');
  }
  window.problemMePilot = {changed};
  document.querySelectorAll('button,input,select').forEach(el=>el.disabled=true);
  M.TECHNIQUES.forEach(tool => {
    const frame = document.createElement('iframe');
    frames[tool] = frame;
    frame.title = tool === '5-whys' ? '5 Whys workspace' : 'Fishbone workspace';
    frame.hidden = tool !== state.currentTechnique;
    frame.addEventListener('load', () => {
      const adapter = frame.contentWindow.investigationAdapter;
      if (!adapter) { tell('Workspace did not load. Check that all pilot files are hosted together.'); return; }
      adapters[tool] = adapter;
      const resize = () => resizeFrame(frame);
      new ResizeObserver(resize).observe(frame.contentDocument.body);
      if (Object.keys(adapters).length === 2 && !ready) {
        ready = true;
        document.querySelectorAll('button,input,select').forEach(el=>el.disabled=false);
        apply(state);
        tell('PRIVATE SESSION READY — start fresh, import a file, or open the saved pilot.');
      }
      resize();
    });
    frame.src = `${tool}.html?investigation=1`;
    $('workspace').append(frame);
  });
  $('five').onclick = () => switchTo('5-whys');
  $('fish').onclick = () => switchTo('fishbone');
  $('name').oninput = () => changed();
  $('status').onchange = () => changed();
  $('save').onclick = () => { capture(); persist(); };
  $('mode').onclick = () => {
    capture();
    if (!privateMode) { privateMode = true; render(); tell('PRIVATE SESSION — the last saved copy remains unchanged.'); return; }
    try {
      const stored = localStorage.getItem(KEY);
      if (!confirm(stored ? 'Save this investigation on this device and replace the existing saved pilot? Export either copy first if needed.' : 'Save both workspaces and the shared ledger on this device?')) return;
      expected = stored;
      privateMode = false;
      if (!persist()) privateMode = true;
      render();
    } catch (_) { tell('Browser storage is unavailable. Private Session and export remain available.'); }
  };
  $('export').onclick = () => {
    capture();
    try {
      const copy = M.clone(state); copy.updatedAt = new Date().toISOString();
      const blob = new Blob([M.encode(copy)],{type:'application/vnd.problemme+json'});
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url;
      link.download = (state.title.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,60) || 'problem-me-investigation') + '.problemme';
      document.body.append(link); link.click(); link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      tell('EXPORTED — both workspaces and the shared ledger. The file is readable JSON; share it only as intended.');
    } catch (error) { tell(`EXPORT FAILED — ${error.message}`); }
  };
  $('import').onclick = () => { $('file').value=''; $('file').click(); };
  $('file').onchange = async () => {
    const file = $('file').files[0]; if (!file) return;
    try {
      if (file.size > M.LIMIT) throw Error('File exceeds the 1 MiB limit.');
      const next = M.decode(await file.text());
      if (!confirmReplace()) return;
      apply(next);
      if (privateMode) tell('IMPORTED INTO PRIVATE SESSION — both workspaces are ready.');
      else persist();
    } catch (error) { tell(`IMPORT REJECTED — ${error.message}`); }
  };
  $('open').onclick = () => {
    try {
      const text = localStorage.getItem(KEY);
      if (!text) { tell('No shared pilot is saved in this browser. Import a .problemme file to bring in a 5 Whys investigation.'); return; }
      const next = M.decode(text);
      if (!confirmReplace()) return;
      expected = text; apply(next);
      tell(privateMode ? 'SAVED COPY OPENED IN PRIVATE SESSION — editing does not change the saved copy.' : 'SAVED INVESTIGATION OPENED_');
    } catch (error) { tell(`COULD NOT OPEN — ${error.message}`); }
  };
  $('new').onclick = () => {
    if (!confirmReplace()) return;
    privateMode = true; apply(M.fresh());
    tell('NEW PRIVATE INVESTIGATION — any previous saved copy remains unchanged.');
  };
  $('delete').onclick = () => {
    if (!confirm('Delete the saved shared pilot from this browser? The current in-memory work and standalone drafts will remain.')) return;
    try { localStorage.removeItem(KEY); expected = null; privateMode = true; render(); tell('SAVED PILOT DELETED — current work is now private.'); }
    catch (_) { tell('Could not delete the saved pilot. Browser storage is unavailable.'); }
  };
  $('examine').onclick = () => {
    capture();
    const [ci, ri] = $('cause').value.split(':').map(Number);
    const cause = state.toolData.fishbone.categories[ci]?.causes[ri]?.text;
    if (!cause) return;
    if (!confirm(`Use this cause as the 5 Whys problem statement?\n\n${cause}\n\nExisting WHY answers will remain for you to review.`)) return;
    state.toolData['5-whys'].problem = cause;
    state.history = [...state.history.slice(-49), {at:new Date().toISOString(),technique:'5-whys',action:'fishbone-cause-selected'}];
    applying = true; adapters['5-whys'].set(state.toolData['5-whys']); applying = false;
    switchTo('5-whys');
    tell('CAUSE SENT TO 5 WHYS — review any existing WHY answers for this new starting point.');
  };
  window.addEventListener('beforeunload', event => {
    if (!ready) return;
    capture();
    if (privateMode || expected !== JSON.stringify(state,null,2)) { event.preventDefault(); event.returnValue=''; }
  });
})();
