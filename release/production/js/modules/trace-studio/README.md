# Trace Studio (Phase 8)

A professional tracing workspace: the child draws over a reference image. It
consumes ONLY the **Canvas Engine** and **Content Engine** (public APIs), and
**reuses** the frozen Coloring module's Brush/Pencil/Eraser tools, ColorManager,
ProgressManager and PaintCommand (imported, not modified) — no duplication.

**Fully offline.** No AI, no external APIs, no uploads: parent images are read
with `FileReader` in the browser and never leave the device.

## Sources

- **Built-in trace templates** from the Content Engine (`assetType: 'trace'`).
- **Public-domain / included artwork** (bundled SVG line-art).
- **Parent-uploaded local image** — processed in-browser only.

```js
await trace.openItem(contentItem);   // a Content-Engine trace template
await trace.openFile(file);          // <input type=file> — stays on device
await trace.openImage(imgEl, {...});  // any image element
```

## Features

Drawing: Brush · Pencil · Eraser · brush size · color palette (solid / recent /
favorites / custom) · Undo · Redo · Clear · **save & restore progress locally**
· Export **PNG** / **JPEG** · Print.

View: Zoom · Pan · Reset View · Fit to Screen · Fullscreen (High-DPI, touch).

Reference tools: **opacity**, **show/hide**, **lock layer**, **scale**,
**move** (drag with the 🎯 tool), **rotate**, **flip horizontal / vertical**,
**center**, **fit to screen**.

Comparison modes: **Overlay**, **Before** (reference only), **After** (drawing
only), and **Split** (reference left / drawing right with a divider).

## How it composes the engines (no duplication)

- Canvas Engine: `engine.mount()`, layers (paper / reference / drawing),
  `engine.camera` (zoom/pan/fit), `engine.tools`, `engine.history`,
  `engine.importer.image()`, `engine.plugins` (split divider), export.
- Content Engine: `content.filter({assetType:'trace'})`, `item.asset.src`,
  `item.getTitle()`, `content.open(id)`.
- Reuses Coloring: `BrushTool`, `PencilTool`, `EraserTool`, `PaintCommand`,
  `ColorManager`, `ProgressManager` (each imported from the frozen module).

## Public API (TraceStudio)

`mount()`, `openItem(item)`, `openFile(file)`, `openImage(img,{id,title})`,
`setTool(id)`, `setColor()`, `setBrushSize()`, `undo()/redo()/clear()`,
`zoomIn/zoomOut/resetView/fitView/fullscreen()`, reference:
`refOpacity/refShow/refLock/refScale/refRotate/refFlipH/refFlipV/refCenter/refFit()`,
`setCompare('overlay'|'before'|'after'|'split')`,
`exportPNG()/exportJPEG()/print()`.

## Files

```
trace-studio/
  index.js                 barrel
  TraceStudio.js           controller (composes engines, reuses coloring tools)
  ReferenceController.js    reference transforms
  surface/                 TraceSurface, ReferenceObject, DrawObject, PaperObject,
                           DividerPlugin, compareClip
  tools/MoveReferenceTool.js
  ui/TraceUI.js, ui/h.js
  content/                 trace catalog + pack JSON (templates reuse shared art)
css/trace-studio.css
examples/trace-studio.html
```

## Example

`examples/trace-studio.html` — pick a template or upload an image, adjust the
reference (opacity/scale/rotate/flip), trace with brush/pencil, compare
before/after/split, undo/redo, export, print.
