// Read-only evolution smoke test: original design/content preserved, no visitor input or browser persistence.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=__dirname;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png','.ico':'image/x-icon'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=path.resolve(root,'.'+pathname);
  if(pathname.endsWith('/'))file=path.join(file,'index.html');
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,bytes)=>{
    res.writeHead(err?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});
    res.end(err?'not found':bytes);
  });
});
const routes=[
'next/','next/techniques.html',
'next/5-whys.html','next/fishbone.html','next/pareto.html','next/kepner-tregoe.html',
'next/articles/5-whys.html','next/articles/fishbone.html',
'next/articles/pareto.html','next/articles/kepner-tregoe.html'
];
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  for(const width of [1440,390,320]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   const page=await context.newPage();
   const errors=[],external=[],missing=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400)missing.push(r.url()+' '+r.status());});
   page.on('request',req=>{if(!req.url().startsWith(origin))external.push(req.url());});
   for(const route of routes){
    await page.goto(origin+'/'+route,{waitUntil:'load'});
    assert(await page.title(),route+' should have a title');
    assert.equal(await page.locator('main').count(),1,route+' should have one main');
    assert.equal(await page.locator('input,textarea,form,select,[contenteditable]').count(),0,route+' must have no input');
    assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0,route+' must not persist visitor data');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    if(overflow>2){
     const offenders=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.clientWidth>0&&e.scrollWidth>e.clientWidth+5).slice(0,14).map(e=>({tag:e.tagName,cls:e.className,client:e.clientWidth,scroll:e.scrollWidth,txt:(e.textContent||'').trim().slice(0,50)})));
     console.log('OVERFLOW '+route+' '+width+': '+JSON.stringify(offenders));
    }
    assert(overflow<=2,route+' horizontal overflow at '+width+': '+overflow+'px');
    const broken=await page.locator('img').evaluateAll(async images=>{
      await Promise.all(images.map(img=>new Promise(resolve=>{
       img.loading='eager';if(img.complete){resolve();return;}
       img.addEventListener('load',resolve,{once:true});
       img.addEventListener('error',resolve,{once:true});
      })));
      return images.filter(img=>!img.complete||img.naturalWidth===0).map(img=>img.src);
    });
    assert.deepEqual(broken,[],route+' images load');
    if(width===1440){
     const targets=await page.locator('a[href]').evaluateAll(links=>links.map(a=>a.href));
     for(const target of targets){
      const u=new URL(target);
      if(u.origin!==origin)continue; // Existing production site's privacy link intentionally retained.
      const p=decodeURIComponent(u.pathname);
      const file=path.resolve(root,'.'+p);
      assert(file.startsWith(root+path.sep),'out-of-root href');
      assert(fs.existsSync(file)||fs.existsSync(path.join(file,'index.html')),route+' broken link: '+target);
     }
    }
   }
   assert.deepEqual(errors,[],'browser errors at '+width+'px');
   assert.deepEqual(external,[],'external traffic at '+width+'px');
   assert.deepEqual(missing,[],'broken assets at '+width+'px');
   await page.goto(origin+'/next/');
   assert.equal(await page.locator('#mission .mission-card').count(),4);
   assert.equal(await page.locator('#techniques .tech').count(),4);
   await page.goto(origin+'/next/techniques.html');
   assert.equal(await page.locator('#libraryGrid .tech-card').count(),4);
   assert.equal(await page.locator('#field-guides .guide-card').count(),4);
   console.log('PASS /next read-only original design: '+width+'px, 10 pages, 4 cases/guides, no visitor inputs/storage/third-party requests');
   await context.close();
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});