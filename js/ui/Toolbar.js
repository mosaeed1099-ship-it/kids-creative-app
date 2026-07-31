/**
 * Toolbar.js — reusable horizontal action bar (Phase 2 UI foundation).
 * Feature screens (coloring palette, drawing tools) will compose their
 * controls into a Toolbar later.
 *
 *   const tb = new Toolbar({ title:'الأدوات' });
 *   tb.addItem(new Button({...}).el);
 *   tb.addSpacer();
 *   tb.addItem(node);
 *   parent.appendChild(tb.render());
 */
import Component from './Component.js';
import { el } from '../utils/dom.js';

export default class Toolbar extends Component {
  render() {
    const { title = null, block = false } = this.props;
    const classes = ['ui-toolbar'];
    if (block) classes.push('ui-toolbar--block');

    this._bar = el('div', { class: classes.join(' ') });
    if (title) this._bar.appendChild(el('span', { class: 'ui-toolbar__title', text: title }));

    this.el = this._bar;
    return this._bar;
  }

  _ensure() { if (!this._bar) this.render(); return this._bar; }

  addItem(node) { this._ensure().appendChild(node); return this; }
  addGroup(nodes = []) {
    const g = el('div', { class: 'ui-toolbar__group' }, nodes);
    this._ensure().appendChild(g);
    return this;
  }
  addDivider() { this._ensure().appendChild(el('div', { class: 'ui-toolbar__divider' })); return this; }
  addSpacer() { this._ensure().appendChild(el('div', { class: 'ui-toolbar__spacer' })); return this; }
}
