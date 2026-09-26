import { expect, test, type Page } from '@playwright/test';
import { createPedido } from '../../lib/pedido/order';
import type { PedidoDraft } from '../../lib/pedido/types';
import { expectNoOverflow, mockPedidoApi } from './helpers';

async function saveCart(page: Page, order: PedidoDraft) {
  await page.goto('/carrito');
  await page.evaluate(value => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('tony-pedido-v279', 1);
    request.onupgradeneeded = () => { request.result.createObjectStore('drafts'); request.result.createObjectStore('cart', { keyPath: 'id' }); };
    request.onsuccess = () => { const db = request.result, tx = db.transaction('cart', 'readwrite'); tx.objectStore('cart').put(value); tx.oncomplete = () => { db.close(); window.dispatchEvent(new Event('tony-pedido-updated')); resolve(); }; tx.onerror = () => reject(tx.error); };
    request.onerror = () => reject(request.error);
  }), order);
}

function draft() {
  const order = createPedido(); order.teamName = 'Equipo del cliente'; order.gender = 'Hombre';
  order.config = { mold: 'Estándar', fabric: 'Slim Fit', collar: 'V', sleeve: 'Corta', brand: 'Tony', brand3d: false, crest3d: true };
  order.players = order.players.map((player, i) => ({ ...player, name: `JUGADOR PRIVADO ${i + 1}`, number: String(i + 1), size: i < 3 ? 'M' : 'L' }));
  order.design = { ...order.design, source: 'catalog', catalogCode: 'TONY-010', front: '/assets/pedido/catalog/tony-010-front.webp', back: '/assets/pedido/catalog/tony-010-back.webp' };
  return order;
}

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

test('V279 cart restores a private design, counts it and requires confirmation before deletion', async ({ page }) => {
  const order = draft(); await saveCart(page, order);
  const card = page.locator('.pedido-saved-card');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText('Equipo del cliente');
  await expect(card).toContainText('TONY-010');
  await expect(card).toContainText('Full sublimado');
  await expect(page.locator('.cart-empty')).toHaveCount(0);
  await expect(page.locator('.cart-link').first()).toHaveAttribute('aria-label', 'Carrito, 1 diseño');
  await expect(card.getByRole('link', { name: 'Continuar este pedido' })).toHaveAttribute('href', `/configurador?pedido=${order.id}`);
  await page.reload(); await expect(card).toHaveCount(1);
  await card.getByRole('button', { name: /Eliminar/ }).click();
  const dialog = page.getByRole('dialog', { name: '¿Retirar este diseño?' });
  await expect(dialog).toBeVisible(); await dialog.getByRole('button', { name: 'Conservar diseño' }).click();
  await expect(card).toHaveCount(1);
  await card.getByRole('button', { name: /Eliminar/ }).click();
  await dialog.getByRole('button', { name: 'Sí, eliminar' }).click();
  await expect(card).toHaveCount(0);
  await expect(page.locator('.cart-link').first()).toHaveAttribute('aria-label', 'Carrito, 0 diseños');
  await page.reload(); await expect(card).toHaveCount(0);
});

test('recent orders distinguish drafts from saved server references without publishing the roster', async ({ page, browser }) => {
  await saveCart(page, draft());
  await page.evaluate(() => localStorage.setItem('tony:pedido:references:v279', JSON.stringify([{ id: 'TEST-REFERENCE-001', status: 'received' }])));
  await page.goto('/recientes');
  await expect(page.getByRole('heading', { name: 'Pedidos enviados.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pedidos en preparación.' })).toBeVisible();
  await expect(page.locator('.pedido-receipt').first()).toContainText('ÚLTIMO ESTADO GUARDADO');
  await expect(page.locator('.pedido-receipt').first()).toContainText('TEST-REFERENCE-001');
  await expect(page.locator('.pedido-recents')).toContainText('TONY-010');
  await expect(page.locator('.pedido-recents')).not.toContainText('JUGADOR PRIVADO');
  await expect(page.locator('.recent-empty')).toHaveCount(0);
  const reference = await page.evaluate(() => JSON.parse(localStorage.getItem('tony:pedido:references:v279')!)[0]);
  expect(Object.keys(reference).sort()).toEqual(['id', 'status']);
  const other = await browser.newContext({ reducedMotion: 'reduce' }); const otherPage = await other.newPage();
  await otherPage.goto(new URL('/recientes', page.url()).href); await expect(otherPage.locator('.recent-empty')).toBeVisible();
  await expect(otherPage.locator('.pedido-receipt')).toHaveCount(0); await other.close();
});

test('V279 cart and recent details fit a 320px screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 }); await saveCart(page, draft());
  await expect(page.locator('.pedido-saved-card')).toBeVisible(); await expectNoOverflow(page, 320);
  await page.goto('/recientes'); await expect(page.locator('.pedido-receipt')).toBeVisible(); await expectNoOverflow(page, 320);
});

test('a saved reference becomes verified only after its private server response', async ({ page }) => {
  await mockPedidoApi(page);
  await page.route('**/pedido-api/order.php?**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, receipt: { id: 'TONY-ABCDEF0123456789ABCDEF01', reference: 'TONY-TEST-002', status: 'confirmed', paymentStatus: 'deposit_paid', panelStatus: 'pending', totalCents: 7794, depositCents: 3897, balanceCents: 3897 } }) }));
  await page.goto('/recientes');
  await page.evaluate(() => { sessionStorage.setItem('tony:pedido:session:v279', 'a'.repeat(64)); localStorage.setItem('tony:pedido:references:v279', JSON.stringify([{ id: 'TONY-ABCDEF0123456789ABCDEF01', status: 'awaiting_review' }])); window.dispatchEvent(new Event('tony-pedido-updated')); });
  const receipt = page.locator('.pedido-receipt');
  await expect(receipt).toContainText('ÚLTIMO ESTADO GUARDADO');
  await expect(receipt).toContainText('Pendiente de revisión');
  await receipt.getByRole('button', { name: 'Consultar estado' }).click();
  await expect(receipt).toContainText('ESTADO VERIFICADO AHORA');
  await expect(receipt).toContainText('Anticipo verificado');
  await expect(receipt).toContainText('Envío al Panel pendiente');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('tony:pedido:references:v279')!))).toEqual([{ id: 'TONY-ABCDEF0123456789ABCDEF01', status: 'confirmed' }]);
});
