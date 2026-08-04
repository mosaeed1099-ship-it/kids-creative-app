/**
 * build.mjs — Phase 12 (RC1) release assembler. NEW, ADDITIVE, non-destructive.
 *
 * Produces a versioned `release/` tree WITHOUT modifying any source file:
 *
 *   release/
 *     production/   deployable, offline-hardened app (no font CDN, +a11y, +PWA)
 *     development/   full source + tools + content generators
 *     examples/      standalone demo pages (copy of production/examples)
 *     docs/          all guides + reports + checklist
 *     assets/        brand assets (favicon / icon / manifest)
 *     README.md
 *
 * The ONLY transforms are applied to COPIES of .html files in production/ and
 * examples/: remove the optional Google-Fonts links (so the build is 100%
 * self-contained) and inject the a11y stylesheet, favicon, manifest and a
 * global error handler. Source HTML is never touched.
 *
 * Run:  node tools/build.mjs
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'release');

const APP_ITEMS = ['index.html', 'manifest.webmanifest', 'README.md', 'VERSION',
  'package.json', 'CHANGELOG.md', 'css', 'js', 'assets', 'examples'];
const DEV_EXTRA = ['tools'];
// NOTE: match only these basenames when they are NOT part of the app source.
// 'release' is intentionally NOT here — the top-level release/ output is never
// a source APP_ITEM, and excluding the name would wrongly drop nested source
// folders such as js/modules/admin-cms/release/.
const EXCLUDE = new Set(['node_modules', '.git', '.DS_Store']);

async function version() {
  try { return (await fs.readFile(path.join(ROOT, 'VERSION'), 'utf8')).trim(); } catch { return '1.0.0'; }
}

async function copy(src, dst) {
  await fs.cp(src, dst, {
    recursive: true,
    filter: (s) => !EXCLUDE.has(path.basename(s)),
  });
}

/** Inject offline/a11y/PWA hardening into a COPIED html file. */
async function harden(file, prefix) {
  let html = await fs.readFile(file, 'utf8');
  // 1) drop optional external font links (offline self-containment)
  html = html.split('\n').filter((l) => !/fonts\.(googleapis|gstatic)\.com/.test(l)).join('\n');
  // 2) build the injection block
  const inject = [
    `<link rel="icon" type="image/svg+xml" href="${prefix}assets/favicon.svg" />`,
    `<link rel="manifest" href="${prefix}manifest.webmanifest" />`,
    `<meta name="theme-color" content="#5b6bff" />`,
    `<link rel="stylesheet" href="${prefix}css/a11y.css" />`,
    `<script type="module">import("${prefix || './'}js/app/boot.js").then(m=>m.installGlobalHandlers&&m.installGlobalHandlers()).catch(()=>{});</script>`,
  ].join('\n  ');
  if (!html.includes('css/a11y.css')) {
    html = html.replace(/<\/head>/i, `  ${inject}\n</head>`);
  }
  // 3) add a skip link right after <body> if there's an #app
  if (/<div id="app"/.test(html) && !html.includes('skip-link')) {
    html = html.replace(/<body[^>]*>/i, (m) => `${m}\n  <a class="skip-link" href="#app">تخطَّ إلى المحتوى</a>`);
  }
  await fs.writeFile(file, html);
}

async function hardenTree(dir, rootDir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await hardenTree(full, rootDir);
    else if (e.name.endsWith('.html')) {
      const depth = path.relative(rootDir, full).split(path.sep).length - 1;
      await harden(full, '../'.repeat(depth));
    }
  }
}

async function main() {
  const v = await version();
  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(OUT, { recursive: true });

  // ---- production ----
  const prod = path.join(OUT, 'production');
  await fs.mkdir(prod, { recursive: true });
  for (const item of APP_ITEMS) {
    const s = path.join(ROOT, item);
    try { await fs.access(s); await copy(s, path.join(prod, item)); } catch { /* optional */ }
  }
  await hardenTree(prod, prod);

  // ---- development (full source, untouched, + tools) ----
  const dev = path.join(OUT, 'development');
  await fs.mkdir(dev, { recursive: true });
  for (const item of [...APP_ITEMS, ...DEV_EXTRA]) {
    const s = path.join(ROOT, item);
    try { await fs.access(s); await copy(s, path.join(dev, item)); } catch { /* optional */ }
  }

  // ---- examples (standalone, hardened copy) ----
  await copy(path.join(prod, 'examples'), path.join(OUT, 'examples'));

  // ---- docs ----
  try { await copy(path.join(ROOT, 'docs'), path.join(OUT, 'docs')); } catch { /* built separately */ }

  // ---- assets (convenience copy) ----
  try { await copy(path.join(ROOT, 'assets'), path.join(OUT, 'assets')); } catch {}

  // ---- release README ----
  await fs.writeFile(path.join(OUT, 'README.md'),
`# Kids Creative Studio — Release ${v}

This folder is a versioned, ready-to-ship build. Nothing here requires a
bundler, a server-side runtime, or an Internet connection.

\`\`\`
release/
  production/   → deploy THIS folder (Cloudflare Pages / GitHub Pages / Netlify)
  development/   → full source + tools + content generators
  examples/      → standalone demo pages for each module
  docs/          → user, admin, developer & content guides + release checklist
  assets/        → brand icons / favicon / PWA manifest
\`\`\`

## Deploy (production/)
Upload the \`production/\` folder as-is to any static host, or run locally:

\`\`\`bash
cd production && python3 -m http.server 8000   # open http://localhost:8000
\`\`\`

The production build is offline-first: the optional web font is removed and the
app falls back to the system font stack, so it works with no network at all.

Version ${v} · Kids Creative Studio
`);

  // simple manifest of what was built
  console.log('Built release', v, 'at', OUT);
}

main().catch((e) => { console.error(e); process.exit(1); });
