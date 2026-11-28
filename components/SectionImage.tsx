import { siteAsset } from '@/lib/asset-path';
import art from '@/data/section-images.json';

export type SectionPhoto =
  | 'recientes' | 'resenas' | 'tiendas' | 'entregas' | 'patrocinio'
  | 'app-tony' | 'tonyplay' | 'comunidad' | 'actualidad' | 'nosotros' | 'social'
  | 'calidad' | 'full' | 'partial' | 'print' | 'embroidery'
  | 'futbol' | 'baloncesto' | 'voleibol' | 'running' | 'ciclismo'
  | 'racing' | 'empresarial' | 'casual' | 'implementos';

const productLine: Partial<Record<SectionPhoto, string>> = {
  futbol: 'futbol', baloncesto: 'bkb', voleibol: 'voleibol', running: 'runners', ciclismo: 'ciclismo',
  racing: 'racing', empresarial: 'empresarial', casual: 'camisas-polos', implementos: 'implementos',
};
const photos = art as unknown as Record<string, [number, number, number[]] | undefined>;
// What next/image's `fill` drew (the static export does not optimize images, so it only ever served the original).
const FILL = { position: 'absolute', height: '100%', width: '100%', left: 0, top: 0, right: 0, bottom: 0, color: 'transparent' } as const;

/**
 * Original conceptual campaign art; captions, links and product data stay in HTML.
 * `priority`: the photo is the page's main picture, so it loads at once and first; the rest wait until they near the screen.
 */
export default function SectionImage({ photo, shade = 'bottom', sizes = '(max-width: 760px) 90vw, 45vw', position = 'center top', fit = 'cover', priority = false }: {
  photo: SectionPhoto;
  shade?: 'none' | 'bottom' | 'left' | 'light' | 'strong';
  sizes?: string;
  position?: string;
  fit?: 'cover' | 'contain';
  priority?: boolean;
}) {
  const line = productLine[photo];
  const path: `/assets/${string}` = photo === 'patrocinio' ? '/assets/patrocinio/foto-dragon.webp' : line
    ? `/assets/productos/${line}/portada.webp` : `/assets/secciones/${photo}/portada.webp`;
  const url = siteAsset(path);
  const meta = photos[path];
  const srcSet = meta && [...meta[2].map(w => `${url.replace(/\.webp$/, `-${w}.webp`)} ${w}w`), `${url} ${meta[0]}w`].join(', ');
  // Inside <picture>, React adds no preload of its own for this image, on this page or in the RSC prefetch of others.
  return <picture className={`section-image section-image--${shade}`} aria-hidden="true" data-section-photo={photo}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={url} srcSet={srcSet} sizes={srcSet ? sizes : undefined} alt="" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" style={{ ...FILL, objectFit: fit, objectPosition: position }} />
  </picture>;
}
