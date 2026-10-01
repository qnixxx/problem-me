// Model/compatibility checks. Controller behavior runs in test-browser.cjs
// against real iframes and IndexedDB, rather than obsolete localStorage mocks.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const ctx = vm.createContext({crypto, TextEncoder, Date, JSON, Number, Error});
vm.runInContext(fs.readFileSync(path.join(__dirname, 'investigation-model.js'), 'utf8'), ctx);
const M = ctx.ProblemMeInvestigation;
let checks = 0;
function check(name, fn) { fn(); checks++; console.log('PASS', name); }
check('JavaScript syntax: runtime scripts and all HTML inline scripts', () => {
  for (const folder of ['', 'articles']) for (const name of fs.readdirSync(path.join(__dirname, folder))) {
    const file = path.join(__dirname, folder, name);
    if (name.endsWith('.js')) new vm.Script(fs.readFileSync(file, 'utf8'));
    if (name.endsWith('.html')) for (const m of fs.readFileSync(file, 'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(m[1]);
  }
});
check('schema 3 roundtrip retains all three tools, evidence and Unicode', () => {
  const s = M.fresh();
  s.toolData['5-whys'].problem = '配送遅延 🦫';
  s.toolData.fishbone.categories[0].causes[0].text = 'Missing shift';
  s.toolData.pareto.rows[0] = {name:'Delivery', value:'42'};
  s.evidence = [{type:'fact', text:'Literal <script> is evidence text'}];
  assert.equal(JSON.stringify(M.decode(M.encode(s))), JSON.stringify(s));
});
for (const version of [1, 2]) check(`schema ${version} migrates without losing original work`, () => {
  const s = M.fresh(); s.schemaVersion = version; s.appVersion = version === 1 ? '0.7.1' : '0.8.0';
  delete s.toolData.pareto; if (version === 1) delete s.toolData.fishbone;
  s.toolData['5-whys'].notes = 'Keep this'; s.evidence = [{type:'test',text:'original evidence'}];
  const original = JSON.stringify(s), migrated = M.decode(original);
  assert.equal(migrated.id, s.id); assert.equal(migrated.createdAt, s.createdAt);
  assert.equal(migrated.schemaVersion, 3); assert.equal(migrated.appVersion, '1.0.0');
  assert.equal(migrated.toolData['5-whys'].notes, 'Keep this');
  assert.deepEqual(migrated.evidence, s.evidence);
  assert.equal(migrated.toolData.pareto.rows.length, 6);
  assert.equal(migrated.toolData.fishbone.categories.length, 6);
  assert.equal(JSON.stringify(s), original);
});
check('missing unused technique states receive defaults', () => {
  const s = M.fresh(); delete s.toolData.fishbone; delete s.toolData.pareto;
  assert.equal(M.decode(JSON.stringify(s)).toolData.pareto.rows.length, 6);
});
check('malformed imports and unsupported future schemas fail safely', () => {
  for (const change of [s=>s.schemaVersion=4, s=>s.schemaVersion=0,
    s=>s.toolData['5-whys'].whys=[null], s=>delete s.toolData['5-whys'],
    s=>s.toolData.fishbone.categories=[], s=>s.evidence=[{type:'bad',text:'x'}],
    s=>delete s.id, s=>s.createdAt='yesterday', s=>s.currentTechnique='kepner-tregoe',
    s=>s.toolData.pareto.rows[0].value='-1', s=>s.toolData.pareto.threshold=101]) {
    const s=M.fresh(); change(s); assert.throws(()=>M.decode(JSON.stringify(s)));
  }
  for (const text of ['{bad json', 'null', '[]', '{}']) assert.throws(()=>M.decode(text));
});
check('1 MiB limit uses UTF-8 bytes on both import and export', () => {
  const s=M.fresh(); s.toolData['5-whys'].notes='€'.repeat(400000);
  assert.throws(()=>M.encode(s)); assert.throws(()=>M.decode(JSON.stringify(s)));
  s.toolData['5-whys'].notes='€'.repeat(100000); assert.doesNotThrow(()=>M.decode(M.encode(s)));
});
console.log(`${checks} checks passed.`);
