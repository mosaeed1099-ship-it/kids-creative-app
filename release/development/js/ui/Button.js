/**
 * Button.js — reusable button component (Phase 2 UI foundation).
 * Declarative, themeable, and used later by feature toolbars/dialogs.
 *
 *   new Button({ label:'حفظ', emoji:'💾', variant:'success', size:'lg',
 *                onClick:() => {...} }).el
 *
 * Variants: primary | accent | success | danger | ghost
 * Sizes:    sm | md | lg   ·  modifiers: block, pill, icon
 */
import Component from './Component.js';
import { el } from '../utils/dom.js';

export default class Button extends Component {
  render() {
    const {
      label = '', emoji = null, variant = 'primary', size = 'md',
      block = false, pill = true, icon = false, disabled = false,
      type = 'button', onClick = null, ariaLabel = null,
    } = this.props;

    const classes = ['ui-btn', `ui-btn--${variant}`];
    if (size !== 'md') classes.push(`ui-btn--${size}`);
    if (block) classes.push('ui-btn--block');
    if (pill) classes.push('ui-btn--pill');
    if (icon) classes.push('ui-btn--icon');

    const children = [];
    if (emoji) children.push(el('span', { class: 'ui-btn__emoji', text: emoji }));
    if (label) children.push(el('span', { text: label }));

    const btn = el('button', {
      class: classes.join(' '),
      attrs: { type, 'aria-label': ariaLabel || label || undefined, ...(disabled ? { disabled: 'true' } : {}) },
      on: onClick ? { click: onClick } : {},
    }, children);

    this.el = btn;
    return btn;
  }

  setDisabled(v) {
    if (this.el) this.el.toggleAttribute('disabled', !!v);
  }
}
