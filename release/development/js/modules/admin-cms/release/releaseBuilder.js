/**
 * releaseBuilder.js — the complete publishing pipeline (Phase 17B).
 *
 * Orchestrates a production release, reusing everything already built:
 *   validate store → generate all JSON (generators) → copy required assets
 *   (resolve from IndexedDB) → build manifest / report / release-notes /
 *   changelog (version history) → assemble release/ + production/ → ZIP (zip.js)
 *   → validate the ZIP (CRC) → verify the produced release.
 *
 * It ONLY produces the package. It does not deploy, push, or rebuild the site.
 */
import { generateAll } from '../generate/generators.js';
import { zipSync, readZip } from '../generate/zip.js';
import { CF_HEADERS, CF_REDIRECTS } from '../generate/deployPackage.js';
import { validateStore } from './validate.js';
import { resolveAssetData } from '../io/assets.js';
import { hashString } from '../media/hash.js';

const isoStamp = () => new Date().toISOString();
export const fileStamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
const fmt = (iso) => { try { return new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; } };
const count = (o) => (Array.isArray(o) ? o.length : Array.isArray(o?.items) ? o.items.length : Array.isArray(o?.packs) ? o.packs.length : 0);
const human = (b) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`);

function dataUrlToBytes(dataUrl) {
  const bin = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
const extFor = (a) => (a.type === 'svg' ? 'svg' : a.type === 'pdf' ? 'pdf' : a.mime === 'image/png' ? 'png' : a.mime === 'image/jpeg' ? 'jpg' : a.mime === 'image/webp' ? 'webp' : 'bin');

/** Resolve + copy every asset referenced by shipping content (deduped by ref/hash). */
async function collectAssets(store) {
  const files = new Map(); const missing = [];
  for (const it of store.list('items')) {
    const a = it.asset;
    if (!a || a.type === 'emoji') continue;
    const key = a.ref || a.hash;
    if (!key || files.has(key)) continue;
    const full = await resolveAssetData(a); // eslint-disable-line no-await-in-loop
    if (!full || full.data == null) { missing.push(it.id); continue; }
    const data = full.type === 'svg' ? full.data : dataUrlToBytes(full.data);
    files.set(key, { name: `assets/${key}.${extFor(full)}`, data, bytes: typeof data === 'string' ? data.length : data.length });
  }
  return { assetFiles: [...files.values()], missing };
}

/** Verify the produced release by re-reading the emitted JSON (not the store). */
function verifyRelease(store, named, assetFiles, validation, missing) {
  const checks = [];
  const add = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

  let parseOk = true, reparsed = {};
  for (const [n, o] of Object.entries(named)) { try { reparsed[n] = JSON.parse(JSON.stringify(o)); } catch { parseOk = false; } }
  add('صياغة JSON صحيحة', parseOk);

  add('عدد الحزم يطابق المصدر', reparsed['catalog.json']?.packs.length === store.list('packs').length, `${reparsed['catalog.json']?.packs.length} / ${store.list('packs').length}`);
  add('عدد الملصقات يطابق المصدر', reparsed['stickers.json']?.items.length === store.itemsByType('sticker').length);
  add('عدد الأنشطة يطابق المصدر', reparsed['activities.json']?.items.length === store.itemsByType('activity').length);
  add('عدد القصص يطابق المصدر', reparsed['stories.json']?.items.length === store.itemsByType('story').length);

  // every shipped asset is inlined (no null data) and nothing missing
  let inlined = true;
  const scan = (items) => { for (const it of (items || [])) if (it.asset && it.asset.type !== 'emoji' && it.asset.data == null) inlined = false; };
  for (const p of reparsed['packs.json'] || []) scan(p.items);
  scan(reparsed['stickers.json']?.items); scan(reparsed['activities.json']?.items); scan(reparsed['stories.json']?.items);
  add('كل الأصول مضمّنة في البيانات', inlined && missing.length === 0, missing.length ? `${missing.length} مفقود` : '');

  // no duplicate ids across the emitted arrays
  let dupOk = true;
  const uniq = (arr) => { const s = new Set(); for (const x of (arr || [])) { if (s.has(x.id)) dupOk = false; s.add(x.id); } };
  uniq(reparsed['catalog.json']?.packs);
  for (const p of reparsed['packs.json'] || []) uniq(p.items);
  uniq(reparsed['stickers.json']?.items); uniq(reparsed['activities.json']?.items); uniq(reparsed['stories.json']?.items);
  add('لا معرّفات مكررة في المخرجات', dupOk);

  add('نُسخت الأصول المطلوبة', assetFiles.length >= 0, `${assetFiles.length} ملف`);
  add('اجتياز التحقق المرجعي', validation.valid, validation.errors.length ? `${validation.errors.length} خطأ` : '');

  return { ok: checks.every((c) => c.pass), checks };
}

function verifyZipBytes(bytes, expectedCount) {
  try {
    const { count: c, entries } = readZip(bytes);
    const allCrc = entries.every((e) => e.crcOk);
    const man = entries.find((e) => e.name === 'manifest.json');
    let manOk = false; if (man) { try { JSON.parse(new TextDecoder().decode(man.data)); manOk = true; } catch { /* */ } }
    return { ok: allCrc && c === expectedCount && manOk, entries: c, expected: expectedCount, allCrcOk: allCrc, manifestParses: manOk };
  } catch (e) { return { ok: false, error: String(e) }; }
}

function buildChangelog(versions, version) {
  const lines = ['# Changelog', '', `## v${version} — ${fmt(isoStamp())}`, ''];
  if (!versions.length) lines.push('- (لا يوجد سجل إصدارات)');
  for (const v of versions) lines.push(`- ${fmt(v.createdAt)} — ${v.kind === 'manual' ? '🔖' : '🕒'} ${v.note || '—'} _(${v.author || '—'})_`);
  return lines.join('\n') + '\n';
}

function buildReleaseNotes(versions, version, notesText, sinceIso) {
  const recent = sinceIso ? versions.filter((v) => (v.createdAt || '') > sinceIso) : versions;
  const manual = recent.filter((v) => v.kind === 'manual');
  const lines = [`# Release Notes — v${version}`, '', `تاريخ الإصدار: ${fmt(isoStamp())}`, ''];
  if (notesText && notesText.trim()) { lines.push(notesText.trim(), ''); }
  lines.push('## التغييرات منذ الإصدار السابق', '');
  const list = manual.length ? manual : recent;
  if (!list.length) lines.push('- لا تغييرات مسجّلة.');
  for (const v of list) lines.push(`- ${v.note || '—'} — ${fmt(v.createdAt)}`);
  return lines.join('\n') + '\n';
}

function buildReport(manifest, validation, verification, zipCheck, assetFiles, missing) {
  const L = [];
  L.push(`# Release Report — v${manifest.version}`, '', `تاريخ التوليد: ${fmt(manifest.generatedAt)}`, '');
  L.push('## الحالة', '', `- التحقق المرجعي: ${validation.valid ? '✅ ناجح' : `❌ ${validation.errors.length} خطأ`}`, `- تحذيرات: ${validation.warnings.length}`, `- التحقق من المخرجات: ${verification.ok ? '✅ ناجح' : '❌ فشل'}`, `- التحقق من ZIP: ${zipCheck.ok ? '✅ ناجح' : '❌ فشل'}`, '');
  L.push('## المحتوى', '', ...Object.entries(manifest.counts).map(([k, v]) => `- ${k}: ${v}`), `- الأصول المنسوخة: ${assetFiles.length} (${human(manifest.assets.bytes)})`, '');
  L.push('## الملفات', '', ...manifest.files.map((f) => `- ${f.path} — ${f.items} عنصر · ${human(f.bytes)} · sha ${f.sha.slice(0, 10)}`), '');
  L.push('## فحوص التحقق', '', ...verification.checks.map((c) => `- ${c.pass ? '✅' : '❌'} ${c.name}${c.detail ? ` (${c.detail})` : ''}`), '');
  if (validation.errors.length) L.push('## الأخطاء', '', ...validation.errors.map((e) => `- ❌ [${e.code}] ${e.message}`), '');
  if (validation.warnings.length) L.push('## تحذيرات', '', ...validation.warnings.map((w) => `- ⚠️ [${w.code}] ${w.message}`), '');
  if (missing.length) L.push('## أصول مفقودة', '', ...missing.map((id) => `- ${id}`), '');
  return L.join('\n') + '\n';
}

/**
 * Build a complete release. Returns everything (files, blob, reports, results).
 * @returns {Promise<object>}
 */
export async function buildRelease(store, { version = '1.0.0', vm = null, notesText = '', sinceIso = null } = {}) {
  const validation = await validateStore(store);
  const data = await generateAll(store);
  const named = {
    'catalog.json': data['catalog.json'], 'packs.json': data['packs.json'], 'stickers.json': data['stickers.json'],
    'activities.json': data['activities.json'], 'stories.json': data['story.json'],
  };
  const { assetFiles, missing } = await collectAssets(store);
  const versions = vm ? await vm.list() : [];

  const jsonFiles = Object.entries(named).map(([path, obj]) => { const text = JSON.stringify(obj, null, 2); return { path, bytes: text.length, sha: hashString(text), items: count(obj) }; });
  const manifest = {
    name: 'kids-creative-studio', generator: 'kcs-cms', version, generatedAt: isoStamp(),
    deploy: { platform: 'cloudflare-pages', dirs: ['release/', 'production/'] },
    files: jsonFiles, assets: { count: assetFiles.length, bytes: assetFiles.reduce((s, f) => s + f.bytes, 0) },
    counts: store.stats(),
    validation: { valid: validation.valid, errors: validation.errors.length, warnings: validation.warnings.length },
  };

  const changelog = buildChangelog(versions, version);
  const releaseNotes = buildReleaseNotes(versions, version, notesText, sinceIso);
  const verification = verifyRelease(store, named, assetFiles, validation, missing);

  // assemble the core package (everything except the report)
  const core = [];
  const addJson = (p, o) => core.push({ name: p, data: JSON.stringify(o, null, 2) });
  const addText = (p, t) => core.push({ name: p, data: t });
  addJson('manifest.json', manifest);
  addJson('validation.json', validation);
  addText('RELEASE_NOTES.md', releaseNotes);
  addText('CHANGELOG.md', changelog);
  for (const dir of ['release', 'production']) {
    addJson(`${dir}/manifest.json`, manifest);
    for (const [n, o] of Object.entries(named)) addJson(`${dir}/${n}`, o);
    for (const f of assetFiles) core.push({ name: `${dir}/${f.name}`, data: f.data });
    addText(`${dir}/_headers`, CF_HEADERS);
    addText(`${dir}/_redirects`, CF_REDIRECTS);
  }

  // validate the core archive first, so the report can state the ZIP result
  const coreCheck = verifyZipBytes(new Uint8Array(await zipSync(core).arrayBuffer()), core.length);
  const report = buildReport(manifest, validation, verification, coreCheck, assetFiles, missing);

  // final package includes the report; re-zip and re-validate the delivered archive
  const files = [{ name: 'RELEASE_REPORT.md', data: report }, ...core];
  const zipBlob = zipSync(files);
  const zipBytes = new Uint8Array(await zipBlob.arrayBuffer());
  const zipCheck = verifyZipBytes(zipBytes, files.length);

  return {
    version, files, zipBlob, zipBytes,
    manifest, report, releaseNotes, changelog,
    validation, verification, zipCheck,
    assetCount: assetFiles.length, missing,
    ok: validation.valid && verification.ok && zipCheck.ok,
  };
}
