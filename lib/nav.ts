// The destinations the site chrome (header, menu, search, footer) offers, in one place.
// External destinations open in a new tab; everything else is an internal route.
import type {IconName} from '@/components/Icon';
import {HELP_WHATSAPP, ORDER_LOOKUP_URL} from './site-links';

type Asset = `/assets/${string}`;
export type NavLink = {label: string; href: string; icon: IconName; external?: boolean; image?: Asset};

export const SEARCH_LABEL = '¿Qué buscas en específico?';
export const CREATE_ORDER_HREF = '/configurador';

export const NAV = {
  crear: {label: 'Crear pedido', href: CREATE_ORDER_HREF, icon: 'plus'},
  promociones: {label: 'Promociones', href: '/promociones', icon: 'tag', image: '/assets/portadas/black-friday-400.webp'},
  implementos: {label: 'Implementos', href: '/implementos', icon: 'ball', image: '/assets/productos/implementos/portada-240.webp'},
  tiendas: {label: 'Tiendas', href: '/tiendas', icon: 'store', image: '/assets/secciones/tiendas/portada-240.webp'},
  consulta: {label: 'Consulta tu pedido', href: ORDER_LOOKUP_URL, icon: 'package', external: true, image: '/assets/secciones/consulta/portada-240.webp'},
  app: {label: 'App Tony', href: '/app-tony', icon: 'phone', image: '/assets/secciones/app-tony/portada-240.webp'},
  ayuda: {label: 'Ayuda', href: HELP_WHATSAPP, icon: 'whatsapp', external: true},
  news: {label: 'Tony News', href: '/tony-news', icon: 'news', image: '/assets/secciones/actualidad/portada-240.webp'},
} satisfies Record<string, NavLink>;

/** What the search shows before anything is typed (here, not in site-directory.ts, so the closed search stays light). */
export const SEARCH_SHORTCUTS: NavLink[] = [NAV.crear, NAV.promociones, NAV.tiendas, NAV.consulta, NAV.implementos, NAV.app, NAV.ayuda];

/** The three short footer columns. */
export const FOOTER_COLUMNS: {title: string; links: NavLink[]}[] = [
  {title: 'Tienda', links: [
    {label: 'Escoge tu disciplina', href: '/producto', icon: 'grid'},
    {label: 'Implementos', href: '/implementos', icon: 'ball'},
    {label: 'Promociones', href: '/promociones', icon: 'tag'},
    {label: 'Crear pedido', href: CREATE_ORDER_HREF, icon: 'plus'},
  ]},
  {title: 'Tony', links: [
    {label: 'Nuestra historia', href: '/nosotros', icon: 'arrow'},
    {label: 'Patrocinios', href: '/patrocinio', icon: 'arrow'},
    {label: 'Calidad', href: '/calidad', icon: 'arrow'},
    {label: 'Tony News', href: '/tony-news', icon: 'news'},
    {label: 'App Tony', href: '/app-tony', icon: 'phone'},
  ]},
  {title: 'Ayuda', links: [
    {label: 'Consulta tu pedido', href: ORDER_LOOKUP_URL, icon: 'package', external: true},
    {label: 'Tiendas', href: '/tiendas', icon: 'store'},
    {label: 'Preguntas frecuentes', href: '/ayuda', icon: 'help'},
    {label: 'Contacto', href: '/contacto', icon: 'chat'},
    {label: 'Mi cuenta', href: '/cuenta', icon: 'user'},
  ]},
];
