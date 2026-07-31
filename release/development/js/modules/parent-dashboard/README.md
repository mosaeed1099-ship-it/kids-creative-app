# Parent Dashboard + Child Profiles (Phase 7)

A complete, **100% offline** parent area: multiple child profiles, per-child
progress, achievements and statistics — all stored in **localStorage**. No
backend, no accounts, no cloud. New files only; nothing existing is modified.

## What's inside

- **Child profiles** — name, avatar, age, favorite color, creation date; with
  **create / edit / delete / switch** (`ProfileManager`).
- **Per-child activity tracking** — a reusable engine (`ActivityTracker`) that
  records: pages completed, started-but-unfinished, favorites, recently opened,
  time spent, packs completed, colors used, categories, and **daily activity**.
- **Achievement engine** — reusable, data-driven (`AchievementEngine` +
  `data/achievements.def.js`): First Coloring, 10 / 50 / 100 Pages, Animal
  Master, Alphabet Master, Space Explorer, Perfect Week, and more.
- **Statistics** — completion %, favorite categories, favorite colors, activity
  by day (SVG chart), total drawings / prints / exports (`StatsService`).
- **Beautiful dashboard** — child cards, overview, stat tiles, activity chart,
  achievements grid, **Continue Coloring**, **Recently Used**, **Favorite
  Packs**. Large touch targets, colorful, responsive.

## Usage

```js
import ParentDashboard from '../modules/parent-dashboard/index.js';

const dash = new ParentDashboard({
  mount: '#app',
  options: {
    content,                 // optional Content Engine (resolves item/pack names)
    totalPages: 44,          // for completion %
    onOpenItem: (id) => {},  // optional: jump into a coloring page
  },
});
dash.mount();
```

## Reusable activity/achievement engine (how feature modules feed it)

The tracker is the integration point. A feature module records events on the
**active child's** tracker — one line each:

```js
const tracker = dash.activeTracker();       // ActivityTracker for the active child
tracker.open(item);                          // opened a page
tracker.complete(item);                      // finished a page  → counts, streaks
tracker.useColor('#ff5a5a');                 // color usage
tracker.print();  tracker.exportImage();     // outputs
tracker.addTime(120000);                     // time spent (ms)
tracker.setFavorite(item.id, true);          // favorite
tracker.markPackCompleted('animals');        // pack completed
```

Achievements are evaluated automatically on each render; newly-earned ones are
persisted via `tracker.recordUnlocks(...)`.

## Offline & privacy

Everything lives under localStorage keys `kcs.profiles` and `kcs.stats:<id>`.
There is no network code anywhere in this module. Deleting a profile removes its
data from the device.

## Public API (ParentDashboard)

| Member | Purpose |
|--------|---------|
| `mount()` | build + render the dashboard |
| `profiles` | `ProfileManager` (list/create/update/remove/setActive) |
| `tracker(id)` / `activeTracker()` | the per-child `ActivityTracker` |
| `engine` | `AchievementEngine` |
| `render()` | re-render (after external activity) |

## Files

```
parent-dashboard/
  index.js                 public barrel
  ParentDashboard.js       controller (profiles + render)
  ProfileManager.js        profiles CRUD + switch (localStorage)
  model/Profile.js         profile model
  ActivityTracker.js       per-child event/stats engine (reusable)
  AchievementEngine.js     evaluates achievements (reusable)
  StatsService.js          derived statistics
  data/achievements.def.js achievement definitions (data-driven)
  ui/ProfileEditor.js      create/edit modal
  ui/DashboardView.js      tiles, chart, achievements, lists builders
  util.js                  Store / Emitter / h / helpers
css/parent-dashboard.css   styling (new file)
examples/parent-dashboard.html
```
