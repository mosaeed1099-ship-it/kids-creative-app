# Content Engine

A **standalone, data-driven** layer that organizes every asset in the app —
coloring pages, trace templates, PDFs, stories, challenges, stickers, lessons,
activities, quizzes — as JSON. It has **no rendering and no feature logic**; a
future feature module reads content from here and decides how to present it.

It imports nothing from the app, the UI system, or the Canvas Engine, so it can
be dropped into any project.

```
Content JSON ─▶ ContentLoader ─▶ Models ─▶ ContentRegistry (+ indexes)
                                              │
              ContentManager (facade) ────────┤── SearchEngine
                                              ├── Filter
                                              ├── FavoritesManager
                                              └── RecentManager
Feature modules ◀── clean API ────────────────┘
```

## Everything is data

No content is hardcoded. A **catalog** lists **packs**; each pack is a JSON file
of **categories** and **items**. Unlimited packs are supported — add a JSON file
and a catalog entry.

```
data/
  catalog.json            # { version, packs: [ { id, title, url, thumbnail, ... } ] }
  packs/
    animals.pack.json     # coloring + trace + pdf + stickers + activities
    alphabet.pack.json    # coloring + writing + trace + flashcards + pdf
    space.pack.json       # coloring + story + puzzle + stickers
```

## Quick start

```js
import { ContentManager, Filter, AssetType } from '../content/index.js';

const cm = new ContentManager({
  base: new URL('../js/content/data/', location.href).href, // where the JSON lives
});

await cm.init({ catalog: 'catalog.json' });   // loads pack DESCRIPTORS only (lazy)
cm.getPacks();                                 // [{ id:'animals', title, thumbnail, ... }]

await cm.loadPack('animals');                  // fetch + index the pack's items

cm.search('lion');                             // → [SearchResult] ranked
cm.filter({ assetType: 'coloring', ageGroup: 'preschool' }).toArray();
cm.loadCategory('animals-coloring').toArray();

cm.toggleFavorite('animals-coloring-lion');
cm.getFavorites().toArray();

const item = cm.open('animals-coloring-lion'); // marks "recent", returns the item
cm.getRecent().toArray();
```

## Public API (ContentManager)

| Method | Purpose |
|--------|---------|
| `init({ catalog })` | load the catalog (pack descriptors; lazy) |
| `getPacks()` | pack descriptors from the catalog |
| `loadPack(id\|descriptor\|path)` | fetch + register + index a pack (idempotent) |
| `loadAll()` | load every catalog pack (prefer lazy `loadPack`) |
| `loadCategory(categoryId)` | `Collection` of items in a category |
| `search(query, options)` | ranked `SearchResult[]` (see search fields) |
| `filter(spec)` | `Collection` filtered by a `Filter` spec |
| `collection()` | chainable `Collection` over all loaded items |
| `getContent(id)` | a `ContentItem` |
| `getPack(id)` / `getCategory(id)` | loaded pack / category |
| `facets()` | distinct index values (to build filter UIs) |
| `getFavorites()` / `toggleFavorite(id)` / `isFavorite(id)` | favorites |
| `getRecent(limit)` / `open(id)` | recently-opened |
| `events` | `Emitter`: `ready`, `pack:loaded`, `open`, `favorites:change`, `recent:change` |

## Search

`SearchEngine` builds an inverted index and ranks by weighted field matches.
Supported fields: **title, description, tags, category, language, age,
difficulty, asset type**. Prefix matching (`lio` → `lion`) and both languages
are indexed.

```js
cm.search('rocket', { assetType: 'coloring', language: 'en', limit: 10 });
// → [ SearchResult { item, score, matches:['title','tag'] }, ... ]
```

## Filter

`Filter` supports: **category, age, difficulty, language, asset type, tags,
pack, favorites, recently-opened**.

```js
import { Filter } from '../content/index.js';
new Filter({ ageGroup:'kids', favorites:true }).apply(items, {
  favorites: cm.favorites.asSet(), recent: cm.recent.asSet(),
});
// or simply:
cm.filter({ ageGroup:'kids', favorites:true });
```

## Packs

A `Pack` bundles categories + items of many asset types:

```
Animals  → coloring · trace · pdf · stickers · activities
Alphabet → coloring · writing · trace · flashcards · pdf
Space    → coloring · story · puzzle · stickers
```

```js
const pack = await cm.loadPack('animals');
pack.assetTypes();               // ['coloring','trace','pdf','sticker','activity']
pack.getByType('coloring');      // [ContentItem, ...]
pack.itemsInCategory('animals-coloring');
```

## Cache & lazy loading

- `ContentCache` — L1 in-memory + L2 localStorage with TTL and a version stamp.
- `loadPack()` fetches a pack only once; subsequent calls return the registered
  instance. The catalog holds lightweight descriptors so nothing heavy loads
  until a pack is opened (**lazy loading**).
- `ContentRegistry` maintains secondary **indexes** (type / tag / category /
  pack / language / age / difficulty) for O(1)-ish lookups (**asset indexing**).

## Content model

`ContentItem` · `Category` · `Pack` · `Tag` · `Thumbnail` · `Metadata` ·
`License` · `Collection`, plus enums `AssetType` · `Difficulty` · `AgeGroup` ·
`Language`. Titles/descriptions are localized maps (`{ ar, en }`) with graceful
fallback; a plain string also works.

`License` records provenance (original / public-domain / cc / proprietary) and
exposes `safeToSell` — useful for a commercial catalog.

## How a FEATURE module will consume this (later)

```js
// e.g. the Coloring module (Phase 5+), pseudocode:
const cm = new ContentManager({ base });
await cm.init();
await cm.loadPack('animals');

const pages = cm.filter({ assetType: 'coloring' }).toArray();
renderGallery(pages);                    // module's own UI

function openPage(id) {
  const item = cm.open(id);              // marks recent
  const url  = item.asset.src;           // load the SVG/PDF/etc.
  // hand the asset to the Canvas Engine and draw it — engine + content, composed
}
```

The Content Engine answers *“what content exists and how is it organized?”*.
The Canvas Engine answers *“how do we draw/interact?”*. Feature modules compose
the two. This phase ships the Content Engine only — **no feature logic**.

## Files

```
content/
  index.js                     public barrel
  model/     ContentItem, Category, Pack, Tag, Thumbnail, Metadata, License,
             Collection, AssetType, Difficulty, AgeGroup, Language
  search/    SearchEngine, SearchResult, Filter
  registry/  ContentRegistry (indexes)
  io/        ContentLoader, ContentCache
  managers/  ContentManager (facade), FavoritesManager, RecentManager
  util/      events (Emitter), persist (localStorage + memory fallback)
  data/      catalog.json + packs/*.pack.json   (SAMPLE data — examples only)
```
