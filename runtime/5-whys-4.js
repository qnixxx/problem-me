
(() => {
  if (new URLSearchParams(location.search).get('investigation') === '1') return;
  const ACTIVE_KEY = 'problem-me:investigation:active:v1';
  const SCHEMA = 'problem.me/investigation';
  const SCHEMA_VERSION = 1;
  const APP_VERSION = '0.7.2';
  const TECHNIQUE = '5-whys';
  const MAX_FILE_BYTES = 1024 * 1024;

  const panel = document.getElementById('investigationPanel');
  const nameInput = document.getElementById('investigationName');
  const statusSelect = document.getElementById('investigationStatus');
  const idEl = document.getElementById('investigationId');
  const createdEl = document.getElementById('investigationCreated');
  const updatedEl = document.getElementById('investigationUpdated');
  const stateEl = document.getElementById('investigationState');
  const messageEl = document.getElementById('investigationMessage');
  const saveBtn = document.getElementById('saveInvestigationBtn');
  const exportBtn = document.getElementById('exportInvestigationBtn');
  const importBtn = document.getElementById('importInvestigationBtn');
  const fileInput = document.getElementById('investigationFileInput');
  const privateBtn = document.getElementById('privateSessionBtn');

  let meta = freshMeta();
  let savedFingerprint = null;

  function nowIso() {
    return new Date().toISOString();
  }

  function makeId() {
    if (window.crypto?.randomUUID) return crypto.randomUUID();
    return 'pm-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10);
  }

  function freshMeta() {
    const now = nowIso();
    return {
      id: makeId(),
      title: '',
      status: 'open',
      createdAt: now,
      updatedAt: '',
      history: [{at:now, technique:TECHNIQUE, action:'created'}]
    };
  }

  function isPrivate() {
    return Boolean(window.problemMeFiveWhys?.isPrivate?.());
  }

  function stamp(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    try {
      return d.toLocaleString(undefined, {
        year:'numeric', month:'short', day:'2-digit',
        hour:'2-digit', minute:'2-digit'
      });
    } catch (_) {
      return d.toString();
    }
  }

  function cleanTitle(value) {
    return String(value || '').trim().slice(0,80);
  }

  function safeFilename(value) {
    const base = cleanTitle(value) || 'problem-me-investigation';
    return base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'')
      .slice(0,60) || 'problem-me-investigation';
  }

  function titleFromProblem() {
    const p = String(window.problemMeFiveWhys?.getState?.().problem || '').trim();
    if (!p) return '';
    return p.length > 80 ? p.slice(0,79) + '…' : p;
  }

  function normalizeStatus(value) {
    return ['open','verifying','resolved','archived'].includes(value) ? value : 'open';
  }

  function readActiveSnapshotMeta() {
    try {
      const saved = JSON.parse(localStorage.getItem(ACTIVE_KEY));
      if (!validEnvelope(saved)) return;
      savedFingerprint = fingerprint(saved);
      meta = {
        id: String(saved.id || makeId()),
        title: cleanTitle(saved.title),
        status: normalizeStatus(saved.status),
        createdAt: saved.createdAt || nowIso(),
        updatedAt: saved.updatedAt || '',
        history: Array.isArray(saved.history) ? saved.history.slice(-50) : []
      };
    } catch (_) {}
  }

  function record(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function timestamp(value) {
    return typeof value === 'string'
      && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
      && Number.isFinite(Date.parse(value));
  }

  function validEnvelope(obj) {
    if (!record(obj) || obj.schema !== SCHEMA || obj.schemaVersion !== SCHEMA_VERSION) return false;
    if (obj.currentTechnique !== TECHNIQUE || !record(obj.toolData)) return false;
    if (typeof obj.appVersion !== 'string' || !obj.appVersion.trim()) return false;
    if (typeof obj.id !== 'string' || !obj.id.trim()) return false;
    if (typeof obj.title !== 'string' || obj.title.length > 80) return false;
    if (!['open','verifying','resolved','archived'].includes(obj.status)) return false;
    if (!timestamp(obj.createdAt) || !timestamp(obj.updatedAt)) return false;
    if (!Array.isArray(obj.techniquesUsed) || !obj.techniquesUsed.includes(TECHNIQUE)
        || !obj.techniquesUsed.every(x => typeof x === 'string' && x.trim())) return false;
    if (!Array.isArray(obj.history) || !obj.history.every(x => record(x)
        && timestamp(x.at) && typeof x.technique === 'string' && typeof x.action === 'string')) return false;
    const data = obj.toolData[TECHNIQUE];
    if (!record(data) || !['problem','root','countermeasure','notes'].every(k => typeof data[k] === 'string')) return false;
    if (!Array.isArray(data.whys) || data.whys.length < 1 || data.whys.length > 10
        || !data.whys.every(x => record(x) && typeof x.text === 'string' && typeof x.verify === 'boolean')) return false;
    return Array.isArray(obj.evidence) && obj.evidence.length <= 12
      && obj.evidence.every(x => record(x) && ['fact','assumption','test','result'].includes(x.type) && typeof x.text === 'string');
  }

  function fingerprint(envelope) {
    const d = envelope.toolData[TECHNIQUE];
    return JSON.stringify([envelope.id, envelope.title, envelope.status,
      d.problem, d.root, d.countermeasure, d.notes,
      d.whys.map(x => [x.text, x.verify]),
      envelope.evidence.filter(x => x.text.trim()).map(x => [x.type, x.text])]);
  }

  function capture({touch=true} = {}) {
    const title = cleanTitle(nameInput.value) || titleFromProblem() || 'Untitled investigation';
    const now = nowIso();


    const history = Array.isArray(meta.history) ? meta.history.slice(touch ? -49 : -50) : [];
    if (touch) history.push({at:now, technique:TECHNIQUE, action:'snapshot'});

    return {
      schema: SCHEMA,
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
      id: meta.id,
      title,
      status: normalizeStatus(statusSelect.value),
      createdAt: meta.createdAt,
      updatedAt: touch ? now : meta.updatedAt,
      currentTechnique: TECHNIQUE,
      techniquesUsed: [TECHNIQUE],
      history,
      toolData: {
        [TECHNIQUE]: window.problemMeFiveWhys?.getState?.() || {}
      },
      evidence: window.problemMeEvidence?.getState?.() || []
    };
  }

  function render() {
    panel.classList.toggle('is-private', isPrivate());
    idEl.textContent = meta.id || '—';
    createdEl.textContent = stamp(meta.createdAt);
    updatedEl.textContent = stamp(meta.updatedAt);

    if (isPrivate()) {
      stateEl.innerHTML = '<strong>PRIVATE SESSION</strong><br>local snapshot saving disabled';
      saveBtn.disabled = true;
      saveBtn.textContent = 'SAVE DISABLED IN PRIVATE';
    } else if (savedFingerprint === fingerprint(capture({touch:false}))) {
      stateEl.innerHTML = '<strong>SAVED INVESTIGATION</strong><br>pilot local snapshot';
      saveBtn.disabled = false;
      saveBtn.textContent = 'SAVE INVESTIGATION';
    } else {
      stateEl.innerHTML = savedFingerprint
        ? '<strong>UNSAVED SNAPSHOT</strong><br>current workspace differs from saved snapshot'
        : '<strong>UNSAVED SNAPSHOT</strong><br>save the current investigation when ready';
      saveBtn.disabled = false;
      saveBtn.textContent = 'SAVE INVESTIGATION';
    }
  }

  function saveLocal() {
    if (isPrivate()) {
      messageEl.innerHTML = '<strong>PRIVATE SESSION:</strong> local investigation saving is disabled. Export still works.';
      return;
    }
    const envelope = capture({touch:true});

    try {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(envelope));
      meta = {...meta, title:envelope.title, status:envelope.status, updatedAt:envelope.updatedAt, history:envelope.history};
      nameInput.value = envelope.title;
      savedFingerprint = fingerprint(envelope);
      messageEl.textContent = 'INVESTIGATION SNAPSHOT SAVED_';
      render();
    } catch (_) {
      messageEl.textContent = 'INVESTIGATION SAVE UNAVAILABLE_';
    }
  }

  function exportFile() {
    const envelope = capture({touch:false});
    envelope.updatedAt = nowIso();
    const json = JSON.stringify(envelope, null, 2);
    const blob = new Blob([json], {type:'application/vnd.problemme+json'});
    if (blob.size > MAX_FILE_BYTES) {
      messageEl.textContent = 'EXPORT TOO LARGE — REDUCE CONTENT TO FIT THE 1 MiB IMPORT LIMIT_';
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFilename(envelope.title) + '.problemme';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    messageEl.textContent = isPrivate()
      ? 'PRIVATE INVESTIGATION EXPORTED — NOT SAVED LOCALLY_'
      : 'INVESTIGATION EXPORTED_';
  }

  function workingDataExists() {
    const tool = window.problemMeFiveWhys?.getState?.() || {};
    const evidence = window.problemMeEvidence?.getState?.() || [];
    return Boolean(
      nameInput.value.trim() || statusSelect.value !== 'open'
      || String(tool.problem || '').trim()
      || String(tool.root || '').trim()
      || String(tool.countermeasure || '').trim()
      || String(tool.notes || '').trim()
      || (Array.isArray(tool.whys) && tool.whys.some(w => String(w?.text || '').trim()))
      || evidence.some(x => String(x?.text || '').trim())
    );
  }

  async function importFile(file) {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      messageEl.textContent = 'IMPORT REJECTED — FILE TOO LARGE_';
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch (_) {
      messageEl.textContent = 'IMPORT REJECTED — NOT VALID JSON_';
      return;
    }

    if (!validEnvelope(parsed)) {
      messageEl.textContent = 'IMPORT REJECTED — UNSUPPORTED .PROBLEMME FORMAT_';
      return;
    }

    if (workingDataExists()) {
      const ok = confirm(`Open "${cleanTitle(parsed.title) || 'Untitled investigation'}" and replace the current 5 Whys workspace and Evidence Ledger?`);
      if (!ok) return;
    }

    meta = {
      id: String(parsed.id || makeId()),
      title: cleanTitle(parsed.title),
      status: normalizeStatus(parsed.status),
      createdAt: parsed.createdAt || nowIso(),
      updatedAt: parsed.updatedAt || '',
      history: Array.isArray(parsed.history) ? parsed.history.slice(-50) : []
    };

    window.problemMeFiveWhys?.setState?.(parsed.toolData[TECHNIQUE]);
    window.problemMeEvidence?.setState?.(parsed.evidence || []);

    nameInput.value = meta.title;
    statusSelect.value = meta.status;

    let stored = false;
    savedFingerprint = null;
    if (!isPrivate()) {
      try {
        localStorage.setItem(ACTIVE_KEY, JSON.stringify(parsed));
        savedFingerprint = fingerprint(parsed);
        stored = true;
      } catch (_) {}
    }

    render();
    messageEl.textContent = isPrivate()
      ? 'INVESTIGATION IMPORTED INTO PRIVATE SESSION — NOT SAVED_'
      : stored ? 'INVESTIGATION IMPORTED_' : 'IMPORTED — SNAPSHOT SAVE FAILED; EXPORT TO KEEP A COPY_';
    document.dispatchEvent(new Event('change'));
  }

  saveBtn.addEventListener('click', saveLocal);
  exportBtn.addEventListener('click', exportFile);
  importBtn.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });
  fileInput.addEventListener('change', () => importFile(fileInput.files?.[0]));

  nameInput.addEventListener('input', () => {
    meta.title = cleanTitle(nameInput.value);
    messageEl.textContent = 'INVESTIGATION METADATA CHANGED — SAVE WHEN READY_';
  });
  statusSelect.addEventListener('change', () => {
    meta.status = normalizeStatus(statusSelect.value);
    messageEl.textContent = 'INVESTIGATION STATUS CHANGED — SAVE WHEN READY_';
  });

  privateBtn?.addEventListener('click', () => {
    setTimeout(() => {
      render();
      messageEl.textContent = isPrivate()
        ? 'PRIVATE SESSION — EXPORT/IMPORT AVAILABLE, LOCAL SNAPSHOT DISABLED_'
        : 'LOCAL SAVE RESTORED_';
    }, 0);
  });

  window.addEventListener('pm-clear-all', () => {
    meta = freshMeta();
    savedFingerprint = null;
    nameInput.value = '';
    statusSelect.value = 'open';
    render();
    messageEl.textContent = 'INVESTIGATION SNAPSHOT CLEARED WITH LOCAL DATA_';
  });

  ['input','change'].forEach(type => document.addEventListener(type, render));
  document.addEventListener('click', () => setTimeout(render, 0));

  window.addEventListener('pm-restore-saved-draft', () => {
    readActiveSnapshotMeta();
    nameInput.value = meta.title;
    statusSelect.value = meta.status;
    render();
  });
  if (!isPrivate()) readActiveSnapshotMeta();
  nameInput.value = meta.title;
  statusSelect.value = meta.status;
  render();
})();

