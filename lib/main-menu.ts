import {PRODUCT_CATEGORIES} from './products';
import {productCards} from './product-menu';
import {disciplineHref} from './disciplines';
import {CREATE_ORDER_HREF} from './nav';
import {HELP_WHATSAPP, ORDER_LOOKUP_URL} from './site-links';

export type MenuDestination = {
  label: string;
  href: string;
  external?: boolean;
  overview?: string;
  children?: MenuDestination[];
};

// Follow the official menu order, taking customers to the equivalent section of this storefront.
export const MAIN_MENU: MenuDestination[] = [
  {label: 'Inicio', href: '/'},
  {label: 'Creá tu pedido', href: CREATE_ORDER_HREF},
  {label: 'App Tony', href: '/app-tony', overview: 'Descargá la App Tony', children: [
    {label: 'Premios de la app', href: '/colecciones/premios-app'},
  ]},
  {label: 'Tienda en línea', href: '/tienda', overview: 'Ver toda la tienda', children: [
    {label: 'Camisas oficiales de equipos nacionales', href: '/tienda?categoria=camisas-oficiales-de-equipos-nacionales'},
    {label: 'Implementos deportivos', href: '/tienda?categoria=implementos'},
    {label: 'Jerseys', href: '/tienda?categoria=camisas-individuales'},
    {label: 'Camisa Selecta Salvadoreña', href: '/tienda?categoria=camisa-selecta-salvadorena'},
  ]},
  {label: 'Productos', href: '/producto', overview: 'Ver todos los productos', children: PRODUCT_CATEGORIES.map(category => ({
    label: category.label,
    href: disciplineHref(category.id),
    overview: `Ver ${category.shortLabel.toLocaleLowerCase('es')}`,
    children: productCards(category).map(card=>({
      label:category.children.find(child=>'opcion-'+child.id===card.id)?.label ?? card.name, href:card.href,
    })),
  }))},
  {label: 'Promociones', href: '/promociones', overview: 'Ver todas las promociones', children: [
    {label: 'Black Friday', href: '/promociones#black-friday'},
    {label: 'Álbum de promociones', href: '/colecciones/promo-inicio-de-ano'},
  ]},
  {label: 'Patrocinio', href: '/patrocinio'},
  {label: 'Nuestras tiendas', href: '/tiendas'},
  {label: 'Nuestra calidad', href: '/calidad', overview: 'Conocé nuestra calidad', children: [
    {label: 'Líneas de tela', href: '/colecciones/lineas-de-tela'},
    {label: 'Costuras', href: '/colecciones/costuras'},
  ]},
  {label: 'Servicio a domicilio', href: '/entregas'},
  {label: 'Contacto', href: '/contacto'},
  {label: 'Tony News', href: '/tony-news'},
  {label: 'RSE-Tony', href: '/rse'},
];

export const MENU_SERVICE_LINKS: MenuDestination[] = [
  {label: 'Consulta tu pedido', href: ORDER_LOOKUP_URL, external: true},
  {label: 'Ayuda por WhatsApp', href: HELP_WHATSAPP, external: true},
  {label: 'Preguntas frecuentes', href: '/ayuda'},
  {label: 'Mi cuenta', href: '/cuenta'},
  {label: 'Mi carrito', href: '/carrito'},
  {label: 'Somos Tony', href: '/nosotros'},
];
