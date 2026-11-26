import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import sharp from 'sharp';

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
  if (['welcome', 'uniform', 'shirt'].includes(guide.id)) {
    for (const width of [360, 720]) references.add(`/assets/pedido/guides/${guide.id}-${width}.webp`);
  } else {
    references.add(`/assets/pedido/guides/${guide.id}-thumb.webp`);
    if (guide.id !== 'advisor') references.add(`/assets/pedido/guides/${guide.id}-640.webp`);
  }
}

const errors = [];
// The order validators (TypeScript and PHP) accept TONY-catalogMin…catalogMax from prices.json, and
// /configurador?diseno= builds the front/back paths from the code: both must match catalog.json.
const catalog = JSON.parse(await readFile('data/pedido/catalog.json', 'utf8'));
const { catalogMin, catalogMax } = JSON.parse(await readFile('data/pedido/prices.json', 'utf8')).design;
const numbers = catalog.designs.map(design => /^TONY-\d{3}$/.test(design.code) ? Number(design.code.slice(5)) : Number.NaN);
if (numbers.some(Number.isNaN) || new Set(numbers).size !== numbers.length || numbers.length !== catalogMax - catalogMin + 1 || numbers.some(number => number < catalogMin || number > catalogMax)) {
  errors.push(`Los códigos del catálogo deben ser únicos y cubrir TONY-${String(catalogMin).padStart(3, '0')}…TONY-${String(catalogMax).padStart(3, '0')} (design.catalogMin/catalogMax en prices.json).`);
}
for (const design of catalog.designs) {
  const base = `/assets/pedido/catalog/${String(design.code).toLowerCase()}`;
  if (design.image !== `${base}.webp` || design.thumbnail !== `${base}-thumb.webp` || design.front !== `${base}-front.webp` || design.back !== `${base}-back.webp`) errors.push(`Rutas inesperadas en ${design.code}: usa ${base}.webp, -thumb, -front y -back.`);
  if (!design.name || !design.category) errors.push(`Falta el nombre o la línea de ${design.code}.`);
}
const sheet = JSON.parse(await readFile('data/pedido/option-thumbnails.json', 'utf8'));
const options = guides.guides.filter(guide => /^(mold|fabric|collar|sleeve|brand|crest)-/.test(guide.id));
if (sheet.ids.length !== options.length || options.some(guide => !sheet.ids.includes(guide.id))
  || !Number.isInteger(sheet.columns) || sheet.columns <= 0 || sheet.rows !== Math.ceil(sheet.ids.length / sheet.columns)) {
  errors.push('Las miniaturas del configurador no coinciden con sus guías. Ejecuta node scripts/prepare-pedido-previews.mjs.');
}
for (const size of [96, 192]) {
  const file = `public/assets/pedido/guides/options-${size}.webp`;
  try {
    const { info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
    if (info.width !== size * sheet.columns || info.height !== size * sheet.rows) errors.push(`Dimensiones incorrectas: ${file}`);
  } catch { errors.push(`No se pudo leer la hoja de miniaturas: ${file}`); }
}
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
