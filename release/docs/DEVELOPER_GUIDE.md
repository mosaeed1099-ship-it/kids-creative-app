# Developer Guide

Kids Creative Studio is a **static, no-build** web application written in modern,
dependency-free JavaScript using **native ES modules**. There is no bundler, no
transpiler, and no framework. If you can serve a folder over HTTP, you can run
and extend it.

## Principles

- **Additive, not invasive.** The app was built in strict phases; each phase adds
  new files and reuses earlier systems by *import only*. Follow the same rule:
  add modules, don't rewrite stable ones.
- **Data-driven content.** Features render content that lives as JSON + assets.
  Adding content is a data task, not a code task.
- **Offline & private by default.** No network calls except `fetch()` for local,
  same-origin content. No third-party scripts. No analytics.
- **Graceful degradation.** Storage, JSON parsing, and asset loading never crash
  the app; they fall back.

## Two engines

Everything sits on top of two reusable engines with clean public APIs.

**Canvas Engine** (`js/engine/`) — a facade `CanvasEngine` over scene objects,
layers, tools, plugins, commands, camera (zoom/pan/fit), history (undo/redo),
an image importer, and an exporter (`toDataURL`). Modules that draw (Coloring,
Trace, Creative Studio) use it through its barrel `js/engine/index.js`.

**Content Engine** (`js/content/`) — `ContentManager({base})` with
`init({catalog})`, `loadPack(id)`, `filter({...})`, `search(query)`,
`getContent(id)`, favorites and recents. Items are `ContentItem`s with
localized titles, tags, `assetType`, an `asset` pointer, and a free-form `data`
payload. Barrel: `js/content/index.js`.

Modules consume these engines; they never reach into engine internals.

## Module anatomy

A feature module (e.g. `js/modules/learning-activities/`) typically has:

- an `index.js` barrel exporting the public class,
- a controller class (`mount()`, teardown via `destroy()`),
- sub-components and a `ui/` folder,
- a `content/` folder with `catalog.json` + `*.pack.json` (+ assets),
- a matching stylesheet in `css/<module>.css`,
- an `examples/<module>.html` runnable demo,
- a `README.md`.

Modules build DOM with a small `h(tag, attrs, children)` helper (each module
ships its own), and persist state through the shared storage helpers.

## Running an example

```bash
python3 -m http.server 8000
# open http://localhost:8000/examples/learning-activities.html
```

Every module has a standalone example page that wires the Content Engine and the
module together — the fastest way to see and test a module in isolation.

## Production support layer (Phase 12, additive)

- `css/a11y.css` — global focus-visible, reduced-motion, touch targets, SR
  utilities, skip link. Include it **last**.
- `js/app/safe.js` — `safeParse`, `safeFetchJSON`, `storageAvailable`,
  `browserSupported`, `attachImageFallback`.
- `js/app/boot.js` — `safeBoot(mount, startFn)` wraps start-up with an
  unsupported-browser guard and a friendly error panel; `installGlobalHandlers()`
  logs uncaught errors/rejections.

These are **opt-in** and do not modify any existing module. Example of hardened
start-up on a page:

```html
<script type="module">
  import { safeBoot } from '../js/app/boot.js';
  import LearningActivities from '../js/modules/learning-activities/index.js';
  import { ContentManager } from '../js/content/index.js';

  safeBoot('#app', async (mount) => {
    const base = new URL('../js/modules/learning-activities/content/', location.href).href;
    const content = new ContentManager({ base });
    await content.init({ catalog: 'catalog.json' });
    await content.loadPack('activities');
    new LearningActivities({ mount, content }).mount();
  });
</script>
```

## Building a release

`tools/build.mjs` assembles a versioned `release/` tree (production / development
/ examples / docs / assets) without modifying any source. The production copy
strips the optional font CDN and injects the a11y/PWA/error-handling layer into
copied HTML only.

```bash
node tools/build.mjs
```

## Coding conventions

- ES modules only; no CommonJS, no globals (except intentional `window.__*`
  handles in examples for manual testing).
- Prefer `element.replaceChildren(...)` and the module's `h()` helper over
  `innerHTML` for dynamic content.
- Localize user-facing strings as `{ ar, en }` maps; the UI is Arabic-first RTL.
- Never introduce a runtime dependency or a network call to a third party.
- Persist through the shared storage helpers so blocked storage degrades safely.

## Optional: self-hosting a font

The production build uses the system font stack for offline purity. To self-host
a font, drop the font files under `assets/`, add an `@font-face` in a **new** CSS
file, and include it — without editing the frozen module styles.

## Optional: adding a service worker

For installable, cache-first offline delivery, add a service worker at deploy
time that precaches the app shell + content. This is a deployment enhancement;
the app already runs offline when files are present locally.
