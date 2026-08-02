/**
 * AdminCMSApp.js — the Content Management System controller.
 *
 * A fully offline content editor (no backend/API/database — localStorage only)
 * that manages Packs, Coloring pages, Stickers, Puzzle images, Stories, Learning
 * Activities, PDFs, Categories and Assets, and generates the project's data
 * files (catalog/packs/stickers/activities/story). Reuses the Content Engine
 * (models) and the app's UI helpers; every editor lives in its own file and the
 * list/form logic is generic (no duplicated logic).
 */
import { el } from '../../utils/dom.js';
import CmsStore from './store/CmsStore.js';
import { SECTIONS, sectionById } from './store/schema.js';
import { importExistingContent } from './store/seed.js';
import AdminUI from './ui/AdminUI.js';

export default class AdminCMSApp {
  constructor({ mount, ctx = {} } = {}) {
    this.mountEl = typeof mount === 'string' ? document.querySelector(mount) : mount;
    this.ctx = ctx;
    this.sectionId = SECTIONS[0].id;
  }

  mount() {
    this._injectCss();
    this.store = new CmsStore();
    this.ui = new AdminUI(this);
    this.root = this.ui.build();
    document.body.appendChild(this.root);
    this._off = this.store.on(() => this.ui.refresh());
    this.selectSection(this.sectionId);
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('e2e')) window.__cms = this;
    return this;
  }

  get section() { return sectionById(this.sectionId); }

  selectSection(id) { this.sectionId = id; this.ui.setSection(this.section); }

  // ---- entity CRUD (generic, driven by section config) ----
  saveEntity(section, values, id) {
    if (id) this.store.update(section.coll, id, values);
    else this.store.create(section.coll, { ...section.defaults(), ...values });
    this.ui.toast(id ? 'تم التعديل ✅' : 'تمت الإضافة ✅');
    this.ui.setSection(this.section);
  }
  openForm(section, obj) { this.ui.openForm(section, obj); }
  duplicateEntity(section, id) { this.store.duplicate(section.coll, id); this.ui.toast('تم التكرار 📑'); }
  deleteEntity(section, id) { if (confirm('حذف هذا العنصر؟')) { this.store.remove(section.coll, id); this.ui.toast('تم الحذف 🗑️'); } }
  bulkDelete(section, ids) { this.store.bulkRemove(section.coll, ids); this.ui.toast(`تم حذف ${ids.length} عنصرًا`); }
  bulkMove(section, ids, patch) { this.store.bulkUpdate(section.coll, ids, patch); this.ui.toast(`تم نقل ${ids.length} عنصرًا`); }
  reorder(section, ids) { this.store.reorder(section.coll, ids); }
  preview(section, o) { this.ui.preview(section, o); }

  // ---- global ----
  async importExisting() {
    this.ui.toast('جارٍ الاستيراد…');
    try { const n = await importExistingContent(this.store); this.ui.toast(`تم استيراد ${n} عنصرًا 📥`); this.ui.setSection(this.section); }
    catch (e) { console.error('[CMS] import', e); this.ui.toast('تعذّر الاستيراد'); }
  }
  clearAll() { if (confirm('مسح كل بيانات الإدارة؟ لا يمكن التراجع.')) { this.store.clearAll(); this.ui.toast('تم المسح'); this.ui.setSection(this.section); } }

  _injectCss() {
    const id = 'cms-styles'; if (document.getElementById(id)) return;
    this._cssLink = el('link', { id, attrs: { rel: 'stylesheet', href: new URL('./styles/admin-cms.css', import.meta.url).href } });
    document.head.appendChild(this._cssLink);
  }
  destroy() {
    this._off && this._off();
    if (this.root?.parentNode) this.root.remove();
    if (this._cssLink?.parentNode) this._cssLink.remove();
  }
}
