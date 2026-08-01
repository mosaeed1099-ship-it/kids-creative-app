/**
 * StoryCreatorModule.js — Phase 16 entry point. Replaces the /story placeholder
 * with the full Story Creator. A normal feature Module (extends core/Module);
 * the router/lazy-loader mount it unchanged. The studio lives in StoryCreatorApp
 * and consumes only the Canvas Engine, Content Engine, Sticker Studio and Free
 * Draw Studio public APIs.
 */
import Module from '../../core/Module.js';
import StoryCreatorApp from './StoryCreatorApp.js';

export default class StoryCreatorModule extends Module {
  static meta = {
    id: 'story',
    title: 'قصتي',
    icon: '📖',
    route: '/story',
    description: 'كوّن قصة بالصور والكلمات والملصقات والرسم — بدون إنترنت.',
  };

  render() {
    this.root = document.createElement('div');
    this.root.className = 'st-host';
    return this.root;
  }

  async onMount() {
    this.app = new StoryCreatorApp({ mount: this.root, ctx: this.ctx });
    await this.app.mount();
  }

  async onUnmount() {
    this.app?.destroy();
    this.app = null;
  }
}
