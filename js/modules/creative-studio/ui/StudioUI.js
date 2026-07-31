/**
 * StudioUI — Creative Studio workspace: toolbar (tools + part actions + view +
 * output), the engine stage, and a side panel (characters, expressions,
 * stickers). Part-action buttons enable only when a part is selected.
 */
import { h } from './h.js';

const EXPR = [
  { id: 'happy', icon: '😄', label: 'سعيد' },
  { id: 'sad', icon: '😢', label: 'حزين' },
  { id: 'angry', icon: '😠', label: 'غاضب' },
  { id: 'surprised', icon: '😮', label: 'متفاجئ' },
  { id: 'sleepy', icon: '😴', label: 'نعسان' },
  { id: 'laughing', icon: '😂', label: 'يضحك' },
];

export default class StudioUI {
  constructor(app) { this.app = app; }

  build() {
    const app = this.app;
    const btn = (label, title, fn, cls = '') => h('button', { class: `cs-btn ${cls}`, title, on: { click: fn } }, label);

    // tools
    this._toolBtns = {};
    const mkTool = (id, icon, label) => { const b = h('button', { class: 'cs-tool', title: label, on: { click: () => app.setTool(id) } }, [h('span', { class: 'cs-tool__i', text: icon }), h('span', { class: 'cs-tool__l', text: label })]); this._toolBtns[id] = b; return b; };
    const tools = h('div', { class: 'cs-tools' }, [mkTool('select', '👆', 'اختيار'), mkTool('pan', '✋', 'تحريك')]);

    // part actions (enabled on selection)
    this._actions = h('div', { class: 'cs-partacts is-disabled' }, [
      btn('➕', 'تكبير', () => app.scaleSel(1.15)), btn('➖', 'تصغير', () => app.scaleSel(0.87)),
      btn('⟲', 'تدوير يسار', () => app.rotateSel(-15)), btn('⟳', 'تدوير يمين', () => app.rotateSel(15)),
      btn('↔️', 'قلب أفقي', () => app.flipH()), btn('↕️', 'قلب رأسي', () => app.flipV()),
      btn('⬆️', 'للأمام', () => app.forward()), btn('⬇️', 'للخلف', () => app.backward()),
      btn('⧉', 'تكرار', () => app.duplicateSel()), btn('🗑️', 'حذف', () => app.deleteSel(), 'cs-btn--danger'),
    ]);

    this._title = h('div', { class: 'cs-title' });

    this._undo = btn('↩️', 'تراجع', () => app.undo());
    this._redo = btn('↪️', 'إعادة', () => app.redo());
    const right = h('div', { class: 'cs-right' }, [
      this._undo, this._redo, h('span', { class: 'cs-sep' }),
      btn('➖', 'تصغير', () => app.zoomOut()), btn('➕', 'تكبير', () => app.zoomIn()),
      btn('🔳', 'ملاءمة', () => app.fitView()), btn('⟳', 'إعادة العرض', () => app.resetView()),
      btn('⛶', 'ملء الشاشة', () => app.fullscreen()), h('span', { class: 'cs-sep' }),
      btn('🖼️', 'PNG', () => app.exportPNG()), btn('📷', 'JPEG', () => app.exportJPEG()), btn('🖨️', 'طباعة', () => app.print()),
      btn('♻️', 'إعادة الشخصية', () => app.resetCharacter(), 'cs-btn--warn'),
    ]);

    const toolbar = h('header', { class: 'cs-toolbar' }, [tools, this._actions, this._title, right]);

    this.stage = h('div', { class: 'cs-stage' });

    // panel
    this._characters = h('div', { class: 'cs-chars' });
    this._exprBtns = {};
    const expr = h('div', { class: 'cs-exprs' }, EXPR.map((e) => { const b = h('button', { class: 'cs-expr', title: e.label, on: { click: () => app.setExpression(e.id) } }, [h('span', { text: e.icon }), h('span', { class: 'cs-expr__l', text: e.label })]); this._exprBtns[e.id] = b; return b; }));
    this._stickers = h('div', { class: 'cs-stickers' });

    const panel = h('aside', { class: 'cs-panel' }, [
      h('div', { class: 'cs-lbl', text: '🧸 الشخصيات' }), this._characters,
      h('div', { class: 'cs-lbl', text: '😊 التعبيرات' }), expr,
      h('div', { class: 'cs-lbl', text: '⭐ الملصقات' }), this._stickers,
      h('div', { class: 'cs-hint', text: '👆 اضغط جزءًا لتحديده، اسحبه لتحريكه، والمقبضان للتدوير والتحجيم.' }),
    ]);

    const main = h('div', { class: 'cs-main' }, [this.stage, panel]);
    this.root = h('div', { class: 'creative' }, [toolbar, main]);
    return this.root;
  }

  // fillers
  setCharacters(list, onPick) {
    this._characters.replaceChildren(...list.map((c) => h('button', { class: 'cs-char', title: c.name?.ar || c.id, on: { click: () => onPick(c) } },
      [h('span', { class: 'cs-char__e', text: c.thumbnail?.value || '🧸' }), h('span', { class: 'cs-char__n', text: c.name?.ar || c.id })])));
  }
  setStickers(items, onPick) {
    this._stickers.replaceChildren(...items.map((it) => h('button', { class: 'cs-sticker', title: it.getTitle ? it.getTitle('ar') : '', on: { click: () => onPick(it.asset?.value || it.thumbnail?.value || '⭐') } }, it.thumbnail?.value || '⭐')));
  }

  // state
  setHasSelection(has) { this._actions.classList.toggle('is-disabled', !has); }
  setActiveTool(id) { Object.entries(this._toolBtns).forEach(([tid, b]) => b.classList.toggle('is-active', tid === id)); }
  setExpression(id) { Object.entries(this._exprBtns).forEach(([eid, b]) => b.classList.toggle('is-active', eid === id)); }
  setHistory(u, r) { this._undo.disabled = !u; this._redo.disabled = !r; }
  setTitle(t) { this._title.textContent = t || ''; }
}
