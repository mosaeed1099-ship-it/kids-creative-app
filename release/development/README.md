# Kids Creative Studio

A professional **static** web application — no backend, no database, no build step.
Everything runs in the browser using native **ES modules**. Deploy the folder as-is
to Cloudflare Pages, GitHub Pages, or Netlify at **zero monthly cost**.

> This repository currently contains the **architecture only**. The creative
> features (coloring, drawing, tracing) are wired as lazy-loaded placeholders and
> will be implemented next, without changing the core.

## Run locally

Because the app uses ES modules and dynamic `import()`, open it through a tiny
static server (not `file://`):

```bash
# any static server works — pick one
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy (zero cost)

- **Cloudflare Pages / Netlify:** connect the repo, framework preset **None**,
  build command **empty**, output directory **/** (root). Done.
- **GitHub Pages:** enable Pages on the branch root. Hash routing + `import.meta.url`
  path resolution mean it also works from a project sub-path (`/repo/`).

## Project structure

```
index.html                 # single entry (loads css + js/main.js as a module)
assets/                     # images, icons, sounds, pdf, stickers
css/                        # app + dashboard + per-feature + responsive styles
js/
  main.js                   # entry: boots App
  config/                   # app.config, theme.config, routes.config
  core/                     # App, Router, EventBus, Store, View, Module,
                            #   ModuleLoader, AppContext (framework layer)
  managers/                 # Theme, I18n, Asset, Settings managers
  ui/                       # Component base + Navbar, Sidebar, Modal, Toast, ThemeToggle
  utils/                    # dom, storage (LocalStorageManager), id, logger
  pages/                    # Dashboard, Settings, NotFound (static pages)
  data/                     # features.registry.js (single source of truth)
  modules/                  # feature modules (lazy-loaded): coloring / draw / trace
```

## Architecture at a glance

- **Composition root:** `core/App.js` builds every service and injects them into a
  frozen **AppContext** passed to every view. No globals.
- **Routing:** `core/Router.js` — hash-based, zero server config, back-button safe.
- **Lazy features:** `core/ModuleLoader.js` uses dynamic `import()` so each feature's
  code is fetched only when opened (real code-splitting, no bundler).
- **State:** `core/Store.js` — reactive, auto-persists through `LocalStorageManager`.
- **Theming:** `managers/ThemeManager.js` applies data-driven tokens
  (`config/theme.config.js`) as CSS variables; light/dark included.
- **i18n + RTL:** `managers/I18nManager.js` (Arabic-first, English-ready).
- **Events:** `core/EventBus.js` decouples everything (pub/sub).

## How to add a new feature (later)

1. Create `js/modules/<name>/<Name>Module.js` extending `core/Module.js`.
2. Add one entry to `js/data/features.registry.js`.

The dashboard card, the sidebar link, the route, and lazy-loading all light up
automatically. No other file changes.

## Rebranding

Edit `js/config/app.config.js` (`brand`, `access.defaultPassword`, `name`) and swap
assets under `assets/`. Themes live in `js/config/theme.config.js`.
