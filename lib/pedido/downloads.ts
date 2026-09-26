import {siteAsset} from '../asset-path';
import {isPedidoImage} from './order';
import {calculatePedido, money, PRODUCTS} from './pricing';
import type {Buyer, Delivery, PedidoDraft, PedidoPricing} from './types';

export interface DownloadReceipt {
  id: string; reference?: string; status: string;
  totalCents: number; depositCents: number; balanceCents: number; paymentStatus: string;
}
export interface PedidoDocumentData {
  draft: PedidoDraft; buyer: Buyer; delivery: Delivery; signature: string;
  receipt: DownloadReceipt; termsVersion: string;
}
const WIDTH = 1240, HEIGHT = 1754, MARGIN = 76, BOTTOM = 1600;
const GREEN = '#0D3528', LIME = '#91DC36', INK = '#182720', MUTED = '#64736B';

function filename(value: string) {return value.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0,100) || 'tony-pedido';}
function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; document.body.append(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
async function loadImage(source: string): Promise<HTMLImageElement> {
  if (!isPedidoImage(source)) throw new Error('El archivo de diseño no es una imagen admitida.');
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => {image.src = ''; reject(new Error('La imagen está tardando demasiado. Intenta la descarga de nuevo.'));}, 20_000);
    image.onload = () => {window.clearTimeout(timeout); resolve(image);};
    image.onerror = () => {window.clearTimeout(timeout); reject(new Error('No pudimos abrir una imagen del pedido. Vuelve a cargarla antes de descargar.'));};
    image.src = source.startsWith('/assets/') ? siteAsset(source as `/assets/${string}`) : source;
  });
}
function placeImage(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * ratio, h = image.naturalHeight * ratio;
  context.drawImage(image, x + (width-w)/2, y + (height-h)/2, w, h);
}

/** Produces a real PNG even when the original is WebP. Nothing is uploaded or persisted. */
export async function downloadDesign(data: string, name: string): Promise<void> {
  const image = await loadImage(data), canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Este navegador no pudo preparar tu diseño.');
  context.drawImage(image, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('No pudimos generar el archivo PNG.')), 'image/png'));
  save(blob, `${filename(name.replace(/\.[a-z]+$/i, ''))}.png`);
}

class DocumentPages {
  readonly pages: HTMLCanvasElement[] = [];
  private context!: CanvasRenderingContext2D;
  y = 0;
  constructor(private readonly title: string, private readonly reference: string) {this.next();}
  get ctx() {return this.context;}
  next() {
    const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Este navegador no pudo preparar el documento.');
    this.pages.push(canvas); this.context = context;
    context.fillStyle = '#FFFFFF'; context.fillRect(0,0,WIDTH,HEIGHT);
    context.fillStyle = GREEN; context.fillRect(0,0,WIDTH,206);
    context.fillStyle = LIME; context.fillRect(MARGIN,52,8,82);
    context.font = 'bold 24px Arial'; context.fillText('TONY SPORTSWEAR', MARGIN+26,75);
    context.fillStyle = '#FFFFFF'; context.font = 'bold 42px Arial'; context.fillText(this.title, MARGIN+26,130);
    context.font = '22px Arial'; context.fillStyle = '#C6D9CD'; context.fillText('El detalle de tu equipo, en tus manos.', MARGIN+26,166);
    this.y = 252;
    this.paragraph(`Pedido ${this.reference}`, {bold: true, size: 25, color: GREEN});
    this.y += 18;
  }
  ensure(height: number) {if (this.y + height > BOTTOM) this.next();}
  lines(value: string, width: number, size = 24, bold = false): string[] {
    this.context.font = `${bold ? 'bold ' : ''}${size}px Arial`;
    const output: string[] = [];
    for (const paragraph of String(value).split(/\r?\n/)) {
      let line = '';
      for (const word of paragraph.split(/\s+/)) {
        if (!word) continue;
        const candidate = line ? `${line} ${word}` : word;
        if (this.context.measureText(candidate).width <= width) {line = candidate; continue;}
        if (line) output.push(line);
        line = '';
        for (const letter of word) {
          if (line && this.context.measureText(line+letter).width > width) {output.push(line); line = '';}
          line += letter;
        }
      }
      output.push(line);
    }
    return output;
  }
  paragraph(value: string, options: {bold?: boolean; size?: number; color?: string; gap?: number} = {}) {
    const size = options.size || 24, lineHeight = size * 1.4;
    for (const line of this.lines(value, WIDTH-MARGIN*2, size, options.bold)) {
      this.ensure(lineHeight);
      this.context.fillStyle = options.color || INK; this.context.font = `${options.bold ? 'bold ' : ''}${size}px Arial`;
      this.context.fillText(line, MARGIN, this.y); this.y += lineHeight;
    }
    this.y += options.gap ?? 10;
  }
  section(title: string) {
    this.ensure(118); this.y += 15;
    this.context.fillStyle = '#EEF4EF'; this.context.fillRect(MARGIN,this.y-27,WIDTH-MARGIN*2,54);
    this.context.fillStyle = GREEN; this.context.font = 'bold 24px Arial'; this.context.fillText(title.toUpperCase(),MARGIN+16,this.y+8);
    this.y += 66;
  }
  detail(label: string, value: string) {
    const labelWidth = 302, valueWidth = WIDTH-MARGIN*2-labelWidth;
    const lines = this.lines(value || '-',valueWidth,24), height = Math.max(40,lines.length*33+14);
    this.ensure(height);
    this.context.fillStyle = MUTED; this.context.font = '22px Arial'; this.context.fillText(label,MARGIN,this.y);
    this.context.fillStyle = INK; this.context.font = '24px Arial';
    lines.forEach((line,index) => this.context.fillText(line,MARGIN+labelWidth,this.y+index*33));
    this.y += height;
  }
  amount(label: string, cents: number, total = false) {
    this.ensure(total?78:48);
    if (total) {this.context.fillStyle=GREEN; this.context.fillRect(MARGIN-12,this.y-30,WIDTH-MARGIN*2+24,60);}
    this.context.fillStyle=total?'#FFFFFF':INK; this.context.font=`${total?'bold ':''}${total?29:24}px Arial`;
    this.context.fillText(label,MARGIN,this.y+4);
    this.context.textAlign='right'; this.context.fillText(money(cents),WIDTH-MARGIN,this.y+4); this.context.textAlign='left';
    this.y += total?84:47;
  }
  footer() {
    this.pages.forEach((page,index) => {
      const context = page.getContext('2d')!;
      context.strokeStyle='#DCE6DF'; context.lineWidth=2; context.beginPath(); context.moveTo(MARGIN,1650); context.lineTo(WIDTH-MARGIN,1650); context.stroke();
      context.fillStyle=MUTED; context.font='19px Arial'; context.fillText('TONY SPORTSWEAR · Documento del pedido',MARGIN,1686);
      context.textAlign='right'; context.fillText(`Página ${index+1} de ${this.pages.length}`,WIDTH-MARGIN,1686); context.textAlign='left';
      context.font='17px Arial'; context.fillText('Este documento no sustituye una factura o DTE.',MARGIN,1715);
    });
  }
}

function paymentLabel(status: string) {
  if (['paid','approved','verified','confirmed','deposit_paid'].includes(status.toLowerCase())) return 'Anticipo confirmado';
  if (['rejected','failed','declined'].includes(status.toLowerCase())) return 'Pago no aprobado';
  if (['mock','simulated','test','simulated_paid'].includes(status.toLowerCase())) return 'SIMULACIÓN - Sin cobro real';
  return 'Anticipo pendiente de verificación';
}
function addPrices(document: DocumentPages, prices: PedidoPricing, receipt: DownloadReceipt) {
  document.section('Importes del pedido');
  document.amount('Prendas de campo',prices.baseCents);
  if (prices.garmentExtrasCents) document.amount('Molde, tela, cuello y manga',prices.garmentExtrasCents);
  if (prices.sizeExtrasCents) document.amount('Tallas especiales de jugadores',prices.sizeExtrasCents);
  if (prices.creationDesignCents) document.amount('Creación de diseño',prices.creationDesignCents);
  if (prices.crestDesignCents) document.amount(`Escudo (${prices.crestDesignCount} diseño/s)`,prices.crestDesignCents);
  if (prices.brandDesignCents) document.amount(`Marca deportiva (${prices.brandDesignCount} diseño/s)`,prices.brandDesignCents);
  if (prices.sponsorCents) document.amount(`Patrocinadores (${prices.sponsorCount})`,prices.sponsorCents);
  if (prices.crest3dCents) document.amount('Escudo 3D',prices.crest3dCents);
  if (prices.brand3dCents) document.amount('Marca deportiva 3D',prices.brand3dCents);
  if (prices.socksCents) document.amount(`Medias (${prices.sockQuantity} pares)`,prices.socksCents);
  if (prices.keeperCents) document.amount(`Porteros cobrados (${prices.paidKeeperCount})`,prices.keeperCents);
  if (prices.discountCents) document.amount('Descuento por marca Tony',-prices.discountCents);
  document.amount('Entrega',prices.deliveryCents);
  document.y+=15;
  document.amount('TOTAL DEL PEDIDO',receipt.totalCents,true);
  document.amount('Anticipo requerido (50%)',receipt.depositCents);
  document.amount('Saldo contra entrega',receipt.balanceCents);
}

function addRoster(document: DocumentPages, order: PedidoDraft) {
  document.section('Jugadores de campo');
  const heading = () => {
    document.ensure(100); document.ctx.font='bold 21px Arial'; document.ctx.fillStyle=MUTED;
    [['N.º',MARGIN],['NOMBRE',MARGIN+75],['TALLA',820],['DORSAL',988]].forEach(([label,x])=>document.ctx.fillText(String(label),Number(x),document.y)); document.y+=38;
  };
  heading();
  order.players.forEach((player,index) => {
    const lines=document.lines(player.name,620,23),height=Math.max(47,lines.length*31+14);
    if (document.y+height>BOTTOM) {document.next(); document.section('Jugadores de campo - continuación'); heading();}
    document.ctx.fillStyle=index%2===0?'#F5F8F5':'#FFFFFF'; document.ctx.fillRect(MARGIN-12,document.y-26,WIDTH-MARGIN*2+24,height);
    document.ctx.fillStyle=INK; document.ctx.font='23px Arial'; document.ctx.fillText(String(index+1),MARGIN,document.y);
    lines.forEach((line,i)=>document.ctx.fillText(line,MARGIN+75,document.y+i*31));
    document.ctx.fillText(player.size,820,document.y); document.ctx.fillText(player.number,988,document.y); document.y+=height;
  });
  if (order.goalkeepers.length) {
    document.section('Porteros');
    order.goalkeepers.forEach((keeper,index)=>document.paragraph(`${index+1}. ${keeper.name} | Talla ${keeper.size} | Dorsal ${keeper.number} | Color: ${keeper.color}`));
  }
}

/** Minimal PDF writer: each page is a sharp canvas image. No third-party service receives the data. */
function pagesToPdf(pages: HTMLCanvasElement[]): Blob {
  const encoder = new TextEncoder(), parts: Uint8Array[] = [], offsets: number[] = [0];
  let length=0;
  const append=(part:string|Uint8Array)=>{const bytes=typeof part==='string'?encoder.encode(part):part;parts.push(bytes);length+=bytes.length;};
  const object=(number:number,content:string|{head:string;data:Uint8Array})=>{
    offsets[number]=length;append(`${number} 0 obj\n`);
    if (typeof content==='string') append(content);
    else {append(content.head);append('\nstream\n');append(content.data);append('\nendstream');}
    append('\nendobj\n');
  };
  append('%PDF-1.4\n%âãÏÓ\n');
  object(1,'<< /Type /Catalog /Pages 2 0 R >>');
  object(2,`<< /Type /Pages /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] /Count ${pages.length} >>`);
  pages.forEach((page,index)=>{
    const number=3+index*3;
    object(number,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Image${index} ${number+2} 0 R >> >> /Contents ${number+1} 0 R >>`);
    const commands=encoder.encode(`q\n595.28 0 0 841.89 0 0 cm\n/Image${index} Do\nQ`);
    object(number+1,{head:`<< /Length ${commands.length} >>`,data:commands});
    const binary=atob(page.toDataURL('image/jpeg',.93).split(',')[1]);
    const image=Uint8Array.from(binary,character=>character.charCodeAt(0));
    object(number+2,{head:`<< /Type /XObject /Subtype /Image /Width ${WIDTH} /Height ${HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>`,data:image});
  });
  const start=length,count=3+pages.length*3;
  append(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for(let i=1;i<count;i++)append(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
  append(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`);
  return new Blob(parts.map(part=>part.slice().buffer),{type:'application/pdf'});
}

export async function downloadPedidoDocument(kind: 'production' | 'payment', data: PedidoDocumentData): Promise<void> {
  const {draft,buyer,delivery,signature,receipt,termsVersion}=data;
  const prices=calculatePedido(draft,delivery.kind);
  if (![receipt.totalCents,receipt.depositCents,receipt.balanceCents].every(Number.isSafeInteger) || receipt.totalCents!==prices.totalCents || receipt.depositCents!==prices.depositCents || receipt.balanceCents!==prices.balanceCents) throw new Error('Los importes del pedido cambiaron. Verifica el pedido antes de descargar.');
  if (!draft.design.finalFront || !draft.design.finalBack || !signature) throw new Error('Falta el diseño final o la firma para preparar el documento.');
  const [front,back,signed]=await Promise.all([loadImage(draft.design.finalFront),loadImage(draft.design.finalBack),loadImage(signature)]);
  if (document.fonts) await document.fonts.ready;
  const output=new DocumentPages(kind==='production'?'ORDEN DE PRODUCCIÓN':'ORDEN DE PAGO',receipt.id);
  const orderStatus: Record<string,string> = {confirmed:'Pedido confirmado',transfer_review:'Transferencia pendiente de revisión',received:'Pedido recibido'};
  output.detail('Equipo',draft.teamName); output.detail('Estado del pedido',orderStatus[receipt.status]||receipt.status);
  output.detail('Estado del anticipo',paymentLabel(receipt.paymentStatus));
  if (receipt.reference) output.detail('Referencia de pago',receipt.reference);
  output.paragraph('La orden conserva los datos y el diseño aprobados. Tony confirma la revisión del anticipo y el estado de producción.',{color:MUTED,size:22});
  output.section('Persona responsable');
  output.detail('Nombre',buyer.name); output.detail('DUI',buyer.dui); output.detail('WhatsApp',buyer.phone);
  if (buyer.email) output.detail('Correo electrónico',buyer.email);
  output.section('Entrega');
  if (delivery.kind==='pickup') output.detail('Retiro en tienda',delivery.branch);
  else {
    output.detail('Destino',`${delivery.department}, ${delivery.city}`); output.detail('Dirección',delivery.address);
    if(delivery.reference)output.detail('Referencia',delivery.reference);
    if(delivery.latitude!=null&&delivery.longitude!=null)output.detail('Ubicación',`${delivery.latitude.toFixed(6)}, ${delivery.longitude.toFixed(6)}`);
  }
  output.section('Configuración');
  output.detail('Producto',PRODUCTS.find(product=>product.value===draft.product)?.label||draft.product);
  output.detail('Cantidad de campo',String(prices.fieldQuantity)); output.detail('Línea y molde',`${draft.gender} / ${draft.config.mold}`);
  output.detail('Tela',draft.config.fabric); output.detail('Cuello / manga',`${draft.config.collar} / ${draft.config.sleeve}`);
  output.detail('Marca deportiva',draft.config.brand==='Tony'?'Tony Sportswear':'Propia');
  output.detail('Acabado de marca',draft.config.brand3d?'3D alto relieve':'Sublimada');
  output.detail('Acabado de escudo',draft.config.crest3d?'3D alto relieve':'Sublimado');
  output.detail('Diseño base',draft.design.source==='catalog'?draft.design.catalogCode:'Diseño propio');
  output.detail('Número en calzoneta',draft.product==='uniform'?(draft.shortsNumber?'Sí, incluido':'Sin número'):'No aplica a solo camisa');
  const socks=Object.entries(draft.socks).filter(([,quantity])=>quantity>0).map(([color,quantity])=>`${color}: ${quantity}`).join(' / ');
  output.detail('Medias',socks||'Sin medias');
  if(prices.freeKeeper)output.paragraph('Regalía: primer uniforme de portero gratis por 12 o más uniformes de campo.',{bold:true,color:GREEN,size:22});
  addPrices(output,prices,receipt);
  // Both records retain the roster, so the buyer can match quantities and payment to the same order.
  addRoster(output,draft);
  if(draft.notes.trim()){output.section('Indicaciones del equipo');output.paragraph(draft.notes);}
  output.next(); output.section('Diseño final aprobado');
  const boxY=output.y,boxWidth=(WIDTH-MARGIN*2-30)/2,boxHeight=710;
  output.ctx.fillStyle='#F1F5F2'; output.ctx.fillRect(MARGIN,boxY,boxWidth,boxHeight); output.ctx.fillRect(MARGIN+boxWidth+30,boxY,boxWidth,boxHeight);
  placeImage(output.ctx,front,MARGIN+12,boxY+12,boxWidth-24,boxHeight-24);
  placeImage(output.ctx,back,MARGIN+boxWidth+42,boxY+12,boxWidth-24,boxHeight-24);
  output.y+=boxHeight+38; output.ctx.font='bold 21px Arial'; output.ctx.fillStyle=GREEN;
  output.ctx.fillText('FRONTAL',MARGIN,output.y); output.ctx.fillText('DORSAL',MARGIN+boxWidth+30,output.y);output.y+=45;
  output.section('Aceptación y firma');
  output.paragraph(`Términos aceptados: ${termsVersion}`,{size:22});
  output.ensure(240); output.ctx.fillStyle='#F5F8F5';output.ctx.fillRect(MARGIN,output.y,620,165);
  placeImage(output.ctx,signed,MARGIN+15,output.y+10,590,145);output.y+=204;
  output.paragraph(buyer.name,{bold:true,size:22});output.footer();
  save(pagesToPdf(output.pages),`Tony-${kind==='production'?'Orden-Produccion':'Orden-Pago'}-${filename(receipt.id)}.pdf`);
}
