import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

// Regenerate from the committed full guides with: node scripts/prepare-pedido-previews.mjs
export async function prepareGuidePreviews() {
  const { guides } = JSON.parse(await readFile('data/pedido/guides.json', 'utf8'));
  const folder = 'public/assets/pedido/guides';
  const groups = ['mold', 'fabric', 'collar', 'sleeve', 'brand', 'crest'];
  const ids = groups.flatMap(group => guides.filter(guide => guide.id.startsWith(group + '-')).map(guide => guide.id));
  const columns = 5;
  const rows = Math.ceil(ids.length / columns);

  for (const size of [96, 192]) {
    const tiles = await Promise.all(ids.map(async (id, index) => ({
      input: await sharp(join(folder, id + '.webp')).resize(size, size, { fit: 'cover' }).png().toBuffer(),
      left: index % columns * size,
      top: Math.floor(index / columns) * size,
    })));
    await sharp({ create: { width: columns * size, height: rows * size, channels: 3, background: '#0b1a11' } })
      .composite(tiles).webp({ quality: 62, effort: 6, smartSubsample: true })
      .toFile(join(folder, 'options-' + size + '.webp'));
  }
  await writeFile('data/pedido/option-thumbnails.json', JSON.stringify({ columns, rows, ids }, null, 2) + '\n');

  for (const id of ['welcome', 'shirt', 'uniform']) {
    for (const width of [360, 720]) {
      await sharp(join(folder, id + '.webp')).resize({ width }).webp({ quality: 68, effort: 6, smartSubsample: true })
        .toFile(join(folder, id + '-' + width + '.webp'));
    }
  }
  for (const id of ids) {
    await sharp(join(folder, id + '.webp')).resize({ width: 360 }).webp({ quality: 70, effort: 6, smartSubsample: true })
      .toFile(join(folder, id + '-thumb.webp'));
    await sharp(join(folder, id + '.webp')).resize({ width: 640 }).webp({ quality: 67, effort: 6, smartSubsample: true })
      .toFile(join(folder, id + '-640.webp'));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await prepareGuidePreviews();
}
