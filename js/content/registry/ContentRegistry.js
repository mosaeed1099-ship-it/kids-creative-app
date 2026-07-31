/**
 * ContentRegistry — the in-memory database of everything loaded.
 *
 * Holds packs, categories and items, and maintains secondary INDEXES for fast
 * lookups (asset indexing): by type, tag, category, pack, language, age and
 * difficulty. Registering a pack automatically indexes its items.
 */
import Collection from '../model/Collection.js';

export default class ContentRegistry {
  constructor({ emitter } = {}) {
    this.emitter = emitter;
    this.packs = new Map();       // id → Pack
    this.categories = new Map();  // id → Category
    this.items = new Map();       // id → ContentItem

    this.index = {
      type: new Map(), tag: new Map(), category: new Map(),
      pack: new Map(), language: new Map(), age: new Map(), difficulty: new Map(),
    };
  }

  // --- registration ---
  registerPack(pack) {
    this.packs.set(pack.id, pack);
    pack.categories.forEach((c) => this.categories.set(c.id, c));
    pack.items.forEach((it) => this.registerItem(it, false));
    this.emitter?.emit('registry:pack', pack);
    return pack;
  }

  registerItem(item, emit = true) {
    this.items.set(item.id, item);
    this._idx('type', item.assetType, item.id);
    this._idx('category', item.categoryId, item.id);
    this._idx('pack', item.packId, item.id);
    this._idx('difficulty', item.difficulty, item.id);
    this._idx('age', item.ageGroup, item.id);
    item.tagSlugs().forEach((t) => this._idx('tag', t, item.id));
    item.languages.forEach((l) => this._idx('language', l, item.id));
    if (emit) this.emitter?.emit('registry:item', item);
    return item;
  }

  _idx(kind, key, id) {
    if (key == null) return;
    const map = this.index[kind];
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(id);
  }

  // --- lookups ---
  getItem(id) { return this.items.get(id) || null; }
  getPack(id) { return this.packs.get(id) || null; }
  getCategory(id) { return this.categories.get(id) || null; }
  hasPack(id) { return this.packs.has(id); }

  allItems() { return [...this.items.values()]; }
  allPacks() { return [...this.packs.values()]; }
  allCategories() { return [...this.categories.values()]; }

  /** Resolve an index bucket to items. */
  _byIndex(kind, key) {
    const ids = this.index[kind].get(key);
    if (!ids) return [];
    return [...ids].map((id) => this.items.get(id)).filter(Boolean);
  }

  byType(t) { return this._byIndex('type', t); }
  byTag(t) { return this._byIndex('tag', String(t).toLowerCase()); }
  byCategory(c) { return this._byIndex('category', c); }
  byPack(p) { return this._byIndex('pack', p); }
  byLanguage(l) { return this._byIndex('language', l); }
  byAge(a) { return this._byIndex('age', a); }
  byDifficulty(d) { return this._byIndex('difficulty', d); }

  /** A Collection over all items (or a subset), for chainable queries. */
  collection(items = null) { return new Collection(items || this.allItems()); }

  /** Distinct index keys (useful to build filter UIs later). */
  facets() {
    const keys = (m) => [...m.keys()].filter((k) => k != null);
    return {
      type: keys(this.index.type), tag: keys(this.index.tag), category: keys(this.index.category),
      pack: keys(this.index.pack), language: keys(this.index.language),
      age: keys(this.index.age), difficulty: keys(this.index.difficulty),
    };
  }

  clear() {
    this.packs.clear(); this.categories.clear(); this.items.clear();
    Object.values(this.index).forEach((m) => m.clear());
  }
}
