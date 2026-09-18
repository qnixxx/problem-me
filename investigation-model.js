(function(root) {
  'use strict';
  const TECHNIQUES = ['5-whys', 'fishbone'];
  const LIMIT = 1024 * 1024;
  const clone = value => JSON.parse(JSON.stringify(value));
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const strings = (obj, keys) => record(obj) && keys.every(key => typeof obj[key] === 'string');
  const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
  function blank(tool) {
    if (tool === '5-whys') return {problem:'',root:'',countermeasure:'',notes:'',whys:Array.from({length:5},()=>({text:'',verify:false}))};
    return {effect:'',supported:'',nextTest:'',notes:'',categories:['People','Process','Tools / Systems','Environment','Inputs','Measurement'].map(name=>({name,causes:[{text:'',status:'untested'}]}))};
  }
  function validTool(tool, data) {
    if (tool === '5-whys') return strings(data,['problem','root','countermeasure','notes'])
      && Array.isArray(data.whys) && data.whys.length >= 1 && data.whys.length <= 10
      && data.whys.every(x=>strings(x,['text']) && typeof x.verify === 'boolean');
    return strings(data,['effect','supported','nextTest','notes']) && Array.isArray(data.categories)
      && data.categories.length === 6 && data.categories.every(c=>strings(c,['name'])
        && Array.isArray(c.causes) && c.causes.length >= 1 && c.causes.length <= 5
        && c.causes.every(x=>strings(x,['text']) && ['untested','no','likely','confirmed'].includes(x.status)));
  }
  function validate(obj) {
    if (!record(obj) || obj.schema !== 'problem.me/investigation' || ![1,2].includes(obj.schemaVersion)) throw Error('Unsupported investigation format.');
    if (!strings(obj,['appVersion','id','title','status']) || !obj.id.trim() || obj.title.length > 80
        || !['open','verifying','resolved','archived'].includes(obj.status) || !date(obj.createdAt) || !date(obj.updatedAt)) throw Error('Invalid investigation details.');
    const supported = obj.schemaVersion === 1 ? ['5-whys'] : TECHNIQUES;
    if (!supported.includes(obj.currentTechnique) || !Array.isArray(obj.techniquesUsed)
        || !obj.techniquesUsed.includes(obj.currentTechnique) || !obj.techniquesUsed.every(x=>supported.includes(x))) throw Error('Unsupported technique.');
    if (!record(obj.toolData) || !Object.keys(obj.toolData).every(x=>supported.includes(x))
        || !obj.techniquesUsed.every(x=>validTool(x,obj.toolData[x]))
        || !Object.keys(obj.toolData).every(x=>validTool(x,obj.toolData[x]))) throw Error('Invalid tool workspace.');
    if (!Array.isArray(obj.evidence) || obj.evidence.length > 12 || !obj.evidence.every(x=>strings(x,['text']) && ['fact','assumption','test','result'].includes(x.type))) throw Error('Invalid Evidence Ledger.');
    if (!Array.isArray(obj.history) || !obj.history.every(x=>strings(x,['technique','action']) && date(x.at))) throw Error('Invalid investigation history.');
    return obj;
  }
  function decode(text) {
    if (new TextEncoder().encode(text).length > LIMIT) throw Error('File exceeds the 1 MiB limit.');
    const obj = clone(validate(JSON.parse(text)));
    obj.schemaVersion = 2;
    obj.appVersion = '0.8.1';
    TECHNIQUES.forEach(tool => { if (!obj.toolData[tool]) obj.toolData[tool] = blank(tool); });
    return obj;
  }
  function fresh() {
    const now = new Date().toISOString();
    return {schema:'problem.me/investigation',schemaVersion:2,appVersion:'0.8.1',
      id:root.crypto.randomUUID(),title:'',status:'open',createdAt:now,updatedAt:now,
      currentTechnique:'5-whys',techniquesUsed:['5-whys'],history:[],
      toolData:Object.fromEntries(TECHNIQUES.map(t=>[t,blank(t)])),evidence:[]};
  }
  function encode(value) {
    validate(value);
    const text = JSON.stringify(value,null,2);
    if (new TextEncoder().encode(text).length > LIMIT) throw Error('Investigation exceeds 1 MiB. Shorten the content before saving or exporting.');
    return text;
  }
  root.ProblemMeInvestigation = {TECHNIQUES,LIMIT,clone,blank,validate,decode,fresh,encode};
})(globalThis);
