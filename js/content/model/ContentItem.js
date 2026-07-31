/**
 * ContentItem — the atomic unit of content (one coloring page, one trace
 * template, one PDF, one story, one quiz…). It is DATA: it describes and
 * classifies an asset but contains NO rendering logic. A future feature module
 * reads `assetType` + `asset` and decides how to present it.
 *
 * Titles/descriptions are localized maps ({ ar, en }) but a plain string works
 * too. The engine never assumes a language.
 */
import Thumbnail from './Thumbnail.js';
import License from './License.js';
import Metadata from './Metadata.js';
import Tag from './Tag.js';

export default class ContentItem {
  constructor(props = {}) {
    this.id = props.id;
    this.assetType = props.assetType || 'activity';
    this.title = props.title ?? '';           // string | { ar, en, ... }
    this.description = props.description ?? '';
    this.tags = (props.tags || []).map(Tag.from);
    this.categoryId = props.categoryId || null;
    this.packId = props.packId || null;
    this.languages = props.languages || ['ar'];
    this.ageGroup = props.ageGroup || null;
    this.difficulty = props.difficulty || null;
    /** @type {{type:string, src?:string, data?:any}} pointer to the actual asset */
    this.asset = props.asset || null;
    this.thumbnail = props.thumbnail instanceof Thumbnail ? props.thumbnail : Thumbnail.fromJSON(props.thumbnail || {});
    this.license = props.license instanceof License ? props.license : License.fromJSON(props.license || {});
    this.metadata = props.metadata instanceof Metadata ? props.metadata : Metadata.fromJSON(props.metadata || {});
    this.data = props.data || {};             // free-form payload for modules
    this.enabled = props.enabled !== false;
    this.order = props.order || 0;
  }

  /** Localized title with graceful fallback. */
  getTitle(lang = 'ar') { return this._localized(this.title, lang); }
  getDescription(lang = 'ar') { return this._localized(this.description, lang); }

  _localized(field, lang) {
    if (field == null) return '';
    if (typeof field === 'string') return field;
    return field[lang] ?? field.default ?? Object.values(field)[0] ?? '';
  }

  hasTag(tag) {
    const slug = Tag.slugify(tag);
    return this.tags.some((t) => t.slug === slug);
  }

  tagSlugs() { return this.tags.map((t) => t.slug); }

  supportsLanguage(lang) { return this.languages.includes(lang); }

  /** Flat, lowercased text blob used by the search index. */
  searchText(lang = null) {
    const langs = lang ? [lang] : this.languages.concat('ar', 'en');
    const titles = langs.map((l) => this.getTitle(l));
    const descs = langs.map((l) => this.getDescription(l));
    return [...titles, ...descs, ...this.tagSlugs(), this.assetType, this.categoryId, this.packId]
      .filter(Boolean).join(' ').toLowerCase();
  }

  static fromJSON(o) { return new ContentItem(o); }

  toJSON() {
    return {
      id: this.id, assetType: this.assetType, title: this.title, description: this.description,
      tags: this.tags.map((t) => t.toJSON()), categoryId: this.categoryId, packId: this.packId,
      languages: this.languages, ageGroup: this.ageGroup, difficulty: this.difficulty,
      asset: this.asset, thumbnail: this.thumbnail.toJSON(), license: this.license.toJSON(),
      metadata: this.metadata.toJSON(), data: this.data, enabled: this.enabled, order: this.order,
    };
  }
}
