'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=__dirname;
const pages=[
'index.html','techniques.html',
'5-whys.html','fishbone.html','pareto.html','kepner-tregoe.html',
'articles/5-whys.html','articles/fishbone.html','articles/pareto.html','articles/kepner-tregoe.html',
'privacy.html','features.html',
'academy.html','foundations.html','choose-method.html','professional-cases.html','practice.html','glossary.html'
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
 assert(!/<(?:input|textarea|select|form|button|script)\b/i.test(html),p+' is static with no controls or scripts');
 assert(head.includes("script-src 'none'") && head.includes("connect-src 'none'"),p+' script and outbound requests forbidden');
 if(cases.includes(p)||guides.includes(p)){
   assert(/rel="canonical"/i.test(head),p+' canonical link');
   assert(/property="og:description"/i.test(head),p+' sharing description');
   assert(!/og:description"\s+content="[^"]*\binteractive\b/i.test(head),p+' obsolete preview copy');
 }
}
for(const p of retired){
 assert(!fs.existsSync(path.join(root,p)),p+' retired route must not be published');
}
for(const slug of ['5-whys','fishbone','pareto','kepner-tregoe']){
 const html=fs.readFileSync(path.join(root,'articles',slug+'.html'),'utf8');
 assert(html.includes('capybara-'+slug+'-3d.webp'),'Field Guide must use its unique method illustration: '+slug);
 assert(!html.includes('class="capy-art pm-illustrated" aria-hidden="true"'),'Artwork must be accessible: '+slug);
 assert(fs.existsSync(path.join(root,'assets','capybara-'+slug+'-3d.webp')),'Method artwork file exists: '+slug);
}
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const feature=fs.readFileSync(path.join(root,'features.html'),'utf8');
assert(home.includes('application-version" content="2.1.0"'),'release metadata');
assert(feature.includes('CURRENT v2.1.0'),'release log version');
assert(!home.includes('My Investigations'),'obsolete footer link');
assert(!home.includes('CURRENT SITE ↗'),'obsolete label');
assert(home.includes('Skip to main content'),'keyboard Skip link');
assert(!fs.existsSync(path.join(root,'readonly-home.js')),'homepage script removed');
assert(!fs.existsSync(path.join(root,'runtime')),'runtime directory removed');
assert(fs.existsSync(path.join(root,'assets/capybara-soaking.webp')),'original mascot present');
const academy=fs.readFileSync(path.join(root,'academy.html'),'utf8');
const pathfinder=fs.readFileSync(path.join(root,'choose-method.html'),'utf8');
const professionals=fs.readFileSync(path.join(root,'professional-cases.html'),'utf8');
const practice=fs.readFileSync(path.join(root,'practice.html'),'utf8');
const glossary=fs.readFileSync(path.join(root,'glossary.html'),'utf8');
assert(home.includes('href="academy.html"'),'Academy visible on home');
assert(academy.includes('href="foundations.html"')&&academy.includes('href="professional-cases.html"'),'learning path navigation');
assert(pathfinder.includes('Pareto Analysis')&&pathfinder.includes('Problem Analysis'),'method-selection content');
assert((professionals.match(/class="ac-case"/g)||[]).length===4,'four professional cases');
assert((practice.match(/class="ac-quiz"/g)||[]).length===8,'eight self-checks');
assert((practice.match(/<details>/g)||[]).length===8,'eight native disclosure answers');
assert((glossary.match(/class="ac-term"/g)||[]).length===22,'22 glossary definitions');
for(const p of ['academy.html','foundations.html','choose-method.html','professional-cases.html','practice.html','glossary.html']){
 const html=fs.readFileSync(path.join(root,p),'utf8');
 assert(html.includes('href="academy.css"'),'Academy stylesheet '+p);
 assert(html.includes('Skip to content'),'Academy keyboard skip '+p);
 assert(html.includes('href="academy.html"'),'Academy navigation '+p);
}
console.log('PASS v2.1.0: 18 indexable pages, Academy curriculum and no scripts/user-submission forms.');
