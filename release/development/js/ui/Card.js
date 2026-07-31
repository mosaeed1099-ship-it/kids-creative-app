/**
 * Card.js — reusable rounded card (Phase 2 UI foundation).
 *
 *   new Card({ icon:'🎨', title:'التلوين', body:'...', color:'#ff6b9d',
 *              href:'#/coloring', interactive:true }).el
 *
 * If `href` is given the card renders as a link; otherwise a div.
 */
import Component from './Component.js';
import { el } from '../utils/dom.js';

export default class Card extends Component {
  render() {
    const {
      icon = null, title = '', body = '', color = null,
      href = null, interactive = false, gradient = false, children = null,
      onClick = null,
    } = this.props;

    const classes = ['ui-card'];
    if (interactive || href) classes.push('ui-card--interactive');
    if (gradient) classes.push('ui-card--gradient');

    const content = [];
    if (icon || title) {
      content.push(el('div', { class: 'ui-card__header' }, [
        icon ? el('div', { class: 'ui-card__icon', text: icon }) : null,
        title ? el('h3', { class: 'ui-card__title', text: title }) : null,
      ]));
    }
    if (body) content.push(el('div', { class: 'ui-card__body', text: body }));
    if (children) content.push(children);

    const props = {
      class: classes.join(' '),
      style: color ? { '--card-color': color } : {},
      on: onClick ? { click: onClick } : {},
    };
    if (href) props.href = href;

    const node = el(href ? 'a' : 'div', props, content);
    this.el = node;
    return node;
  }
}
