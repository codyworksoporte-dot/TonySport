import categories from '@/data/collection-categories.json';
import stores from '@/data/tony-stores.json';
import {DISCIPLINES, DISCIPLINES_TITLE, disciplineHref} from './disciplines';
import {IMPLEMENT_FAMILIES, IMPLEMENTS_PAGE, implementsOf} from './implements';
import {CREATE_ORDER_HREF, NAV} from './nav';
import {PRODUCT_CATEGORIES} from './products';
import {PROMOTIONS, PROMOTIONS_PAGE} from './promotions';

/** One destination the site search can offer. `external` ones open in a new tab; `image` adds a thumbnail. */
export type DirectoryEntry = {href: string; label: string; group: string; terms: string; external?: boolean; image?: `/assets/${string}`};

const sections: DirectoryEntry[] = [
  {href: '/', label: 'Inicio', group: 'TONY', terms: 'pagina principal portada'},
  {href: '/tienda', label: 'Tienda en línea', group: 'ACCESOS', terms: 'comprar catálogo productos buscar precio jerseys camisas implementos'},
  {href: CREATE_ORDER_HREF, label: 'Crear mi pedido', group: 'ACCESOS', terms: 'crea tu pedido uniforme camisa editor cantidad jugadores nombre numero dorsal talla escudo diseño personalizar cotizar configurador'},
  {href: PROMOTIONS_PAGE, label: 'Promociones', group: 'ACCESOS', terms: `black friday promos ofertas descuentos rebajas campañas ${PROMOTIONS.map(promo => promo.title).join(' ')}`, image: NAV.promociones.image},
  {href: NAV.consulta.href, label: 'Consulta tu pedido', group: 'ACCESOS', terms: 'estado de mi pedido seguimiento rastrear orden entrega envio entregas domicilio', external: true, image: NAV.consulta.image},
  {href: '/app-tony', label: 'Descarga la App Tony', group: 'ACCESOS', terms: 'app aplicacion android ios iphone google play app store puntos premios canje recompensas descargar', image: NAV.app.image},
  {href: NAV.ayuda.href, label: 'Ayuda por WhatsApp', group: 'ACCESOS', terms: 'ayuda whatsapp 7015 5571 contacto chat telefono escribir asesor', external: true},
  {href: '#contactos', label: 'Contactos · WhatsApp y correo', group: 'ACCESOS', terms: 'telefono email correo whatsapp 7015 5571 contactanos'},
  {href: '/carrito', label: 'Mi carrito', group: 'PEDIDOS Y CUENTA', terms: 'compras pedido uniforme guardado cotizar pagar carrito'},
  {href: '/producto', label: DISCIPLINES_TITLE, group: 'ESCOGE TU DISCIPLINA', terms: 'producto productos lineas deportes uniformes ropa empresas', image: DISCIPLINES[0].image},
];

const disciplines: DirectoryEntry[] = DISCIPLINES.map(discipline => {
  const category = PRODUCT_CATEGORIES.find(item => item.id === discipline.id);
  return {
    href: disciplineHref(discipline.id), label: discipline.name, group: 'ESCOGE TU DISCIPLINA', image: discipline.image,
    terms: `uniformes ${discipline.id} ${category ? `${category.label} ${category.shortLabel} ${category.children.map(child => child.label).join(' ')}` : ''}`,
  };
});

const implementsEntries: DirectoryEntry[] = [
  {href: IMPLEMENTS_PAGE, label: 'Implementos deportivos', group: 'IMPLEMENTOS DEPORTIVOS', terms: 'implementos balones guantes accesorios equipo deportivo', image: NAV.implementos.image},
  ...IMPLEMENT_FAMILIES.map(family => ({
    href: `${IMPLEMENTS_PAGE}#${family.id}`, label: family.name, group: 'IMPLEMENTOS DEPORTIVOS', image: family.cover,
    terms: `implementos ${implementsOf(family.id).map(item => item.name).join(' ')}`,
  })),
];

// Each confection option keeps its official album, or its place on the product page.
const options: DirectoryEntry[] = PRODUCT_CATEGORIES.flatMap(category => category.children.map(child => {
  const collection = categories.find(item => child.sourceHref.split('/').filter(Boolean).at(-1) === item.slug);
  return {href: collection ? `/colecciones?categoria=${encodeURIComponent(collection.slug)}` : `/producto#opcion-${child.id}`, label: child.label, group: 'OPCIONES DE CONFECCIÓN', terms: `${category.label} ${category.shortLabel}`};
}));

// Album names come from the official site as typed there: some carry an old price ("Replicas Sublimadas $8.99")
// or are all capitals. The search shows the name only, without the price, in normal case.
const KEEP_CAPS = new Set(['rse', 'tony', 'bkb', 'app', '3d']);
const SMALL_WORDS = new Set(['de', 'del', 'y', 'la', 'el', 'con', 'para', 'a']);
function albumName(name: string) {
  const plain = name.replace(/\s*(de\s+)?\$\s?\d+(?:[.,]\d+)?/gi, '').replace(/\s{2,}/g, ' ').trim();
  if (plain !== plain.toUpperCase()) return plain;
  return plain.toLowerCase().split(/([\s-]+)/).map((word, index) =>
    KEEP_CAPS.has(word) ? word.toUpperCase() : index > 0 && SMALL_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

const collections: DirectoryEntry[] = [
  {href: '/colecciones', label: 'Todas las colecciones y uniformes', group: 'COLECCIONES', terms: 'colecciones mundial anime camisetas ropa prendas modelos'},
  ...categories.map(category => ({href: `/colecciones?categoria=${encodeURIComponent(category.slug)}`, label: albumName(category.name), group: 'COLECCIONES', terms: `uniformes imagenes ${category.slug}`})),
];

const storeEntries: DirectoryEntry[] = [
  {href: NAV.tiendas.href, label: 'Tiendas', group: 'TIENDAS', terms: `${stores.length} tiendas sucursales ubicaciones direcciones horarios mapa`, image: NAV.tiendas.image},
  ...stores.map(store => ({href: `/tiendas?tienda=${encodeURIComponent(store.name)}`, label: `Tienda ${store.name}`, group: 'TIENDAS', terms: `sucursal ${store.zone} ${store.address} ${store.phone}`})),
];

const companyEntries: DirectoryEntry[] = [
  {href: '/nosotros', label: 'Nuestra historia', group: 'SOMOS TONY', terms: 'somos tony quienes somos empresa el salvador'},
  {href: '/patrocinio', label: 'Patrocinios', group: 'SOMOS TONY', terms: 'patrocinio equipos proyectos apoyo'},
  {href: '/comunidad', label: 'Comunidad', group: 'SOMOS TONY', terms: 'responsabilidad social conexion'},
  {href: '/calidad', label: 'Calidad y confección', group: 'SOMOS TONY', terms: 'telas tecnicas acabados materiales sublimado bordado estampado'},
  {href: NAV.news.href, label: 'Tony News', group: 'SOMOS TONY', terms: 'noticias videos publicaciones redes tiktok instagram facebook', image: NAV.news.image},
];

const helpEntries: DirectoryEntry[] = [
  {href: '/entregas', label: 'Servicio a domicilio', group: 'AYUDA', terms: 'entregas envíos cobertura dirección domicilio'},
  {href: '/ayuda', label: 'Preguntas frecuentes', group: 'AYUDA', terms: 'faq dudas respuestas tallas pedidos centro de ayuda'},
  {href: '/contacto', label: 'Contacto', group: 'AYUDA', terms: 'contactanos whatsapp correo telefono escribir'},
  {href: '/ayuda#reclamos', label: 'Cambios, garantías y reclamos', group: 'AYUDA', terms: 'devoluciones cancelar cancelacion reembolso retracto reversion atencion cliente problema pedido'},
  {href: '/cuenta', label: 'Mi cuenta', group: 'PEDIDOS Y CUENTA', terms: 'iniciar sesion entrar login registro contraseña'},
  {href: '/cuenta?accion=recuperar', label: 'Recuperar contraseña', group: 'PEDIDOS Y CUENTA', terms: 'olvide clave acceso correo restablecer'},
  {href: '/cuenta?accion=registro', label: 'Crear mi cuenta', group: 'PEDIDOS Y CUENTA', terms: 'registro registrarse email correo verificar'},
  {href: '/cuenta?accion=cambiar', label: 'Cambiar mi contraseña', group: 'PEDIDOS Y CUENTA', terms: 'seguridad clave cuenta'},
  {href: '/privacidad', label: 'Privacidad y uso de tus datos', group: 'INFORMACIÓN', terms: 'politica datos personales derechos eliminar corregir'},
  {href: '/terminos', label: 'Términos y condiciones', group: 'INFORMACIÓN', terms: 'contrato pedido cotizacion precios pagos anticipo cancelacion devolucion garantia retracto reembolso'},
  {href: '/cookies', label: 'Cookies y almacenamiento', group: 'INFORMACIÓN', terms: 'privacidad navegador borrador guardado datos preferencias redes almacenamiento local'},
];

// The first entry for a destination wins: an album reached from two menu options appears once.
const seen = new Set<string>();
export const SITE_DIRECTORY: DirectoryEntry[] = [...sections, ...disciplines, ...implementsEntries, ...storeEntries, ...companyEntries, ...helpEntries, ...options, ...collections]
  .filter(item => !seen.has(item.href) && Boolean(seen.add(item.href)));

/**
 * @deprecated The redesigned chrome does not use these lists. They stay exported (with only current
 * destinations) because the pre-redesign backup in output/respaldo-antes-rediseno-2026-11-24 imports them.
 */
export const company: [href: string, label: string, description: string][] = companyEntries.map(item => [item.href, item.label, item.terms]);
/** @deprecated See `company`. */
export const customer: [href: string, label: string, description: string][] = [...storeEntries.slice(0, 1), ...helpEntries.slice(0, 4)].map(item => [item.href, item.label, item.terms]);

/** What the search shows before anything is typed (kept in lib/nav.ts; re-exported for older importers). */
export {SEARCH_SHORTCUTS} from './nav';
