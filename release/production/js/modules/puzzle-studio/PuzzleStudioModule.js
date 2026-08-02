/**
 * PuzzleStudioModule.js — Phase 15 entry point. Replaces the /puzzles
 * placeholder with the full Puzzle Studio. A normal feature Module (extends
 * core/Module); the router/lazy-loader mount it unchanged. The studio lives in
 * PuzzleStudioApp and consumes only the Canvas Engine, Content Engine and UI
 * public APIs.
 */
import Module from '../../core/Module.js';
import PuzzleStudioApp from './PuzzleStudioApp.js';

export default class PuzzleStudioModule extends Module {
  static meta = {
    id: 'puzzles',
    title: 'الألغاز',
    icon: '🧩',
    route: '/puzzles',
    description: 'ركّب القطع وكوّن الصورة — ألغاز من صور جميلة، بدون إنترنت.',
  };

  render() {
    this.root = document.createElement('div');
    this.root.className = 'pz-host';
    return this.root;
  }

  async onMount() {
    this.app = new PuzzleStudioApp({ mount: this.root, ctx: this.ctx });
    await this.app.mount();
  }

  async onUnmount() {
    this.app?.destroy();
    this.app = null;
  }
}
