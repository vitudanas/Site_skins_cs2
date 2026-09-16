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
  const api = {normalize, read, write, variation};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Craft = api;
})(typeof window !== 'undefined' ? window : globalThis);
