# Puzzle Studio (`js/modules/puzzle-studio/`) — Phase 15

A production-quality, offline jigsaw studio that **replaces the `/puzzles`
placeholder**. Additive: every file lives under this folder and it consumes
**only the public APIs** of the Canvas Engine (`js/engine`) and the Content
Engine (`js/content`), plus the UI helpers/tokens. The only wiring change is one
line in `js/data/features.registry.js` pointing `/puzzles` at
`PuzzleStudioModule.js`.

## How it plugs in

```
PuzzleStudioModule (extends core/Module)
  └─ PuzzleStudioApp
       ├─ ContentManager (js/content) ── puzzle-image packs (data-driven, unlimited)
       ├─ CanvasEngine   (js/engine)  ── render / camera / input / export (public only)
       │     ├─ BoardObject  (faint ghost + frame)
       │     └─ PieceObject[] (SceneObjects: image clipped to a jigsaw path)
       ├─ PuzzleModel  ── generate · grid · groups · snapping · solve
       ├─ PieceTool (ITool) ── drag a piece/group; snap on drop
       ├─ History  ── unlimited undo/redo (before/after piece-state snapshots)
       ├─ Storage  ── autosave + per-image progress (localStorage)
       ├─ timer (optional) · Celebration (confetti)
       └─ PuzzleUI ── TopBar · SetupPanel · Hud
```

## How puzzles are generated

Puzzle pictures are **data**: `data/catalog.json` lists packs; each pack JSON
holds items whose `asset` is an inline **SVG** scene. On start, the chosen image
is rasterised once to a board-resolution canvas; the model builds an R×C grid,
assigns complementary interlocking edge signs, and creates one `PieceObject` per
cell that **clips the shared image to its jigsaw path**. Because pieces sit on an
axis-aligned grid, each knob is a semicircle (`arc`) — a tab on one piece is
exactly the blank on its neighbour. Add a pack = add a JSON file + one catalog
line.

## Features

- **Difficulty / piece counts** — 2×2 (٤) · 3×3 (٩) · 4×4 (١٦) · 5×5 (٢٥) · 6×6 (٣٦).
- **Drag & drop** with **snap** — a piece snaps to its board home, and adjacent
  pieces snap into a shared group that then moves as one.
- **Hints** — flash an unplaced piece's outline (or press `H`).
- **Timer** (optional, toggleable) starting on the first move.
- **Celebration** — confetti + banner when solved.
- **Progress** — autosave + per-image resume; unlimited undo/redo.
- **Export** the finished picture as **PNG/JPG**, and **print**.
- **Navigation** — drag empty space to pan, pinch to zoom, zoom buttons + fit
  (engine built-ins — no duplicated gesture logic).
- **UX** — big touch targets, RTL, high-DPI, responsive, light/dark tokens,
  keyboard (Ctrl+Z/Y, `H`).

## Notes

- The finished image IS the source picture, so **export** uses the rasterised
  source canvas (clean, no seams).
- Rendering/camera/input/export come from the engine; the picture library comes
  from the Content Engine. Only the jigsaw geometry, grouping/snapping and an
  *uncapped* history are module-owned (the engine's history is capped at 100).
- The full-screen studio mounts on `document.body` because app route containers
  use CSS transforms (which trap `position: fixed`); removed on unmount.
- `example.html` runs the studio standalone. `tests/puzzle.spec.js` is a
  Playwright spec (see the file header to run it).

## Files

```
PuzzleStudioModule.js  PuzzleStudioApp.js  index.js  example.html  README.md
data/ catalog.json  packs/scenes.pack.json  packs/things.pack.json
puzzle/ jigsaw.js  image.js  PieceObject.js  BoardObject.js  PuzzleModel.js
interaction/ PieceTool.js
history/ History.js  commands.js
io/ Storage.js  exportImage.js
effects/ Celebration.js
ui/ PuzzleUI.js  TopBar.js  SetupPanel.js  Hud.js  helpers.js
styles/ puzzle-studio.css
tests/ puzzle.spec.js  playwright.config.js
```
