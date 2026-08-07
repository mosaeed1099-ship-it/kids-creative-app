/**
 * TraceUI — builds the Trace Studio workspace: toolbar (draw tools + view/output
 * actions), the engine stage, and a side panel with Sources, Reference controls,
 * Comparison modes, brush size and the color palette. Presentation only; every
 * control calls a TraceStudio method.
 */
import { h } from './h.js';

const TOOLS = [
  { id: 'brush', icon: '🖌️', label: 'فرشاة' },
  { id: 'pencil', icon: '✏️', label: 'قلم' },
  { id: 'eraser', icon: '🧽', label: 'ممحاة' },
  { id: 'move-ref', icon: '🎯', label: 'حرّك المرجع' },
  { id: 'pan', icon: '✋', label: 'تحريك' },
];
const COMPARE = [
  { id: 'overlay', label: 'تراكب' },
  { id: 'before', label: 'المرجع' },
  { id: 'after', label: 'رسمتي' },
  { id: 'split', label: 'مقسّم' },
];

export default class TraceUI {
  constructor(app) { this.app = app; }

  build() {
    const app = this.app;
    this._toolBtns = {};
    const tools = h('div', { class: 'ts-tools' }, TOOLS.map((t) => {
      const b = h('button', { class: 'ts-tool', title: t.label, on: { click: () => app.setTool(t.id) } },
        [h('span', { class: 'ts-tool__i', text: t.icon }), h('span', { class: 'ts-tool__l', text: t.label })]);
      this._toolBtns[t.id] = b; return b;
    }));

    const act = (icon, title, fn, cls = '') => h('button', { class: `ts-act ${cls}`, title, on: { click: fn } }, icon);
    this._undo = act('↩️', 'تراجع', () => app.undo());
    this._redo = act('↪️', 'إعادة', () => app.redo());
    const actions = h('div', { class: 'ts-actions' }, [
      this._undo, this._redo, h('span', { class: 'ts-sep' }),
      act('➖', 'تصغير', () => app.zoomOut()), act('➕', 'تكبير', () => app.zoomIn()),
      act('🔳', 'ملاءمة', () => app.fitView()), act('⟳', 'إعادة العرض', () => app.resetView()),
      act('⛶', 'ملء الشاشة', () => app.fullscreen()), h('span', { class: 'ts-sep' }),
      act('🖼️', 'PNG', () => app.exportPNG()), act('📷', 'JPEG', () => app.exportJPEG()),
      act('🖨️', 'طباعة', () => app.print()), act('🗑️', 'مسح', () => app.clear(), 'ts-act--danger'),
    ]);
    this._title = h('div', { class: 'ts-title' });
    const toolbar = h('header', { class: 'ts-toolbar' }, [tools, this._title, actions]);

    this.stage = h('div', { class: 'ts-stage' });

    // ----- panel -----
    // sources
    this._sources = h('div', { class: 'ts-sources' });
    const upload = h('input', { class: 'ts-upload', type: 'file', accept: 'image/*', on: { change: (e) => { if (e.target.files[0]) app.openFile(e.target.files[0]); e.target.value = ''; } } });
    const uploadLabel = h('label', { class: 'ts-uploadbtn' }, [h('span', { text: '📤 رفع صورة من الجهاز' }), upload]);

    // reference controls
    this._opacity = h('input', { class: 'ts-range', type: 'range', min: '0', max: '100', value: '50', on: { input: (e) => app.refOpacity(+e.target.value / 100) } });
    this._showBtn = h('button', { class: 'ts-ctl', title: 'إظهار/إخفاء', on: { click: () => app.refShow() } }, '👁️');
    this._lockBtn = h('button', { class: 'ts-ctl', title: 'قفل الطبقة', on: { click: () => app.refLock() } }, '🔓');
    const refBtns = h('div', { class: 'ts-ctlrow' }, [
      h('button', { class: 'ts-ctl', title: 'تصغير', on: { click: () => app.refScale(0.85) } }, '🔍−'),
      h('button', { class: 'ts-ctl', title: 'تكبير', on: { click: () => app.refScale(1.18) } }, '🔍＋'),
      h('button', { class: 'ts-ctl', title: 'تدوير يسار', on: { click: () => app.refRotate(-15) } }, '⟲'),
      h('button', { class: 'ts-ctl', title: 'تدوير يمين', on: { click: () => app.refRotate(15) } }, '⟳'),
      h('button', { class: 'ts-ctl', title: 'قلب أفقي', on: { click: () => app.refFlipH() } }, '↔️'),
      h('button', { class: 'ts-ctl', title: 'قلب رأسي', on: { click: () => app.refFlipV() } }, '↕️'),
      h('button', { class: 'ts-ctl', title: 'توسيط', on: { click: () => app.refCenter() } }, '⊕'),
      h('button', { class: 'ts-ctl', title: 'ملاءمة', on: { click: () => app.refFit() } }, '🔳'),
    ]);

    // comparison
    this._cmpBtns = {};
    const compare = h('div', { class: 'ts-compare' }, COMPARE.map((c) => {
      const b = h('button', { class: 'ts-cmp', on: { click: () => app.setCompare(c.id) } }, c.label);
      this._cmpBtns[c.id] = b; return b;
    }));

    // brush size
    this._brush = h('input', { class: 'ts-range', type: 'range', min: '3', max: '70', value: '22', on: { input: (e) => app.setBrushSize(+e.target.value) } });
    this._brushVal = h('span', { class: 'ts-val', text: '22' });

    // palette
    this._current = h('span', { class: 'ts-current' });
    this._favBtn = h('button', { class: 'ts-favbtn', title: 'مفضلة', on: { click: () => app.toggleFavoriteColor() } }, '☆');
    const picker = h('input', { class: 'ts-picker', type: 'color', on: { input: (e) => app.setColor(e.target.value) } });
    this._swatches = h('div', { class: 'ts-swatches' });
    this._recent = h('div', { class: 'ts-swatches ts-swatches--sm' });
    this._favs = h('div', { class: 'ts-swatches ts-swatches--sm' });

    // visible reference box — tap the original image to grab its color (eyedropper)
    this._refCanvas = h('canvas', { class: 'ts-refbox__canvas' });
    this._refFrame = h('div', { class: 'ts-refbox__frame' }, [this._refCanvas]);
    this._refBox = h('div', { class: 'ts-refbox' }, [
      h('div', { class: 'ts-refbox__hint', text: '🎨 المس الصورة لتأخذ لونها' }),
      this._refFrame,
    ]);
    this._wireEyedropper();

    const panel = h('aside', { class: 'ts-panel' }, [
      h('div', { class: 'ts-lbl', text: '🖼️ المصدر' }), this._sources, uploadLabel,
      h('div', { class: 'ts-lbl', text: '🖼️ الصورة الأصلية' }), this._refBox,
      h('div', { class: 'ts-lbl', text: '👻 المرجع' }),
      h('div', { class: 'ts-opacityrow' }, [h('span', { text: 'الشفافية' }), this._opacity, this._showBtn, this._lockBtn]),
      refBtns,
      h('div', { class: 'ts-lbl', text: '🔀 المقارنة' }), compare,
      h('div', { class: 'ts-lbl', text: '🖌️ حجم الفرشاة' }), h('div', { class: 'ts-brushrow' }, [this._brush, this._brushVal]),
      h('div', { class: 'ts-lbl', text: '🎨 الألوان' }),
      h('div', { class: 'ts-currentrow' }, [h('span', { text: 'اللون:' }), this._current, this._favBtn, h('label', { class: 'ts-pickwrap' }, [picker, '＋'])]),
      this._swatches,
      h('div', { class: 'ts-lbl', text: 'مؤخرًا' }), this._recent,
      h('div', { class: 'ts-lbl', text: '⭐ المفضلة' }), this._favs,
    ]);

    const main = h('div', { class: 'ts-main' }, [this.stage, panel]);
    this.root = h('div', { class: 'trace' }, [toolbar, main]);
    return this.root;
  }

  // ----- sources (filled by the app/example) -----
  setSources(items, onPick) {
    this._sources.replaceChildren(...items.map((it) => h('button', {
      class: 'ts-source', title: it.getTitle ? it.getTitle('ar') : (it.title || ''),
      on: { click: () => onPick(it) },
    }, it.thumbnail?.value || '🖼️')));
  }

  // ----- refresh helpers -----
  _swatch(hex, sm = false) {
    const cur = this.app.color.toLowerCase() === hex.toLowerCase();
    return h('button', { class: `ts-sw ${sm ? 'ts-sw--sm' : ''} ${cur ? 'is-active' : ''}`, style: { background: hex }, title: hex, on: { click: () => this.app.setColor(hex) } });
  }
  refreshColors() {
    const c = this.app.colors;
    this._swatches.replaceChildren(...c.palette().map((x) => this._swatch(x)));
    const r = c.recent(); this._recent.replaceChildren(...(r.length ? r.map((x) => this._swatch(x, true)) : [h('span', { class: 'ts-empty', text: '—' })]));
    const f = c.favorites(); this._favs.replaceChildren(...(f.length ? f.map((x) => this._swatch(x, true)) : [h('span', { class: 'ts-empty', text: 'اضغط ☆' })]));
    this._current.style.background = this.app.color;
    this._favBtn.textContent = c.isFavorite(this.app.color) ? '⭐' : '☆';
  }
  refreshReference() {
    const r = this.app.reference;
    if (!r) return;
    this._opacity.value = Math.round((r.opacity ?? 0.5) * 100);
    this._showBtn.classList.toggle('is-off', !r.visible);
    this._showBtn.textContent = r.visible ? '👁️' : '🚫';
    this._lockBtn.textContent = r.locked ? '🔒' : '🔓';
    this._lockBtn.classList.toggle('is-on', r.locked);
  }
  setActiveTool(id) { Object.entries(this._toolBtns).forEach(([tid, b]) => b.classList.toggle('is-active', tid === id)); }
  setCompare(mode) { Object.entries(this._cmpBtns).forEach(([m, b]) => b.classList.toggle('is-active', m === mode)); }
  setHistory(u, r) { this._undo.disabled = !u; this._redo.disabled = !r; }
  setBrushSize(n) { this._brush.value = n; this._brushVal.textContent = String(n); }
  setTitle(t) { this._title.textContent = t || ''; }

  // ----- reference box + eyedropper ("ارسم زيها") -----
  /** Show the original image at full opacity in a visible, tappable box.
   *  We sample colours straight from this display canvas (drawn at a fixed size),
   *  which is robust for SVG sources that report a 0 natural size. */
  setReferenceImage(img) {
    if (!img) return;
    const iw = img.naturalWidth || img.width || 0, ih = img.naturalHeight || img.height || 0;
    const ratio = (iw && ih) ? ih / iw : 0.75;
    const w = 260, hgt = Math.max(1, Math.round(w * ratio));
    this._refCanvas.width = w; this._refCanvas.height = hgt;
    this._refCtx = this._refCanvas.getContext('2d', { willReadFrequently: true });
    try { this._refCtx.drawImage(img, 0, 0, w, hgt); this._refReady = true; }
    catch { this._refReady = false; }
    this._refBox.classList.toggle('is-ready', this._refReady);
  }

  _wireEyedropper() {
    this._refCanvas.addEventListener('pointerdown', (ev) => {
      if (!this._refReady || !this._refCtx) return;
      ev.preventDefault();
      const rect = this._refCanvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const fx = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
      const fy = Math.min(1, Math.max(0, (ev.clientY - rect.top) / rect.height));
      const sx = Math.min(this._refCanvas.width - 1, Math.floor(fx * this._refCanvas.width));
      const sy = Math.min(this._refCanvas.height - 1, Math.floor(fy * this._refCanvas.height));
      if (!Number.isFinite(sx) || !Number.isFinite(sy)) return;
      let d; try { d = this._refCtx.getImageData(sx, sy, 1, 1).data; } catch { return; }
      if (d[3] === 0) return; // skip fully transparent pixels
      const hex = '#' + [d[0], d[1], d[2]].map((n) => n.toString(16).padStart(2, '0')).join('');
      this.app.setColor(hex);
      this._flashPick(fx, fy);
    });
  }

  _flashPick(fx, fy) {
    const dot = h('span', { class: 'ts-refbox__dot' });
    dot.style.left = `${(fx * 100).toFixed(1)}%`;
    dot.style.top = `${(fy * 100).toFixed(1)}%`;
    this._refFrame.appendChild(dot);
    setTimeout(() => dot.remove(), 550);
  }
}
