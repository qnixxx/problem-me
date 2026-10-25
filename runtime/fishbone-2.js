
(() => {
  const STORAGE_KEY = 'problemme_fishbone_v04';
  const CATEGORY_COUNT = 6;
  const MIN_CAUSES = 1;
  const MAX_CAUSES = 5;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const defaults = [
    'People',
    'Process',
    'Tools / Systems',
    'Environment',
    'Inputs',
    'Measurement'
  ];

  const effect = document.getElementById('fbEffect');
  const categoriesEl = document.getElementById('fbCategories');
  const supported = document.getElementById('fbSupported');
  const nextTest = document.getElementById('fbNextTest');
  const notes = document.getElementById('fbNotes');
  const svg = document.getElementById('fbLiveSvg');
  const status = document.getElementById('fbStatus');
  const tip = document.getElementById('fbTip');
  const actionStatus = document.getElementById('fbActionStatus');
  const copyBtn = document.getElementById('fbCopyBtn');
  const printBtn = document.getElementById('fbPrintBtn');
  const resetBtn = document.getElementById('fbResetBtn');

  const toolShell = document.querySelector('.fb-tool');
  const localMode = document.getElementById('fbLocalMode');
  const privacyPanel = document.getElementById('fbPrivacyPanel');
  const privacyTitle = document.getElementById('fbPrivacyTitle');
  const privacyCopy = document.getElementById('fbPrivacyCopy');
  const privateBtn = document.getElementById('fbPrivateBtn');
  const restoreBtn = document.getElementById('fbRestoreSavedBtn');
  const savedKeys = [STORAGE_KEY, 'problem-me:evidence:fishbone:v1'];
  const updateRestoreButton = () => ProblemMePrivateDefault.showRestore(restoreBtn, savedKeys, privateMode);
  const clearDataBtn = document.getElementById('fbClearDataBtn');

  const pdfCount = document.getElementById('fbPdfCount');
  const pdfGenerated = document.getElementById('fbPdfGenerated');
  const pdfEffect = document.getElementById('fbPdfEffect');
  const pdfDiagram = document.getElementById('fbPdfDiagram');
  const pdfFamilies = document.getElementById('fbPdfFamilies');
  const pdfSupported = document.getElementById('fbPdfSupported');
  const pdfNextTest = document.getElementById('fbPdfNextTest');
  const pdfNotes = document.getElementById('fbPdfNotes');

  const embedded = new URLSearchParams(location.search).get('investigation') === '1';
  let privateMode = true;
  let state = makeDefaultState();


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

  function pdfStatusLabel(status) {
    if (status === 'no') return 'NO';
    if (status === 'likely') return 'LIKELY';
    if (status === 'confirmed') return 'CONFIRMED';
    return 'UNTESTED';
  }

  function renderPdfReport() {
    const allCauses = state.categories.flatMap(category =>
      category.causes.filter(cause => cause.text.trim())
    );

    pdfCount.textContent = String(allCauses.length);
    pdfGenerated.textContent = prettyStamp();
    pdfEffect.textContent = state.effect.trim() || 'Not defined.';
    pdfSupported.textContent = state.supported.trim() || 'Not defined.';
    pdfNextTest.textContent = state.nextTest.trim() || 'Not defined.';
    pdfNotes.textContent = 'EVIDENCE / NOTES:\n' + (state.notes.trim() || 'Not defined.');

    pdfFamilies.innerHTML = state.categories.map((category, ci) => {
      const filled = category.causes.filter(cause => cause.text.trim());
      const items = filled.length
        ? filled.map(cause => `
            <li>
              <span class="fb-pdf-badge ${cause.status}">[${pdfStatusLabel(cause.status)}]</span>
              ${esc(cause.text.trim())}
            </li>
          `).join('')
        : '<li><span class="fb-pdf-badge">[EMPTY]</span>No hypotheses recorded.</li>';

      return `
        <section class="fb-pdf-family">
          <h3>${String(ci + 1).padStart(2,'0')} // ${esc(category.name || `Category ${ci + 1}`)}</h3>
          <ul>${items}</ul>
        </section>
      `;
    }).join('');

    pdfDiagram.innerHTML = '';
    const clone = svg.cloneNode(true);
    clone.removeAttribute('id');
    clone.setAttribute('aria-hidden', 'true');
    pdfDiagram.appendChild(clone);
  }


  function renderPrivacyMode() {
    toolShell.classList.toggle('is-private', privateMode);
    privacyPanel.classList.toggle('is-private', privateMode);
    privateBtn.setAttribute('aria-pressed', privateMode ? 'true' : 'false');
    if (privateMode) {
      privacyTitle.textContent = 'PRIVATE SESSION ACTIVE_';
      privacyCopy.textContent = 'problem.me will not write changes from this session to localStorage. Refreshing or closing this tab discards private changes; an older saved draft, if any, remains untouched.';
      privateBtn.textContent = 'START LOCAL SAVE';
      updateRestoreButton();
      localMode.innerHTML = '<strong>PRIVATE SESSION</strong><br>not saved on this device';
    } else {
      privacyTitle.textContent = 'LOCAL SAVE ACTIVE_';
      privacyCopy.textContent = 'Changes are auto-saved in this browser on this device.';
      privateBtn.textContent = 'ENTER PRIVATE SESSION';
      updateRestoreButton();
      localMode.innerHTML = '<strong>LOCAL WORKSPACE</strong><br>saved on this device';
    }
  }

  function clearProblemMeLocalData() {
    try {
      const prefixes = ['problem-me:', 'problemme_', 'problem.me:'];
      const keys = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && prefixes.some(prefix => key.startsWith(prefix))) keys.push(key);
      }
      keys.forEach(key => localStorage.removeItem(key));
      return {ok:true, count:keys.length};
    } catch (_) {
      return {ok:false, count:0};
    }
  }

  function makeDefaultState() {
    return {
      effect: '',
      categories: defaults.map(name => ({
        name,
        causes: [
          { text: '', status: 'untested' },
          { text: '', status: 'untested' }
        ]
      })),
      supported: '',
      nextTest: '',
      notes: ''
    };
  }

  function esc(text) {
    return String(text).replace(/[&<>'"]/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
    }[c]));
  }

  function normalizeStatus(value) {
    return ['untested','no','likely','confirmed'].includes(value) ? value : 'untested';
  }

  function safeLoad(force = false) {
    if (embedded || (privateMode && !force)) return;
    try {
      const saved = JSON.parse(ProblemMeDraftStore.read(STORAGE_KEY));
      if (!saved || typeof saved !== 'object') return;
      const next = makeDefaultState();
      next.effect = typeof saved.effect === 'string' ? saved.effect : '';
      next.supported = typeof saved.supported === 'string' ? saved.supported : '';
      next.nextTest = typeof saved.nextTest === 'string' ? saved.nextTest : '';
      next.notes = typeof saved.notes === 'string' ? saved.notes : '';

      if (Array.isArray(saved.categories)) {
        next.categories = Array.from({length:CATEGORY_COUNT}, (_, i) => {
          const src = saved.categories[i] || {};
          const name = typeof src.name === 'string' && src.name.trim() ? src.name : defaults[i];
          let causes = Array.isArray(src.causes) ? src.causes.slice(0, MAX_CAUSES).map(item => ({
            text: typeof item?.text === 'string' ? item.text : '',
            status: normalizeStatus(item?.status)
          })) : [];
          if (!causes.length) causes = [{text:'',status:'untested'}];
          return { name, causes };
        });
      }
      state = next;
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

  function renderCategories() {
    categoriesEl.innerHTML = state.categories.map((category, ci) => `
      <section class="fb-category" data-category="${ci}">
        <div class="fb-category-head">
          <span class="fb-cat-no">${String(ci + 1).padStart(2,'0')}</span>
          <input type="text" data-cat-name="${ci}" aria-label="Cause family ${ci + 1} name" value="${esc(category.name)}" maxlength="28">
        </div>
        <div class="fb-causes">
          ${category.causes.map((cause, ri) => `
            <div class="fb-cause-row" data-status="${cause.status}">
              <input type="text" data-cause="${ci}:${ri}" aria-label="${esc(category.name)} cause ${ri + 1}" placeholder="possible cause..." value="${esc(cause.text)}" maxlength="70">
              <select data-cause-status="${ci}:${ri}" aria-label="${esc(category.name)} cause ${ri + 1} evidence status">
                <option value="untested"${cause.status === 'untested' ? ' selected' : ''}>UNTESTED</option>
                <option value="no"${cause.status === 'no' ? ' selected' : ''}>NO</option>
                <option value="likely"${cause.status === 'likely' ? ' selected' : ''}>LIKELY</option>
                <option value="confirmed"${cause.status === 'confirmed' ? ' selected' : ''}>CONFIRMED</option>
              </select>
            </div>`).join('')}
        </div>
        <div class="fb-cat-actions">
          <button class="fb-mini-btn" type="button" data-add-cause="${ci}" ${category.causes.length >= MAX_CAUSES ? 'disabled' : ''}>+ CAUSE</button>
          <button class="fb-mini-btn" type="button" data-remove-cause="${ci}" ${category.causes.length <= MIN_CAUSES ? 'disabled' : ''}>− LAST</button>
        </div>
      </section>
    `).join('');
  }

  function svgEl(name, attrs = {}, text = '') {
    const el = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v));
    if (text) el.textContent = text;
    return el;
  }

  function short(text, n) {
    const value = String(text || '').trim();
    if (!value) return '';
    return value.length > n ? value.slice(0, n - 1) + '…' : value;
  }

  function branchClass(category) {
    const statuses = category.causes.filter(c => c.text.trim()).map(c => c.status);
    if (statuses.includes('confirmed')) return 'confirmed';
    if (statuses.includes('likely')) return 'likely';
    if (statuses.length && statuses.every(s => s === 'no')) return 'no';
    return 'untested';
  }

  function renderSvg() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // Tail and spine.
    svg.appendChild(svgEl('path', {class:'tail', d:'M110 310 L42 250 L62 310 L42 370 Z'}));
    svg.appendChild(svgEl('line', {class:'spine', x1:'62', y1:'310', x2:'925', y2:'310'}));

    // Fish head / effect.
    svg.appendChild(svgEl('path', {
      class:'head-shape',
      d:'M925 232 Q1026 232 1062 310 Q1026 388 925 388 Q960 310 925 232 Z'
    }));
    svg.appendChild(svgEl('circle', {cx:'1020', cy:'278', r:'4', fill:'var(--yellow)'}));

    const effectLines = wrapEffect(state.effect || 'YOUR EFFECT', 16, 3);
    effectLines.forEach((line, i) => {
      svg.appendChild(svgEl('text', {
        class:'effect',
        x:'952',
        y:String(303 + i * 18),
        'text-anchor':'middle'
      }, line.toUpperCase()));
    });
    svg.appendChild(svgEl('text', {class:'small', x:'952', y:'367', 'text-anchor':'middle'}, 'EFFECT'));

    // Capybara near the tail.
    const g = svgEl('g', {transform:'translate(72 274) scale(.48)'});
    g.appendChild(svgEl('ellipse', {class:'cap-line cap-fill', cx:'76', cy:'56', rx:'60', ry:'34'}));
    g.appendChild(svgEl('rect', {class:'cap-line cap-fill', x:'40', y:'83', width:'20', height:'24'}));
    g.appendChild(svgEl('rect', {class:'cap-line cap-fill', x:'91', y:'83', width:'20', height:'24'}));
    g.appendChild(svgEl('ellipse', {class:'cap-line cap-fill', cx:'126', cy:'45', rx:'38', ry:'30'}));
    g.appendChild(svgEl('circle', {class:'cap-line cap-fill', cx:'112', cy:'17', r:'10'}));
    g.appendChild(svgEl('line', {class:'cap-line', x1:'126', y1:'42', x2:'132', y2:'42'}));
    g.appendChild(svgEl('path', {class:'cap-line', d:'M150 49 l9 5 l-9 5'}));
    svg.appendChild(g);
    svg.appendChild(svgEl('text', {class:'small', x:'78', y:'414'}, 'CAPYBARA.EXE'));
    svg.appendChild(svgEl('text', {class:'small', x:'78', y:'428'}, 'MAPPING HYPOTHESES...'));

    const xs = [310, 565, 820];
    state.categories.forEach((category, ci) => {
      const top = ci < 3;
      const slot = ci % 3;
      const sx = xs[slot];
      const sy = 310;
      const ex = sx - 112;
      const ey = top ? 112 : 508;
      const statusClass = branchClass(category);

      svg.appendChild(svgEl('line', {
        class:`rib rib-${statusClass}`,
        x1:String(sx), y1:String(sy), x2:String(ex), y2:String(ey)
      }));

      // Category label at branch end.
      svg.appendChild(svgEl('text', {
        class:'cat',
        x:String(ex - 8),
        y:String(top ? ey - 15 : ey + 27),
        'text-anchor':'middle'
      }, short(category.name || `Category ${ci+1}`, 18).toUpperCase()));

      // Up to four visible causes per category.
      const visibleCauses = category.causes.filter(c => c.text.trim()).slice(0,4);
      visibleCauses.forEach((cause, ri) => {
        const t = (ri + 1) / (visibleCauses.length + 1);
        const bx = sx + (ex - sx) * t;
        const by = sy + (ey - sy) * t;
        const twigLen = 82;
        const tx2 = bx - twigLen;
        const classSuffix = cause.status === 'untested' ? '' : `-${cause.status}`;

        svg.appendChild(svgEl('line', {
          class:`twig twig${classSuffix}`,
          x1:String(bx), y1:String(by), x2:String(tx2), y2:String(by)
        }));

        const statusText = cause.status === 'no' ? ' [NO]' :
                           cause.status === 'likely' ? ' [LIKELY]' :
                           cause.status === 'confirmed' ? ' [CONF]' : '';
        svg.appendChild(svgEl('text', {
          class:`cause cause${classSuffix}`,
          x:String(tx2 - 4),
          y:String(by - 4),
          'text-anchor':'start'
        }, short(cause.text, 19) + statusText));
      });

      if (category.causes.filter(c => c.text.trim()).length > 4) {
        svg.appendChild(svgEl('text', {
          class:'small',
          x:String(ex - 10),
          y:String(top ? ey + 4 : ey - 4),
          'text-anchor':'middle'
        }, '+ MORE'));
      }
    });
  }

  function wrapEffect(text, maxChars, maxLines) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return ['YOUR EFFECT'];
    const lines = [];
    let current = '';
    words.forEach(word => {
      const next = current ? current + ' ' + word : word;
      if (next.length <= maxChars) {
        current = next;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    });
    if (current) lines.push(current);
    if (lines.length > maxLines) {
      const kept = lines.slice(0, maxLines);
      kept[maxLines - 1] = short(kept[maxLines - 1], maxChars - 1) + '…';
      return kept;
    }
    return lines;
  }

  function renderGuidance() {
    const entered = state.categories.flatMap(c => c.causes).filter(c => c.text.trim());
    const likely = entered.filter(c => c.status === 'likely').length;
    const confirmed = entered.filter(c => c.status === 'confirmed').length;
    const no = entered.filter(c => c.status === 'no').length;
    const usedFamilies = state.categories.filter(c => c.causes.some(x => x.text.trim())).length;

    if (!state.effect.trim()) {
      status.textContent = 'STATUS: WAITING FOR EFFECT';
      tip.innerHTML = '<strong>TIP:</strong> Start with an observable effect. Avoid writing the suspected cause into the problem statement.';
    } else if (entered.length === 0) {
      status.textContent = 'STATUS: EFFECT CAPTURED';
      tip.innerHTML = '<strong>TIP:</strong> Brainstorm broadly before judging. Put plausible causes on several branches, even if some feel unlikely.';
    } else if (usedFamilies < 3) {
      status.textContent = 'STATUS: SEARCHING TOO NARROWLY';
      tip.innerHTML = '<strong>TIP:</strong> You are concentrating on only a few cause families. Fishbone is useful because it forces a wider search.';
    } else if (likely === 0 && confirmed === 0 && no === 0) {
      status.textContent = 'STATUS: HYPOTHESES MAPPED';
      tip.innerHTML = '<strong>TIP:</strong> Now test the branches. Evidence should weaken some hypotheses and strengthen others.';
    } else if (confirmed > 0) {
      status.textContent = 'STATUS: VERIFY THE CAUSAL CLAIM';
      tip.innerHTML = '<strong>TIP:</strong> A CONFIRMED label should mean you have actually verified the relationship, not merely that the explanation sounds convincing.';
    } else if (likely > 0) {
      status.textContent = 'STATUS: EVIDENCE NARROWING MAP';
      tip.innerHTML = '<strong>TIP:</strong> Good. Keep competing explanations visible until a test or observation separates them.';
    } else if (no > 0) {
      status.textContent = 'STATUS: ELIMINATING SUSPECTS';
      tip.innerHTML = '<strong>TIP:</strong> A [NO] is useful evidence too. Record why the branch was weakened so the team does not revisit it without new facts.';
    } else {
      status.textContent = 'STATUS: MAPPING HYPOTHESES';
      tip.innerHTML = '<strong>TIP:</strong> Keep causes specific enough that you can test them.';
    }
  }

  function renderAll() {
    renderCategories();
    renderSvg();
    renderGuidance();
    renderPdfReport();
  }

  function syncStaticFields() {
    effect.value = state.effect;
    supported.value = state.supported;
    nextTest.value = state.nextTest;
    notes.value = state.notes;
  }

  categoriesEl.addEventListener('input', e => {
    const target = e.target;
    if (target.matches('[data-cat-name]')) {
      const ci = Number(target.dataset.catName);
      state.categories[ci].name = target.value;
      save(); renderSvg(); renderGuidance(); renderPdfReport(); renderPdfReport();
      return;
    }
    if (target.matches('[data-cause]')) {
      const [ci, ri] = target.dataset.cause.split(':').map(Number);
      state.categories[ci].causes[ri].text = target.value;
      save(); renderSvg(); renderGuidance(); renderPdfReport(); renderPdfReport();
    }
  });

  categoriesEl.addEventListener('change', e => {
    const target = e.target;
    if (target.matches('[data-cause-status]')) {
      const [ci, ri] = target.dataset.causeStatus.split(':').map(Number);
      state.categories[ci].causes[ri].status = normalizeStatus(target.value);
      save();
      renderCategories();
      renderSvg();
      renderGuidance();
      renderPdfReport();
    }
  });

  categoriesEl.addEventListener('click', e => {
    const add = e.target.closest('[data-add-cause]');
    const remove = e.target.closest('[data-remove-cause]');

    if (add) {
      const ci = Number(add.dataset.addCause);
      if (state.categories[ci].causes.length < MAX_CAUSES) {
        state.categories[ci].causes.push({text:'',status:'untested'});
        save(); renderAll();
        const inputs = categoriesEl.querySelectorAll(`[data-cause^="${ci}:"]`);
        inputs[inputs.length - 1]?.focus();
      }
      return;
    }

    if (remove) {
      const ci = Number(remove.dataset.removeCause);
      const causes = state.categories[ci].causes;
      if (causes.length <= MIN_CAUSES) return;
      const last = causes[causes.length - 1];
      if ((last.text.trim() || last.status !== 'untested') && !window.confirm('Remove the last cause and its evidence status?')) return;
      causes.pop();
      save(); renderAll();
    }
  });

  [effect, supported, nextTest, notes].forEach(el => {
    el.addEventListener('input', () => {
      state.effect = effect.value;
      state.supported = supported.value;
      state.nextTest = nextTest.value;
      state.notes = notes.value;
      save();
      renderSvg();
      renderGuidance();
      renderPdfReport();
    });
  });

  function summaryText() {
    const lines = ['problem.me — Fishbone summary', ''];
    lines.push('EFFECT: ' + (state.effect.trim() || '[not defined]'), '');
    state.categories.forEach((category, ci) => {
      lines.push(`${String(ci+1).padStart(2,'0')} ${category.name || 'Unnamed category'}`);
      const filled = category.causes.filter(c => c.text.trim());
      if (!filled.length) {
        lines.push('  - [no hypotheses]');
      } else {
        filled.forEach(c => {
          const flag = c.status === 'untested' ? 'UNTESTED' : c.status.toUpperCase();
          lines.push(`  - ${c.text.trim()} [${flag}]`);
        });
      }
      lines.push('');
    });
    lines.push('BEST-SUPPORTED HYPOTHESIS: ' + (state.supported.trim() || '[not defined]'));
    lines.push('NEXT VERIFICATION STEP: ' + (state.nextTest.trim() || '[not defined]'));
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
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      try {
        document.execCommand('copy');
        actionStatus.textContent = privateMode ? 'SUMMARY COPIED — PRIVATE SESSION_' : 'SUMMARY COPIED_';
      } catch (_) {
        actionStatus.textContent = 'COPY FAILED_';
      }
      temp.remove();
    }
  });

  printBtn.addEventListener('click', () => { renderPdfReport(); window.print(); });


  privateBtn.addEventListener('click', () => {
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
    if (!confirm('Open your saved Fishbone draft and Evidence Ledger in this Private Session? Current unsaved work on screen will be replaced. Nothing will be saved until you choose Local Save.')) return;
    state = makeDefaultState();
    safeLoad(true);
    syncStaticFields();
    renderAll();
    window.dispatchEvent(new Event('pm-restore-saved-draft'));
    actionStatus.textContent = 'SAVED DRAFT OPENED PRIVATELY — NOT RE-SAVED_';
  });
  clearDataBtn.addEventListener('click', () => {
    if (embedded) return;
    if (!window.confirm('Delete all standalone problem.me technique drafts in this browser — including 5 Whys, Fishbone, Pareto and Kepner–Tregoe — and clear this Fishbone form? My Investigations are managed separately. This cannot be undone.')) return;
    const result = clearProblemMeLocalData();
    if (!result.ok) {
      actionStatus.textContent = 'LOCAL DATA CLEAR FAILED_';
      return;
    }
    state = makeDefaultState();
    syncStaticFields();
    renderAll();
    renderPrivacyMode();
    actionStatus.textContent = result.count ? `LOCAL DATA CLEARED — ${result.count} ITEM${result.count === 1 ? '' : 'S'}_` : 'NO SAVED LOCAL DATA FOUND_';
    window.dispatchEvent(new Event('pm-clear-all'));
    updateRestoreButton();
  });

  resetBtn.addEventListener('click', () => {
    const message = privateMode
      ? 'Reset this Private Session? The previously saved local Fishbone draft, if any, will remain untouched.'
      : 'Reset this local Fishbone draft?';
    if (!window.confirm(message)) return;
    state = makeDefaultState();
    if (!privateMode) {
      try { ProblemMeDraftStore.remove(STORAGE_KEY); } catch (_) {}
    }
    syncStaticFields();
    renderAll();
    actionStatus.textContent = privateMode ? 'PRIVATE SESSION RESET — NOT SAVED_' : 'DRAFT RESET_';
  });

  window.problemMeFishbone = {
    getState() { return JSON.parse(JSON.stringify(state)); },
    setState(input) {
      state = JSON.parse(JSON.stringify(input));
      syncStaticFields(); renderAll();
    },
    isPrivate() { return privateMode; }
  };
  window.addEventListener('beforeprint', renderPdfReport);

  safeLoad();
  syncStaticFields();
  renderAll();
  renderPrivacyMode();
})();

