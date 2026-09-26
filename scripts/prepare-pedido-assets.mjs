import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = process.cwd();
const source = path.join(root, 'output/tony-v279-assets');
const destination = path.join(root, 'public/assets/pedido');
const manifest = JSON.parse(await fs.readFile(path.join(source, 'manifest.json'), 'utf8'));
await fs.mkdir(path.join(destination, 'catalog'), { recursive: true });
await fs.mkdir(path.join(destination, 'guides'), { recursive: true });
const cropDefinition = { front: { x: .12, y: .10, width: .43, height: .80 }, back: { x: .48, y: .08, width: .42, height: .82 } };
const designs = [];
for (const item of manifest.catalog) {
  if (!item.remote?.verified) throw new Error(`Unverified image: ${item.code}`);
  const original = await fs.readFile(path.join(source, item.remote.file));
  if (createHash('sha256').update(original).digest('hex') !== item.remote.sha256) throw new Error(`SHA mismatch: ${item.code}`);
  const meta = await sharp(original).metadata();
  const id = item.code.toLowerCase();
  const prefix = `/assets/pedido/catalog/${id}`;
  await sharp(original).resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toFile(path.join(destination, `catalog/${id}.webp`));
  await sharp(original).resize({ width: 220, height: 220, fit: 'inside', withoutEnlargement: true }).webp({ quality: 76 }).toFile(path.join(destination, `catalog/${id}-thumb.webp`));
  for (const [side, crop] of Object.entries(cropDefinition)) {
    await sharp(original).extract({ left: Math.round(meta.width * crop.x), top: Math.round(meta.height * crop.y), width: Math.round(meta.width * crop.width), height: Math.round(meta.height * crop.height) }).resize({ width: 800, height: 1100, fit: 'inside', withoutEnlargement: true }).webp({ quality: 87 }).toFile(path.join(destination, `catalog/${id}-${side}.webp`));
  }
  designs.push({ code: item.code, name: item.name || 'Diseño Fútbol', category: item.category || 'Fútbol', image: `${prefix}.webp`, thumbnail: `${prefix}-thumb.webp`, front: `${prefix}-front.webp`, back: `${prefix}-back.webp`, width: meta.width, height: meta.height, sha256: item.remote.sha256, source: item.remote.url });
}
const guideRoles = {
  advisor: 'Asesora Tony saludando',
  welcome: 'Tony Sportswear crea tus uniformes o camisas',
  uniform: 'Uniformes Full Sublimados Tony Sportswear $12.99 c/u',
  shirt: 'Camisas Full Sublimadas Tony Sportswear $7.99 c/u',
  'mold-standard': 'Molde estándar o básico',
  'mold-raglan': 'Molde Raglan',
  'mold-first-division': 'Molde Primera División',
  'collar-v': 'Cuello V decorado',
  'collar-round': 'Cuello redondo decorado',
  'collar-chinese': 'Cuello chino decorado',
  'collar-polo': 'Cuello polo decorado',
  'brand-sublimated': 'Marca deportiva sublimada',
  'crest-sublimated': 'Logo de equipo sublimado',
  'brand-3d': 'Marca deportiva 3D alto relieve',
  'crest-3d': 'Logo de equipo 3D alto relieve',
};
const guides = [];
for (const [id, role] of Object.entries(guideRoles)) {
  const image = manifest.embedded.find(item => item.verified && item.occurrences.some(occurrence => occurrence.role === role));
  if (!image) throw new Error(`Missing guide: ${role}`);
  const info = await sharp(path.join(source, image.file)).resize({ width: 1000, height: 1100, fit: 'inside', withoutEnlargement: true }).webp({ quality: 83 }).toFile(path.join(destination, `guides/${id}.webp`));
  guides.push({ id, title: role, image: `/assets/pedido/guides/${id}.webp`, width: info.width, height: info.height, sourceRole: role, sourceSha256: image.sha256 });
}
const fabrics = JSON.parse(await fs.readFile(path.join(source, 'fabrics.json'), 'utf8'));
for (const fabric of fabrics) {
  if (!fabric.verified) throw new Error(`Unverified fabric: ${fabric.id}`);
  const original = await fs.readFile(path.join(source, fabric.file));
  if (createHash('sha256').update(original).digest('hex') !== fabric.sourceSha256) throw new Error(`SHA mismatch: ${fabric.id}`);
  const info = await sharp(original).resize({ width: 1000, height: 1100, fit: 'inside', withoutEnlargement: true }).webp({ quality: 83 }).toFile(path.join(destination, `guides/${fabric.id}.webp`));
  guides.push({ id: fabric.id, title: fabric.title, description: fabric.description, image: `/assets/pedido/guides/${fabric.id}.webp`, width: info.width, height: info.height, sourceRole: fabric.title, sourceSha256: fabric.sourceSha256, source: fabric.source });
}
await fs.mkdir(path.join(root, 'data/pedido'), { recursive: true });
await fs.writeFile(path.join(root, 'data/pedido/catalog.json'), `${JSON.stringify({ source: manifest.sources[1].source, verifiedAt: manifest.createdAt, cropDefinition, designs }, null, 2)}\n`);
await fs.writeFile(path.join(root, 'data/pedido/guides.json'), `${JSON.stringify({ source: manifest.sources[1].source, guides }, null, 2)}\n`);
console.log(`Prepared ${designs.length} verified catalog designs and ${guides.length} guides.`);
