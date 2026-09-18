(() => {
  'use strict';

  const M = ProblemMeInvestigation;
  const Store = ProblemMeInvestigationStore;
  const $ = id => document.getElementById(id);
  let investigations = [];

  function stamp(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'unknown';
    try {
      return date.toLocaleString(undefined, {year:'numeric', month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit'});
    } catch (_) {
      return date.toString();
    }
  }

  function techniqueName(value) {
    return value === '5-whys' ? '5 WHYS' : value === 'fishbone' ? 'FISHBONE' : String(value || '').toUpperCase();
  }

  function evidenceSummary(items) {
    const counts = {fact:0, assumption:0, test:0, result:0};
    (items || []).forEach(item => { if (counts[item.type] !== undefined && item.text?.trim()) counts[item.type] += 1; });
    return `${counts.fact} FACT${counts.fact === 1 ? '' : 'S'} · ${counts.assumption} ASSUMPTION${counts.assumption === 1 ? '' : 'S'} · ${counts.test} TEST${counts.test === 1 ? '' : 'S'} · ${counts.result} RESULT${counts.result === 1 ? '' : 'S'}`;
  }

  function safeInvestigation(value) {
    return M.decode(M.encode(value));
  }

  function downloadInvestigation(item) {
    const copy = M.clone(item);
    copy.updatedAt = new Date().toISOString();
    const blob = new Blob([M.encode(copy)], {type:'application/vnd.problemme+json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = (copy.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60) || 'problem-me-investigation') + '.problemme';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function button(text, className, handler) {
    const node = document.createElement('button');
    node.type = 'button';
    node.textContent = text;
    if (className) node.className = className;
    node.addEventListener('click', handler);
    return node;
  }

  function render() {
    const query = $('search').value.trim().toLowerCase();
    const status = $('status').value;
    const filtered = investigations.filter(item => {
      const title = (item.title || 'Untitled investigation').toLowerCase();
      return (!query || title.includes(query)) && (status === 'all' || item.status === status);
    });

    $('count').textContent = `${investigations.length} SAVED · ${filtered.length} SHOWN`;
    $('investigationList').replaceChildren();
    $('empty').hidden = filtered.length !== 0;
    if (!filtered.length) {
      if (investigations.length) {
        $('emptyTitle').textContent = 'NO MATCHING INVESTIGATIONS_';
        $('emptyCopy').textContent = 'Try a different search or status filter. Your other local investigations are still here.';
      } else {
        $('emptyTitle').textContent = 'NO LOCAL INVESTIGATIONS_';
        $('emptyCopy').innerHTML = 'Start a new problem, or import a <code>.problemme</code> file. Private Sessions do not appear here until you choose local save.';
      }
    }

    filtered.forEach(item => {
      const card = document.createElement('article');
      card.className = 'card';

      const main = document.createElement('div');
      main.className = 'card-main';
      const top = document.createElement('div');
      top.className = 'card-top';
      const statusBadge = document.createElement('span');
      statusBadge.className = `status ${item.status}`;
      statusBadge.textContent = item.status.toUpperCase();
      const id = document.createElement('span');
      id.className = 'muted';
      id.textContent = `ID ${item.id.slice(0, 8)}`;
      top.append(statusBadge, id);

      const title = document.createElement('h3');
      title.textContent = item.title.trim() || 'Untitled investigation';

      const meta = document.createElement('div');
      meta.className = 'meta';
      const updated = document.createElement('span');
      updated.innerHTML = '<strong>UPDATED</strong> ';
      updated.append(document.createTextNode(stamp(item.updatedAt)));
      const created = document.createElement('span');
      created.innerHTML = '<strong>CREATED</strong> ';
      created.append(document.createTextNode(stamp(item.createdAt)));
      meta.append(updated, created);

      const path = document.createElement('p');
      path.className = 'path';
      path.textContent = `TOOLS: ${(item.techniquesUsed || []).map(techniqueName).join(' → ') || techniqueName(item.currentTechnique)}`;
      const evidence = document.createElement('p');
      evidence.className = 'evidence-counts';
      evidence.textContent = `EVIDENCE: ${evidenceSummary(item.evidence)}`;
      main.append(top, title, meta, path, evidence);

      const actions = document.createElement('div');
      actions.className = 'card-actions';
      const continueLink = document.createElement('a');
      continueLink.className = 'button continue';
      continueLink.href = `investigation.html?id=${encodeURIComponent(item.id)}`;
      continueLink.textContent = 'CONTINUE →';
      actions.append(continueLink);
      actions.append(button('EXPORT', '', () => {
        try { downloadInvestigation(item); $('message').textContent = 'EXPORTED .PROBLEMME — keep it somewhere you trust.'; }
        catch (error) { $('message').textContent = `EXPORT FAILED — ${error.message}`; }
      }));
      actions.append(button('DUPLICATE', '', async () => {
        try {
          const copy = M.clone(item);
          const now = new Date().toISOString();
          copy.id = crypto.randomUUID();
          copy.title = `${item.title.trim() || 'Untitled investigation'} — Copy`.slice(0, 80);
          copy.createdAt = now;
          copy.updatedAt = now;
          copy.history = [...(copy.history || []).slice(-49), {at:now, technique:copy.currentTechnique, action:'duplicated'}];
          await Store.put(safeInvestigation(copy));
          $('message').textContent = 'INVESTIGATION DUPLICATED LOCALLY_';
          await refresh();
        } catch (error) { $('message').textContent = `DUPLICATE FAILED — ${error.message}`; }
      }));
      actions.append(button('DELETE', 'danger', async () => {
        if (!confirm(`Delete the local investigation “${item.title.trim() || 'Untitled investigation'}”? Export first if you need a backup.`)) return;
        try {
          await Store.remove(item.id);
          $('message').textContent = 'LOCAL INVESTIGATION DELETED_';
          await refresh();
        } catch (error) { $('message').textContent = `DELETE FAILED — ${error.message}`; }
      }));

      card.append(main, actions);
      $('investigationList').append(card);
    });
  }

  async function refresh() {
    try {
      const raw = await Store.list();
      investigations = [];
      for (const item of raw) {
        try { investigations.push(safeInvestigation(item)); }
        catch (_) { /* Ignore corrupt local records rather than breaking the whole library. */ }
      }
      render();
      if (!$('message').textContent.includes('MIGRATED')) $('message').textContent = investigations.length
        ? 'LOCAL INVESTIGATIONS READY — stored only in this browser on this device.'
        : 'NO LOCAL INVESTIGATIONS YET — start a problem or import a .problemme file.';
    } catch (error) {
      investigations = [];
      render();
      $('message').textContent = `LOCAL STORAGE UNAVAILABLE — ${error.message}`;
      $('import').disabled = true;
      $('clearAll').disabled = true;
    }
  }

  $('search').addEventListener('input', render);
  $('status').addEventListener('change', render);
  $('import').addEventListener('click', () => { $('file').value = ''; $('file').click(); });
  $('file').addEventListener('change', async () => {
    const file = $('file').files[0];
    if (!file) return;
    try {
      if (file.size > M.LIMIT) throw new Error('File exceeds the 1 MiB limit.');
      const next = M.decode(await file.text());
      const existing = await Store.get(next.id);
      if (existing && !confirm(`An investigation with this ID already exists locally. Replace “${existing.title || 'Untitled investigation'}” with the imported file?`)) return;
      next.updatedAt = new Date().toISOString();
      await Store.put(safeInvestigation(next));
      $('message').textContent = existing ? 'IMPORTED FILE REPLACED THE LOCAL COPY_' : 'IMPORTED INTO MY INVESTIGATIONS_';
      await refresh();
    } catch (error) {
      $('message').textContent = `IMPORT REJECTED — ${error.message}`;
    }
  });

  $('clearAll').addEventListener('click', async () => {
    if (!investigations.length) { $('message').textContent = 'NO LOCAL INVESTIGATIONS TO DELETE_'; return; }
    if (!confirm(`Delete all ${investigations.length} locally saved investigation${investigations.length === 1 ? '' : 's'} from this browser? Export anything important first. This cannot be undone.`)) return;
    try {
      await Store.clear();
      $('message').textContent = 'ALL LOCAL INVESTIGATIONS DELETED_';
      await refresh();
    } catch (error) {
      $('message').textContent = `DELETE FAILED — ${error.message}`;
    }
  });

  (async () => {
    try {
      const migration = await Store.migrateLegacy(M);
      if (migration.migrated) $('message').textContent = 'MIGRATED PREVIOUS SHARED PILOT INTO MY INVESTIGATIONS_';
      else if (migration.existing) $('message').textContent = 'PREVIOUS SHARED PILOT ALREADY EXISTS IN MY INVESTIGATIONS_';
    } catch (_) {}
    await refresh();
  })();
})();
