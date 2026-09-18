(() => {
  'use strict';

  const M = ProblemMeInvestigation;
  const Store = ProblemMeInvestigationStore;
  const $ = id => document.getElementById(id);
  const requestedId = new URLSearchParams(location.search).get('id');

  let state = M.fresh();
  let privateMode = true;
  let ready = false;
  let applying = false;
  let expectedText = null;
  let dirty = false;
  let revision = 0;
  let saveTimer = null;
  let saveBlocked = false;
  let saveQueue = Promise.resolve();

  const frames = {};
  const adapters = {};
  const tell = text => { $('message').textContent = text; };

  function encoded(value) {
    return M.encode(value);
  }

  function resizeFrame(frame) {
    if (!frame || frame.hidden) return;
    const doc = frame.contentDocument;
    if (!doc?.body) return;
    const height = Math.ceil(Math.max(doc.body.scrollHeight, doc.documentElement?.scrollHeight || 0));
    if (!Number.isFinite(height) || height < 1) return;
    const current = Math.round(parseFloat(frame.style.height) || 0);
    if (Math.abs(current - height) > 1) frame.style.height = `${height}px`;
  }

  function updateUrlForSavedState() {
    if (privateMode) return;
    const target = `investigation.html?id=${encodeURIComponent(state.id)}`;
    if (`${location.pathname.split('/').pop()}${location.search}` !== target) history.replaceState(null, '', target);
  }

  function clearSavedUrl() {
    if (location.search) history.replaceState(null, '', 'investigation.html');
  }

  function render() {
    $('identity').textContent = `ID ${state.id} · Updated ${new Date(state.updatedAt).toLocaleString()}`;
    $('mode').textContent = privateMode ? 'START LOCAL SAVE' : 'ENTER PRIVATE SESSION';
    $('save').disabled = !ready || privateMode || saveBlocked;
    $('privacy').textContent = privateMode
      ? "PRIVATE SESSION — kept in this page's memory. Refreshing or closing discards changes. Export to keep a copy."
      : 'LOCAL SAVE — all three workspaces and the shared ledger auto-save in My Investigations using browser storage on this device. problem.me does not receive a copy.';

    M.TECHNIQUES.forEach(tool => { frames[tool].hidden = state.currentTechnique !== tool; });
    requestAnimationFrame(() => resizeFrame(frames[state.currentTechnique]));
    $('five').setAttribute('aria-pressed', String(state.currentTechnique === '5-whys'));
    $('fish').setAttribute('aria-pressed', String(state.currentTechnique === 'fishbone'));
    $('pareto').setAttribute('aria-pressed', String(state.currentTechnique === 'pareto'));
    $('causePanel').hidden = state.currentTechnique !== 'fishbone';
    $('paretoPanel').hidden = state.currentTechnique !== 'pareto';

    const previous = $('cause').value;
    $('cause').replaceChildren();
    state.toolData.fishbone.categories.forEach((category, ci) => category.causes.forEach((cause, ri) => {
      if (!cause.text.trim()) return;
      const option = document.createElement('option');
      option.value = `${ci}:${ri}`;
      option.textContent = `${category.name}: ${cause.text}`;
      $('cause').append(option);
    }));
    if ([...$('cause').options].some(x => x.value === previous)) $('cause').value = previous;
    $('examine').disabled = !ready || !$('cause').options.length;

    const previousPareto = $('paretoFocus').value;
    $('paretoFocus').replaceChildren();
    const ranked = state.toolData.pareto.rows
      .map((row, index) => ({index, name:row.name.trim(), value:Number(row.value)}))
      .filter(row => row.name && Number.isFinite(row.value) && row.value > 0)
      .sort((a,b) => b.value - a.value || a.name.localeCompare(b.name));
    ranked.forEach((row, rank) => {
      const option = document.createElement('option');
      option.value = String(row.index);
      option.textContent = `${String(rank + 1).padStart(2,'0')} · ${row.name} — ${row.value}`;
      $('paretoFocus').append(option);
    });
    if ([...$('paretoFocus').options].some(x => x.value === previousPareto)) $('paretoFocus').value = previousPareto;
    const noPareto = !ready || !$('paretoFocus').options.length;
    $('paretoWhy').disabled = noPareto;
    $('paretoFish').disabled = noPareto;
  }

  function capture() {
    if (!ready || applying) return;
    M.TECHNIQUES.forEach(tool => { state.toolData[tool] = adapters[tool].get(); });
    const ledger = adapters[state.currentTechnique].evidence().filter(x => x.text.trim());
    if (JSON.stringify(ledger) !== JSON.stringify(state.evidence)) {
      state.evidence = ledger;
      applying = true;
      M.TECHNIQUES.filter(t => t !== state.currentTechnique).forEach(t => adapters[t].setEvidence(ledger));
      applying = false;
    }
    state.title = $('name').value;
    state.status = $('status').value;
  }

  function markChanged() {
    state.updatedAt = new Date().toISOString();
    revision += 1;
    dirty = true;
  }

  function schedulePersist() {
    if (privateMode || saveBlocked) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      persistSnapshot({quiet:true});
    }, 220);
  }

  function persistSnapshot({quiet=false} = {}) {
    if (privateMode) {
      if (!quiet) tell('PRIVATE SESSION — export to keep your work, or start local save.');
      return Promise.resolve(false);
    }
    if (saveBlocked) {
      if (!quiet) tell('LOCAL SAVE PAUSED — the saved copy changed elsewhere. Export this work or reopen it from My Investigations.');
      return Promise.resolve(false);
    }

    clearTimeout(saveTimer);
    saveTimer = null;
    const snapshot = M.clone(state);
    const snapshotRevision = revision;
    const snapshotText = encoded(snapshot);

    const task = async () => {
      try {
        const stored = await Store.get(snapshot.id);
        const storedText = stored ? encoded(stored) : null;
        if (storedText !== expectedText) {
          saveBlocked = true;
          throw new Error('The saved investigation changed in another tab. Export this work, or reopen the saved copy from My Investigations before continuing local saves.');
        }
        await Store.put(snapshot);
        expectedText = snapshotText;
        if (revision === snapshotRevision) dirty = false;
        updateUrlForSavedState();
        if (!quiet) tell('INVESTIGATION SAVED LOCALLY — three workspaces + shared ledger.');
        return true;
      } catch (error) {
        tell(`NOT SAVED — ${error.message} Export to keep a copy.`);
        return false;
      } finally {
        render();
      }
    };

    const result = saveQueue.then(task, task);
    saveQueue = result.then(() => undefined, () => undefined);
    return result;
  }

  function changed(tool) {
    if (!ready || applying) return;
    const before = JSON.stringify(state);
    capture();
    if (tool) {
      const evidence = adapters[tool].evidence().filter(x => x.text.trim());
      if (JSON.stringify(evidence) !== JSON.stringify(state.evidence)) {
        state.evidence = evidence;
        applying = true;
        M.TECHNIQUES.filter(t => t !== tool).forEach(t => adapters[t].setEvidence(evidence));
        applying = false;
      }
      if (!state.techniquesUsed.includes(tool)) state.techniquesUsed.push(tool);
    }
    if (JSON.stringify(state) !== before) {
      markChanged();
      schedulePersist();
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
    if (state.currentTechnique === tool) return;
    state.currentTechnique = tool;
    if (!state.techniquesUsed.includes(tool)) state.techniquesUsed.push(tool);
    markChanged();
    schedulePersist();
    render();
  }

  function confirmReplace() {
    capture();
    return confirm('Replace the investigation currently on screen, including all THREE workspaces and the shared ledger? Export first if you need to keep it.');
  }

  async function initializeStorage() {
    let migration = null;
    try { migration = await Store.migrateLegacy(M); }
    catch (_) { /* Private Session remains usable if storage is unavailable. */ }

    if (requestedId) {
      try {
        const stored = await Store.get(requestedId);
        if (!stored) {
          tell('SAVED INVESTIGATION NOT FOUND — starting a new Private Session.');
          clearSavedUrl();
          return;
        }
        const next = M.decode(encoded(stored));
        expectedText = encoded(stored);
        privateMode = false;
        saveBlocked = false;
        dirty = false;
        apply(next);
        tell('LOCAL INVESTIGATION OPENED — auto-save active on this device.');
        return;
      } catch (error) {
        tell(`COULD NOT OPEN LOCAL INVESTIGATION — ${error.message} Private Session remains available.`);
        clearSavedUrl();
        return;
      }
    }

    if (migration?.migrated || migration?.existing) {
      tell('PREVIOUS SHARED PILOT MOVED TO MY INVESTIGATIONS — start fresh, import a file, or open your local investigations.');
    } else {
      tell('PRIVATE SESSION READY — start fresh, import a file, or start local save.');
    }
  }

  window.problemMePilot = {changed};
  document.querySelectorAll('button,input,select').forEach(el => el.disabled = true);

  M.TECHNIQUES.forEach(tool => {
    const frame = document.createElement('iframe');
    frames[tool] = frame;
    frame.title = tool === '5-whys' ? '5 Whys workspace' : tool === 'fishbone' ? 'Fishbone workspace' : 'Pareto workspace';
    frame.hidden = tool !== state.currentTechnique;
    frame.addEventListener('load', () => {
      const adapter = frame.contentWindow.investigationAdapter;
      if (!adapter) {
        tell('Workspace did not load. Check that all investigation files are hosted together.');
        return;
      }
      adapters[tool] = adapter;
      const resize = () => resizeFrame(frame);
      new ResizeObserver(resize).observe(frame.contentDocument.body);
      if (Object.keys(adapters).length === M.TECHNIQUES.length && !ready) {
        ready = true;
        document.querySelectorAll('button,input,select').forEach(el => el.disabled = false);
        apply(state);
        initializeStorage();
      }
      resize();
    });
    frame.src = `${tool}.html?investigation=1`;
    $('workspace').append(frame);
  });

  $('five').onclick = () => switchTo('5-whys');
  $('fish').onclick = () => switchTo('fishbone');
  $('pareto').onclick = () => switchTo('pareto');
  $('name').oninput = () => changed();
  $('status').onchange = () => changed();

  $('save').onclick = async () => {
    capture();
    markChanged();
    await persistSnapshot();
  };

  $('mode').onclick = async () => {
    capture();
    if (!privateMode) {
      if (dirty && !saveBlocked) await persistSnapshot({quiet:true});
      privateMode = true;
      clearTimeout(saveTimer);
      saveTimer = null;
      render();
      tell(saveBlocked
        ? 'PRIVATE SESSION — local save was paused because another tab changed the saved copy. Your current work remains in memory; export it to keep it.'
        : 'PRIVATE SESSION — the last saved local copy remains unchanged from this point forward.');
      return;
    }

    try {
      const stored = await Store.get(state.id);
      const storedText = stored ? encoded(stored) : null;
      const prompt = stored
        ? 'Save this Private Session over the existing local copy of this investigation? Export either copy first if needed.'
        : 'Save this investigation in My Investigations on this device?';
      if (!confirm(prompt)) return;
      expectedText = storedText;
      saveBlocked = false;
      privateMode = false;
      markChanged();
      const ok = await persistSnapshot();
      if (!ok) privateMode = true;
      render();
    } catch (_) {
      privateMode = true;
      render();
      tell('Browser investigation storage is unavailable. Private Session and export remain available.');
    }
  };

  $('export').onclick = () => {
    capture();
    try {
      const copy = M.clone(state);
      copy.updatedAt = new Date().toISOString();
      const blob = new Blob([M.encode(copy)], {type:'application/vnd.problemme+json'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = (state.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60) || 'problem-me-investigation') + '.problemme';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      tell('EXPORTED — all three workspaces and the shared ledger. The file is readable JSON; share it only as intended.');
    } catch (error) {
      tell(`EXPORT FAILED — ${error.message}`);
    }
  };

  $('import').onclick = () => { $('file').value = ''; $('file').click(); };
  $('file').onchange = async () => {
    const file = $('file').files[0];
    if (!file) return;
    try {
      if (file.size > M.LIMIT) throw new Error('File exceeds the 1 MiB limit.');
      const next = M.decode(await file.text());
      if (!confirmReplace()) return;
      clearTimeout(saveTimer);
      saveTimer = null;
      privateMode = true;
      expectedText = null;
      saveBlocked = false;
      revision += 1;
      dirty = true;
      apply(next);
      clearSavedUrl();
      tell('IMPORTED INTO PRIVATE SESSION — review it first, then START LOCAL SAVE to add it to My Investigations.');
    } catch (error) {
      tell(`IMPORT REJECTED — ${error.message}`);
    }
  };

  $('open').onclick = async () => {
    capture();
    if (privateMode && dirty && !confirm('Private Session changes are not saved locally. Open My Investigations anyway?')) return;
    if (!privateMode && dirty && !saveBlocked) await persistSnapshot({quiet:true});
    location.href = 'investigations.html';
  };

  $('new').onclick = () => {
    if (!confirmReplace()) return;
    clearTimeout(saveTimer);
    saveTimer = null;
    privateMode = true;
    expectedText = null;
    saveBlocked = false;
    dirty = false;
    revision += 1;
    apply(M.fresh());
    clearSavedUrl();
    tell('NEW PRIVATE INVESTIGATION — start working, export it, or start local save when ready.');
  };

  $('delete').onclick = async () => {
    capture();
    let stored = null;
    try { stored = await Store.get(state.id); }
    catch (_) {}
    if (!stored) {
      tell('NO LOCAL COPY FOUND — current work remains in this session.');
      return;
    }
    if (!confirm('Delete the local copy of this investigation from My Investigations? The current on-screen work will remain as a Private Session.')) return;
    try {
      await Store.remove(state.id);
      expectedText = null;
      privateMode = true;
      saveBlocked = false;
      dirty = true;
      clearSavedUrl();
      render();
      tell('LOCAL COPY DELETED — current work is now a Private Session. Export or start local save to keep it again.');
    } catch (_) {
      tell('COULD NOT DELETE LOCAL COPY — browser storage is unavailable.');
    }
  };

  $('examine').onclick = () => {
    capture();
    const [ci, ri] = $('cause').value.split(':').map(Number);
    const cause = state.toolData.fishbone.categories[ci]?.causes[ri]?.text;
    if (!cause) return;
    if (!confirm(`Use this cause as the 5 Whys problem statement?\n\n${cause}\n\nExisting WHY answers will remain for you to review.`)) return;
    state.toolData['5-whys'].problem = cause;
    state.history = [...state.history.slice(-49), {at:new Date().toISOString(), technique:'5-whys', action:'fishbone-cause-selected'}];
    applying = true;
    adapters['5-whys'].set(state.toolData['5-whys']);
    applying = false;
    switchTo('5-whys');
    tell('CAUSE SENT TO 5 WHYS — review any existing WHY answers for this new starting point.');
  };


  function selectedParetoCategory() {
    const index = Number($('paretoFocus').value);
    const row = state.toolData.pareto.rows[index];
    return row?.name?.trim() || '';
  }

  $('paretoWhy').onclick = () => {
    capture();
    const category = selectedParetoCategory();
    if (!category) return;
    if (!confirm(`Use this Pareto category as the 5 Whys problem statement?\n\n${category}\n\nExisting WHY answers will remain for you to review.`)) return;
    state.toolData['5-whys'].problem = category;
    state.history = [...state.history.slice(-49), {at:new Date().toISOString(), technique:'5-whys', action:'pareto-category-selected'}];
    applying = true;
    adapters['5-whys'].set(state.toolData['5-whys']);
    applying = false;
    switchTo('5-whys');
    tell('PARETO CATEGORY SENT TO 5 WHYS — investigate why this priority occurs.');
  };

  $('paretoFish').onclick = () => {
    capture();
    const category = selectedParetoCategory();
    if (!category) return;
    if (!confirm(`Use this Pareto category as the Fishbone effect / problem?\n\n${category}\n\nExisting Fishbone branches will remain for you to review.`)) return;
    state.toolData.fishbone.effect = category;
    state.history = [...state.history.slice(-49), {at:new Date().toISOString(), technique:'fishbone', action:'pareto-category-selected'}];
    applying = true;
    adapters.fishbone.set(state.toolData.fishbone);
    applying = false;
    switchTo('fishbone');
    tell('PARETO CATEGORY SENT TO FISHBONE — map plausible causes before narrowing with evidence.');
  };

  window.addEventListener('beforeunload', event => {
    if (!ready || !dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });
})();
