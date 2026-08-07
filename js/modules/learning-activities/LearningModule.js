/**
 * LearningModule.js — wires the Learning Activities into a route. Mounts the
 * existing LearningActivities app with its Content Engine pack. Normal feature
 * Module; no logic duplicated.
 */
import Module from '../../core/Module.js';
import LearningActivities from './index.js';
import { ContentManager } from '../../content/index.js';

export default class LearningModule extends Module {
  static meta = {
    id: 'learning',
    title: 'أنشطة',
    icon: '🧠',
    route: '/learning',
    description: 'ألعاب وأنشطة تعليمية ممتعة: حروف وأرقام وأشكال ومتاهات.',
  };

  render() { this.root = document.createElement('div'); this.root.className = 'la-host'; return this.root; }

  async onMount() {
    const base = new URL('./content/', import.meta.url).href;
    this.content = new ContentManager({ base });
    await this.content.init({ catalog: 'catalog.json' });
    await this.content.loadPack('activities');
    this.app = new LearningActivities({ mount: this.root, content: this.content });
    this.app.mount();
  }

  async onUnmount() { this.app?.destroy?.(); this.app = null; this.content = null; }
}
