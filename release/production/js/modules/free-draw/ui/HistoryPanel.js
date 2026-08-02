/**
 * HistoryPanel.js — undo/redo plus a clickable timeline of every step (jump to
 * any point). Reads app.history (unlimited MarkHistory).
 */
import { el, clear } from '../../../utils/dom.js';
import { section, iconBtn } from './helpers.js';

export default class HistoryPanel {
  constructor(app) { this.app = app; }

  build() {
    this.undoBtn = iconBtn({ emoji: '↶', label: 'تراجع', title: 'تراجع', onClick: () => this.app.undo() });
    this.redoBtn = iconBtn({ emoji: '↷', label: 'إعادة', title: 'إعادة', onClick: () => this.app.redo() });
    this.timeline = el('div', { class: 'fd-timeline' });
    this.el = section('السجل', '🕓', [
      el('div', { class: 'fd-history-bar' }, [this.undoBtn, this.redoBtn]),
      this.timeline,
    ]);
    this.refresh();
    return this.el;
  }

  setState(canUndo, canRedo) {
    this.undoBtn.toggleAttribute('disabled', !canUndo);
    this.redoBtn.toggleAttribute('disabled', !canRedo);
  }

  refresh() {
    const h = this.app.history;
    this.setState(h.canUndo, h.canRedo);
    clear(this.timeline);
    const entries = h.entries();
    this.timeline.append(this._entry({ label: 'البداية', emoji: '🎬', index: -1, applied: true }, h.index));
    entries.forEach((e) => this.timeline.append(this._entry(e, h.index)));
    this.timeline.scrollTop = this.timeline.scrollHeight;
  }

  _entry(e, currentIndex) {
    const isCurrent = e.index === currentIndex;
    const node = el('button', {
      class: `fd-timeline__item ${e.applied ? 'is-applied' : ''} ${isCurrent ? 'is-current' : ''}`,
      attrs: { type: 'button', title: e.label },
      on: { click: () => this.app.gotoHistory(e.index) },
    }, [el('span', { class: 'fd-timeline__emoji', text: e.emoji }), el('span', { text: e.label })]);
    return node;
  }
}
