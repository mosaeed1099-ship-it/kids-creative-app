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
import VersionManager from './history/VersionManager.js';
import UndoManager from './history/UndoManager.js';
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
    let author = 'المحرر'; try { author = localStorage.getItem('kcs.cms.author') || author; } catch { /* ignore */ }
    this.store.author = author;
    await initAssetStore();                     // open IndexedDB (graceful if unavailable)

    // 17A.2 — history & undo infrastructure (must exist before any commit)
    this.undoMgr = new UndoManager(this.store);
    this.vm = new VersionManager(this.store, { author });

    this.ui = new AdminUI(this);
    this.root = this.ui.build();
    document.body.appendChild(this.root);
    this._off = this.store.on(() => this.ui.refresh());
    this._offUndo = this.undoMgr.on(() => this.ui.syncUndo());
    document.addEventListener('keydown', this._onKey = (e) => this._handleKey(e));
    this.selectSection(this.sectionId);
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('e2e')) window.__cms = this;

    await this.vm.init();                        // opens the version store + baseline snapshot

    // C2 migration — move any legacy inline assets into IndexedDB (shrinks the blob)
    try { const moved = await migrateInlineAssets(this.store); if (moved) { this.ui.toast(`تم نقل ${moved} ملفًا إلى تخزين آمن 🔒`); this.ui.refresh(); } }
    catch (e) { console.error('[CMS] migrate', e); }
    return this;
  }

  _handleKey(e) {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); }
    else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); this.redo(); }
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
    if (!(await this.ui.confirm({ title: 'نقل إلى السلة', message: 'سيُنقل هذا العنصر إلى سلة المحذوفات — يمكنك استعادته لاحقًا أو التراجع فورًا.', confirmLabel: 'نقل إلى السلة' }))) return;
    if (this.store.remove(section.coll, id)) this.ui.toast('نُقل إلى السلة 🗑️ — تراجع بـ Ctrl+Z');
  }
  async bulkDelete(section, ids, onDone) {
    if (!(await this.ui.confirm({ title: 'نقل متعدد إلى السلة', message: `سيُنقل ${ids.length} عنصرًا إلى سلة المحذوفات. يمكنك استعادتها لاحقًا.`, confirmLabel: 'نقل إلى السلة' }))) return;
    if (this.store.bulkRemove(section.coll, ids)) { onDone && onDone(); this.ui.toast(`نُقل ${ids.length} عنصرًا إلى السلة 🗑️`); }
  }
  bulkMove(section, ids, patch) { if (this.store.bulkUpdate(section.coll, ids, patch)) this.ui.toast(`تم نقل ${ids.length} عنصرًا`); }
  reorder(section, ids) { this.store.reorder(section.coll, ids); }
  preview(section, o) { this.ui.preview(section, o); }

  // ---- undo / redo (17A.2) ----
  undo() { this.vm.suspend = true; const ok = this.undoMgr.undoOp(); this.vm.suspend = false; if (ok) { this.ui.clearError(); this.ui.toast('تم التراجع ↶'); } else this.ui.toast('لا شيء للتراجع عنه'); this.ui.syncUndo(); }
  redo() { this.vm.suspend = true; const ok = this.undoMgr.redoOp(); this.vm.suspend = false; if (ok) { this.ui.clearError(); this.ui.toast('تمت الإعادة ↷'); } else this.ui.toast('لا شيء للإعادة'); this.ui.syncUndo(); }

  // ---- versions / history (17A.2) ----
  async createVersion(note) { await this.vm.create({ kind: 'manual', note: note || 'إصدار يدوي' }); this.ui.toast('تم حفظ الإصدار 🔖'); }
  async restoreVersion(id) {
    if (!(await this.ui.confirm({ title: 'استعادة إصدار', message: 'سيُستبدل المحتوى الحالي بهذا الإصدار. يمكنك التراجع بعدها (Ctrl+Z).', confirmLabel: 'استعادة' }))) return;
    if (await this.vm.restore(id)) { this.ui.clearError(); this.ui.toast('تمت الاستعادة 🕘'); this.ui.setSection(this.section); }
  }
  async deleteVersion(id) {
    if (!(await this.ui.confirm({ title: 'حذف إصدار', message: 'حذف هذا الإصدار من السجل؟', confirmLabel: 'حذف', danger: true }))) return;
    await this.vm.remove(id); this.ui.toast('تم حذف الإصدار');
  }

  // ---- trash (17A.2) ----
  restoreTrash(trashId) { if (this.store.restoreFromTrash(trashId)) { this.ui.clearError(); this.ui.toast('تمت الاستعادة من السلة ♻️'); } }
  async purgeTrash(trashId) {
    if (!(await this.ui.confirm({ title: 'حذف نهائي', message: 'حذف هذا العنصر نهائيًا من السلة؟', confirmLabel: 'حذف نهائي', danger: true }))) return;
    if (this.store.purge(trashId)) this.ui.toast('تم الحذف النهائي');
  }
  async emptyTrash() {
    if (!(await this.ui.confirm({ title: 'إفراغ السلة', message: 'حذف كل عناصر السلة نهائيًا؟', note: 'اكتب كلمة التأكيد للمتابعة.', confirmLabel: 'إفراغ', danger: true, requireText: 'إفراغ' }))) return;
    if (this.store.emptyTrash()) this.ui.toast('تم إفراغ السلة');
  }

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
    this._offUndo && this._offUndo();
    this._onKey && document.removeEventListener('keydown', this._onKey);
    this.undoMgr && this.undoMgr.destroy();
    this.vm && this.vm.destroy();
    if (this.root?.parentNode) this.root.remove();
    if (this._cssLink?.parentNode) this._cssLink.remove();
  }
}
