/**
 * TraceModule.js — the real Trace-a-reference experience (replaces the old
 * placeholder). Mounts the full TraceStudio (faint reference behind the paper +
 * drawing tools, reference move/scale, autosave, export) and populates its
 * source templates from the Content Engine. Normal feature Module — the router +
 * lazy-loader mount it unchanged. No logic duplicated; wires existing public
 * APIs (Content Engine + TraceStudio).
 */
import Module from '../../core/Module.js';
import TraceStudio from '../trace-studio/index.js';
import { ContentManager } from '../../content/index.js';

export default class TraceModule extends Module {
  static meta = {
    id: 'trace',
    title: 'ارسم وقلّد',
    icon: '🖼️',
    route: '/trace',
    description: 'قلّد نموذجًا يظهر خفيفًا خلف اللوحة وتمشّى عليه.',
  };

  render() {
    this.root = document.createElement('div');
    this.root.className = 'ts-host';
    return this.root;
  }

  async onMount() {
    const base = new URL('../trace-studio/content/', import.meta.url).href;
    this.content = new ContentManager({ base });
    await this.content.init({ catalog: 'catalog.json' });
    await this.content.loadAll();
    const resolveAsset = (item) => new URL(item.asset.src, base).href;

    this.studio = new TraceStudio({ mount: this.root, content: this.content, options: { resolveAsset } });
    this.studio.mount();

    const items = this.content.filter({ assetType: 'trace' }).sortBy('order').toArray();
    if (items.length) {
      this.studio.ui.setSources(items, (it) => this.studio.openItem(it));
      await this.studio.openItem(items[0]);
    }
  }

  async onUnmount() {
    this.studio?.destroy();
    this.studio = null;
    this.content = null;
  }
}
