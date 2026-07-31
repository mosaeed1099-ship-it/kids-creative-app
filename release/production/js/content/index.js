/**
 * index.js — public API barrel for the Content Engine.
 *
 *   import { ContentManager, AssetType, Filter } from '../content/index.js';
 */

// Facade / managers
export { default as ContentManager } from './managers/ContentManager.js';
export { default as FavoritesManager } from './managers/FavoritesManager.js';
export { default as RecentManager } from './managers/RecentManager.js';

// Registry / IO
export { default as ContentRegistry } from './registry/ContentRegistry.js';
export { default as ContentLoader } from './io/ContentLoader.js';
export { default as ContentCache } from './io/ContentCache.js';

// Search / filter
export { default as SearchEngine } from './search/SearchEngine.js';
export { default as SearchResult } from './search/SearchResult.js';
export { default as Filter } from './search/Filter.js';

// Model
export { default as ContentItem } from './model/ContentItem.js';
export { default as Category } from './model/Category.js';
export { default as Pack } from './model/Pack.js';
export { default as Collection } from './model/Collection.js';
export { default as Tag } from './model/Tag.js';
export { default as Thumbnail } from './model/Thumbnail.js';
export { default as Metadata } from './model/Metadata.js';
export { default as License } from './model/License.js';

// Enums
export { AssetType } from './model/AssetType.js';
export { Difficulty } from './model/Difficulty.js';
export { AgeGroup } from './model/AgeGroup.js';
export { Language } from './model/Language.js';

// Utils
export { default as Emitter } from './util/events.js';
export { default as Persist } from './util/persist.js';
