# Content Creation Guide

All content in Kids Creative Studio is **data**: JSON files that describe items,
plus the assets (SVG art, emoji, character parts) they point to. You can add or
change content **without writing application code**. This guide covers the shared
model; the per-type how-tos build on it.

## The mental model

The **Content Engine** loads a **catalog**, which lists one or more **packs**. A
pack contains **items**. Each item is a `ContentItem` with an `assetType` that
tells a feature module how to present it.

```
catalog.json  ──lists──▶  pack(s)  ──contain──▶  items  ──point to──▶  assets
```

A feature module asks the Content Engine for items it understands, e.g. the
Coloring Library asks for `assetType: "coloring"`, the Learning Activities module
asks for `assetType: "activity"`, and the Print Center asks for all printable
types.

## Catalog file

`catalog.json` lists the packs a module should know about:

```json
{
  "version": 1,
  "title": { "ar": "العنوان", "en": "Title" },
  "packs": [
    {
      "id": "activities",
      "title": { "ar": "أنشطة", "en": "Activities" },
      "url": "activities.pack.json",
      "thumbnail": { "type": "emoji", "value": "🎯" },
      "languages": ["ar", "en"],
      "order": 1
    }
  ]
}
```

`url` is relative to the catalog's folder. Packs are loaded lazily via
`content.loadPack("<id>")`.

## Pack file

A `*.pack.json` holds categories (optional) and the items:

```json
{
  "id": "activities",
  "title": { "ar": "أنشطة تعليمية" },
  "thumbnail": { "type": "emoji", "value": "🎯" },
  "languages": ["ar", "en"],
  "license": { "type": "original" },
  "version": 1,
  "categories": [
    { "id": "cat-logic", "title": { "ar": "منطق" }, "icon": "🧩", "packId": "activities", "order": 1 }
  ],
  "items": [ /* ContentItem objects */ ]
}
```

## The ContentItem shape

Common fields (only `id` and `assetType` are strictly required; the rest are
optional but recommended):

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Unique across all content |
| `assetType` | string | e.g. `coloring`, `trace`, `activity`, `pdf`, `worksheet`, `flashcard`, `certificate`, `poster` |
| `title` | `{ar,en}` or string | Localized title |
| `description` | `{ar,en}` or string | Optional |
| `tags` | string[] | Used by search/filter |
| `categoryId` | string | Matches a category `id` in the pack |
| `packId` | string | The owning pack |
| `languages` | string[] | e.g. `["ar","en"]` |
| `ageGroup` | string | `toddler` \| `preschool` \| `child` |
| `difficulty` | string | `easy` \| `medium` \| `hard` |
| `asset` | `{type, src}` | Pointer to the file (e.g. `{ "type":"svg", "src":"art/lion.svg" }`) |
| `data` | object | Free-form payload a module reads (e.g. activity params) |
| `thumbnail` | `{type,value?,src?}` | `emoji` (+`value`) or `image` (+`src`) |
| `license` | `{type,author?}` | `original` for your own work |
| `order` | number | Sort order |

Asset `src` and thumbnail `src` are resolved **relative to the pack file's
folder** (you may also use `../` to reuse art from another module).

## Golden rules

- **Original or clearly-licensed content only.** Do not add copyrighted cartoon
  characters or trademarked artwork. Use your own art, public-domain works, or
  assets under a license that permits redistribution, and record it in `license`.
- **Keep it offline.** Assets must be local files in the repo — never remote URLs.
- **Validate your JSON** before deploying (a trailing comma will break a pack):
  ```bash
  python3 -c "import json; json.load(open('path/to/pack.json')); print('OK')"
  ```
- **Match the schema the target module expects** (see the per-type how-tos).
- **Unique ids.** Duplicate ids are de-duplicated (first wins) and you'll lose
  items silently.

## After editing

Re-deploy the folder (there's no build). Do a hard refresh to bypass browser
caching. If a pack is malformed, the app shows a friendly "couldn't load" card
instead of crashing — check the browser console and re-validate the JSON.

## Per-type how-tos

- [Add New Packs](ADD_PACKS.md)
- [Add New Activities](ADD_ACTIVITIES.md)
- [Add New Coloring Pages](ADD_COLORING_PAGES.md)
- [Add New Characters](ADD_CHARACTERS.md)
- [Add New PDFs / Printables](ADD_PDFS.md)
