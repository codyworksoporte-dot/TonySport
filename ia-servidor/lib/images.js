// Image type and size detected from the bytes, never from the file name or MIME header.
import {MAX_PIXELS, MAX_SIDE} from './config.js';

const ascii = (bytes, start, length) => String.fromCharCode(...bytes.subarray(start, start + length));
const u16be = (b, i) => (b[i] << 8) | b[i + 1];
const u16le = (b, i) => b[i] | (b[i + 1] << 8);
const u24le = (b, i) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
const u32be = (b, i) => ((b[i] << 24) >>> 0) + ((b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]);

function pngSize(b) {
  if (b.length < 24 || ascii(b, 12, 4) !== 'IHDR') return null;
  return {width: u32be(b, 16), height: u32be(b, 20)};
}

function jpegSize(b) {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    let marker = b[i + 1];
    while (marker === 0xff && i + 2 < b.length) { i++; marker = b[i + 1]; }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    if (marker === 0xd9 || marker === 0xda) return null;
    const length = u16be(b, i + 2);
    if (length < 2) return null;
    const isFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isFrame) return {height: u16be(b, i + 5), width: u16be(b, i + 7)};
    i += 2 + length;
  }
  return null;
}

function webpSize(b) {
  if (b.length < 30) return null;
  const chunk = ascii(b, 12, 4);
  if (chunk === 'VP8 ' && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) return {width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff};
  if (chunk === 'VP8L' && b[20] === 0x2f) {
    return {width: 1 + (((b[22] & 0x3f) << 8) | b[21]), height: 1 + (((b[24] & 0x0f) << 10) | (b[23] << 2) | ((b[22] & 0xc0) >> 6))};
  }
  if (chunk === 'VP8X') return {width: 1 + u24le(b, 24), height: 1 + u24le(b, 27)};
  return null;
}

/** {mime, width, height} for a real PNG, JPEG or WebP; null otherwise. */
export function sniffImage(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 16) return null;
  let mime = '', size = null;
  if (bytes[0] === 0x89 && ascii(bytes, 1, 3) === 'PNG' && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    mime = 'image/png'; size = pngSize(bytes);
  } else if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    mime = 'image/jpeg'; size = jpegSize(bytes);
  } else if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    mime = 'image/webp'; size = webpSize(bytes);
  }
  if (!mime || !size) return null;
  const {width, height} = size;
  if (!width || !height || width > MAX_SIDE || height > MAX_SIDE || width * height > MAX_PIXELS) return null;
  return {mime, width, height};
}
