# PDF & Print Center (Phase 10)

A premium, **fully-offline** print center where parents browse, preview,
organize and print every printable activity. It consumes ONLY the Content
Engine (public API) for the library / favorites / recent. **No backend, no
cloud, no external services, no libraries** — the PDF and ZIP builders are
written from scratch.

## Supported content

Coloring Pages · Trace Pages · Worksheets · Flash Cards · Activity Sheets ·
Certificates · Posters (any Content-Engine item whose `assetType` is printable).

## Features

- **PDF Library** grid with **lazy** large previews, search, type filters,
  categories/packs, favorites, recent.
- **Print Preview** — large, multi-page.
- **Print**: single page · multi-page · **print selected** · **print queue**.
- **Download PDF** (built in-browser via `MiniPDF`, embeds JPEG pages).
- **Download ZIP** (built in-browser via `MiniZip`, STORE method — always
  available locally, no library).
- **Print settings**: A4 / Letter · portrait / landscape · margins · scale ·
  fit-to-page · **Color / Black & White**.
- **Print queue**: add · remove · reorder · clear — **persists** so parents can
  **continue printing**.
- **Collections**: My Favorites · Recently Printed · Weekly Activities · School
  Pack · Home Pack (curated, editable, offline).

## Usage

```js
import PrintCenter from '../modules/print-center/index.js';
import { ContentManager } from '../content/index.js';

const base = new URL('../js/modules/print-center/content/', location.href).href;
const content = new ContentManager({ base });
await content.init({ catalog: 'catalog.json' });
await content.loadPack('printables');

const pc = new PrintCenter({
  mount: '#app',
  content,
  options: { resolveAsset: (item) => new URL(item.asset.src, base).href },
});
pc.mount();
```

## How printing / export works (offline)

`PreviewRenderer` rasterizes each item onto a **full page canvas** honoring the
settings (size, orientation, margins, scale, fit, color/B&W). That single page
canvas feeds everything:

- **Print** → `PrintService` writes an iframe with a matching `@page` size and
  one full-bleed image per page, then calls `window.print()`.
- **PDF** → `MiniPDF` embeds each page's JPEG bytes as a `/DCTDecode` image and
  assembles a valid PDF (xref + trailer) → Blob download.
- **ZIP** → `MiniZip` bundles each page PNG with the STORE method (CRC32) → Blob
  download.

Nothing is uploaded; all rendering happens on the device.

## Public API (PrintCenter)

`mount()`, `preview(ids)`, `printIds(ids)`, `downloadPDF(ids)`,
`downloadZIP(ids)`, `queue` (add/remove/move/clear), `settings`, `collections`.

## Files

```
print-center/
  index.js, PrintCenter.js
  PreviewRenderer.js, PrintService.js, PrintQueue.js, PrintSettings.js, Collections.js
  export/ MiniPDF.js, MiniZip.js
  ui/ PrintCenterUI, CardView, PreviewModal, QueuePanel, SettingsPanel
  util.js
  content/ catalog.json, printables.pack.json, art/*.svg
css/print-center.css
examples/print-center.html
```
