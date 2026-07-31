/**
 * SearchEngine — reusable full-text search over ContentItems.
 *
 * Builds an inverted index (term → item ids) for fast candidate lookup, then
 * scores candidates by weighted field matches. Supports the fields required:
 * title, description, tags, category, language, age, difficulty, asset type.
 *
 * Search is language-agnostic (indexes all localized titles/descriptions) and
 * can be constrained with hard filters via the options argument.
 */
import SearchResult from './SearchResult.js';

const WEIGHTS = { title: 6, tag: 4, category: 3, assetType: 2, pack: 1, description: 1 };

export default class SearchEngine {
  constructor() {
    this._items = new Map();      // id → item
    this._index = new Map();      // term → Set(id)
    this._fields = new Map();     // id → { title, description, tags, category, assetType, pack }
  }

  static tokenize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .split(/[\s-]+/)
      .filter((t) => t.length > 0);
  }

  /** Replace the whole corpus and rebuild the index. */
  setItems(items = []) {
    this._items.clear(); this._index.clear(); this._fields.clear();
    for (const it of items) this.add(it, false);
    return this;
  }

  add(item) {
    this._items.set(item.id, item);
    const fields = {
      title: [item.getTitle('ar'), item.getTitle('en')].join(' '),
      description: [item.getDescription('ar'), item.getDescription('en')].join(' '),
      tags: item.tagSlugs().join(' '),
      category: item.categoryId || '',
      assetType: item.assetType || '',
      pack: item.packId || '',
    };
    this._fields.set(item.id, fields);
    const terms = new Set(Object.values(fields).flatMap((f) => SearchEngine.tokenize(f)));
    for (const term of terms) {
      if (!this._index.has(term)) this._index.set(term, new Set());
      this._index.get(term).add(item.id);
    }
    return this;
  }

  remove(id) {
    this._items.delete(id);
    this._fields.delete(id);
    for (const set of this._index.values()) set.delete(id);
  }

  /**
   * @param {string} query
   * @param {object} [options] - hard filters + limit
   *   { limit, language, ageGroup, difficulty, assetType, categoryId, packId }
   * @returns {SearchResult[]} ranked, filtered
   */
  search(query, options = {}) {
    const terms = SearchEngine.tokenize(query);
    let candidateIds;

    if (terms.length === 0) {
      candidateIds = new Set(this._items.keys()); // empty query → everything (then filtered)
    } else {
      candidateIds = new Set();
      for (const term of terms) {
        // substring match so "lio" finds "lion" AND "أسد" finds "الأسد"
        // (Arabic words often carry the definite article "ال" prefix).
        for (const [indexed, ids] of this._index) {
          if (indexed.includes(term)) ids.forEach((id) => candidateIds.add(id));
        }
      }
    }

    const results = [];
    for (const id of candidateIds) {
      const item = this._items.get(id);
      if (!this._passesFilters(item, options)) continue;
      const { score, matches } = terms.length ? this._score(id, terms) : { score: 1, matches: [] };
      if (score > 0) results.push(new SearchResult(item, score, matches));
    }

    results.sort((a, b) => b.score - a.score || a.item.order - b.item.order);
    return options.limit ? results.slice(0, options.limit) : results;
  }

  _score(id, terms) {
    const fields = this._fields.get(id);
    let score = 0;
    const matches = new Set();
    for (const [field, weight] of Object.entries(WEIGHTS)) {
      const tokens = SearchEngine.tokenize(fields[field]);
      for (const term of terms) {
        if (tokens.some((tok) => tok.includes(term))) { score += weight; matches.add(field); }
      }
    }
    return { score, matches: [...matches] };
  }

  _passesFilters(item, o) {
    if (!item || item.enabled === false) return false;
    if (o.language && !item.supportsLanguage(o.language)) return false;
    if (o.ageGroup && item.ageGroup !== o.ageGroup) return false;
    if (o.difficulty && item.difficulty !== o.difficulty) return false;
    if (o.assetType && item.assetType !== o.assetType) return false;
    if (o.categoryId && item.categoryId !== o.categoryId) return false;
    if (o.packId && item.packId !== o.packId) return false;
    return true;
  }
}
