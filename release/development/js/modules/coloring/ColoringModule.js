/**
 * ColoringModule.js — FEATURE PLACEHOLDER.
 * The coloring experience will be implemented here later. For now it only
 * declares its metadata and inherits the default placeholder view from the
 * base Module, which proves the lazy-loader/router wiring works.
 *
 * When implemented, override render()/onMount()/onUnmount() — nothing else
 * in the app needs to change.
 */
import Module from '../../core/Module.js';

export default class ColoringModule extends Module {
  static meta = {
    id: 'coloring',
    title: 'التلوين',
    icon: '🎨',
    route: '/coloring',
    description: 'لوّن الرسمات بالنقر، أضف إكسسوارات، واحفظ أعمالك.',
  };
}
