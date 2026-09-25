'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {activePlayers, readOrder, validateOrder, type DesignAssets, type OrderDraft} from './order';
import {isAssetKey} from './studio';

/** A cart item is a quote request, never evidence of a purchase or payment. */
export type CartItem = {id: string; addedAt: string; order: OrderDraft; assets: DesignAssets};
type StoredItem = CartItem & {version: 1; fingerprint: string};
export const CART_EVENT = 'tony:cart-changed';
export const CART_DATABASE = 'tony-cart-v1';
export const CART_MAX_ITEMS = 6;
const CART_SIGNAL = 'tony:cart-signal';
const ITEM_BYTES = 20 * 1024 * 1024;
const CART_BYTES = 60 * 1024 * 1024;
const unreadable = 'No pudimos leer un diseño guardado. No hemos borrado ni reemplazado tu carrito. Intenta abrirlo de nuevo en este navegador.';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {reject(new Error('Este navegador no permite guardar el carrito. Descarga el resumen y tus diseños desde la revisión.')); return;}
    let settled = false;
    const request = indexedDB.open(CART_DATABASE, 1);
    const timeout = window.setTimeout(() => {settled = true; reject(new Error('No se pudo abrir el carrito. Cierra otras pestañas de Tony e inténtalo de nuevo.'));}, 6000);
    request.onupgradeneeded = () => request.result.createObjectStore('items', {keyPath: 'id'});
    request.onsuccess = () => {
      window.clearTimeout(timeout);
      if (settled) {request.result.close(); return;}
      settled = true;
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => {window.clearTimeout(timeout); settled = true; reject(request.error);};
  });
}

function assetBytes(assets: DesignAssets) {
  return Object.values(assets).reduce((total, value) => total + (value ? Math.ceil((value.length - value.indexOf(',') - 1) * .75) : 0), 0);
}

function readAssets(value: unknown): DesignAssets {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(unreadable);
  const entries = Object.entries(value);
  if (entries.length > 64) throw new Error(unreadable);
  const assets: DesignAssets = {};
  for (const [key, item] of entries) {
    if (item === undefined) continue;
    if (!isAssetKey(key) || typeof item !== 'string' || item.length > 6_000_000 || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(item)) throw new Error(unreadable);
    assets[key] = item;
  }
  if (assetBytes(assets) > ITEM_BYTES) throw new Error('Este diseño supera los 20 MB de archivos. Reduce las imágenes antes de añadirlo al carrito.');
  return assets;
}

function checkedOrder(value: unknown, assets: DesignAssets): OrderDraft {
  const order = readOrder(value);
  if (!order || Object.keys(validateOrder(order, 3)).length || activePlayers(order).length !== Number(order.quantity)) throw new Error('Completa la cantidad, el equipo y la ficha de cada jugador antes de añadir el diseño.');
  const missing = order.design.mode === 'reference' ? !assets.front : order.design.layers.some(layer => layer.kind === 'image' && layer.visible && layer.opacity > 0 && (!layer.assetKey || !assets[layer.assetKey]));
  if (missing) throw new Error('Falta una imagen del diseño. Vuelve al editor y cárgala antes de añadirlo al carrito.');
  return {...order, players: activePlayers(order)};
}

function readItem(value: unknown): StoredItem {
  if (!value || typeof value !== 'object') throw new Error(unreadable);
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1 || typeof raw.id !== 'string' || !/^[\w-]{1,80}$/.test(raw.id) || typeof raw.addedAt !== 'string' || !Number.isFinite(Date.parse(raw.addedAt)) || typeof raw.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(raw.fingerprint)) throw new Error(unreadable);
  const assets = readAssets(raw.assets);
  return {version: 1, id: raw.id, addedAt: raw.addedAt, fingerprint: raw.fingerprint, order: checkedOrder(raw.order, assets), assets};
}

function signalChange() {
  window.dispatchEvent(new Event(CART_EVENT));
  // Only a signal crosses tabs; player names and artwork stay inside IndexedDB.
  try {localStorage.setItem(CART_SIGNAL, `${Date.now()}-${Math.random()}`);} catch { /* IndexedDB remains the source of truth. */ }
}

export function cartError(error: unknown) {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') return 'No queda espacio en este navegador. Tu carrito anterior sigue guardado; descarga tus diseños y libera espacio antes de reintentar.';
  if (error instanceof Error && !(error instanceof DOMException)) return error.message;
  return 'No se pudo guardar el cambio. Tu carrito anterior sigue intacto. Inténtalo de nuevo y conserva tus archivos originales.';
}

export async function loadCart(): Promise<CartItem[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('items', 'readonly');
    const request = tx.objectStore('items').getAll();
    let items: StoredItem[] = [];
    let failure: unknown;
    request.onsuccess = () => {try {items = request.result.map(readItem);} catch (error) {failure = error; tx.abort();}};
    tx.oncomplete = () => {db.close(); resolve(items.sort((a, b) => b.addedAt.localeCompare(a.addedAt)));};
    tx.onabort = () => {db.close(); reject(failure || tx.error);};
    tx.onerror = () => { /* onabort handles the transaction and closes the connection. */ };
  });
}

/** Header badges need only a count: never deserialize customer artwork here. */
export async function loadCartCount(): Promise<number> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('items', 'readonly');
    const request = tx.objectStore('items').count();
    tx.oncomplete = () => {
      db.close();
      if (request.result > CART_MAX_ITEMS) reject(new Error(unreadable));
      else resolve(request.result);
    };
    tx.onabort = () => {db.close(); reject(tx.error);};
    tx.onerror = () => {};
  });
}

export async function addCartItem(source: OrderDraft, sourceAssets: DesignAssets): Promise<{item: CartItem; added: boolean}> {
  // Snapshot before asynchronous work; later edits to the draft cannot alter this item.
  const assets = readAssets({...sourceAssets});
  const order = checkedOrder(source, assets);
  const encoded = new TextEncoder().encode(JSON.stringify({order, assets: Object.fromEntries(Object.entries(assets).sort(([a], [b]) => a.localeCompare(b)))}));
  const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoded)), byte => byte.toString(16).padStart(2, '0')).join('');
  const item: StoredItem = {version: 1, id: crypto.randomUUID(), addedAt: new Date().toISOString(), fingerprint, order, assets};
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('items', 'readwrite');
    const store = tx.objectStore('items');
    const request = store.getAll();
    let result = {item: item as CartItem, added: true};
    let failure: unknown;
    request.onsuccess = () => {
      try {
        const existing = request.result.map(readItem);
        const duplicate = existing.find(entry => entry.fingerprint === fingerprint);
        if (duplicate) {result = {item: duplicate, added: false}; return;}
        if (existing.length >= CART_MAX_ITEMS) throw new Error(`Puedes guardar hasta ${CART_MAX_ITEMS} diseños. Revisa tu carrito antes de añadir otro.`);
        if (existing.reduce((sum, entry) => sum + assetBytes(entry.assets), assetBytes(assets)) > CART_BYTES) throw new Error('El carrito alcanzó los 60 MB de archivos. Descarga y retira un diseño antes de añadir otro.');
        store.add(item);
      } catch (error) {failure = error; tx.abort();}
    };
    tx.oncomplete = () => {db.close(); signalChange(); resolve(result);};
    tx.onabort = () => {db.close(); reject(failure || tx.error);};
    tx.onerror = () => {};
  });
}

export async function removeCartItem(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('items', 'readwrite');
    tx.objectStore('items').delete(id);
    tx.oncomplete = () => {db.close(); signalChange(); resolve();};
    tx.onabort = () => {db.close(); reject(tx.error);};
    tx.onerror = () => {};
  });
}

function subscribeCart(update: () => void) {
  const storage = (event: StorageEvent) => {if (event.key === CART_SIGNAL) update();};
  const visible = () => {if (document.visibilityState === 'visible') update();};
  window.addEventListener(CART_EVENT, update);
  window.addEventListener('storage', storage);
  document.addEventListener('visibilitychange', visible);
  return () => {window.removeEventListener(CART_EVENT, update); window.removeEventListener('storage', storage); document.removeEventListener('visibilitychange', visible);};
}

export function useCartCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mounted = useRef(false), generation = useRef(0);
  const refresh = useCallback(async () => {
    const revision = ++generation.current;
    try {
      const next = await loadCartCount();
      if (mounted.current && revision === generation.current) {setCount(next); setError('');}
    } catch (failure) {if (mounted.current && revision === generation.current) setError(cartError(failure));}
    finally {if (mounted.current && revision === generation.current) setLoading(false);}
  }, []);
  useEffect(() => {
    mounted.current = true;
    void refresh();
    const unsubscribe = subscribeCart(() => {void refresh();});
    return () => {mounted.current = false; unsubscribe();};
  }, [refresh]);
  return {count, loading, error, refresh};
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mounted = useRef(false), generation = useRef(0);
  const refresh = useCallback(async () => {
    const revision = ++generation.current;
    try {
      const next = await loadCart();
      if (mounted.current && revision === generation.current) {setItems(next); setError('');}
    } catch (failure) {if (mounted.current && revision === generation.current) setError(cartError(failure));}
    finally {if (mounted.current && revision === generation.current) setLoading(false);}
  }, []);
  useEffect(() => {
    mounted.current = true;
    void refresh();
    const unsubscribe = subscribeCart(() => {void refresh();});
    return () => {mounted.current = false; unsubscribe();};
  }, [refresh]);
  return {items, loading, error, refresh};
}
