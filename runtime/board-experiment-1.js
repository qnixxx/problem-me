

const empty = () => ({format:'problem.me/board-experiment',version:1,problem:'',hypotheses:[]});
const example = () => ({format:'problem.me/board-experiment',version:1,problem:'Why do Friday deliveries keep arriving late?',hypotheses:[
{id:'h1',claim:'Orders wait too long for dispatch approval.',evidence:[{text:'8 of 12 late orders waited more than 90 minutes for approval.',source:'Dispatch log · last four Fridays',relation:'supports'},{text:'Two late orders were approved within 15 minutes.',source:'Dispatch log · orders 41 and 67',relation:'challenges'}],prediction:'If approval is the bottleneck, earlier approval should reduce dispatch delays.',test:'For the next two Fridays, trial an earlier approval window. Compare approval wait and dispatch time with the last four Fridays.',result:'',verdict:'untested'},
{id:'h2',claim:'Carrier capacity drops on Fridays.',evidence:[],prediction:'',test:'',result:'',verdict:'untested'},
{id:'h3',claim:'Late inventory updates delay picking.',evidence:[],prediction:'',test:'',result:'',verdict:'untested'}]});
function validate(s) {
 const str=(x,n=4000)=>typeof x==='string'&&x.length<=n;
 if(!s||s.format!=='problem.me/board-experiment'||s.version!==1||!str(s.problem)||!Array.isArray(s.hypotheses)||s.hypotheses.length>30) throw Error('Unsupported or invalid board file.');
 const ids=new Set();
 for(const h of s.hypotheses){
  if(!h||!str(h.id,100)||!h.id||ids.has(h.id)||!str(h.claim)||!h.claim.trim()||!str(h.prediction)||!str(h.test)||!str(h.result)||!['untested','supports','challenges','inconclusive'].includes(h.verdict)||(!h.result.trim()&&h.verdict!=='untested')||!Array.isArray(h.evidence)||h.evidence.length>30) throw Error('Invalid hypothesis or test.');
  ids.add(h.id);
  for(const e of h.evidence)if(!e||!str(e.text)||!e.text.trim()||!str(e.source)||!['supports','challenges','context'].includes(e.relation))throw Error('Invalid evidence.');
 }
 return s;
}
function checkpoint(h){
 if(!h)return ['Start with a question.','Write a specific problem, then add one possible explanation.'];
 if(!h.evidence.length)return ['An explanation looking for evidence.','This hypothesis has no linked observations. Add something you can trace to a source.'];
 if(!h.evidence.some(e=>e.relation==='challenges'))return ['What would change your mind?','No challenging observation is linked to this hypothesis. Look for exceptions; do not invent them.'];
 if(!h.prediction.trim()||!h.test.trim())return ['Let’s introduce this theory to reality.','Write a prediction and a small test. What would you expect to observe if the explanation is wrong?'];
 if(!h.result.trim())return ['Small test. Useful learning.','A test is planned, but no result is recorded. Gather the observations before deciding.'];
 return ['A result is a clue, not a coronation.','Review what the result supports, what it challenges, and what remains uncertain.'];
}

const $=id=>document.getElementById(id);
let state=example(),selected='h1',dirty=false,applyEdit=null;
const current=()=>state.hypotheses.find(h=>h.id===selected);
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function button(text,action,cls){const b=el('button',text,cls);b.type='button';b.addEventListener('click',action);return b;}
function announce(text){$('message').textContent=text;}
function changed(){dirty=true;render();}
function edit(title,fields,save){$('dialogTitle').textContent=title;$('fields').replaceChildren();for(const f of fields){const label=el('label',f.label);label.htmlFor='edit-'+f.key;const n=document.createElement(f.options?'select':'textarea');n.id='edit-'+f.key;n.name=f.key;if(f.options)for(const [v,t]of f.options){const o=el('option',t);o.value=v;n.append(o);}else n.maxLength=4000;n.value=f.value||'';n.required=!!f.required;$('fields').append(label,n);}applyEdit=save;$('editor').showModal();}
$('cancel').onclick=()=>$('editor').close();
$('form').onsubmit=e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.target));for(const n of $('fields').querySelectorAll('[required]'))if(!n.value.trim()){n.setCustomValidity('Please enter some text.');n.reportValidity();n.oninput=()=>n.setCustomValidity('');return;}applyEdit(values);$('editor').close();changed();announce('Board updated — download to keep a copy.');};
function editHypothesis(h){edit('Edit possible cause',[{key:'claim',label:'What might explain the problem?',value:h.claim,required:true}],v=>h.claim=v.claim);}
function editTest(h){edit('Plan a small test',[{key:'prediction',label:'If this explanation is right, what do you predict?',value:h.prediction},{key:'test',label:'What will you do, measure and compare?',value:h.test}],v=>Object.assign(h,v));}
function editResult(h){edit('Record what happened',[{key:'result',label:'Observed result, including source and limits',value:h.result,required:true},{key:'verdict',label:'Your interpretation — this does not prove causality',value:h.verdict==='untested'?'inconclusive':h.verdict,options:[['inconclusive','Inconclusive'],['supports','Supports this explanation'],['challenges','Challenges this explanation']]}],v=>Object.assign(h,v));}
function render(){
 const h=current();$('problemTitle').textContent=state.problem||'What are you trying to understand?';
 $('summary').textContent=state.hypotheses.length+' explanations · '+state.hypotheses.reduce((n,h)=>n+h.evidence.length,0)+' linked observations · '+state.hypotheses.filter(h=>h.result.trim()).length+' recorded results';
 $('hypotheses').replaceChildren();for(const item of state.hypotheses){const b=button('',()=>{selected=item.id;render();announce('Selected: '+item.claim);},'card hypothesis');b.setAttribute('aria-pressed',String(item.id===selected));b.append(el('span','HYPOTHESIS / '+(item.result?'RESULT RECORDED':'OPEN'),'badge'),el('strong',item.claim),el('small',item.evidence.length+' observations · '+(item.test.trim()?'Test planned':'No test yet')));$('hypotheses').append(b);}
 if(!state.hypotheses.length)$('hypotheses').append(el('p','Add a possible explanation. You can explore several without committing to one.','empty'));
 $('selectedLabel').textContent=h?'Linked to: '+h.claim:'Select an explanation to connect evidence.';
 $('evidence').replaceChildren();$('addEvidence').disabled=!h||h.evidence.length>=30;$('addHypothesis').disabled=state.hypotheses.length>=30;
 if(h){for(const e of h.evidence){const card=el('article',undefined,'card evidence');card.append(el('span',e.relation.toUpperCase(),'badge '+e.relation),el('p',e.text),el('small','Source: '+(e.source||'Not recorded')),button('Edit observation',()=>evidenceEditor(h,e)),document.createTextNode(' '),button('Remove',()=>{if(confirm('Remove this observation?')){h.evidence=h.evidence.filter(x=>x!==e);changed();announce('Observation removed.');}}));$('evidence').append(card);}if(!h.evidence.length)$('evidence').append(el('p','What have you actually observed? Link a fact and say whether it supports, challenges or simply adds context.','empty'));}
 $('test').replaceChildren();
 if(h){const card=el('article',undefined,'card');card.append(el('span','ONE SMALL EXPERIMENT','badge'),el('h3','What would we expect to see?'),el('p',h.prediction||'Write a prediction before running the test.','test-copy'),el('span','THE TEST','label'),el('p',h.test||'Choose an observable comparison.','test-copy'),button('Plan / edit test',()=>editTest(h)));$('test').append(card);const result=el('article',undefined,'card');result.append(el('span','WHAT WE LEARNED','badge'),el('p',h.result||'No result recorded yet.','test-copy'));if(h.result)result.append(el('p','Your interpretation: '+h.verdict));result.append(button('Record / edit result',()=>editResult(h)));$('test').append(result);$('test').append(button('Edit explanation',()=>editHypothesis(h)),document.createTextNode(' '),button('Remove explanation',()=>{if(confirm('Remove this explanation and its linked observations, test and result?')){state.hypotheses=state.hypotheses.filter(x=>x!==h);selected=state.hypotheses[0]?.id;changed();announce('Explanation removed.');}}));}else $('test').append(el('p','Add an explanation first. Then plan a test that could challenge it.','empty'));
 const prompt=checkpoint(h);$('promptTitle').textContent=prompt[0];$('prompt').textContent=prompt[1];
}
function evidenceEditor(h,e){edit(e?'Edit observation':'Link an observation',[{key:'text',label:'What did you observe?',value:e?.text,required:true},{key:'source',label:'Where did it come from? Date, record or measurement',value:e?.source},{key:'relation',label:'How does it relate to this explanation?',value:e?.relation||'context',options:[['context','Context / relevance uncertain'],['supports','Supports'],['challenges','Challenges']]}],v=>{if(e)Object.assign(e,v);else h.evidence.push(v);});}
$('editProblem').onclick=()=>edit('Define the problem',[{key:'problem',label:'What is happening, where and when?',value:state.problem,required:true}],v=>state.problem=v.problem);
$('addHypothesis').onclick=()=>edit('Add a possible cause',[{key:'claim',label:'What might explain the problem?',required:true}],v=>{const h={id:crypto.randomUUID(),claim:v.claim,evidence:[],prediction:'',test:'',result:'',verdict:'untested'};state.hypotheses.push(h);selected=h.id;});
$('addEvidence').onclick=()=>{if(current())evidenceEditor(current());};
function replace(next,label){if(dirty&&!confirm('Replace this board? Download first to keep your changes.'))return;state=next;selected=state.hypotheses[0]?.id;dirty=false;render();announce(label);}
$('new').onclick=()=>replace(empty(),'Blank board ready. Start by editing the problem.');
$('example').onclick=()=>replace(example(),'Fictional example loaded.');
$('download').onclick=()=>{try{validate(state);const text=JSON.stringify(state,null,2);if(new TextEncoder().encode(text).length>1048576)throw Error('Board exceeds 1 MiB. Shorten the content before downloading.');const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='problem-me-experimental-board.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('Download requested. Keep this experimental JSON separate from .problemme files.');}catch(e){announce(e.message);}};
$('import').onclick=()=>{$('file').value='';$('file').click();};
$('file').onchange=async()=>{const f=$('file').files[0];if(!f)return;try{if(f.size>1048576)throw Error('Board file exceeds 1 MiB.');const next=validate(JSON.parse(await f.text()));replace(next,'Experimental board opened in memory.');}catch(e){announce('Import rejected; current board kept. '+e.message);}};
addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
render();

