// Writes the small study-screen-like PNGs the E2E tests paste: node tests/fixtures/make-png.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

function crc(buf) {
  let c = ~0;
  for (const x of buf) {
    c ^= x;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
}
function png(w, h, lines) {
  const raw = Buffer.alloc((w * 3 + 1) * h, 255);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    const ink = lines.some(([a, b]) => y >= a && y < b);
    for (let x = 0; x < w; x++) {
      if (!ink || x < 24 || x > w - 60) continue;
      const i = y * (w * 3 + 1) + 1 + x * 3;
      raw[i] = 26;
      raw[i + 1] = 34;
      raw[i + 2] = 51;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const here = new URL('.', import.meta.url);
writeFileSync(new URL('capture.png', here), png(640, 400, [[40, 64], [100, 116], [140, 156], [200, 216], [260, 276]]));
writeFileSync(new URL('tiny.png', here), png(24, 24, []));
