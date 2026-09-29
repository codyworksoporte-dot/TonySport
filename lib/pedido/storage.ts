'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {accountStorageKey} from '../auth';
import {readPedido} from './order';
import type {PedidoDraft, SubmittedReceipt} from './types';

const EVENT = 'tony-pedido-updated', RECEIPTS = 'tony:pedido:references:v279';
const database = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(accountStorageKey('tony-pedido-v279'), 1);
  request.onupgradeneeded = () => {request.result.createObjectStore('drafts'); request.result.createObjectStore('cart', {keyPath: 'id'});};
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(new Error('El navegador no pudo abrir tus borradores.'));
  request.onblocked = () => reject(new Error('Cierra las otras pestañas de Tony y vuelve a intentarlo.'));
});
async function transaction<T>(store: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode), request = action(tx.objectStore(store));
    tx.oncomplete = () => {db.close(); resolve(request.result);};
    tx.onerror = tx.onabort = () => {db.close(); reject(new Error('No pudimos guardar el diseño. Revisa el espacio disponible del navegador.'));};
  });
}
function safeDraft(draft: PedidoDraft) {
  const safe = readPedido(draft);
  if (!safe) throw new Error('El borrador contiene datos que no pudimos validar.');
  if (JSON.stringify(safe).length > 48_000_000) throw new Error('Reduce el tamaño de las imágenes antes de guardar el diseño.');
  return safe;
}
export async function loadDraft(id?: string): Promise<PedidoDraft | null> {
  const value = await transaction<unknown>(id ? 'cart' : 'drafts', 'readonly', store => store.get(id || 'current'));
  if (value === undefined) return null;
  const parsed = readPedido(value);
  if (!parsed) throw new Error('Encontramos un borrador incompatible. Se conserva sin sobrescribirlo.');
  return parsed;
}
export async function saveDraft(draft: PedidoDraft) {await transaction('drafts', 'readwrite', store => store.put(safeDraft(draft), 'current'));}
export async function clearDraft() {await transaction('drafts', 'readwrite', store => store.delete('current'));}
export async function readPedidoCart(): Promise<PedidoDraft[]> {
  const rows = await transaction<unknown[]>('cart', 'readonly', store => store.getAll());
  const parsed = rows.map(readPedido);
  if (parsed.some(row => !row)) throw new Error('Uno de tus diseños necesita revisión. Conservamos los archivos originales.');
  return parsed as PedidoDraft[];
}
export async function savePedidoCart(draft: PedidoDraft) {
  const owner=accountStorageKey('tony-pedido-v279');
  const safe = safeDraft(draft), rows = await readPedidoCart();
  if(owner!==accountStorageKey('tony-pedido-v279'))throw new Error('La sesión cambió. Vuelve a abrir el diseño antes de guardarlo.');
  if (!rows.some(row => row.id === safe.id) && rows.length >= 6) throw new Error('Tu carrito admite seis diseños. Retira uno antes de guardar otro.');
  await transaction('cart', 'readwrite', store => store.put(safe));
  window.dispatchEvent(new Event(EVENT));
}
export async function removePedidoCart(id: string) {await transaction('cart', 'readwrite', store => store.delete(id)); window.dispatchEvent(new Event(EVENT));}
export function usePedidoCart() {
  const [items, setItems] = useState<PedidoDraft[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const generation=useRef(0);
  const refresh = useCallback(async () => {const version=++generation.current;try {const rows=await readPedidoCart();if(version===generation.current){setItems(rows);setError('');}} catch (e) {if(version===generation.current)setError(e instanceof Error ? e.message : 'No pudimos abrir tus diseños.');} finally {if(version===generation.current)setLoading(false);}}, []);
  useEffect(() => {void refresh(); const update = () => void refresh(); window.addEventListener(EVENT, update); window.addEventListener('focus', update); return () => {generation.current++;window.removeEventListener(EVENT, update); window.removeEventListener('focus', update);};}, [refresh]);
  return {items, error, loading, refresh};
}
export function readReceipts(): SubmittedReceipt[] {
  try {const raw: unknown = JSON.parse(localStorage.getItem(accountStorageKey(RECEIPTS)) || '[]'); return Array.isArray(raw) ? raw.filter((row): row is SubmittedReceipt => !!row && typeof row.id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(row.id) && typeof row.status === 'string').map(({id, status}) => ({id, status: status.slice(0, 80)})).slice(0, 100) : [];} catch {return [];}
}
export function rememberReceipt(receipt: SubmittedReceipt) {
  localStorage.setItem(accountStorageKey(RECEIPTS), JSON.stringify([{id: receipt.id, status: receipt.status}, ...readReceipts().filter(row => row.id !== receipt.id)].slice(0, 100)));
  window.dispatchEvent(new Event(EVENT));
}
