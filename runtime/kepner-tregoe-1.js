
(() => {
  const KEY='problemme_kt_v04', MAX_ALT=5, MIN_ALT=2, MAX_MUST=6, MIN_MUST=1, MAX_WANT=8, MIN_WANT=1, MAX_CAUSE=6, MIN_CAUSE=2;
  const dims=['what','where','when','extent'];
  const dimLabels={what:'WHAT',where:'WHERE',when:'WHEN',extent:'EXTENT'};
  const $=id=>document.getElementById(id);

  const pdfEls={
    generated:$('ktPdfGenerated'),
    objective:$('ktPdfObjective'),
    decisionRanking:$('ktPdfDecisionRanking'),
    mustTable:$('ktPdfMustTable'),
    wantTable:$('ktPdfWantTable'),
    leader:$('ktPdfLeader'),
    leaderNote:$('ktPdfLeaderNote'),
    deviation:$('ktPdfDeviation'),
    dimensions:$('ktPdfDimensions'),
    changes:$('ktPdfChanges'),
    causeRanking:$('ktPdfCauseRanking'),
    bestCause:$('ktPdfBestCause'),
    verification:$('ktPdfVerification'),
    notes:$('ktPdfNotes')
  };


  const privacyEls={
    shell:document.querySelector('.kt-shell'),
    localMode:$('ktLocalMode'),
    panel:$('ktPrivacyPanel'),
    title:$('ktPrivacyTitle'),
    copy:$('ktPrivacyCopy'),
    privateBtn:$('ktPrivateBtn'),
    clearBtn:$('ktClearDataBtn'),
    restoreBtn:$('ktRestoreSavedBtn')
  };
  let privateMode=true;
  const savedKeys = [KEY, 'problem-me:evidence:kepner-tregoe:v1'];
  const updateRestoreButton = () => ProblemMePrivateDefault.showRestore(privacyEls.restoreBtn, savedKeys, privateMode);

  const els={decisionTab:$('ktDecisionTab'),problemTab:$('ktProblemTab'),decisionPanel:$('ktDecisionPanel'),problemPanel:$('ktProblemPanel'),objective:$('ktObjective'),alts:$('ktAlternatives'),must:$('ktMustTable'),want:$('ktWantTable'),risks:$('ktRisks'),decisionStatus:$('ktDecisionStatus'),decisionMeta:$('ktDecisionMeta'),decisionRanking:$('ktDecisionRanking'),decisionCallout:$('ktDecisionCallout'),decisionTip:$('ktDecisionTip'),deviation:$('ktDeviation'),dimensions:$('ktDimensions'),changes:$('ktChanges'),causes:$('ktCauses'),verification:$('ktVerification'),paNotes:$('ktPaNotes'),problemStatus:$('ktProblemStatus'),problemMeta:$('ktProblemMeta'),causeRanking:$('ktCauseRanking'),problemCallout:$('ktProblemCallout'),problemTip:$('ktProblemTip'),actionStatus:$('ktActionStatus')};


  function pdfStamp(){
    const now=new Date();
    try{return now.toLocaleString(undefined,{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'})}
    catch(e){return now.toString()}
  }

  function decisionEligibility(metric){
    if(metric.failed)return 'MUST FAIL';
    if(metric.untested)return 'MUST UNTESTED';
    return 'ELIGIBLE';
  }

  function renderPdf(){
    const dMetrics=decisionMetrics();
    const dSorted=[...dMetrics].sort((a,b)=>b.total-a.total);
    const eligible=dSorted.filter(x=>x.eligible);
    const leader=eligible[0]||null;

    pdfEls.generated.textContent=pdfStamp();
    pdfEls.objective.textContent=state.decision.objective.trim()||'Not defined.';

    pdfEls.decisionRanking.innerHTML=dSorted.map((x,i)=>{
      const alt=state.decision.alternatives[x.i];
      return `<tr class="${leader?.i===x.i?'best ':''}${!x.eligible?'ineligible':''}">
        <td>${String(i+1).padStart(2,'0')}</td>
        <td>${esc(x.name)}</td>
        <td>${decisionEligibility(x)}</td>
        <td class="num">${x.total}</td>
        <td>${esc(alt?.risk?.trim()||'[none recorded]')}</td>
      </tr>`;
    }).join('')||'<tr><td>--</td><td>No alternatives.</td><td>—</td><td class="num">0</td><td>—</td></tr>';

    const alts=state.decision.alternatives;
    pdfEls.mustTable.innerHTML=`<thead><tr><th>MUST requirement</th>${alts.map(a=>`<th>${esc(a.name||'Option')}</th>`).join('')}</tr></thead><tbody>${
      state.decision.musts.map(m=>`<tr><td>${esc(m.name.trim()||'[unnamed MUST]')}</td>${
        alts.map((a,ai)=>{
          const v=m.results[ai]||'untested';
          return `<td><span class="kt-pdf-pill ${v}">${v.toUpperCase()}</span></td>`;
        }).join('')
      }</tr>`).join('')
    }</tbody>`;

    pdfEls.wantTable.innerHTML=`<thead><tr><th>WANT criterion</th><th>WEIGHT</th>${alts.map(a=>`<th>${esc(a.name||'Option')}</th>`).join('')}</tr></thead><tbody>${
      state.decision.wants.map(w=>`<tr><td>${esc(w.name.trim()||'[unnamed WANT]')}</td><td class="num">${w.weight}</td>${
        alts.map((a,ai)=>`<td class="num">${w.scores[ai]??0}</td>`).join('')
      }</tr>`).join('')
    }</tbody>`;

    pdfEls.leader.textContent=leader?`${leader.name} — ${leader.total} points`:'No eligible leader yet.';
    pdfEls.leaderNote.textContent=leader
      ? 'Eligible after current MUST checks. Review adverse consequences before deciding.'
      : 'Resolve MUST failures or untested gates before treating WANT scores as a decision.';

    pdfEls.deviation.textContent=state.problem.deviation.trim()||'Not defined.';
    pdfEls.dimensions.innerHTML=dims.map(k=>`<section class="kt-pdf-dim kt-pdf-keep">
      <h4>${dimLabels[k]}_</h4>
      <div class="kt-pdf-dim-grid">
        <div><small>IS</small><p>${esc(state.problem.dimensions[k].is.trim()||'[blank]')}</p></div>
        <div><small>IS NOT</small><p>${esc(state.problem.dimensions[k].isnot.trim()||'[blank]')}</p></div>
      </div>
    </section>`).join('');
    pdfEls.changes.textContent=state.problem.changes.trim()||'Not defined.';

    const cMetrics=causeMetrics().filter(x=>state.problem.causes[x.i].name.trim());
    const cBest=bestCause();
    const cSorted=[...cMetrics].sort((a,b)=>a.no-b.no||b.yes-a.yes||b.score-a.score);

    pdfEls.causeRanking.innerHTML=cSorted.map((x,i)=>`<tr class="${cBest?.i===x.i?'best':''}">
      <td>${String(i+1).padStart(2,'0')}</td>
      <td>${esc(x.name)}</td>
      <td class="num">${x.yes}/5</td>
      <td class="num">${x.no}</td>
      <td class="num">${x.unknown}</td>
      <td class="num">${x.score}</td>
    </tr>`).join('')||'<tr><td>--</td><td>No tested possible causes.</td><td class="num">0/5</td><td class="num">0</td><td class="num">5</td><td class="num">0</td></tr>';

    pdfEls.bestCause.textContent=cBest?cBest.name:'Not defined.';
    pdfEls.verification.textContent=state.problem.verification.trim()||'Not defined.';
    pdfEls.notes.textContent='EVIDENCE / NOTES:\n'+(state.problem.notes.trim()||'Not defined.');
  }

  function blankState(){return {active:'decision',decision:{objective:'',alternatives:[{name:'Option A',risk:''},{name:'Option B',risk:''},{name:'Option C',risk:''}],musts:[{name:'',results:['untested','untested','untested']},{name:'',results:['untested','untested','untested']}],wants:[{name:'',weight:10,scores:[0,0,0]},{name:'',weight:7,scores:[0,0,0]},{name:'',weight:5,scores:[0,0,0]}]},problem:{deviation:'',dimensions:{what:{is:'',isnot:''},where:{is:'',isnot:''},when:{is:'',isnot:''},extent:{is:'',isnot:''}},changes:'',causes:[newCause(),newCause(),newCause()],verification:'',notes:''}}}
  function newCause(){return {name:'',tests:{what:'unknown',where:'unknown',when:'unknown',extent:'unknown',change:'unknown'}}}
  let state=blankState();
  function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function num(v,min=0,max=10){const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):0}

  function renderPrivacy(){
    privacyEls.shell.classList.toggle('is-private',privateMode);
    privacyEls.panel.classList.toggle('is-private',privateMode);
    privacyEls.privateBtn.setAttribute('aria-pressed',privateMode?'true':'false');
    if(privateMode){
      privacyEls.title.textContent='PRIVATE SESSION ACTIVE_';
      privacyEls.copy.textContent='problem.me will not write changes from this session to localStorage. Refreshing or closing this tab discards private changes; an older saved draft, if any, remains untouched.';
      privacyEls.privateBtn.textContent='START LOCAL SAVE';updateRestoreButton();
      privacyEls.localMode.innerHTML='<strong>PRIVATE SESSION</strong><br>not saved on this device';
    }else{
      privacyEls.title.textContent='LOCAL SAVE ACTIVE_';
      privacyEls.copy.textContent='Changes are auto-saved in this browser on this device.';
      privacyEls.privateBtn.textContent='ENTER PRIVATE SESSION';updateRestoreButton();
      privacyEls.localMode.innerHTML='<strong>LOCAL WORKSPACE</strong><br>saved on this device';
    }
  }
  function clearProblemMeLocalData(){
    try{
      const prefixes=['problem-me:', 'problemme_', 'problem.me:'],keys=[];
      for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&prefixes.some(prefix=>key.startsWith(prefix)))keys.push(key)}
      keys.forEach(key=>localStorage.removeItem(key));
      return {ok:true,count:keys.length};
    }catch(e){return {ok:false,count:0}}
  }

  function load(force=false){if(privateMode&&!force)return;try{const x=JSON.parse(ProblemMeDraftStore.read(KEY));if(x&&typeof x==='object')state=normalize(x)}catch(e){}}
  function normalize(x){const s=blankState();s.active=x.active==='problem'?'problem':'decision';const d=x.decision||{};s.decision.objective=typeof d.objective==='string'?d.objective:'';if(Array.isArray(d.alternatives)){s.decision.alternatives=d.alternatives.slice(0,MAX_ALT).map((a,i)=>({name:typeof a?.name==='string'?a.name:`Option ${String.fromCharCode(65+i)}`,risk:typeof a?.risk==='string'?a.risk:''}));while(s.decision.alternatives.length<MIN_ALT)s.decision.alternatives.push({name:`Option ${String.fromCharCode(65+s.decision.alternatives.length)}`,risk:''})}const ac=s.decision.alternatives.length;if(Array.isArray(d.musts)){s.decision.musts=d.musts.slice(0,MAX_MUST).map(m=>({name:typeof m?.name==='string'?m.name:'',results:Array.from({length:ac},(_,i)=>['pass','fail','untested'].includes(m?.results?.[i])?m.results[i]:'untested')}));if(!s.decision.musts.length)s.decision.musts=[{name:'',results:Array(ac).fill('untested')}]};if(Array.isArray(d.wants)){s.decision.wants=d.wants.slice(0,MAX_WANT).map(w=>({name:typeof w?.name==='string'?w.name:'',weight:num(w?.weight,1,10)||1,scores:Array.from({length:ac},(_,i)=>num(w?.scores?.[i],0,10))}));if(!s.decision.wants.length)s.decision.wants=[{name:'',weight:10,scores:Array(ac).fill(0)}]};const p=x.problem||{};s.problem.deviation=typeof p.deviation==='string'?p.deviation:'';dims.forEach(k=>{s.problem.dimensions[k]={is:typeof p.dimensions?.[k]?.is==='string'?p.dimensions[k].is:'',isnot:typeof p.dimensions?.[k]?.isnot==='string'?p.dimensions[k].isnot:''}});s.problem.changes=typeof p.changes==='string'?p.changes:'';if(Array.isArray(p.causes)){s.problem.causes=p.causes.slice(0,MAX_CAUSE).map(c=>({name:typeof c?.name==='string'?c.name:'',tests:{what:fit(c?.tests?.what),where:fit(c?.tests?.where),when:fit(c?.tests?.when),extent:fit(c?.tests?.extent),change:fit(c?.tests?.change)}}));while(s.problem.causes.length<MIN_CAUSE)s.problem.causes.push(newCause())}s.problem.verification=typeof p.verification==='string'?p.verification:'';s.problem.notes=typeof p.notes==='string'?p.notes:'';return s}
  function fit(v){return ['fit','no','unknown'].includes(v)?v:'unknown'}
  function save(){if(privateMode){els.actionStatus.textContent='PRIVATE SESSION — NOT SAVED_';return}try{ProblemMeDraftStore.save(KEY, JSON.stringify(state));els.actionStatus.textContent='AUTO-SAVED LOCALLY_'}catch(e){els.actionStatus.textContent=e?.code==='CONFLICT'?'AUTO-SAVE PAUSED — ANOTHER TAB CHANGED THIS DRAFT_':'LOCAL SAVE UNAVAILABLE_'}}
  function setTab(which){state.active=which;const d=which==='decision';els.decisionTab.setAttribute('aria-selected',String(d));els.problemTab.setAttribute('aria-selected',String(!d));els.decisionPanel.classList.toggle('active',d);els.problemPanel.classList.toggle('active',!d);els.decisionPanel.hidden=!d;els.problemPanel.hidden=d;save()}
  els.decisionTab.addEventListener('click',()=>setTab('decision'));els.problemTab.addEventListener('click',()=>setTab('problem'));

  function renderAlternatives(){els.alts.innerHTML=state.decision.alternatives.map((a,i)=>`<div class="kt-field"><div class="kt-label"><label for="ktAlt${i}">OPTION ${String.fromCharCode(65+i)}_</label>${state.decision.alternatives.length>MIN_ALT?`<button class="kt-mini" type="button" data-remove-alt="${i}">REMOVE</button>`:''}</div><input id="ktAlt${i}" type="text" data-alt-name="${i}" maxlength="45" value="${esc(a.name)}" placeholder="Alternative ${i+1}"></div>`).join('');$('ktAddAlternative').disabled=state.decision.alternatives.length>=MAX_ALT}
  function renderMusts(){const alts=state.decision.alternatives;els.must.innerHTML=`<thead><tr><th>MUST requirement</th>${alts.map(a=>`<th>${esc(a.name||'Option')}</th>`).join('')}</tr></thead><tbody>${state.decision.musts.map((m,ri)=>`<tr><td><input type="text" data-must-name="${ri}" value="${esc(m.name)}" placeholder="non-negotiable requirement..."></td>${alts.map((a,ai)=>`<td><select data-must-result="${ri}:${ai}"><option value="untested"${m.results[ai]==='untested'?' selected':''}>UNTESTED</option><option value="pass"${m.results[ai]==='pass'?' selected':''}>PASS</option><option value="fail"${m.results[ai]==='fail'?' selected':''}>FAIL</option></select></td>`).join('')}</tr>`).join('')}</tbody>`;$('ktAddMust').disabled=state.decision.musts.length>=MAX_MUST;$('ktRemoveMust').disabled=state.decision.musts.length<=MIN_MUST}
  function renderWants(){const alts=state.decision.alternatives;els.want.innerHTML=`<thead><tr><th>WANT criterion</th><th class="weight-cell">WEIGHT</th>${alts.map(a=>`<th class="score-cell">${esc(a.name||'Option')}<br>SCORE</th>`).join('')}</tr></thead><tbody>${state.decision.wants.map((w,ri)=>`<tr><td><input type="text" data-want-name="${ri}" value="${esc(w.name)}" placeholder="preference..."></td><td><input type="number" min="1" max="10" data-want-weight="${ri}" value="${w.weight}"></td>${alts.map((a,ai)=>`<td><input type="number" min="0" max="10" data-want-score="${ri}:${ai}" value="${w.scores[ai]}"></td>`).join('')}</tr>`).join('')}</tbody>`;$('ktAddWant').disabled=state.decision.wants.length>=MAX_WANT;$('ktRemoveWant').disabled=state.decision.wants.length<=MIN_WANT}
  function renderRisks(){els.risks.innerHTML=state.decision.alternatives.map((a,i)=>`<div class="kt-risk"><strong>${String.fromCharCode(65+i)} / ${esc(a.name||'Option')}</strong><textarea data-risk="${i}" placeholder="What could go wrong? How serious / likely?">${esc(a.risk)}</textarea></div>`).join('')}
  function decisionMetrics(){const d=state.decision, activeMust=d.musts.filter(m=>m.name.trim()), activeWants=d.wants.filter(w=>w.name.trim());return d.alternatives.map((a,ai)=>{let failed=false,untested=false;activeMust.forEach(m=>{if(m.results[ai]==='fail')failed=true;if(m.results[ai]==='untested')untested=true});const eligible=!failed&&!untested;const total=activeWants.reduce((sum,w)=>sum+(num(w.weight,1,10)*num(w.scores[ai],0,10)),0);return {i:ai,name:a.name||`Option ${String.fromCharCode(65+ai)}`,eligible,failed,untested,total}})}
  function renderDecisionReadout(){const metrics=decisionMetrics(), sorted=[...metrics].sort((a,b)=>b.total-a.total), eligible=sorted.filter(x=>x.eligible);els.decisionMeta.textContent=`${eligible.length} eligible`;els.decisionRanking.innerHTML=sorted.map((x,rank)=>`<div class="kt-result-row ${!x.eligible?'ineligible ':''}${eligible[0]?.i===x.i?'best':''}"><span class="rank">${String(rank+1).padStart(2,'0')}</span><span class="name">${esc(x.name)}${x.failed?' / MUST FAIL':x.untested?' / MUST UNTESTED':''}</span><span class="value">${x.total}</span></div>`).join('')||'<div class="kt-result-row"><span>--</span><span>No alternatives</span><span>0</span></div>';const objective=state.decision.objective.trim(), anyMust=state.decision.musts.some(m=>m.name.trim()), anyWant=state.decision.wants.some(w=>w.name.trim());if(!objective){els.decisionStatus.textContent='STATUS: DEFINE THE DECISION';els.decisionCallout.innerHTML='<strong>CURRENT LEADER_</strong><span>Complete the decision objective to begin.</span>';els.decisionTip.innerHTML='<strong>TIP:</strong> Phrase the objective as one clear choice. Do not mix several decisions into one matrix.'}else if(anyMust && eligible.length===0){els.decisionStatus.textContent='STATUS: RESOLVE MUSTs';els.decisionCallout.innerHTML='<strong>NO ELIGIBLE LEADER_</strong><span>Every option currently fails or has an untested MUST.</span>';els.decisionTip.innerHTML='<strong>TIP:</strong> Resolve unknown MUSTs before scoring preferences. A MUST is a gate, not a weighted preference.'}else if(!anyWant){els.decisionStatus.textContent='STATUS: DEFINE THE WANTs';els.decisionCallout.innerHTML='<strong>CURRENT LEADER_</strong><span>Add weighted WANT criteria to compare the surviving alternatives.</span>'}else if(eligible.length){const best=eligible[0];els.decisionStatus.textContent='STATUS: LEADER IDENTIFIED — CHECK RISK';els.decisionCallout.innerHTML=`<strong>CURRENT LEADER_</strong><span>${esc(best.name)} leads with a weighted score of ${best.total}. Review adverse consequences before committing.</span>`;els.decisionTip.innerHTML='<strong>TIP:</strong> The score makes priorities visible; it does not manufacture certainty. Revisit weak weights, weak scores, and material downside risk.'}}

  function renderDecisionAll(){renderAlternatives();renderMusts();renderWants();renderRisks();renderDecisionReadout()}
  els.alts.addEventListener('input',e=>{if(e.target.matches('[data-alt-name]')){state.decision.alternatives[+e.target.dataset.altName].name=e.target.value;save();renderMusts();renderWants();renderRisks();renderDecisionReadout()}});els.alts.addEventListener('click',e=>{const b=e.target.closest('[data-remove-alt]');if(!b)return;removeAlt(+b.dataset.removeAlt)});$('ktAddAlternative').addEventListener('click',()=>{if(state.decision.alternatives.length>=MAX_ALT)return;const i=state.decision.alternatives.length;state.decision.alternatives.push({name:`Option ${String.fromCharCode(65+i)}`,risk:''});state.decision.musts.forEach(m=>m.results.push('untested'));state.decision.wants.forEach(w=>w.scores.push(0));save();renderDecisionAll()});function removeAlt(i){if(state.decision.alternatives.length<=MIN_ALT)return;if(!confirm('Remove this alternative and all of its scores?'))return;state.decision.alternatives.splice(i,1);state.decision.musts.forEach(m=>m.results.splice(i,1));state.decision.wants.forEach(w=>w.scores.splice(i,1));save();renderDecisionAll()}
  els.must.addEventListener('input',e=>{if(e.target.matches('[data-must-name]')){state.decision.musts[+e.target.dataset.mustName].name=e.target.value;save();renderDecisionReadout()}});els.must.addEventListener('change',e=>{if(e.target.matches('[data-must-result]')){const [r,a]=e.target.dataset.mustResult.split(':').map(Number);state.decision.musts[r].results[a]=e.target.value;save();renderDecisionReadout()}});$('ktAddMust').addEventListener('click',()=>{if(state.decision.musts.length<MAX_MUST){state.decision.musts.push({name:'',results:Array(state.decision.alternatives.length).fill('untested')});save();renderDecisionAll()}});$('ktRemoveMust').addEventListener('click',()=>{if(state.decision.musts.length>MIN_MUST){state.decision.musts.pop();save();renderDecisionAll()}})
  els.want.addEventListener('input',e=>{if(e.target.matches('[data-want-name]'))state.decision.wants[+e.target.dataset.wantName].name=e.target.value;else if(e.target.matches('[data-want-weight]'))state.decision.wants[+e.target.dataset.wantWeight].weight=num(e.target.value,1,10)||1;else if(e.target.matches('[data-want-score]')){const [r,a]=e.target.dataset.wantScore.split(':').map(Number);state.decision.wants[r].scores[a]=num(e.target.value,0,10)}else return;save();renderDecisionReadout()});$('ktAddWant').addEventListener('click',()=>{if(state.decision.wants.length<MAX_WANT){state.decision.wants.push({name:'',weight:5,scores:Array(state.decision.alternatives.length).fill(0)});save();renderDecisionAll()}});$('ktRemoveWant').addEventListener('click',()=>{if(state.decision.wants.length>MIN_WANT){state.decision.wants.pop();save();renderDecisionAll()}})
  els.risks.addEventListener('input',e=>{if(e.target.matches('[data-risk]')){state.decision.alternatives[+e.target.dataset.risk].risk=e.target.value;save()}});els.objective.addEventListener('input',()=>{state.decision.objective=els.objective.value;save();renderDecisionReadout()})

  function renderDimensions(){els.dimensions.innerHTML=dims.map(k=>`<div class="kt-dim"><h4>${dimLabels[k]}_</h4><div class="kt-isnot"><div><label for="kt-${k}-is">IS</label><textarea id="kt-${k}-is" data-dim="${k}:is" placeholder="Where the problem appears...">${esc(state.problem.dimensions[k].is)}</textarea></div><div><label for="kt-${k}-isnot">IS NOT</label><textarea id="kt-${k}-isnot" data-dim="${k}:isnot" placeholder="Comparable boundary...">${esc(state.problem.dimensions[k].isnot)}</textarea></div></div></div>`).join('')}
  const testKeys=['what','where','when','extent','change'];const testLabel={what:'WHAT',where:'WHERE',when:'WHEN',extent:'EXTENT',change:'CHANGE'};
  function causeMetrics(){return state.problem.causes.map((c,i)=>{let yes=0,no=0,unknown=0;testKeys.forEach(k=>{const v=c.tests[k];if(v==='fit')yes++;else if(v==='no')no++;else unknown++});return {i,name:c.name||`Cause ${i+1}`,yes,no,unknown,score:yes*2-no*3}})}
  function bestCause(){const tested=causeMetrics().filter(x=>state.problem.causes[x.i].name.trim()&&(x.yes+x.no)>0);if(!tested.length)return null;return [...tested].sort((a,b)=>a.no-b.no||b.yes-a.yes||b.score-a.score)[0]}
  function renderCauses(){const best=bestCause();els.causes.innerHTML=state.problem.causes.map((c,i)=>{const m=causeMetrics()[i];return `<div class="kt-cause ${best?.i===i?'bestfit':''}"><div class="kt-cause-top"><input type="text" data-cause-name="${i}" value="${esc(c.name)}" placeholder="possible cause..."><span class="kt-cat-no">${String(i+1).padStart(2,'0')}</span></div><div class="kt-cause-tests">${testKeys.map(k=>`<div class="kt-test"><label>${testLabel[k]}</label><select data-cause-test="${i}:${k}"><option value="unknown"${c.tests[k]==='unknown'?' selected':''}>UNKNOWN</option><option value="fit"${c.tests[k]==='fit'?' selected':''}>FITS</option><option value="no"${c.tests[k]==='no'?' selected':''}>DOESN'T FIT</option></select></div>`).join('')}</div><div class="kt-cause-meta"><span>FITS ${m.yes}/5 · CONFLICTS ${m.no}</span><strong>${best?.i===i?'CURRENT BEST FIT':''}</strong></div></div>`}).join('');$('ktAddCause').disabled=state.problem.causes.length>=MAX_CAUSE;$('ktRemoveCause').disabled=state.problem.causes.length<=MIN_CAUSE}
  function renderProblemReadout(){const metrics=causeMetrics().filter(x=>state.problem.causes[x.i].name.trim()),best=bestCause();const sorted=[...metrics].sort((a,b)=>a.no-b.no||b.yes-a.yes||b.score-a.score);els.problemMeta.textContent=`${metrics.length} hypotheses`;els.causeRanking.innerHTML=sorted.map((x,r)=>`<div class="kt-result-row ${best?.i===x.i?'best':''}"><span class="rank">${String(r+1).padStart(2,'0')}</span><span class="name">${esc(x.name)} / FIT ${x.yes} · CONFLICT ${x.no} · UNKNOWN ${x.unknown}</span><span class="value">${x.score}</span></div>`).join('')||'<div class="kt-result-row"><span>--</span><span>Add possible causes to begin.</span><span>0</span></div>';const dev=state.problem.deviation.trim(),bounds=dims.reduce((n,k)=>n+(state.problem.dimensions[k].is.trim()?1:0)+(state.problem.dimensions[k].isnot.trim()?1:0),0);if(!dev){els.problemStatus.textContent='STATUS: DEFINE THE DEVIATION';els.problemCallout.innerHTML='<strong>BEST CURRENT FIT_</strong><span>No tested hypothesis yet.</span>';els.problemTip.innerHTML='<strong>TIP:</strong> Describe the deviation without embedding a suspected cause.'}else if(bounds<4){els.problemStatus.textContent='STATUS: DEFINE THE BOUNDARIES';els.problemCallout.innerHTML='<strong>BEST CURRENT FIT_</strong><span>Complete more IS / IS NOT distinctions before judging causes.</span>';els.problemTip.innerHTML='<strong>TIP:</strong> Useful distinctions often come from comparing the affected case with a very similar unaffected case.'}else if(!metrics.length){els.problemStatus.textContent='STATUS: GENERATE POSSIBLE CAUSES';els.problemCallout.innerHTML='<strong>BEST CURRENT FIT_</strong><span>No tested hypothesis yet.</span>'}else if(best){const tied=sorted.filter(x=>x.no===best.no&&x.yes===best.yes).length>1;els.problemStatus.textContent=tied?'STATUS: MULTIPLE HYPOTHESES STILL FIT':'STATUS: BEST FIT FOUND — VERIFY';els.problemCallout.innerHTML=`<strong>BEST CURRENT FIT_</strong><span>${esc(best.name)} fits ${best.yes}/5 tests with ${best.no} conflict${best.no===1?'':'s'}. ${tied?'Another hypothesis currently fits equally well.':'Verification is still required.'}</span>`;els.problemTip.innerHTML='<strong>TIP:</strong> A matrix ranks explanatory fit; it does not prove causality. Design a discriminating test before declaring root cause.'}}
  function renderProblemAll(){renderDimensions();renderCauses();renderProblemReadout()}
  els.dimensions.addEventListener('input',e=>{if(e.target.matches('[data-dim]')){const [k,t]=e.target.dataset.dim.split(':');state.problem.dimensions[k][t]=e.target.value;save();renderProblemReadout()}});els.causes.addEventListener('input',e=>{if(e.target.matches('[data-cause-name]')){state.problem.causes[+e.target.dataset.causeName].name=e.target.value;save();renderCauses();renderProblemReadout()}});els.causes.addEventListener('change',e=>{if(e.target.matches('[data-cause-test]')){const [i,k]=e.target.dataset.causeTest.split(':');state.problem.causes[+i].tests[k]=fit(e.target.value);save();renderCauses();renderProblemReadout()}});$('ktAddCause').addEventListener('click',()=>{if(state.problem.causes.length<MAX_CAUSE){state.problem.causes.push(newCause());save();renderProblemAll()}});$('ktRemoveCause').addEventListener('click',()=>{if(state.problem.causes.length>MIN_CAUSE){const c=state.problem.causes.at(-1);if((c.name.trim()||Object.values(c.tests).some(v=>v!=='unknown'))&&!confirm('Remove the last possible cause and its test results?'))return;state.problem.causes.pop();save();renderProblemAll()}})
  els.deviation.addEventListener('input',()=>{state.problem.deviation=els.deviation.value;save();renderProblemReadout()});els.changes.addEventListener('input',()=>{state.problem.changes=els.changes.value;save()});els.verification.addEventListener('input',()=>{state.problem.verification=els.verification.value;save()});els.paNotes.addEventListener('input',()=>{state.problem.notes=els.paNotes.value;save()})

  function sync(){els.objective.value=state.decision.objective;els.deviation.value=state.problem.deviation;els.changes.value=state.problem.changes;els.verification.value=state.problem.verification;els.paNotes.value=state.problem.notes;setTab(state.active);renderDecisionAll();renderProblemAll()}
  function decisionSummary(){const m=decisionMetrics(),eligible=[...m].filter(x=>x.eligible).sort((a,b)=>b.total-a.total),lines=['DECISION ANALYSIS','OBJECTIVE: '+(state.decision.objective.trim()||'[not defined]'),''];lines.push('ALTERNATIVES:');m.forEach(x=>lines.push(`- ${x.name}: ${x.total} points / ${x.eligible?'eligible':x.failed?'MUST fail':'MUST untested'}`));if(eligible[0])lines.push('',`CURRENT LEADER: ${eligible[0].name} (${eligible[0].total})`);lines.push('','ADVERSE CONSEQUENCES:');state.decision.alternatives.forEach(a=>lines.push(`- ${a.name}: ${a.risk.trim()||'[none recorded]'}`));return lines}
  function problemSummary(){const b=bestCause(),lines=['PROBLEM ANALYSIS','DEVIATION: '+(state.problem.deviation.trim()||'[not defined]'),''];dims.forEach(k=>{lines.push(`${dimLabels[k]} IS: ${state.problem.dimensions[k].is.trim()||'[blank]'}`);lines.push(`${dimLabels[k]} IS NOT: ${state.problem.dimensions[k].isnot.trim()||'[blank]'}`)});lines.push('','DISTINCTIONS / CHANGES: '+(state.problem.changes.trim()||'[blank]'),'','POSSIBLE CAUSES:');causeMetrics().forEach(x=>lines.push(`- ${x.name}: fits ${x.yes}/5, conflicts ${x.no}, unknown ${x.unknown}`));if(b)lines.push('',`BEST CURRENT FIT: ${b.name}`);lines.push('VERIFICATION: '+(state.problem.verification.trim()||'[not defined]'));if(state.problem.notes.trim())lines.push('NOTES: '+state.problem.notes.trim());return lines}

  privacyEls.privateBtn.addEventListener('click',()=>{
    if(!privateMode){
      privateMode=true;renderPrivacy();els.actionStatus.textContent='PRIVATE SESSION — NOT SAVED_';return;
    }
    if(!ProblemMePrivateDefault.confirmLocalSave(savedKeys))return;
    privateMode=false;renderPrivacy();save();
  });
  privacyEls.restoreBtn.addEventListener('click',()=>{
    if(!privateMode)return;
    if(!ProblemMePrivateDefault.hasSaved(savedKeys)){updateRestoreButton();return}
    if(!confirm('Open saved Kepner–Tregoe draft and Evidence Ledger privately? This replaces unsaved work on screen, but writes nothing to storage.'))return;
    state=blankState();
    load(true);
    sync();
    renderPdf();
    window.dispatchEvent(new Event('pm-restore-saved-draft'));
    els.actionStatus.textContent='SAVED DRAFT OPENED PRIVATELY — NOT RE-SAVED_';
  });
  privacyEls.clearBtn.addEventListener('click',()=>{
    if(!confirm('Delete all locally saved problem.me drafts in this browser — including 5 Whys, Fishbone, Pareto and Kepner–Tregoe — and clear both Kepner–Tregoe workspaces? This cannot be undone.'))return;
    const result=clearProblemMeLocalData();
    if(!result.ok){els.actionStatus.textContent='LOCAL DATA CLEAR FAILED_';return}
    state=blankState();sync();renderPrivacy();
    els.actionStatus.textContent=result.count?`LOCAL DATA CLEARED — ${result.count} ITEM${result.count===1?'':'S'}_`:'NO SAVED LOCAL DATA FOUND_';
    window.dispatchEvent(new Event('pm-clear-all'));updateRestoreButton();
  });

  $('ktCopyBtn').addEventListener('click',async()=>{const text=['problem.me — Kepner–Tregoe summary','',...decisionSummary(),'','----------------','',...problemSummary(),'','Reminder: scores and fit rankings support judgment; they do not manufacture certainty.',privateMode?'Private Session — not saved by problem.me':'Generated locally at problem.me'].join('\n');try{await navigator.clipboard.writeText(text);els.actionStatus.textContent='SUMMARY COPIED_'}catch(e){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');els.actionStatus.textContent='SUMMARY COPIED_'}catch(_){els.actionStatus.textContent='COPY FAILED_'}ta.remove()}});$('ktPrintBtn').addEventListener('click',()=>{renderPdf();window.print()});$('ktResetBtn').addEventListener('click',()=>{const q=privateMode?'Reset this Private Session? The previously saved local Kepner–Tregoe draft, if any, will remain untouched.':'Reset both local Kepner–Tregoe workspaces?';if(!confirm(q))return;state=blankState();if(!privateMode){try{ProblemMeDraftStore.remove(KEY)}catch(e){}}sync();els.actionStatus.textContent=privateMode?'PRIVATE SESSION RESET — NOT SAVED_':'DRAFT RESET_'})
  window.addEventListener('beforeprint',renderPdf);
  load();sync();renderPdf();renderPrivacy();
})();

