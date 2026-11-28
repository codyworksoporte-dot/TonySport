import type {CSSProperties} from 'react';
import {PRODUCT_CATEGORIES,type ProductCategory} from '@/lib/products';
import {albumHref,collectionHref,sourceSlug} from '@/lib/collection-path';
import {businessLineIds,businessLines} from '@/lib/business-lines';
import {DISCIPLINES,type Discipline} from '@/lib/disciplines';
import {IMPLEMENT_FAMILIES,IMPLEMENTS_PAGE} from '@/lib/implements';

type Asset = `/assets/${string}`;
const cover = (id:number):Asset => `/assets/colecciones/${id}.webp`;

export type MenuCard = {
  /** Stable identifier used by bookmarks from the previous product directory. */
  id:string;
  name:string;
  group?:string;
  image:Asset;
  href:string;
  /** true when the card opens WhatsApp (a new tab) instead of a page of this site. */
  whatsapp:boolean;
};
export type MenuSection = {
  /** Category id; the section's DOM id is `categoria-<id>`. */
  id:string;
  name:string;
  image:Asset;
  cards:MenuCard[];
  /** true when the first card is the line's featured one (shown 2×2 on wide screens). */
  featured?:boolean;
  more?:{href:string;label:string;cta:string};
};

// Portadas de cada opción, en el mismo orden que el menú oficial.
const images: Record<string, string[]> = {
  'futbol': ['mundial-anime', 'mundial', 'full-sublimado', 'calzoneta-tela', 'sublimado-frontal', 'juveniles', 'dama'],
  'camisas-polos': ['stamp-line', 'premium', 'sublimado-frontal', 'full-sublimada', 'polo-frontal', 'polo-full', 'presentacion'],
  'replicas': ['sublimadas', 'bordadas', 'bordadas-futbol'],
  'bkb': ['full-sublimado', 'calzoneta-tela', 'sublimado-frontal'],
  'racing': ['car-show', 'motorcycle'],
  'ciclismo': ['ruta'],
  'voleibol': ['uniforme'],
  'runners': ['running'],
  'moldes': ['primera-division', 'raglan', 'basico'],
  'logos-3d': ['relieve'],
  'hoddies': ['personalizados', 'lisos'],
};

const optionImage = (category: string, index: number): Asset => `/assets/productos/${category}/${images[category][index]}.webp`;

// The official labels are long; on a picture card a short name reads better. The full label is still
// what the WhatsApp message and the site search use.
const CHILD_NAME:Record<string,string> = {
  'futbol-3':'Camisa y calzoneta full sublimada',
  'futbol-4':'Camisa sublimada y calzoneta de tela',
  'futbol-5':'Sublimado frontal y calzoneta de tela',
  'futbol-7':'Uniformes para dama',
  'camisas-polos-1':'Stamp Line',
  'camisas-polos-2':'Línea Premium',
  'camisas-polos-3':'Sublimado frontal',
  'camisas-polos-4':'Full sublimadas',
  'camisas-polos-5':'Polo sublimado frontal',
  'camisas-polos-6':'Polo full sublimada',
  'camisas-polos-7':'Presentación tipo polo',
  'replicas-1':'Réplicas sublimadas',
  'replicas-2':'Réplicas bordadas',
  'replicas-3':'Réplicas bordadas de fútbol',
  'bkb-1':'Centro y calzoneta full sublimada',
  'bkb-2':'Centro full sublimado y calzoneta de tela',
  'bkb-3':'Sublimado frontal y calzoneta de tela',
};

// Lines with no options in the official menu still get picture cards of their own products.
// Each opens the corresponding album or the line’s collection.
const OWN_CARDS:Record<string,string[]> = {
  ciclismo:['Línea Ciclismo'],
  voleibol:['Uniformes de voleibol'],
  runners:['Línea Runners'],
  moldes:['Molde Primera División','Molde Ranglan','Molde Básico'],
  'logos-3d':['Logos 3D alto relieve'],
  hoddies:['Hoddies personalizados','Hoddies lisos'],
};

// Art direction for official covers whose price or promo strip sits on one edge: the picture is zoomed
// a little, anchored on the side away from that strip, so the card shows the product and not an old price.
// Anchor x/y in % of the picture (0 0 = top left). Covers with the price over the product itself are not
// cropped; they need clean photos from the client.
type Focus = {zoom:number;x:number;y:number};
const FOCUS:Partial<Record<Asset,Focus>> = {
  [cover(35087)]:{zoom:1.3,x:0,y:0}, // Malla oficial: "$109.99" bottom left (keeps its title whole)
  [cover(35085)]:{zoom:1.34,x:0,y:0}, // Malla sala: "$74.99" bottom left
  [cover(35076)]:{zoom:1.36,x:40,y:0}, // Espinilleras Milan Sports: "$3.50" bottom right
  [cover(35074)]:{zoom:1.42,x:70,y:0}, // Espinilleras Aviva: "$3.75" bottom left
};

/** Inline style for a cover that needs art direction (CSS reads --fz/--fx/--fy); undefined for the rest. */
export function imageFocus(image:string):CSSProperties|undefined{
  const focus=FOCUS[image as Asset];
  return focus?{'--fz':String(focus.zoom),'--fx':`${focus.x}%`,'--fy':`${focus.y}%`} as CSSProperties:undefined;
}

// These menu addresses predate the price change on Tony’s official store.
const currentReplicaSlug:Record<string,string>={
  'replicas-bordadas-de-8-99':'replicas-bordadas-de-8-49',
  'replicas-bordadas-de-futbol-de-9-49':'replicas-bordadas-de-futbol-de-10-99',
};
const individualAlbums:Record<string,number[]>={moldes:[36787,36785,36783],hoddies:[34694,36026]};

export function productCards(category:ProductCategory):MenuCard[]{
  if(category.id==='empresarial')return businessLineIds.map(slug=>({
    id:'opcion-empresarial-'+slug,name:'Línea '+businessLines[slug].name,image:`/assets/empresarial/${slug}/portada.webp`,href:'/empresarial/'+slug,whatsapp:false,
  }));
  if(category.id==='implementos')return IMPLEMENT_FAMILIES.map((family,index)=>({
    id:`opcion-implementos-${index+1}`,name:family.name,image:family.cover,href:`${IMPLEMENTS_PAGE}/${family.id}`,whatsapp:false,
  }));
  if(category.children.length){
    const cards=category.children.map((child,index)=>{
      const slug=sourceSlug(child.sourceHref);
      return {
        id:`opcion-${child.id}`,
        name:CHILD_NAME[child.id]??child.label,
        image:optionImage(category.id,index),
        href:collectionHref(currentReplicaSlug[slug]??slug),whatsapp:false,
      };
    });
    if(category.id==='futbol'){
      const replicas=PRODUCT_CATEGORIES.find(item=>item.id==='replicas')!;
      const families=productCards(replicas).map(card=>({...card,group:'Réplicas',id:card.id.replace('opcion-', 'opcion-futbol-')}));
      return [...cards.map(card=>({...card,group:'Uniformes de fútbol'})), ...families];
    }
    return cards;
  }
  return (OWN_CARDS[category.id]??[]).map((name,index)=>({
    id:`opcion-${category.id}-${index+1}`,name,image:optionImage(category.id,index),whatsapp:false,
    href:individualAlbums[category.id] ? albumHref(individualAlbums[category.id][index]) : collectionHref(sourceSlug(category.sourceHref)),
  }));
}

const byId=new Map(PRODUCT_CATEGORIES.map(category=>[category.id,category]));

// Lines with seven options open with a big card (2×2 on a 5-column page, which also fills the second row).
const FEATURED:Record<string,string> = {futbol:'opcion-futbol-1','camisas-polos':'opcion-camisas-polos-3'};

function withFeatured(id:string,cards:MenuCard[]){
  const index=cards.length===7 ? cards.findIndex(card=>card.id===FEATURED[id]) : -1;
  if(index<0)return {cards};
  return {cards:[cards[index],...cards.slice(0,index),...cards.slice(index+1)],featured:true};
}

/** One section per discipline, in DISCIPLINES order (the order of the picture grid). */
export const PRODUCT_MENU:MenuSection[]=DISCIPLINES.flatMap((discipline:Discipline)=>{
  const category=byId.get(discipline.id);
  if(!category)return [];
  return [{
    id:category.id,name:discipline.name,image:discipline.image,...withFeatured(category.id,productCards(category)),
    ...(category.id==='implementos'?{more:{href:IMPLEMENTS_PAGE+'/todos',label:'Ver todos',cta:'Ver todos los implementos'}}:{}),
  }];
});

/** Earlier versions also shared short hashes such as /producto#futbol. */
export const LEGACY_PRODUCT_HASHES:Record<string,string> = {
  futbol:'categoria-futbol',baloncesto:'categoria-bkb',voleibol:'categoria-voleibol',running:'categoria-runners',
  ciclismo:'categoria-ciclismo',racing:'categoria-racing',empresarial:'categoria-empresarial',casual:'categoria-camisas-polos',
  implementos:'categoria-implementos',
};
