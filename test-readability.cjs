const fs=require('node:fs'),assert=require('node:assert/strict');
const files=fs.readdirSync(__dirname).filter(f=>/\.(css|html)$/.test(f));
let declarations=0;
for(const file of files){
 const source=fs.readFileSync(`${__dirname}/${file}`,'utf8');
 const css=file.endsWith('.css')?source:[...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
 for(const match of css.matchAll(/font-size\s*:\s*([\d.]+)(rem|px)\b/g)){
  assert(Number(match[1]) >= (match[2]==='rem'?.875:14),file+': undersized '+match[0]);declarations++;
 }
}
function luminance(hex){return hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);}
let minimum=Infinity;
for(const ink of ['#c9dfd2','#86b79e','#63ffb5','#ffe95b','#f2f0df','#a2c5b2','#668b79'])for(const bg of ['#020805','#031009','#062015']){
 const ratio=(luminance(ink)+.05)/(luminance(bg)+.05);assert(ratio>=4.5,`${ink} on ${bg}: ${ratio}`);minimum=Math.min(minimum,ratio);
}
console.log(`PASS ${declarations} explicit CSS sizes have a 14px minimum; core text palette contrast >= ${minimum.toFixed(2)}:1. Rendered/opacity/zoom checks require a browser.`);
