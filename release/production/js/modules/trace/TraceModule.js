/**
 * TraceModule.js — FEATURE PLACEHOLDER.
 * Trace-a-reference experience will live here later. Inherits the default
 * placeholder view from Module for now.
 */
import Module from '../../core/Module.js';

export default class TraceModule extends Module {
  static meta = {
    id: 'trace',
    title: 'ارسم وقلّد',
    icon: '🖼️',
    route: '/trace',
    description: 'قلّد نموذجًا يظهر خفيفًا خلف اللوحة وتمشّى عليه.',
  };
}
