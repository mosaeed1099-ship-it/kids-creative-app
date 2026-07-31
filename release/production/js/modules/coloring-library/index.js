/**
 * index.js — public barrel for the Coloring Library module.
 *
 *   import ColoringLibrary, { ColoringLauncher } from '../modules/coloring-library/index.js';
 */
import ColoringLibrary from './ColoringLibrary.js';

export default ColoringLibrary;
export { ColoringLibrary };
export { default as ColoringLauncher } from './ColoringLauncher.js';
export { default as LibraryModel } from './LibraryModel.js';
export { default as LazyThumb } from './LazyThumb.js';
