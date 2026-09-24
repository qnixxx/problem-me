// A self-contained reading sample for review, not a replacement site page.
const fs=require('node:fs'),path=require('node:path');
const output=process.argv[2];if(!output||!path.isAbsolute(output))throw Error('Provide an absolute output HTML path.');
const source=path.join(__dirname,'articles/5-whys.html');
let html=fs.readFileSync(source,'utf8').replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,href)=>'<style>'+fs.readFileSync(path.resolve(path.dirname(source),href),'utf8')+'</style>');
html=html.replace('href="../favicon.ico"','href="data:image/x-icon;base64,'+fs.readFileSync(path.join(__dirname,'favicon.ico')).toString('base64')+'"');
html=html.replace(/href="([^"]+)"/g,(match,href)=>href.startsWith('#')||href.startsWith('data:')?match:'href="'+new URL(href,'https://problem.me/articles/5-whys.html').href+'"');
fs.writeFileSync(output,html);console.log('Created reading preview:',output);
