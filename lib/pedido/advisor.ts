import {calculatePedido, money, PRICES} from './pricing';
import type {Buyer, Delivery, Payment, PedidoDraft, PedidoPlayer} from './types';

/**
 * Tony's advisor script. For the step on screen it looks at what the customer has
 * already chosen and says what comes next, one thing at a time, acknowledging the
 * last choice. `key` changes only when the advice changes, so the voice speaks once
 * per new instruction; `target` names the part of the form the advice is about.
 */
export type AdvisorCue = {key: string; text: string; target?: string; warning?: boolean};
export type AdvisorInput = {
  step: number; draft: PedidoDraft; delivery: Delivery; payment: Payment; buyer: Buyer;
  signature: string; terms: boolean; verified: boolean; hasReceipt: boolean;
  /** What the customer has really chosen (product and brand start unmarked). */
  picked?: {product: boolean; brand: boolean};
};

const complete = (player: PedidoPlayer) => !!player.name.trim() && !!player.size && /^\d{1,3}$/.test(player.number);

function advise({step, draft, delivery, payment, buyer, signature, terms, verified, hasReceipt, picked = {product: true, brand: true}}: AdvisorInput): AdvisorCue {
  const c = draft.config;
  switch (step) {
    case 0: return {key: 'start', text: 'Hola, soy tu asesora Tony. Toca Crear mi pedido y empezamos.'};
    case 1: return picked.product
      ? {key: `product:${draft.product}`, target: 'product', text: `${draft.product === 'uniform' ? 'Uniformes' : 'Camisas'}, anotado. Toca Continuar.`}
      : {key: 'product', target: 'product', text: 'Elige tu producto. Uniforme completo o solo camisa.'};
    case 2: {
      const what = draft.product === 'shirt' ? 'Camisas' : 'Uniforme';
      return draft.gender
        ? {key: `gender:${draft.gender}`, target: 'gender', text: `${what} para ${draft.gender.toLowerCase()}. Toca Continuar.`}
        : {key: 'gender', target: 'gender', text: `¿${what} para hombre o para mujer?`};
    }
    case 3:
      if (!c.mold) return {key: 'config:mold', target: 'mold', text: 'Primero, elige el molde.'};
      if (!c.fabric) return {key: 'config:fabric', target: 'fabric', text: `Molde ${c.mold}. Ahora elige la tela.`};
      if (!c.collar) return {key: 'config:collar', target: 'collar', text: `Tela ${c.fabric}. Ahora elige el cuello.`};
      if (!c.sleeve) return {key: 'config:sleeve', target: 'sleeve', text: `Cuello ${c.collar}. ¿Manga corta o larga?`};
      return picked.brand
        ? {key: `config:brand:${c.brand}`, target: 'brand', text: `Marca ${c.brand === 'Tony' ? 'Tony' : 'propia'}. Si quieres 3D, márcalo. Toca Continuar.`}
        : {key: 'config:brand', target: 'brand', text: `Manga ${c.sleeve.toLowerCase()}. Por último, elige la marca deportiva.`};
    case 4: {
      if (!draft.teamName.trim()) return {key: 'players:team', target: 'team', text: 'Escribe el nombre de tu equipo.'};
      const pending = draft.players.findIndex(player => !complete(player));
      if (pending >= 0) {
        const p = draft.players[pending], n = pending + 1;
        const field = !p.name.trim() ? 'el nombre' : !p.size ? 'la talla' : 'el número';
        return {key: `players:${pending}:${field}`, target: 'players', text: `Jugador ${n}: escribe ${field}.`};
      }
      if (draft.product === 'uniform') {
        const keeper = draft.goalkeepers.findIndex(player => !complete(player) || !player.color.trim());
        if (!draft.goalkeepers.length) return {key: 'players:keeper', target: 'keepers', text: `Jugadores listos. ¿Llevan portero?${draft.quantity >= PRICES.keeper.freeUniformFieldQuantity ? ' El primero es gratis.' : ''}`};
        if (keeper >= 0) return {key: `players:keeper:${keeper}`, target: 'keepers', text: `Completa los datos del portero ${keeper + 1}.`};
      }
      return {key: 'players:done', text: 'Equipo completo. Toca Continuar.'};
    }
    case 5: {
      const pairs = Object.values(draft.socks).reduce((sum, value) => sum + value, 0);
      return pairs
        ? {key: 'socks:some', target: 'socks', text: `${pairs} ${pairs === 1 ? 'par' : 'pares'} de medias. Toca Continuar.`}
        : {key: 'socks', target: 'socks', text: `¿Agregamos medias? ${money(PRICES.socks.pairCents)} el par.`};
    }
    case 6: {
      const d = draft.design;
      if (!d.front) return {key: 'design:base', text: 'Escoge un diseño del catálogo o toca Subir frontal.'};
      if (!d.back) return {key: 'design:back', text: 'Falta el dorsal. Toca Generar mockup con IA.'};
      if (!d.layers.some(layer => layer.type === 'Escudo')) return {key: 'design:crest', text: 'Sube tu escudo. Se coloca solo en el pecho.'};
      return {key: 'design:review', text: '¡Va quedando muy bien! Agrega patrocinadores o toca Continuar.'};
    }
    case 7: {
      const d = draft.design;
      if (!d.finalFront || !d.finalBack) return {key: 'final:prepare', text: 'Toca Preparar mockup profesional con IA.'};
      if (!d.approved) return {key: 'final:review', text: 'Revisa frente y dorsal. Si todo está bien, marca la aprobación.'};
      return {key: 'final:ok', text: 'Diseño aprobado. Toca Continuar.'};
    }
    case 8: {
      const price = calculatePedido(draft, delivery.kind);
      return {key: 'summary', text: `Tu total es ${money(price.totalCents)}. Revisa el resumen y toca Continuar.`};
    }
    case 9:
      if (!delivery.kind) return {key: 'delivery', target: 'delivery', text: '¿Retiras en tienda o te lo enviamos?'};
      if (delivery.kind === 'pickup') return delivery.branch
        ? {key: 'delivery:pickup-ok', text: `Retiras en ${delivery.branch}. Toca Continuar.`}
        : {key: 'delivery:branch', target: 'delivery', text: 'Elige la sucursal.'};
      if (!delivery.department) return {key: 'delivery:dept', target: 'delivery', text: 'Elige el departamento.'};
      if (!delivery.city.trim()) return {key: 'delivery:city', target: 'delivery', text: 'Escribe el municipio o distrito.'};
      if (!delivery.address.trim()) return {key: 'delivery:address', target: 'delivery', text: 'Escribe la dirección exacta.'};
      return {key: 'delivery:home-ok', text: 'Dirección lista. Toca Continuar.'};
    case 10: {
      const price = calculatePedido(draft, delivery.kind);
      if (!payment.method) return {key: 'pay', target: 'payment', text: `Tu anticipo es ${money(price.depositCents)}. ¿Tarjeta o transferencia?`};
      if (payment.method === 'wompi') {
        if (verified) return {key: 'pay:ok', text: 'Anticipo verificado. Toca Continuar.'};
        if (payment.reference) return {key: 'pay:verify', target: 'payment', text: 'Paga y luego toca Verificar mi anticipo.'};
        return {key: 'pay:wompi', target: 'payment', text: 'Toca Preparar pago del anticipo.'};
      }
      if (!payment.bank) return {key: 'pay:bank', target: 'payment', text: 'Elige el banco.'};
      if (!payment.receiptData) return {key: 'pay:receipt', target: 'payment', text: 'Transfiere y sube tu comprobante.'};
      return {key: 'pay:transfer-ok', text: 'Comprobante listo. Toca Continuar.'};
    }
    case 11:
      if (!buyer.name.trim()) return {key: 'sign:name', target: 'buyer', text: 'Escribe tu nombre completo.'};
      if (!buyer.dui.trim()) return {key: 'sign:dui', target: 'buyer', text: 'Ahora tu número de DUI.'};
      if (!buyer.phone.trim()) return {key: 'sign:phone', target: 'buyer', text: 'Ahora tu WhatsApp.'};
      if (!terms) return {key: 'sign:terms', target: 'buyer', text: 'Lee y acepta los términos.'};
      if (!signature) return {key: 'sign:signature', target: 'buyer', text: 'Firma dentro del recuadro.'};
      return {key: 'sign:done', text: 'Toca Confirmar y enviar pedido.'};
    default:
      return {key: `done:${hasReceipt}`, text: '¡Listo! Descarga tus documentos y guarda tu número de pedido.'};
  }
}

/** What must be chosen before a later part of a step, in order. */
export const CONFIG_ORDER = [['mold', 'el molde'], ['fabric', 'la tela'], ['collar', 'el cuello'], ['sleeve', 'la manga']] as const;
export function missingBefore(draft: PedidoDraft, key: string): {key: string; label: string} | null {
  const position = key === 'brand' || key === 'brand3d' || key === 'crest3d' ? CONFIG_ORDER.length : CONFIG_ORDER.findIndex(([name]) => name === key);
  for (const [name, label] of CONFIG_ORDER.slice(0, Math.max(0, position))) if (!draft.config[name]) return {key: name, label};
  return null;
}

export function adviseFor(input: AdvisorInput): AdvisorCue {
  const cue = advise(input);
  return {...cue, key: `${input.step}:${cue.key}`};
}

/* ---------- speech: amounts and short forms said the way a person would ---------- */
const UNITS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
export function numberWords(value: number): string {
  if (value >= 1000) {
    const thousands = Math.floor(value / 1000), rest = value % 1000;
    return `${thousands === 1 ? 'mil' : `${numberWords(thousands).replace(/uno$/, 'un')} mil`}${rest ? ` ${numberWords(rest)}` : ''}`;
  }
  if (value >= 100) return value === 100 ? 'cien' : `${HUNDREDS[Math.floor(value / 100)]}${value % 100 ? ` ${numberWords(value % 100)}` : ''}`;
  if (value < 30) return UNITS[value];
  return `${TENS[Math.floor(value / 10)]}${value % 10 ? ` y ${UNITS[value % 10]}` : ''}`;
}
function amountWords(dollars: number, cents: number) {
  const words = numberWords(dollars);
  const whole = dollars === 1 ? 'un dólar' : `${words.endsWith('veintiuno') ? words.replace(/veintiuno$/, 'veintiún') : words.replace(/uno$/, 'un')} dólares`;
  if (!cents) return whole;
  const small = `${numberWords(cents)} centavos`;
  return dollars ? `${whole} con ${small}` : small;
}
/** The advice as it should sound: "$1.25" is read "un dólar con veinticinco centavos". */
export function spoken(text: string): string {
  return text
    .replace(/\+\$(\d+)\.(\d{2})/g, (_, dollars, cents) => `más ${amountWords(Number(dollars), Number(cents))}`)
    .replace(/−\$(\d+)\.(\d{2})/g, (_, dollars, cents) => `menos ${amountWords(Number(dollars), Number(cents))}`)
    .replace(/\$(\d+)\.(\d{2})/g, (_, dollars, cents) => amountWords(Number(dollars), Number(cents)))
    .replace(/\b3D\b/g, 'tres D')
    .replace(/\bDUI\b/g, 'D U I')
    .replace(/(\d+) %/g, '$1 por ciento');
}

/*
 * She is a woman, so only female Spanish voices are used. Voices do not declare
 * their gender: known female names are preferred, known male names are never used,
 * and without a female voice she stays silent and the advice is only written.
 */
const FEMALE = /lorena|dalia|elvira|paloma|salome|sabina|helena|laura|paulina|m[oó]nica|marisol|ang[eé]lica|soledad|isabel|camila|valentina|ximena|elena|francisca|karla|catalina|renata|lucia|luc[ií]a|andrea|estrella|irene|sof[ií]a|marina|nora|beatriz|carlota|larissa|triana|teresa|abril|female|mujer|google espa/i;
const MALE = /rodrigo|ra[uú]l|pablo|jorge|[aá]lvaro|gonzalo|alonso|tom[aá]s|diego|juan|carlos|jos[eé]|dario|dar[ií]o|gerardo|alex|andr[eé]s|emilio|federico|luciano|mateo|nicol[aá]s|sa[uú]l|jaime|lucas|arnau|enrique|antonio|ricardo|pedro|male|hombre/i;
const LANGS = ['es-SV', 'es-419', 'es-MX', 'es-US', 'es-CO', 'es-GT', 'es-ES'];
export function femaleVoice<V extends {name: string; lang: string}>(voices: V[]): V | undefined {
  const spanish = voices.filter(voice => voice.lang.toLowerCase().startsWith('es') && !MALE.test(voice.name));
  const rank = (voice: V) => (FEMALE.test(voice.name) ? 0 : 100) + (LANGS.indexOf(voice.lang) + 1 || LANGS.length + 1);
  const best = spanish.sort((a, b) => rank(a) - rank(b))[0];
  return best && FEMALE.test(best.name) ? best : undefined;
}
