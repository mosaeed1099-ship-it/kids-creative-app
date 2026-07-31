# Administrator Guide

This guide is for whoever **deploys and maintains** Kids Creative Studio. The app
is a static site: there is no server code, no database, and no build step. You
host a folder of files and you're done.

## What you deploy

Deploy the **`release/production/`** folder (from the shipped release), or the
project root during development. Either is a plain static site.

The production folder is offline-hardened: the optional web font is removed (the
app uses the system font stack), and it includes a PWA manifest, icons, an
accessibility stylesheet, and global error handling.

## Deploying to a static host (free)

**Cloudflare Pages / Netlify:** create a new project, choose "deploy a folder"
(no build command, no framework preset), and upload `production/`. Set the
output/publish directory to that folder. There is nothing to build.

**GitHub Pages:** commit the contents of `production/` to a repo (or a `docs/`
folder / `gh-pages` branch) and enable Pages for that path.

**Any web server (Apache/Nginx/S3/etc.):** copy `production/` into the web root.
Ensure the server sends the correct MIME types — most importantly
`text/javascript` (or `application/javascript`) for `.js` and
`application/json` for `.json`. Modern hosts do this automatically.

## Running locally

Because the app uses ES modules and `fetch()` for content, open it through a
tiny static server rather than `file://`:

```bash
cd production
python3 -m http.server 8000
# open http://localhost:8000
```

Any static server works (Node's `npx serve`, `php -S`, etc.).

## Offline operation

The app is designed to run with **no Internet connection**. It was validated
with every external request blocked (see [Offline Validation](OFFLINE_VALIDATION.md)).
For a true installable, cache-backed offline experience on tablets, you can
optionally add a service worker at deploy time (not required for the app to
function offline when the files are already present locally).

## Install as an app (PWA)

The production build ships `manifest.webmanifest` and SVG icons. On a tablet or
desktop, open the site and use the browser's **"Add to Home Screen" / "Install"**
option to launch it full-screen. The manifest sets the name, theme color, and
RTL Arabic direction.

## Managing content

All content is data — JSON packs plus SVG/emoji assets — under each module's
`content/` folder. You do not need to touch code to add coloring pages,
activities, characters, or printables. See the
[Content Creation Guide](CONTENT_CREATION_GUIDE.md) and the per-type how-tos.

After editing content, just re-deploy the folder. There is no cache to bust
other than the browser's normal static caching (a version bump or hard refresh
picks up changes).

## Data & privacy

The app stores progress, favorites, saved artwork, and profiles in the browser's
**localStorage**, namespaced under `kcs:` / `kcs.*` keys. Nothing is transmitted.
The storage layer degrades gracefully: if storage is blocked (private mode,
quota, or a locked-down kiosk), the app falls back to in-memory state and keeps
working for the session.

To reset a device, clear site data in the browser, or use the reset controls in
the Parent Dashboard and activities.

## Updating

To ship an update: replace the deployed files with the new version. Because
there's no build and no dependencies, upgrades are a file copy. Keep the
[Release Checklist](RELEASE_CHECKLIST.md) handy before each deploy.

## Troubleshooting

- **Blank page / modules don't load:** you're likely opening via `file://` or the
  server isn't sending JS with a JavaScript MIME type. Serve over HTTP with
  correct MIME types.
- **A section shows a friendly "couldn't load" card:** a content file may be
  missing or malformed. Validate the relevant `catalog.json` / `*.pack.json`
  (see [Content Creation Guide](CONTENT_CREATION_GUIDE.md)).
- **Fonts look plain:** expected in the offline production build — it uses the
  system font stack by design. You may self-host a font if you wish (see the
  Developer Guide).
