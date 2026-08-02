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

## Design

- **Data-driven + modular:** one generic `ListView` and one generic `EntityForm`
  render every section from its field schema — no per-section list/form code.
- **Reuse:** Content Engine models for output shaping; the app's `el`/design
  tokens for UI.
- Offline · RTL · responsive · tablet-optimised · high-DPI · light/dark.

## Files

```
AdminCMSModule.js  AdminCMSApp.js  index.js  example.html  README.md
store/ CmsStore.js  schema.js  seed.js  AssetStore.js  backup.js
editors/ fields.js  PackEditor.js  ColoringEditor.js  StickerEditor.js
         PuzzleImageEditor.js  StoryEditor.js  ActivityEditor.js  PdfEditor.js
         CategoryEditor.js  AssetEditor.js
io/ upload.js  assets.js
generate/ generators.js  deployPackage.js  zip.js
ui/ AdminUI.js  Sidebar.js  ListView.js  EntityForm.js  helpers.js
styles/ admin-cms.css
```
