# Creative Studio — Movable Characters (Phase 9)

A digital creative toy: children build funny characters by **dragging, rotating,
scaling and flipping** independent SVG body parts, switching **expressions**, and
adding **stickers**. It composes the Canvas Engine + Content Engine (public APIs
only) and reuses the frozen Coloring module's `ProgressManager` (import only).
**Fully offline**, no AI, no backend, no uploads.

## Characters are data

Each character is a JSON file listing independent SVG parts (head, eyes,
eyebrows, nose, mouth, ears, hair, arms, hands, legs, tail, wings, accessories)
and **data-driven expression presets** that swap the eyes / mouth / eyebrows.
Add a character = add a JSON + its part SVGs and a catalog entry (unlimited
future characters).

```json
{
  "id": "cat", "name": { "ar": "القطة" }, "canvas": { "w": 600, "h": 600 },
  "parts": [ { "id":"head","kind":"head","src":"../parts/cat/head.svg","x":300,"y":250,"z":4 }, ... ],
  "expressions": {
    "happy":  { "eyes":"...eyes-happy.svg","mouth":"...mouth-happy.svg","eyebrows":"..." },
    "sad": {...}, "angry": {...}, "surprised": {...}, "sleepy": {...}, "laughing": {...}
  }
}
```

## Tools

Select · **Drag** · **Scale** (corner knob) · **Rotate** (top knob) · Flip H ·
Flip V · Bring Forward · Send Backward · Duplicate · Delete · Reset Character ·
Undo · Redo. Plus Zoom / Pan / Fit / Reset View / Fullscreen (High-DPI, touch).

Expressions: Happy · Sad · Angry · Surprised · Sleepy · Laughing (data-driven).

Stickers (from the Content Engine): add, move, rotate, scale, delete — just like
any part.

Save: **save project locally**, **restore** on reopen, **Export PNG / JPEG**,
**Print**.

## Usage

```js
import CreativeStudio from '../modules/creative-studio/index.js';
import { ContentManager } from '../content/index.js';

const base = new URL('../js/modules/creative-studio/content/', location.href).href;
const content = new ContentManager({ base });
await content.init({ catalog: 'stickers.catalog.json' });
await content.loadPack('studio-stickers');

const studio = new CreativeStudio({ mount: '#app', content });
studio.mount();

const catalog = await (await fetch(new URL('catalog.json', base))).json();
studio.setCharacters(catalog.characters, (c) => studio.loadCharacter(new URL(c.url, base).href));
studio.loadStickers(content.filter({ assetType: 'sticker' }).toArray());
await studio.loadCharacter(new URL(catalog.characters[0].url, base).href);
```

## How it composes the engines (no duplication)

- Canvas Engine: layers/objects, `engine.selection`, tools (`SelectTool`),
  `engine.history` (via `StateCommand` snapshots), `engine.camera` (zoom/pan/fit),
  `engine.plugins` (`SelectionPlugin` handles overlay), `engine.importer.image`,
  `engine.exporter` (region export). 
- Content Engine: sticker items (`content.filter({assetType:'sticker'})`).

Undo/redo store whole-scene snapshots (part transforms + z-order + stickers +
expression), rebuilt from cached images — synchronous and robust.

## Files

```
creative-studio/
  index.js, CreativeStudio.js, CharacterLoader.js
  scene/ MovableObject, ImagePartObject, StickerObject, CharacterScene,
         SelectionPlugin, StateCommand
  tools/ SelectTool
  ui/ StudioUI, h
  content/ catalog.json, characters/*.json, parts/**/*.svg, stickers.*
css/creative-studio.css
examples/creative-studio.html
```
