# How to Add New PDFs / Printables

The Print & PDF Center lists every **printable** Content item, renders each to a
full page on-device, and can print it or export a **PDF or ZIP** — all offline,
with no libraries and nothing uploaded. You don't add a `.pdf` file; you add a
printable **item** (usually an SVG page) and the center generates the PDF.

Files: add art under `js/modules/print-center/content/art/` (or reuse art from
another module) and add an item to
`js/modules/print-center/content/printables.pack.json`.

## What counts as "printable"

The Print Center accepts these `assetType`s:

```
coloring · trace · pdf · worksheet · flashcard · activity · certificate · poster
```

Use `pdf` for a ready-to-print page/worksheet, or the more specific type when it
applies (e.g. `worksheet`, `certificate`, `poster`). They all render and export
the same way.

## 1. Prepare the page art

Author a print-friendly **SVG** sized to a page aspect (portrait A4/Letter looks
best with a tall `viewBox`, e.g. `0 0 794 1123`). Keep it self-contained and
local (no external images/fonts). High-contrast black line art prints cleanly and
also works in black-and-white mode.

```
content/art/worksheet-numbers.svg
```

## 2. Add the pack item

Add to `items[]` in `printables.pack.json`:

```json
{
  "id": "pdf-worksheet-numbers",
  "assetType": "pdf",
  "title": { "ar": "ورقة عمل — الأرقام", "en": "Worksheet — Numbers" },
  "tags": ["worksheet", "numbers"],
  "categoryId": "cat-school",
  "languages": ["ar", "en"],
  "ageGroup": "child",
  "difficulty": "easy",
  "asset": { "type": "svg", "src": "art/worksheet-numbers.svg" },
  "thumbnail": { "type": "emoji", "value": "🔢" },
  "license": { "type": "original" },
  "order": 20
}
```

- `asset.src` is resolved relative to the pack folder; reuse other modules' art
  with `../../<module>/content/art/<file>.svg` if you like.
- `categoryId` should match a category in the pack (or add one).

## 3. How export works (for context)

`PreviewRenderer` rasterizes each item onto a full page canvas honoring the print
settings (size, orientation, margins, scale, fit, color/B&W). That page feeds:
- **Print** → an iframe with matching `@page` size, then `window.print()`.
- **PDF** → `MiniPDF` embeds each page's JPEG bytes into a valid PDF → download.
- **ZIP** → `MiniZip` bundles each page PNG (STORE method) → download.

Everything happens on the device; nothing is uploaded.

## 4. Validate & deploy

```bash
python3 -c "import json; json.load(open('printables.pack.json')); print('OK')"
```
Open the SVG to confirm it renders. Re-deploy and hard-refresh. The new printable
appears in the Print Center library, previews, prints, and exports to PDF/ZIP.

## Tips

- Design for the page: leave margins; the center can also apply its own margin
  and fit-to-page.
- For multi-page sets, add one item per page and use the **print queue** to print
  or export them together.
- Prefer vector SVG over raster so pages stay crisp at any print scale.
