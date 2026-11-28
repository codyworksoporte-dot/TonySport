// Implementos deportivos sold on tonysportselsalvador.com (category implementos-deportivos, 46 products,
// photos already local in /assets/colecciones). Names are cleaned for display; no prices are shown.
type Asset = `/assets/${string}`;
export type ImplementFamily = { id: string; name: string; cover: Asset };
export type Implement = { id: number; name: string; family: string; image: Asset; href: string };

export const IMPLEMENT_FAMILIES: ImplementFamily[] = [
  { id: 'balones', name: 'Balones de fútbol', cover: '/assets/productos/implementos/balones.webp' },
  { id: 'futsal', name: 'Fútbol sala', cover: '/assets/productos/implementos/futsal.webp' },
  { id: 'baloncesto', name: 'Baloncesto', cover: '/assets/productos/implementos/baloncesto.webp' },
  { id: 'guantes', name: 'Guantes de portero', cover: '/assets/productos/implementos/guantes.webp' },
  { id: 'espinilleras', name: 'Espinilleras', cover: '/assets/productos/implementos/espinilleras.webp' },
  { id: 'beisbol', name: 'Béisbol', cover: '/assets/productos/implementos/beisbol.webp' },
  { id: 'mallas', name: 'Mallas', cover: '/assets/productos/implementos/mallas.webp' },
  { id: 'accesorios', name: 'Accesorios', cover: '/assets/productos/implementos/accesorios.webp' },
];

const OFFICIAL = 'https://www.tonysportselsalvador.com/producto/';
const rows: [number, string, string, string][] = [
  [33917, 'Balón Mikasa N.º 5 original', 'balones', 'balon-de-futbol-marca-mikasa-5-original'],
  [33907, 'Balón Gola Wardo N.º 5', 'balones', 'balones-gola-wardo-cocidos-y-pegados-uso-para-cancha-oficial-5'],
  [33905, 'Balón Gola Thermonova Pro N.º 5', 'balones', 'gola-thermonova-pro-5'],
  [33903, 'Balón Calcio peso muerto', 'balones', 'balon-futbol-peso-muerto-calcio'],
  [32542, 'Balón Molten de cuero N.º 4', 'balones', 'balon-molten-de-cuero-4'],
  [32540, 'Balón Molten', 'balones', 'balon-molten'],
  [32538, 'Balón Mikasa N.º 3', 'balones', 'balon-mikasa-3'],
  [32307, 'Balón Gola Calcio N.º 5', 'balones', 'gola-calcio'],
  [32258, 'Balón Thermo réplica N.º 5', 'balones', 'balon-thermo-replica-5'],
  [32255, 'Balón Mundialista N.º 5', 'balones', 'balon-mundialista-5'],
  [28906, 'Balón Milan Thermo Pro N.º 5', 'balones', 'balon-milan-thermo-pro-5'],
  [26371, 'Balón Milan Roma N.º 4 y N.º 5', 'balones', 'balon-de-futbol-4-y-5-marca-milan-roma'],
  [26365, 'Balón Mikasa réplica N.º 5', 'balones', 'balon-de-futbol-marca-mikasa-5'],
  [35083, 'Balón Lanzera', 'balones', 'balon-lanzera'],
  [35212, 'Balón Milan Premier Futsal N.º 4', 'futsal', 'milan-premier-futsal-no4'],
  [35066, 'Balón Gola Thermo Futsal', 'futsal', 'gola-thermo-futsal'],
  [35062, 'Balón Milan Thermo Pro Futsal N.º 4', 'futsal', 'balon-thermo-milan-pro-futsala-4-peso-muerto'],
  [26364, 'Balón Mikasa N.º 4 fútbol sala', 'futsal', 'balon-de-futbol-mikasa-4-para-futbol-sala-peso-muerto'],
  [35064, 'Balón Milan BKB N.º 7 tradicional', 'baloncesto', 'milan-bkb-no7-tradicional'],
  [32554, 'Balón Spalding Graffiti', 'baloncesto', 'balon-spalding'],
  [32513, 'Balón Molten BKB', 'baloncesto', 'balon-bkb-molten'],
  [26366, 'Balón Milan N.º 7 baloncesto', 'baloncesto', 'balon-para-baloncesto-marca-milan-7-tradicional'],
  [26346, 'Pelota Spalding mini', 'baloncesto', 'pelota-pequeaa-de-muestra-marca-spalding'],
  [34211, 'Guantes Gola', 'guantes', 'guantes-gola'],
  [33408, 'Guantes Kappa', 'guantes', 'guantes-marca-kappa'],
  [28950, 'Guantes profesionales Rinat', 'guantes', 'par-de-guantes-profesionales-rinat'],
  [28947, 'Guantes profesionales Lotto', 'guantes', 'par-de-guantes-profesionales-lotto'],
  [26362, 'Guantes Milan GoPro Hybrid', 'guantes', 'par-de-guantes-marca-milan-gopro-hibrid'],
  [26361, 'Guantes Milan Spider Venom', 'guantes', 'par-de-guantes-marca-milan-spider-venom'],
  [26360, 'Guantes Milan Chimera blancos', 'guantes', 'par-de-guantes-marca-milan-blancos-chimera'],
  [25908, 'Guantes profesionales Lanzera', 'guantes', 'implementos-deportivos-2'],
  [35076, 'Espinilleras Milan Sports', 'espinilleras', 'chimpinilleras-marca-milan-sports'],
  [35074, 'Espinilleras Aviva', 'espinilleras', 'chimpinilleras-marca-aviva'],
  [26363, 'Espinilleras Milan de colores', 'espinilleras', 'chimpinilleras-marca-milan-de-colores'],
  [26368, 'Pelota de béisbol Milan de hule', 'beisbol', 'pelota-para-beisbol-marca-milan-de-hule-amarilla'],
  [26367, 'Pelota de béisbol Milan', 'beisbol', 'pelota-para-beisbol-marca-milan-de-huezo'],
  [26359, 'Guante de béisbol', 'beisbol', 'par-de-guantes-para-beisbol'],
  [26356, 'Bate de béisbol de madera', 'beisbol', 'bate-de-beisbol-madera'],
  [35087, 'Malla oficial de fútbol', 'mallas', 'malla-oficcial-soccer'],
  [35085, 'Malla de fútbol sala', 'mallas', 'malla-sala-soccer'],
  [26358, 'Conos circulares Milan', 'accesorios', 'conos-circulares-unidad-naranja-marca-milan'],
  [26355, 'Silbato de hierro cromado', 'accesorios', 'silvato-de-hierro-cromo'],
  [26354, 'Silbato de plástico', 'accesorios', 'silvato-de-plastico-unidad-milan-negro'],
  [26357, 'Bomba de mano Milan', 'accesorios', 'bomba-de-mano-negra-marca-milan'],
  [35072, 'Aguja para inflar balones', 'accesorios', 'aguja-para-inflar-balones-unidad'],
  [35070, 'Sellador de balón', 'accesorios', 'sellador-de-balon'],
];

export const IMPLEMENTS: Implement[] = rows.map(([id, name, family, slug]) => ({ id, name, family, image: `/assets/colecciones/${id}.webp`, href: `${OFFICIAL}${slug}/` }));
export const implementsOf = (family: string) => IMPLEMENTS.filter(item => item.family === family);
export const IMPLEMENTS_PAGE = '/implementos';
