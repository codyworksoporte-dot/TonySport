import {preload} from 'react-dom';
import guides from '@/data/pedido/guides.json';
import thumbnails from '@/data/pedido/option-thumbnails.json';
import {siteAsset} from '@/lib/asset-path';

const asset = (path: string) => siteAsset(path as `/assets/${string}`);
const guideFile = (id: string) => asset(`/assets/pedido/guides/${id}.webp`);
const sheet = guideFile('options-96');
const sheetSources = `${sheet} 1x, ${guideFile('options-192')} 2x`;
const productSizes = '(max-width: 480px) calc(100vw - 64px), (max-width: 700px) calc(50vw - 54px), (max-width: 1100px) 46vw, 360px';
const welcomeSizes = '(max-width: 800px) calc(100vw - 40px), (max-width: 1350px) 46vw, 600px';
/** Single photos (1x, 2x) for options outside the sheet: Tony sleeve models and the brand choice. */
const photos = guides.optionPhotos as Record<string, string[] | undefined>;
const photoSources = (files: string[]) => files.map((file, index) => `${asset(file)} ${index + 1}x`).join(', ');

type Banner = 'welcome' | 'uniform' | 'shirt';
function bannerSources(id: Banner) {
  const previews = `${guideFile(id + '-360')} 360w, ${guideFile(id + '-720')} 720w`;
  return id === 'welcome' ? `${previews}, ${guideFile(id)} 1000w` : previews;
}

export function OrderImageHints() {
  // Use identical candidates here and in the cards so navigation reuses the
  // request the browser already made at the appropriate screen density.
  preload(sheet, {as: 'image', imageSrcSet: sheetSources});
  for (const product of ['uniform', 'shirt'] as const) {
    preload(guideFile(product + '-360'), {
      as: 'image', imageSrcSet: bannerSources(product), imageSizes: productSizes, fetchPriority: 'low',
    });
  }
  for (const files of Object.values(photos)) if (files) preload(asset(files[0]), {as: 'image', imageSrcSet: photoSources(files), fetchPriority: 'low'});
  return null;
}

export function OrderBanner({id}: {id: Banner}) {
  const welcome = id === 'welcome';
  return <img src={guideFile(id + '-360')} srcSet={bannerSources(id)}
    sizes={welcome ? welcomeSizes : productSizes}
    width={welcome ? 1000 : 993} height={welcome ? 667 : id === 'shirt' ? 703 : 648}
    alt={welcome ? 'Tony Sportswear, crea tus uniformes o camisas' : ''}
    fetchPriority={welcome ? 'high' : 'auto'} />;
}

export function OptionThumbnail({id}: {id: string}) {
  const files = photos[id];
  if (files) return <span className="pedido-choice-img" aria-hidden="true">
    <img className="pedido-choice-photo" src={asset(files[0])} srcSet={photoSources(files)} alt="" width={96} height={96} decoding="async"/>
  </span>;
  const index = thumbnails.ids.indexOf(id);
  if (index < 0) return null;
  const column = index % thumbnails.columns, row = Math.floor(index / thumbnails.columns);
  return <span className="pedido-choice-img" aria-hidden="true">
    <img src={sheet} srcSet={sheetSources} alt="" style={{
      width: `${thumbnails.columns * 100}%`, height: `${thumbnails.rows * 100}%`,
      left: `${-column * 100}%`, top: `${-row * 100}%`,
    }}/>
  </span>;
}

export function GuidePhoto({item, first}: {item: {id: string; title: string; image: string; width: number; height: number}; first: boolean}) {
  // Smaller copies sit beside the full image: <name>-thumb.webp (360w) and, for large guides, <name>-640.webp.
  const base = item.image.replace(/\.webp$/, ''), thumb = asset(`${base}-thumb.webp`);
  const sources = [`${thumb} 360w`, ...(item.width > 640 ? [`${asset(`${base}-640.webp`)} 640w`] : []), `${asset(item.image)} ${item.width}w`];
  return <img src={thumb} srcSet={sources.join(', ')}
    sizes="(max-width: 480px) calc(100vw - 74px), (max-width: 792px) calc(50vw - 53px), 342px"
    alt={item.title} width={item.width} height={item.height}
    loading={first ? 'eager' : 'lazy'} decoding="async"/>;
}
