/**
 * AdminCMSModule.js — Phase 17A entry point. Wires the offline Content
 * Management System at /admin. A normal feature Module (extends core/Module);
 * the router/lazy-loader mount it unchanged.
 */
import Module from '../../core/Module.js';
import AdminCMSApp from './AdminCMSApp.js';

export default class AdminCMSModule extends Module {
  static meta = {
    id: 'admin',
    title: 'إدارة المحتوى',
    icon: '🗂️',
    route: '/admin',
    description: 'محرّر المحتوى لإنشاء بيانات المشروع (يعمل دون إنترنت).',
  };

  render() {
    this.root = document.createElement('div');
    this.root.className = 'cms-host';
    return this.root;
  }

  async onMount() {
    this.app = new AdminCMSApp({ mount: this.root, ctx: this.ctx });
    this.app.mount();
  }

  async onUnmount() {
    this.app?.destroy();
    this.app = null;
  }
}
