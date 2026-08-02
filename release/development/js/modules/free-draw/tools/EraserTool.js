/** EraserTool — removes pixels from the active layer (destination-out). */
import BaseBrushTool from './BaseBrushTool.js';
export default class EraserTool extends BaseBrushTool {
  constructor(app) { super(app, 'eraser', 'eraser'); }
}
