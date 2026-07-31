/**
 * ImagePartObject — a character part backed by an SVG image (already loaded and
 * cached by CharacterLoader). Drawn centered; flip/scale/rotation come from the
 * base MovableObject transform.
 */
import MovableObject from './MovableObject.js';

export default class ImagePartObject extends MovableObject {
  constructor(props = {}) {
    super({ ...props, type: 'part' });
    this.image = props.image || null;
    this.src = props.src || null;
    if (this.image) this.setNatural(this.image.naturalWidth || this.image.width, this.image.naturalHeight || this.image.height);
    if (props.natW) this.setNatural(props.natW, props.natH);
  }

  setImage(image, src) {
    this.image = image; this.src = src;
    this.setNatural(image.naturalWidth || image.width, image.naturalHeight || image.height);
    return this;
  }

  drawContent(ctx) {
    if (this.image) ctx.drawImage(this.image, -this.natW / 2, -this.natH / 2, this.natW, this.natH);
  }
}
