// The product menu as pictures: every discipline section on /producto, and every option inside it,
// gets a real product photo from /assets/colecciones. Names stay short; no descriptions, no prices.
// Images were chosen by hand from the official covers, preferring the ones without baked-in prices.
import type {CSSProperties} from 'react';
import {PRODUCT_CATEGORIES,productInquiry,type ProductCategory} from '@/lib/products';
import {sourceCollectionHref} from '@/lib/collections';
import {DISCIPLINES,type Discipline} from '@/lib/disciplines';
import {IMPLEMENT_FAMILIES,IMPLEMENTS_PAGE} from '@/lib/implements';

type Asset = `/assets/${string}`;
const cover = (id:number):Asset => `/assets/colecciones/${id}.webp`;

export type MenuCard = {
  /** DOM id, `opcion-<category>-<n>`: the header, the search and hash links point here. */
  id:string;
  name:string;
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

// Option photos, keyed by the child id from lib/products.ts (`<category>-<n>`, in official menu order).
const CHILD_IMAGE:Record<string,number> = {
  'futbol-1':37742, // Uniformes Mundial Anime 2026
  'futbol-2':37167, // Diseños del Mundial 2026
  'futbol-3':37507, // Camisa y calzoneta full sublimada
  'futbol-4':33938, // Camisa sublimada y calzoneta de tela
  'futbol-5':32440, // Sublimado frontal y calzoneta de tela
  'futbol-6':37623, // Uniformes juveniles
  'futbol-7':31221, // Uniformes para dama
  'camisas-polos-1':33344, // Stamp Line (38075 is the same flyer as Premium)
  'camisas-polos-2':38083, // Línea Premium
  'camisas-polos-3':26644, // Sublimado frontal
  'camisas-polos-4':31986, // Full sublimadas (no collection of its own: nearest real photo)
  'camisas-polos-5':31878, // Polo sublimado frontal
  'camisas-polos-6':31907, // Polo full sublimada
  'camisas-polos-7':28735, // Presentación tipo polo
  'replicas-1':36997, // Réplicas sublimadas
  'replicas-2':32341, // Réplicas bordadas
  'replicas-3':35676, // Réplicas bordadas de fútbol
  'bkb-1':34767, // Centro y calzoneta full sublimada
  'bkb-2':26373, // Centro full sublimado con calzoneta de tela
  'bkb-3':31038, // Sublimado frontal con calzoneta de tela
  'racing-1':34600, // Racing Car Show
  'racing-2':26646, // Racing Motorcycle (clean jersey photo instead of the priced flyer)
  'empresarial-1':34961, // Con cinta reflectiva
  'empresarial-2':36041, // Camisas polo lisas
};

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
  'empresarial-1':'Con cinta reflectiva',
  'empresarial-2':'Camisas polo lisas',
};

// Lines with no options in the official menu still get picture cards of their own products.
// They link to the line's collection (from the category's official address) or to WhatsApp.
const OWN_CARDS:Record<string,[name:string,image:number][]> = {
  ciclismo:[['Línea Ciclismo',36856]],
  voleibol:[['Uniformes de voleibol',35872]],
  runners:[['Línea Runners',36555]],
  moldes:[['Molde Primera División',36787],['Molde Ranglan',36785],['Molde Básico',36783]],
  'logos-3d':[['Logos 3D alto relieve',36849]],
  hoddies:[['Hoddies personalizados',34694],['Hoddies lisos',36026]],
};

const FALLBACK:Asset = '/assets/sections/futbol-tony.webp';

// Art direction for official covers whose price or promo strip sits on one edge: the picture is zoomed
// a little, anchored on the side away from that strip, so the card shows the product and not an old price.
// Anchor x/y in % of the picture (0 0 = top left). Covers with the price over the product itself are not
// cropped; they need clean photos from the client.
type Focus = {zoom:number;x:number;y:number};
const FOCUS:Partial<Record<Asset,Focus>> = {
  [cover(36849)]:{zoom:1.2,x:50,y:0}, // Logos 3D: "$1.75" strip along the bottom
  [cover(36026)]:{zoom:1.38,x:58,y:0}, // Hoddies lisos: "$9.99" bottom left
  [cover(34600)]:{zoom:1.4,x:50,y:100}, // Racing Car Show: "$8.99" top right
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

function linkFor(source:string,inquiryLabel:string){
  const collection=sourceCollectionHref(source);
  return collection?{href:collection,whatsapp:false}:{href:productInquiry(inquiryLabel),whatsapp:true};
}

function cardsOf(category:ProductCategory):MenuCard[]{
  if(category.id==='implementos')return IMPLEMENT_FAMILIES.map((family,index)=>({
    id:`opcion-implementos-${index+1}`,name:family.name,image:family.cover,href:`${IMPLEMENTS_PAGE}#${family.id}`,whatsapp:false,
  }));
  if(category.children.length)return category.children.map(child=>{
    const photo:number|undefined=CHILD_IMAGE[child.id];
    return {
      id:`opcion-${child.id}`,
      name:CHILD_NAME[child.id]??child.label,
      image:photo?cover(photo):FALLBACK,
      ...linkFor(child.sourceHref,child.label),
    };
  });
  return (OWN_CARDS[category.id]??[]).map(([name,image],index)=>({
    id:`opcion-${category.id}-${index+1}`,name,image:cover(image),...linkFor(category.sourceHref,name),
  }));
}

const byId=new Map(PRODUCT_CATEGORIES.map(category=>[category.id,category]));

// Lines with seven options open with a big card (2×2 on a 5-column page, which also fills the second row).
// Camisas leads with its clean "Sublimado frontal" photo; the official first option's flyer shows a price.
const FEATURED:Record<string,string> = {futbol:'opcion-futbol-1','camisas-polos':'opcion-camisas-polos-3'};

function withFeatured(id:string,cards:MenuCard[]){
  const index=cards.findIndex(card=>card.id===FEATURED[id]);
  if(index<0)return {cards};
  return {cards:[cards[index],...cards.slice(0,index),...cards.slice(index+1)],featured:true};
}

/** One section per discipline, in DISCIPLINES order (the order of the picture grid). */
export const PRODUCT_MENU:MenuSection[]=DISCIPLINES.flatMap((discipline:Discipline)=>{
  const category=byId.get(discipline.id);
  if(!category)return [];
  return [{
    id:category.id,name:discipline.name,image:discipline.image,...withFeatured(category.id,cardsOf(category)),
    ...(category.id==='implementos'?{more:{href:IMPLEMENTS_PAGE,label:'Ver todos',cta:'Ver todos los implementos'}}:{}),
  }];
});

/** Old LineExplorer anchors (/producto#futbol…) now land on the matching section. */
export const LEGACY_PRODUCT_HASHES:Record<string,string> = {
  futbol:'categoria-futbol',baloncesto:'categoria-bkb',voleibol:'categoria-voleibol',running:'categoria-runners',
  ciclismo:'categoria-ciclismo',racing:'categoria-racing',empresarial:'categoria-empresarial',casual:'categoria-camisas-polos',
  implementos:'categoria-implementos',
};
