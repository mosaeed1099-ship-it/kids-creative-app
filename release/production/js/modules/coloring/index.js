/**
 * index.js — public barrel for the Coloring module.
 *
 *   import ColoringApp from '../modules/coloring/index.js';
 *   // or granular pieces:
 *   import { PaintSurface, BucketFillTool } from '../modules/coloring/index.js';
 */
import ColoringApp from './ColoringApp.js';

export default ColoringApp;
export { ColoringApp };

export { default as PaintSurface } from './surface/PaintSurface.js';
export { default as ArtworkObject } from './surface/ArtworkObject.js';
export { default as PaintCommand } from './surface/PaintCommand.js';
export { default as ColorManager } from './color/ColorManager.js';
export { default as ProgressManager } from './progress/ProgressManager.js';
export { default as ColoringUI } from './ui/ColoringUI.js';
export { default as BucketFillTool } from './tools/BucketFillTool.js';
export { default as StrokeTool } from './tools/StrokeTool.js';
export { default as BrushTool } from './tools/BrushTool.js';
export { default as PencilTool } from './tools/PencilTool.js';
export { default as EraserTool } from './tools/EraserTool.js';
