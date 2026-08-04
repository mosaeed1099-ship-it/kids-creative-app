/**
 * ReleasePanel.js — the Publishing / Release Builder UI (Phase 17B). Collects a
 * version + notes, runs the pipeline, and shows validation, verification, the
 * ZIP check and the manifest, with downloads for the ZIP and every report.
 * Reuses the shared modal, buttons, toast and the release builder. Generates
 * only — never deploys.
 */
import { el, clear } from '../../../utils/dom.js';
import { btn } from './helpers.js';
import { downloadJSON, triggerDownload } from '../generate/generators.js';
import { fileStamp } from '../release/releaseBuilder.js';

const human = (b) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`);
const dlText = (name, text, mime = 'text/markdown') => triggerDownload(name, new Blob([text], { type: mime }));

export default class ReleasePanel {
  constructor(app) { this.app = app; }

  open() {
    this.body = el('div', { class: 'cms-release' });
    this.app.ui._modal('🚀 بناء إصدار الإنتاج', this.body);
    this._renderForm();
  }

  _renderForm() {
    let version = '1.0.0'; try { version = localStorage.getItem('kcs.cms.release.version') || version; } catch { /* */ }
    clear(this.body);
    const ver = el('input', { class: 'cms-input', attrs: { value: version, dir: 'ltr', placeholder: '1.0.0' } });
    const notes = el('textarea', { class: 'cms-input', attrs: { rows: '3', placeholder: 'ملاحظات الإصدار (اختياري)…', dir: 'rtl' } });
    const build = btn({ emoji: '🚀', label: 'بناء الإصدار', cls: 'cms-primary', onClick: () => this._run(ver.value.trim() || '1.0.0', notes.value) });
    this.body.append(
      el('p', { class: 'cms-mini', text: 'يتحقّق من المحتوى ثم يولّد حزمة إنتاج كاملة (release/ + production/) مع التقارير — دون نشر.' }),
      el('label', { class: 'cms-field' }, [el('span', { class: 'cms-flabel', text: 'رقم الإصدار' }), ver]),
      el('label', { class: 'cms-field' }, [el('span', { class: 'cms-flabel', text: 'ملاحظات' }), notes]),
      el('div', { class: 'cms-modal__foot' }, [build]),
    );
  }

  async _run(version, notes) {
    clear(this.body);
    this.body.append(el('p', { class: 'cms-mini', text: '⏳ جارٍ التحقق والبناء…' }));
    const res = await this.app.buildRelease({ version, notes });
    if (!res) { this._renderForm(); return; }
    this.result = res;
    this._renderResult();
  }

  _renderResult() {
    const res = this.result;
    clear(this.body);
    const ok = res.ok;
    this.body.append(el('div', { class: `cms-rel-status ${ok ? 'is-ok' : 'is-bad'}` }, [ok ? '✅ الإصدار جاهز للنشر' : '❌ الإصدار به مشكلات — راجع التقرير']));

    // three check groups
    this.body.append(this._group('🔎 التحقق المرجعي', [
      this._line(res.validation.valid, `الأخطاء: ${res.validation.errors.length}`),
      this._line(res.validation.warnings.length === 0, `تحذيرات: ${res.validation.warnings.length}`, true),
    ]));
    this.body.append(this._group('✔️ التحقق من المخرجات', res.verification.checks.map((c) => this._line(c.pass, `${c.name}${c.detail ? ` — ${c.detail}` : ''}`))));
    this.body.append(this._group('🗜️ التحقق من ZIP', [
      this._line(res.zipCheck.ok, `عدد الملفات: ${res.zipCheck.entries ?? '—'} / ${res.zipCheck.expected ?? '—'}`),
      this._line(!!res.zipCheck.allCrcOk, 'سلامة CRC لكل ملف'),
      this._line(!!res.zipCheck.manifestParses, 'البيان manifest.json صالح'),
    ]));

    // validation error/warning detail
    if (res.validation.errors.length) this.body.append(this._group('❌ الأخطاء', res.validation.errors.map((e) => el('div', { class: 'cms-diff-line is-del', text: `[${e.code}] ${e.message}` }))));
    if (res.validation.warnings.length) this.body.append(this._group('⚠️ تحذيرات', res.validation.warnings.map((w) => el('div', { class: 'cms-diff-line is-chg', text: `[${w.code}] ${w.message}` }))));

    // manifest summary
    const m = res.manifest;
    this.body.append(this._group('📦 المحتوى', [
      el('div', { class: 'cms-mini', text: `الإصدار v${m.version} · حزم ${m.counts.packs} · عناصر ${m.counts.items} · تصنيفات ${m.counts.categories} · أصول منسوخة ${res.assetCount} (${human(m.assets.bytes)})` }),
      el('div', { class: 'cms-rel-files' }, m.files.map((f) => el('div', { class: 'cms-mini', text: `${f.path} — ${f.items} عنصر · ${human(f.bytes)}` }))),
    ]));

    // downloads
    this.body.append(el('div', { class: 'cms-modal__foot cms-rel-actions' }, [
      btn({ emoji: '⬇️', label: 'تنزيل حزمة الإنتاج (ZIP)', cls: 'cms-primary', onClick: () => this.app.downloadRelease(res) }),
      btn({ emoji: '📄', label: 'التقرير', onClick: () => dlText(`RELEASE_REPORT-v${res.version}.md`, res.report) }),
      btn({ emoji: '📝', label: 'ملاحظات الإصدار', onClick: () => dlText(`RELEASE_NOTES-v${res.version}.md`, res.releaseNotes) }),
      btn({ emoji: '📜', label: 'سجل التغييرات', onClick: () => dlText(`CHANGELOG-v${res.version}.md`, res.changelog) }),
      btn({ emoji: '🧾', label: 'البيان', onClick: () => downloadJSON(`manifest-v${res.version}.json`, res.manifest) }),
      btn({ label: 'بناء آخر', onClick: () => this._renderForm() }),
    ]));
  }

  _group(title, rows) { return el('div', { class: 'cms-rel-group' }, [el('h4', { text: title }), ...rows]); }
  _line(pass, text, warn = false) { return el('div', { class: `cms-rel-line ${pass ? 'is-pass' : warn ? 'is-warn' : 'is-fail'}`, text: `${pass ? '✅' : warn ? '⚠️' : '❌'} ${text}` }); }
}
