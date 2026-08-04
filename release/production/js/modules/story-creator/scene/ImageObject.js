/**
 * ImageObject.js — an imported local image. Supports resize/rotate/flip/layer
 * (via the base transform) and a crop rectangle (in natural-image pixels).
 */
import StoryObject from './StoryObject.js';

export default class ImageObject extends StoryObject {
  constructor(props = {}, img = null) {
    super({ ...props, type: 'image' });
    this.img = img;
    this.src = props.src || null;
    this.natW = props.natW || (img ? img.naturalWidth : 100);
    this.natH = props.natH || (img ? img.naturalHeight : 100);
    this.crop = props.crop || null; // {x,y,w,h} in natural pixels
    this.width = props.width || (img ? img.naturalWidth : 200);
    this.height = props.height || (img ? img.naturalHeight : 150);
  }

  drawContent(ctx) {
    if (!this.img) return;
    const cr = this.crop;
    if (cr) ctx.drawImage(this.img, cr.x, cr.y, cr.w, cr.h, 0, 0, this.width, this.height);
    else ctx.drawImage(this.img, 0, 0, this.width, this.height);
  }

  serialize() {
    return { ...this.baseSerialize(), src: this.src, natW: this.natW, natH: this.natH, crop: this.crop, width: Math.round(this.width), height: Math.round(this.height) };
  }
}
