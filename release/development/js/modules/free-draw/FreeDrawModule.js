/**
 * FreeDrawModule.js — Phase 13 entry point. Replaces the old /draw placeholder
 * with the full Free Draw Studio. It is a normal feature Module (extends the
 * core Module/View), so the router + lazy-loader mount it unchanged; the studio
 * itself lives in FreeDrawApp and consumes only the engine + UI public APIs.
 */
import Module from '../../core/Module.js';
import FreeDrawApp from './FreeDrawApp.js';

export default class FreeDrawModule extends Module {
  static meta = {
    id: 'draw',
    title: 'الرسم الحر',
    icon: '✏️',
    route: '/draw',
    description: 'ارسم بحرية: فُرَش وألوان وأشكال وطبقات — بدون إنترنت.',
  };

  /** Host element the studio mounts into (the studio itself is full-screen). */
  render() {
    this.root = document.createElement('div');
    this.root.className = 'fd-host';
    return this.root;
  }

  async onMount() {
    this.app = new FreeDrawApp({ mount: this.root, ctx: this.ctx });
    this.app.mount();
  }

  async onUnmount() {
    this.app?.destroy();
    this.app = null;
  }
}
