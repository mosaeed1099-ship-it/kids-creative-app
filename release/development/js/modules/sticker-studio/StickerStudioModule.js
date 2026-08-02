/**
 * StickerStudioModule.js — Phase 14 entry point. Replaces the /stickers
 * placeholder with the full Sticker Studio. A normal feature Module (extends
 * core/Module); the router/lazy-loader mount it unchanged. The studio lives in
 * StickerStudioApp and consumes only the Canvas Engine, Content Engine and UI
 * public APIs.
 */
import Module from '../../core/Module.js';
import StickerStudioApp from './StickerStudioApp.js';

export default class StickerStudioModule extends Module {
  static meta = {
    id: 'stickers',
    title: 'الملصقات',
    icon: '⭐',
    route: '/stickers',
    description: 'ألصق شخصيات وأشكالًا على لوحاتك — بدون إنترنت.',
  };

  render() {
    this.root = document.createElement('div');
    this.root.className = 'ss-host';
    return this.root;
  }

  async onMount() {
    this.app = new StickerStudioApp({ mount: this.root, ctx: this.ctx });
    await this.app.mount();
  }

  async onUnmount() {
    this.app?.destroy();
    this.app = null;
  }
}
