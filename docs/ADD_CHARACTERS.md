# How to Add a New Character

Creative Studio characters are **movable, layered figures**: a character is a
JSON definition listing parts (each an SVG), positions, and z-order, plus
optional expression swaps. Add one by creating the definition + part art and
registering it in the character catalog.

Files:
- Definition: `js/modules/creative-studio/content/characters/<id>.json`
- Part art: `js/modules/creative-studio/content/parts/<id>/*.svg`
- Register in: `js/modules/creative-studio/content/catalog.json`

## 1. Create the part art

Each part is a self-contained SVG (local, no external refs). Keep a consistent
canvas size in mind (e.g. 600×600) and design parts to sit at their intended
positions.

```
content/parts/bunny/
  body.svg  head.svg  ear.svg  tail.svg  eyes.svg  nose.svg
```

## 2. Write the character definition

`content/characters/bunny.json`:

```json
{
  "id": "bunny",
  "name": { "ar": "الأرنب", "en": "Bunny" },
  "thumbnail": { "value": "🐰" },
  "canvas": { "w": 600, "h": 600 },
  "parts": [
    { "id": "tail", "kind": "tail", "src": "../parts/bunny/tail.svg", "x": 430, "y": 400, "z": 1 },
    { "id": "body", "kind": "body", "src": "../parts/bunny/body.svg", "x": 300, "y": 410, "z": 2 },
    { "id": "ear-l", "kind": "ear", "src": "../parts/bunny/ear.svg", "x": 250, "y": 150, "z": 3 },
    { "id": "ear-r", "kind": "ear", "src": "../parts/bunny/ear.svg", "x": 350, "y": 150, "z": 3, "flipH": true },
    { "id": "head", "kind": "head", "src": "../parts/bunny/head.svg", "x": 300, "y": 250, "z": 4 },
    { "id": "eyes", "kind": "eyes", "src": "../parts/bunny/eyes.svg", "x": 300, "y": 250, "z": 5 }
  ],
  "expressions": {
    "happy": { "eyes": "../parts/bunny/eyes-happy.svg" },
    "sleepy": { "eyes": "../parts/bunny/eyes-sleepy.svg" }
  }
}
```

Field notes:
- `parts[]` — each has `id` (unique in the character), `kind` (semantic slot like
  `head`/`ear`/`tail`), `src` (relative to this JSON file), `x`/`y` (position on
  the character canvas), `z` (layer order, higher = front).
- `flipH: true` mirrors a part horizontally (reuse one ear for both sides).
- `canvas` — the working size the positions are expressed in.
- `expressions` (optional) — named sets that swap a part's image by slot; e.g.
  the `happy` expression replaces the `eyes` slot's image.

Part `src` and expression paths are resolved relative to the character JSON URL
and preloaded through the Canvas Engine's importer, so swaps and undo/redo are
instant.

## 3. Register in the catalog

Add to `characters[]` in `content/catalog.json`:

```json
{
  "id": "bunny",
  "name": { "ar": "الأرنب", "en": "Bunny" },
  "url": "characters/bunny.json",
  "thumbnail": { "value": "🐰" }
}
```

## 4. Validate & deploy

```bash
python3 -c "import json; json.load(open('characters/bunny.json')); print('OK')"
python3 -c "import json; json.load(open('catalog.json')); print('OK')"
```
Open each part SVG to confirm it renders. Re-deploy and hard-refresh. The new
character appears in Creative Studio's picker.

## Licensing reminder

Only add **original or clearly-licensed** character art. Do not recreate
copyrighted or trademarked cartoon characters. Record provenance if relevant.
