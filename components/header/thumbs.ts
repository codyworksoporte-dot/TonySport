import type {Discipline} from '@/lib/disciplines';

type Asset = `/assets/${string}`;

export function disciplineThumb(discipline: Discipline, size: 'chip' | 'card'): Asset {
  return chipThumb(discipline.image, size);
}

export function chipThumb(image: Asset, size: 'chip' | 'card' = 'chip'): Asset {
  if (size === 'chip' && /^\/assets\/(productos|secciones|portadas)\//.test(image))
    return image.replace(/(?:-\d{3,4})?\.webp$/, '-240.webp') as Asset;
  return image;
}
