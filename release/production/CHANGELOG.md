# Changelog — Kids Creative Studio

All notable changes to this project are documented here.
This project adheres to Semantic Versioning (MAJOR.MINOR.PATCH).

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
