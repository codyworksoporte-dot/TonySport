import Image from 'next/image';
import { siteAsset } from '@/lib/asset-path';

export type SectionPhoto =
  | 'recientes' | 'resenas' | 'tiendas' | 'entregas' | 'patrocinio'
  | 'app-tony' | 'tonyplay' | 'comunidad' | 'actualidad' | 'nosotros' | 'social'
  | 'calidad' | 'full' | 'partial' | 'print' | 'embroidery'
  | 'futbol' | 'baloncesto' | 'voleibol' | 'running' | 'ciclismo'
  | 'racing' | 'empresarial' | 'casual' | 'implementos';

/** Original conceptual campaign art; captions, links and product data stay in HTML. */
export default function SectionImage({ photo, shade = 'bottom', sizes = '(max-width: 760px) 90vw, 45vw', position = 'center top', fit = 'cover' }: {
  photo: SectionPhoto;
  shade?: 'none' | 'bottom' | 'left' | 'light' | 'strong';
  sizes?: string;
  position?: string;
  fit?: 'cover' | 'contain';
}) {
  return <picture className={`section-image section-image--${shade}`} aria-hidden="true" data-section-photo={photo}>
    <Image src={siteAsset(`/assets/sections/${photo}-tony.webp`)} alt="" fill sizes={sizes} quality={85} style={{objectFit:fit, objectPosition:position}} />
  </picture>;
}
