/**
 * ColoringModule.js — the real Coloring experience (replaces the old
 * placeholder). Mounts the Coloring Library (browse packs → pick a page) wired
 * to the Coloring Launcher, which opens the full ColoringApp (bucket/brush/
 * pencil/eraser, undo/redo, autosave, export). It is a normal feature Module,
 * so the router + lazy-loader mount it unchanged. No coloring logic is
 * duplicated — this only wires existing public APIs (Content Engine + Library +
 * Launcher + ColoringApp).
 */
import Module from '../../core/Module.js';
import ColoringLibrary, { ColoringLauncher } from '../coloring-library/index.js';
import { ContentManager } from '../../content/index.js';

export default class ColoringModule extends Module {
  static meta = {
    id: 'coloring',
    title: 'التلوين',
    icon: '🎨',
    route: '/coloring',
    description: 'لوّن الرسمات بالنقر، أضف إكسسوارات، واحفظ أعمالك.',
  };

  render() {
    this.root = document.createElement('div');
    this.root.className = 'clr-host';
    return this.root;
  }

  async onMount() {
    // Content base resolves relative to this module regardless of deploy path.
    const base = new URL('../coloring-library/content/', import.meta.url).href;
    this.content = new ContentManager({ base });
    const resolveAsset = (item) => new URL(item.asset.src, base).href;

    this.launcher = new ColoringLauncher({ content: this.content, resolveAsset });
    this.library = new ColoringLibrary({
      mount: this.root,
      content: this.content,
      onOpen: (item) => this.launcher.open(item),
      options: { resolveThumb: resolveAsset, title: 'مكتبة التلوين' },
    });
    await this.library.mount();
  }

  async onUnmount() {
    this.launcher?.close?.();
    this.launcher = null;
    this.library = null;
    this.content = null;
  }
}
