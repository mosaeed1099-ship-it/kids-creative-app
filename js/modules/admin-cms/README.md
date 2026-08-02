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

## Design

- **Data-driven + modular:** one generic `ListView` and one generic `EntityForm`
  render every section from its field schema — no per-section list/form code.
- **Reuse:** Content Engine models for output shaping; the app's `el`/design
  tokens for UI.
- Offline · RTL · responsive · tablet-optimised · high-DPI · light/dark.

## Files

```
AdminCMSModule.js  AdminCMSApp.js  index.js  example.html  README.md
store/ CmsStore.js  schema.js  seed.js
editors/ fields.js  PackEditor.js  ColoringEditor.js  StickerEditor.js
         PuzzleImageEditor.js  StoryEditor.js  ActivityEditor.js  PdfEditor.js
         CategoryEditor.js  AssetEditor.js
io/ upload.js
generate/ generators.js
ui/ AdminUI.js  Sidebar.js  ListView.js  EntityForm.js  helpers.js
styles/ admin-cms.css
```
