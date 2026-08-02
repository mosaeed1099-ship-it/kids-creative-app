/**
 * deployPackage.js — build a complete, deployable package (Phase 17A.1, C4).
 *
 * Closes the publishing gap: the CMS now emits a single ZIP that contains every
 * file a deploy needs — the generated data JSON, a manifest, and Cloudflare
 * Pages `_headers` / `_redirects` — laid out under both `release/` and
 * `production/`. It does NOT deploy; it only produces the package to download.
 */
import { generateAll, triggerDownload } from './generators.js';
import { zipSync } from './zip.js';

const HEADERS = `# Cloudflare Pages — security + caching headers
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()

/*.json
  Cache-Control: public, max-age=3600

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;

const REDIRECTS = `# SPA fallback — the app is hash-routed, this keeps deep links safe
/*    /index.html    200
`;

const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

/**
 * @returns {Promise<{ blob:Blob, manifest:object, dataFiles:object, fileList:string[] }>}
 */
export async function buildDeployPackage(store) {
  const g = await generateAll(store);
  // Map generator output to the requested deploy filenames (story → stories).
  const dataFiles = {
    'catalog.json': g['catalog.json'],
    'packs.json': g['packs.json'],
    'stickers.json': g['stickers.json'],
    'activities.json': g['activities.json'],
    'stories.json': g['story.json'],
  };

  const count = (o) => (Array.isArray(o) ? o.length : Array.isArray(o?.items) ? o.items.length : Array.isArray(o?.packs) ? o.packs.length : 0);
  const manifest = {
    name: 'kids-creative-studio',
    generator: 'kcs-cms',
    generatedAt: new Date().toISOString(),
    version: 1,
    deploy: { platform: 'cloudflare-pages', dataDir: '/', includes: ['release/', 'production/'] },
    files: Object.entries(dataFiles).map(([name, obj]) => ({ path: name, items: count(obj), bytes: JSON.stringify(obj).length })),
    totals: store.stats(),
  };

  const files = [];
  const addJson = (path, obj) => files.push({ name: path, data: JSON.stringify(obj, null, 2) });
  const addText = (path, txt) => files.push({ name: path, data: txt });

  // Root of the package
  addJson('manifest.json', manifest);
  for (const [n, o] of Object.entries(dataFiles)) addJson(n, o);
  addText('_headers', HEADERS);
  addText('_redirects', REDIRECTS);
  addText('README.txt', readme(manifest));

  // release/ and production/ (identical deploy-ready copies)
  for (const dir of ['release', 'production']) {
    addJson(`${dir}/manifest.json`, manifest);
    for (const [n, o] of Object.entries(dataFiles)) addJson(`${dir}/${n}`, o);
    addText(`${dir}/_headers`, HEADERS);
    addText(`${dir}/_redirects`, REDIRECTS);
  }

  return { blob: zipSync(files), manifest, dataFiles, fileList: files.map((f) => f.name) };
}

export async function downloadDeployPackage(store) {
  const { blob, manifest } = await buildDeployPackage(store);
  triggerDownload(`kcs-deploy-${stamp()}.zip`, blob);
  return manifest;
}

function readme(m) {
  return [
    'Kids Creative Studio — deploy package',
    `Generated: ${m.generatedAt}`,
    '',
    'Contents:',
    '  manifest.json            package manifest (files, counts, totals)',
    '  *.json                   generated content data files',
    '  _headers / _redirects    Cloudflare Pages configuration',
    '  release/  production/     deploy-ready copies of the above',
    '',
    'This package contains data + deploy config only. It does not deploy itself.',
    'Drop the data files into the project data directory and publish as usual.',
  ].join('\n');
}
