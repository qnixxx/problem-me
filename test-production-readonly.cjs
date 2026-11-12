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
'privacy.html','features.html',
'academy.html','foundations.html','choose-method.html','professional-cases.html','practice.html','glossary.html',
'evidence-lab.html','lab-signin.html','lab-warehouse.html','lab-migration.html'];
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
    assert.equal(await page.locator('input,textarea,form,select,button,script,[contenteditable]').count(),0,route+' user input, button or script');
    assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0,route+' browser persistence');
    assert.equal(await page.locator('html.investigation-embedded, .site-drawer, .workspace-shell, .pm-reasoning').count(),0,route+' retired interactive UI');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    if(overflow>2){
     const details=await page.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>e.clientWidth>0&&e.scrollWidth>e.clientWidth+3).slice(0,12).map(e=>({el:e.tagName,cls:e.className,width:e.clientWidth,scroll:e.scrollWidth,text:(e.textContent||'').trim().slice(0,35)})));
     console.log('OVERFLOW '+route+' '+width+'px '+JSON.stringify(details));
    }
    assert(overflow<=2,route+' horizontal overflow '+width+'px: '+overflow);
    if(route.startsWith('articles/')){
      const slug=route.split('/').pop().replace('.html','');
      const artwork=await page.locator('.capy-card .pm-guide-3d-art img').evaluateAll(imgs=>imgs.map(img=>{
        const rect=img.getBoundingClientRect();
        return {name:new URL(img.currentSrc||img.src).pathname.split('/').pop(),alt:img.alt,width:rect.width,height:rect.height,loaded:img.complete&&img.naturalWidth>0};
      }));
      assert.equal(artwork.length,1,route+' exactly one 3D guide artwork');
      assert.equal(artwork[0].name,'capybara-'+slug+'-3d.webp',route+' method-specific artwork');
      assert(artwork[0].alt.length>35,route+' accessible image description');
      assert(artwork[0].loaded,route+' artwork loaded');
      assert(artwork[0].width>=150&&artwork[0].height>=90,route+' meaningful image dimensions');
    }
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
   await page.goto(base+'/index.html');
   assert.equal(await page.locator('.readonly-skip-link[href="#top"]').count(),1,'homepage keyboard Skip link');
   assert(await page.locator('main#top').isVisible(),'homepage content visible immediately');
   assert.equal(await page.locator('#boot').count(),0,'old boot gate absent');
   await page.locator('.readonly-skip-link').focus();
   assert.equal(await page.locator('.readonly-skip-link').evaluate(el=>getComputedStyle(el).top),'10px','Skip link appears when focused');

   assert.equal(await page.locator('#mission .mission-card').count(),4,'homepage paths');
   assert.equal(await page.locator('#techniques .tech').count(),4,'homepage case cards');
   await page.goto(base+'/techniques.html');
   assert.equal(await page.locator('.tech-card').count(),4,'library cases');
   assert.equal(await page.locator('#field-guides .guide-card').count(),4,'field guides');
   await page.goto(base+'/academy.html');
   assert(await page.locator('main').isVisible(),'Academy content visible');
   assert.equal(await page.locator('.ac-card').count(),11,'Academy curriculum and method cards');
   await page.goto(base+'/professional-cases.html');
   assert.equal(await page.locator('article.ac-case').count(),4,'four professional cases');
   await page.goto(base+'/practice.html');
   assert.equal(await page.locator('.ac-quiz details').count(),8,'read-only practice self-checks');
   await page.locator('.ac-quiz details').first().locator('summary').click();
   assert(await page.locator('.ac-quiz details').first().getAttribute('open')!==null,'native disclosure works');
   assert.equal(await page.locator('input,textarea,button,select,form,script').count(),0,'practice remains no-input');
   await page.goto(base+'/glossary.html');
   assert.equal(await page.locator('.ac-term').count(),22,'Academy glossary');
   await page.goto(base+'/index.html');
   assert.equal(await page.locator('#academy-paths a[href="foundations.html"]').count(),1,'Academy homepage discovery');
   await page.goto(base+'/evidence-lab.html');
   assert.equal(await page.locator('.ev-case').count(),3,'Lab hub contains three investigations');
   const expectedArtwork={
     'lab-signin.html':'assets/capybara-new-signin.svg',
     'lab-warehouse.html':'assets/capybara-new-warehouse.svg',
     'lab-migration.html':'assets/capybara-new-migration.svg'
   };
   const cardArt=await page.locator('.ev-case img').evaluateAll(imgs=>imgs.map(img=>({path:new URL(img.currentSrc).pathname.split('/').pop(),valid:img.complete&&img.naturalWidth>0,alt:img.alt})));
   assert.equal(cardArt.length,3,'three illustrated Evidence Lab cards');
   assert.deepEqual(cardArt.map(a=>a.path),['capybara-new-signin.svg','capybara-new-warehouse.svg','capybara-new-migration.svg'],'distinct capybara case artwork');
   assert(cardArt.every(a=>a.valid&&a.alt.length>40),'capybara artwork loads and has descriptive alt');
   for(const lab of ['lab-signin.html','lab-warehouse.html','lab-migration.html']){
     await page.goto(base+'/'+lab);
     assert.equal(await page.locator('.ev-stage').count(),3,lab+' three stages');
     assert.equal(await page.locator('.ev-hero-art img').getAttribute('src'),expectedArtwork[lab],lab+' new capybara illustration');
     assert(await page.locator('.ev-hero-art img').evaluate(img=>img.complete&&img.naturalWidth>0&&img.alt.length>40),lab+' art renders and has accessible alternative');
     assert.equal(await page.locator('.ev-evidence').count(),3,lab+' three evidence disclosures');
     assert.equal(await page.locator('.ev-branch').count(),6,lab+' six branching choices');
     assert.equal(await page.locator('#debrief').count(),1,lab+' debrief');
     await page.locator('.ev-evidence summary').first().click();
     assert(await page.locator('.ev-evidence').first().evaluate(e=>e.open),lab+' evidence disclosure opens');
     await page.locator('.ev-branch summary').first().click();
     assert(await page.locator('.ev-branch').first().evaluate(e=>e.open),lab+' decision disclosure opens');
     assert.equal(await page.locator('.ev-branch').first().locator('a[href="#stage2"]').count(),1,lab+' first decision progresses to next stage');
     assert.equal(await page.locator('form,input,textarea,select,button,script,[contenteditable]').count(),0,lab+' no interactive inputs');
     assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0,lab+' no browser storage');
   }
   assert.deepEqual(errors,[],'Lab browser errors at '+width);
   assert.deepEqual(missing,[],'Lab missing resources at '+width);
   assert.deepEqual(external,[],'Lab external requests at '+width);
   console.log('PASS Evidence Lab v2.2.1 at '+width+'px: '+routes.length+' routes, no inputs, storage or external requests');
   await ctx.close();
  }
 }finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
})().catch(err=>{console.error(err);process.exitCode=1;});
