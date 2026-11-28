import { siteAsset } from './asset-path';
import { BLACK_FRIDAY } from './promotions';

export type Campaign = {id: string; title: string; href: string; image: string; strip?: string};

function campaign(id: string, title: string, href: string, strip = false): Campaign {
  return {
    id, title, href, image: siteAsset(`/assets/inicio/anuncios/${id}.webp`),
    strip: strip ? siteAsset(`/assets/inicio/franjas/${id}.webp`) : undefined,
  };
}

export const homeCampaigns = [
  campaign('black-friday', 'Black Friday, 30% de descuento. ' + BLACK_FRIDAY.dates, '/promociones#black-friday', true),
  campaign('crea-tu-pedido', 'Creá tu pedido. Diseñá tu uniforme desde la web o la app. Pagá en línea. ¡Así de fácil!', '/configurador'),
  campaign('tiendas-nacional', '14 tiendas a nivel nacional. Ver el directorio de tiendas Tony Sportswear', '/tiendas'),
  campaign('portero', 'Uniforme de portero y gafete de regalo desde 12 uniformes de la línea Slim Fit participante', 'https://www.tonysportselsalvador.com/producto/26184/', true),
  campaign('premios', 'Canjeá tus puntos de la App Tony por premios', '/colecciones/premios-app', true),
  campaign('personalizados', 'Personalizá el uniforme de tu equipo', '/configurador'),
];
