// "Escoge tu disciplina deportiva": the 13 official product lines as picture buttons.
// ids match PRODUCT_CATEGORIES (lib/products.ts) so /producto#categoria-<id> keeps working.
// `image` is the storefront product cover (round chips and tiles).
type Asset = `/assets/${string}`;
export type Discipline = { id: string; name: string; image: Asset; cover: Asset; sport: boolean };

export const DISCIPLINES: Discipline[] = [
  { id: 'futbol', name: 'Fútbol', image: '/assets/portadas/futbol.webp', cover: '/assets/colecciones/37507.webp', sport: true },
  { id: 'bkb', name: 'Baloncesto', image: '/assets/portadas/bkb.webp', cover: '/assets/colecciones/26373.webp', sport: true },
  { id: 'voleibol', name: 'Voleibol', image: '/assets/portadas/voleibol.webp', cover: '/assets/colecciones/35872.webp', sport: true },
  { id: 'ciclismo', name: 'Ciclismo', image: '/assets/portadas/ciclismo.webp', cover: '/assets/colecciones/36856.webp', sport: true },
  { id: 'runners', name: 'Running', image: '/assets/portadas/runners.webp', cover: '/assets/colecciones/36555.webp', sport: true },
  { id: 'racing', name: 'Racing', image: '/assets/portadas/racing.webp', cover: '/assets/colecciones/34662.webp', sport: true },
  { id: 'empresarial', name: 'Empresarial', image: '/assets/portadas/empresarial.webp', cover: '/assets/colecciones/36041.webp', sport: false },
  { id: 'camisas-polos', name: 'Camisas y polos', image: '/assets/portadas/camisas-polos.webp', cover: '/assets/colecciones/26644.webp', sport: false },
  { id: 'replicas', name: 'Réplicas', image: '/assets/portadas/replicas.webp', cover: '/assets/colecciones/32341.webp', sport: false },
  { id: 'hoddies', name: 'Hoddies', image: '/assets/portadas/hoddies.webp', cover: '/assets/colecciones/34694.webp', sport: false },
  { id: 'implementos', name: 'Implementos', image: '/assets/portadas/implementos.webp', cover: '/assets/colecciones/33905.webp', sport: false },
  { id: 'moldes', name: 'Moldes', image: '/assets/portadas/moldes.webp', cover: '/assets/colecciones/36787.webp', sport: false },
  { id: 'logos-3d', name: 'Logos 3D', image: '/assets/portadas/logos-3d.webp', cover: '/assets/colecciones/36849.webp', sport: false },
];

export const disciplineHref = (id: string) => `/producto#categoria-${id}`;
export const DISCIPLINES_TITLE = 'Escoge tu disciplina deportiva';
