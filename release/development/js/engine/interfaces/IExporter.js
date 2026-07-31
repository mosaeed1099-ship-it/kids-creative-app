/**
 * IExporter — optional contract for pluggable export formats beyond the
 * built-in PNG/JPEG/JSON (e.g. SVG, PDF). Register custom exporters on a module
 * and delegate to them; the engine's ExportManager covers raster + JSON.
 */
export default class IExporter {
  /** @param {string} id  @param {string} [mime] */
  constructor(id, mime = 'application/octet-stream') {
    this.id = id;
    this.mime = mime;
  }

  /**
   * Produce output from the engine.
   * @param {import('../CanvasEngine.js').default} engine
   * @param {object} options
   * @returns {Promise<Blob|string>|Blob|string}
   */
  export(/* engine, options */) {
    throw new Error(`Exporter "${this.id}" must implement export()`);
  }
}
