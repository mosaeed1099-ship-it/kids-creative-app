/**
 * Page.js — base class for static pages (dashboard, settings, 404).
 * A Page is just a View with a semantic name; it shares the exact same
 * mount/unmount lifecycle so the Router treats pages and modules alike.
 */
import View from '../core/View.js';

export default class Page extends View {
  static pageId = 'page';
}
