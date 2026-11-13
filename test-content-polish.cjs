'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=__dirname;
const pages=[
'index.html','techniques.html',
'5-whys.html','fishbone.html','pareto.html','kepner-tregoe.html',
'articles/5-whys.html','articles/fishbone.html','articles/pareto.html','articles/kepner-tregoe.html',
'privacy.html','features.html',
'academy.html','foundations.html','choose-method.html','professional-cases.html','practice.html','glossary.html',
'evidence-lab.html','lab-signin.html','lab-warehouse.html','lab-migration.html'
];
const cases=['5-whys.html','fishbone.html','pareto.html','kepner-tregoe.html'];
const guides=pages.filter(p=>p.startsWith('articles/'));
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
 assert(!/\bv(?:0|2)\.\d+(?:\.\d+)?\b/i.test(html),p+' must not mention a superseded version');
 assert(head.includes('https://problem.me/'+(p==='index.html'?'':p)),p+' canonical or social URL');
 assert(!/<(?:input|textarea|select|form|button|script)\b/i.test(html),p+' is static with no controls or scripts');
 assert(head.includes("script-src 'none'") && head.includes("connect-src 'none'"),p+' script and outbound requests forbidden');
 const prefix=p.startsWith('articles/')?'../':'';
 assert(html.includes('href="'+prefix+'site-structure.css"'),p+' shared navigation stylesheet');
 assert((html.match(/class="pm-global-header"/g)||[]).length===1,p+' exactly one global header');
 assert((html.match(/class="pm-global-footer"/g)||[]).length===1,p+' exactly one simple footer');
 assert((html.match(/class="pm-global-nav"/g)||[]).length===1,p+' primary navigation');
 const primary=html.match(/<nav class="pm-global-nav"[^>]*>([\s\S]*?)<\/nav>/);
 assert(primary,p+' primary nav exists');
 const items=[...primary[1].matchAll(/<a href="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(items,['index.html','academy.html','techniques.html','practice.html'].map(x=>prefix+x),p+' same four top-level destinations');
 if(p!=='index.html'){
   assert(html.includes('class="pm-breadcrumbs"'),p+' contextual breadcrumb');
   assert(html.includes('class="pm-crumbs-inner"'),p+' breadcrumb trail');
 }
 if(cases.includes(p)||guides.includes(p)){
   assert(/rel="canonical"/i.test(head),p+' canonical link');
   assert(/property="og:description"/i.test(head),p+' sharing description');
   assert(!/og:description"\s+content="[^"]*\binteractive\b/i.test(head),p+' obsolete preview copy');
 }
}
for(const slug of ['5-whys','fishbone','pareto','kepner-tregoe']){
 const html=fs.readFileSync(path.join(root,'articles',slug+'.html'),'utf8');
 assert(html.includes('capybara-'+slug+'-3d.webp'),'Field Guide must use its unique method illustration: '+slug);
 assert(!html.includes('class="capy-art pm-illustrated" aria-hidden="true"'),'Artwork must be accessible: '+slug);
 assert(fs.existsSync(path.join(root,'assets','capybara-'+slug+'-3d.webp')),'Method artwork file exists: '+slug);
}
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const feature=fs.readFileSync(path.join(root,'features.html'),'utf8');
assert(home.includes('application-version" content="1.0"'),'v1.0 release metadata');
assert(home.includes('status-version"> / v1.0'),'homepage version');
assert(feature.includes('problem.me / v1.0 /') && feature.includes('id="overview"'),'v1.0 feature overview');
assert(!feature.includes('RELEASE HISTORY') && !feature.includes('class="timeline"'),'no historical release timeline');
assert(fs.existsSync(path.join(root,'brand.css')),'current design stylesheet');
assert(!fs.readdirSync(root).some(n=>/^RELEASE-v/i.test(n)),'release history documents removed from production tree');
assert(home.includes('Skip to main content'),'keyboard Skip link');
assert(home.includes('class="pm-boot-intro"')&&home.includes('class="pm-boot-skip"'),'terminal entrance and skip action');
assert(home.includes('aria-hidden="true"><div class="pm-boot-box"'),'intro decorative for assistive tech');
assert((home.match(/class="pm-journey-card"/g)||[]).length===3,'three distinct homepage destinations');
assert(!home.includes('id="mission"')&&!home.includes('id="academy-paths"')&&!home.includes('id="launch"'),'homepage avoids duplicate funnels');
const structure=fs.readFileSync(path.join(root,'site-structure.css'),'utf8');
assert(structure.includes('prefers-reduced-motion:reduce')&&structure.includes('body:has(main#top:target)'), 'intro respects reduced motion and can be skipped');

assert(!fs.readdirSync(root).some(n=>n.endsWith('.js')),'site root has no application JavaScript');
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
const labs=['lab-signin.html','lab-warehouse.html','lab-migration.html'];
const labHub=fs.readFileSync(path.join(root,'evidence-lab.html'),'utf8');
assert(home.includes('href="evidence-lab.html"'),'homepage Evidence Lab discovery');
assert(academy.includes('05 / INVESTIGATE THE EVIDENCE'),'fifth Academy chapter');
assert((academy.match(/class="ac-card"/g)||[]).length===11,'Academy has 11 learning and method cards');
assert((labHub.match(/class="ev-case"/g)||[]).length===3,'Evidence Lab has three scenario cards');
for(const p of labs){
 const html=fs.readFileSync(path.join(root,p),'utf8');
 assert(html.includes('href="evidence-lab.css"'),p+' Lab styling');
 assert(html.includes('id="brief"'),p+' case brief');
 assert(html.includes('id="debrief"'),p+' verification debrief');
 for(const stage of ['stage1','stage2','stage3'])assert(html.includes('id="'+stage+'"'),p+' missing '+stage);
 assert((html.match(/<details class="ev-branch(?: caution)?">/g)||[]).length===6,p+' six decision disclosures');
 assert((html.match(/<details class="ev-evidence">/g)||[]).length===3,p+' three evidence packets');
 assert((html.match(/<summary>/g)||[]).length===9,p+' native disclosure summaries');
 assert((html.match(/href="#stage2"/g)||[]).length>=2,p+' decision progression');
 assert((html.match(/href="#stage3"/g)||[]).length>=2,p+' decision progression');
 assert((html.match(/href="#debrief"/g)||[]).length>=2,p+' debrief progression');
 assert(html.includes('FICTIONAL'),p+' fictional data labeling');
}
assert(labHub.includes('href="lab-signin.html"')&&labHub.includes('href="lab-warehouse.html"')&&labHub.includes('href="lab-migration.html"'),'all three Lab routes discoverable');
const art={
 'lab-signin.html':'assets/capybara-investigator.webp',
 'lab-warehouse.html':'assets/capybara-analyst.webp',
 'lab-migration.html':'assets/capybara-coffee.webp'
};
for(const [page,asset] of Object.entries(art)){
 const html=fs.readFileSync(path.join(root,page),'utf8');
 assert(html.includes('src="'+asset+'"'),page+' established capybara illustration');
 assert(labHub.includes('src="'+asset+'"'),'Evidence Lab card artwork '+asset);
 assert(fs.existsSync(path.join(root,asset)),asset+' approved mascot file exists');
 assert(html.includes('class="ev-investigation-frame"'),page+' evidence framing');
 assert(html.includes('class="ev-frame-grid"'),page+' observed vs unknown grid');
 assert(html.includes('class="ev-review"'),page+' reasoning and verification workshop');
 assert((html.match(/class="ev-check-grid"/g)||[]).length===1,page+' verification actions');
 assert(html.includes('Evidence boundary'),page+' knowledge limits');
}
for(const bad of ['assets/capybara-new-signin.svg','assets/capybara-new-warehouse.svg','assets/capybara-new-migration.svg']){
 assert(!fs.existsSync(path.join(root,bad)),'obsolete experimental illustration removed: '+bad);
}
assert(labHub.includes('id="investigation-route"'),'shared investigation learning route');
assert(!home.includes('NO INPUT. JUST INSIGHT_'),'homepage uses learning-first language');
assert(!academy.includes('STILL COMPLETELY READ-ONLY_'),'Academy does not foreground platform restrictions');
assert(!labHub.includes('NO DATA ENTRY'),'Lab uses investigator-first labels');
for(const p of ['5-whys.html','fishbone.html','pareto.html','kepner-tregoe.html']){
 const html=fs.readFileSync(path.join(root,p),'utf8');
 assert(!html.includes('READ-ONLY CASE STUDY'),p+' editorial case label');
}
console.log('PASS v1.0: terminal entrance, four consistent nav choices, three homepage paths, 22 educational pages, and no visitor inputs.');
