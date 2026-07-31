# Folder Structure Guide

A map of the repository so you can find anything quickly. The app is a static
site; every path below is served as-is.

## Top level

```
kids-creative-studio/
  index.html            App entry (loads the core + UI foundation)
  manifest.webmanifest  PWA metadata (name, icons, theme, RTL)
  VERSION               Current version string (1.0.0)
  package.json          Metadata + scripts (no runtime dependencies)
  CHANGELOG.md          Version history
  README.md             Project overview & quick start
  assets/               Brand assets (favicon, app icon) + placeholder folders
  css/                  All stylesheets (tokens, base, per-module, a11y)
  docs/                 This documentation set
  examples/             One runnable demo page per module
  js/                   All application code (see below)
  tools/                Build & content generators (dev-time only)
  release/             Produced by tools/build.mjs (not committed source)
```

## `js/` — application code

```
js/
  main.js               Core boot / app shell entry
  app/                  Phase 12 production helpers (safe.js, boot.js)
  config/               Static configuration
  core/                 Core app scaffolding
  data/                 Static data
  managers/             App-level managers
  pages/                Top-level app pages/routes
  ui/                   Shared UI foundation layer
  utils/                Shared utilities (e.g. storage.js)
  engine/               CANVAS ENGINE (public API via engine/index.js)
  content/              CONTENT ENGINE (public API via content/index.js)
  modules/              FEATURE MODULES (one folder each)
```

### `js/engine/` — Canvas Engine
Scene objects, layers, tools, plugins, commands, camera, history, importer,
exporter. Public surface is the barrel `js/engine/index.js`. Consumed by drawing
modules; internals are not touched by modules.

### `js/content/` — Content Engine
`managers/` (ContentManager, Favorites, Recent), `io/` (loader, cache),
`registry/`, `search/` (SearchEngine, Filter), `model/` (ContentItem, Pack,
Collection, enums), `util/` (events, persist). Public surface:
`js/content/index.js`.

### `js/modules/` — feature modules
```
coloring/            Interactive coloring (Canvas Engine)
coloring-library/    Gallery: search, favorites, recent, lazy thumbnails
trace/  trace-studio/ Guided tracing
creative-studio/     Movable-character builder (parts + expressions)
learning-activities/ 9 data-driven educational activities
print-center/        Print + offline PDF/ZIP export
parent-dashboard/    Profiles, progress, achievements
draw/ puzzles/ stickers/ story/   Lazy-loaded placeholders (architecture)
```

A typical module folder:
```
<module>/
  index.js            Public barrel (default export = the module class)
  <Module>.js         Controller (mount / destroy)
  ...components...
  ui/                 View components
  content/            catalog.json + *.pack.json (+ art/ assets)
  README.md           Module docs
```

## `css/` — stylesheets

Base/theme: `tokens.css`, `app.css`, `components.css`, `animations.css`,
`responsive.css`. Per-module: `coloring.css`, `coloring-library.css`,
`trace.css`, `trace-studio.css`, `creative-studio.css`, `dashboard.css`,
`parent-dashboard.css`, `print-center.css`, `learning-activities.css`, plus
`draw.css`, `coloring.module.css`. Production layer: **`a11y.css`** (include
last).

## `content/` folders — where content lives

Each module keeps its own content next to its code:

```
js/modules/<module>/content/
  catalog.json        Lists the pack(s) for this module
  <name>.pack.json    The items (data-driven) for a pack
  art/ | parts/ | characters/   The referenced SVG / JSON assets
```

The Content Engine loads a catalog, then loads packs on demand and exposes their
items through filter/search. See [Content Creation Guide](CONTENT_CREATION_GUIDE.md).

## `release/` — build output

Created by `node tools/build.mjs`:
```
release/
  production/   Deployable, offline-hardened app
  development/   Full source + tools
  examples/      Standalone demo pages
  docs/          These guides
  assets/        Brand assets
  README.md
```
