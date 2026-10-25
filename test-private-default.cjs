// Browser regression for private-by-default standalone tools and saved-draft recovery.
'use strict';
const {chromium}=require('playwright/test');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=__dirname;
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,data)=>{
  res.writeHead(err?404:200,{'Content-Type':{'.html':'text/html','.css':'text/css','.js':'text/javascript'}[path.extname(file)]||'application/octet-stream'});
  res.end(err?'Missing':data);
 });
});
const cases=[
 {url:'5-whys.html',field:'problemInput',toggle:'privateSessionBtn',restore:'restoreSaved5WhysBtn',key:'problem-me:5-whys:v1',ledger:'problem-me:evidence:5-whys:v1',value:{problem:'Saved 5 Whys',whys:[{text:'Old cause',verify:false}]},attribute:'problem',expected:'Saved 5 Whys'},
 {url:'fishbone.html',field:'fbEffect',toggle:'fbPrivateBtn',restore:'fbRestoreSavedBtn',key:'problemme_fishbone_v04',ledger:'problem-me:evidence:fishbone:v1',value:{effect:'Saved Fishbone'},attribute:'effect',expected:'Saved Fishbone'},
 {url:'pareto.html',field:'ptAnalysis',toggle:'ptPrivateBtn',restore:'ptRestoreSavedBtn',key:'problemme_pareto_v04',ledger:'problem-me:evidence:pareto:v1',value:{analysis:'Saved Pareto',rows:[{name:'Old data',value:'12'}]},attribute:'analysis',expected:'Saved Pareto'},
 {url:'kepner-tregoe.html',field:'ktDeviation',toggle:'ktPrivateBtn',restore:'ktRestoreSavedBtn',key:'problemme_kt_v04',ledger:'problem-me:evidence:kepner-tregoe:v1',value:{problem:{deviation:'Saved Kepner–Tregoe'}},attribute:'problem.deviation',expected:'Saved Kepner–Tregoe'}
];
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/';let browser;
 try{
  browser=await chromium.launch();
  for(const test of cases){
   const context=await browser.newContext(),page=await context.newPage();
   page.on('dialog',dialog=>dialog.accept());
   await page.goto(base+test.url);
   if(test.url==='kepner-tregoe.html')await page.locator('#ktProblemTab').click();
   assert.equal(await page.locator('#'+test.toggle).getAttribute('aria-pressed'),'true',test.url+' must be private');
   assert.equal(await page.locator('#'+test.restore).isVisible(),false,'no saved data');
   await page.locator('#'+test.field).fill('Transient private change');
   assert.equal(await page.evaluate(()=>localStorage.length),0,test.url+' must not persist private input');
   const original=JSON.stringify(test.value);
   const evidence=JSON.stringify([{type:'fact',text:'Old fact'}]);
   await page.evaluate(({key,ledger,original,evidence})=>{
    localStorage.setItem(key,original);
    localStorage.setItem(ledger,evidence);
   },{key:test.key,ledger:test.ledger,original,evidence});
   await page.reload();
   if(test.url==='kepner-tregoe.html')await page.locator('#ktProblemTab').click();
   assert.equal(await page.locator('#'+test.field).inputValue(),'',
    test.url+' must not auto-load an older draft');
   assert.equal(await page.locator('[data-pm-text="0"]').inputValue(),'',
    test.url+' must not auto-load saved evidence');
   assert.equal(await page.locator('#'+test.restore).isVisible(),true,'saved data discoverable');
   await page.locator('#'+test.field).fill('New private work');
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),test.key),original);
   await page.locator('#'+test.restore).click();
   assert.equal(await page.locator('#'+test.field).inputValue(),test.expected,
    test.url+' explicit restore');
   assert.equal(await page.locator('[data-pm-text="0"]').inputValue(),'Old fact');
   assert.equal(await page.locator('#'+test.toggle).getAttribute('aria-pressed'),'true',
    test.url+' restore remains private');
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),test.key),original,
    test.url+' restore does not rewrite saved work');
   await page.locator('#'+test.field).fill('Opt-in persisted data');
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),test.key),original,
    test.url+' work remains private until explicit save');
   await page.locator('#'+test.toggle).click();
   assert.equal(await page.locator('#'+test.toggle).getAttribute('aria-pressed'),'false');
   const stored=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),test.key));
   const fieldValue=test.attribute==='problem.deviation'?stored.problem.deviation:stored[test.attribute];
   assert.equal(fieldValue,'Opt-in persisted data',test.url+' deliberate saving');
   console.log('PASS '+test.url+' private default, draft restore and Local Save');
   await context.close();
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
