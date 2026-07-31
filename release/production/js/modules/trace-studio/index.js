/**
 * index.js — public barrel for the Trace Studio module.
 *   import TraceStudio from '../modules/trace-studio/index.js';
 */
import TraceStudio from './TraceStudio.js';

export default TraceStudio;
export { TraceStudio };
export { default as TraceSurface } from './surface/TraceSurface.js';
export { default as ReferenceObject } from './surface/ReferenceObject.js';
export { default as ReferenceController } from './ReferenceController.js';
export { default as MoveReferenceTool } from './tools/MoveReferenceTool.js';
