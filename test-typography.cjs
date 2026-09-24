const {chromium,expect}=require('playwright/test');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=__dirname;const routes=fs.readdirSync(root).filter(f=>f.endsWith('.html')).concat(fs.readdirSync(path.join(root,'articles')).filter(f=>f.endsWith('.html')).map(f=>'articles/'+f));
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':{'.html':'text/html','.css':'text/css','.js':'text/javascript'}[path.extname(file)]||'application/octet-stream'});res.end(err?'Missing':data);});});
let browser;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--disable-gpu']}:{});
 const page=await browser.newPage({reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 for(const width of [320,390,1280]){
  await page.setViewportSize({width,height:844});
  for(const route of routes){
   await page.goto(base+route);
   if(route==='index.html')await expect(page.locator('#site')).toHaveClass(/online/);
   if(route==='investigation.html')await page.waitForFunction(()=>!document.querySelector('#fish').disabled);
   const result=await page.evaluate(()=>{
    const style=selector=>{const el=document.querySelector(selector);if(!el)return null;const s=getComputedStyle(el);return {font:s.fontFamily,size:s.fontSize,weight:s.fontWeight};};
    return {body:style('body'),brand:style('header .brand'),lead:style('.hero .lede'),meta:style('.hero .prompt'),overflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   assert.equal(result.body.font,'"Courier New", Courier, monospace',route);
   assert(result.brand,route+' header brand');assert.equal(result.brand.font,result.body.font,route);assert.equal(result.brand.size,width<=640?'20px':'22.4px',route);assert.equal(result.brand.weight,'700',route);
   if(result.lead){assert.equal(result.lead.size,'18px',route);assert(result.lead.font.includes('system-ui'),route);}
   if(result.meta)assert.equal(result.meta.size,'12px',route);
   if(route.startsWith('articles/')||route==='privacy.html'){
    const prose=await page.locator('.article p').first().evaluate(el=>{const s=getComputedStyle(el);return {font:s.fontFamily,size:parseFloat(s.fontSize),line:parseFloat(s.lineHeight)};});
    assert(prose.font.includes('system-ui'),route+' reading face');assert(prose.size>=17,route+' prose size');assert(prose.line/prose.size>=1.7,route+' leading');
   }
   const fields=await page.locator('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]),textarea,select').evaluateAll(els=>els.filter(el=>el.getClientRects().length).map(el=>({id:el.id,size:parseFloat(getComputedStyle(el).fontSize)})));
   for(const field of fields)assert(field.size>=16,route+' field '+field.id+' too small');
   assert.equal(result.overflow,false,route+' overflow');
  }
  console.log(`PASS ${width}px: shared typography and no overflow on all ${routes.length} pages`);
 }
 await page.goto(base+'index.html');await page.locator('[data-site-menu]').click();await page.locator('.site-drawer a[href="techniques.html#field-guides"]').click();await expect(page).toHaveURL(base+'techniques.html#field-guides');await expect(page.locator('#guide-title')).toBeVisible();
 assert.deepEqual(errors,[]);console.log('PASS direct Field Guides route; no JS errors or missing assets.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
