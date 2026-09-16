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
function boot(storage = memory()) {
  const nodes = new Map();
  const element = () => ({innerHTML: '', textContent: '', value: '', disabled: false, style: {},
    querySelectorAll: () => [], addEventListener() {}, setAttribute() {}, classList: {toggle() {}}, scrollIntoView() {}});
  const document = {getElementById(id) {if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id);},
    querySelectorAll: () => [], querySelector: element};
  const env = {window: {CATALOG: JSON.parse(JSON.stringify(catalog)), Craft, localStorage: storage}, document};
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
