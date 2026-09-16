const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Craft = require('../docs/craft.js');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../docs/data.js'), 'utf8'), context);
const catalog = context.window.CATALOG;
const draft = {skinIndex: 0, mood: 'harmonia', placed: [{id: 'crown', x: 65, y: 37, rotation: 22, scale: 1.2}]};
test('back-side placements survive storage, history, links and backups without altering old front crafts',()=>{
  const back={...draft,placed:[{...draft.placed[0],face:'back'}]},storage=memory();
  assert.equal(Craft.normalize({...back,placed:[{...back.placed[0],face:'invalid'}]},catalog),null);
  assert.deepEqual(Craft.normalize(draft,catalog),draft);
  Craft.write(storage,back,[]);assert.deepEqual(Craft.read(storage,catalog).draft,back);
  assert.deepEqual(Craft.decode(Craft.encode(back,catalog),catalog),back);
  assert.deepEqual(Craft.importBackup(Craft.backup(back,[]),catalog).draft,back);
  const history=Craft.timeline(draft);history.record(back);assert.deepEqual(history.undo(),draft);assert.deepEqual(history.redo(),back);
});
function memory() {let value; return {getItem: () => value, setItem: (_key, next) => {value = next;}};}
test('reload preserves placement, rotation, scale and named collection', () => {
  const storage = memory();
  const saved = [{...draft, id: 'craft-1', name: 'Minha composição'}];
  assert.equal(Craft.write(storage, draft, saved), true);
  assert.deepEqual(Craft.read(storage, catalog), {draft, saved});
});
test('corrupt data and unavailable storage are recoverable', () => {
  assert.deepEqual(Craft.read({getItem: () => '{broken'}, catalog), {draft: null, saved: []});
  assert.deepEqual(Craft.read(undefined, catalog), {draft: null, saved: []});
  assert.equal(Craft.write({setItem: () => {throw Error('quota');}}, draft, []), false);
});
test('reject unknown items, excess stickers, non-finite and out-of-range transforms', () => {
  for (const change of [{skinIndex: 99}, {mood: 'unknown'}, {placed: Array(6).fill(draft.placed[0])},
    ...[{id: 'unknown'}, {x: NaN}, {y: 100}, {scale: 0}, {rotation: 999}].map(p => ({placed: [{...draft.placed[0], ...p}]}))]) {
    assert.equal(Craft.normalize({...draft, ...change}, catalog), null);
  }
});
test('saved collection ignores duplicate ids, empty and unsafe entries', () => {
  const valid = {...draft, id: 'one', name: '<My craft>'};
  const storage = memory();
  storage.setItem('', JSON.stringify({version: 2, draft, saved: [valid, valid, {...valid, id: 'two', placed: []}, {...valid, id: '<bad>'}]}));
  const loaded = Craft.read(storage, catalog);
  assert.equal(loaded.saved.length, 1);
  assert.equal(loaded.saved[0].name, '<My craft>');
});
test('every skin and mood produces valid curated variations at random boundaries', () => {
  for (let skinIndex = 0; skinIndex < catalog.skins.length; skinIndex++) {
    for (const mood of ['harmonia', 'contraste', 'minimal']) {
      for (const value of [0, .5, .999999]) {
        const craft = Craft.variation(catalog, skinIndex, mood, () => value);
        assert.ok(Craft.normalize(craft, catalog));
        assert.equal(craft.placed.length, mood === 'minimal' ? 1 : mood === 'contraste' ? 3 : 2);
      }
    }
  }
});
function boot(storage = memory(), hash = '', viewer3d) {
  const nodes = new Map();
  const element = () => ({innerHTML: '', textContent: '', value: '', disabled: false, style: {},
    querySelectorAll: () => [], addEventListener() {}, setAttribute() {}, classList: {toggle() {}}, scrollIntoView() {}});
  const document = {getElementById(id) {if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id);},
    querySelectorAll: () => [], querySelector: element, addEventListener() {}};
  const env = {window: {CATALOG: JSON.parse(JSON.stringify(catalog)), Craft, localStorage: storage, location: {origin: 'https://example.org', pathname: '/', search: '', hash}}, document};
  if(viewer3d)env.window.Viewer3D=viewer3d;
  env.window.history={replaceState(){env.window.location.hash='';}};
  vm.createContext(env);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../docs/app.js'), 'utf8'), env);
  return {nodes, run: code => vm.runInContext(code, env), storage};
}
test('application saves a named craft, restores draft and renders safe saved names', () => {
  const app = boot();
  app.run('applySuggestion()');
  app.run('document.getElementById("craft-name").value = "<img src=x onerror=alert(1)>"');
  app.run('saveCraft()');
  assert.match(app.nodes.get('saved-crafts').innerHTML, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(app.nodes.get('saved-crafts').innerHTML, /<img src=x/);
  assert.equal(app.run('savedCrafts.length'), 1);
  const reloaded = boot(app.storage);
  assert.equal(reloaded.run('placed.length'), 2);
  assert.equal(reloaded.run('savedCrafts.length'), 1);
  assert.equal(reloaded.nodes.get('counter').textContent, '2 / 5');
});
test('application does not report success or add a saved craft after quota failure', () => {
  const app = boot({getItem: () => null, setItem: () => {throw Error('quota');}});
  app.run('applySuggestion(); saveCraft()');
  assert.equal(app.run('savedCrafts.length'), 0);
  assert.match(app.nodes.get('status').textContent, /Não foi possível salvar/);
});
test('comparison retains the saved transform while current draft is edited', () => {
  const app = boot();
  app.run('applySuggestion(); saveCraft(); reference=savedCrafts[0]; renderCompare()');
  const before = app.nodes.get('compare-panel').innerHTML;
  app.run('placed[0].rotation=90; updatePlacements(); renderCompare()');
  assert.equal(app.nodes.get('compare-panel').innerHTML, before);
  assert.equal(app.run('savedCrafts[0].placed[0].rotation'), 0);
  assert.equal(app.run('placed[0].rotation'), 90);
});
test('history restores complete states, isolates snapshots and drops redo after a new edit', () => {
  const history = Craft.timeline(draft);
  const next = {...draft, skinIndex: 1};
  history.record(next); next.skinIndex = 2;
  assert.equal(history.undo().skinIndex, 0);
  assert.equal(history.redo().skinIndex, 1);
  history.undo(); history.record({...draft, mood: 'minimal'});
  assert.equal(history.canRedo(), false);
  assert.equal(history.undo().mood, 'harmonia');
});
test('history is bounded to fifty states and ignores unchanged snapshots', () => {
  const history = Craft.timeline(draft);
  for (let i = 0; i < 80; i++) history.record({...draft, placed: [{...draft.placed[0], rotation: i}]});
  let steps = 0;
  while (history.canUndo()) {history.undo(); steps++;}
  assert.equal(steps, 49);
  const unchanged = Craft.timeline(draft); unchanged.record(draft);
  assert.equal(unchanged.canUndo(), false);
});
test('share links restore exact transforms and use stable skin names', () => {
  const link = Craft.encode(draft, catalog);
  assert.deepEqual(Craft.decode(link, catalog), draft);
  const reordered = {...catalog, skins: [...catalog.skins].reverse()};
  assert.equal(Craft.decode(link, reordered).skinIndex, 3);
  assert.equal(link.includes('name'), false);
});
test('share links reject malformed, oversized, unknown and unsupported data', () => {
  for (const hash of ['#craft=%', '#craft=null', '#craft=' + 'a'.repeat(6001), '#wrong=1',
    '#craft=' + encodeURIComponent(JSON.stringify({v: 99, skin: 'AWP|Duality'}))]) assert.equal(Craft.decode(hash, catalog), null);
  assert.equal(Craft.encode({...draft, placed: []}, catalog), null);
});
test('collection backups roundtrip and invalid partial imports are rejected', () => {
  const saved = [{...draft, id: 'craft-1', name: 'Neon'}];
  assert.deepEqual(Craft.importBackup(Craft.backup(draft, saved), catalog), {draft, saved});
  assert.equal(Craft.importBackup(Craft.backup(draft, [{...saved[0], placed: [{...draft.placed[0], id: 'unknown'}]}]), catalog), null);
  assert.equal(Craft.importBackup('x'.repeat(100001), catalog), null);
  assert.equal(Craft.importBackup('{}', catalog), null);
});
test('application undo and redo preserve the saved collection and update the draft', () => {
  const app = boot(); app.run('applySuggestion(); saveCraft(); chooseSkin(1)');
  assert.equal(app.run('skinIndex'), 1);
  app.run('replay("undo")');
  assert.equal(app.run('skinIndex'), 0);
  assert.equal(app.run('placed.length'), 2);
  assert.equal(app.run('savedCrafts.length'), 1);
  app.run('replay("redo")');
  assert.equal(app.run('skinIndex'), 1);
  assert.equal(app.run('placed.length'), 0);
});
test('sharing panel reflects the current composition after undo', () => {
  const app = boot(); app.run('applySuggestion()');
  const url = app.nodes.get('share-url').value;
  assert.ok(url.startsWith('https://example.org/#craft='));
  app.run('chooseMood("minimal"); applySuggestion(); replay("undo"); replay("undo")');
  assert.equal(app.nodes.get('share-url').value, url);
});
test('import preview and confirmation merge the collection without changing current draft', async () => {
  const app = boot(); app.run('applySuggestion(); saveCraft()');
  const current = app.run('JSON.stringify(snapshot())');
  const text = Craft.backup(draft, [{...draft, id: 'new-craft', name: 'Outra ideia'}]);
  app.run('incomingText=' + JSON.stringify(text));
  await app.run('prepareImport({target:{files:[{size:incomingText.length,text:async()=>incomingText}],value:""}})');
  assert.equal(app.run('savedCrafts.length'), 1);
  assert.match(app.nodes.get('import-panel').innerHTML, /1 craft para adicionar/);
  app.nodes.get('confirm-import').onclick();
  assert.equal(app.run('savedCrafts.length'), 2);
  assert.equal(app.run('JSON.stringify(snapshot())'), current);
});
test('invalid imported files leave the draft and collection intact', async () => {
  const app = boot(); app.run('applySuggestion(); saveCraft()');
  const before = app.run('JSON.stringify(snapshot())');
  await app.run('prepareImport({target:{files:[{size:10,text:async()=>"bad json"}],value:""}})');
  assert.equal(app.run('savedCrafts.length'), 1);
  assert.equal(app.run('JSON.stringify(snapshot())'), before);
  assert.match(app.nodes.get('status').textContent, /nenhum dado foi alterado/);
});
test('PNG export draws weapon and stickers, clips the stage and initiates a download', async () => {
  const app = boot();
  app.run(`
    calls=[];URL={createObjectURL:()=>"blob:test",revokeObjectURL(){}};setTimeout=()=>0;
    Image=class {constructor(){this.naturalWidth=512;this.naturalHeight=384;}set src(value){this.onload();}};
    ctx={fillRect(){},fillText(){},save(){},restore(){},translate(x,y){calls.push(['translate',x,y]);},beginPath(){},rect(x,y,w,h){calls.push(['cliprect',w,h]);},clip(){},
      createRadialGradient:()=>({addColorStop(){}}),moveTo(){},lineTo(){},stroke(){},drawImage(...args){calls.push(['draw',...args.slice(1)]);},rotate(){},scale(){}};
    document.body={append(){}};
    document.createElement=type=>type==='canvas'?{getContext:()=>ctx,toBlob:cb=>cb({})}:{click(){document.downloaded=true;},remove(){}};
    applySuggestion();
  `);
  await app.run('exportPng()');
  assert.equal(app.run('document.downloaded'), true);
  assert.equal(app.run('calls.filter(c=>c[0]==="draw").length'), 3);
  assert.equal(app.run('calls.some(c=>c[0]==="cliprect"&&c[1]===1400&&c[2]===800)'), true);
  assert.equal(app.run('exporting'), false);
  assert.match(app.nodes.get('status').textContent, /Download da composição iniciado/);
});
test('PNG export reports asset failure and restores export controls', async () => {
  const app = boot(); app.run('Image=class {set src(value){this.onerror();}}; applySuggestion()');
  await app.run('exportPng()');
  assert.equal(app.run('exporting'), false);
  assert.equal(app.nodes.get('export-png').disabled, false);
  assert.match(app.nodes.get('status').textContent, /Não foi possível gerar/);
});
test('opening a shared link consumes its fragment and can undo to the previous local draft', () => {
  const storage = memory(); const previous = {...draft, skinIndex: 2};
  Craft.write(storage, previous, [{...previous, id: 'saved-1', name: 'Local'}]);
  const app = boot(storage, Craft.encode(draft, catalog));
  assert.equal(app.run('skinIndex'), 0);
  assert.equal(app.run('window.location.hash'), '');
  app.run('replay("undo")');
  assert.equal(app.run('skinIndex'), 2);
  assert.equal(app.run('savedCrafts.length'), 1);
});

test('3D placement updates the draft, supports undo and preserves saved crafts and front previews',()=>{
  let mounted,destroyed=0;const updates=[];
  const viewer3d={create(_host,options){mounted=options;return {update:state=>updates.push(state),destroy(){destroyed++;},lighting(){},spin(){return false;},placing(){}};}};
  const app=boot(memory(),'',viewer3d);app.run('applySuggestion();saveCraft()');
  const before=app.run('JSON.stringify(savedCrafts)');mounted.onPlace({x:66,y:44,face:'back'});
  assert.equal(app.run('placed[0].face'),'back');assert.equal(app.run('JSON.stringify(savedCrafts)'),before);
  assert.equal(updates.at(-1)[0].face,'back');assert.doesNotMatch(app.nodes.get('placements').innerHTML,/data-uid="1"/);
  assert.match(app.nodes.get('placement-list').innerHTML,/verso/);
  app.run('replay("undo")');assert.equal(app.run('placed[0].face'),undefined);assert.ok(destroyed);
  app.run('setView("2d")');assert.equal(app.run('placed.length'),2);assert.equal(app.nodes.get('stage').hidden,false);
});
