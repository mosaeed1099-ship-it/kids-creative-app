# Kids Learning Activities (Phase 11)

A complete, **fully-offline** educational-activities center for kids. It is a
**data-driven** framework: every activity is just a Content-Engine item whose
`data` field describes its `type` + `params`, so new activities are added as
**data**, not code. The module consumes **only** the Content Engine public API
for its library; the Canvas Engine is available for activities that want it
(the puzzle draws its picture on a `<canvas>`). **No backend, no cloud, no AI,
no external APIs — everything runs on the device.**

## Activities (9 types, all data-driven)

| type | what the child does |
|------|---------------------|
| `connect-dots` | tap the numbered dots in order to draw a shape |
| `maze` | move the hero through open cells to the goal |
| `match-shadow` | drag each picture onto its matching shadow |
| `match-shape` | drag each colored shape into its outline |
| `find-difference` | tap the spots that differ between two scenes |
| `pattern-completion` | pick what comes next in the pattern |
| `numbers` | count objects, or order numbers small→large |
| `alphabet` | order Arabic letters, or match a letter to a picture |
| `puzzle` | swap pieces until the picture is complete |

## Features

- **Activity Library** — searchable, responsive card grid.
- **Difficulty levels** (سهل / متوسط / صعب) and **age groups** — real filters.
- **Progress tracking** — best **stars** (0–3) and completion per activity,
  saved locally.
- **Hints** — every activity exposes a friendly hint (💡).
- **Stars** — earned from performance (fewer mistakes/hints → more stars).
- **Completion screen** — celebration, stars, and next actions.
- **Rewards** — data-driven **badges** unlock as the child progresses.
- **Local progress saving + Continue** — an in-progress snapshot is stored, so
  activities that support it resume where the child left off (cards show a
  “متابعة” ribbon).
- **Kid-friendly UX** — large touch targets, tablet-optimized, high-DPI-safe
  (vector/emoji), smooth animations, friendly colors, full **RTL**.

## Usage

```js
import LearningActivities from '../modules/learning-activities/index.js';
import { ContentManager } from '../content/index.js';

const base = new URL('../js/modules/learning-activities/content/', location.href).href;
const content = new ContentManager({ base });
await content.init({ catalog: 'catalog.json' });
await content.loadPack('activities');

const la = new LearningActivities({ mount: '#app', content });
la.mount();
```

### Options

```js
new LearningActivities({
  mount: '#app',
  content,
  options: {
    progressKey: 'kcs.learning.progress',  // localStorage key for progress
    badgeKey:    'kcs.learning.badges',     // localStorage key for rewards
    colors:      { primary: '#5b6bff', accent: '#ff6b9d' },
    // tracker / rewards instances may be injected to share state
  },
});
```

Public API: `mount()`, `open(item,{resume})`, `showLibrary()`, `stats()`,
`badges()`, `resetProgress()`, `destroy()`.

## Adding a new activity (data only)

Add a Content item to `content/activities.pack.json`:

```json
{
  "id": "act-pattern-x", "assetType": "activity",
  "title": { "ar": "أكمل النمط" },
  "ageGroup": "child", "difficulty": "medium",
  "thumbnail": { "type": "emoji", "value": "🔺" },
  "data": { "type": "pattern-completion",
            "params": { "sequence": ["🔴","🔵","🔴"], "options": ["🔵","🟡"], "answer": "🔵" } }
}
```

No JS changes are needed unless you introduce a brand-new `type`.

## The renderer contract

A renderer is a function; register it once in `ActivityRegistry.js`:

```js
renderer(container, item, api) -> { hint(), getState(), setState(s), destroy() }

api = {
  params,                 // item.data.params
  colors,                 // theme colors
  progress(0..1),         // update the progress bar (also snapshots state)
  complete(stars 0..3),   // finish → records progress, evaluates rewards
}
```

`ActivityHost` builds the header (title / stars / hint / restart / back), the
progress bar, and the completion screen; renderers only draw the play area.

## Files

```
learning-activities/
  index.js                     public barrel
  LearningActivities.js        controller (library ↔ host)
  ActivityHost.js              runs one activity + completion
  ActivityRegistry.js          type → renderer map (+ TYPE_META)
  ProgressTracker.js           local stars/completion/continue
  Rewards.js                   data-driven badges
  activities/
    base.js                    h(), shuffle, DragController, effects, stars
    connectDots.js maze.js matchShadow.js matchShape.js findDifference.js
    patternCompletion.js numbers.js alphabet.js puzzle.js
  ui/ Library.js  Completion.js
  content/ catalog.json  activities.pack.json  (_gen.mjs dev generator)
css/learning-activities.css
examples/learning-activities.html
```

## Offline & privacy

Everything is local: activity data is static JSON, progress and rewards use
`localStorage` (with an in-memory fallback), and the puzzle image is rendered
on-device from an emoji. Nothing is uploaded and no network is required.
