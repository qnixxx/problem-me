
(() => {
  const LEDGER_KEY = 'problem-me:evidence:kepner-tregoe:v1';
  const SOURCE = 'kepner-tregoe';
  const MAX_ROWS = 12;
  const rowsEl = document.getElementById('pmEvidenceRows');
  const countsEl = document.getElementById('pmEvidenceCounts');
  const statusEl = document.getElementById('pmEvidenceStatus');
  const tipEl = document.getElementById('pmEvidenceTip');
  const printRows = document.getElementById('pmEvidencePrintRows');
  const addBtn = document.getElementById('pmEvidenceAdd');
  const copyBtn = document.getElementById('pmEvidenceCopy');
  const clearBtn = document.getElementById('pmEvidenceClear');
  const privacyPanel = document.getElementById('ktPrivacyPanel');
  const privateBtn = document.getElementById('ktPrivateBtn');
  const mainClearBtn = document.getElementById('ktClearDataBtn');
  const pageStatus = document.getElementById('ktActionStatus');
  const handoffSeed = document.getElementById('pmHandoffSeed');
  const handoffCopy = document.getElementById('pmHandoffCopy');
  const handoffOne = document.getElementById('pmHandoffOne');
  const handoffTwo = document.getElementById('pmHandoffTwo');

  let ledger = [{type:'fact', text:''}];

  function esc(x) {
    return String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function isPrivate() {
    return Boolean(privacyPanel?.classList.contains('is-private'));
  }
  function normalizeType(x) {
    return ['fact','assumption','test','result'].includes(x) ? x : 'fact';
  }
  function loadLedger(force = false) {
    if (isPrivate() && !force) return;
    try {
      const saved = JSON.parse(ProblemMeDraftStore.read(LEDGER_KEY));
      if (Array.isArray(saved) && saved.length) {
        ledger = saved.slice(0,MAX_ROWS).map(x => ({type:normalizeType(x?.type), text:typeof x?.text==='string'?x.text:''}));
      }
    } catch (_) {}
  }
  function saveLedger() {
    if (isPrivate()) {
      statusEl.textContent = 'PRIVATE SESSION — LEDGER NOT SAVED_';
      return;
    }
    try {
      ProblemMeDraftStore.save(LEDGER_KEY, JSON.stringify(ledger));
      statusEl.textContent = 'LEDGER AUTO-SAVED_';
    } catch (_) {
      statusEl.textContent = 'LEDGER SAVE UNAVAILABLE_';
    }
  }
  function filled() {
    return ledger.filter(x => x.text.trim());
  }
  function renderLedger() {
    rowsEl.innerHTML = ledger.map((item,i) => `
      <div class="pm-evidence-row" data-type="${item.type}">
        <select data-pm-type="${i}" aria-label="Evidence type ${i+1}">
          <option value="fact"${item.type==='fact'?' selected':''}>FACT</option>
          <option value="assumption"${item.type==='assumption'?' selected':''}>ASSUMPTION</option>
          <option value="test"${item.type==='test'?' selected':''}>TEST</option>
          <option value="result"${item.type==='result'?' selected':''}>RESULT</option>
        </select>
        <input data-pm-text="${i}" type="text" maxlength="180" placeholder="What do you know, assume, test, or observe?" value="${esc(item.text)}">
        <button class="pm-evidence-remove" data-pm-remove="${i}" type="button" aria-label="Remove evidence row ${i+1}">×</button>
      </div>`).join('');
    renderLedgerSummary();
  }

  function renderLedgerSummary() {
    addBtn.disabled = ledger.length >= MAX_ROWS;
    const items = filled();
    const counts = {fact:0,assumption:0,test:0,result:0};
    items.forEach(x => counts[x.type]++);
    countsEl.innerHTML = items.length
      ? `<strong>${items.length} ITEMS</strong><br>FACT ${counts.fact} · ASSUME ${counts.assumption} · TEST ${counts.test} · RESULT ${counts.result}`
      : 'NO EVIDENCE LOGGED';

    if (!items.length) {
      tipEl.innerHTML = '<strong>CAPYBARA.EXE:</strong> Claims are cheaper than evidence. Log what you actually know.';
    } else if (counts.assumption > counts.fact + counts.result) {
      tipEl.innerHTML = '<strong>CAPYBARA.EXE:</strong> Too many hypotheses wearing fake moustaches. Add facts, tests, or results.';
    } else if (counts.test && !counts.result) {
      tipEl.innerHTML = '<strong>CAPYBARA.EXE:</strong> Tests without results are just appointments. Record what happened.';
    } else if (counts.result) {
      tipEl.innerHTML = '<strong>CAPYBARA.EXE:</strong> Good. Let results change the story when they disagree with the theory.';
    } else {
      tipEl.innerHTML = '<strong>CAPYBARA.EXE:</strong> Keep facts and assumptions visibly separate. Future-you will appreciate it.';
    }

    printRows.innerHTML = items.length
      ? items.map(x => `<tr><td>${x.type.toUpperCase()}</td><td>${esc(x.text.trim())}</td></tr>`).join('')
      : '<tr><td>—</td><td>No evidence ledger entries recorded.</td></tr>';
  }

  rowsEl.addEventListener('input', e => {
    if (e.target.dataset.pmText !== undefined) {
      ledger[Number(e.target.dataset.pmText)].text = e.target.value;
      saveLedger();
      renderLedgerSummary();
    }
  });
  rowsEl.addEventListener('change', e => {
    if (e.target.dataset.pmType !== undefined) {
      ledger[Number(e.target.dataset.pmType)].type = normalizeType(e.target.value);
      saveLedger();
      renderLedger();
    }
  });
  rowsEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-pm-remove]');
    if (!btn) return;
    const i = Number(btn.dataset.pmRemove);
    if (ledger.length === 1) {
      ledger = [{type:'fact',text:''}];
    } else {
      ledger.splice(i,1);
    }
    saveLedger();
    renderLedger();
  });
  addBtn.addEventListener('click', () => {
    if (ledger.length >= MAX_ROWS) return;
    ledger.push({type:'fact',text:''});
    saveLedger();
    renderLedger();
    rowsEl.querySelector(`[data-pm-text="${ledger.length-1}"]`)?.focus();
  });
  clearBtn.addEventListener('click', () => {
    if (!confirm('Clear this evidence ledger?')) return;
    ledger = [{type:'fact',text:''}];
    if (!isPrivate()) {
      try { ProblemMeDraftStore.remove(LEDGER_KEY); } catch (_) {}
    }
    renderLedger();
    statusEl.textContent = isPrivate() ? 'PRIVATE LEDGER CLEARED_' : 'LEDGER CLEARED_';
  });
  copyBtn.addEventListener('click', async () => {
    const items = filled();
    const text = ['problem.me — Evidence Ledger','', ...items.map((x,i)=>`${i+1}. [${x.type.toUpperCase()}] ${x.text.trim()}`)].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      statusEl.textContent = 'LEDGER COPIED_';
    } catch (_) {
      const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();
      try {document.execCommand('copy');statusEl.textContent='LEDGER COPIED_';} catch (_) {statusEl.textContent='COPY FAILED_';}
      t.remove();
    }
  });

  privateBtn?.addEventListener('click', () => {
    setTimeout(() => {
      if (!isPrivate()) saveLedger();
      statusEl.textContent = isPrivate() ? 'PRIVATE SESSION — LEDGER NOT SAVED_' : 'LEDGER AUTO-SAVED_';
    }, 0);
  });

  window.addEventListener('pm-restore-saved-draft', () => {
    ledger = [{type:'fact', text:''}];
    loadLedger(true);
    renderLedger();
    statusEl.textContent = 'SAVED EVIDENCE OPENED PRIVATELY — NOT RE-SAVED_';
  });
  window.addEventListener('pm-clear-all', () => {
    ledger = [{type:'fact',text:''}];
    renderLedger();
    statusEl.textContent = 'LEDGER CLEARED WITH LOCAL DATA_';
  });

  function handoffState() {
    const deviation=(document.getElementById('ktDeviation')?.value||'').trim();
const callout=(document.querySelector('#ktProblemCallout span')?.textContent||'').trim();
let best='';
if(callout && !/No tested|Complete more/i.test(callout)) best=callout.split(' fits ')[0].trim();
const seed=best||deviation;
return {seed,one:{target:'5-whys.html',label:'FOLLOW BEST FIT → 5 WHYS',seed},two:{target:'fishbone.html',label:'MAP ALTERNATIVE CAUSES → FISHBONE',seed:deviation||seed},copy:seed?'Carry the current deviation or best-fit cause into a complementary causal method.':'Complete enough Problem Analysis to produce a useful causal handoff.'};
  }
  function refreshHandoff() {
    const h = handoffState();
    handoffSeed.textContent = h.seed || 'Complete more of the investigation to create a useful handoff.';
    handoffCopy.textContent = h.copy;
    [[handoffOne,h.one],[handoffTwo,h.two]].forEach(([btn,item]) => {
      btn.textContent = item.label;
      btn.disabled = !item.seed;
      btn.dataset.target = item.target;
      btn.dataset.seed = item.seed || '';
    });
  }
  function goHandoff(btn) {
    if (btn.disabled) return;
    void ProblemMeHandoff.navigate({
      target:btn.dataset.target,
      seed:btn.dataset.seed || '',
      from:SOURCE,
      privateMode:isPrivate()
    });
  }
  handoffOne.addEventListener('click', () => goHandoff(handoffOne));
  handoffTwo.addEventListener('click', () => goHandoff(handoffTwo));
  document.addEventListener('input', e => {
    if (!e.target.closest('.pm-evidence')) refreshHandoff();
  });
  document.addEventListener('change', e => {
    if (!e.target.closest('.pm-evidence')) refreshHandoff();
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.pm-evidence') && !e.target.closest('.pm-handoff')) setTimeout(refreshHandoff,0);
  });

  function consumeIncomingHandoff() {
    if (new URLSearchParams(location.search).get('investigation') === '1') return;
    const incoming = ProblemMeHandoff.take();
    if (!incoming) return;
    if (incoming.privateMode && !isPrivate()) privateBtn?.click();
    if (!incoming.seed) {
      if (pageStatus) pageStatus.textContent = 'PRIVATE HANDOFF READY — PASTE COPIED TEXT_';
      return;
    }
    const field = document.getElementById('ktDeviation');
    if (field) {
      const current = (field.value || '').trim();
      const useIt = !current || confirm(`A handoff from ${incoming.from} is ready:\n\n"${incoming.seed}"\n\nReplace the current starting field with this context?`);
      if (useIt) {
        field.value = incoming.seed;
        field.dispatchEvent(new Event('input', {bubbles:true}));
        if (pageStatus) pageStatus.textContent = 'HANDOFF RECEIVED_';
      }
    }
  }

  loadLedger();
  renderLedger();
  refreshHandoff();
  consumeIncomingHandoff();
})();

