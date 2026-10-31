'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=__dirname;
const pages=[
'index.html','techniques.html',
'5-whys.html','fishbone.html','pareto.html','kepner-tregoe.html',
'articles/5-whys.html','articles/fishbone.html','articles/pareto.html','articles/kepner-tregoe.html',
'privacy.html','features.html'
];
const cases=['5-whys.html','fishbone.html','pareto.html','kepner-tregoe.html'];
const guides=pages.filter(p=>p.startsWith('articles/'));
const retired=['investigation.html','investigations.html','board-experiment.html','brand-system.html'];
const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
const robots=fs.readFileSync(path.join(root,'robots.txt'),'utf8');
assert(robots.includes('Sitemap: https://problem.me/sitemap.xml'),'robots sitemap advertised');
const found=[...sitemap.matchAll(/<loc>https:\/\/problem\.me\/([^<]*)<\/loc>/g)].map(m=>m[1]||'index.html');
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
for(const slug of ['5-whys','fishbone','pareto','kepner-tregoe']){
 const html=fs.readFileSync(path.join(root,'articles',slug+'.html'),'utf8');
 assert(html.includes('capybara-'+slug+'-3d.webp'),'Field Guide must use its unique method illustration: '+slug);
 assert(!html.includes('class="capy-art pm-illustrated" aria-hidden="true"'),'Artwork must be accessible: '+slug);
 assert(fs.existsSync(path.join(root,'assets','capybara-'+slug+'-3d.webp')),'Method artwork file exists: '+slug);
}
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const feature=fs.readFileSync(path.join(root,'features.html'),'utf8');
assert(home.includes('application-version" content="2.0.1"'),'release metadata');
assert(feature.includes('CURRENT v2.0.1'),'release log version');
assert(!home.includes('My Investigations'),'obsolete footer link');
assert(!home.includes('CURRENT SITE ↗'),'obsolete label');
assert(home.includes('Skip to main content'),'keyboard Skip link');
assert(fs.existsSync(path.join(root,'runtime/index-1.js')),'original boot visuals present');
assert(fs.existsSync(path.join(root,'assets/capybara-soaking.webp')),'original mascot present');
console.log('PASS v2.0.1: crawlable educational pages, accurate case metadata, retired routes excluded, original identity intact.');
