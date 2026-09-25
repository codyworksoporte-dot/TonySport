import official from '@/data/tony-products.json';

type SourceCategory = {label:string;href:string;children:SourceCategory[]};
export type ProductCategory = {
  id:string;label:string;shortLabel:string;line:string;description:string;sourceHref:string;
  children:{id:string;label:string;sourceLabel:string;sourceHref:string}[];
};
// This mapping retains every category in the official Producto menu. No prices or inventory are imported.
const presentation = [
  ['futbol','Confección de uniformes de fútbol','Fútbol','futbol','Colores, nombres y dorsales para representar a tu equipo.'],
  ['camisas-polos','Camisas deportivas y tipo polo','Camisas y polos','casual','Opciones de camisa, cuello y acabado para tu grupo.'],
  ['ciclismo','Línea Ciclismo','Ciclismo','ciclismo','Una identidad para el club, en cada recorrido.'],
  ['replicas','Diferentes réplicas','Réplicas','futbol','Explora las familias de réplicas sublimadas y bordadas.'],
  ['bkb','Uniformes BKB','Baloncesto / BKB','baloncesto','Uniformes de baloncesto con distintas combinaciones de confección.'],
  ['voleibol','Uniformes de Voleibol','Voleibol','voleibol','Diseño y personalización para acompañar cada punto.'],
  ['racing','Línea Racing','Racing','racing','Racing Car Show y Motorcycle, con identidad propia.'],
  ['empresarial','Línea Empresarial','Empresarial','empresarial','Prendas para tu equipo de trabajo y tu marca.'],
  ['runners','Línea Runners','Runners','running','Colores compartidos para grupos que corren juntos.'],
  ['moldes','Moldes de fútbol','Moldes de fútbol','futbol','Conoce las opciones de corte antes de definir tu uniforme.'],
  ['logos-3d','Logos 3D Alto Relieve','Logos 3D','calidad','Consulta cómo llevar el escudo y la marca al alto relieve.'],
  ['implementos','Implementos Deportivos','Implementos','implementos','Los complementos que acompañan el juego de tu equipo.'],
  ['hoddies','Hoddies','Hoddies','casual','Sudaderas con capucha para completar la identidad del grupo.'],
];
const childLabel=(value:string)=>value
  .replace(/\s*(?:de\s*)?\$[\d.]+/g,'')
  .replaceAll('Replicas','Réplicas').replaceAll('Fùtbol','Fútbol').replaceAll('Confecciòn','Confección')
  .replaceAll('Presentaciòn','Presentación').replaceAll('Linea','Línea').replace(/-personalizados?/gi,' · personalizado').trim();

export const PRODUCT_CATEGORIES:ProductCategory[]=(official.menu.children as SourceCategory[]).map((category,index)=>{
  const [id,label,shortLabel,line,description]=presentation[index];
  return {id,label,shortLabel,line,description,sourceHref:category.href,children:category.children.map((child,childIndex)=>({id:`${id}-${childIndex+1}`,label:childLabel(child.label),sourceLabel:child.label,sourceHref:child.href}))};
});
export const productHref=(category:ProductCategory)=>`/producto#categoria-${category.id}`;
export const productInquiry=(label:string)=>`https://wa.me/50370155571?text=${encodeURIComponent(`Hola, Tony. Quisiera información sobre ${label}. Necesito confirmar diseños, tallas, cantidades y opciones disponibles.`)}`;
