// Review-only standalone Home preview; no publishing or runtime build required.
const fs=require('node:fs'),path=require('node:path');
const target=process.argv[2];if(!target||!path.isAbsolute(target))throw Error('Provide an absolute output HTML path.');
let html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="site-nav.css">','<style>'+fs.readFileSync(path.join(__dirname,'site-nav.css'),'utf8')+'</style>');
html=html.replace('<link rel="stylesheet" href="typography.css">','<style>'+fs.readFileSync(path.join(__dirname,'typography.css'),'utf8')+'</style>');
let script=fs.readFileSync(path.join(__dirname,'site-nav.js'),'utf8').replace("const page=location.pathname.split('/').pop() || 'index.html';","const page='index.html';");
// In this downloaded preview only, keep Home local and route other destinations
// to the live site. The actual prototype retains relative repository links.
script=script.replace('link.getAttribute(\'href\')===page',"(new URL(link.href).pathname.split('/').pop() || 'index.html')===page");
html=html.replace('<script src="site-nav.js" defer></script>','').replace('</body>','<script>'+script+'</script></body>');
html=html.replace(/href="((?:articles\/)?[^"#:/]+\.html(?:#[^"]*)?)"/g,(_,href)=>'href="https://problem.me/'+href+'"');
html=html.replace(/href="favicon.ico"/g,'href="data:image/x-icon;base64,'+fs.readFileSync(path.join(__dirname,'favicon.ico')).toString('base64')+'"');
html=html.replace('<title>', '<title>Menu prototype — ');
fs.writeFileSync(target,html);console.log('Created standalone Home preview:',target);
