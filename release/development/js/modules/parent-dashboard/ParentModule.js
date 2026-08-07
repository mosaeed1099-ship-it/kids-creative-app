/**
 * ParentModule.js — wires the Parent Dashboard into a (hidden) route. Not a kids
 * activity tile: reachable at #/parents. Shows child profiles + progress; reads
 * from localStorage and resolves content names via the Content Engine. No demo
 * seeding (unlike the example) — starts from the real profile state.
 */
import Module from '../../core/Module.js';
import ParentDashboard from './index.js';
import { ContentManager } from '../../content/index.js';

export default class ParentModule extends Module {
  static meta = {
    id: 'parents',
    title: 'لوحة الأهل',
    icon: '👪',
    route: '/parents',
    description: 'متابعة تقدّم الأطفال وإدارة الملفات.',
  };

  render() { this.root = document.createElement('div'); this.root.className = 'pd-host'; return this.root; }

  async onMount() {
    const base = new URL('../coloring-library/content/', import.meta.url).href;
    this.content = new ContentManager({ base });
    try { await this.content.init({ catalog: 'catalog.json' }); await this.content.loadAll(); } catch { /* names optional */ }
    const totalPages = this.content.filter({ assetType: 'coloring' }).length || 44;
    this.app = new ParentDashboard({ mount: this.root, options: { content: this.content, totalPages } });
    this.app.mount();
  }

  async onUnmount() { this.app?.destroy?.(); this.app = null; this.content = null; }
}
