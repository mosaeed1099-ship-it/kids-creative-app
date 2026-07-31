/**
 * StateCommand — undo/redo for the whole character. Stores a serialized scene
 * snapshot BEFORE and AFTER an edit (move/scale/rotate/flip/z-order/duplicate/
 * delete/expression/add-sticker/reset). Restoring rebuilds parts from cached
 * images, so it is synchronous. Uses the engine's ICommand contract.
 */
import { ICommand } from '../../../engine/index.js';

export default class StateCommand extends ICommand {
  constructor(scene, before, after, onChange = null, label = 'edit') {
    super(label);
    this.scene = scene;
    this.before = before;
    this.after = after;
    this.onChange = onChange;
  }
  execute() { this.scene.restore(this.after); this.onChange?.(); }
  undo() { this.scene.restore(this.before); this.onChange?.(); }
}
