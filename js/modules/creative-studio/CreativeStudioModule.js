/**
 * CreativeStudioModule.js — wires the Creative Studio into a route. Mounts the
 * existing CreativeStudio app: build a character then decorate with stickers.
 * Loads studio characters (own catalog) + sticker pack (Content Engine).
 */
import Module from '../../core/Module.js';
import CreativeStudio from './index.js';
import { ContentManager } from '../../content/index.js';

export default class CreativeStudioModule extends Module {
  static meta = {
    id: 'create',
    title: 'إبداع',
    icon: '🧑‍🎨',
    route: '/create',
    description: 'ركّب شخصية وزيّنها بالملصقات والألوان.',
  };

  render() { this.root = document.createElement('div'); this.root.className = 'cs-host'; return this.root; }

  async onMount() {
    const base = new URL('./content/', import.meta.url).href;
    this.content = new ContentManager({ base });
    await this.content.init({ catalog: 'stickers.catalog.json' });
    await this.content.loadPack('studio-stickers');
    this.app = new CreativeStudio({ mount: this.root, content: this.content });
    this.app.mount();

    const catalog = await (await fetch(new URL('catalog.json', base))).json();
    this.app.setCharacters(catalog.characters, (c) => this.app.loadCharacter(new URL(c.url, base).href));
    this.app.loadStickers(this.content.filter({ assetType: 'sticker' }).toArray());
    if (catalog.characters?.[0]) await this.app.loadCharacter(new URL(catalog.characters[0].url, base).href);
  }

  async onUnmount() { this.app?.destroy?.(); this.app = null; this.content = null; }
}
