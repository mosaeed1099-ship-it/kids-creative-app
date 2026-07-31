/**
 * ColoringUI — builds the coloring workspace DOM (toolbar + stage + palette)
 * and binds every control to ColoringApp. Presentation only; all behaviour
 * lives in the app/tools. Touch-friendly, responsive, works light & dark.
 */
function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'on') for (const [e, fn] of Object.entries(v)) el.addEventListener(e, fn);
    else el.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c != null) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}

const TOOLS = [
  { id: 'bucket', icon: '🪣', label: 'دلو' },
  { id: 'brush', icon: '🖌️', label: 'فرشاة' },
  { id: 'pencil', icon: '✏️', label: 'قلم' },
  { id: 'eraser', icon: '🧽', label: 'ممحاة' },
  { id: 'pan', icon: '✋', label: 'تحريك' },
];

export default class ColoringUI {
  constructor(app) { this.app = app; }

  build() {
    const app = this.app;

    // --- tools group ---
    this._toolBtns = {};
    const toolsGroup = h('div', { class: 'clr-tools' }, TOOLS.map((t) => {
      const btn = h('button', {
        class: 'clr-tool', title: t.label,
        on: { click: () => app.setTool(t.id) },
      }, [h('span', { class: 'clr-tool__icon', text: t.icon }), h('span', { class: 'clr-tool__label', text: t.label })]);
      this._toolBtns[t.id] = btn;
      return btn;
    }));

    // --- action buttons ---
    const act = (icon, title, fn, cls = '') => h('button', { class: `clr-act ${cls}`, title, on: { click: fn } }, icon);
    this._undoBtn = act('↩️', 'تراجع', () => app.undo());
    this._redoBtn = act('↪️', 'إعادة', () => app.redo());

    const actions = h('div', { class: 'clr-actions' }, [
      this._undoBtn, this._redoBtn,
      h('span', { class: 'clr-sep' }),
      act('➖', 'تصغير', () => app.zoomOut()),
      act('➕', 'تكبير', () => app.zoomIn()),
      act('🔳', 'ملء الشاشة للرسمة', () => app.fitView()),
      act('⟳', 'إعادة العرض', () => app.resetView()),
      act('⛶', 'شاشة كاملة', () => app.fullscreen()),
      h('span', { class: 'clr-sep' }),
      act('🖼️', 'تصدير PNG', () => app.exportPNG()),
      act('📷', 'تصدير JPEG', () => app.exportJPEG()),
      act('🖨️', 'طباعة', () => app.print()),
      act('🗑️', 'مسح التلوين', () => app.clear(), 'clr-act--danger'),
    ]);

    this._title = h('div', { class: 'clr-title', text: '' });

    const toolbar = h('header', { class: 'clr-toolbar' }, [toolsGroup, this._title, actions]);

    // --- stage (engine mounts here) ---
    this.stage = h('div', { class: 'clr-stage' });

    // --- palette panel ---
    this._brushLabel = h('span', { class: 'clr-brush__val', text: '26' });
    this._brushRange = h('input', {
      class: 'clr-brush__range', type: 'range', min: '4', max: '80', value: '26',
      on: { input: (e) => app.setBrushSize(+e.target.value) },
    });
    const brushRow = h('div', { class: 'clr-brush' }, [
      h('span', { class: 'clr-brush__icon', text: '🖌️' }), this._brushRange, this._brushLabel,
    ]);

    this._current = h('span', { class: 'clr-current' });
    this._favBtn = h('button', { class: 'clr-favbtn', title: 'أضف للمفضلة', on: { click: () => app.toggleFavoriteColor() } }, '☆');
    const picker = h('input', { class: 'clr-picker', type: 'color', title: 'لون مخصص', on: { input: (e) => app.setColor(e.target.value) } });
    const currentRow = h('div', { class: 'clr-currentrow' }, [
      h('span', { class: 'clr-currentrow__label', text: 'اللون:' }), this._current, this._favBtn,
      h('label', { class: 'clr-pickwrap', title: 'لون مخصص' }, [picker, h('span', { text: '＋' })]),
    ]);

    this._swatches = h('div', { class: 'clr-swatches' });
    this._recent = h('div', { class: 'clr-swatches clr-swatches--sm' });
    this._favs = h('div', { class: 'clr-swatches clr-swatches--sm' });

    const panel = h('aside', { class: 'clr-panel' }, [
      brushRow,
      currentRow,
      h('div', { class: 'clr-panel__label', text: 'الألوان' }), this._swatches,
      h('div', { class: 'clr-panel__label', text: 'المستخدمة مؤخرًا' }), this._recent,
      h('div', { class: 'clr-panel__label', text: '⭐ المفضلة' }), this._favs,
    ]);

    const main = h('div', { class: 'clr-main' }, [this.stage, panel]);
    this.root = h('div', { class: 'coloring' }, [toolbar, main]);
    return this.root;
  }

  // ---------- refresh helpers ----------
  _swatch(hex, small = false) {
    const cur = this.app.color.toLowerCase() === hex.toLowerCase();
    return h('button', {
      class: `clr-sw ${small ? 'clr-sw--sm' : ''} ${cur ? 'is-active' : ''}`,
      style: `background:${hex}`, title: hex,
      on: { click: () => this.app.setColor(hex) },
    });
  }

  refreshColors() {
    const c = this.app.colors;
    this._swatches.replaceChildren(...c.palette().map((x) => this._swatch(x)));
    const recent = c.recent();
    this._recent.replaceChildren(...(recent.length ? recent.map((x) => this._swatch(x, true)) : [h('span', { class: 'clr-empty', text: '—' })]));
    const favs = c.favorites();
    this._favs.replaceChildren(...(favs.length ? favs.map((x) => this._swatch(x, true)) : [h('span', { class: 'clr-empty', text: 'اضغط ☆ لإضافة لون' })]));
    this._current.style.background = this.app.color;
    this._favBtn.textContent = c.isFavorite(this.app.color) ? '⭐' : '☆';
  }

  setActiveTool(id) {
    Object.entries(this._toolBtns).forEach(([tid, btn]) => btn.classList.toggle('is-active', tid === id));
  }

  setHistory(canUndo, canRedo) {
    this._undoBtn.disabled = !canUndo;
    this._redoBtn.disabled = !canRedo;
  }

  setBrushSize(n) { this._brushRange.value = n; this._brushLabel.textContent = String(n); }
  setTitle(t) { this._title.textContent = t || ''; }
  setHasProgress(/* has */) { /* reserved for a "restored" badge */ }
}
