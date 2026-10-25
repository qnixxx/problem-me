// Chromium integration checks for privacy handoffs and CSP enforcement.
'use strict';
const {chromium}=require('playwright/test');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=__dirname;
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':{'.html':'text/html','.css':'text/css','.js':'text/javascript'}[path.extname(file)]||'application/octet-stream'});res.end(err?'Missing':data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/';
 let browser;
 try{
  browser=await chromium.launch();
  const normal=await browser.newContext(),page=await normal.newPage();
  page.on('dialog',d=>d.accept());
  await page.goto(base+'5-whys.html');
  await page.locator('#problemInput').fill('A private-value-like root cause <example>');
  await page.locator('#pmHandoffOne').click();
  await page.waitForURL(url=>url.pathname.endsWith('/fishbone.html'));
  assert.equal(await page.locator('#fbEffect').inputValue(),'A private-value-like root cause <example>');
  assert.equal(new URL(page.url()).hash,'');
  assert(!page.url().includes('root%20cause'));
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('problem-me:handoff:one-time:v1')),null);
  console.log('PASS normal handoff uses one-time token and clears URL/storage');
  // A dynamically inserted inline script must be blocked by the declared CSP.
  const ran=await page.evaluate(()=>{
   const script=document.createElement('script');
   script.textContent='window.__pmCspInlineRan = true;';
   document.head.appendChild(script);
   return Boolean(window.__pmCspInlineRan);
  });
  assert.equal(ran,false,'CSP did not block inline script execution');
  console.log('PASS restrictive CSP blocks inline script injection');

  const priv=await browser.newContext();
  await priv.grantPermissions(['clipboard-read','clipboard-write'],{origin:base.slice(0,-1)});
  const privatePage=await priv.newPage();
  privatePage.on('dialog',d=>d.accept());
  await privatePage.goto(base+'5-whys.html');
  await privatePage.locator('#privateSessionBtn').click();
  await privatePage.locator('#problemInput').fill('Private clipboard starting point');
  await privatePage.locator('#pmHandoffOne').click();
  await privatePage.waitForURL(url=>url.pathname.endsWith('/fishbone.html'));
  assert.equal(await privatePage.evaluate(()=>navigator.clipboard.readText()),'Private clipboard starting point');
  assert.equal(await privatePage.locator('#fbEffect').inputValue(),'');
  assert.equal(await privatePage.evaluate(()=>localStorage.length+sessionStorage.length),0);
  assert.equal(new URL(privatePage.url()).hash,'');
  console.log('PASS private handoff requires explicit clipboard and leaves no site storage');
  await normal.close();await priv.close();
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err);process.exitCode=1;});
