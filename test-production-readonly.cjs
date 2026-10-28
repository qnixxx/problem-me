'use strict';
// Real-browser gate for all publicly reachable v2 pages. No input, network
// telemetry, third-party scripts, or persistence in the read-only edition.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=__dirname;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png','.ico':'image/x-icon','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
 let file=path.resolve(root,'.'+pathname);
 if(pathname.endsWith('/'))file=path.join(file,'index.html');
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,bytes)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(err?'Missing':bytes);});
});
const routes=['index.html','techniques.html','5-whys.html','fishbone.html','pareto.html','kepner-tregoe.html',
'articles/5-whys.html','articles/fishbone.html','articles/pareto.html','articles/kepner-tregoe.html',
'privacy.html','features.html','casebook/','casebook/melon-cart.html','casebook/picnic-ants.html','casebook/garden-water.html','casebook/reading-nook.html','investigation.html','investigations.html','board-experiment.html','brand-system.html'];
const cases=['5-whys.html','fishbone.html','pareto.html','kepner-tregoe.html'];
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  for(const width of [1440,390,320]){
   const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   const page=await ctx.newPage();
   const errors=[],missing=[],external=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400)missing.push(r.status()+' '+r.url());});
   page.on('request',r=>{if(!r.url().startsWith(base))external.push(r.url());});
   for(const route of routes){
    await page.goto(base+'/'+route,{waitUntil:'load'});
    assert(await page.title(),route+' title');
    assert.equal(await page.locator('main').count(),1,route+' main landmark');
    assert.equal(await page.locator('input,textarea,form,select,[contenteditable]').count(),0,route+' visitor input');
    assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0,route+' browser persistence');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    if(overflow>2){
     const details=await page.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>e.clientWidth>0&&e.scrollWidth>e.clientWidth+3).slice(0,12).map(e=>({el:e.tagName,cls:e.className,width:e.clientWidth,scroll:e.scrollWidth,text:(e.textContent||'').trim().slice(0,35)})));
     console.log('OVERFLOW '+route+' '+width+'px '+JSON.stringify(details));
    }
    assert(overflow<=2,route+' horizontal overflow '+width+'px: '+overflow);
    const broken=await page.locator('img').evaluateAll(async imgs=>{
      await Promise.all(imgs.map(img=>new Promise(ok=>{
        img.loading='eager';if(img.complete){ok();return;}
        img.addEventListener('load',ok,{once:true});img.addEventListener('error',ok,{once:true});
      })));
      return imgs.filter(img=>!img.complete||!img.naturalWidth).map(img=>img.src);
    });
    assert.deepEqual(broken,[],route+' images');
    if(route.startsWith('articles/')){
      const rects=await page.locator('.readonly-guide-actions .readonly-guide-action').evaluateAll(links=>links.map(link=>{
        const r=link.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,height:r.height};
      }));
      assert.equal(rects.length,2,route+' two guide actions');
      assert(rects.every(r=>r.height>=44),route+' guide tap targets');
      const [a,b]=rects;
      assert(!(a.x<b.right-1&&b.x<a.right-1&&a.y<b.bottom-1&&b.y<a.bottom-1),route+' guide links overlap');
      if(width<=390)assert(b.y>=a.bottom+8,route+' guide actions must be stacked on mobile');
    }
    if(cases.includes(route)){
      const rectangles=await page.locator('.readonly-actions a').evaluateAll(links=>links.map(link=>{
        const r=link.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
      }));
      assert.equal(rectangles.length,2,route+' two concluding links');
      assert(rectangles.every(r=>r.height>=44),route+' touch target');
      const [a,b]=rectangles;
      assert(!(a.x<b.right-1&&b.x<a.right-1&&a.y<b.bottom-1&&b.y<a.bottom-1),route+' links overlap');
      if(width<=390)assert(b.y>=a.bottom+8,route+' mobile links must stack');
    }
   }
   assert.deepEqual(errors,[],'script errors at '+width);
   assert.deepEqual(missing,[],'missing content at '+width);
   assert.deepEqual(external,[],'external network calls at '+width);
   await page.goto(base+'/casebook/');
   assert.equal(await page.locator('.cb-card').count(),4,'four new casebook cards');
   for(const slug of ['melon-cart','picnic-ants','garden-water','reading-nook']){
     await page.goto(base+'/casebook/'+slug+'.html');
     assert.equal(await page.locator('.cb-chapter').count(),4,slug+' complete method story');
     assert.equal(await page.locator('.cb-end .cb-btn').count(),2,slug+' guide and next story links');
   }
   await page.goto(base+'/index.html');
   assert.equal(await page.locator('.readonly-skip-link[href="#top"]').count(),1,'homepage keyboard Skip link');
   await page.locator('.readonly-skip-link').focus();
   assert.equal(await page.locator('.readonly-skip-link').evaluate(el=>getComputedStyle(el).top),'10px','Skip link appears when focused');

   assert.equal(await page.locator('#casebook .cb-home-card').count(),4,'homepage casebook cards');
   assert.equal(await page.locator('#mission .mission-card').count(),4,'homepage paths');
   assert.equal(await page.locator('#techniques .tech').count(),4,'homepage case cards');
   await page.goto(base+'/techniques.html');
   assert.equal(await page.locator('.tech-card').count(),4,'library cases');
   assert.equal(await page.locator('#field-guides .guide-card').count(),4,'field guides');
   console.log('PASS read-only production at '+width+'px: '+routes.length+' routes, no input/storage/external requests, original capybaras');
   await ctx.close();
  }
 }finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
})().catch(err=>{console.error(err);process.exitCode=1;});
