/**
 * AdminCMSApp.js — the Content Management System controller.
 *
 * A fully offline content editor (no backend/API/database) that manages Packs,
 * Coloring pages, Stickers, Puzzle images, Stories, Learning Activities, PDFs,
 * Categories and Assets, and generates the project's data files. Reuses the
 * Content Engine (models) and the app's UI helpers; every editor lives in its
 * own file and the list/form logic is generic (no duplicated logic).
 *
 * Phase 17A.1 (reliability & data safety):
 *   C1 — persistence is verified; failures roll back and raise a persistent error.
 *   C2 — binary assets live in IndexedDB; this migrates any legacy inline assets.
 *   C3 — full backup / restore, and a safe (auto-backed-up) clear-all.
 *   C4 — a complete deploy package (ZIP) can be generated.
 */
import { el } from '../../utils/dom.js';
import CmsStore from './store/CmsStore.js';
import { SECTIONS, sectionById } from './store/schema.js';
import { importExistingContent } from './store/seed.js';
import { initAssetStore, migrateInlineAssets, assetStore, assetStoreReady } from './io/assets.js';
import { exportBackup as makeBackup, importBackup as restoreBackup } from './store/backup.js';
import { downloadDeployPackage } from './generate/deployPackage.js';
import { downloadJSON } from './generate/generators.js';
import AdminUI from './ui/AdminUI.js';

const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

export default class AdminCMSApp {
  constructor({ mount, ctx = {} } = {}) {
    this.mountEl = typeof mount === 'string' ? document.querySelector(mount) : mount;
    this.ctx = ctx;
    this.sectionId = SECTIONS[0].id;
  }

  async mount() {
    this._injectCss();
    this.store = new CmsStore();
    this._offErr = this.store.onPersistError((info) => this._onPersistError(info));
    await initAssetStore();                     // open IndexedDB (graceful if unavailable)
    this.ui = new AdminUI(this);
    this.root = this.ui.build();
    document.body.appendChild(this.root);
    this._off = this.store.on(() => this.ui.refresh());
    this.selectSection(this.sectionId);
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('e2e')) window.__cms = this;

    // C2 migration — move any legacy inline assets into IndexedDB (shrinks the blob)
    try { const moved = await migrateInlineAssets(this.store); if (moved) { this.ui.toast(`تم نقل ${moved} ملفًا إلى تخزين آمن 🔒`); this.ui.refresh(); } }
    catch (e) { console.error('[CMS] migrate', e); }
    return this;
  }

  get section() { return sectionById(this.sectionId); }
  selectSection(id) { this.sectionId = id; this.ui.setSection(this.section); }

  _onPersistError(info) {
    this.ui.setError(`تعذّر الحفظ — مساحة التخزين ممتلئة (${info.human} / ${info.budgetHuman}). لم تُحفظ آخر عملية. صدّر نسخة احتياطية ثم احذف بعض العناصر أو انقل الوسائط.`);
  }

  // ---- entity CRUD (generic, driven by section config) ----
  saveEntity(section, values, id) {
    const ok = id ? this.store.update(section.coll, id, values) : this.store.create(section.coll, { ...section.defaults(), ...values });
    if (!ok) return;                             // persistence failed → error bar already shown (C1)
    this.ui.clearError();
    this.ui.toast(id ? 'تم التعديل ✅' : 'تمت الإضافة ✅');
    this.ui.setSection(this.section);
  }
  openForm(section, obj) { this.ui.openForm(section, obj); }
  duplicateEntity(section, id) { if (this.store.duplicate(section.coll, id)) { this.ui.clearError(); this.ui.toast('تم التكرار 📑'); } }

  async deleteEntity(section, id) {
    if (!(await this.ui.confirm({ title: 'حذف عنصر', message: 'هل تريد حذف هذا العنصر؟ لا يمكن التراجع.', confirmLabel: 'حذف', danger: true }))) return;
    if (this.store.remove(section.coll, id)) this.ui.toast('تم الحذف 🗑️');
  }
  async bulkDelete(section, ids, onDone) {
    if (!(await this.ui.confirm({ title: 'حذف متعدد', message: `هل تريد حذف ${ids.length} عنصرًا؟ لا يمكن التراجع.`, confirmLabel: 'حذف الكل', danger: true }))) return;
    if (this.store.bulkRemove(section.coll, ids)) { onDone && onDone(); this.ui.toast(`تم حذف ${ids.length} عنصرًا`); }
  }
  bulkMove(section, ids, patch) { if (this.store.bulkUpdate(section.coll, ids, patch)) this.ui.toast(`تم نقل ${ids.length} عنصرًا`); }
  reorder(section, ids) { this.store.reorder(section.coll, ids); }
  preview(section, o) { this.ui.preview(section, o); }

  // ---- backup / restore (C3) ----
  async exportBackup() {
    try { const data = await makeBackup(this.store); downloadJSON(`kcs-cms-backup-${stamp()}.json`, data); this.ui.toast('تم تصدير النسخة الاحتياطية 💾'); }
    catch (e) { console.error('[CMS] export backup', e); this.ui.toast('تعذّر التصدير'); }
  }
  async importBackupFile(file) {
    try {
      const data = JSON.parse(await file.text());
      const r = await restoreBackup(this.store, data);
      this.ui.clearError();
      this.ui.toast(`تم الاستعادة (${r.items} عنصر، ${r.assets} ملف) ✅`);
      this.ui.setSection(this.section);
    } catch (e) { console.error('[CMS] import backup', e); this.ui.toast('نسخة احتياطية غير صالحة'); }
  }

  // ---- deploy package (C4) ----
  async buildDeploy() {
    try { const m = await downloadDeployPackage(this.store); this.ui.toast(`تم توليد حزمة النشر 📦 (${m.files.length} ملف بيانات)`); }
    catch (e) { console.error('[CMS] deploy package', e); this.ui.toast('تعذّر توليد حزمة النشر'); }
  }

  // ---- seed / clear ----
  async importExisting() {
    this.ui.toast('جارٍ الاستيراد…');
    try { const n = await importExistingContent(this.store); await migrateInlineAssets(this.store); this.ui.clearError(); this.ui.toast(`تم استيراد ${n} عنصرًا 📥`); this.ui.setSection(this.section); }
    catch (e) { console.error('[CMS] import', e); this.ui.toast('تعذّر الاستيراد'); }
  }
  async clearAll() {
    const ok = await this.ui.confirm({
      title: 'مسح كل البيانات', message: 'سيُحذف كل المحتوى نهائيًا. سنحفظ لك نسخة احتياطية أولًا.',
      note: 'اكتب كلمة التأكيد للمتابعة.', confirmLabel: 'مسح الكل', danger: true, requireText: 'مسح',
    });
    if (!ok) return;
    await this.exportBackup();                   // auto-backup before wiping (C3)
    if (assetStoreReady()) { try { await assetStore().clear(); } catch (e) { console.error('[CMS] clear assets', e); } }
    if (this.store.clearAll()) { this.ui.clearError(); this.ui.toast('تم المسح (بعد حفظ نسخة احتياطية)'); this.ui.setSection(this.section); }
  }

  _injectCss() {
    const id = 'cms-styles'; if (document.getElementById(id)) return;
    this._cssLink = el('link', { id, attrs: { rel: 'stylesheet', href: new URL('./styles/admin-cms.css', import.meta.url).href } });
    document.head.appendChild(this._cssLink);
  }
  destroy() {
    this._off && this._off();
    this._offErr && this._offErr();
    if (this.root?.parentNode) this.root.remove();
    if (this._cssLink?.parentNode) this._cssLink.remove();
  }
}
