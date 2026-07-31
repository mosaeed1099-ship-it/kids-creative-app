/**
 * PencilTool — thin, precise freehand paint (a fraction of the brush size).
 */
import StrokeTool from './StrokeTool.js';

export default class PencilTool extends StrokeTool {
  constructor(app) { super('pencil', app, { erase: false, sizeFactor: 0.35 }); }
}
