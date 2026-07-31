# How to Add a New Learning Activity

The Learning Activities module is **fully data-driven**. An activity is just a
Content item whose `assetType` is `"activity"` and whose `data` field carries a
`type` (which renderer to use) and `params` (the puzzle content). To add an
activity you add **data** — no JavaScript — as long as you use one of the nine
built-in `type`s below.

File to edit: `js/modules/learning-activities/content/activities.pack.json`
(add an object to `items[]`). Optionally add a matching `category`.

## Common fields for every activity

```json
{
  "id": "act-unique-id",
  "assetType": "activity",
  "title": { "ar": "العنوان" },
  "categoryId": "cat-logic",
  "ageGroup": "child",          // toddler | preschool | child
  "difficulty": "medium",       // easy | medium | hard
  "thumbnail": { "type": "emoji", "value": "🎯" },
  "data": { "type": "<one of the 9 types>", "params": { /* see below */ } }
}
```

`difficulty` and `ageGroup` power the library filters. Stars are awarded
automatically from performance (fewer mistakes/hints → more stars).

## The nine activity types & their `params`

**1. connect-dots** — tap numbered dots in order to draw a shape.
```json
{ "type": "connect-dots", "params": {
  "reveal": "⭐",
  "points": [ {"x":50,"y":8}, {"x":61,"y":38}, {"x":92,"y":38} ]
}}
```
`x`/`y` are 0–100 (percent of the canvas). Dots are numbered in array order.

**2. maze** — move the hero through open cells to the goal.
```json
{ "type": "maze", "params": {
  "cols": 6, "rows": 6, "start": [0,0], "end": [5,5],
  "hero": "🐰", "goal": "🥕",
  "walls": [[0,2],[1,2],[2,2]]
}}
```
`walls` are `[row, col]` blocked cells. **Always ensure a path exists** from
`start` to `end` (the shipped packs are generated to guarantee this).

**3. match-shadow** — drag each picture onto its matching shadow.
```json
{ "type": "match-shadow", "params": { "pairs": [
  { "id": "lion", "emoji": "🦁" }, { "id": "turtle", "emoji": "🐢" }
]}}
```

**4. match-shape** — drag each colored shape into its outline.
```json
{ "type": "match-shape", "params": { "shapes": [
  { "id": "circle", "shape": "circle", "color": "#ff6b9d" },
  { "id": "star",   "shape": "star",   "color": "#ffb020" }
]}}
```
`shape` ∈ `circle | square | triangle | star | heart`.

**5. find-difference** — tap the spots that differ between two scenes.
```json
{ "type": "find-difference", "params": {
  "cols": 4, "rows": 3,
  "scene": ["🌳","🌸","🦋","☁️","🐦","🌷","🍄","🌞","🐞","🌿","🐝","🏵️"],
  "differences": [ {"i":2,"to":"🐛"}, {"i":5,"to":"🌼"} ]
}}
```
`i` is the index in `scene`; `to` is what it becomes in the second scene.

**6. pattern-completion** — pick what comes next.
```json
{ "type": "pattern-completion", "params": {
  "sequence": ["🔴","🔵","🔴","🔵","🔴"],
  "options": ["🔵","🟡","🔴"], "answer": "🔵"
}}
```

**7. numbers** — two modes.
```json
{ "type": "numbers", "params": { "mode": "count", "emoji": "🍏", "count": 4, "options": [3,4,5,6], "answer": 4 } }
{ "type": "numbers", "params": { "mode": "order", "numbers": [1,2,3,4,5] } }
```

**8. alphabet** — two modes (Arabic letters).
```json
{ "type": "alphabet", "params": { "mode": "order", "letters": ["أ","ب","ت","ث","ج"] } }
{ "type": "alphabet", "params": { "mode": "match", "pairs": [
  { "letter": "أ", "emoji": "🦁", "word": "أسد" },
  { "letter": "ب", "emoji": "🦆", "word": "بطة" }
]}}
```

**9. puzzle** — swap pieces until the picture is complete. The picture is drawn
on-device from an emoji (no image files needed).
```json
{ "type": "puzzle", "params": { "emoji": "🐱", "cols": 2, "rows": 2 } }
```

## Add a category (optional)

To group activities in the library, add to `categories[]`:
```json
{ "id": "cat-focus", "title": { "ar": "تركيز" }, "icon": "🔍", "packId": "activities", "order": 4 }
```
Then reference it via `"categoryId": "cat-focus"` on your items.

## Validate & deploy

```bash
python3 -c "import json; json.load(open('activities.pack.json')); print('OK')"
```
Re-deploy and hard-refresh. Your activity appears in the library with the right
type badge, difficulty, and age filters.

## Adding a brand-new activity *type* (code)

Only needed if none of the nine fit. Write a renderer under
`activities/<name>.js` implementing the contract
`renderer(container, item, api) → { hint(), getState(), setState(s), destroy() }`
and register it in `ActivityRegistry.js` (one line + a `TYPE_META` entry). See
the module README for the full renderer contract. This is an additive change and
does not touch existing activities.
