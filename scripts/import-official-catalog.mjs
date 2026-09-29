// Public, read-only WooCommerce catalogue. Never accesses customers, orders or admin APIs.
import {mkdir, readFile, writeFile, access} from 'node:fs/promises';
import sharp from 'sharp';

const origin = 'https://www.tonysportselsalvador.com';
const destination = 'public/assets/colecciones';
const snapshot = process.argv.includes('--snapshot');
const clean = value => String(value || '').replace(/<[^>]*>/g, '').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();
function trusted(value) {
  const url = new URL(value);
  if (url.origin !== origin || !url.pathname.startsWith('/wp-content/uploads/')) throw new Error('Unexpected artwork origin');
  return url.href;
}
async function json(path) {
  const response = await fetch(`${origin}/wp-json/wc/store/${path}`, {signal: AbortSignal.timeout(60000)});
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return {data: await response.json(), pages: Number(response.headers.get('x-wp-totalpages') || 1)};
}
let products, categories;
if (snapshot) {
  products = JSON.parse(await readFile('output/official-store-all.json', 'utf8'));
  categories = JSON.parse(await readFile('output/official-store-products-categories-1.json', 'utf8'));
} else {
  const first = await json('products?per_page=100&page=1'); products = first.data;
  for (let page = 2; page <= first.pages; page++) products.push(...(await json(`products?per_page=100&page=${page}`)).data);
  const firstCategories = await json('products/categories?per_page=100&page=1'); categories = firstCategories.data;
  for (let page = 2; page <= firstCategories.pages; page++) categories.push(...(await json(`products/categories?per_page=100&page=${page}`)).data);
}
await mkdir(destination, {recursive: true});
const manifest = [], failures = [];
let cursor = 0, galleryCount = 0;
function preview(image, width) {
  const variants = String(image.srcset || '').split(',').map(part => part.trim().match(/^(https:\/\/\S+) (\d+)w$/)).filter(Boolean).map(m => ({url: m[1], width: Number(m[2])}));
  const candidate = variants.filter(v => v.width >= width).sort((a,b) => a.width-b.width)[0];
  return trusted(candidate?.url || image.src);
}
async function worker() {
  while (cursor < products.length) {
    const product = products[cursor++];
    const images = (Array.isArray(product.images) ? product.images : Object.values(product.images || {})).filter(image => image?.src).map(image => ({src: trusted(image.src), preview: preview(image, 700), label: clean(image.alt || image.name)}));
    galleryCount += images.length;
    await writeFile(`${destination}/${product.id}.json`, JSON.stringify({images}));
    let cover = '';
    if (images.length) {
      const path = `${destination}/${product.id}.webp`;
      try {
        try {await access(path);} catch {
          const original = (Array.isArray(product.images) ? product.images : Object.values(product.images))[0];
          const response = await fetch(preview(original, 440), {signal: AbortSignal.timeout(60000)});
          if (!response.ok) throw new Error(String(response.status));
          const bytes = Buffer.from(await response.arrayBuffer());
          await sharp(bytes).rotate().resize({width: 440, height: 540, fit: 'inside', withoutEnlargement: true}).webp({quality: 78}).toFile(path);
        }
        cover = `/assets/colecciones/${product.id}.webp`;
      } catch (error) {failures.push({id: product.id, error: String(error)});}
    }
    manifest.push({id: product.id, name: clean(product.name), href: product.permalink, categories: product.categories.map(c => c.slug), cover, imageCount: images.length});
    if (manifest.length % 40 === 0) console.log(`Prepared ${manifest.length}/${products.length}`);
  }
}
await Promise.all(Array.from({length: 5}, worker));
manifest.sort((a,b) => b.id-a.id);
const categoryIndex = categories.map(c => ({id:c.id, name:clean(c.name), slug:c.slug, count:manifest.filter(p => p.categories.includes(c.slug)).length})).filter(c => c.count);
await writeFile('data/collection-categories.json', JSON.stringify(categoryIndex, null, 2)+'\n');
await writeFile('data/official-collections.json', JSON.stringify({source:origin, retrievedAt:new Date().toISOString().slice(0,10), products:manifest, categories:categoryIndex}, null, 2)+'\n');
console.log(JSON.stringify({products:manifest.length, categories:categoryIndex.length, galleryImages:galleryCount, failures}));
if (failures.length) process.exitCode = 1;
