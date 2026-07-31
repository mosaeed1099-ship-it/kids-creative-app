/**
 * Collection — a chainable, immutable-ish query wrapper around an array of
 * ContentItems. Every query returns a NEW Collection so calls compose:
 *
 *   registry.collection()
 *     .byPack('animals').byType('coloring').byAge('preschool')
 *     .sortBy('order').limit(20).toArray();
 */
export default class Collection {
  constructor(items = []) { this.items = items; }

  get length() { return this.items.length; }
  toArray() { return [...this.items]; }
  first() { return this.items[0] || null; }
  count() { return this.items.length; }
  ids() { return this.items.map((i) => i.id); }

  filter(fn) { return new Collection(this.items.filter(fn)); }
  map(fn) { return this.items.map(fn); }
  forEach(fn) { this.items.forEach(fn); return this; }

  byPack(packId) { return this.filter((i) => i.packId === packId); }
  byCategory(categoryId) { return this.filter((i) => i.categoryId === categoryId); }
  byType(assetType) { return this.filter((i) => i.assetType === assetType); }
  byTag(tag) { return this.filter((i) => i.hasTag(tag)); }
  byLanguage(lang) { return this.filter((i) => i.supportsLanguage(lang)); }
  byAge(ageGroup) { return this.filter((i) => i.ageGroup === ageGroup); }
  byDifficulty(d) { return this.filter((i) => i.difficulty === d); }
  enabledOnly() { return this.filter((i) => i.enabled); }

  sortBy(key = 'order', dir = 'asc') {
    const s = [...this.items].sort((a, b) => {
      const av = a[key], bv = b[key];
      return av < bv ? -1 : av > bv ? 1 : 0;
    });
    return new Collection(dir === 'desc' ? s.reverse() : s);
  }

  limit(n) { return new Collection(this.items.slice(0, n)); }
  skip(n) { return new Collection(this.items.slice(n)); }
  concat(other) { return new Collection(this.items.concat(other instanceof Collection ? other.items : other)); }

  /** Distinct values of a field across the collection. */
  distinct(key) {
    const out = new Set();
    for (const it of this.items) {
      const v = it[key];
      if (Array.isArray(v)) v.forEach((x) => out.add(x)); else if (v != null) out.add(v);
    }
    return [...out];
  }
}
