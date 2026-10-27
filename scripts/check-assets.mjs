import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

// Check the catalogue manifests before publishing: Next can otherwise build
// successfully even when the files referenced by the site are missing.
const manifests = ['data/pedido/catalog.json', 'data/pedido/guides.json', 'data/official-collections.json'];
const references = new Set();
function collect(value) {
  if (typeof value === 'string' && value.startsWith('/assets/')) references.add(value);
  else if (value && typeof value === 'object') Object.values(value).forEach(collect);
}
for (const file of manifests) collect(JSON.parse(await readFile(file, 'utf8')));

const guides = JSON.parse(await readFile('data/pedido/guides.json', 'utf8'));
for (const guide of guides.guides) {
  if (!['welcome', 'uniform', 'shirt'].includes(guide.id)) {
    references.add(`/assets/pedido/guides/${guide.id}-thumb.webp`);
  }
}

const errors = [];
for (const reference of references) {
  try { await readFile(join('public', reference.slice(1))); }
  catch { errors.push(`Falta ${reference}`); }
}

let imageCount = 0;
async function checkImages(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = join(folder, entry.name);
    if (entry.isDirectory()) { await checkImages(file); continue; }
    const extension = extname(entry.name).toLowerCase();
    if (!['.webp', '.png', '.jpg', '.jpeg'].includes(extension)) continue;
    const bytes = await readFile(file);
    imageCount++;
    const webp = bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' && bytes.readUInt32LE(4) + 8 === bytes.length;
    const png = bytes.length >= 20 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.toString('ascii', bytes.length - 8, bytes.length - 4) === 'IEND';
    const jpeg = bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
    if (!(extension === '.webp' ? webp : extension === '.png' ? png : jpeg)) errors.push(`Imagen incompleta o con formato incorrecto: ${file}`);
  }
}
await checkImages('public/assets');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Imágenes verificadas: ${imageCount} archivos y ${references.size} referencias del catálogo.`);
}
