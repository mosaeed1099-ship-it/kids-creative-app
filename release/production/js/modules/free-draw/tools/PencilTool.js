/** PencilTool — thin, hard, lightly-textured line. */
import BaseBrushTool from './BaseBrushTool.js';
export default class PencilTool extends BaseBrushTool {
  constructor(app) { super(app, 'pencil', 'pencil'); }
}
