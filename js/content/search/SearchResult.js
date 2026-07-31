/**
 * SearchResult — one ranked hit from the SearchEngine.
 * `score` is a relevance number (higher = better); `matches` lists which
 * fields matched (title, tags, category, description, …).
 */
export default class SearchResult {
  constructor(item, score = 0, matches = []) {
    this.item = item;
    this.score = score;
    this.matches = matches;
  }

  get id() { return this.item?.id; }
  toJSON() { return { id: this.id, score: this.score, matches: this.matches }; }
}
