const {chromium,expect}=require('playwright/test');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=__dirname,errors=[];let browser,count=0;
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,data)=>{res.writeHead(e?404:200,{'Content-Type':{'.html':'text/html','.css':'text/css','.js':'text/javascript'}[path.extname(file)]||'application/octet-stream'});res.end(e?'Not found':data);});});
const check=async(name,fn)=>{await fn();count++;console.log('PASS',name);};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--disable-gpu']}:{});console.log('Chromium',browser.version());
 const ctx=await browser.newContext({reducedMotion:'reduce'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 let accept=false,unloads=0;page.on('dialog',d=>{if(d.type()==='beforeunload')unloads++;return accept?d.accept():d.dismiss();});
 for(const width of [320,390,1280])for(const route of ['index.html','investigation.html'])await check(`${route} ${width}px: modal focus, close paths, highlight, overflow and scroll`,async()=>{
  await page.setViewportSize({width,height:844});await page.goto(base+route);await expect(page.locator('[data-site-menu]')).toBeVisible();
  await page.evaluate(()=>scrollTo(0,500));const scroll=await page.evaluate(()=>scrollY);
  await page.locator('[data-site-menu]').click();await expect(page.locator('.site-drawer')).toBeVisible();await expect(page.locator('.drawer-close')).toBeFocused();
  await expect(page.locator('[aria-expanded="true"]')).toHaveCount(1);await expect(page.locator('.site-drawer [aria-current="page"]')).toHaveCount(1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.keyboard.press('Shift+Tab');assert(await page.evaluate(()=>document.activeElement.closest('.site-drawer')!==null));
  await page.keyboard.press('Tab');await expect(page.locator('.drawer-close')).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('.site-drawer')).not.toBeVisible();await expect(page.locator('[data-site-menu]')).toBeFocused();
  assert.equal(await page.evaluate(()=>scrollY),scroll);assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'');
  await page.locator('[data-site-menu]').click();await page.mouse.click(2,400);await expect(page.locator('.site-drawer')).not.toBeVisible();
  await page.locator('[data-site-menu]').click();await page.locator('.drawer-close').click();await expect(page.locator('.site-drawer')).not.toBeVisible();
 });
 await check('private edits survive opening/closing menu and cancelled navigation',async()=>{
  await page.goto(base+'investigation.html');await page.waitForFunction(()=>!document.querySelector('#fish').disabled);
  const five=page.frameLocator('iframe[title="5 Whys workspace"]');await five.locator('#problemInput').fill('Keep this private work');
  await page.locator('[data-site-menu]').click();await page.locator('.site-drawer [aria-current]').click();await expect(five.locator('#problemInput')).toHaveValue('Keep this private work');
  await page.locator('[data-site-menu]').click();await page.locator('.site-drawer a[href="privacy.html"]').click();
  await expect(page).toHaveURL(base+'investigation.html');await expect(five.locator('#problemInput')).toHaveValue('Keep this private work');assert(unloads>0);
  await expect(page.locator('.site-drawer')).not.toBeVisible();assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'');
  assert.equal(await page.evaluate(()=>localStorage.length),0);assert.equal(await page.evaluate(async()=>(await indexedDB.databases()).length),0);
 });
 await check('Local Save is unaffected by menu interactions',async()=>{
  accept=true;await page.locator('#mode').click();await expect(page.locator('#saveState')).toHaveText('SAVED LOCALLY');
  const before=await page.evaluate(async()=>JSON.stringify(await ProblemMeInvestigationStore.list()));
  await page.locator('[data-site-menu]').click();await page.locator('.drawer-close').click();
  assert.equal(await page.evaluate(async()=>JSON.stringify(await ProblemMeInvestigationStore.list())),before);
  await page.locator('[data-site-menu]').click();await page.locator('.site-drawer a[href="investigations.html"]').click();await expect(page).toHaveURL(base+'investigations.html');await expect(page.locator('.card')).toHaveCount(1);
 });
 await check('all menu destinations resolve and same-page Home closes without reloading',async()=>{
  for(const href of ['investigation.html','investigations.html','techniques.html','techniques.html#field-guides','privacy.html','features.html']){
   await page.goto(base+'index.html');await page.locator('[data-site-menu]').click();await page.locator(`.site-drawer a[href="${href}"]`).click();await expect(page).toHaveURL(base+href);
  }
  await page.goto(base+'index.html');await page.evaluate(()=>window.testNavigationSentinel=true);await page.locator('[data-site-menu]').click();await page.locator('.site-drawer a[aria-current]').click();assert(await page.evaluate(()=>window.testNavigationSentinel));
 });
 await check('menu remains usable while workspace initialization is pending',async()=>{
  const p=await ctx.newPage();let release;const wait=new Promise(r=>release=r);
  await p.route('**/5-whys.html?investigation=1',async route=>{await wait;await route.continue();});
  await p.goto(base+'investigation.html',{waitUntil:'domcontentloaded'});await expect(p.locator('#fish')).toBeDisabled();await p.locator('[data-site-menu]').click();await p.locator('.drawer-close').click();release();await p.waitForFunction(()=>!document.querySelector('#fish').disabled);await p.close();
 });
 await check('JS-unavailable fallback keeps existing header navigation',async()=>{
  const c=await browser.newContext({javaScriptEnabled:false});const p=await c.newPage();await p.goto(base+'investigation.html');await expect(p.locator('[data-menu-replaced]')).toBeVisible();await expect(p.locator('[data-site-menu]')).not.toBeVisible();await c.close();
 });
 if(process.env.SCREENSHOT_DIR){fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});for(const width of [390,1280]){await page.setViewportSize({width,height:844});await page.goto(base+'index.html');await page.locator('[data-site-menu]').click();await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,`menu-${width}.png`)});}}
 assert.deepEqual(errors,[]);console.log(`${count} navigation checks passed; no page errors.`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
