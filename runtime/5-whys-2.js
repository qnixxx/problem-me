
(() => {
  const STORAGE_KEY = 'problem-me:5-whys:v1';
  const PROBLEM_ME_PREFIXES = ['problem-me:', 'problemme_', 'problem.me:'];
  const MIN_WHYS = 1;
  const DEFAULT_WHYS = 5;
  const MAX_WHYS = 10;

  const fields = document.getElementById('whyFields');
  const problem = document.getElementById('problemInput');
  const root = document.getElementById('rootInput');
  const counter = document.getElementById('counterInput');
  const notes = document.getElementById('notesInput');
  const addBtn = document.getElementById('addWhyBtn');
  const removeBtn = document.getElementById('removeWhyBtn');
  const resetBtn = document.getElementById('resetBtn');
  const copyBtn = document.getElementById('copySummaryBtn');
  const printBtn = document.getElementById('printBtn');
  const chain = document.getElementById('liveChain');
  const status = document.getElementById('liveStatus');
  const tip = document.getElementById('liveTip');
  const rootPreview = document.getElementById('rootPreview');
  const counterPreview = document.getElementById('counterPreview');
  const actionStatus = document.getElementById('actionStatus');
  const workspaceShell = document.getElementById('workspaceShell');
  const saveModeLabel = document.getElementById('saveModeLabel');
  const privacyPanel = document.getElementById('privacyPanel');
  const privacyModeTitle = document.getElementById('privacyModeTitle');
  const privacyModeCopy = document.getElementById('privacyModeCopy');
  const privateSessionBtn = document.getElementById('privateSessionBtn');
  const restoreBtn = document.getElementById('restoreSaved5WhysBtn');
  const savedKeys = [STORAGE_KEY, 'problem-me:evidence:5-whys:v1'];
  const updateRestoreButton = () => ProblemMePrivateDefault.showRestore(restoreBtn, savedKeys, privateMode);
  const clearLocalDataBtn = document.getElementById('clearLocalDataBtn');
  const saveNoteTitle = document.getElementById('saveNoteTitle');
  const saveNoteText = document.getElementById('saveNoteText');

  const pdfReportTitle = document.getElementById('pdfReportTitle');
  const pdfMode = document.getElementById('pdfMode');
  const pdfGenerated = document.getElementById('pdfGenerated');
  const pdfProblem = document.getElementById('pdfProblem');
  const pdfWhyList = document.getElementById('pdfWhyList');
  const pdfRoot = document.getElementById('pdfRoot');
  const pdfEvidence = document.getElementById('pdfEvidence');
  const pdfCounter = document.getElementById('pdfCounter');
  const pdfNextStep = document.getElementById('pdfNextStep');
  const pdfFooterMode = document.getElementById('pdfFooterMode');

  const embedded = new URLSearchParams(location.search).get('investigation') === '1';
  let privateMode = true;

  function blankState() {
    return {
      problem: '',
      whys: Array.from({length: DEFAULT_WHYS}, () => ({text:'', verify:false})),
      root: '',
      countermeasure: '',
      notes: ''
    };
  }

  let state = blankState();

  function safeLoad(force = false) {
    if (embedded || (privateMode && !force)) return;
    try {
      const saved = JSON.parse(ProblemMeDraftStore.read(STORAGE_KEY));
      if (!saved || typeof saved !== 'object') return;
      state.problem = typeof saved.problem === 'string' ? saved.problem : '';
      state.root = typeof saved.root === 'string' ? saved.root : '';
      state.countermeasure = typeof saved.countermeasure === 'string' ? saved.countermeasure : '';
      state.notes = typeof saved.notes === 'string' ? saved.notes : '';
      if (Array.isArray(saved.whys) && saved.whys.length) {
        state.whys = saved.whys.slice(0, MAX_WHYS).map(item => ({
          text: typeof item?.text === 'string' ? item.text : '',
          verify: Boolean(item?.verify)
        }));
      }
    } catch (_) {}
  }

  function save() {
    if (privateMode) {
      actionStatus.textContent = 'PRIVATE SESSION — NOT SAVED_';
      return;
    }
    try {
      ProblemMeDraftStore.save(STORAGE_KEY, JSON.stringify(state));
      actionStatus.textContent = 'AUTO-SAVED LOCALLY_';
    } catch (error) {
      actionStatus.textContent = error?.code === 'CONFLICT' ? 'AUTO-SAVE PAUSED — ANOTHER TAB CHANGED THIS DRAFT_' : 'LOCAL SAVE UNAVAILABLE_';
    }
  }

  function clearProblemMeLocalData() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && PROBLEM_ME_PREFIXES.some(prefix => key.startsWith(prefix))) keys.push(key);
      }
      keys.forEach(key => localStorage.removeItem(key));
      return {ok:true, count:keys.length};
    } catch (_) {
      return {ok:false, count:0};
    }
  }

  function renderPrivacyMode() {
    workspaceShell.classList.toggle('is-private', privateMode);
    privacyPanel.classList.toggle('is-private', privateMode);
    privateSessionBtn.setAttribute('aria-pressed', privateMode ? 'true' : 'false');

    if (privateMode) {
      saveModeLabel.textContent = 'AUTO-SAVE: OFF / PRIVATE';
      privacyModeTitle.textContent = 'PRIVATE SESSION ACTIVE_';
      privacyModeCopy.textContent = 'problem.me will not write changes from this session to localStorage. Refreshing or closing this tab discards private changes; an older saved draft, if any, remains untouched.';
      privateSessionBtn.textContent = 'START LOCAL SAVE';
      updateRestoreButton();
      saveNoteTitle.textContent = 'NOT SAVED_';
      saveNoteText.textContent = 'Private Session keeps this investigation in page memory only and does not write it to localStorage. Copy or Print happens only when you choose those actions.';
    } else {
      saveModeLabel.textContent = 'AUTO-SAVE: ON';
      privacyModeTitle.textContent = 'LOCAL SAVE ACTIVE_';
      privacyModeCopy.textContent = 'Changes are auto-saved in this browser on this device.';
      privateSessionBtn.textContent = 'ENTER PRIVATE SESSION';
      updateRestoreButton();
      saveNoteTitle.textContent = 'LOCAL ONLY_';
      saveNoteText.textContent = 'The draft is stored with localStorage. Clearing browser/site data will remove it.';
    }
  }

  function esc(text) {
    return String(text).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }


  function prettyStamp() {
    const now = new Date();
    try {
      return now.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return now.toString();
    }
  }

  function shortForPdf(text, max) {
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  }

  function renderPdfReport() {
    pdfReportTitle.textContent = state.problem.trim()
      ? shortForPdf(state.problem.trim(), 58)
      : '5 Whys investigation';
    pdfMode.textContent = embedded ? 'Shared investigation' : privateMode ? 'Private Session' : 'Local save';
    pdfGenerated.textContent = prettyStamp();
    pdfProblem.textContent = state.problem.trim() || 'Not defined.';
    pdfWhyList.innerHTML = state.whys.map((w, i) => `
      <li>
        <span class="why-no">WHY #${i + 1}${w.verify ? '<span class="verify-flag">VERIFY THIS LINK</span>' : ''}</span>
        <div class="why-copy">${esc(w.text.trim() || '[not defined]')}</div>
      </li>
    `).join('');
    pdfRoot.textContent = state.root.trim() || 'Not defined.';
    pdfCounter.textContent = state.countermeasure.trim() || 'Not defined.';
    pdfEvidence.textContent = 'EVIDENCE / NOTES:\n' + (state.notes.trim() || 'Not defined.');
    pdfNextStep.textContent = privateMode
      ? 'CAPYBARA TAKEAWAY:\nCheck the investigation saving mode before you close this page.'
      : 'CAPYBARA TAKEAWAY:\nTarget the repeatable weakness, not only the symptom.';
    pdfFooterMode.textContent = embedded ? 'Saving is controlled by the shared investigation page.' : privateMode
      ? 'Private Session — generated without local saving.'
      : 'Generated locally in this browser.';
  }

  function renderWhyFields() {
    fields.innerHTML = state.whys.map((item, i) => `
      <div class="why-row" data-index="${i}">
        <div class="why-label">
          <span>WHY #${i + 1}_</span>
          <label class="verify-toggle"><input type="checkbox" data-verify="${i}" ${item.verify ? 'checked' : ''}> MARK AS ASSUMPTION / VERIFY</label>
        </div>
        <textarea data-why="${i}" aria-label="Why ${i + 1}" placeholder="Because...">${esc(item.text)}</textarea>
      </div>`).join('');

    removeBtn.disabled = state.whys.length <= MIN_WHYS;
    addBtn.disabled = state.whys.length >= MAX_WHYS;
  }

  function renderChain() {
    const nodes = [];
    nodes.push({label:'PROBLEM', text:state.problem || 'Describe the problem...', empty:!state.problem, verify:false});
    state.whys.forEach((item, i) => nodes.push({
      label:`WHY #${i + 1}`,
      text:item.text || 'Because...',
      empty:!item.text,
      verify:item.verify
    }));

    chain.innerHTML = nodes.map((node, i) => `
      ${i ? '<div class="chain-arrow">↓ WHY?</div>' : ''}
      <div class="chain-node${node.empty ? ' empty' : ''}${node.verify ? ' assumption' : ''}">
        <strong>${node.label}${node.verify ? ' / VERIFY' : ''}</strong>${esc(node.text)}
      </div>`).join('');

    const filled = state.whys.filter(w => w.text.trim()).length;
    const hasVerify = state.whys.some(w => w.verify);
    if (!state.problem.trim()) {
      status.textContent = 'STATUS: WAITING FOR PROBLEM';
      tip.textContent = 'TIP: Start with something observable. Avoid putting the suspected cause into the problem statement.';
    } else if (hasVerify) {
      status.textContent = 'STATUS: VERIFYING ASSUMPTIONS';
      tip.textContent = 'TIP: Good catch. A chain is only as strong as its least-supported link. Look for evidence before continuing.';
    } else if (filled === 0) {
      status.textContent = 'STATUS: SYMPTOM CAPTURED';
      tip.textContent = 'TIP: Ask why the problem occurred, then answer with a cause you can support.';
    } else if (filled < 3) {
      status.textContent = 'STATUS: ASKING WHY AGAIN';
      tip.textContent = 'TIP: Keep moving from event to condition. Avoid blaming a person when a process or control explains recurrence better.';
    } else if (filled < state.whys.length) {
      status.textContent = 'STATUS: FOLLOWING THE CHAIN';
      tip.textContent = 'TIP: Five is not magic. Stop if the chain branches, becomes speculation, or leaves the scope of the problem.';
    } else if (!state.root.trim()) {
      status.textContent = 'STATUS: CHECK THE EVIDENCE';
      tip.textContent = 'TIP: Before naming a root cause, ask whether the chain explains recurrence and whether each link is supported.';
    } else {
      status.textContent = 'STATUS: ROOT CAUSE CANDIDATE';
      tip.textContent = 'TIP: Treat this as a candidate until evidence supports it. A useful countermeasure should target the repeatable weakness.';
    }

    rootPreview.textContent = state.root.trim() || 'Not defined yet.';
    counterPreview.textContent = 'COUNTERMEASURE: ' + (state.countermeasure.trim() || 'Not defined yet.');
    renderPdfReport();
  }

  function syncFormFromState() {
    problem.value = state.problem;
    root.value = state.root;
    counter.value = state.countermeasure;
    notes.value = state.notes;
    renderWhyFields();
    renderChain();
  }

  function updateStateFromStaticFields() {
    state.problem = problem.value;
    state.root = root.value;
    state.countermeasure = counter.value;
    state.notes = notes.value;
    save();
    renderChain();
  }

  fields.addEventListener('input', e => {
    const el = e.target;
    if (el.matches('[data-why]')) {
      const i = Number(el.dataset.why);
      state.whys[i].text = el.value;
      save();
      renderChain();
    }
  });

  fields.addEventListener('change', e => {
    const el = e.target;
    if (el.matches('[data-verify]')) {
      const i = Number(el.dataset.verify);
      state.whys[i].verify = el.checked;
      save();
      renderChain();
    }
  });

  [problem, root, counter, notes].forEach(el => el.addEventListener('input', updateStateFromStaticFields));

  addBtn.addEventListener('click', () => {
    if (state.whys.length >= MAX_WHYS) return;
    state.whys.push({text:'', verify:false});
    save();
    renderWhyFields();
    renderChain();
    const last = fields.querySelector(`[data-why="${state.whys.length - 1}"]`);
    last?.focus();
  });

  removeBtn.addEventListener('click', () => {
    if (state.whys.length <= MIN_WHYS) return;
    const last = state.whys[state.whys.length - 1];
    if ((last.text.trim() || last.verify) && !window.confirm('Remove the last WHY and its content?')) return;
    state.whys.pop();
    save();
    renderWhyFields();
    renderChain();
  });

  privateSessionBtn.addEventListener('click', () => {
    if (embedded) return;
    if (!privateMode) {
      privateMode = true;
      renderPrivacyMode();
      actionStatus.textContent = 'PRIVATE SESSION — NOT SAVED_';
      return;
    }

    if (!ProblemMePrivateDefault.confirmLocalSave(savedKeys)) return;
    privateMode = false;
    renderPrivacyMode();
    save();
  });

  restoreBtn.addEventListener('click', () => {
    if (embedded || !privateMode) return;
    if (!ProblemMePrivateDefault.hasSaved(savedKeys)) { updateRestoreButton(); return; }
    if (!confirm('Open your saved 5 Whys draft and Evidence Ledger in this Private Session? Current unsaved work on screen will be replaced. Nothing will be saved until you choose Local Save.')) return;
    state = blankState();
    safeLoad(true);
    syncFormFromState();
    window.dispatchEvent(new Event('pm-restore-saved-draft'));
    actionStatus.textContent = 'SAVED DRAFT OPENED PRIVATELY — NOT RE-SAVED_';
  });
  clearLocalDataBtn.addEventListener('click', () => {
    if (embedded) return;
    const ok = window.confirm('Delete all standalone problem.me technique drafts in this browser — including 5 Whys, Fishbone, Pareto and Kepner–Tregoe — and clear this 5 Whys form? My Investigations are managed separately. This cannot be undone.');
    if (!ok) return;

    const result = clearProblemMeLocalData();
    if (!result.ok) {
      actionStatus.textContent = 'LOCAL DATA CLEAR FAILED_';
      return;
    }

    state = blankState();
    syncFormFromState();
    renderPrivacyMode();
    actionStatus.textContent = result.count ? `LOCAL DATA CLEARED — ${result.count} ITEM${result.count === 1 ? '' : 'S'}_` : 'NO SAVED LOCAL DATA FOUND_';
    window.dispatchEvent(new Event('pm-clear-all'));
    updateRestoreButton();
  });

  resetBtn.addEventListener('click', () => {
    const message = privateMode
      ? 'Reset this Private Session? The previously saved local draft, if any, will remain untouched.'
      : 'Reset this local 5 Whys draft?';
    if (!window.confirm(message)) return;

    state = blankState();
    if (!privateMode) {
      try { ProblemMeDraftStore.remove(STORAGE_KEY); } catch (_) {}
    }
    syncFormFromState();
    actionStatus.textContent = privateMode ? 'PRIVATE SESSION RESET — NOT SAVED_' : 'DRAFT RESET_';
  });

  function summaryText() {
    const lines = ['problem.me — 5 Whys summary', ''];
    lines.push('PROBLEM: ' + (state.problem.trim() || '[not defined]'));
    state.whys.forEach((w, i) => {
      lines.push(`WHY #${i + 1}: ${w.text.trim() || '[not defined]'}${w.verify ? '  [VERIFY]' : ''}`);
    });
    lines.push('', 'ROOT CAUSE CANDIDATE: ' + (state.root.trim() || '[not defined]'));
    lines.push('COUNTERMEASURE: ' + (state.countermeasure.trim() || '[not defined]'));
    if (state.notes.trim()) lines.push('', 'EVIDENCE / NOTES:', state.notes.trim());
    lines.push('', embedded ? 'Shared investigation — saving is controlled by the investigation page' : privateMode ? 'Private Session — not saved by problem.me' : 'Generated locally at problem.me');
    return lines.join('\n');
  }

  copyBtn.addEventListener('click', async () => {
    const text = summaryText();
    try {
      await navigator.clipboard.writeText(text);
      actionStatus.textContent = privateMode ? 'SUMMARY COPIED — PRIVATE SESSION_' : 'SUMMARY COPIED_';
    } catch (_) {
      const temp = document.createElement('textarea');
      temp.value = text;
      temp.setAttribute('readonly', '');
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      try { document.execCommand('copy'); actionStatus.textContent = privateMode ? 'SUMMARY COPIED — PRIVATE SESSION_' : 'SUMMARY COPIED_'; }
      catch (_) { actionStatus.textContent = 'COPY FAILED — SELECT MANUALLY_'; }
      temp.remove();
    }
  });

  printBtn.addEventListener('click', () => { renderPdfReport(); window.print(); });


  window.problemMeFiveWhys = {
    getState() {
      return JSON.parse(JSON.stringify(state));
    },
    setState(input) {
      const next = blankState();
      if (input && typeof input === 'object') {
        next.problem = typeof input.problem === 'string' ? input.problem : '';
        next.root = typeof input.root === 'string' ? input.root : '';
        next.countermeasure = typeof input.countermeasure === 'string' ? input.countermeasure : '';
        next.notes = typeof input.notes === 'string' ? input.notes : '';
        if (Array.isArray(input.whys) && input.whys.length) {
          next.whys = input.whys.slice(0, MAX_WHYS).map(item => ({
            text: typeof item?.text === 'string' ? item.text : '',
            verify: Boolean(item?.verify)
          }));
        }
      }
      state = next;
      syncFormFromState();
      save();
      return true;
    },
    isPrivate() {
      return privateMode;
    }
  };

  window.addEventListener('beforeprint', renderPdfReport);

  safeLoad();
  syncFormFromState();
  renderPrivacyMode();
})();

