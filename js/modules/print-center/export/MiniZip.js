/**
 * MiniZip — a tiny, dependency-free ZIP writer using the STORE method (no
 * compression). Bundles PNG page images into a single downloadable .zip. 100%
 * offline. ("Download ZIP if available locally" — this makes it always
 * available with no external library.)
 */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function u16(n) { return new Uint8Array([n & 0xff, (n >>> 8) & 0xff]); }
function u32(n) { return new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]); }
function nameBytes(s) { return new TextEncoder().encode(s); }

export default class MiniZip {
  /** @param {Array<{name:string, bytes:Uint8Array}>} files @returns {Blob} */
  static build(files) {
    const parts = [];
    const central = [];
    let offset = 0;
    const push = (u8) => { parts.push(u8); offset += u8.length; };

    const records = files.map((f) => {
      const name = nameBytes(f.name);
      const crc = crc32(f.bytes);
      const size = f.bytes.length;
      const localOffset = offset;

      // local file header
      push(u32(0x04034b50)); push(u16(20)); push(u16(0)); push(u16(0)); // sig, ver, flags, method(store=0)
      push(u16(0)); push(u16(0));                                       // time, date
      push(u32(crc)); push(u32(size)); push(u32(size));                 // crc, comp size, uncomp size
      push(u16(name.length)); push(u16(0));                             // name len, extra len
      push(name); push(f.bytes);

      return { name, crc, size, localOffset };
    });

    const cdStart = offset;
    for (const r of records) {
      const c = [];
      const cp = (u8) => c.push(u8);
      cp(u32(0x02014b50)); cp(u16(20)); cp(u16(20)); cp(u16(0)); cp(u16(0)); // sig, verMade, verNeed, flags, method
      cp(u16(0)); cp(u16(0));                                               // time, date
      cp(u32(r.crc)); cp(u32(r.size)); cp(u32(r.size));                     // crc, sizes
      cp(u16(r.name.length)); cp(u16(0)); cp(u16(0));                       // name, extra, comment len
      cp(u16(0)); cp(u16(0)); cp(u32(0));                                   // disk, int attr, ext attr
      cp(u32(r.localOffset));                                               // local header offset
      cp(r.name);
      central.push(...c);
    }
    const cdBytes = concat(central);
    push(cdBytes);
    const cdSize = cdBytes.length;

    // end of central directory
    push(u32(0x06054b50)); push(u16(0)); push(u16(0));
    push(u16(files.length)); push(u16(files.length));
    push(u32(cdSize)); push(u32(cdStart)); push(u16(0));

    return new Blob(parts, { type: 'application/zip' });
  }
}

function concat(arrs) {
  let len = 0; arrs.forEach((a) => { len += a.length; });
  const out = new Uint8Array(len); let o = 0; arrs.forEach((a) => { out.set(a, o); o += a.length; });
  return out;
}
