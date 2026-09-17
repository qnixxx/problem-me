const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
const path=require('path');
const dir=__dirname;
let checks=0;
const check=(name,fn)=>{fn();checks++;console.log('PASS',name)};
const ctx=vm.createContext({crypto,TextEncoder,Date,JSON,Number,Error,console});
vm.runInContext(fs.readFileSync(path.join(dir,'investigation-model.js'),'utf8'),ctx);
const M=ctx.ProblemMeInvestigation;
check('syntax: all scripts',()=>{
  for(const name of fs.readdirSync(dir)){
    if(name.endsWith('.js'))new vm.Script(fs.readFileSync(path.join(dir,name),'utf8'));
    if(name.endsWith('.html'))for(const m of fs.readFileSync(path.join(dir,name),'utf8').matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
  }
});
check('two-tool round trip preserves work and shared evidence',()=>{
 const s=M.fresh();s.toolData['5-whys'].problem='late delivery';s.toolData.fishbone.categories[0].causes[0].text='missing shift';s.evidence=[{type:'fact',text:'Log <script> stays text'}];
 const restored=M.decode(M.encode(s));assert.equal(restored.toolData.fishbone.categories[0].causes[0].text,'missing shift');assert.equal(restored.toolData['5-whys'].problem,'late delivery');assert.equal(restored.evidence[0].text,s.evidence[0].text);
});
check('v1 migration preserves identity, history, evidence and 5 Whys',()=>{
 const s=M.fresh();s.schemaVersion=1;s.appVersion='0.7.1';delete s.toolData.fishbone;s.toolData['5-whys'].notes='original';
 const migrated=M.decode(M.encode(s));assert.equal(migrated.id,s.id);assert.equal(migrated.schemaVersion,2);assert.equal(migrated.toolData['5-whys'].notes,'original');assert.equal(migrated.toolData.fishbone.categories.length,6);
});
check('malformed files and unsupported future formats rejected',()=>{
 for(const change of [s=>s.schemaVersion=3,s=>s.toolData['5-whys'].whys=[null],s=>s.toolData.fishbone.categories=[],s=>s.evidence=[{type:'bad',text:'x'}],s=>delete s.id,s=>s.createdAt='yesterday',s=>s.toolData.fishbone.categories[0].causes[0].status='invented']){
  const s=M.fresh();change(s);assert.throws(()=>M.decode(JSON.stringify(s)));
 }
 assert.throws(()=>M.decode('{bad json'));
});
check('1 MiB is checked in UTF-8 bytes for import and export',()=>{
 const s=M.fresh();s.toolData['5-whys'].notes='€'.repeat(400000);assert.throws(()=>M.encode(s));assert.throws(()=>M.decode(JSON.stringify(s)));
});

// Exercise the real controller with simulated DOM/adapters/storage, without
// claiming this substitutes for browser focus, layout or iframe testing.
const nodes=new Map(),frames=[],storage=new Map();let writes=0,fail=false,lastBlob,accept=true;
class Element{
 constructor(id){this.id=id;this.value='';this.dataset={};this.listeners={};this.style={};this.children=[];this.hidden=false;this.files=[];this.textContent='';}
 addEventListener(t,f){this.listeners[t]=f}setAttribute(){}append(x){this.children.push(x);if(!this.value&&x.value)this.value=x.value}replaceChildren(){this.children=[];this.value=''}remove(){}click(){this.onclick?.()}get options(){return this.children}
}
function get(id){if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id)}
const document={getElementById:get,querySelectorAll:()=>[...nodes.values()],body:new Element('body'),createElement(tag){
 const el=new Element(tag);
 if(tag==='iframe'){
  let tool,evidence=[];
  el.contentWindow={investigationAdapter:{get:()=>M.clone(tool),set:x=>tool=M.clone(x),evidence:()=>M.clone(evidence),setEvidence:x=>evidence=M.clone(x)}};
  el.contentDocument={body:{scrollHeight:1000}};frames.push(el);
 }
 return el;
}};
const host=vm.createContext({ProblemMeInvestigation:M,document,window:{addEventListener(){}},
 localStorage:{getItem:k=>storage.get(k)??null,setItem(k,v){if(fail)throw Error('quota');writes++;storage.set(k,v)},removeItem:k=>storage.delete(k)},
 ResizeObserver:class{observe(){}},requestAnimationFrame:f=>f(),confirm:()=>accept,Blob,
 URL:{createObjectURL:b=>{lastBlob=b;return 'blob:test'},revokeObjectURL(){}},setTimeout:()=>0,Date,JSON,Number,console});
vm.runInContext(fs.readFileSync(path.join(dir,'investigation.js'),'utf8'),host);
frames.forEach(f=>f.listeners.load());
const api=host.window.problemMePilot;
const five=frames[0].contentWindow.investigationAdapter,fish=frames[1].contentWindow.investigationAdapter;
const click=id=>get(id).onclick();
check('private editing and switching preserve both tools without writes',()=>{
 const data=five.get();data.problem='Private problem';five.set(data);api.changed('5-whys');click('fish');
 const fb=fish.get();fb.effect='Private effect';fish.set(fb);api.changed('fishbone');click('five');assert.equal(five.get().problem,'Private problem');assert.equal(fish.get().effect,'Private effect');assert.equal(writes,0);
});
check('evidence is shared in both directions',()=>{
 five.setEvidence([{type:'fact',text:'one'}]);api.changed('5-whys');assert.equal(fish.evidence()[0].text,'one');click('fish');fish.setEvidence([{type:'result',text:'two'}]);api.changed('fishbone');assert.equal(five.evidence()[0].text,'two');
});
check('local saving contains both tools; returning to private stops writes',()=>{
 click('mode');assert.equal(writes,1);const saved=JSON.parse([...storage.values()][0]);assert.equal(saved.toolData['5-whys'].problem,'Private problem');assert.equal(saved.toolData.fishbone.effect,'Private effect');
 click('mode');const before=writes;get('name').value='private name';get('name').oninput();assert.equal(writes,before);
});
check('failed local save remains private and visible',()=>{
 fail=true;click('mode');assert.match(get('message').textContent,/NOT SAVED/);assert.match(get('privacy').textContent,/PRIVATE SESSION/);fail=false;
});
check('another-tab changes are not overwritten',()=>{
 click('mode');const count=writes;storage.set('problem-me:investigation:pilot:v2','changed by another tab');get('name').value='conflict';get('name').oninput();assert.equal(writes,count);assert.match(get('message').textContent,/another tab/);click('mode');
});
check('cause transfer requires confirmation and preserves WHY answers',()=>{
 click('fish');const fb=fish.get();fb.categories[0].causes[0].text='Candidate cause';fish.set(fb);api.changed('fishbone');get('cause').value='0:0';const old=five.get();old.whys[0].text='Existing answer';five.set(old);
 accept=false;click('examine');assert.equal(five.get().problem,'Private problem');accept=true;click('examine');assert.equal(five.get().problem,'Candidate cause');assert.equal(five.get().whys[0].text,'Existing answer');
});
(async()=>{
 click('export');const exported=await lastBlob.text();assert.equal(M.decode(exported).toolData.fishbone.effect,'Private effect');checks++;console.log('PASS actual controller export');
 const before=writes;get('file').files=[{size:exported.length,text:async()=>exported}];await get('file').onchange();assert.equal(writes,before);assert.match(get('message').textContent,/PRIVATE SESSION/);checks++;console.log('PASS actual controller private import');
 const previous=five.get().problem;get('file').files=[{size:4,text:async()=>'{bad'}];await get('file').onchange();assert.equal(five.get().problem,previous);assert.match(get('message').textContent,/REJECTED/);checks++;console.log('PASS rejected import leaves work intact');
 console.log(`${checks} checks passed. Browser verification remains a separate step.`);
})().catch(e=>{console.error(e);process.exitCode=1});
