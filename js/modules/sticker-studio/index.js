/**
 * index.js — public barrel for the Sticker Studio module.
 *
 *   import StickerStudioModule from '../modules/sticker-studio/index.js';
 *   import { StickerStudioApp, StickerObject } from '../modules/sticker-studio/index.js';
 */
import StickerStudioModule from './StickerStudioModule.js';

export default StickerStudioModule;
export { StickerStudioModule };
export { default as StickerStudioApp } from './StickerStudioApp.js';
export { default as StickerObject } from './scene/StickerObject.js';
export { default as StickerTool } from './interaction/StickerTool.js';
export { default as SnapEngine } from './interaction/SnapEngine.js';
export { default as History } from './history/History.js';
export { default as Storage } from './io/Storage.js';
export * as exportImage from './io/exportImage.js';
