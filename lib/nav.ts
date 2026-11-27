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
  promociones: {label: 'Promociones', href: '/promociones', icon: 'tag', image: '/assets/chrome/tiles/promociones.webp'},
  implementos: {label: 'Implementos', href: '/implementos', icon: 'ball', image: '/assets/chrome/tiles/implementos.webp'},
  tiendas: {label: 'Tiendas', href: '/tiendas', icon: 'store', image: '/assets/chrome/tiles/tiendas.webp'},
  consulta: {label: 'Consulta tu pedido', href: ORDER_LOOKUP_URL, icon: 'package', external: true, image: '/assets/chrome/tiles/consulta.webp'},
  app: {label: 'App Tony', href: '/app-tony', icon: 'phone', image: '/assets/chrome/tiles/app.webp'},
  ayuda: {label: 'Ayuda', href: HELP_WHATSAPP, icon: 'whatsapp', external: true},
  news: {label: 'Tony News', href: '/tony-news', icon: 'news', image: '/assets/chrome/tiles/news.webp'},
} satisfies Record<string, NavLink>;
// Tile photos are light 640x400 copies (public/assets/chrome/tiles) of /assets/hero-campaign-v3.png and
// /assets/sections/{implementos,tiendas,entregas,app-tony,social}-tony.webp. The implementos copy is cropped
// to the ball, bottle and bag of its photo, so the tile shows equipment rather than a jersey.

/** What the search shows before anything is typed (here, not in site-directory.ts, so the closed search stays light). */
export const SEARCH_SHORTCUTS: NavLink[] = [NAV.crear, NAV.promociones, NAV.tiendas, NAV.consulta, NAV.implementos, NAV.app, NAV.ayuda];

/** Small text links at the end of the menu. */
export const MENU_MORE: NavLink[] = [
  {label: 'Somos Tony', href: '/nosotros', icon: 'arrow'},
  {label: 'Patrocinios', href: '/patrocinio', icon: 'arrow'},
  {label: 'Calidad', href: '/calidad', icon: 'arrow'},
  {label: 'Preguntas frecuentes', href: '/ayuda', icon: 'help'},
  {label: 'Mi cuenta', href: '/cuenta', icon: 'user'},
  {label: 'Mi carrito', href: '/carrito', icon: 'bag'},
];

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
