/**
 * index.js — public barrel for the Free Draw Studio module.
 *
 *   import FreeDrawModule from '../modules/free-draw/index.js';   // default (the Module)
 *   import { FreeDrawApp, StrokeRenderer } from '../modules/free-draw/index.js';
 */
import FreeDrawModule from './FreeDrawModule.js';

export default FreeDrawModule;
export { FreeDrawModule };
export { default as FreeDrawApp } from './FreeDrawApp.js';
export { default as Document } from './document/Document.js';
export { default as RasterLayer } from './layers/RasterLayer.js';
export { default as MarkHistory } from './history/MarkHistory.js';
export { default as ColorManager } from './color/ColorManager.js';
export { default as Settings } from './state/Settings.js';
export { default as SelectionController } from './tools/SelectionController.js';
export { default as NavigationController } from './view/NavigationController.js';
export * as strokeRenderer from './brushes/strokeRenderer.js';
export { PROFILES, BRUSH_ORDER } from './brushes/brushProfiles.js';
export { SHAPES } from './shapes/shapeGeometry.js';
