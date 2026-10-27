// Bureau preview regression: static editorial experience, no visitor input or persistence.
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
'bureau/','bureau/exhibits/printer.html','bureau/exhibits/sock.html','bureau/exhibits/queue.html',
'bureau/field-manual/5-whys.html','bureau/field-manual/fishbone.html',
'bureau/field-manual/pareto.html','bureau/field-manual/kepner-tregoe.html'
];
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    for(const width of [1440,390,320]){
      const ctx=await browser.newContext({viewport:{width,height:900}});
      const page=await ctx.newPage();
      const errors=[],external=[],missing=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('response',r=>{if(r.status()>=400)missing.push(r.url()+' '+r.status());});
      page.on('request',req=>{if(!req.url().startsWith(origin))external.push(req.url());});
      for(const route of routes){
        await page.goto(origin+'/'+route,{waitUntil:'load'});
        assert.equal(await page.title().then(Boolean),true,route+' title');
        assert.equal(await page.locator('main').count(),1,route+' main');
        assert.equal(await page.locator('input,textarea,form,select,[contenteditable]').count(),0,route+' visitor input');
        assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0,route+' browser storage');
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
        if(overflow>2){
          const elements=await page.evaluate(()=>[...document.querySelectorAll('body *')].map(el=>({el,r:el.getBoundingClientRect()})).filter(({r})=>r.width>0&&(r.right>innerWidth+2||r.left<-2)).slice(0,20).map(({el,r})=>({tag:el.tagName,id:el.id,cls:typeof el.className==='string'?el.className:'',text:(el.textContent||'').trim().slice(0,45),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)})));
          console.log('OVERFLOW DETAILS '+route+' '+width+'px: '+JSON.stringify(elements));
        }
        assert(overflow<=2,route+' overflow at width '+width+' by '+overflow+'px');
        assert.equal(await page.locator('img:not([src])').count(),0,route+' image sources');
        const broken=await page.locator('img').evaluateAll(async imgs=>{
          // Lazy images below the fold need an explicit load before checking naturalWidth.
          await Promise.all(imgs.map(img=>new Promise(resolve=>{
            img.loading='eager';
            if(img.complete){resolve();return;}
            img.addEventListener('load',resolve,{once:true});
            img.addEventListener('error',resolve,{once:true});
          })));
          return imgs.filter(img=>!img.complete||img.naturalWidth===0).map(img=>img.src);
        });
        assert.deepEqual(broken,[],route+' images load');
      }
      assert.deepEqual(errors,[],'runtime errors at '+width);
      assert.deepEqual(external,[],'external network requests at '+width);
      assert.deepEqual(missing,[],'404s at '+width);
      await page.goto(origin+'/bureau/');
      assert.equal(await page.locator('#field-manual .guide').count(),4);
      assert.equal(await page.locator('#cases .case-card').count(),3);
      assert.equal(await page.locator('#personnel .staff').count(),4);
      assert.equal(await page.locator('#forecast-date').textContent().then(x=>x!=="TODAY'S EDITION"),true);
      await page.locator('#surprise-case').click();
      await page.waitForURL(url=>url.pathname.includes('/bureau/exhibits/'));
      console.log('PASS Bureau editorial '+width+'px: 8 routes, no inputs, storage, external requests or horizontal overflow');
      await ctx.close();
    }
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});