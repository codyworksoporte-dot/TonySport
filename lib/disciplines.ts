// "Escoge tu disciplina deportiva": the 13 official product lines as picture buttons.
// ids match PRODUCT_CATEGORIES (lib/products.ts) so /producto#categoria-<id> keeps working.
// `image` is the storefront product cover (round chips and tiles).
type Asset = `/assets/${string}`;
export type Discipline = { id: string; name: string; image: Asset; sport: boolean };

export const DISCIPLINES: Discipline[] = [
  { id: 'futbol', name: 'Fútbol', image: '/assets/productos/futbol/portada.webp', sport: true },
  { id: 'bkb', name: 'Baloncesto', image: '/assets/productos/bkb/portada.webp', sport: true },
  { id: 'voleibol', name: 'Voleibol', image: '/assets/productos/voleibol/portada.webp', sport: true },
  { id: 'ciclismo', name: 'Ciclismo', image: '/assets/productos/ciclismo/portada.webp', sport: true },
  { id: 'runners', name: 'Running', image: '/assets/productos/runners/portada.webp', sport: true },
  { id: 'racing', name: 'Racing', image: '/assets/productos/racing/portada.webp', sport: true },
  { id: 'empresarial', name: 'Empresarial', image: '/assets/productos/empresarial/portada.webp', sport: false },
  { id: 'camisas-polos', name: 'Camisas y polos', image: '/assets/productos/camisas-polos/portada.webp', sport: false },
  { id: 'replicas', name: 'Réplicas', image: '/assets/productos/replicas/portada.webp', sport: false },
  { id: 'hoddies', name: 'Hoddies', image: '/assets/productos/hoddies/portada.webp', sport: false },
  { id: 'implementos', name: 'Implementos', image: '/assets/productos/implementos/portada.webp', sport: false },
  { id: 'moldes', name: 'Moldes', image: '/assets/productos/moldes/portada.webp', sport: false },
  { id: 'logos-3d', name: 'Logos 3D', image: '/assets/productos/logos-3d/portada.webp', sport: false },
];

export const disciplineHref = (id: string) => `/producto#categoria-${id}`;
export const DISCIPLINES_TITLE = 'Escoge tu disciplina deportiva';
