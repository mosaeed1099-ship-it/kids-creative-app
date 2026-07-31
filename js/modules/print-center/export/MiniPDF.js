/**
 * MiniPDF — a tiny, dependency-free PDF builder that embeds JPEG page images.
 * Each page is a pre-rendered full-page JPEG (already laid out with margins /
 * fit / color by PreviewRenderer), placed to fill the PDF MediaBox. 100%
 * offline — no libraries, no network.
 *
 * JPEG is embedded directly via the /DCTDecode filter (valid PDF image data).
 */
import { strBytes } from '../util.js';

const PAGE_PT = { A4: [595.28, 841.89], Letter: [612, 792] };

export default class MiniPDF {
  /**
   * @param {Array<{jpeg:Uint8Array,w:number,h:number}>} pages
   * @param {object} opts { pageSize:'A4'|'Letter', orientation:'portrait'|'landscape' }
   * @returns {Blob}
   */
  static build(pages, { pageSize = 'A4', orientation = 'portrait' } = {}) {
    let [pw, ph] = PAGE_PT[pageSize] || PAGE_PT.A4;
    if (orientation === 'landscape') [pw, ph] = [ph, pw];

    const chunks = []; let offset = 0;
    const push = (u8) => { chunks.push(u8); offset += u8.length; };
    const off = [];
    const writeObj = (num, body) => { off[num] = offset; push(strBytes(`${num} 0 obj\n`)); push(body); push(strBytes('\nendobj\n')); };

    push(strBytes('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));

    const N = 2 + pages.length * 3;
    const pageNums = pages.map((_, i) => 5 + i * 3);

    writeObj(1, strBytes('<< /Type /Catalog /Pages 2 0 R >>'));
    writeObj(2, strBytes(`<< /Type /Pages /Count ${pages.length} /Kids [${pageNums.map((n) => `${n} 0 R`).join(' ')}] >>`));

    pages.forEach((pg, i) => {
      const imgNum = 3 + i * 3, contentNum = 4 + i * 3, pageNum = 5 + i * 3;

      // image object (JPEG stream)
      off[imgNum] = offset;
      push(strBytes(`${imgNum} 0 obj\n`));
      push(strBytes(`<< /Type /XObject /Subtype /Image /Width ${pg.w} /Height ${pg.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.jpeg.length} >>\nstream\n`));
      push(pg.jpeg);
      push(strBytes('\nendstream\nendobj\n'));

      // content: place image to fill the whole page
      const content = `q\n${pw.toFixed(2)} 0 0 ${ph.toFixed(2)} 0 0 cm\n/Im0 Do\nQ\n`;
      const cb = strBytes(content);
      off[contentNum] = offset;
      push(strBytes(`${contentNum} 0 obj\n`));
      push(strBytes(`<< /Length ${cb.length} >>\nstream\n`));
      push(cb);
      push(strBytes('endstream\nendobj\n'));

      writeObj(pageNum, strBytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(2)} ${ph.toFixed(2)}] /Resources << /XObject << /Im0 ${imgNum} 0 R >> >> /Contents ${contentNum} 0 R >>`));
    });

    const xrefOffset = offset;
    let xref = `xref\n0 ${N + 1}\n0000000000 65535 f \n`;
    for (let n = 1; n <= N; n++) xref += `${String(off[n]).padStart(10, '0')} 00000 n \n`;
    push(strBytes(xref));
    push(strBytes(`trailer\n<< /Size ${N + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`));

    let len = 0; chunks.forEach((c) => { len += c.length; });
    const out = new Uint8Array(len); let o = 0; chunks.forEach((c) => { out.set(c, o); o += c.length; });
    return new Blob([out], { type: 'application/pdf' });
  }
}
