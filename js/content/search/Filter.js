/**
 * Filter — a declarative filter descriptor + predicate builder.
 *
 * Supports filtering by: category, age, difficulty, language, asset type,
 * tags, pack, favorites, and recently-opened. Favorites/recent need a context
 * (sets of item ids) supplied by the ContentManager at apply time.
 *
 *   const f = new Filter({ assetType:'coloring', ageGroup:'preschool', favorites:true });
 *   const result = f.apply(items, { favorites:new Set([...]), recent:new Set([...]) });
 */
export default class Filter {
  constructor(spec = {}) {
    this.categoryId = spec.categoryId ?? null;
    this.packId = spec.packId ?? null;
    this.ageGroup = spec.ageGroup ?? null;
    this.difficulty = spec.difficulty ?? null;
    this.language = spec.language ?? null;
    this.assetType = spec.assetType ?? null;
    this.tags = spec.tags ?? null;          // array (item must have ALL)
    this.favorites = spec.favorites ?? false;
    this.recent = spec.recent ?? false;
    this.enabledOnly = spec.enabledOnly !== false;
  }

  /** Build a predicate bound to a context ({ favorites:Set, recent:Set }). */
  predicate(context = {}) {
    const fav = context.favorites || new Set();
    const rec = context.recent || new Set();
    return (item) => {
      if (this.enabledOnly && item.enabled === false) return false;
      if (this.categoryId && item.categoryId !== this.categoryId) return false;
      if (this.packId && item.packId !== this.packId) return false;
      if (this.ageGroup && item.ageGroup !== this.ageGroup) return false;
      if (this.difficulty && item.difficulty !== this.difficulty) return false;
      if (this.language && !item.supportsLanguage(this.language)) return false;
      if (this.assetType && item.assetType !== this.assetType) return false;
      if (this.tags && this.tags.length && !this.tags.every((t) => item.hasTag(t))) return false;
      if (this.favorites && !fav.has(item.id)) return false;
      if (this.recent && !rec.has(item.id)) return false;
      return true;
    };
  }

  apply(items, context = {}) {
    return items.filter(this.predicate(context));
  }

  /** Is any constraint active? */
  isEmpty() {
    return !(this.categoryId || this.packId || this.ageGroup || this.difficulty ||
      this.language || this.assetType || (this.tags && this.tags.length) ||
      this.favorites || this.recent);
  }

  static from(spec) { return spec instanceof Filter ? spec : new Filter(spec || {}); }
}
