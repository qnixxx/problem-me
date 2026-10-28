'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=__dirname;
const pages=[
'index.html','techniques.html',
'5-whys.html','fishbone.html','pareto.html','kepner-tregoe.html',
'articles/5-whys.html','articles/fishbone.html','articles/pareto.html','articles/kepner-tregoe.html',
'privacy.html','features.html',
'casebook/index.html','casebook/melon-cart.html','casebook/picnic-ants.html','casebook/garden-water.html','casebook/reading-nook.html'
];
const cases=['5-whys.html','fishbone.html','pareto.html','kepner-tregoe.html'];
const guides=pages.filter(p=>p.startsWith('articles/'));
const retired=['investigation.html','investigations.html','board-experiment.html','brand-system.html'];
const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
const robots=fs.readFileSync(path.join(root,'robots.txt'),'utf8');
assert(robots.includes('Sitemap: https://problem.me/sitemap.xml'),'robots sitemap advertised');
const found=[...sitemap.matchAll(/<loc>https:\/\/problem\.me\/([^<]*)<\/loc>/g)].map(m=>m[1]==='casebook/'?'casebook/index.html':m[1]||'index.html');
assert.equal(found.length,pages.length,'sitemap has one URL per public content page');
assert.equal(new Set(found).size,found.length,'sitemap paths unique');
assert.deepEqual([...found].sort(),[...pages].sort(),'sitemap matches editorial routes');
const pattern=/<meta\s+(?:name="robots"\s+content="noindex|content="noindex[^"]*"\s+name="robots")/i;
for(const p of pages){
 const html=fs.readFileSync(path.join(root,p),'utf8');
 const head=html.split('</head>')[0];
 assert(!pattern.test(head),p+' should be indexable');
 assert(head.includes('https://problem.me/'+(p==='index.html'?'':p)),p+' canonical or social URL');
 assert(!/<(?:input|textarea|select|form)\b/i.test(html),p+' has visitor inputs');
 if(cases.includes(p)||guides.includes(p)){
   assert(/rel="canonical"/i.test(head),p+' canonical link');
   assert(/property="og:description"/i.test(head),p+' sharing description');
   assert(!/og:description"\s+content="[^"]*\binteractive\b/i.test(head),p+' obsolete preview copy');
 }
}
for(const p of retired){
 const html=fs.readFileSync(path.join(root,p),'utf8');
 assert(pattern.test(html.split('</head>')[0]),p+' retired page should be excluded from search');
 assert(!/<(?:input|textarea|select|form)\b/i.test(html),p+' obsolete input');
}
const caseSlugs=['melon-cart','picnic-ants','garden-water','reading-nook'];
const casebookHome=fs.readFileSync(path.join(root,'casebook','index.html'),'utf8');
assert(casebookHome.includes('SMALL PROBLEMS.'),'casebook retains original terminal editorial mood');
for(const slug of caseSlugs){
 const story=fs.readFileSync(path.join(root,'casebook',slug+'.html'),'utf8');
 const img=path.join(root,'casebook','illustrations',slug+'.svg');
 assert(casebookHome.includes('href="'+slug+'.html"'),'casebook has story link '+slug);
 assert(fs.existsSync(img),'original artwork exists '+slug);
 assert(story.includes('READ-ONLY'),'read-only labeling '+slug);
 assert(story.includes('href="../articles/'),'Field Guide crosslink '+slug);
 assert.equal([...story.matchAll(/class="cb-chapter"/g)].length,4,'four narrative chapters '+slug);
 assert(!/\bstyle="/.test(story),'no inline style '+slug);
 assert(!/<(?:form|textarea|select|input)\b/i.test(story),'no visitor input '+slug);
 const svg=fs.readFileSync(img,'utf8');
 assert(svg.startsWith('<svg')&&svg.includes('viewBox="0 0 1200 700"'),'vector artwork valid '+slug);
}
const garden=fs.readFileSync(path.join(root,'casebook','garden-water.html'),'utf8');
assert(garden.includes('50')&&garden.includes('84%')&&garden.includes('68%'),'Pareto arithmetic readable');
const nook=fs.readFileSync(path.join(root,'casebook','reading-nook.html'),'utf8');
assert(nook.includes('43')&&nook.includes('38'),'decision weights readable');
assert(casebookHome.includes('FICTIONAL'),'fictional case disclaimer present');
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const feature=fs.readFileSync(path.join(root,'features.html'),'utf8');
assert(home.includes('application-version" content="2.1.0"'),'release metadata');
assert(feature.includes('CURRENT v2.1.0'),'release log version');
assert(!home.includes('My Investigations'),'obsolete footer link');
assert(!home.includes('CURRENT SITE ↗'),'obsolete label');
assert(home.includes('Skip to main content'),'keyboard Skip link');
assert(fs.existsSync(path.join(root,'runtime/index-1.js')),'original boot visuals present');
assert(fs.existsSync(path.join(root,'assets/capybara-soaking.webp')),'original mascot present');
console.log('PASS v2.1.0: crawlable educational pages, accurate case metadata, retired routes excluded, original identity intact.');
