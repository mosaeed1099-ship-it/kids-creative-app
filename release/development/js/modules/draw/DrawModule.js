/**
 * DrawModule.js — FEATURE PLACEHOLDER.
 * Free-drawing canvas will live here later. Inherits the default placeholder
 * view from Module for now.
 */
import Module from '../../core/Module.js';

export default class DrawModule extends Module {
  static meta = {
    id: 'draw',
    title: 'الرسم الحر',
    icon: '✏️',
    route: '/draw',
    description: 'ارسم بنفسك بالفرشاة والألوان على لوحة فاضية.',
  };
}
