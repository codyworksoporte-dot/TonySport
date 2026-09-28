import type { SportLine } from '@/lib/lines';
import SectionImage, { type SectionPhoto } from './SectionImage';

const photos: Record<SportLine['kind'], SectionPhoto> = {
  football:'futbol', basketball:'baloncesto', volleyball:'voleibol', running:'running',
  cycling:'ciclismo', racing:'racing', polo:'empresarial', casual:'casual', equipment:'implementos',
};

/** Campaign concepts, independent of the real catalogue and uniform editor. */
export default function LineArtwork({line}:{line:SportLine}) {
  return <SectionImage photo={photos[line.kind]} shade="none" sizes="(max-width: 620px) 90vw, (max-width: 950px) 48vw, 36vw" position="center top" />;
}
