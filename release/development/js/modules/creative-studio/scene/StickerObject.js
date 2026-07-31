/**
 * StickerObject — an emoji sticker added from the Content Engine. Fully
 * movable/rotatable/scalable/deletable like any part. Rendered as canvas text.
 */
import MovableObject from './MovableObject.js';

export default class StickerObject extends MovableObject {
  constructor(props = {}) {
    super({ ...props, type: 'sticker', kind: props.kind || 'sticker' });
    this.emoji = props.emoji || '⭐';
    const size = props.size || props.natW || 120;
    this.setNatural(size, size);
  }

  drawContent(ctx) {
    ctx.font = `${this.natH}px "Noto Color Emoji","Segoe UI Emoji",system-ui,sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.emoji, 0, 2);
  }
}
