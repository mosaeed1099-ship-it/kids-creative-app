# Coloring Module (Phase 5)

The first real feature. It **composes** the Canvas Engine (Phase 3) and the
Content Engine (Phase 4) through their public APIs only — it never duplicates or
modifies their logic, and it touches no existing file.

```
Content Engine ──(open coloring page)──▶ ColoringApp ──(render/zoom/pan/history/export)──▶ Canvas Engine
```

## What it does

- **Open a coloring page from the Content Engine** (`app.openItem(contentItem)`)
  or any line-art URL (`app.openImage(url)`).
- Shows the **black outline** on top and paints **underneath** it.
- Tools: **Bucket Fill**, **Brush**, **Pencil**, **Eraser**, plus **Pan**.
- **Color system**: solid palette, recently-used, favorites, and a **custom
  color picker** (unlimited expansion).
- **Brush size** slider.
- **Undo / Redo** (via the engine's HistoryManager).
- **Zoom / Pan / Reset View / Fit to Screen / Fullscreen** (via the engine's
  camera + input).
- **Save progress locally** and **restore unfinished artwork** automatically.
- **Export PNG**, **Export JPEG**, **Print**, **Clear**.
- Touch / mouse / pen friendly, tablet-optimized, High-DPI (all from the engine).

## Usage

```js
import ColoringApp from '../modules/coloring/index.js';
import { ContentManager } from '../content/index.js';

const base = new URL('../js/modules/coloring/content/', location.href).href;
const content = new ContentManager({ base });
await content.init({ catalog: 'catalog.json' });
await content.loadPack('coloring-samples');

const app = new ColoringApp({
  mount: '#app',
  content,
  options: { resolveAsset: (item) => new URL(item.asset.src, base).href },
});
app.mount();

const page = content.getContent('clr-lion');
await app.openItem(page);   // loads the SVG, restores progress if any
```

## Public API (ColoringApp)

| Method | Purpose |
|--------|---------|
| `mount()` | build UI + engine, register tools |
| `openItem(item)` | open a Content-Engine coloring item (marks it recent) |
| `openImage(url, {id,title})` | open any line-art image |
| `setTool(id)` | `bucket` \| `brush` \| `pencil` \| `eraser` \| `pan` |
| `setColor(hex)` / `toggleFavoriteColor()` / `setBrushSize(n)` | color system |
| `undo()` / `redo()` | history (engine) |
| `zoomIn()` / `zoomOut()` / `resetView()` / `fitView()` / `fullscreen()` | view |
| `exportPNG()` / `exportJPEG()` / `print()` / `clear()` | output |
| `destroy()` | teardown |

## How the pieces fit

| File | Role |
|------|------|
| `ColoringApp.js` | controller — composes engine + content, owns state |
| `surface/PaintSurface.js` | raster paint + outline, **flood fill**, brush, export |
| `surface/ArtworkObject.js` | a `SceneObject` that draws the surface in the engine world |
| `surface/PaintCommand.js` | an `ICommand` for undo/redo (paint snapshots) |
| `tools/*` | `ITool` implementations: Bucket, Brush, Pencil, Eraser |
| `color/ColorManager.js` | palette / recent / favorites / custom (persisted) |
| `progress/ProgressManager.js` | save / restore unfinished artwork (localStorage) |
| `ui/ColoringUI.js` | toolbar + palette DOM, bound to the app |
| `content/` | **sample** artwork (SVG) + catalog/pack JSON for the demo |

## How it consumes the two engines (no duplication)

- **Rendering / camera / input / history / export** → Canvas Engine:
  `engine.mount()`, `engine.objects.add(artwork)`, `engine.fit()`,
  `engine.camera`, `engine.tools.register/activate`, `engine.history.record`,
  `engine.importer.image(url)`.
- **Content** → Content Engine: `content.getContent(id)`,
  `item.getTitle()`, `item.asset.src`, `content.open(id)` (recent).

## Notes

- **Flood fill** works on any line-art: the outline's dark pixels form a barrier
  map; the fill floods the tapped region on the paint layer beneath the lines.
- **Undo/redo** stores paint-layer snapshots; raster size is capped
  (`options.maxSize`) to keep memory/perf healthy on tablets.
- The sample art is **original** (safe to sell). Swap in your own line-art by
  adding SVG/PNG files and pack JSON — no code changes.

## Example

`examples/coloring.html` — a runnable page: pick a sample, color it, undo/redo,
zoom/pan, export, print.
