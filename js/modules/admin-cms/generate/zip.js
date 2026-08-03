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

export function crc32(bytes) {
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

/**
 * Parse a ZIP (store method) and verify every entry's CRC. Used to validate the
 * produced release archive (Phase 17B). Returns { count, entries:[{name,size,crcOk}] }.
 */
export function readZip(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const dec = new TextDecoder();
  // locate End Of Central Directory (scan from the end for its signature)
  let p = bytes.length - 22;
  for (; p >= 0; p--) if (dv.getUint32(p, true) === 0x06054b50) break;
  if (p < 0) throw new Error('EOCD not found');
  const count = dv.getUint16(p + 10, true);
  let cd = dv.getUint32(p + 16, true);
  const entries = [];
  for (let i = 0; i < count; i++) {
    if (dv.getUint32(cd, true) !== 0x02014b50) throw new Error('bad central header');
    const crc = dv.getUint32(cd + 16, true);
    const compSize = dv.getUint32(cd + 20, true);
    const nameLen = dv.getUint16(cd + 28, true);
    const extraLen = dv.getUint16(cd + 30, true);
    const commentLen = dv.getUint16(cd + 32, true);
    const localOff = dv.getUint32(cd + 42, true);
    const name = dec.decode(bytes.subarray(cd + 46, cd + 46 + nameLen));
    if (dv.getUint32(localOff, true) !== 0x04034b50) throw new Error('bad local header');
    const lNameLen = dv.getUint16(localOff + 26, true);
    const lExtraLen = dv.getUint16(localOff + 28, true);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const data = bytes.subarray(dataStart, dataStart + compSize);
    entries.push({ name, size: compSize, crcOk: crc32(data) === crc, data });
    cd += 46 + nameLen + extraLen + commentLen;
  }
  return { count, entries };
}
