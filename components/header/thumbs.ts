import type {Discipline} from '@/lib/disciplines';

type Asset = `/assets/${string}`;
// Light copies of the discipline photos (160px chips, 400x480 cards) made for the menu, search and
// disciplines panel, so opening them does not download the full campaign photos. Keyed by the source
// photo: if lib/disciplines.ts points to a new photo, the chrome falls back to that photo until a copy exists.
// Logos 3D and Hoddies are cropped above the price and store-count strips printed on those flyers, and
// Implementos to the ball, bottle and bag of its campaign photo.
const COPIES: Record<string, string> = {
  '/assets/sections/futbol-tony.webp': 'futbol',
  '/assets/sections/baloncesto-tony.webp': 'bkb',
  '/assets/sections/voleibol-tony.webp': 'voleibol',
  '/assets/sections/ciclismo-tony.webp': 'ciclismo',
  '/assets/sections/running-tony.webp': 'runners',
  '/assets/sections/racing-tony.webp': 'racing',
  '/assets/sections/empresarial-tony.webp': 'empresarial',
  '/assets/sections/casual-tony.webp': 'camisas-polos',
  '/assets/colecciones/32341.webp': 'replicas',
  '/assets/colecciones/34694.webp': 'hoddies',
  '/assets/sections/implementos-tony.webp': 'implementos',
  '/assets/colecciones/36787.webp': 'moldes',
  '/assets/colecciones/36849.webp': 'logos-3d',
};

export function disciplineThumb(discipline: Discipline, size: 'chip' | 'card'): Asset {
  return chipThumb(discipline.image, size);
}

/** The light copy of any photo that has one (search thumbnails use the 160px chip). */
export function chipThumb(image: Asset, size: 'chip' | 'card' = 'chip'): Asset {
  const copy = COPIES[image];
  return copy ? `/assets/chrome/disciplinas/${copy}-${size}.webp` : image;
}
