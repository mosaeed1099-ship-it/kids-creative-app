# Sticker Studio (`js/modules/sticker-studio/`) — Phase 14

A production-quality, offline sticker maker that **replaces the `/stickers`
placeholder**. Additive: every file lives under this folder and it consumes
**only the public APIs** of the Canvas Engine (`js/engine`), the Content Engine
(`js/content`) and the UI foundation (`js/utils/dom` + design tokens). The only
wiring change is one line in `js/data/features.registry.js` pointing `/stickers`
at `StickerStudioModule.js`. No other existing file is modified.

## How it plugs in

```
StickerStudioModule (extends core/Module)
  └─ StickerStudioApp
       ├─ ContentManager (js/content) ── packs / categories / search / favorites / recent
       ├─ CanvasEngine   (js/engine)  ── render / camera / input / export (public API only)
       │     ├─ PaperObject      (background page, SceneObject)
       │     └─ StickerObject[]  (SceneObjects: SVG image or emoji + flip)
       ├─ StickerTool (ITool)  ── select / move / resize / rotate + snap guides
       ├─ History     ── unlimited undo/redo (add/delete/transform/reorder)
       ├─ Storage     ── autosave + named gallery (localStorage)
       └─ StickerStudioUI ── TopBar · LibraryPanel · ContextBar
```

## Data-driven, unlimited packs

Stickers are pure data. A `data/catalog.json` lists packs; each pack JSON holds
categories + items. **Add a pack = add a JSON file + one catalog line** — no code
change. Each sticker item is either an inline **SVG** (`asset.type:"svg"`,
rasterised once to a crisp high-res image) or an **emoji** (`asset.type:"emoji"`,
drawn as canvas text). The Content Engine indexes titles/tags in Arabic + English
for search, and tracks favourites + recent.

```
data/
  catalog.json
  packs/ faces · animals · nature · shapes · emoji   (40 stickers)
```

Every pack descriptor carries a `premium` flag (all `false` here) — the library
already reads it, so gating premium packs later needs no new architecture.

## Features

- **Library** — pack tabs, category chips, live search, favourites (⭐), recent.
- **Place** — tap a sticker to drop it on the page.
- **Manipulate** — drag to move, corner handles to resize (uniform), top handle
  to rotate (with 15° snapping); flip H/V; duplicate; delete; bring to front /
  send to back (layer ordering).
- **Snap guides** — the moving sticker snaps to the page centre and to other
  stickers' centres, drawing pink alignment guides.
- **Navigation** — one-finger drag on empty space pans; two-finger pinch zooms;
  zoom buttons + fit (engine built-ins — no duplicated gesture logic).
- **History** — unlimited undo/redo.
- **Files** — new, save/open (named gallery + thumbnails), autosave restore,
  export **PNG**/**JPG** (via `engine.exporter`), print. 100% offline.
- **UX** — big touch targets, RTL, high-DPI, responsive (library becomes a
  slide-in sheet on phones), light/dark via the app theme tokens, keyboard
  (Ctrl+Z/Y, Delete, Esc).

## Notes / decisions

- **Reuse, not duplication.** Rendering/camera/input/export come from the engine;
  the library (search/favorites/recent/packs) comes from the Content Engine.
  The only module-owned logic is sticker placement, the transform handles, snap
  guides and an *uncapped* history (the engine's is capped at 100 by design).
- The full-screen studio mounts on `document.body` because app route containers
  use CSS transforms (which trap `position: fixed`); it is removed on unmount.
- `example.html` runs the studio standalone (it inlines the light theme tokens
  and links `css/tokens.css`).

## Files

```
StickerStudioModule.js  StickerStudioApp.js  index.js  example.html  README.md
data/ catalog.json  packs/*.pack.json
scene/ StickerObject.js  PaperObject.js  visual.js
interaction/ StickerTool.js  SnapEngine.js
history/ History.js  commands.js
io/ Storage.js  exportImage.js
ui/ StickerStudioUI.js  TopBar.js  LibraryPanel.js  ContextBar.js  helpers.js
styles/ sticker-studio.css
```
