# Coloring Library Module (Phase 6)

A premium, **Netflix-for-kids** gallery for browsing all coloring content. It
consumes **only the Content Engine public API** and, when a card is tapped,
**calls the existing Coloring Module** (Phase 5) — it never duplicates content
or coloring logic, and it modifies no existing file.

```
Content Engine ──public API──▶ LibraryModel ──▶ ColoringLibrary (gallery UI)
                                                       │ onOpen(item)
                                                       ▼
                                          ColoringLauncher ──▶ Coloring Module (Phase 5)
```

## Features

- **Home (shelves):** featured pack banners, **Continue coloring**, **Recently
  opened**, **Favorites**, and one shelf per pack.
- **Search bar** (Content Engine search) + **Filter panel** (age, difficulty,
  language, pack).
- **Grid view** and **List view** (toggle) with **infinite scrolling**.
- **Category / Pack browser** (tap a featured pack to browse it).
- **Large artwork thumbnails**, **lazy-loaded** (IntersectionObserver) with
  emoji fallback and colored placeholders.
- **Loading skeletons**, **empty-state screens**, friendly pop animations.
- Large touch targets, colorful, responsive, tablet-friendly, fast.

## Usage

```js
import ColoringLibrary, { ColoringLauncher } from '../modules/coloring-library/index.js';
import { ContentManager } from '../content/index.js';

const base = new URL('../js/modules/coloring-library/content/', location.href).href;
const content = new ContentManager({ base });

// The launcher hosts the real Coloring Module in an overlay:
const resolveAsset = (item) => new URL(item.asset.src, base).href;
const launcher = new ColoringLauncher({ content, resolveAsset });

const library = new ColoringLibrary({
  mount: '#app',
  content,
  onOpen: (item) => launcher.open(item),      // ← calls the Coloring Module
  options: { resolveThumb: resolveAsset },     // thumbnails = the artwork itself
});
await library.mount();   // loads content (skeletons) then renders the gallery
```

## Public API (ColoringLibrary)

| Member | Purpose |
|--------|---------|
| `mount()` | build UI, load content (with skeletons), render |
| `onOpen(item)` | callback invoked on card tap (wire to the Coloring Module) |
| `refresh()` | re-render (call after returning from coloring to update recent/continue) |
| `state` | `{ view:'home'\|'grid'\|'list', query, filters }` |
| `destroy()` | teardown |

## How it consumes the Content Engine (no duplication)

`LibraryModel` calls only public methods:
`content.init()`, `content.loadAll()`, `content.filter({assetType:'coloring',…})`,
`content.search(query, {assetType:'coloring',…})`, `content.getPacks()`,
`content.getRecent()`, `content.getFavorites()`, `content.isFavorite()`,
`content.toggleFavorite()`. "Continue coloring" reads the Coloring module's
`ProgressManager` (public class) — no internals touched.

## Unlimited packs

Packs are pure data. The sample set ships **10 packs** (Animals, Vehicles,
Space, Alphabet, Princess, Dinosaurs, Nature, Food, Jobs, Shapes). Add a pack
JSON + a catalog entry and a new shelf appears — no code changes.

## Files

```
coloring-library/
  index.js                 public barrel
  ColoringLibrary.js       gallery controller (home shelves + results + infinite scroll)
  LibraryModel.js          Content-Engine → gallery data (shelves/search/facets)
  ColoringLauncher.js      opens the Coloring Module (Phase 5) in an overlay
  LazyThumb.js             IntersectionObserver lazy thumbnails
  ui/                      LibraryUI, Row, CardView, FilterPanel, Skeleton, h
  content/                 sample catalog + 10 pack JSON (reuse shared art)
css/coloring-library.css   gallery styling (new file)
examples/coloring-library.html
```
