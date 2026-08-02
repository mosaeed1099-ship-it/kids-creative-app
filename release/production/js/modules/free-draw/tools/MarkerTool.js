/** MarkerTool — translucent felt-tip that multiplies where strokes overlap. */
import BaseBrushTool from './BaseBrushTool.js';
export default class MarkerTool extends BaseBrushTool {
  constructor(app) { super(app, 'marker', 'marker'); }
}
