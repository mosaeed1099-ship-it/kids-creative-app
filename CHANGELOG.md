# Changelog — Kids Creative Studio

All notable changes to this project are documented here.
This project adheres to Semantic Versioning (MAJOR.MINOR.PATCH).

## [1.4.0] — Activate 4 more built-but-unwired features

All remaining completed modules are now reachable (wired to routes + their
stylesheets loaded). No logic duplicated — thin Module wrappers over existing
apps + Content Engine packs.

- **أنشطة** (`/learning`) — Learning Activities (letters, numbers, shapes, mazes…).
- **إبداع** (`/create`) — Creative Studio (build a character + stickers + expressions).
- **الطباعة** (`/print`) — Print Center (print coloring pages / artwork).
- **لوحة الأهل** (`/parents`, hidden like admin) — Parent Dashboard (per-child
  profiles + progress; no demo seeding — starts from real state).

## [1.3.1] — Performance: caching + offline (Service Worker)

Fixes slow page-to-page navigation. The app is unbundled ES modules, so each
navigation fetched dozens of files; Cloudflare's default
`max-age=0, must-revalidate` forced a ~250 ms network round-trip per file every
time.

- **Service Worker** (`sw.js`): caches everything on first use and serves it
  instantly afterward (stale-while-revalidate); the app now works fully offline.
  Cache is keyed to the build version so each release refreshes it.
- **`_headers`**: static `/js`, `/css`, `/assets` are cached (entry document,
  worker and VERSION stay always-fresh so deploys propagate); + security headers.
- `_redirects`: SPA fallback. `tools/build.mjs` stamps the version into `sw.js`.

Measured: `/admin` mount dropped from ~8.8 s (cold, network) to ~0.24 s once
cached, with the module tree served from cache with zero network transfer.

## [1.3.0] — Activate Coloring + Trace

Two features that were fully built but never wired are now live:

- **Coloring** (`/coloring`) — the real Coloring Library (browse packs → pick a
  page) + full ColoringApp (bucket/brush/pencil/eraser, palette, undo/redo,
  autosave, print/export). Replaces the "coming soon" placeholder.
- **Trace** (`/trace`) — the full Trace-a-reference Studio (faint reference +
  drawing tools, opacity/move/flip, upload, templates). Replaces the placeholder.

Fixes: `index.html` now loads the coloring-library / coloring.module /
trace-studio stylesheets (previously the overlays rendered unstyled).

## [1.2.0] — Creative modules + Content Management System

Adds the full creative studios and an offline Content Management System on top
of 1.0.0. All additive (native ES modules, zero dependencies, fully offline).

### Added
- Free Draw Studio (`/draw`), Sticker Studio (`/stickers`), Puzzle Studio
  (`/puzzles`), Story Creator (`/story`).
- Admin CMS (`#/admin`) — offline content editor: reliability & data-safety
  (IndexedDB assets, verified persistence, backup/restore), version history +
  undo/redo, trash, Media Library & Asset Manager, and a publishing/release
  builder that produces a validated production package.

### Notes
- `learning-activities` remains built but not yet wired into navigation.
- `/trace` still routes to the placeholder (full `trace-studio` not yet wired).

## [1.0.0] — Release Candidate (RC1)

First commercial production release. **No new features** were added in this
phase — it is a quality, performance, offline, accessibility, error-handling,
documentation and packaging pass on top of the frozen feature set (Phases 1–11).

### Added (all additive — no existing module was modified)
- `css/a11y.css` — global accessibility layer: visible keyboard focus,
  `prefers-reduced-motion`, comfortable touch targets, screen-reader utilities,
  skip link, high-contrast focus rings.
- `js/app/safe.js` — graceful helpers (safe JSON parse, safe fetch, storage
  probe, unsupported-browser check, image fallback).
- `js/app/boot.js` — production boot harness with global error/rejection
  handlers and a friendly Arabic error panel (missing/broken content, failed
  imports, unsupported browser) instead of a blank screen.
- `assets/favicon.svg`, `assets/icons/app-icon.svg`, `manifest.webmanifest` —
  installable PWA metadata and icons (also removes the favicon 404).
- `VERSION`, `package.json` (v1.0.0), this `CHANGELOG.md`.
- `tools/build.mjs` — assembles the versioned release (production / development
  / examples / docs / assets). The production copy ships **without the optional
  Google-Fonts link**, so it is 100% self-contained and offline.
- `docs/` — complete documentation set (User, Administrator, Developer, Folder
  Structure, Content Creation, Add Packs/Activities/Coloring/Characters/PDFs)
  plus QA Audit, Offline Validation, Accessibility, Performance reports and the
  Release Checklist.

### Verified
- 184/184 JavaScript files pass a syntax check; 28/28 JSON packs parse.
- 11/11 pages (main app + every example) load with **all external requests
  blocked**, with **zero** same-origin failures and **zero** console errors —
  confirming full offline operation.
- Storage layer degrades safely (private mode / quota / corrupted values) via
  in-memory fallback; corrupted JSON returns a fallback rather than throwing.

### Unchanged / Frozen
- All Phase 1–11 modules, engines, styles and content are byte-for-byte frozen.
  Nothing was rewritten, redesigned, or re-architected.
