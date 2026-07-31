/**
 * BrushTool — thick, soft freehand paint at the current brush size.
 */
import StrokeTool from './StrokeTool.js';

export default class BrushTool extends StrokeTool {
  constructor(app) { super('brush', app, { erase: false, sizeFactor: 1 }); }
}
