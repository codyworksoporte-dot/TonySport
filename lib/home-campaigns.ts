import { BLACK_FRIDAY, PROMOTIONS_PAGE } from './promotions';
import { siteAsset } from './asset-path';
import { storefrontImage } from './storefront-image';

export type Campaign = {
  id: string;
  title: string;
  detail: string;
  action: string;
  href: string;
  image?: string;
};

const entries: Campaign[] = [
  {id: 'domicilio', title: 'Servicio a domicilio en El Salvador', detail: 'Consultá cómo recibir el pedido de tu equipo.', action: 'Ver entregas', href: '/entregas'},
  {id: 'black-friday', title: 'Black Friday · 30% OFF', detail: BLACK_FRIDAY.dates, action: 'Ver promoción', href: PROMOTIONS_PAGE + '#' + BLACK_FRIDAY.id},
  {id: 'portero', title: 'Uniforme de portero y gafete de capitán', detail: 'De regalo desde 12 uniformes de la línea Slim Fit participante.', action: 'Ver condiciones', href: 'https://www.tonysportselsalvador.com/producto/26184/'},
  {id: 'premios', title: 'Tus compras suman puntos', detail: 'Pedí tus puntos en la App Tony y canjealos por premios para tu equipo.', action: 'Ver premios', href: '/colecciones?categoria=premios-app'},
  {id: 'personalizados', title: 'Tu diseño, tus colores', detail: 'Personalizá el uniforme con el escudo y los nombres de tu equipo.', action: 'Crear mi pedido', href: '/configurador'},
  {id: 'replicas', title: 'Descubrí las réplicas', detail: 'Explorá los diseños del catálogo de Tony.', action: 'Ver réplicas', href: '/producto#categoria-replicas'},
  {id: 'tiendas', title: 'Encontrá tu tienda Tony', detail: 'Consultá ubicaciones y contactá a la sucursal más cercana.', action: 'Ver tiendas', href: '/tiendas'},
];

// A new upload takes effect at the next build. Never request an image that hasn't been supplied.
export function homeCampaigns(): Campaign[] {
  return entries.map(entry => {
    const image = storefrontImage(entry.id) ?? (entry.id === BLACK_FRIDAY.id ? siteAsset('/assets/portadas/black-friday-400.webp') : undefined);
    return {...entry, image};
  });
}
