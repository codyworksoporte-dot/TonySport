import { copyFile, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = new URL('../out/', import.meta.url);
const basePath = '/TonySport';
// Next serializes HTML and RSC payloads; rewriting them after build breaks hydration.
// Component asset URLs are prefixed at build time. Only CSS url() paths need this pass.
const textExtensions = new Set(['.css']);
let replacements = 0;

async function visit(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) { await visit(path); continue; }
    if (!entry.isFile() || !textExtensions.has(extname(entry.name))) continue;
    const original = await readFile(path, 'utf8');
    const updated = original.replaceAll(/(?<!\/TonySport)\/assets\//g, `${basePath}/assets/`);
    if (updated !== original) {
      replacements += (updated.match(/\/TonySport\/assets\//g) || []).length;
      await writeFile(path, updated);
    }
  }
}

await visit(fileURLToPath(directory));
// Next's exported prefetch manifest requests a flat RSC filename, while the
// Windows export writes the page payload into a folder with the same stem.
// Keep both paths so client navigation also works on static hosting.
async function copyPayloads(folder, routeFolder, prefix) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const source = join(folder, entry.name);
    const flatName = `${prefix}.${entry.name}`;
    if (entry.isDirectory()) await copyPayloads(source, routeFolder, flatName);
    else if (entry.isFile() && extname(entry.name) === '.txt') await copyFile(source, join(routeFolder, flatName));
  }
}
async function prepareRoutes(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const child = join(folder, entry.name);
    if (entry.name.startsWith('__next.')) await copyPayloads(child, folder, entry.name);
    else if (!entry.name.startsWith('_') && entry.name !== 'assets') await prepareRoutes(child);
  }
}
await prepareRoutes(fileURLToPath(directory));
const homepage = await readFile(new URL('../out/index.html', import.meta.url), 'utf8');
const product = await readFile(new URL('../out/producto/index.html', import.meta.url), 'utf8');
if (!homepage.includes(`${basePath}/_next/`) || !homepage.includes(`${basePath}/assets/`) || !product.includes('PRODUCTO')) {
  throw new Error('La exportación de GitHub Pages no contiene rutas y recursos válidos.');
}
await writeFile(new URL('../out/.nojekyll', import.meta.url), '');
console.log(`GitHub Pages listo: ${replacements} referencias de recursos prefijadas con ${basePath}.`);
