import copies from '@/data/responsive-images.json';
import {siteAsset} from '@/lib/asset-path';

/*
 * Lighter copies of an image (<name>-<width>.webp beside the original), made by
 * scripts/generate-responsive-images.mjs and listed in data/responsive-images.json. An image without copies
 * keeps working as before: srcSetOf gives undefined and fitted gives the original.
 * Server components only: importing this into a client component would ship the list to the browser.
 */
type Asset = `/assets/${string}`;
type Entry = readonly [width: number, height: number, widths: readonly number[]];
const COPIES = copies as unknown as Partial<Record<string, Entry>>;
const copyOf = (path: Asset, width: number) => path.replace(/\.webp$/, `-${width}.webp`) as Asset;

/** `srcset` with the copies of `path` and the original, or undefined when it has no copies. */
export function srcSetOf(path: Asset): string | undefined {
  const entry = COPIES[path];
  if (!entry) return undefined;
  return [...entry[2].map(width => `${siteAsset(copyOf(path, width))} ${width}w`), `${siteAsset(path)} ${entry[0]}w`].join(', ');
}

/** The lightest copy at least `width` px wide (else the original): for small slots of a fixed size, such as chips. */
export function fitted(path: Asset, width: number): Asset {
  const match = COPIES[path]?.[2].find(candidate => candidate >= width);
  return match ? copyOf(path, match) : path;
}

/** `src`, `srcSet` and `sizes` for an `<img>`; without copies it is a plain `src`. */
export function responsive(path: Asset, sizes: string) {
  const srcSet = srcSetOf(path);
  return {src: siteAsset(path), srcSet, sizes: srcSet ? sizes : undefined};
}
