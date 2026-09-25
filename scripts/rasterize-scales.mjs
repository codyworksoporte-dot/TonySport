// Bitmap copies of the scale texture, drawn at 2x from the SVGs made by generate-scales.mjs.
// Tiling a WebP costs the GPU one image draw per tile; the SVG replays 600+ gradient-filled
// paths in every tile it rasterises, which made scrolling and the section change drop frames.
// Run after generate-scales.mjs: node scripts/rasterize-scales.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { SCALE_TILE } from '../lib/scale-pattern.ts';

const asset = name => new URL(`../public/assets/${name}`, import.meta.url);
const svg = name => `data:image/svg+xml;base64,${readFileSync(asset(name)).toString('base64')}`;

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage();
/** Draws the layers in order onto one tile of `size` px and encodes it as WebP. */
const encode = (layers, size) => page.evaluate(async ({ layers, size }) => {
  const canvas = Object.assign(document.createElement('canvas'), { width: size, height: size });
  const context = canvas.getContext('2d');
  for (const { src, alpha } of layers) {
    const image = new Image();
    image.src = src;
    await image.decode();
    context.globalAlpha = alpha;
    context.drawImage(image, 0, 0, size, size);
  }
  return canvas.toDataURL('image/webp', .88).split(',')[1];
}, { layers, size });

const outputs = {
  // The page background everywhere, sharp on 2x screens.
  'escamas-tony-base.webp': { scale: 2, layers: [{ src: svg('escamas-tony-base.svg'), alpha: 1 }] },
  // Scales with their joints lit, behind Tony for the second a section change lasts.
  'escamas-tony-brasa.webp': { scale: 1, layers: [{ src: svg('escamas-tony-base.svg'), alpha: 1 }, { src: svg('escamas-tony-uniones.svg'), alpha: .85 }] },
};
for (const [name, { scale, layers }] of Object.entries(outputs)) {
  const size = SCALE_TILE.size * scale;
  const data = Buffer.from(await encode(layers, size), 'base64');
  writeFileSync(asset(name), data);
  console.log(`${name} · ${size}px · ${(data.length / 1024).toFixed(1)} KB`);
}
await browser.close();
