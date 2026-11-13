'use strict';
// Browser regression for all published problem.me v1.0 educational pages.
// Enforces no visitor-input controls, third-party requests, or application storage.
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
'evidence-lab.html','lab-signin.html','lab-warehouse.html','lab-migration.html','special-investigation-3sat.html'];
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
    assert.equal(await page.locator('.pm-global-header').count(),1,route+' consistent global header');
    assert.equal(await page.locator('.pm-global-nav a').count(),4,route+' four top-level links');
    assert.deepEqual(await page.locator('.pm-global-nav a').allTextContents(),['Home','Learn','Techniques','Practice'],route+' predictable nav labels');
    assert.equal(await page.locator('.pm-global-footer').count(),1,route+' one compact footer');
    assert.equal(await page.locator('.pm-global-footer .pm-footer-cursor').count(),1,route+' footer has dedicated blinking cursor');
    assert.equal(await page.locator('.pm-global-footer .pm-footer-word').count(),1,route+' footer has independently hoverable problem word');
    assert.equal(await page.locator('.pm-global-footer .pm-footer-cursor').evaluate(el=>getComputedStyle(el).animationName),'none',route+' cursor respects reduced motion');
    if(route!=='index.html'){
      assert.equal(await page.locator('.pm-breadcrumbs').count(),1,route+' breadcrumbs');
      assert.equal(await page.locator('.pm-breadcrumbs [aria-current="location"]').count(),1,route+' current breadcrumb location');
    }

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
   assert.equal(await page.locator('.pm-boot-intro').count(),1,'terminal entrance retained');
   assert.equal(await page.locator('.pm-boot-skip[href="#top"]').count(),1,'skip intro link available');
   assert.equal(await page.locator('.pm-boot-intro').isVisible(),false,'intro hidden when reduced motion preferred');
   assert.equal(await page.locator('.pm-boot-skip').isVisible(),false,'skip hidden when reduced motion preferred');
   const reducedStatuses=await page.locator('.capy-status-values > span').evaluateAll(els=>els.map(el=>({label:el.textContent.trim(),opacity:getComputedStyle(el).opacity,animation:getComputedStyle(el).animationName})));
   assert.deepEqual(reducedStatuses.map(e=>e.label),['UNBOTHERED','CURIOUS','ON THE CASE','THINKING CLEARLY'],'four meaningful capybara statuses');
   assert.deepEqual(reducedStatuses.map(e=>e.opacity),['1','0','0','0'],'reduced motion keeps a stable accessible first status');
   assert(reducedStatuses.every(e=>e.animation==='none'),'reduced motion disables status cycling');
   await page.locator('.readonly-skip-link').focus();
   assert.equal(await page.locator('.readonly-skip-link').evaluate(el=>getComputedStyle(el).top),'10px','Skip link appears when focused');

   assert.equal(await page.locator('#start .pm-journey-card').count(),3,'three homepage starting paths');
   assert.equal(await page.locator('#techniques .tech').count(),4,'homepage case cards');
   await page.goto(base+'/techniques.html');
   assert.equal(await page.locator('.tech-card').count(),4,'library cases');
   assert.equal(await page.locator('#field-guides .guide-card').count(),4,'field guides');
   await page.goto(base+'/features.html');
   assert.equal(await page.locator('.feature-path').count(),4,'v1.0 learning pillars');
   assert.equal(await page.locator('.feature-link').count(),4,'learning resources including 3-SAT');
   assert.equal(await page.locator('.feature-principles li').count(),3,'v1.0 approach');
   assert.equal(await page.locator('article.release,.timeline').count(),0,'feature page contains no historical release timeline');
   assert(await page.getByRole('heading',{name:/Learn the method/}).isVisible(),'v1.0 feature overview visible');
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
   await page.goto(base+'/practice.html');
   assert.equal(await page.locator('a[href="special-investigation-3sat.html"]').count(),1,'Special Investigation visible under Practice');
   await page.goto(base+'/special-investigation-3sat.html');
   assert(await page.getByRole('heading',{name:/The 3-SAT Challenge/}).isVisible(),'3-SAT main title visible');
   assert.equal(await page.locator('.sat-clause').count(),4,'four example 3-SAT clauses');
   assert.equal(await page.locator('table.sat-table tbody tr').count(),8,'eight assignments');
   assert.equal(await page.locator('table.sat-table tbody tr[data-sat="yes"]').count(),4,'four satisfying assignments');
   assert.equal(await page.locator('.sat-disclosure').count(),4,'worked explanations and truth table');
   await page.locator('.sat-disclosure').first().locator('summary').click();
   assert(await page.locator('.sat-disclosure').first().evaluate(e=>e.open),'native 3-SAT explanation opens');
   await page.locator('.sat-disclosure').nth(2).locator('summary').click();
   assert(await page.locator('.sat-disclosure').nth(2).evaluate(e=>e.open),'truth table disclosure opens');
   assert(await page.locator('table.sat-table').isVisible(),'truth table becomes visible');
   assert.equal(await page.locator('input,textarea,form,select,button,script').count(),0,'3-SAT lesson contains no user input or scripts');
   await page.goto(base+'/glossary.html');
   assert.equal(await page.locator('.ac-term').count(),22,'Academy glossary');
   await page.goto(base+'/index.html');
   assert.equal(await page.locator('#start a[href="academy.html"]').count(),1,'Academy homepage discovery');
   assert.equal(await page.locator('#start a[href="techniques.html"]').count(),1,'technique homepage discovery');
   assert.equal(await page.locator('#start a[href="practice.html"]').count(),1,'practice homepage discovery');
   await page.goto(base+'/evidence-lab.html');
   assert.equal(await page.locator('.ev-case').count(),3,'Lab hub contains three investigations');
   const expectedArtwork={
     'lab-signin.html':'assets/capybara-investigator.webp',
     'lab-warehouse.html':'assets/capybara-analyst.webp',
     'lab-migration.html':'assets/capybara-coffee.webp'
   };
   const cardArt=await page.locator('.ev-case img').evaluateAll(async imgs=>{
     await Promise.all(imgs.map(img=>new Promise(ok=>{
       img.loading='eager';
       if(img.complete){ok();return;}
       img.addEventListener('load',ok,{once:true});
       img.addEventListener('error',ok,{once:true});
     })));
     return imgs.map(img=>({path:new URL(img.currentSrc||img.src).pathname.split('/').pop(),valid:img.complete&&img.naturalWidth>0,alt:img.alt}));
   });
   assert.equal(cardArt.length,3,'three illustrated Evidence Lab cards');
   assert.deepEqual(cardArt.map(a=>a.path),['capybara-investigator.webp','capybara-analyst.webp','capybara-coffee.webp'],'distinct capybara case artwork');
   assert(cardArt.every(a=>a.valid&&a.alt.length>40),'capybara artwork loads and has descriptive alt');
   for(const lab of ['lab-signin.html','lab-warehouse.html','lab-migration.html']){
     await page.goto(base+'/'+lab);
     assert.equal(await page.locator('.ev-stage').count(),3,lab+' three stages');
     assert.equal(await page.locator('.ev-investigation-frame').count(),1,lab+' objective and evidence framing');
     assert.equal(await page.locator('.ev-frame-panel').count(),2,lab+' observed and unknown comparison');
     assert.equal(await page.locator('.ev-review').count(),1,lab+' reasoning workshop');
     assert.equal(await page.locator('.ev-check-grid article').count(),3,lab+' verification plan');
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
   console.log('PASS problem.me v1.0 at '+width+'px: '+routes.length+' routes, no inputs, storage or external requests');
   await ctx.close();
  }
  // Verify the nostalgic intro with ordinary motion and a working instant skip.
  const introCtx=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'no-preference'});
  try{
    const introPage=await introCtx.newPage();
    await introPage.goto(base+'/index.html');
    assert(await introPage.locator('.pm-boot-intro').isVisible(),'terminal intro appears for ordinary motion');
    assert(await introPage.locator('main#top').count()===1,'homepage exists before intro ends');
    await introPage.locator('.pm-boot-skip').click();
    await introPage.locator('.pm-boot-intro').waitFor({state:'hidden',timeout:1000});
    assert.equal(await introPage.locator('main#top').isVisible(),true,'skip reveals homepage');
    await introPage.goto(base+'/index.html');
    await introPage.locator('.pm-boot-intro').waitFor({state:'hidden',timeout:5000});
    assert(await introPage.locator('main#top').isVisible(),'terminal intro naturally completes');
    const footerTitle=introPage.locator('.pm-global-footer .pm-footer-title');
    const word=introPage.locator('.pm-global-footer .pm-footer-word');
    const baseColor=await word.evaluate(el=>getComputedStyle(el).color);
    await footerTitle.hover();
    await introPage.waitForTimeout(220);
    const hoverColor=await word.evaluate(el=>getComputedStyle(el).color);
    assert.notEqual(hoverColor,baseColor,'problem word changes color when footer brand hovered');
    const cursor=introPage.locator('.pm-global-footer .pm-footer-cursor');
    assert.equal(await cursor.evaluate(el=>getComputedStyle(el).animationName),'pm-brand-blink','footer cursor animates');
    const statusEls=introPage.locator('.capy-status-values > span');
    assert.equal(await statusEls.count(),4,'four capybara statuses exist');
    const firstVisible=await statusEls.evaluateAll(els=>els.findIndex(el=>getComputedStyle(el).opacity==='1'));
    assert(firstVisible>=0,'one status is displayed');
    await introPage.waitForTimeout(3300);
    const nextVisible=await statusEls.evaluateAll(els=>els.findIndex(el=>getComputedStyle(el).opacity==='1'));
    assert(nextVisible>=0 && nextVisible!==firstVisible,'capybara status automatically changes');
    console.log('PASS terminal entrance: animation completes, skip works, reduced motion respected');
  }finally{await introCtx.close();}
 }finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
})().catch(err=>{console.error(err);process.exitCode=1;});
