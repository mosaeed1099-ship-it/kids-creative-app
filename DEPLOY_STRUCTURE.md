# Final Folder Structure — as uploaded to GitHub

This is exactly what the `kids-creative-studio/` repository contains after
deployment prep. Push the **whole repository**; Cloudflare Pages serves only
the `release/production/` subfolder (set as the build output directory).

```
kids-creative-studio/                 ← git repository root (push all of this)
│
├── wrangler.toml                      ← Cloudflare: pages_build_output_dir = release/production
├── .gitignore
├── .gitattributes
├── DEPLOYMENT.md                      ← step-by-step deploy guide
├── DEPLOYMENT_CHECKLIST.md            ← pre-flight checklist (all verified)
├── DEPLOY_STRUCTURE.md                ← this file
│
├── README.md                          ← project overview
├── CHANGELOG.md
├── VERSION                            ← 1.0.0
├── package.json                       ← metadata only (dependencies: {})
├── manifest.webmanifest
├── index.html                         ← source entry (dev; production has its own copy)
│
├── css/            (source stylesheets)
├── js/             (source app code)
├── assets/         (brand assets)
├── examples/       (source demo pages)
├── docs/           (user / admin / developer / content guides)
├── tools/          (build.mjs — dev only, NOT deployed)
│
└── release/                           ← generated build tree (committed)
    ├── README.md
    ├── assets/                        (convenience copy of brand assets)
    ├── docs/                          (all guides)
    ├── examples/                      (standalone hardened demos)
    ├── development/                   (full source + tools — reference only)
    │
    └── production/     ★ THE DEPLOYED FOLDER — Cloudflare output directory ★
        ├── _headers                   ← security headers + cache policy
        ├── _redirects                 ← no-op (hash routing needs no rewrites)
        ├── index.html                 ← offline-hardened entry (no font CDN, +a11y, +PWA)
        ├── manifest.webmanifest
        ├── package.json               ← app metadata
        ├── README.md
        ├── CHANGELOG.md
        ├── VERSION
        ├── assets/
        │   ├── favicon.svg
        │   ├── icons/app-icon.svg
        │   ├── images/  sounds/  pdf/  stickers/   (empty, .gitkeep-tracked)
        ├── css/                        (17 stylesheets: tokens, app, a11y, modules…)
        ├── examples/                   (10 standalone demo pages)
        └── js/
            ├── main.js
            ├── app/        (boot, safe)
            ├── config/     (app / theme / routes)
            ├── core/       (App, Router, Store, EventBus, Module, View…)
            ├── ui/         (Navbar, Sidebar, Dialog, Toast, Modal…)
            ├── managers/   (I18n, Asset, Settings, Theme)
            ├── pages/      (Dashboard, Settings, NotFound)
            ├── modules/    (coloring, draw, trace, print-center, creative-studio,
            │                learning-activities, parent-dashboard, coloring-library, story)
            ├── engine/     (CanvasEngine, core, plugins, io)
            ├── content/    (models, managers, io, search, registry, data/packs)
            ├── data/       (features.registry.js)
            └── utils/      (dom, storage, id, logger)
```

## What Cloudflare Pages actually serves

- **Output directory:** `release/production` (≈ 302 files, 79 folders).
- **No build command runs** — files are served verbatim.
- All URLs are same-origin; the app makes **zero external network requests**.

## Deployed vs. not deployed

| In the repo | Served by Cloudflare? |
|---|---|
| `release/production/**` | ✅ Yes (this is the site) |
| `release/development/`, `release/docs/`, `release/examples/`, `release/assets/` | ❌ No (reference copies) |
| root `js/ css/ assets/ examples/ docs/ tools/ index.html` | ❌ No (source) |
| `wrangler.toml`, `.git*`, `DEPLOYMENT*.md` | ❌ No (repo/config) |
