# Kids Creative Studio — Release 1.1.0

This folder is a versioned, ready-to-ship build. Nothing here requires a
bundler, a server-side runtime, or an Internet connection.

```
release/
  production/   → deploy THIS folder (Cloudflare Pages / GitHub Pages / Netlify)
  development/   → full source + tools + content generators
  examples/      → standalone demo pages for each module
  docs/          → user, admin, developer & content guides + release checklist
  assets/        → brand icons / favicon / PWA manifest
```

## Deploy (production/)
Upload the `production/` folder as-is to any static host, or run locally:

```bash
cd production && python3 -m http.server 8000   # open http://localhost:8000
```

The production build is offline-first: the optional web font is removed and the
app falls back to the system font stack, so it works with no network at all.

Version 1.1.0 · Kids Creative Studio
