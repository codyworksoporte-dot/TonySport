// "Escoge tu disciplina deportiva": the 13 official product lines as picture buttons.
// ids match PRODUCT_CATEGORIES (lib/products.ts) so /producto#categoria-<id> keeps working.
// `image` is the campaign photo (round chips, tiles); `cover` is a real product photo (cards).
type Asset = `/assets/${string}`;
export type Discipline = { id: string; name: string; image: Asset; cover: Asset; sport: boolean };

export const DISCIPLINES: Discipline[] = [
  { id: 'futbol', name: 'Fútbol', image: '/assets/sections/futbol-tony.webp', cover: '/assets/colecciones/37507.webp', sport: true },
  { id: 'bkb', name: 'Baloncesto', image: '/assets/sections/baloncesto-tony.webp', cover: '/assets/colecciones/26373.webp', sport: true },
  { id: 'voleibol', name: 'Voleibol', image: '/assets/sections/voleibol-tony.webp', cover: '/assets/colecciones/35872.webp', sport: true },
  { id: 'ciclismo', name: 'Ciclismo', image: '/assets/sections/ciclismo-tony.webp', cover: '/assets/colecciones/36856.webp', sport: true },
  { id: 'runners', name: 'Running', image: '/assets/sections/running-tony.webp', cover: '/assets/colecciones/36555.webp', sport: true },
  { id: 'racing', name: 'Racing', image: '/assets/sections/racing-tony.webp', cover: '/assets/colecciones/34662.webp', sport: true },
  { id: 'empresarial', name: 'Empresarial', image: '/assets/sections/empresarial-tony.webp', cover: '/assets/colecciones/36041.webp', sport: false },
  { id: 'camisas-polos', name: 'Camisas y polos', image: '/assets/sections/casual-tony.webp', cover: '/assets/colecciones/26644.webp', sport: false },
  { id: 'replicas', name: 'Réplicas', image: '/assets/colecciones/32341.webp', cover: '/assets/colecciones/32341.webp', sport: false },
  { id: 'hoddies', name: 'Hoddies', image: '/assets/colecciones/34694.webp', cover: '/assets/colecciones/34694.webp', sport: false },
  { id: 'implementos', name: 'Implementos', image: '/assets/sections/implementos-tony.webp', cover: '/assets/colecciones/33905.webp', sport: false },
  { id: 'moldes', name: 'Moldes', image: '/assets/colecciones/36787.webp', cover: '/assets/colecciones/36787.webp', sport: false },
  { id: 'logos-3d', name: 'Logos 3D', image: '/assets/colecciones/36849.webp', cover: '/assets/colecciones/36849.webp', sport: false },
];

export const disciplineHref = (id: string) => `/producto#categoria-${id}`;
export const DISCIPLINES_TITLE = 'Escoge tu disciplina deportiva';
