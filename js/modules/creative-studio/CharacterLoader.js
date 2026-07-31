/**
 * CharacterLoader — loads a character definition JSON and preloads every part /
 * expression image through the Canvas Engine's importer (public API). Resolves
 * relative part paths against the character JSON URL and caches images by URL
 * so undo/redo and expression swaps are synchronous.
 */
export default class CharacterLoader {
  constructor({ engine }) { this.engine = engine; this.cache = new Map(); }

  async image(url) {
    if (this.cache.has(url)) return this.cache.get(url);
    const img = await this.engine.importer.image(url); // engine public API
    this.cache.set(url, img);
    return img;
  }
  get(url) { return this.cache.get(url) || null; }

  /** Fetch + hydrate a character def, preloading all its images. */
  async loadCharacter(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`CharacterLoader: ${res.status} for ${url}`);
    const def = await res.json();

    for (const part of def.parts) part._src = new URL(part.src, url).href;
    if (def.expressions) {
      for (const key of Object.keys(def.expressions)) {
        const map = def.expressions[key];
        for (const slot of Object.keys(map)) map[slot] = new URL(map[slot], url).href;
      }
    }

    const urls = new Set(def.parts.map((p) => p._src));
    if (def.expressions) Object.values(def.expressions).forEach((m) => Object.values(m).forEach((u) => urls.add(u)));
    await Promise.all([...urls].map((u) => this.image(u).catch((e) => { console.warn(e); return null; })));

    return def;
  }
}
