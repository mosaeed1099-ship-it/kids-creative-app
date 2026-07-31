# Release Checklist — Kids Creative Studio v1.0.0

Use this before shipping each release. All RC1 items are checked as verified for
v1.0.0.

## Version & metadata
- [x] `VERSION` set to `1.0.0`
- [x] `package.json` version `1.0.0`, `type: module`, no dependencies
- [x] `CHANGELOG.md` updated with the 1.0.0 entry
- [x] `manifest.webmanifest` present (name, icons, theme, RTL)

## Code quality (QA)
- [x] All JavaScript passes `node --check` (184/184)
- [x] All JSON catalogs & packs parse (28/28)
- [x] No console errors/warnings on load (main app + all examples)
- [x] No same-origin request failures on load
- [x] Storage degrades gracefully (private mode / quota / corrupted values)
- [x] Content Engine validates catalogs/packs; failures show a friendly card

## Offline
- [x] No external network references in shipped app (production strips the font)
- [x] 11/11 pages load & function with all external requests blocked
- [x] Local-only assets; on-device PDF/ZIP export; no third-party scripts

## Accessibility
- [x] Global `css/a11y.css` included last (focus-visible, reduced-motion,
      touch targets, sr-only, skip link, high-contrast)
- [x] Interactive elements are semantic and keyboard-operable
- [x] `dir="rtl"` and `lang="ar"` on pages; localized error panels
- [ ] (Optional, post-1.0) `aria-label`s on emoji-only icon buttons

## Error handling
- [x] Global error/rejection handlers (`js/app/boot.js`)
- [x] Unsupported-browser guard with a friendly message
- [x] Missing/broken content → friendly Arabic "couldn't load" card + retry
- [x] Missing images can fall back via `attachImageFallback`

## Production build
- [x] `node tools/build.mjs` produces `release/` with production / development /
      examples / docs / assets
- [x] Production `index.html` has **no** font CDN link
- [x] Production HTML injects a11y CSS, favicon, manifest, error handler, skip link
- [x] `release/production/` loads offline with zero external requests

## Documentation
- [x] User Guide, Administrator Guide, Developer Guide
- [x] Folder Structure Guide
- [x] Content Creation Guide + Add Packs / Activities / Coloring / Characters / PDFs
- [x] QA Audit, Offline Validation, Accessibility, Performance reports
- [x] This Release Checklist

## Pre-deploy smoke test
- [ ] Serve `release/production/` and open the app + one of each activity type
- [ ] Confirm printing/PDF/ZIP export works on the target device
- [ ] Confirm "Add to Home Screen" installs with correct name/icon
- [ ] Hard-refresh after any content change to bust browser cache

## Sign-off
- Version: **1.0.0**
- Status: **Release Candidate (RC1) — approved**
- Notes: Feature set frozen (Phases 1–11); this release is polish, hardening,
  docs, and packaging only.
