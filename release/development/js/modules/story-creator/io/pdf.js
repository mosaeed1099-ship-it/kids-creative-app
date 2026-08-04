/**
 * pdf.js — a tiny, dependency-free PDF writer that embeds one full-page JPEG per
 * page (DCTDecode). Fully offline. Not a general PDF library — just enough to
 * turn rendered story pages into a downloadable multi-page PDF.
 *
 * Input pages: [{ jpeg: <binary string from atob>, pxW, pxH }]
 */
export function buildPdf(pages, { pageW = 720, pageH = 540 } = {}) {
  const N = pages.length;
  const bodies = [];
  const pageRefs = [];
  let num = 2; // objects 1 (catalog) + 2 (pages) reserved

  for (let i = 0; i < N; i++) {
    const pageNum = ++num, imgNum = ++num, contentNum = ++num;
    pageRefs.push(pageNum);
    const pg = pages[i];
    const content = `q ${pageW} 0 0 ${pageH} 0 0 cm /Im0 Do Q`;
    bodies.push({ num: pageNum, str: `${pageNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 ${imgNum} 0 R >> >> /Contents ${contentNum} 0 R >>\nendobj\n` });
    bodies.push({ num: imgNum, str: `${imgNum} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pg.pxW} /Height ${pg.pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.jpeg.length} >>\nstream\n${pg.jpeg}\nendstream\nendobj\n` });
    bodies.push({ num: contentNum, str: `${contentNum} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n` });
  }

  const catalog = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const pagesObj = `2 0 obj\n<< /Type /Pages /Kids [${pageRefs.map((n) => `${n} 0 R`).join(' ')}] /Count ${N} >>\nendobj\n`;
  bodies.sort((a, b) => a.num - b.num);
  const ordered = [{ num: 1, str: catalog }, { num: 2, str: pagesObj }, ...bodies];

  let pdf = '%PDF-1.4\n%\xff\xff\xff\xff\n';
  const offsets = {};
  for (const o of ordered) { offsets[o.num] = pdf.length; pdf += o.str; }

  const total = ordered.length + 1; // + free object 0
  const xrefStart = pdf.length;
  let xref = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let n = 1; n < total; n++) xref += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  pdf += xref;
  pdf += `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: 'application/pdf' });
}

/** Strip a JPEG data URL to its raw binary string (for embedding). */
export function jpegBinary(dataUrl) {
  return atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
}
