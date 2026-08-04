/**
 * index.js — public barrel for the Puzzle Studio module.
 */
import PuzzleStudioModule from './PuzzleStudioModule.js';

export default PuzzleStudioModule;
export { PuzzleStudioModule };
export { default as PuzzleStudioApp } from './PuzzleStudioApp.js';
export { default as PuzzleModel } from './puzzle/PuzzleModel.js';
export { default as PieceObject } from './puzzle/PieceObject.js';
export { default as PieceTool } from './interaction/PieceTool.js';
export { default as History } from './history/History.js';
export * as jigsaw from './puzzle/jigsaw.js';
export * as exportImage from './io/exportImage.js';
