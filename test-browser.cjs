// Real browser regression gate; no separately started server required.
const {chromium, expect} = require('playwright/test');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=__dirname; let browser, checks=0;
const errors=[];
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(e,data)=>{res.writeHead(e?404:200,{'Content-Type':{'.html':'text/html','.css':'text/css','.js':'text/javascript'}[path.extname(file)]||'application/octet-stream'});res.end(e?'Missing':data);});
});
const check=async(name,fn)=>{await fn();checks++;console.log('PASS',name);};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r)); const base=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--disable-gpu']}:{});
 console.log('Chromium',browser.version());
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',acceptDownloads:true});
 const page=await context.newPage(); page.on('dialog',d=>d.accept());page.on('pageerror',e=>errors.push(e.message));
 const ready=async p=>p.waitForFunction(()=>!document.querySelector('#fish').disabled);
 const five=page.frameLocator('iframe[title="5 Whys workspace"]');
 const setTool=async(tool,change)=>page.evaluate(({tool,change})=>{
   const f=[...document.querySelectorAll('iframe')].find(f=>f.src.includes(tool+'.html'));
   const a=f.contentWindow.investigationAdapter,s=a.get();
   if(tool==='fishbone')s.categories[0].causes[0].text=change;
   if(tool==='pareto')s.rows[0]={name:change,value:'42'};
   a.set(s);window.problemMePilot.changed(tool);
 },{tool,change});
 await page.goto(base+'investigation.html');await ready(page);
 await check('fresh Private Session, shared evidence and embedded storage isolation',async()=>{
   await five.locator('#problemInput').fill('Delivery delay');
   await five.locator('[data-pm-text="0"]').fill('Observed delivery log');
   await expect.poll(()=>page.evaluate(()=>[...document.querySelectorAll('iframe')].map(f=>f.contentWindow.investigationAdapter.evidence()[0]?.text))).toEqual(['Observed delivery log','Observed delivery log','Observed delivery log']);
   await page.locator('#pareto').click();await expect(page.locator('#paretoPanel')).toBeHidden();
   assert.equal(await page.evaluate(()=>localStorage.length),0);
   assert.equal(await page.evaluate(async()=>(await indexedDB.databases()).length),0);
 });
 await check('Fishbone → 5 Whys and both Pareto handoffs preserve other work',async()=>{
   await page.locator('#fish').click();await setTool('fishbone','Missing shift');
   await page.locator('#examine').click();await expect(five.locator('#problemInput')).toHaveValue('Missing shift');
   await page.locator('#pareto').click();await setTool('pareto','Late dispatch');
   await page.locator('#paretoWhy').click();await expect(five.locator('#problemInput')).toHaveValue('Late dispatch');
   await page.locator('#pareto').click();await page.locator('#paretoFish').click();
   assert.equal(await page.evaluate(()=>document.querySelector('iframe[title="Fishbone workspace"]').contentWindow.investigationAdapter.get().effect),'Late dispatch');
   assert.equal(await page.evaluate(()=>document.querySelector('iframe[title="Fishbone workspace"]').contentWindow.investigationAdapter.get().categories[0].causes[0].text),'Missing shift');
 });
 await check('Local Save uses IndexedDB and survives reopening',async()=>{
   await page.locator('#name').fill('Release regression');await page.locator('#mode').click();
   await expect(page.locator('#saveState')).toHaveText('SAVED LOCALLY');
   await page.reload();await ready(page);await expect(page.locator('#name')).toHaveValue('Release regression');
   assert.equal(await page.evaluate(async()=>(await ProblemMeInvestigationStore.list()).length),1);
   assert.equal(await page.evaluate(()=>localStorage.length),0);
 });
 let savedURL=page.url();
 await check('entering Private preserves saved copy while new edits remain in memory',async()=>{
   const before=await page.evaluate(async()=>JSON.stringify(await ProblemMeInvestigationStore.list()));
   await page.locator('#mode').click();await page.locator('#name').fill('Private only');
   await page.locator('#five').click();await five.locator('#problemInput').fill('Private change');
   await page.waitForTimeout(400);
   assert.equal(await page.evaluate(async()=>JSON.stringify(await ProblemMeInvestigationStore.list())),before);
   await expect(page.locator('#privacy')).toContainText('PRIVATE SESSION');
 });
 let exported;
 await check('.problemme download and import preserve private work without saving',async()=>{
   const downloadEvent=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadEvent;
   assert(download.suggestedFilename().endsWith('.problemme'));
   exported=fs.readFileSync(await download.path(),'utf8');assert.equal(JSON.parse(exported).schemaVersion,3);
   await page.locator('#file').setInputFiles({name:'release.problemme',mimeType:'application/json',buffer:Buffer.from(exported)});
   await expect(page.locator('#message')).toContainText('IMPORTED INTO PRIVATE SESSION');
   await expect(five.locator('#problemInput')).toHaveValue('Private change');
   assert.equal(await page.evaluate(async()=>(await ProblemMeInvestigationStore.list())[0].title),'Release regression');
 });
 await check('malformed and future imports leave valid current work intact',async()=>{
   const future=JSON.parse(exported);future.schemaVersion=999;
   for(const text of ['{broken',JSON.stringify(future)]){
     await page.locator('#file').setInputFiles({name:'bad.problemme',mimeType:'application/json',buffer:Buffer.from(text)});
     await expect(page.locator('#message')).toContainText('IMPORT REJECTED');
     await expect(five.locator('#problemInput')).toHaveValue('Private change');
   }
 });
 await check('cross-tab conflict pauses saving instead of overwriting newer data',async()=>{
   await page.goto(savedURL);await ready(page);
   const other=await context.newPage();other.on('dialog',d=>d.accept());await other.goto(savedURL);await ready(other);
   await other.locator('#name').fill('Updated in another tab');await expect(other.locator('#saveState')).toHaveText('SAVED LOCALLY');
   await expect.poll(()=>other.evaluate(async()=>(await ProblemMeInvestigationStore.list())[0].title)).toBe('Updated in another tab');
   await page.locator('#name').fill('Conflicting edit');await expect(page.locator('#saveState')).toContainText('CONFLICT');
   assert.equal(await page.evaluate(async()=>(await ProblemMeInvestigationStore.list())[0].title),'Updated in another tab');
   await other.close();
 });
 await check('failed initial local save stays Private and reports failure',async()=>{
   await page.goto(base+'investigation.html');await ready(page);
   await page.evaluate(()=>{window.originalPut=ProblemMeInvestigationStore.put;ProblemMeInvestigationStore.put=async()=>{throw Error('Simulated storage failure');};});
   await page.locator('#mode').click();await expect(page.locator('#message')).toContainText('NOT SAVED');
   await expect(page.locator('#privacy')).toContainText('PRIVATE SESSION');
   await page.evaluate(()=>ProblemMeInvestigationStore.put=window.originalPut);
 });
 await check('legacy schema 1 and 2 saved records reopen and upgrade on explicit save',async()=>{
   for(const version of [1,2]){
     const id=await page.evaluate(async version=>{const s=ProblemMeInvestigation.fresh();s.schemaVersion=version;s.appVersion='0.8.0';delete s.toolData.pareto;if(version===1)delete s.toolData.fishbone;s.toolData['5-whys'].problem='Legacy '+version;await ProblemMeInvestigationStore.put(s);return s.id;},version);
     await page.goto(base+'investigation.html?id='+id);await ready(page);
     await expect(five.locator('#problemInput')).toHaveValue('Legacy '+version);
     await page.locator('#save').click();await expect(page.locator('#saveState')).toHaveText('SAVED LOCALLY');
     assert.equal(await page.evaluate(async id=>(await ProblemMeInvestigationStore.get(id)).schemaVersion,id),3);
   }
 });
 await check('mobile/desktop iframe heights stabilize and all tool pages fit',async()=>{
   for(const width of [390,1280]){
     await page.setViewportSize({width,height:844});
     for(const id of ['five','fish','pareto']){
       await page.locator('#'+id).click();await page.waitForTimeout(300);
       const heights=[];
       for(let i=0;i<4;i++){heights.push(await page.locator('iframe:visible').evaluate(f=>f.getBoundingClientRect().height));await page.waitForTimeout(150);}
       assert(Math.max(...heights)-Math.min(...heights)<=2,`${id}: unstable height ${heights}`);
       assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
       assert.equal(await page.locator('iframe:visible').evaluate(f=>f.contentDocument.documentElement.scrollWidth>f.contentWindow.innerWidth+1),false);
     }
   }
 });
 assert.deepEqual(errors,[]);console.log(`${checks} browser regression groups passed; no page errors.`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
