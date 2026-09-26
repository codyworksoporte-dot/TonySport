import {BRANDS, COLLARS, FABRICS, GENDERS, isCatalogCode, MAX_QUANTITY, MIN_QUANTITY, MOLDS, pricingErrors, SIZES, SLEEVES, SOCK_COLORS} from './pricing';
import type {Buyer, Delivery, Payment, PedidoDraft, PedidoErrors, PedidoGoalkeeper, PedidoLayer, PedidoPlayer, PedidoStep, Product, SockColor} from './types';

const id = () => globalThis.crypto?.randomUUID?.() || `pedido-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const newPlayer = (): PedidoPlayer => ({id: id(), name: '', number: '', size: ''});

export function createPedido(product: Product = 'uniform'): PedidoDraft {
  return {
    version: 279, id: id(), product, gender: '', quantity: MIN_QUANTITY,
    teamName: '', notes: '', shortsNumber: true,
    config: {mold: '', fabric: '', collar: '', sleeve: '', brand: 'Propia', brand3d: false, crest3d: false},
    players: Array.from({length: MIN_QUANTITY}, newPlayer), goalkeepers: [],
    socks: Object.fromEntries(SOCK_COLORS.map(color => [color, 0])) as Record<SockColor, number>,
    design: {source: 'own', catalogCode: '', front: null, back: null, layers: [], approved: false, finalFront: null, finalBack: null},
  };
}

export function resizePlayers(order: PedidoDraft, quantity: number): PedidoDraft {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_QUANTITY) throw new Error(`Usa una cantidad entera de hasta ${MAX_QUANTITY} prendas.`);
  const players = order.players.slice(0, quantity).map(player => ({...player}));
  while (players.length < quantity) players.push(newPlayer());
  return {...order, quantity, players, design: {...order.design, approved: false}};
}

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown, max = 200): value is string => typeof value === 'string' && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
const finite = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const imageData = (value: unknown): value is string => typeof value === 'string' && value.length <= 32_000_000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
export function isPedidoImage(value: unknown): value is string {
  return imageData(value) || (typeof value === 'string' && /^\/(?:TonySport\/)?assets\/pedido\/[a-zA-Z0-9_/-]+\.(?:webp|png|jpg|jpeg|svg)$/.test(value));
}
const nullableImage = (value: unknown) => value === null || isPedidoImage(value);

function readPlayer(value: unknown): PedidoPlayer | null {
  if (!record(value) || !text(value.id, 100) || !value.id || !text(value.name) || typeof value.number !== 'string' || !/^\d{0,3}$/.test(value.number) || typeof value.size !== 'string' || (value.size !== '' && !SIZES.includes(value.size))) return null;
  return {id: value.id, name: value.name, number: value.number, size: value.size as PedidoPlayer['size']};
}
function readLayer(value: unknown): PedidoLayer | null {
  if (!record(value) || !text(value.id, 100) || !value.id || !text(value.name) || !['front', 'back'].includes(String(value.side)) || !['Escudo', 'Marca', 'Sponsor', 'Texto'].includes(String(value.type)) || typeof value.visible !== 'boolean') return null;
  if (!finite(value.x, 0, 100) || !finite(value.y, 0, 100) || !finite(value.width, 2, 100) || !finite(value.height, 2, 100) || !finite(value.rotation, -180, 180) || !finite(value.fontSize, 10, 180) || typeof value.color !== 'string' || !/^#[a-f\d]{6}$/i.test(value.color)) return null;
  if (value.designKey !== undefined && !text(value.designKey, 512)) return null;
  if (value.data !== undefined && value.data !== '' && !isPedidoImage(value.data)) return null;
  if (value.text !== undefined && !text(value.text, 1000)) return null;
  return {
    id: value.id, name: value.name, side: value.side as PedidoLayer['side'], type: value.type as PedidoLayer['type'],
    x: value.x, y: value.y, width: value.width, height: value.height, rotation: value.rotation,
    fontSize: value.fontSize, color: value.color, visible: value.visible,
    ...(value.designKey !== undefined ? {designKey: value.designKey as string} : {}),
    ...(value.data !== undefined ? {data: value.data as string} : {}),
    ...(value.text !== undefined ? {text: value.text as string} : {}),
  };
}

/** Rebuilds a known schema; unknown properties (including accidental buyer data) never persist. */
export function readPedido(value: unknown): PedidoDraft | null {
  if (!record(value) || Object.keys(pricingErrors(value)).length || !text(value.id, 100) || !value.id || !text(value.teamName) || !text(value.notes, 4000) || typeof value.shortsNumber !== 'boolean') return null;
  const config = value.config as Record<string, unknown>, design = value.design as Record<string, unknown>;
  if (typeof design.approved !== 'boolean' || !nullableImage(design.front) || !nullableImage(design.back) || !nullableImage(design.finalFront) || !nullableImage(design.finalBack)) return null;
  const players = (value.players as unknown[]).map(readPlayer);
  if (players.some(player => !player) || new Set(players.map(player => player?.id)).size !== players.length) return null;
  const goalkeepers = (value.goalkeepers as unknown[]).map(entry => {
    const player = readPlayer(entry);
    return player && record(entry) && text(entry.color, 80) ? {...player, color: entry.color} : null;
  });
  if (goalkeepers.some(keeper => !keeper) || new Set(goalkeepers.map(keeper => keeper?.id)).size !== goalkeepers.length) return null;
  const layers = (design.layers as unknown[]).map(readLayer);
  if (layers.some(layer => !layer) || new Set(layers.map(layer => layer?.id)).size !== layers.length) return null;
  const sockValues = value.socks as Record<string, number>;
  return {
    version: 279, id: value.id, product: value.product as Product, gender: value.gender as PedidoDraft['gender'], quantity: value.quantity as number,
    teamName: value.teamName, notes: value.notes, shortsNumber: value.shortsNumber,
    config: {mold: config.mold as PedidoDraft['config']['mold'], fabric: config.fabric as PedidoDraft['config']['fabric'], collar: config.collar as PedidoDraft['config']['collar'], sleeve: config.sleeve as PedidoDraft['config']['sleeve'], brand: config.brand as 'Tony' | 'Propia', brand3d: config.brand3d as boolean, crest3d: config.crest3d as boolean},
    players: players as PedidoPlayer[], goalkeepers: goalkeepers as PedidoGoalkeeper[],
    socks: Object.fromEntries(SOCK_COLORS.map(color => [color, sockValues[color]])) as Record<SockColor, number>,
    design: {source: design.source as 'catalog' | 'own', catalogCode: design.catalogCode as string, front: design.front as string | null, back: design.back as string | null, layers: layers as PedidoLayer[], approved: design.approved, finalFront: design.finalFront as string | null, finalBack: design.finalBack as string | null},
  };
}

export interface PedidoValidationContext {
  delivery?: Delivery; buyer?: Buyer; payment?: Payment;
  signature?: string | null; termsAccepted?: boolean; wompiVerified?: boolean;
}

export function validateDelivery(delivery?: Delivery): PedidoErrors {
  if (!delivery || !['pickup', 'home'].includes(delivery.kind)) return {'delivery.kind': 'Selecciona retiro en tienda o envío a domicilio.'};
  const errors: PedidoErrors = {};
  if (delivery.kind === 'pickup' && !delivery.branch.trim()) errors['delivery.branch'] = 'Selecciona la sucursal donde retirarás tu pedido.';
  if (delivery.kind === 'home') {
    if (!delivery.department.trim()) errors['delivery.department'] = 'Selecciona el departamento.';
    if (!delivery.city.trim()) errors['delivery.city'] = 'Escribe el municipio o distrito.';
    if (!delivery.address.trim()) errors['delivery.address'] = 'Escribe la dirección exacta.';
    if (delivery.city.length > 100) errors['delivery.city'] = 'Usa hasta 100 caracteres para el municipio o distrito.';
    if (delivery.address.length > 300) errors['delivery.address'] = 'Usa hasta 300 caracteres para la dirección.';
    if (delivery.reference.length > 300) errors['delivery.reference'] = 'Usa hasta 300 caracteres para el punto de referencia.';
    if (delivery.latitude != null && !finite(delivery.latitude, -90, 90)) errors['delivery.latitude'] = 'Revisa la ubicación del mapa.';
    if (delivery.longitude != null && !finite(delivery.longitude, -180, 180)) errors['delivery.longitude'] = 'Revisa la ubicación del mapa.';
  }
  return errors;
}

export function validateBuyer(buyer?: Buyer): PedidoErrors {
  if (!buyer) return {buyer: 'Completa los datos de la persona responsable del pedido.'};
  const errors: PedidoErrors = {};
  if (!buyer.name.trim() || buyer.name.trim().length > 100) errors['buyer.name'] = 'Escribe tu nombre completo (hasta 100 caracteres).';
  if (!/^\d{8}-\d$/.test(buyer.dui.trim())) errors['buyer.dui'] = 'Escribe un DUI válido con formato 00000000-0.';
  if (!/^(?:\+?503[ -]?)?[267]\d{3}[ -]?\d{4}$/.test(buyer.phone.trim())) errors['buyer.phone'] = 'Escribe un teléfono válido de El Salvador.';
  if (buyer.email.length > 254 || (buyer.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email.trim()))) errors['buyer.email'] = 'Revisa tu correo electrónico (hasta 254 caracteres).';
  return errors;
}

export function validatePayment(payment?: Payment, wompiVerified = false): PedidoErrors {
  if (!payment || !['wompi', 'transfer'].includes(payment.method)) return {'payment.method': 'Selecciona cómo pagarás el anticipo.'};
  if (payment.method === 'wompi') return wompiVerified ? {} : {'payment.reference': 'Necesitamos verificar tu anticipo antes de continuar.'};
  const errors: PedidoErrors = {};
  if (!payment.bank.trim()) errors['payment.bank'] = 'Selecciona el banco de tu transferencia.';
  if (!payment.receiptName?.trim() || !imageData(payment.receiptData)) errors['payment.receiptData'] = 'Adjunta una imagen válida del comprobante de transferencia.';
  return errors;
}

const steps: PedidoStep[] = ['product', 'gender', 'config', 'players', 'socks', 'design', 'approval', 'summary', 'delivery', 'payment', 'signature'];

/** Cumulative step checks. Numeric steps are zero-based; named steps are recommended. */
export function validateStep(order: PedidoDraft, step: PedidoStep | number, context: PedidoValidationContext = {}): PedidoErrors {
  const selected = typeof step === 'number' ? steps[step] : step;
  const through = steps.indexOf(selected);
  const errors: PedidoErrors = pricingErrors(order, context.delivery?.kind);
  if (Object.keys(errors).length) return errors;
  if (!readPedido(order)) return {order: 'El pedido contiene datos inválidos. Revisa tu borrador antes de continuar.'};
  if (through < 0) return {step: 'No pudimos identificar el paso del pedido.'};
  if (through >= 1 && !GENDERS.includes(order.gender)) errors.gender = 'Selecciona Hombre o Mujer.';
  if (through >= 2) {
    for (const [key, options] of Object.entries({mold: MOLDS, fabric: FABRICS, collar: COLLARS, sleeve: SLEEVES, brand: BRANDS})) if (!options.includes(order.config[key as keyof typeof order.config] as string)) errors[`config.${key}`] = 'Selecciona una opción para continuar.';
  }
  if (through >= 3) {
    if (order.quantity < MIN_QUANTITY || order.quantity > MAX_QUANTITY) errors.quantity = `El pedido es de ${MIN_QUANTITY} a ${MAX_QUANTITY} prendas de campo.`;
    if (!order.teamName.trim()) errors.teamName = 'Escribe el nombre del equipo o indica SIN NOMBRE DE EQUIPO.';
    if (order.teamName.length > 100) errors.teamName = 'Usa hasta 100 caracteres para el nombre del equipo.';
    if (order.notes.length > 2000) errors.notes = 'Usa hasta 2000 caracteres para las indicaciones.';
    for (const key of ['players', 'goalkeepers'] as const) order[key].forEach((player, index) => {
      if (!SIZES.includes(player.size)) errors[`${key}.${index}.size`] = 'Selecciona una talla.';
      if (!/^\d{1,3}$/.test(player.number)) errors[`${key}.${index}.number`] = 'Escribe un número de hasta tres dígitos.';
      if (!player.name.trim()) errors[`${key}.${index}.name`] = 'Escribe el nombre o indica SIN NOMBRE.';
      if (player.name.length > 70) errors[`${key}.${index}.name`] = 'Usa hasta 70 caracteres para el nombre de cada jugador.';
    });
    order.goalkeepers.forEach((keeper, index) => {if (!keeper.color.trim()) errors[`goalkeepers.${index}.color`] = 'Escoge el color del portero.'; else if (keeper.color.length > 60) errors[`goalkeepers.${index}.color`] = 'Usa hasta 60 caracteres para el color del portero.';});
  }
  if (through >= 5) {
    if (order.design.source === 'catalog' && !isCatalogCode(order.design.catalogCode)) errors['design.catalogCode'] = 'Selecciona un diseño del catálogo Tony.';
    if (!isPedidoImage(order.design.front)) errors['design.front'] = 'Agrega el diseño frontal.';
    if (!isPedidoImage(order.design.back)) errors['design.back'] = 'Completa el diseño dorsal.';
    order.design.layers.forEach((layer, index) => {
      if (!readLayer(layer)) errors[`design.layers.${index}`] = 'Revisa las opciones de este elemento del diseño.';
      else if (layer.type === 'Texto' ? !layer.text?.trim() : !isPedidoImage(layer.data)) errors[`design.layers.${index}`] = layer.type === 'Texto' ? 'Escribe el contenido del texto.' : 'Falta cargar la imagen de este elemento.';
    });
  }
  if (through >= 6) {
    if (!isPedidoImage(order.design.finalFront) || !isPedidoImage(order.design.finalBack)) errors['design.final'] = 'Prepara el diseño final frontal y dorsal.';
    if (!order.design.approved) errors['design.approved'] = 'Revisa y aprueba el diseño final antes de continuar.';
  }
  if (through >= 8) Object.assign(errors, validateDelivery(context.delivery));
  if (through >= 9) Object.assign(errors, validatePayment(context.payment, context.wompiVerified));
  if (through >= 10) {
    Object.assign(errors, validateBuyer(context.buyer));
    if (!context.termsAccepted) errors.termsAccepted = 'Lee y acepta los términos para confirmar tu pedido.';
    if (!imageData(context.signature)) errors.signature = 'Firma la orden para confirmar tu pedido.';
  }
  return errors;
}
