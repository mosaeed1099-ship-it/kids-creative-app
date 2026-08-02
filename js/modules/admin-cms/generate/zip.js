/**
 * zip.js — a tiny, dependency-free ZIP writer (store method, no compression).
 * Enough to bundle the deploy package (Phase 17A.1, C4) into a single download,
 * fully offline. Filenames are UTF-8 (flag bit 11 set).
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const enc = new TextEncoder();
const toBytes = (data) => (typeof data === 'string' ? enc.encode(data) : data);

function dosDateTime(d = new Date()) {
  const time = ((d.getHours() & 0x1f) << 11) | ((d.getMinutes() & 0x3f) << 5) | ((d.getSeconds() / 2) & 0x1f);
  const date = (((d.getFullYear() - 1980) & 0x7f) << 9) | (((d.getMonth() + 1) & 0xf) << 5) | (d.getDate() & 0x1f);
  return { time, date };
}

/**
 * @param {Array<{name:string, data:string|Uint8Array}>} files
 * @returns {Blob} a ZIP blob
 */
export function zipSync(files) {
  const { time, date } = dosDateTime();
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const dataBytes = toBytes(f.data);
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);   // local file header signature
    local.setUint16(4, 20, true);            // version needed
    local.setUint16(6, 0x0800, true);        // flags: UTF-8
    local.setUint16(8, 0, true);             // method: store
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, size, true);         // compressed size
    local.setUint32(22, size, true);         // uncompressed size
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);            // extra len
    chunks.push(new Uint8Array(local.buffer), nameBytes, dataBytes);

    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);      // central dir signature
    cen.setUint16(4, 20, true);              // version made by
    cen.setUint16(6, 20, true);              // version needed
    cen.setUint16(8, 0x0800, true);          // flags: UTF-8
    cen.setUint16(10, 0, true);              // method: store
    cen.setUint16(12, time, true);
    cen.setUint16(14, date, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, size, true);
    cen.setUint32(24, size, true);
    cen.setUint16(28, nameBytes.length, true);
    cen.setUint16(30, 0, true);              // extra len
    cen.setUint16(32, 0, true);              // comment len
    cen.setUint16(34, 0, true);              // disk number
    cen.setUint16(36, 0, true);              // internal attrs
    cen.setUint32(38, 0, true);              // external attrs
    cen.setUint32(42, offset, true);         // local header offset
    central.push(new Uint8Array(cen.buffer), nameBytes);

    offset += 30 + nameBytes.length + size;
  }

  const centralStart = offset;
  let centralSize = 0;
  for (const c of central) centralSize += c.length;

  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);        // end of central dir signature
  end.setUint16(4, 0, true);
  end.setUint16(6, 0, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, centralStart, true);
  end.setUint16(20, 0, true);                // comment len

  return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}
