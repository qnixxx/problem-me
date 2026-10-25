// No-dependency regression checks for privacy, CSP, import IDs and draft safety.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ROOT=__dirname;
const pages=fs.readdirSync(ROOT).filter(n=>n.endsWith('.html')).map(n=>path.join(ROOT,n))
  .concat(fs.readdirSync(path.join(ROOT,'articles')).filter(n=>n.endsWith('.html')).map(n=>path.join(ROOT,'articles',n)));
let checks=0;
function check(name,fn){return Promise.resolve().then(fn).then(()=>{checks++;console.log('PASS',name);});}
(async()=>{
await check('all pages have restrictive CSP; scripts are external',()=>{
 for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  assert.match(html,/<meta http-equiv="Content-Security-Policy" content="[^"]*script-src 'self'/i,file);
  assert.match(html,/object-src 'none'; base-uri 'self'/,file);
  for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
   assert(/\bsrc=["'][^"']+["']/i.test(m[1]),file+' inline script');
   assert(!m[2].trim(),file+' inline script body');
   const src=m[1].match(/\bsrc=["']([^"']+)["']/i)[1];
   if(!/^https?:/i.test(src))assert(fs.existsSync(path.resolve(path.dirname(file),src)),file+' missing '+src);
  }
  assert(!/\son(?:click|load|error|change|submit)\s*=/i.test(html),file+' inline handler');
 }
});
await check('all runtime JavaScript parses',()=>{
 for(const file of fs.readdirSync(ROOT).filter(n=>n.endsWith('.js'))
   .concat(fs.readdirSync(path.join(ROOT,'runtime')).filter(n=>n.endsWith('.js')).map(n=>'runtime/'+n)))
   new vm.Script(fs.readFileSync(path.join(ROOT,file),'utf8'),{filename:file});
});
await check('no investigation content in fragment handoffs',()=>{
 for(const n of ['5-whys','fishbone','pareto','kepner-tregoe']){
   const js=fs.readFileSync(path.join(ROOT,'runtime',n+(n==='5-whys'?'-3':n==='fishbone'?'-2':n==='pareto'?'-2':'-2')+'.js'),'utf8');
   assert(!js.includes("params.set('pm_seed'"));
   assert(!js.includes('pm_seed='));
 }
});
await check('imported investigation IDs validated',()=>{
 const ctx=vm.createContext({crypto,TextEncoder});
 vm.runInContext(fs.readFileSync(path.join(ROOT,'investigation-model.js'),'utf8'),ctx);
 const M=ctx.ProblemMeInvestigation;
 assert.equal(M.validId(crypto.randomUUID()),true);
 for(const id of ['','X'.repeat(129),'bad id','<img>','%2F','foo/bar']) {
   const sample=M.fresh();sample.id=id;
   assert.throws(()=>M.decode(JSON.stringify(sample)),{message:/Invalid investigation details/});
 }
});
await check('handoffs pass one-time tokens and avoid private storage',async()=>{
 let values=new Map(), navigated=[],copy=[],events={},confirmCount=0;
 const storage={getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const loc={pathname:'/5-whys.html',search:'',hash:'',assign(uri){navigated.push(uri);loc.hash=uri.includes('#')?uri.slice(uri.indexOf('#')):'';}};
 const window={crypto:{randomUUID:()=> 'trusted-token'}};
 const ctx=vm.createContext({window,sessionStorage:storage,location:loc,history:{replaceState(){loc.hash='';}},URLSearchParams,navigator:{clipboard:{writeText:async v=>copy.push(v)}},confirm:()=>{confirmCount++;return true;},alert:()=>{throw Error('No storage fallback desired');},prompt:()=>null});
 vm.runInContext(fs.readFileSync(path.join(ROOT,'handoff.js'),'utf8'),ctx);
 await window.ProblemMeHandoff.navigate({target:'fishbone.html',seed:'Private diagnostic',from:'5-whys',privateMode:false});
 assert.equal(navigated.at(-1),'fishbone.html#pm_handoff=trusted-token');
 assert(!navigated.at(-1).includes('Private diagnostic'));
 assert.equal(values.size,1);
 const taken=window.ProblemMeHandoff.take();
 assert.equal(taken.seed,'Private diagnostic');
 assert.equal(values.size,0);
 assert.equal(window.ProblemMeHandoff.take(),null);
 await window.ProblemMeHandoff.navigate({target:'pareto.html',seed:'Very sensitive problem',from:'5-whys',privateMode:true});
 assert.equal(values.size,0);assert.deepEqual(copy,['Very sensitive problem']);
 assert.equal(navigated.at(-1),'pareto.html#pm_private=1');
 assert.equal(window.ProblemMeHandoff.take().privateMode,true);
 assert(confirmCount>0);
});
await check('stale draft write is blocked and cannot replace another tab',()=>{
 const values=new Map([['draft','previous']]),listeners={};
 const storage={getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const win={addEventListener:(key,fn)=>listeners[key]=fn};
 const ctx=vm.createContext({window:win,localStorage:storage});
 vm.runInContext(fs.readFileSync(path.join(ROOT,'draft-store-guard.js'),'utf8'),ctx);
 const S=win.ProblemMeDraftStore;
 assert.equal(S.read('draft'),'previous');
 S.save('draft','ours');assert.equal(values.get('draft'),'ours');
 values.set('draft','other-tab');
 listeners.storage({storageArea:storage,key:'draft',newValue:'other-tab'});
 assert.throws(()=>S.save('draft','overwritten'),{code:'CONFLICT'});
 assert.equal(values.get('draft'),'other-tab');
 S.remove('draft');S.save('draft','fresh');
 assert.equal(values.get('draft'),'fresh');
});
console.log(checks+' security groups passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
