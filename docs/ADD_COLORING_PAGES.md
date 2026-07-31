# How to Add a New Coloring Page

A coloring page is a Content item with `assetType: "coloring"` pointing at an
**SVG** line drawing. The Coloring module lets children flood-fill the SVG's
regions, and the Coloring Library / Print Center list it automatically.

Files: put the artwork in `js/modules/coloring/content/art/` and add an item to
`js/modules/coloring/content/coloring.pack.json`.

## 1. Prepare the SVG artwork

Draw clean, closed line art. Fillable regions must be **closed paths/shapes** so
flood fill has a clear area to color.

- Give fillable shapes the class `fillable` (or a class your coloring setup
  targets) and a default `fill` — the app bakes presentation attributes inline so
  fills render correctly.
- Keep outlines as strokes so they survive coloring and PNG export.
- Use a `viewBox` (e.g. `0 0 512 512`) and avoid embedded raster images or
  external references — **SVG must be self-contained and local**.

Minimal example (`art/balloon.svg`):
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path class="fillable" fill="#ffffff" stroke="#333" stroke-width="4"
        d="M100 20 C60 20 40 60 40 90 C40 130 100 150 100 150
           C100 150 160 130 160 90 C160 60 140 20 100 20 Z"/>
  <line x1="100" y1="150" x2="100" y2="185" stroke="#333" stroke-width="3"/>
</svg>
```

## 2. Add the pack item

Add to `items[]` in `coloring.pack.json`:

```json
{
  "id": "clr-balloon",
  "assetType": "coloring",
  "title": { "ar": "بالون", "en": "Balloon" },
  "tags": ["toys", "balloon"],
  "categoryId": "samples",
  "languages": ["ar", "en"],
  "ageGroup": "preschool",
  "difficulty": "easy",
  "asset": { "type": "svg", "src": "art/balloon.svg" },
  "thumbnail": { "type": "emoji", "value": "🎈" },
  "license": { "type": "original", "author": "Studio" },
  "order": 10
}
```

- `asset.src` is relative to the pack folder (`content/`), so `art/balloon.svg`.
- `thumbnail` can be an emoji (`{type:"emoji",value:"🎈"}`) or an image
  (`{type:"image","src":"art/balloon.svg"}`).
- `categoryId` should match a category already in the pack (or add one).

## 3. Reuse art across modules

Other modules (e.g. Print Center) can reference the same SVG with a relative
path, e.g. `"src": "../../coloring/content/art/balloon.svg"`. No duplication
needed.

## 4. Validate & deploy

```bash
python3 -c "import json; json.load(open('coloring.pack.json')); print('OK')"
```
Open the SVG in a browser to confirm it renders. Re-deploy and hard-refresh.

## Tips

- Fewer, larger regions are easier for small children; add detail for older ages
  and set `difficulty` accordingly.
- Test that each region fills independently (no accidental gaps between paths).
- Keep file sizes small — hand-authored vector art stays a few KB.
