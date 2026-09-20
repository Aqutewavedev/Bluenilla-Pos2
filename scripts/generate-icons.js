import fs from 'fs';
import zlib from 'zlib';

function createSolidPng(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8 bit depth
  ihdr.writeUInt8(2, 9); // Truecolor (RGB)
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT: Scanlines
  // Each scanline begins with filter type 0 (None)
  const lineBytes = 1 + width * 3;
  const rawData = Buffer.alloc(lineBytes * height);
  for (let y = 0; y < height; y++) {
    const offset = y * lineBytes;
    rawData[offset] = 0; // Filter byte
    for (let x = 0; x < width; x++) {
      const pOffset = offset + 1 + x * 3;
      // Draw a nice subtle gradient or centered glyph
      const distFromCenter = Math.hypot(x - width / 2, y - height / 2);
      const isInner = distFromCenter < width * 0.35;
      if (isInner) {
        rawData[pOffset] = 99;     // indigo-500
        rawData[pOffset + 1] = 102;
        rawData[pOffset + 2] = 241;
      } else {
        rawData[pOffset] = r;
        rawData[pOffset + 1] = g;
        rawData[pOffset + 2] = b;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crcData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(crcData);
  chunk.writeInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 implementation
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff];
  }
  return (c ^ 0xffffffff) | 0;
}

const table = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  table[n] = c;
}

// Generate files
const p192 = createSolidPng(192, 192, 15, 23, 42); // slate-900 base
const p512 = createSolidPng(512, 512, 15, 23, 42);
const apple = createSolidPng(180, 180, 30, 27, 75);

fs.writeFileSync('public/pwa-192x192.png', p192);
fs.writeFileSync('public/pwa-512x512.png', p512);
fs.writeFileSync('public/pwa-maskable-512x512.png', p512);
fs.writeFileSync('public/apple-touch-icon.png', apple);

console.log('PWA PNG Icons successfully generated in public/ folder.');
