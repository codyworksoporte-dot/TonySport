// PROMOCIONES. Every entry is a real Tony campaign published on tonysportselsalvador.com, newest first.
// They are past campaigns: mark one `current: true` (and set `until`) only when Tony confirms it is running.
type Asset = `/assets/${string}`;
export type Promotion = {
  id: string; title: string; when: string; image: Asset;
  album?: string;        // /colecciones?categoria=… holds the full image set
  official: string;      // the campaign on the official site
  current?: boolean; until?: string;
};

export const PROMOTIONS: Promotion[] = [
  { id: 'precios-patrios', title: 'Precios Patrios', when: 'Septiembre 2026', image: '/assets/colecciones/38028.webp', album: 'promo-inicio-de-ano', official: 'https://www.tonysportselsalvador.com/producto/super-promocion-mundialista/' },
  { id: 'black-week', title: 'Black Week', when: 'Noviembre 2025', image: '/assets/colecciones/33607.webp', album: 'black-november', official: 'https://www.tonysportselsalvador.com/producto/promocion-black-weekend/' },
  { id: 'halloween', title: 'Halloween Tony', when: 'Octubre 2025', image: '/assets/colecciones/36456.webp', album: 'promociones-2', official: 'https://www.tonysportselsalvador.com/producto/halloween/' },
  { id: 'implementos-fin-de-ano', title: 'Implementos de fin de año', when: 'Diciembre 2024', image: '/assets/colecciones/35122.webp', official: 'https://www.tonysportselsalvador.com/producto/promo-implementos-deportivos/' },
  { id: 'navidad', title: 'Promoción de Navidad', when: 'Diciembre 2024', image: '/assets/colecciones/34969.webp', album: 'promo-navidad', official: 'https://www.tonysportselsalvador.com/producto/promocion-de-navidad/' },
];

export const CURRENT_PROMOTIONS = PROMOTIONS.filter(promo => promo.current);
export const PROMOTIONS_PAGE = '/promociones';
export const PROMO_QUESTION = 'Hola, Tony. ¿Qué promociones tienen vigentes?';
