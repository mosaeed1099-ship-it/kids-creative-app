# Content Management System (`js/modules/admin-cms/`) — Phase 17A

An **offline** content editor (the tool used to generate all project data). No
backend, no API, no database — everything lives in `localStorage`. Additive: all
files are new under this folder; the only change to pre-existing code is one line
in `js/data/features.registry.js`.

> There was no "Admin" tile to replace, so a **hidden** feature entry was added
> (`enabled:false`, route `/admin`): reachable at `#/admin`, but it does **not**
> appear as a kids activity tile.

## What it manages

Sidebar sections (each in its own editor file under `editors/`): **Packs,
Coloring pages, Stickers, Puzzle images, Stories, Learning activities, PDFs,
Categories, Assets**. Sections that hold content items are just the one `items`
collection filtered by `assetType`, matching the Content Engine model.

Every section supports: **create, edit, delete, duplicate, preview, search,
filter (by pack + category), tags, sort, drag-and-drop reorder, bulk selection,
bulk delete, bulk move**.

## Uploads

`io/upload.js` reads **SVG / PNG / JPG / WEBP / PDF** into inline assets (SVG as
text, PDF as a data URL, raster images downscaled + re-encoded) — fully offline.

## Auto-generated data files

`generate/generators.js` produces, with **no manual JSON editing**:

- `catalog.json` — pack descriptors
- `packs.json` — full packs (categories + items), shaped via the Content Engine `Pack`
- `stickers.json`, `activities.json`, `story.json` — all items of that type, shaped via `ContentItem`

Download them individually or all at once from **⚙️ توليد ملفات JSON**.
**📥 استيراد المحتوى الحالي** seeds the store from the shipped Sticker/Puzzle
packs so there's real content to manage.

## Reliability & data safety (Phase 17A.1)

Fixes for the four Critical review findings:

- **C1 — no silent save failures.** Every mutation in `CmsStore` is
  transactional: the previous state is snapshotted, the change applied, then
  persisted. If `localStorage` is full the write fails, the in-memory change is
  **rolled back**, and a persistent error bar appears (with a one-click
  "export backup"). A live **storage meter** shows usage vs the ~5 MB budget.
- **C2 — assets in IndexedDB, not `localStorage`.** Binary assets (SVG / image /
  PDF) live in `store/AssetStore.js` (IndexedDB); records keep only a
  `{ ref }`. `io/assets.js` resolves refs on demand and migrates any legacy
  inline assets automatically on load. Emoji stay inline (tiny). Degrades
  gracefully to inline data if IndexedDB is unavailable.
- **C3 — full backup / restore.** `store/backup.js` exports the entire store
  **plus** every asset as one self-contained JSON, and restores it. Clear-all is
  now a professional typed-confirmation dialog that **auto-exports a backup
  first**. `window.confirm` is gone.
- **C4 — one-click deploy package.** `generate/deployPackage.js` builds a single
  ZIP (pure-JS writer in `generate/zip.js`, no dependencies) containing the data
  files, a manifest, Cloudflare `_headers` / `_redirects`, and `release/` +
  `production/` copies. It generates the package only — it does not deploy.

## Versioning & history (Phase 17A.2)

Infrastructure, not a feature — reuses the store's own `snapshot()`/`replace()`
and the shared IndexedDB layer; no backend, no APIs, fully offline.

- **Snapshots / versions** (`store/VersionStore.js`, `history/VersionManager.js`)
  live in IndexedDB and hold the state (asset *references*, not binaries), so
  they stay small. Each carries **author, timestamp, note, kind** and stats.
- **Automatic versions** — a debounced, coalesced snapshot after changes; no-op
  changes are skipped and auto versions are capped (manual ones are kept).
- **Manual versions** — "🔖 حفظ إصدار" with an author + note.
- **Restore** any version (undoable). **Compare** any two → the **diff viewer**
  (`history/diff.js`): added / removed / changed with field-level detail.
- **Change log** — the ordered version list in the 🕘 History panel.
- **Undo / redo** (`history/UndoManager.js`) for **all** operations, destructive
  included, via one uniform state-snapshot stack (the store emits the
  pre-mutation state on every commit). Keyboard: Ctrl/⌘+Z, Ctrl/⌘+Shift+Z.
- **Soft delete → Trash** — `remove`/`bulkRemove` move records to a `trash`
  collection (with origin + who/when). The 🗑️ Trash panel restores, permanently
  deletes, or empties. Publishing/generators ignore trashed records.

The IndexedDB boilerplate is shared: `store/idb.js` (a generic KV store) backs
both `AssetStore` and `VersionStore`.

## Media Library & Asset Manager (Phase 17A.3)

The "الوسائط" section is a full asset manager (`ui/MediaLibrary.js`) shown in
place of the generic list; the generic list still drives every other section.
Offline and data-driven; reuses IndexedDB, trash (safe delete), version history
(undo), backup, and the shared UI.

- **Library / preview** — a thumbnail grid; multi-file upload; **SVG, image and
  PDF previews** (in the grid and the Inspector: `<img>` / SVG background /
  `<object>` PDF).
- **Search · Categories · Tags · Favorites · Recent** — search across
  name/tags/category/mime; a category filter; a favorites view; sort by recent
  (or name/size/type). Data-driven: categories come from the assets themselves.
- **Asset Inspector** (`ui/AssetInspector.js`) — large preview, editable
  name/category/tags/favorite, technical info (type, mime, size, dimensions,
  content hash, dates), **usage references**, and actions.
- **Content-hash intelligence** (`media/hash.js`, `media/usage.js`) — every
  uploaded asset gets a fast content hash. From it, with no backend:
  **usage references** (which content items use the same bytes), **duplicate
  detection**, and **unused detection** (chips show live counts). Existing
  assets are hash-backfilled on load.
- **Replace asset**; **safe delete** (soft-delete to Trash, warns if the asset
  is used); **bulk rename / move / tag / delete** (each a single, undoable
  commit via `CmsStore.bulkApply`).

## Design

- **Data-driven + modular:** one generic `ListView` and one generic `EntityForm`
  render every section from its field schema — no per-section list/form code.
- **Reuse:** Content Engine models for output shaping; the app's `el`/design
  tokens for UI.
- Offline · RTL · responsive · tablet-optimised · high-DPI · light/dark.

## Files

```
AdminCMSModule.js  AdminCMSApp.js  index.js  example.html  README.md
store/ CmsStore.js  schema.js  seed.js  AssetStore.js  VersionStore.js  backup.js  idb.js
editors/ fields.js  PackEditor.js  ColoringEditor.js  StickerEditor.js
         PuzzleImageEditor.js  StoryEditor.js  ActivityEditor.js  PdfEditor.js
         CategoryEditor.js  AssetEditor.js
io/ upload.js  assets.js
generate/ generators.js  deployPackage.js  zip.js
history/ VersionManager.js  UndoManager.js  diff.js
media/ hash.js  usage.js
ui/ AdminUI.js  Sidebar.js  ListView.js  EntityForm.js  HistoryPanel.js  TrashPanel.js
    MediaLibrary.js  AssetInspector.js  helpers.js
styles/ admin-cms.css
```
