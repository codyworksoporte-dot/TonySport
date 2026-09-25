import {DEFAULT_ELEMENTS, ELEMENT_LABELS, readElements, readLayers, TECHNIQUES, techniqueLabel, type StudioLayer, type TemplateElements, type Technique} from './studio';

export const ORDER_STORAGE_KEY = 'tony-team-order-v2';
export const LEGACY_STORAGE_KEY = 'tony-uniform-draft-v1';
export const MIN_QUANTITY = 6;
export const MAX_QUANTITY = 999;
export const SIZES = ['2','4','6','8','10','12','14','16','XS','S','M','L','XL','2XL','3XL','4XL'] as const;
export const FABRICS = ['Por definir con Tony','Slim Fit','Slim Pro','Modern Carving','Dryfit','Premier','Drycool'] as const;
export type Player = { id: string; name: string; size: string; number: string; role: 'field'|'goalkeeper' };
export type Placement = { x: number; y: number; scale: number };
export type Design = { variant: 'clean'|'stripe'|'scales'; color: string; accent: string; mode: 'template'|'reference'; sponsor: string; crest: Placement; sponsorPlacement: Placement; layers: StudioLayer[]; elements: TemplateElements };
export type Garment = { mold: 'Hombre'|'Mujer'|'Mixto'; construction: 'Estándar'|'Raglan'|'Primera División'; fabric: string; collar: 'v'|'round'|'chinese'|'polo'; sleeve: 'short'|'long'; shortsNumber: boolean; technique: Technique };
export type OrderDraft = { version: 2; quantity: string; line: 'kit'|'shirt'; team: string; players: Player[]; design: Design; garment: Garment; notes: string };
export type OrderErrors = Record<string,string>;
export type DesignAssets = Record<string, string | undefined>;
export const newPlayer = (index: number): Player => ({id:`player-${index+1}`,name:'',size:'',number:'',role:'field'});
export function createOrder(): OrderDraft {
  return {version:2,quantity:'12',line:'kit',team:'',players:Array.from({length:12},(_,i)=>newPlayer(i)),design:{variant:'clean',color:'#F3F5EF',accent:'#2264E8',mode:'template',sponsor:'',crest:{x:63,y:31,scale:1},sponsorPlacement:{x:50,y:52,scale:1},layers:[],elements:{...DEFAULT_ELEMENTS}},garment:{mold:'Mixto',construction:'Estándar',fabric:'Por definir con Tony',collar:'v',sleeve:'short',shortsNumber:false,technique:'define'},notes:''};
}
export const quantityOf = (order: OrderDraft) => /^\d{1,3}$/.test(order.quantity) ? Number(order.quantity) : 0;
export const activePlayers = (order: OrderDraft) => order.players.slice(0,quantityOf(order));
export const playerComplete = (p: Player) => Boolean(p.name.trim() && p.name.trim().length <= 24 && SIZES.includes(p.size as typeof SIZES[number]) && /^\d{1,2}$/.test(p.number));
export function withQuantity(order: OrderDraft, quantity: string): OrderDraft {
  const count = /^\d{1,3}$/.test(quantity) ? Number(quantity) : 0;
  const players = [...order.players];
  if(count <= MAX_QUANTITY) while(players.length < count) players.push(newPlayer(players.length));
  return {...order,quantity,players};
}
export function validateOrder(order: OrderDraft, through: number): OrderErrors {
  const errors: OrderErrors = {};
  const quantity = quantityOf(order);
  if(quantity < MIN_QUANTITY || quantity > MAX_QUANTITY) errors['cfg-quantity'] = `Escribe una cantidad de ${MIN_QUANTITY} a ${MAX_QUANTITY} uniformes.`;
  if(through >= 2){
    if(!order.team.trim() || order.team.trim().length > 24) errors['cfg-team'] = 'Escribe el nombre del equipo (hasta 24 caracteres).';
    activePlayers(order).forEach((player,index)=>{
      if(!player.name.trim() || player.name.trim().length > 24) errors[`player-${index}-name`] = 'Escribe el nombre que irá en la prenda.';
      if(!SIZES.includes(player.size as typeof SIZES[number])) errors[`player-${index}-size`] = 'Elige una talla.';
      if(!/^\d{1,2}$/.test(player.number)) errors[`player-${index}-number`] = 'Usa un dorsal del 0 al 99.';
    });
  }
  return errors;
}
const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[\da-f]{6}$/i.test(v);
const textValue = (v: unknown,max: number) => typeof v === 'string' ? v.slice(0,max) : '';
function placement(value: unknown, fallback: Placement): Placement {
  if(!value || typeof value !== 'object') return {...fallback};
  const p=value as Record<string,unknown>;
  return {x:typeof p.x==='number' && Number.isFinite(p.x)?Math.max(10,Math.min(90,p.x)):fallback.x,y:typeof p.y==='number' && Number.isFinite(p.y)?Math.max(15,Math.min(85,p.y)):fallback.y,scale:typeof p.scale==='number' && Number.isFinite(p.scale)?Math.max(.4,Math.min(2,p.scale)):fallback.scale};
}
export function readOrder(value: unknown): OrderDraft|null {
  if(!value || typeof value!=='object') return null;
  const raw=value as Record<string,unknown>;
  if(raw.version!==2 || !Array.isArray(raw.players) || raw.players.length>MAX_QUANTITY || !raw.design || typeof raw.design!=='object') return null;
  const initial=createOrder(), d=raw.design as Record<string,unknown>, g=(raw.garment && typeof raw.garment==='object'?raw.garment:{}) as Record<string,unknown>;
  const players=raw.players.map((item,index)=>{
    const p=item && typeof item==='object'?item as Record<string,unknown>:{};
    return {...newPlayer(index),name:textValue(p.name,24),size:SIZES.includes(p.size as typeof SIZES[number])?p.size as string:'',number:textValue(p.number,2).replace(/\D/g,''),role:p.role==='goalkeeper'?'goalkeeper' as const:'field' as const};
  });
  return withQuantity({...initial,line:raw.line==='shirt'?'shirt':'kit',team:textValue(raw.team,24),notes:textValue(raw.notes,800),players,design:{variant:d.variant==='stripe'||d.variant==='scales'?d.variant:'clean',color:isHex(d.color)?d.color:initial.design.color,accent:isHex(d.accent)?d.accent:initial.design.accent,mode:d.mode==='reference'?'reference':'template',sponsor:textValue(d.sponsor,30),crest:placement(d.crest,initial.design.crest),sponsorPlacement:placement(d.sponsorPlacement,initial.design.sponsorPlacement),layers:readLayers(d.layers),elements:readElements(d.elements)},garment:{mold:g.mold==='Hombre'||g.mold==='Mujer'?g.mold:'Mixto',construction:g.construction==='Raglan'||g.construction==='Primera División'?g.construction:'Estándar',fabric:FABRICS.includes(g.fabric as typeof FABRICS[number])?g.fabric as string:initial.garment.fabric,collar:g.collar==='round'||g.collar==='chinese'||g.collar==='polo'?g.collar:'v',sleeve:g.sleeve==='long'?'long':'short',shortsNumber:g.shortsNumber===true,technique:TECHNIQUES.some(item=>item.value===g.technique)?g.technique as Technique:initial.garment.technique}},textValue(raw.quantity,3));
}
export function migrateOrder(value: unknown): OrderDraft|null {
  if(!value || typeof value!=='object') return null;
  const legacy=value as Record<string,unknown>;
  if(typeof legacy.team!=='string' || typeof legacy.quantity!=='string') return null;
  const order=withQuantity(createOrder(),legacy.quantity);
  order.team=legacy.team.slice(0,24);order.notes=textValue(legacy.notes,800);
  if(isHex(legacy.color))order.design.color=legacy.color;
  if(legacy.style==='stripe'||legacy.style==='scales'||legacy.style==='clean')order.design.variant=legacy.style;
  // An old sample number never becomes the number of an actual player.
  return order;
}
export const collarLabel = (value: Garment['collar']) => ({v:'En V',round:'Redondo',chinese:'Chino',polo:'Polo'})[value];
export const variantLabel = (value: Design['variant']) => ({clean:'Esencial',stripe:'Franja',scales:'Escamas (opcional)'})[value];
export function designInstructions(design: Design): string[] {
  if(design.mode==='reference') return ['Usar los archivos de referencia aportados por el cliente. Las capas de la base editable no forman parte de esta vista.'];
  const removed = (Object.keys(ELEMENT_LABELS) as (keyof TemplateElements)[]).filter(key => !design.elements[key]);
  const layers = design.layers.filter(layer => layer.visible && layer.opacity > 0);
  return [
    ...(removed.length ? [`Elementos de plantilla retirados: ${removed.map(key => ELEMENT_LABELS[key]).join(', ')}.`] : []),
    ...layers.map((layer, index) => `${index + 1}. ${layer.side === 'front' ? 'Frente' : 'Espalda'} · ${layer.kind === 'text' ? `Texto «${layer.text || ''}» (${layer.color})` : `Archivo «${layer.name}»`} · Centro ${Math.round(layer.x)}% / ${Math.round(layer.y)}% · Tamaño ${Math.round(layer.width)}% × ${Math.round(layer.height)}% · Giro ${Math.round(layer.rotation)}° · Opacidad ${Math.round(layer.opacity * 100)}%.`),
    ...(layers.length ? ['Orden de elementos: del fondo hacia adelante. Las posiciones se muestran en las vistas PNG.'] : []),
  ];
}
export function orderText(order: OrderDraft) {
  return [
    'TONY SPORTSWEAR · SOLICITUD DE COTIZACIÓN', `Equipo: ${order.team.trim()}`, `Cantidad: ${order.quantity}`,
    `Línea: ${order.line==='kit'?'Uniforme completo (camisa + calzoneta)':'Solo camisa'}`,
    `Técnica solicitada: ${techniqueLabel(order.garment.technique)}`,
    `Diseño: ${order.design.mode==='reference'?'Referencia propia':variantLabel(order.design.elements.pattern ? order.design.variant : 'clean')}`,
    `Colores: ${order.design.color} / ${order.design.accent}`, `Molde: ${order.garment.mold}`,
    `Confección: ${order.garment.construction}`, `Tela: ${order.garment.fabric}`,
    `Cuello: ${collarLabel(order.garment.collar)}`, `Manga: ${order.garment.sleeve==='short'?'Corta':'Larga'}`,
    ...(order.line==='kit'?[`Número en calzoneta: ${order.garment.shortsNumber?'Sí':'No'}`]:[]),
    ...(order.design.sponsor?[`Patrocinador: ${order.design.sponsor}`]:[]),
    '', 'PERSONALIZACIÓN', ...designInstructions(order.design),
    '', 'NÓMINA DE JUGADORES',
    ...activePlayers(order).map((p,i)=>`${i+1}. ${p.name.trim()} | Talla ${p.size} | Dorsal ${p.number}${p.role==='goalkeeper'?' | Portero':''}`),
    ...(order.notes.trim()?['',`Indicaciones: ${order.notes.trim()}`]:[]), '',
    'Solicitud pendiente de cotización y aprobación del diseño, técnica y tela. Las vistas PNG del editor y los archivos originales se adjuntan por separado.',
  ].join('\n');
}
export function rosterCSV(order: OrderDraft) {
  const cell=(value:string)=>`"${(/^[=+@\-\t\r]/.test(value)?"'":'')+value.replace(/"/g,'""')}"`;
  return '\uFEFF'+[['Jugador','Nombre','Talla','Número','Rol'],...activePlayers(order).map((p,i)=>[String(i+1),p.name,p.size,p.number,p.role==='goalkeeper'?'Portero':'Jugador'])].map(row=>row.map(cell).join(',')).join('\r\n');
}

