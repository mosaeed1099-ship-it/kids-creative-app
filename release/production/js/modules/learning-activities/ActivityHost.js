/**
 * ActivityHost — runs a single activity: header (title / stars / hint / restart
 * / back), the play area, a progress bar and the completion screen. It builds
 * the `api` object handed to each renderer and wires progress-saving so the
 * activity can be continued later.
 */
import { h } from './activities/base.js';
import ActivityRegistry from './ActivityRegistry.js';
import Completion from './ui/Completion.js';

export default class ActivityHost {
  constructor({ mount, item, tracker, rewards, colors, onBack, onNext, hasNext, resume = false }) {
    this.mountEl = mount; this.item = item; this.tracker = tracker; this.rewards = rewards;
    this.colors = colors || {}; this.onBack = onBack; this.onNext = onNext; this.hasNext = hasNext;
    this.resume = resume; this.inst = null;
  }

  mount() {
    const type = this.item.data?.type;
    const renderer = ActivityRegistry.get(type);
    this.el = h('div', { class: 'la-host' });

    // header
    this.starsEl = h('div', { class: 'la-host__stars' });
    this._paintStars(this.tracker.best(this.item.id));
    this.el.appendChild(h('div', { class: 'la-host__bar' }, [
      h('button', { class: 'la-iconbtn', text: '⟵', title: 'رجوع', on: { click: () => this._exit() } }),
      h('div', { class: 'la-host__title', text: this.item.getTitle('ar') }),
      this.starsEl,
      h('button', { class: 'la-iconbtn', text: '💡', title: 'تلميح', on: { click: () => this.inst?.hint() } }),
      h('button', { class: 'la-iconbtn', text: '🔄', title: 'إعادة', on: { click: () => this._restart() } }),
    ]));

    // progress
    this.fill = h('div', { class: 'la-host__fill' });
    this.el.appendChild(h('div', { class: 'la-host__progress' }, [this.fill]));

    // play area
    this.area = h('div', { class: 'la-host__area' });
    this.el.appendChild(this.area);

    this.mountEl.replaceChildren(this.el);

    if (!renderer) { this.area.appendChild(h('div', { class: 'la-empty', text: 'نوع النشاط غير متاح: ' + type })); return this; }

    const api = {
      params: this.item.data?.params || {},
      colors: this.colors,
      progress: (v) => this._progress(v),
      complete: (stars) => this._complete(stars),
      mistake: () => {},
    };
    this.inst = renderer(this.area, this.item, api);

    if (this.resume && this.tracker.hasSaved(this.item.id) && this.inst.setState) {
      try { this.inst.setState(this.tracker.savedState(this.item.id)); } catch (_) {}
    }
    return this;
  }

  _paintStars(n) {
    this.starsEl.replaceChildren(...[1, 2, 3].map((i) => h('span', { class: 'la-host__star' + (i <= n ? ' is-on' : ''), text: '★' })));
  }
  _progress(v) {
    this.fill.style.width = Math.round(Math.max(0, Math.min(1, v)) * 100) + '%';
    // save an in-progress snapshot for "continue"
    try { if (this.inst?.getState) this.tracker.saveState(this.item.id, this.inst.getState()); } catch (_) {}
  }
  _complete(stars) {
    this.tracker.complete(this.item.id, stars);
    const fresh = this.rewards.evaluate(this.tracker.stats());
    this._paintStars(this.tracker.best(this.item.id));
    this.fill.style.width = '100%';
    const done = Completion({
      item: this.item, stars, badges: fresh,
      hasNext: this.hasNext,
      onRetry: () => this._restart(),
      onNext: () => this.onNext?.(),
      onBack: () => this.onBack?.(),
    });
    this.area.replaceChildren(done);
  }
  _restart() {
    this.tracker.clearState(this.item.id);
    try { this.inst?.destroy(); } catch (_) {}
    this.resume = false; this.fill.style.width = '0%';
    this.area.replaceChildren();
    const renderer = ActivityRegistry.get(this.item.data?.type);
    const api = { params: this.item.data?.params || {}, colors: this.colors, progress: (v) => this._progress(v), complete: (s) => this._complete(s), mistake: () => {} };
    this.inst = renderer(this.area, this.item, api);
  }
  _exit() { try { this.inst?.destroy(); } catch (_) {} this.onBack?.(); }
  destroy() { try { this.inst?.destroy(); } catch (_) {} this.el?.remove(); }
}
