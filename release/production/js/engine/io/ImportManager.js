/**
 * ImportManager — bring pixels or scene data INTO the engine.
 *
 *  - image(src|File): load an <img>/ImageBitmap ready to draw.
 *  - fromJSON(json, factory): rebuild a scene previously produced by
 *    ExportManager.toJSON(). `factory(objData)` maps a serialized object to a
 *    concrete SceneObject subclass (provided by the module).
 */
export default class ImportManager {
  constructor({ engine } = {}) {
    this.engine = engine;
  }

  /** Load an image from a URL, data URL, Blob or File. Resolves an HTMLImageElement. */
  image(source) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('ImportManager: failed to load image'));
      img.src = (source instanceof Blob) ? URL.createObjectURL(source) : source;
    });
  }

  /** Read a File (e.g. from an <input type=file>) as a data URL. */
  fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(file);
    });
  }

  /**
   * Rebuild a scene from JSON.
   * @param {object} json - shape produced by ExportManager.toJSON()
   * @param {(data:object)=>import('../scene/SceneObject.js').default} factory
   */
  fromJSON(json, factory) {
    if (!json || !Array.isArray(json.layers)) return;
    const { layers } = this.engine;
    layers.clear();
    // remove default extras: keep it simple — recreate declared layers
    layers.layers = [];
    for (const l of json.layers) {
      const layer = layers.create({ id: l.id, name: l.name, zIndex: l.zIndex, visible: l.visible, opacity: l.opacity });
      for (const od of (l.objects || [])) {
        const obj = factory ? factory(od) : null;
        if (obj) layer.add(obj);
      }
    }
    if (json.camera) this.engine.camera.fromJSON(json.camera);
    this.engine.invalidate();
  }
}
