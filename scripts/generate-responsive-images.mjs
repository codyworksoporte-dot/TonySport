// Lighter copies of the site's images, so no page downloads a picture much bigger than it shows.
//
// 1. Responsive copies: <name>-<width>.webp beside each original (the original is never touched), listed in
//    data/responsive-images.json as { "/assets/…/name.webp": [width, height, [copy widths]] }. Components build
//    srcset from that list (lib/responsive-image.ts); SectionImage uses the section widths below directly.
// 2. Lighter encodings in place for a few heavy decorative files, written only when the saving is real (and, for
//    the favicon, only when every pixel stays identical), so running the script again never degrades them.
//
// Run after adding or replacing one of these images:  node scripts/generate-responsive-images.mjs  [--force]
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const FORCE = process.argv.includes('--force');
const PHOTO = { quality: 78, effort: 6, smartSubsample: true };
const LOGO = { quality: 85, alphaQuality: 95, effort: 6, smartSubsample: true };
/** Keep in sync with components/SectionImage.tsx (SECTION_WIDTHS); check-assets.mjs verifies the files. */
const SECTION_WIDTHS = [320, 560, 720];

const text = file => readFile(file, 'utf8');
// Lists read from the code, so the copies follow what the pages show.
async function homeDesigns() {
  const list = (await text('app/page.tsx')).match(/const DESIGNS = \[([^\]]*)\]/)?.[1] ?? '';
  return [...list.matchAll(/'TONY-(\d{3})'/g)].map(match => `/assets/pedido/catalog/tony-${match[1]}.webp`);
}
async function sectionPhotos() {
  return (await readdir('public/assets/sections')).filter(name => /^[a-z0-9-]+-tony\.webp$/.test(name)).map(name => `/assets/sections/${name}`);
}
async function storefrontCovers() {
  return (await readdir('public/assets/portadas')).filter(name => /(?<!-\d{3,4})\.webp$/.test(name)).map(name => `/assets/portadas/${name}`);
}
async function smallCovers() {
  // Keep the previously generated gallery thumbnails available to their callers.
  return (await readdir('public/assets/colecciones'))
    .filter(name => /^\d+-240\.webp$/.test(name))
    .map(name => `/assets/colecciones/${name.replace('-240', '')}`);
}

const GROUPS = [
  { name: 'Fotos de sección', files: sectionPhotos, widths: SECTION_WIDTHS, webp: PHOTO },
  { name: 'Promo de la portada', files: async () => ['/assets/home/promo-campaign.webp'], widths: [560, 720], webp: PHOTO },
  { name: 'Portadas de productos y secciones', files: storefrontCovers, widths: [240, 400, 640], webp: PHOTO },
  { name: 'Diseños de la portada', files: homeDesigns, widths: [320, 560, 720], webp: PHOTO },
  { name: 'Portadas pequeñas', files: smallCovers, widths: [240], webp: PHOTO },
  // 240: header and footer logo (58–72 px CSS). 640 / 960: the section-change and intro emblem (lib/tony-art.ts).
  { name: 'Logo', files: async () => ['/assets/brand/tony-logo.webp'], widths: [240, 640, 960], webp: LOGO },
];

// Decorative textures written by scripts/rasterize-scales.mjs at canvas quality .88 (run this again after it),
// and the favicon, recompressed without changing a single pixel.
const RECOMPRESS = [
  { file: 'public/assets/escamas-tony-base.webp', encode: image => image.webp({ quality: 80, effort: 6, smartSubsample: true }) },
  { file: 'public/assets/escamas-tony-brasa.webp', encode: image => image.webp({ quality: 75, effort: 6, smartSubsample: true }) },
  { file: 'app/icon.png', encode: image => image.png({ palette: true, quality: 100, colours: 256, dither: 0, compressionLevel: 9, effort: 10 }), identical: true },
];

const copyPath = (path, width) => path.replace(/\.webp$/, `-${width}.webp`);
const local = path => `public${path}`;
const kb = bytes => `${(bytes / 1024).toFixed(1)} KB`;
const manifest = {};
let written = 0, kept = 0;

for (const group of GROUPS) {
  const files = await group.files();
  if (!files.length) console.warn(`Aviso: ${group.name} no tiene archivos.`);
  for (const path of files.sort()) {
    const source = local(path);
    const [{ width, height }, { mtimeMs }] = await Promise.all([sharp(source).metadata(), stat(source)]);
    const widths = group.widths.filter(candidate => candidate < width);
    for (const candidate of widths) {
      const target = local(copyPath(path, candidate));
      const current = await stat(target).catch(() => null);
      if (!FORCE && current && current.mtimeMs >= mtimeMs) { kept++; continue; }
      const info = await sharp(source).resize({ width: candidate }).webp(group.webp).toFile(target);
      written++;
      console.log(`${copyPath(path, candidate)} · ${info.width}×${info.height} · ${kb(info.size)}`);
    }
    if (widths.length) manifest[path] = [width, height, widths];
  }
}
const entries = Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b));
await writeFile('data/responsive-images.json', `{\n${entries.map(([path, entry]) => `  ${JSON.stringify(path)}: ${JSON.stringify(entry)}`).join(',\n')}\n}\n`);
console.log(`Copias: ${written} nuevas, ${kept} al día · data/responsive-images.json con ${entries.length} imágenes.`);

for (const { file, encode, identical } of RECOMPRESS) {
  const original = await readFile(file);
  const output = await encode(sharp(original)).toBuffer();
  if (output.length > original.length * 0.9) { console.log(`${file}: se queda (${kb(original.length)}).`); continue; }
  if (identical) {
    const [a, b] = await Promise.all([sharp(original).ensureAlpha().raw().toBuffer(), sharp(output).ensureAlpha().raw().toBuffer()]);
    if (!a.equals(b)) { console.log(`${file}: se queda (la versión ligera cambiaría píxeles).`); continue; }
  }
  await writeFile(file, output);
  console.log(`${file}: ${kb(original.length)} → ${kb(output.length)}`);
}
