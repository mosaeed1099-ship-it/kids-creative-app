/**
 * StoryUI.js — assembles the whole editor (top bar, tool rail, canvas stage,
 * object inspector, draw bar, page filmstrip) and hosts the modals (sticker
 * picker, shape picker, info panel, crop, library) + toasts. Exposes the refresh
 * hooks the app calls.
 */
import { el, clear } from '../../../utils/dom.js';
import { iconBtn } from './helpers.js';
import TopBar from './TopBar.js';
import Toolbar from './Toolbar.js';
import Filmstrip from './Filmstrip.js';
import Inspector from './Inspector.js';
import TextEditor from './TextEditor.js';
import { SHAPES } from '../../free-draw/index.js';
import { stickerThumb } from '../../sticker-studio/scene/visual.js';

const BRUSHES = [{ id: 'pencil', n: 'قلم' }, { id: 'brush', n: 'فرشاة' }, { id: 'crayon', n: 'شمعي' }, { id: 'marker', n: 'ماركر' }];

export default class StoryUI {
  constructor(app) { this.app = app; this.textEditor = new TextEditor(app); }

  build() {
    const a = this.app;
    this.topbar = new TopBar(a);
    this.toolbar = new Toolbar(a);
    this.filmstrip = new Filmstrip(a);
    this.inspector = new Inspector(a);

    this.stage = el('div', { class: 'st-stage', attrs: { 'aria-label': 'الصفحة' } });
    this.drawbar = this._buildDrawBar();
    const stageArea = el('div', { class: 'st-stage-area' }, [this.stage, this.inspector.build(), this.drawbar]);

    this.toastHost = el('div', { class: 'st-toasts', attrs: { 'aria-live': 'polite' } });
    this.root = el('div', { class: 'st-root', attrs: { dir: 'rtl' } }, [
      this.topbar.build(),
      el('div', { class: 'st-body' }, [this.toolbar.build(), stageArea]),
      this.filmstrip.build(),
      this.toastHost,
    ]);
    return this.root;
  }

  _buildDrawBar() {
    const a = this.app;
    const brushRow = el('div', { class: 'st-inline' }, BRUSHES.map((b) => iconBtn({
      label: b.n, active: a.brush.profileId === b.id,
      onClick: (e) => { a.brush.profileId = b.id; [...brushRow.children].forEach((c) => c.classList.remove('is-active')); e.currentTarget.classList.add('is-active'); },
    })));
    const color = el('input', { class: 'st-color', attrs: { type: 'color', value: a.brush.color, 'aria-label': 'لون الرسم' }, on: { input: (e) => { a.brush.color = e.target.value; } } });
    const size = el('input', { attrs: { type: 'range', min: '4', max: '90', value: String(a.brush.size), 'aria-label': 'حجم الفرشاة' }, on: { input: (e) => { a.brush.size = +e.target.value; } } });
    return el('div', { class: 'st-drawbar', attrs: { hidden: 'true' } }, [brushRow, el('label', { class: 'st-field st-field--sm' }, ['🎨', color]), el('label', { class: 'st-field st-field--sm' }, ['حجم', size])]);
  }

  // ---- app hooks ----
  setHistory(u, r) { this.topbar.setHistory(u, r); }
  setZoom(p) { this.topbar.setZoom(p); }
  setTitle(t) { this.topbar.setTitle(t); }
  setMode(mode) { this.toolbar.refresh(); this.drawbar.toggleAttribute('hidden', mode !== 'draw'); if (mode === 'draw') this.inspector.show(null); }
  setPageActive() { /* reserved */ }
  refreshFilmstrip() { this.filmstrip.refresh(); this.filmstrip.updateLabel(); }
  updatePageLabel() { this.filmstrip.updateLabel(); }
  showInspector(obj) { if (this.app.mode !== 'draw') this.inspector.show(obj); }
  refreshInspector() { this.inspector.refresh(); }
  openTextEditor(obj) { this.textEditor.open(obj); }

  toast(msg) {
    const c = el('div', { class: 'st-toast', text: msg });
    this.toastHost.append(c);
    requestAnimationFrame(() => c.classList.add('is-in'));
    setTimeout(() => { c.classList.remove('is-in'); setTimeout(() => c.remove(), 300); }, 1800);
  }

  _modal(title, body) {
    const close = () => overlay.remove();
    const overlay = el('div', { class: 'st-modal', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': title } }, [
      el('div', { class: 'st-modal__box' }, [
        el('div', { class: 'st-modal__head' }, [el('h2', { text: title }), iconBtn({ emoji: '✖️', title: 'إغلاق', onClick: close })]),
        body,
      ]),
    ]);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    this.root.append(overlay);
    return { overlay, close };
  }

  openStickerPicker() {
    const a = this.app;
    const grid = el('div', { class: 'st-picker-grid' });
    const tabs = el('div', { class: 'st-tabs' });
    const { close } = this._modal('⭐ اختر ملصقًا', el('div', {}, [tabs, grid]));
    let pack = a.stickerContent.getPacks()[0]?.id;
    const render = () => {
      clear(tabs); clear(grid);
      a.stickerContent.getPacks().forEach((p) => tabs.append(iconBtn({ label: localized(p.title), active: p.id === pack, onClick: () => { pack = p.id; render(); } })));
      (a.stickerContent.getPack(pack)?.items || []).forEach((item) => {
        const cell = el('button', { class: 'st-picker-cell', attrs: { type: 'button', title: item.getTitle('ar') }, on: { click: () => { a.addSticker(item); close(); } } }, [stickerThumb(item)]);
        grid.append(cell);
      });
    };
    render();
  }

  openShapePicker() {
    const a = this.app;
    const grid = el('div', { class: 'st-picker-grid' });
    const { close } = this._modal('⬛ اختر شكلًا', grid);
    SHAPES.forEach((sh) => grid.append(el('button', { class: 'st-picker-cell st-shape-cell', attrs: { type: 'button', title: sh.label }, on: { click: () => { a.addShape(sh.id); close(); } } }, [el('span', { class: 'st-shape-emoji', text: sh.emoji }), el('span', { class: 'st-mini', text: sh.label })])));
  }

  openInfo() {
    const a = this.app; const m = a.story.meta;
    const inp = (key, label, type = 'text') => { const i = el('input', { class: 'st-input', attrs: { type, value: m[key] || '', dir: 'rtl' }, on: { input: () => a.setMeta({ [key]: i.value }) } }); return el('label', { class: 'st-field st-field--col' }, [label, i]); };
    this._modal('ℹ️ معلومات القصة', el('div', { class: 'st-info' }, [
      inp('title', 'العنوان'), inp('author', 'المؤلف'), inp('childName', 'اسم الطفل'),
      inp('date', 'التاريخ', 'date'), inp('category', 'التصنيف'),
      el('p', { class: 'st-mini', text: 'تظهر هذه المعلومات على صفحة الغلاف.' }),
    ]));
  }

  openLibrary() {
    const a = this.app;
    const grid = el('div', { class: 'st-gallery' });
    const items = a.storage.list();
    const { close } = this._modal('📂 قصصي', grid);
    const rebuild = () => {
      clear(grid);
      if (!items.length) { grid.append(el('p', { class: 'st-mini', text: 'لا توجد قصص محفوظة بعد.' })); return; }
      items.forEach((it) => grid.append(el('div', { class: 'st-gcard' }, [
        el('img', { class: 'st-gthumb', attrs: { src: it.thumb || '', alt: it.title } }),
        el('span', { class: 'st-gname', text: it.title }),
        el('div', { class: 'st-inline' }, [
          iconBtn({ emoji: '📂', label: 'فتح', onClick: () => { a.openStory(it.data); close(); } }),
          iconBtn({ emoji: '🗑️', title: 'حذف', onClick: () => { a.storage.remove(it.id); items.splice(items.indexOf(it), 1); rebuild(); } }),
        ]),
      ])));
    };
    rebuild();
  }

  openCrop(obj) {
    const a = this.app;
    const box = el('div', { class: 'st-crop' });
    const img = el('img', { class: 'st-crop-img', attrs: { src: obj.src, alt: '', draggable: 'false' } });
    const rect = el('div', { class: 'st-crop-rect' });
    box.append(img, rect);
    let start = null, sel = null;
    const setRect = (r) => { rect.style.left = `${r.x}px`; rect.style.top = `${r.y}px`; rect.style.width = `${r.w}px`; rect.style.height = `${r.h}px`; rect.style.display = 'block'; };
    box.addEventListener('pointerdown', (e) => { const b = img.getBoundingClientRect(); start = { x: e.clientX - b.left, y: e.clientY - b.top }; box.setPointerCapture(e.pointerId); });
    box.addEventListener('pointermove', (e) => { if (!start) return; const b = img.getBoundingClientRect(); const x2 = Math.max(0, Math.min(b.width, e.clientX - b.left)); const y2 = Math.max(0, Math.min(b.height, e.clientY - b.top)); sel = { x: Math.min(start.x, x2), y: Math.min(start.y, y2), w: Math.abs(x2 - start.x), h: Math.abs(y2 - start.y) }; setRect(sel); });
    box.addEventListener('pointerup', () => { start = null; });
    const { close } = this._modal('✂️ قص الصورة', el('div', {}, [
      box,
      el('p', { class: 'st-mini', text: 'اسحب لتحديد الجزء المطلوب.' }),
      el('div', { class: 'st-modal__foot' }, [
        iconBtn({ emoji: '✂️', label: 'قص', cls: 'st-primary', onClick: () => { if (sel && sel.w > 8 && sel.h > 8) { const b = img.getBoundingClientRect(); const fx = obj.natW / b.width, fy = obj.natH / b.height; a.applyCrop(obj, { x: Math.round(sel.x * fx), y: Math.round(sel.y * fy), w: Math.round(sel.w * fx), h: Math.round(sel.h * fy) }); } close(); } }),
        iconBtn({ emoji: '↺', label: 'إلغاء القص', onClick: () => { const b = a.objState(obj); obj.crop = null; a.commitObjectChange(b); close(); } }),
      ]),
    ]));
  }
}

function localized(t) { if (!t) return ''; if (typeof t === 'string') return t; return t.ar ?? Object.values(t)[0] ?? ''; }
