/**
 * EraserTool — removes paint (destination-out) with a slightly larger radius.
 * It erases only the paint layer; the black outline is never affected.
 */
import StrokeTool from './StrokeTool.js';

export default class EraserTool extends StrokeTool {
  constructor(app) { super('eraser', app, { erase: true, sizeFactor: 1.4 }); }
}
