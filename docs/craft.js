'use strict';
// Shared, validated data boundary for device-local crafts.
(function (root) {
  function normalize(input, catalog) {
    if (!input || !Number.isInteger(input.skinIndex) || !catalog.skins[input.skinIndex] ||
        !['harmonia', 'contraste', 'minimal'].includes(input.mood) ||
        !Array.isArray(input.placed) || input.placed.length > 5) return null;
    const placed = [];
    for (const p of input.placed) {
      if (!p || !catalog.stickers.some(s => s.id === p.id) ||
          !['x', 'y', 'rotation', 'scale'].every(k => Number.isFinite(p[k])) ||
          p.x < 5 || p.x > 95 || p.y < 7 || p.y > 93 ||
          p.rotation < -180 || p.rotation > 180 || p.scale < .5 || p.scale > 1.8) return null;
      placed.push({id: p.id, x: p.x, y: p.y, rotation: p.rotation, scale: p.scale});
    }
    return {skinIndex: input.skinIndex, mood: input.mood, placed};
  }
  function read(storage, catalog) {
    try {
      const raw = JSON.parse(storage.getItem('dna-skin-lab-v2') || 'null');
      if (!raw || raw.version !== 2) return {draft: null, saved: []};
      const ids = new Set();
      const saved = (Array.isArray(raw.saved) ? raw.saved : []).slice(0, 12).flatMap(item => {
        const craft = normalize(item, catalog);
        if (!craft || !craft.placed.length || typeof item.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(item.id) ||
            ids.has(item.id) || typeof item.name !== 'string' || !item.name.trim()) return [];
        ids.add(item.id);
        return [{...craft, id: item.id, name: item.name.trim().slice(0, 40)}];
      });
      return {draft: normalize(raw.draft, catalog), saved};
    } catch { return {draft: null, saved: []}; }
  }
  function write(storage, draft, saved) {
    try { storage.setItem('dna-skin-lab-v2', JSON.stringify({version: 2, draft, saved})); return true; }
    catch { return false; }
  }
  function variation(catalog, skinIndex, mood, random = Math.random) {
    const skin = catalog.skins[skinIndex];
    const ids = mood === 'contraste' ? skin.contrast : skin.match;
    const count = mood === 'minimal' ? 1 : mood === 'contraste' ? 3 : 2;
    const offset = Math.floor(random() * ids.length);
    return {skinIndex, mood, placed: Array.from({length: count}, (_, i) => ({
      id: ids[(i + offset) % ids.length],
      x: Math.min(95, Math.max(5, skin.positions[i][0] + (random() * 8 - 4))),
      y: Math.min(93, Math.max(7, skin.positions[i][1] + (random() * 6 - 3))),
      rotation: Math.round(random() * 30 - 15), scale: Math.round((.85 + random() * .3) * 100) / 100
    }))};
  }
  function timeline(initial, limit = 50) {
    const clone = item => JSON.parse(JSON.stringify(item));
    let states = [clone(initial)], cursor = 0;
    return {
      record(state) {
        if (JSON.stringify(state) === JSON.stringify(states[cursor])) return;
        states = states.slice(0, cursor + 1);
        states.push(clone(state));
        if (states.length > limit) states.shift();
        cursor = states.length - 1;
      },
      canUndo: () => cursor > 0,
      canRedo: () => cursor < states.length - 1,
      undo() {if (cursor > 0) cursor--; return clone(states[cursor]);},
      redo() {if (cursor < states.length - 1) cursor++; return clone(states[cursor]);}
    };
  }
  function encode(input, catalog) {
    const craft = normalize(input, catalog);
    if (!craft || !craft.placed.length) return null;
    const s = catalog.skins[craft.skinIndex];
    return '#craft=' + encodeURIComponent(JSON.stringify({v: 1, skin: s.weapon + '|' + s.name,
      mood: craft.mood, placed: craft.placed}));
  }
  function decode(hash, catalog) {
    if (typeof hash !== 'string' || hash.length > 6000 || !hash.startsWith('#craft=')) return null;
    try {
      const raw = JSON.parse(decodeURIComponent(hash.slice(7)));
      if (raw.v !== 1 || typeof raw.skin !== 'string') return null;
      const skinIndex = catalog.skins.findIndex(s => s.weapon + '|' + s.name === raw.skin);
      const craft = normalize({skinIndex, mood: raw.mood, placed: raw.placed}, catalog);
      return craft?.placed.length ? craft : null;
    } catch { return null; }
  }
  function backup(draft, saved) {
    return JSON.stringify({format: 'dna-da-skin', version: 2, draft, saved}, null, 2);
  }
  function importBackup(text, catalog) {
    if (typeof text !== 'string' || text.length > 100000) return null;
    try {
      const raw = JSON.parse(text);
      if (raw.format !== 'dna-da-skin' || raw.version !== 2 || !Array.isArray(raw.saved) || raw.saved.length > 12) return null;
      const result = read({getItem: () => JSON.stringify(raw)}, catalog);
      // Reject partial imports: never quietly drop a craft from someone's backup.
      if (result.saved.length !== raw.saved.length || !result.draft) return null;
      return result;
    } catch { return null; }
  }
  const api = {normalize, read, write, variation, timeline, encode, decode, backup, importBackup};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Craft = api;
})(typeof window !== 'undefined' ? window : globalThis);
