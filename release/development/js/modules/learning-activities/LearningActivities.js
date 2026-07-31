/**
 * LearningActivities — the module controller. A complete, fully-offline
 * educational activities center that consumes ONLY the Content Engine public
 * API (for the library of data-driven activities) and drives a data-driven
 * activity framework (Registry + Host + renderers). Progress, stars, rewards
 * and "continue" are all local and offline.
 *
 *   import LearningActivities from '../modules/learning-activities/index.js';
 *   const la = new LearningActivities({ mount:'#app', content });
 *   la.mount();
 */
import { h } from './activities/base.js';
import Library from './ui/Library.js';
import ActivityHost from './ActivityHost.js';
import ProgressTracker from './ProgressTracker.js';
import Rewards from './Rewards.js';
import ActivityRegistry from './ActivityRegistry.js';

export default class LearningActivities {
  constructor({ mount, content, options = {} } = {}) {
    this.mountEl = typeof mount === 'string' ? document.querySelector(mount) : mount;
    this.content = content; this.options = options;
    this.tracker = options.tracker || new ProgressTracker({ key: options.progressKey || 'kcs.learning.progress' });
    this.rewards = options.rewards || new Rewards({ key: options.badgeKey || 'kcs.learning.badges' });
    this.colors = options.colors || { primary: '#5b6bff', accent: '#ff6b9d' };
    this._items = [];
    this.host = null;
  }

  mount() {
    this.root = h('div', { class: 'la' });
    this.mountEl.appendChild(this.root);
    this._items = this._loadItems();
    this.library = new Library({ items: this._items, tracker: this.tracker, onOpen: (it, o) => this.open(it, o) });
    this.showLibrary();
    return this;
  }

  /** Only items whose type has a registered renderer are shown. */
  _loadItems() {
    const seen = new Set(); const out = [];
    for (const it of this.content.filter({ assetType: 'activity' }).toArray()) {
      if (seen.has(it.id)) continue; seen.add(it.id);
      if (ActivityRegistry.has(it.data?.type)) out.push(it);
    }
    return out;
  }

  showLibrary() {
    if (this.host) { this.host.destroy(); this.host = null; }
    this._view = 'library';
    this.root.replaceChildren(this.library.build());
    this.library.refresh();
  }

  open(item, { resume = false } = {}) {
    this._view = 'activity';
    const idx = this._items.findIndex((i) => i.id === item.id);
    const next = this._items[idx + 1] || this._items[0];
    const hasNext = this._items.length > 1;
    this.host = new ActivityHost({
      mount: this.root, item, tracker: this.tracker, rewards: this.rewards, colors: this.colors,
      hasNext, resume,
      onBack: () => this.showLibrary(),
      onNext: () => this.open(next),
    });
    this.host.mount();
  }

  /** Public helpers. */
  stats() { return this.tracker.stats(); }
  badges() { return this.rewards.all(); }
  resetProgress() { this.tracker.reset(); this.rewards.reset(); if (this._view === 'library') this.showLibrary(); }
  destroy() { this.host?.destroy(); this.root?.remove(); }
}
