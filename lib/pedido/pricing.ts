import prices from '../../data/pedido/prices.json';
import type {DeliveryKind, PedidoDraft, PedidoErrors, PedidoPricing, Product, SockColor} from './types';

export const PRICES = prices;
export const MIN_QUANTITY = prices.quantity.min;
export const MAX_QUANTITY = prices.quantity.max;
export const PRODUCTS = Object.entries(prices.products).map(([value, option]) => ({value: value as Product, ...option}));
export const GENDERS = prices.genders;
export const MOLDS = Object.keys(prices.molds);
export const FABRICS = Object.keys(prices.fabrics);
export const COLLARS = Object.keys(prices.collars);
export const SLEEVES = Object.keys(prices.sleeves);
export const BRANDS = prices.brands;
export const SIZES = prices.sizes;
export const SOCK_COLORS = prices.socks.colors as SockColor[];

export class PedidoValidationError extends Error {
  constructor(public readonly errors: PedidoErrors) {
    super(Object.values(errors)[0] || 'Revisa las opciones del pedido.');
    this.name = 'PedidoValidationError';
  }
}

const owns = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
export function isCatalogCode(value: unknown): value is string {
  if (typeof value !== 'string' || !/^TONY-\d{3}$/.test(value)) return false;
  const number = Number(value.slice(5));
  return number >= prices.design.catalogMin && number <= prices.design.catalogMax;
}

/** Structural checks also run while the form is incomplete. Prices never come from the caller. */
export function pricingErrors(value: unknown, deliveryKind: DeliveryKind = ''): PedidoErrors {
  const errors: PedidoErrors = {};
  if (!record(value)) return {order: 'No pudimos leer el pedido.'};
  if (value.version !== 279) errors.version = 'Esta versión del pedido no es compatible.';
  if (typeof value.product !== 'string' || !owns(prices.products, value.product)) errors.product = 'Selecciona un producto válido.';
  if (!count(value.quantity) || value.quantity > MAX_QUANTITY) errors.quantity = `La cantidad máxima es ${MAX_QUANTITY}.`;
  if (typeof value.gender !== 'string' || (value.gender !== '' && !GENDERS.includes(value.gender))) errors.gender = 'Selecciona Hombre o Mujer.';
  const config = value.config;
  if (!record(config)) errors.config = 'Revisa la configuración del uniforme.';
  else {
    for (const [key, table] of Object.entries({mold: prices.molds, fabric: prices.fabrics, collar: prices.collars, sleeve: prices.sleeves})) {
      if (typeof config[key] !== 'string' || (config[key] !== '' && !owns(table, config[key] as string))) errors[`config.${key}`] = 'Selecciona una opción válida.';
    }
    if (typeof config.brand !== 'string' || !BRANDS.includes(config.brand)) errors['config.brand'] = 'Selecciona una marca válida.';
    for (const key of ['brand3d', 'crest3d']) if (typeof config[key] !== 'boolean') errors[`config.${key}`] = 'Selecciona un acabado válido.';
  }
  for (const key of ['players', 'goalkeepers'] as const) {
    const entries = value[key];
    if (!Array.isArray(entries) || (key === 'players' && entries.length > MAX_QUANTITY)) {errors[key] = 'Revisa la lista de prendas.'; continue;}
    if (key === 'players' && entries.length !== value.quantity) errors.quantity = 'La cantidad debe coincidir con las filas de jugadores.';
    entries.forEach((entry, index) => {
      if (!record(entry) || typeof entry.size !== 'string' || (entry.size !== '' && !SIZES.includes(entry.size))) errors[`${key}.${index}.size`] = 'Selecciona una talla válida.';
    });
  }
  if (!record(value.socks)) errors.socks = 'Revisa las cantidades de medias.';
  else {
    for (const [color, amount] of Object.entries(value.socks)) if (!SOCK_COLORS.includes(color as SockColor) || !count(amount)) errors[`socks.${color}`] = 'Usa una cantidad entera de pares, sin valores negativos.';
    for (const color of SOCK_COLORS) if (!owns(value.socks, color)) errors[`socks.${color}`] = 'Falta la cantidad de este color.';
  }
  const design = value.design;
  if (!record(design)) errors.design = 'Revisa el diseño del pedido.';
  else {
    if (!['catalog', 'own'].includes(String(design.source))) errors['design.source'] = 'Selecciona catálogo o diseño propio.';
    if (typeof design.catalogCode !== 'string' || (design.catalogCode !== '' && !isCatalogCode(design.catalogCode))) errors['design.catalogCode'] = 'Selecciona un diseño Tony válido.';
    if (!Array.isArray(design.layers)) errors['design.layers'] = 'No pudimos leer los elementos del diseño.';
    else design.layers.forEach((layer, index) => {
      if (!record(layer) || !['Escudo', 'Marca', 'Sponsor', 'Texto'].includes(String(layer.type)) || !['front', 'back'].includes(String(layer.side)) || typeof layer.id !== 'string' || !layer.id || typeof layer.name !== 'string' || typeof layer.visible !== 'boolean') {errors[`design.layers.${index}`] = 'Revisa este elemento del diseño.'; return;}
      for (const key of ['designKey', 'data']) if (layer[key] !== undefined && typeof layer[key] !== 'string') errors[`design.layers.${index}.${key}`] = 'El elemento contiene datos inválidos.';
    });
  }
  if (deliveryKind !== '' && !owns(prices.delivery, deliveryKind)) errors.delivery = 'Selecciona retiro o envío a domicilio.';
  return errors;
}

/** Exact V279 charges, represented as integer cents. Hidden layers still exist and are charged. */
export function calculatePedido(order: PedidoDraft, deliveryKind: DeliveryKind = ''): PedidoPricing {
  const errors = pricingErrors(order, deliveryKind);
  if (Object.keys(errors).length) throw new PedidoValidationError(errors);
  const optionFee = (table: Record<string, number>, key: string) => key === '' ? 0 : table[key];
  const config = order.config;
  const fieldQuantity = order.players.filter(player => player.size !== '').length;
  const unitCents = prices.products[order.product].cents;
  const garmentUnitExtras = optionFee(prices.molds, config.mold) + optionFee(prices.fabrics, config.fabric) + optionFee(prices.collars, config.collar) + optionFee(prices.sleeves, config.sleeve);
  const sizeFee = (size: string) => owns(prices.sizeExtras, size) ? (prices.sizeExtras as Record<string, number>)[size] : 0;
  const unique = (type: 'Escudo' | 'Marca') => new Set(order.design.layers.filter(layer => layer.type === type).map(layer => layer.designKey || layer.data || layer.name || layer.id)).size;
  const baseCents = fieldQuantity * unitCents;
  const garmentExtrasCents = fieldQuantity * garmentUnitExtras;
  const sizeExtrasCents = order.players.reduce((sum, player) => sum + sizeFee(player.size), 0);
  const creationDesignCents = order.design.source === 'catalog' && isCatalogCode(order.design.catalogCode) ? 0 : prices.design.creationCents;
  const crestDesignCount = unique('Escudo');
  const brandDesignCount = unique('Marca');
  const sponsorCount = order.design.layers.filter(layer => layer.type === 'Sponsor').length;
  const crestDesignCents = crestDesignCount * prices.design.crestCents;
  const brandDesignCents = brandDesignCount * prices.design.brandCents;
  const sponsorCents = sponsorCount * prices.design.sponsorCents;
  const designServicesCents = creationDesignCents + crestDesignCents + brandDesignCents + sponsorCents;
  const crest3dCents = config.crest3d ? fieldQuantity * prices.design.threeDPerTypePerFieldPlayerCents : 0;
  const brand3dCents = config.brand3d ? fieldQuantity * prices.design.threeDPerTypePerFieldPlayerCents : 0;
  const threeDCents = crest3dCents + brand3dCents;
  const sockQuantity = Object.values(order.socks).reduce((sum, amount) => sum + amount, 0);
  const socksCents = sockQuantity * prices.socks.pairCents;
  const freeKeeper = order.product === 'uniform' && fieldQuantity >= prices.keeper.freeUniformFieldQuantity;
  const paidKeepers = freeKeeper ? order.goalkeepers.slice(1) : order.goalkeepers;
  const paidKeeperCount = paidKeepers.length;
  const keeperSizeExtrasCents = paidKeepers.reduce((sum, keeper) => sum + sizeFee(keeper.size), 0);
  const keeperCents = paidKeeperCount * (unitCents + garmentUnitExtras) + keeperSizeExtrasCents;
  const discountCents = config.brand === 'Tony' && order.product === 'uniform' ? fieldQuantity * prices.tonyUniformDiscountCents : 0;
  const deliveryCents = deliveryKind === '' ? 0 : prices.delivery[deliveryKind];
  const totalCents = Math.max(0, baseCents + garmentExtrasCents + sizeExtrasCents + designServicesCents + threeDCents + socksCents + keeperCents - discountCents + deliveryCents);
  if (!Number.isSafeInteger(totalCents)) throw new PedidoValidationError({total: 'La cantidad seleccionada excede el límite del pedido.'});
  const depositCents = Math.round(totalCents * prices.deposit.numerator / prices.deposit.denominator);
  return {currency: 'USD', fieldQuantity, paidKeeperCount, freeKeeper, baseCents, garmentExtrasCents, sizeExtrasCents, creationDesignCents, crestDesignCount, crestDesignCents, brandDesignCount, brandDesignCents, sponsorCount, sponsorCents, designServicesCents, crest3dCents, brand3dCents, threeDCents, sockQuantity, socksCents, keeperSizeExtrasCents, keeperCents, discountCents, deliveryCents, totalCents, depositCents, balanceCents: totalCents - depositCents};
}

export function money(cents: number): string {
  if (!Number.isSafeInteger(cents)) throw new Error('El importe debe estar expresado en centavos enteros.');
  return `$${(cents / 100).toFixed(2)}`;
}
