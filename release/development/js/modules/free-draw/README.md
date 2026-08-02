# Free Draw Studio (`js/modules/free-draw/`) — Phase 13

A production-quality, offline, child-friendly drawing studio that **replaces the
old `/draw` placeholder**. It is additive: every file lives under this folder and
it consumes **only the public APIs** of the Canvas Engine (`js/engine`) and the
UI foundation (`js/ui`, `js/utils/dom`). No engine or other module was modified;
the single wiring change is one line in `js/data/features.registry.js` pointing
`/draw` at `FreeDrawModule.js`.

## How it plugs in

```
FreeDrawModule (extends core/Module)
  └─ FreeDrawApp  ── composes ──▶ CanvasEngine (public API only)
        ├─ Document ─ RasterLayer[] ─▶ LayerObject / PaperObject  (SceneObjects)
        ├─ tools/*  (extend ITool)   ─▶ engine.tools.register/activate
        ├─ MarkHistory (unlimited)   ─▶ ICommand-style ops
        ├─ ColorManager / Settings   ─▶ persisted to localStorage
        ├─ ViewTransform + NavigationController (pan/zoom/rotate via engine.camera)
        ├─ SelectionController       ─▶ marquee + floating transform
        └─ FreeDrawUI                ─▶ toolbar / colour / brush / shapes / layers / history
```

## Rendering model (why it is fast and undo is unlimited)

Each **layer** is an offscreen bitmap at document resolution, blitted by one
`SceneObject` → the per-frame cost is *O(layers)*, not *O(strokes)*, so it holds
60 FPS with thousands of strokes. Each **stroke/shape** is *also* kept as compact
**vector data** (a `Mark`), so undo/redo replays marks instead of storing pixel
snapshots → **truly unlimited undo** with tiny memory. Pixel-level edits
(selection move/flip/rotate) bake the bitmap into a per-layer `base` and record a
snapshot op, so both models coexist correctly. The engine renders **on-demand**
(lazy) — it only repaints after `invalidate()`.

One module, `brushes/strokeRenderer.js`, turns a stroke into pixels for the live
preview, the commit, and undo-repaint — so there is no duplicated drawing logic.

## Features

- **Canvas** — infinite pannable/zoomable workspace on a high-DPI sheet; mouse,
  touch, pen/Apple-Pencil pressure, coalesced samples; two-finger pinch-zoom,
  pan and twist-rotate; button zoom/rotate/fit; smooth on-demand rendering.
- **Brushes** (`tools/*`, one file each, shared base) — pencil, brush, marker
  (multiply), crayon (grain), calligraphy (angled nib), airbrush (spray), eraser.
  Size / opacity / hardness / pressure with a live preview swatch.
- **Shapes** — line, arrow, rectangle, circle, triangle, star, polygon (N sides),
  heart, speech bubble; outline or filled.
- **Colour** — HSV wheel, HEX/RGB/HSL inputs, eyedropper, recent + favourite
  colours, preset palettes (all persisted).
- **Layers** — unlimited; rename, hide, lock, opacity, reorder, duplicate,
  merge-down, per-layer thumbnails.
- **History** — unlimited undo/redo with a clickable timeline (jump anywhere).
- **Selection** — rectangle + lasso marquee → floating selection with move,
  resize, rotate, flip H/V and delete.
- **File** — new, save/open (named gallery with thumbnails), autosave restore,
  export **PNG**/**JPG**, print. 100% offline (localStorage + canvas only).
- **UI** — large touch targets, RTL, responsive (side panels become a sheet on
  phones), light/dark via the app's theme tokens, keyboard shortcuts
  (Ctrl+Z/Y, `[` `]`, `B`/`E`/`V`, Delete, Esc).

## Notes / decisions

- **"Infinite canvas"** is realised as a generous high-resolution page
  (1600×1200) that pans/zooms freely — the industry-standard approach for raster
  painting (a true unbounded pixel buffer is impossible). Change `DOC_W`/`DOC_H`
  in `FreeDrawApp.js` to resize.
- **Canvas rotation** is done in the module (`ViewTransform` for input +
  `SceneObject.rotation` for pixels) because the engine camera has no rotation —
  no engine change required.
- **Unlimited history**: the engine's `HistoryManager` is capped at 100 by
  design, so the module uses its own uncapped `MarkHistory` built on the same
  command contract.
- The full-screen studio mounts on `document.body` (app route containers use CSS
  transforms, which would trap `position: fixed`); it is removed on unmount.

## Files

```
FreeDrawModule.js  FreeDrawApp.js  index.js
state/Settings.js
color/ colorConvert.js  palettes.js  ColorManager.js
util/geometry.js
brushes/ brushProfiles.js  strokeRenderer.js
shapes/shapeGeometry.js
marks/Mark.js
layers/ RasterLayer.js  LayerObject.js  PaperObject.js
document/Document.js
history/ MarkHistory.js  commands.js
view/ ViewTransform.js  NavigationController.js
tools/ BaseBrushTool.js  Pencil/Brush/Marker/Crayon/Calligraphy/Airbrush/EraserTool.js
       ShapeTool.js  EyedropperTool.js  HandTool.js  SelectTool.js  SelectionController.js
io/ Storage.js  exportImage.js
ui/ FreeDrawUI.js  TopBar.js  Toolbar.js  ColorPanel.js  ColorWheel.js
    BrushPanel.js  ShapePanel.js  LayersPanel.js  HistoryPanel.js  SelectionBar.js  helpers.js
styles/free-draw.css
```
