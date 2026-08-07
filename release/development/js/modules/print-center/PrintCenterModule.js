/**
 * PrintCenterModule.js — wires the Print Center into a route. Mounts the
 * existing PrintCenter app with its printables pack. Normal feature Module.
 */
import Module from '../../core/Module.js';
import PrintCenter from './index.js';
import { ContentManager } from '../../content/index.js';

export default class PrintCenterModule extends Module {
  static meta = {
    id: 'print',
    title: 'الطباعة',
    icon: '🖨️',
    route: '/print',
    description: 'اطبع الرسمات وصفحات التلوين وأعمالك.',
  };

  render() { this.root = document.createElement('div'); this.root.className = 'pc-host'; return this.root; }

  async onMount() {
    const base = new URL('./content/', import.meta.url).href;
    this.content = new ContentManager({ base });
    await this.content.init({ catalog: 'catalog.json' });
    await this.content.loadPack('printables');
    this.app = new PrintCenter({ mount: this.root, content: this.content, options: { resolveAsset: (item) => new URL(item.asset.src, base).href } });
    this.app.mount();
  }

  async onUnmount() { this.app?.destroy?.(); this.app = null; this.content = null; }
}
