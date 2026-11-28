import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// The standalone PHP deployment can verify a published photo without contacting WordPress.
const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const {products} = read('data/official-collections.json');
const {newProducts, updatedCategories} = read('data/tienda.json');
const categories = new Set(read('data/pedido/album-categories.json'));
const fingerprints = {};
for (const album of [...products, ...newProducts.filter(item => item.imageCount)]) {
  const groups = [...album.categories, ...(updatedCategories[album.id] || [])];
  if (!groups.some(group => categories.has(group))) continue;
  const {images} = read(`public/assets/colecciones/${album.id}.json`);
  const digests = images.map(({src}, index) => {
    const fields = [String(album.id), String(index + 1), album.name, src];
    return createHash('sha256').update(fields.join('\n')).digest();
  });
  fingerprints[album.id] = Buffer.concat(digests).toString('base64');
}
const file = new URL('../backend/pedido-api/album-fingerprints.json', import.meta.url);
const contents = JSON.stringify(fingerprints, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (readFileSync(file, 'utf8').replaceAll('\r\n','\n') !== contents) throw new Error('Actualiza el índice con node scripts/prepare-order-albums.mjs');
} else writeFileSync(file, contents);
