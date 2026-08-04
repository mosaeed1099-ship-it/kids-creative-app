/**
 * ShapeObject.js — a geometric shape, rendered by REUSING Free Draw Studio's
 * shape geometry (paintShape) — no duplicated shape-drawing logic.
 */
import StoryObject from './StoryObject.js';
import { paintShape } from '../../free-draw/shapes/shapeGeometry.js';

export default class ShapeObject extends StoryObject {
  constructor(props = {}) {
    super({ ...props, type: 'shape', width: props.width || 240, height: props.height || 180 });
    this.shape = props.shape || 'rectangle';
    this.fill = props.fill ?? '#ffd93b';
    this.stroke = props.stroke ?? '#2b2b3a';
    this.strokeWidth = props.strokeWidth ?? 6;
    this.sides = props.sides || 6;
  }

  drawContent(ctx) {
    const m = this.strokeWidth / 2 + 1;
    paintShape(ctx, {
      shape: this.shape,
      from: { x: m, y: m }, to: { x: this.width - m, y: this.height - m },
      stroke: this.stroke, fill: this.fill, strokeWidth: this.strokeWidth, opacity: 1,
      sides: this.sides, spikes: 5,
    });
  }

  serialize() {
    return { ...this.baseSerialize(), shape: this.shape, fill: this.fill, stroke: this.stroke, strokeWidth: this.strokeWidth, sides: this.sides, width: Math.round(this.width), height: Math.round(this.height) };
  }
}
