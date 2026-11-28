import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { siteAsset } from './asset-path';

/** Section art is optional. The static build only includes a URL after the file is supplied. */
export function storefrontImage(name: string) {
  const filename = ['webp', 'jpg', 'jpeg', 'png'].map(ext => name + '.' + ext)
    .find(file => existsSync(join(process.cwd(), 'public/assets/anuncios', file)));
  return filename ? siteAsset(`/assets/anuncios/${filename}`) : undefined;
}
