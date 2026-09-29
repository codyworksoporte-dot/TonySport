import {siteAsset} from '../asset-path';
import {authEnabled, accountToken, forgetAccount} from '../auth';
import type {Buyer, Delivery, Payment, PedidoDraft, PedidoPricing} from './types';

const BASE = (process.env.NEXT_PUBLIC_TONY_API_BASE || '').replace(/\/+$/, '');
const TOKEN_KEY = 'tony:pedido:session:v279';
const IMAGE_LIMIT = 8 * 1024 * 1024;
const BODY_LIMIT = 24 * 1024 * 1024;
const IMAGE_DATA = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;
export const apiConfigured = !!BASE;
export interface Receipt {id: string; reference: string; status: string; totalCents: number; depositCents: number; balanceCents: number; paymentStatus: string; panelStatus?: 'pending' | 'sent'; mock?: boolean}
export interface PaymentVerification {paid: boolean; status: string; reference: string; amountCents: number; quote: PedidoPricing; snapshot?: {order: PedidoDraft; delivery: Delivery}; url?: string; mock?: boolean}
export interface CreatedPayment {url: string; reference: string; amountCents: number; quote: PedidoPricing; status: string; mock?: boolean}
type ResponseObject = {ok?: boolean; success?: boolean; code?: string; error?: string; message?: string; mock?: boolean};
let pendingSession: Promise<string> | null = null;
let memoryToken = '';
// Only public catalogue artwork is cached. Never cache buyer data, rosters, signatures or payment proofs.
const catalogueImages = new Map<string, Promise<string>>();

function endpoint(path: string) {
  if (!BASE) throw new Error('El servicio de pedidos todavía no está conectado. Tu diseño se conserva; podrás continuar cuando Tony lo active.');
  const url = new URL(`${BASE}/${path}`);
  if (url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)))) throw new Error('La conexión del servicio debe ser segura.');
  return url.href;
}
function clearToken() {memoryToken = ''; try {sessionStorage.removeItem(TOKEN_KEY);} catch { /* Memory-only sessions still work when storage is disabled. */ }}
function storedToken() {try {return sessionStorage.getItem(TOKEN_KEY) || memoryToken;} catch {return memoryToken;}}
async function request<T extends ResponseObject>(path: string, init: RequestInit = {}, token?: string, timeoutMs = 110_000): Promise<T> {
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = new Headers(init.headers);
    if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(endpoint(path), {...init, credentials: 'omit', cache: 'no-store', redirect: 'error', signal: controller.signal, headers});
    let result: T;
    try {result = await response.json();} catch {throw new Error('El servicio no respondió correctamente. Tu pedido sigue aquí; verifica su estado antes de volver a enviarlo.');}
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('El servicio devolvió una respuesta no válida.');
    if (!response.ok || result.ok === false || result.success === false) {
      if (response.status === 401) {clearToken(); if(authEnabled)forgetAccount();}
      throw new Error(result.message || result.error || 'No pudimos completar esta acción. Vuelve a intentarlo.');
    }
    if (result.ok !== true && result.success !== true) throw new Error('El servicio no confirmó esta acción. Verifica su estado antes de repetirla.');
    return result;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('La operación tardó más de lo esperado. Verifica el estado antes de volver a enviar o pagar.');
    if (error instanceof TypeError) throw new Error('No pudimos conectar con Tony. Revisa tu conexión y vuelve a intentarlo.');
    throw error;
  } finally {clearTimeout(timeout);}
}
async function session(requireExisting = false) {
  if(authEnabled){const token=accountToken();if(!/^[a-f0-9]{64}$/.test(token))throw new Error('Inicia sesión para crear o enviar un pedido.');return token;}
  const current = storedToken(); if (/^[a-f0-9]{64}$/.test(current)) return current;
  if (requireExisting) throw new Error('Abre esta referencia en la misma pestaña donde preparaste el pedido. Por privacidad no podemos abrirlo desde una sesión nueva.');
  if (!pendingSession) pendingSession = request<ResponseObject & {sessionToken: string}>('session.php', {method: 'POST', body: '{}'}, undefined, 20_000).then(value => {
    if (!/^[a-f0-9]{64}$/.test(value.sessionToken)) throw new Error('No pudimos iniciar una sesión segura.');
    memoryToken = value.sessionToken;
    try {sessionStorage.setItem(TOKEN_KEY, value.sessionToken);} catch { /* Retain only the opaque token in memory. */ }
    return value.sessionToken;
  }).finally(() => {pendingSession = null;});
  return pendingSession;
}
async function post<T extends ResponseObject>(path: string, body: unknown, key?: string, requireExisting = false) {
  const json = JSON.stringify(body);
  if (new Blob([json]).size > BODY_LIMIT) throw new Error('El pedido supera 24 MB. Reduce las imágenes o elimina elementos que no uses.');
  return request<T>(path, {method: 'POST', headers: key ? {'Idempotency-Key': key} : {}, body: json}, await session(requireExisting));
}
function checkedDataImage(value: string, maxBytes = IMAGE_LIMIT): string {
  if (value.length > Math.ceil(maxBytes * 4 / 3) + 100 || !IMAGE_DATA.test(value)) throw new Error('Usa imágenes PNG, JPG o WebP de hasta 8 MB.');
  return value;
}
async function blobData(blob: Blob): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(blob.type) || !blob.size || blob.size > IMAGE_LIMIT) throw new Error('La imagen del catálogo no tiene un formato o tamaño válido.');
  const bytes = new Uint8Array(await blob.arrayBuffer()); let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
  return `data:${blob.type};base64,${btoa(binary)}`;
}
/** Resolve only our same-origin catalogue, preserving the GitHub Pages basePath. */
async function dataImage(value: string): Promise<string> {
  if (value.startsWith('data:')) return checkedDataImage(value);
  const path = value.startsWith('/assets/pedido/') ? siteAsset(value as `/assets/${string}`) : value;
  const url = new URL(path, window.location.origin);
  const prefix = siteAsset('/assets/pedido/');
  if (url.origin !== window.location.origin || !url.pathname.startsWith(prefix) || url.username || url.password || url.hash) throw new Error('Vuelve a seleccionar una imagen del catálogo Tony o sube tu archivo.');
  const cacheKey = url.href;
  let cached = catalogueImages.get(cacheKey);
  if (!cached) {
    cached = (async () => {
      const response = await fetch(url.href, {credentials: 'omit', cache: 'force-cache', redirect: 'error', signal: AbortSignal.timeout(30_000)});
      if (!response.ok) throw new Error('No pudimos cargar la imagen del catálogo. Conservamos tu diseño para que vuelvas a intentarlo.');
      if (Number(response.headers.get('content-length') || 0) > IMAGE_LIMIT) throw new Error('La imagen del catálogo supera 8 MB.');
      return blobData(await response.blob());
    })();
    catalogueImages.set(cacheKey, cached);
    cached.catch(() => catalogueImages.delete(cacheKey));
  }
  return cached;
}
/** New object; stable source bytes make payment and submit snapshots identical. */
async function apiOrder(order: PedidoDraft): Promise<PedidoDraft> {
  const image = (value: string | null) => value ? dataImage(value) : Promise.resolve(null);
  const [front, back, finalFront, finalBack, layers] = await Promise.all([
    image(order.design.front), image(order.design.back), image(order.design.finalFront), image(order.design.finalBack),
    Promise.all(order.design.layers.map(async layer => layer.data ? {...layer, data: await dataImage(layer.data)} : {...layer})),
  ]);
  return {...order, design: {...order.design, front, back, finalFront, finalBack, layers}};
}
function validReference(reference: string): string {
  if (!/^TONY-[A-F0-9]{24}$/.test(reference)) throw new Error('La referencia del pedido no es válida.');
  return reference;
}
export function safePaymentUrl(value: string, mock = false): string {
  let url: URL; try {url = new URL(value);} catch {throw new Error('El servicio no devolvió un enlace de pago válido.');}
  const localMock = mock && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.origin === window.location.origin;
  if (url.username || url.password || (!localMock && (url.protocol !== 'https:' || url.hostname !== 'lk.wompi.sv'))) throw new Error('El servicio no devolvió un enlace Wompi verificado.');
  return url.href;
}
export async function quotePedido(order: PedidoDraft, delivery: Delivery) {return (await post<ResponseObject & {quote: PedidoPricing}>('quote.php', {order: await apiOrder(order), delivery})).quote;}
export async function createPayment(order: PedidoDraft, delivery: Delivery, amountCents: number, key: string) {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) throw new Error('El anticipo no es válido. Actualiza la cotización.');
  const token = await session();
  let persists = false; try {persists = sessionStorage.getItem(TOKEN_KEY) === token;} catch { /* A payment return must be able to recover this session. */ }
  if (!persists) throw new Error('Tu navegador no permite conservar la sesión para volver del pago. Habilita el almacenamiento de esta pestaña o utiliza transferencia.');
  const result = await post<ResponseObject & CreatedPayment>('wompi-crear-pago.php', {order: await apiOrder(order), delivery, amountCents}, key);
  validReference(result.reference);
  result.url = safePaymentUrl(result.url, result.mock === true);
  if (result.amountCents !== amountCents) throw new Error('El anticipo del enlace no coincide. Verifica la cotización antes de pagar.');
  return result;
}
export async function verifyPayment(reference: string) {
  const result = await request<ResponseObject & PaymentVerification>(`wompi-verificar.php?order=${encodeURIComponent(validReference(reference))}`, {}, await session(true));
  if (result.reference !== reference) throw new Error('La respuesta no corresponde a este pedido.');
  if (result.url !== undefined) result.url = safePaymentUrl(result.url, result.mock === true);
  return result;
}
export async function submitPedido(input: {order: PedidoDraft; buyer: Buyer; delivery: Delivery; payment: Payment; signature: string; termsAccepted: boolean}, key: string) {
  const body = {...input, order: await apiOrder(input.order)};
  return (await post<ResponseObject & {receipt: Receipt}>('tony-submit-order.php', body, key, input.payment.method === 'wompi')).receipt;
}
export async function trackPedido(id: string) {return (await request<ResponseObject & {receipt: Receipt}>(`order.php?id=${encodeURIComponent(validReference(id))}`, {}, await session(true))).receipt;}
async function imageBlob(value: string) {return (await fetch(await dataImage(value))).blob();}
function generationRules(fields: Record<string, unknown>): string {
  const supplied = fields.placementRules ?? fields.placement_rules ?? fields.prompt;
  const rules = [typeof supplied === 'string' ? supplied : ''];
  if (fields.product === 'shirt') rules.push('Producto seleccionado: únicamente camiseta full sublimada, sin calzoneta ni otras prendas.');
  if (fields.product === 'uniform') rules.push('Producto seleccionado: uniforme full sublimado de camiseta y calzoneta.');
  if (typeof fields.gender === 'string') rules.push(`Corte del pedido: ${fields.gender}.`);
  if (fields.config && typeof fields.config === 'object') {
    const config = fields.config as Record<string, unknown>;
    const options = ['mold', 'fabric', 'collar', 'sleeve', 'brand'].filter(key => typeof config[key] === 'string').map(key => `${key}: ${String(config[key]).slice(0, 100)}`);
    if (options.length) rules.push(`Confección seleccionada: ${options.join('; ')}. Mantener el diseño y los elementos de la imagen de referencia.`);
  }
  // Buyer/contact/roster information is never included in this prompt.
  const text = rules.filter(Boolean).join('\n');
  if (text.length > 4000) throw new Error('Las indicaciones del diseño son demasiado largas.');
  return text;
}
export async function aiImage(operation: 'generate' | 'magic_eraser' | 'finalize', image: string, fields: Record<string, unknown>) {
  const form = new FormData(); const mainImage = await imageBlob(image); form.set('image', mainImage, `design.${mainImage.type === 'image/jpeg' ? 'jpg' : mainImage.type === 'image/webp' ? 'webp' : 'png'}`);
  form.set('side', fields.side === 'back' ? 'back' : 'front');
  if (operation !== 'magic_eraser') {
    if (fields.product !== undefined && fields.product !== 'uniform' && fields.product !== 'shirt') throw new Error('Selecciona un producto válido.');
    form.set('product', fields.product === 'shirt' ? 'shirt' : 'uniform');
  }
  if (operation === 'generate') form.set('placementRules', generationRules(fields));
  if (operation === 'magic_eraser') {
    const region = fields.region && typeof fields.region === 'object' ? fields.region as Record<string, unknown> : fields;
    for (const [key, alternate] of [['x', 'x'], ['y', 'y'], ['w', 'width'], ['h', 'height']]) {
      const value = region[key] ?? region[alternate];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new Error('Selecciona una región válida dentro del uniforme.');
      form.set(key, String(value));
    }
  }
  if (operation === 'finalize') {
    const assets = Array.isArray(fields.assets) ? fields.assets : [];
    if (assets.length > 8) throw new Error('El acabado admite hasta ocho archivos originales por vista.');
    const meta: {type: string; name: string}[] = [];
    for (const asset of assets) {
      if (!asset || typeof asset !== 'object') throw new Error('Un elemento del diseño no es válido.');
      const original = asset as Record<string, unknown>;
      if (typeof original.data !== 'string') throw new Error('Falta la imagen original de un elemento.');
      const blob = await imageBlob(original.data);
      if (blob.size > 4 * 1024 * 1024) throw new Error('Cada elemento original debe pesar menos de 4 MB.');
      form.append('assets[]', blob, `asset-${meta.length}.png`);
      meta.push({type: typeof original.type === 'string' ? original.type.slice(0, 50) : 'elemento', name: typeof original.name === 'string' ? original.name.slice(0, 100) : 'original'});
    }
    form.set('assets_meta', JSON.stringify(meta));
  }
  let fileBytes = 0; for (const value of form.values()) if (value instanceof Blob) fileBytes += value.size;
  if (fileBytes > BODY_LIMIT - 64 * 1024) throw new Error('El conjunto de imágenes supera el límite de 24 MB.');
  const result = await request<ResponseObject & {image: string; mime: string; provider: string}>(`${operation}.php`, {method: 'POST', body: form}, await session(), 200_000);
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(result.mime) || typeof result.image !== 'string' || !result.image.startsWith(`data:${result.mime};base64,`)) throw new Error('No recibimos una imagen válida. Conservamos el diseño anterior.');
  return checkedDataImage(result.image, 12_000_000);
}
