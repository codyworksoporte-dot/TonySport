import {test, expect, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';
import {createOrder, ORDER_STORAGE_KEY, withQuantity} from '../lib/order';

const team = 'Atlético Prueba';
const cartDatabase = 'tony-cart-v1';

test.beforeEach(async ({page}) => {
  const order = withQuantity(createOrder(), '6');
  order.team = team;
  order.design.variant = 'stripe';
  order.garment.technique = 'full-sublimation';
  order.players = order.players.slice(0, 6).map((player, index) => ({
    ...player, name: `JUGADOR ${index + 1}`, size: ['S', 'M', 'M', 'L', 'XL', '16'][index], number: String(index + 1),
  }));
  await page.addInitScript(({key, value}) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
  }, {key: ORDER_STORAGE_KEY, value: order});
  await page.emulateMedia({reducedMotion: 'reduce'});
});

async function openReview(page: Page) {
  await page.goto('/configurador/archivo#paso-3');
  const review = page.getByRole('button', {name: 'Revisar mi pedido', exact: true});
  await expect(review).toBeEnabled();
  await review.click();
  await expect(page.getByRole('table', {name: 'Nómina completa del equipo'})).toBeVisible();
}

async function addCurrentReview(page: Page) {
  await page.getByRole('button', {name: 'Añadir al carrito', exact: true}).click();
  await expect(page.locator('.cart-add-message')).toContainText('Diseño añadido');
  await expect(page.getByRole('link', {name: 'Ver mi carrito', exact: true})).toBeVisible();
}

async function readyCart(page: Page) {
  await openReview(page);
  await addCurrentReview(page);
  await page.getByRole('link', {name: 'Ver mi carrito', exact: true}).click();
  await expect(page.locator('[data-cart-item]')).toHaveCount(1);
}

async function savedCart(page: Page) {
  return page.evaluate(database => new Promise<{id: string; order: {team: string; quantity: string}; assets: Record<string, string>}[]>((resolve, reject) => {
    const request = indexedDB.open(database, 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('items', 'readonly');
      const read = transaction.objectStore('items').getAll();
      read.onsuccess = () => resolve(read.result);
      read.onerror = () => reject(read.error);
      transaction.oncomplete = () => db.close();
    };
    request.onerror = () => reject(request.error);
  }), cartDatabase);
}

test('a configured team survives reload and appears only in this customer’s recent requests', async ({page, browser}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await readyCart(page);
  const item = page.locator('[data-cart-item]');
  await expect(item.getByRole('heading', {name: team, exact: true})).toBeVisible();
  await expect(item).toContainText('6 uniformes');
  await expect(item).toContainText('Full sublimado');
  await expect(item.locator('.cart-sizes')).toContainText('M× 2');
  await expect(page.locator('.cart-price')).toContainText('Por cotizar');
  await page.reload();
  await expect(item).toHaveCount(1);
  await item.locator('summary').click();
  await expect(item.locator('tbody tr')).toHaveCount(6);
  await expect(item.locator('tbody tr').last()).toContainText('JUGADOR 6');

  await page.goto('/recientes');
  const recent = page.locator('.recent-order');
  await expect(recent).toHaveCount(1);
  await expect(recent).toContainText(team);
  await expect(recent).toContainText('6 uniformes');
  await expect(recent).toContainText('Full sublimado');
  await expect(recent).toContainText('POR COTIZAR');
  await expect(recent).not.toContainText('JUGADOR 1');
  const id = (await savedCart(page))[0].id;
  await expect(recent.getByRole('link', {name: 'Ver diseño completo y detalles'})).toHaveAttribute('href', `/carrito#cart-${id}`);
  await recent.getByRole('link', {name: 'Ver diseño completo y detalles'}).click();
  await expect(page.locator(`#cart-${id}`)).toBeVisible();

  // Another browser context has no access to this customer's local requests.
  const anotherCustomer = await browser.newContext({reducedMotion: 'reduce'});
  const otherPage = await anotherCustomer.newPage();
  await otherPage.goto(new URL('/recientes', page.url()).href);
  await expect(otherPage.locator('.recent-empty')).toBeVisible();
  await expect(otherPage.locator('.recent-order')).toHaveCount(0);
  await anotherCustomer.close();
  expect(errors).toEqual([]);
});

test('adding the same review twice does not duplicate it and the header count updates', async ({page}) => {
  await openReview(page);
  await addCurrentReview(page);
  await expect(page.locator('.cart-link-count').first()).toHaveText('1');
  await page.getByRole('button', {name: 'Diseño guardado', exact: true}).click();
  await expect(page.locator('.cart-add-message')).toContainText('Este diseño ya está en tu carrito');
  expect(await savedCart(page)).toHaveLength(1);
  await expect(page.locator('.cart-link-count').first()).toHaveText('1');

  await page.getByRole('button', {name: 'Editar jugadores', exact: true}).click();
  await page.locator('#cfg-team').fill('Segundo equipo');
  await page.getByRole('button', {name: 'Ir al editor de diseño', exact: true}).click();
  await page.getByRole('button', {name: 'Revisar mi pedido', exact: true}).click();
  await addCurrentReview(page);
  await expect(page.locator('.cart-link-count').first()).toHaveText('2');
  expect((await savedCart(page)).map(item => item.order.team).sort()).toEqual([team, 'Segundo equipo'].sort());
  // General navigation must not deserialize every saved artwork to show a badge.
  await page.addInitScript(database => {
    const original = IDBObjectStore.prototype.getAll;
    IDBObjectStore.prototype.getAll = function (...args) {
      if (this.transaction.db.name === database) throw new Error('Artwork must not load for the header badge');
      return original.apply(this, args);
    };
  }, cartDatabase);
  await page.goto('/contacto');
  await expect(page.locator('.cart-link-count').first()).toHaveText('2');
});

test('Escape and cancel preserve the design; confirmation removes it from cart and recents', async ({page}) => {
  await readyCart(page);
  const remove = page.getByRole('button', {name: `Eliminar ${team} del carrito`, exact: true});
  const dialog = page.getByRole('dialog', {name: /RETIRAR ESTE\s*DISEÑO/});
  await remove.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', {name: 'Conservar diseño', exact: true})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(remove).toBeFocused();
  expect(await savedCart(page)).toHaveLength(1);
  await remove.click();
  await dialog.getByRole('button', {name: 'Conservar diseño', exact: true}).click();
  await expect(dialog).not.toBeVisible();
  await expect(remove).toBeFocused();
  await expect(page.locator('[data-cart-item]')).toHaveCount(1);
  await remove.click();
  await dialog.getByRole('button', {name: 'Sí, eliminar', exact: true}).click();
  await expect(page.locator('[data-cart-item]')).toHaveCount(0);
  await expect(page.locator('.cart-live')).toContainText(`${team} se eliminó del carrito`);
  await expect(page.locator('.cart-bite')).toHaveCount(0);
  expect(await savedCart(page)).toHaveLength(0);
  const draft = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), ORDER_STORAGE_KEY);
  expect(draft.team).toBe(team);
  await page.goto('/recientes');
  await expect(page.locator('.recent-empty')).toBeVisible();
  await expect(page.locator('.recent-order')).toHaveCount(0);
});

test('a branch is required and the manual quote and downloaded summary keep the requested details', async ({page}) => {
  await readyCart(page);
  await expect(page.locator('.cart-summary a[href*="wa.me"]')).toHaveCount(0);
  await page.getByRole('button', {name: 'Cotizar por WhatsApp', exact: true}).click();
  await expect(page.locator('#cart-branch')).toBeFocused();
  await expect(page.locator('#cart-branch')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#cart-branch-error')).toContainText('Elige la sucursal');
  await page.locator('#cart-branch').selectOption('Santa Ana');
  await expect(page.locator('#cart-branch-error')).toHaveCount(0);
  const quote = page.getByRole('link', {name: 'Cotizar por WhatsApp', exact: true});
  const url = new URL((await quote.getAttribute('href'))!);
  expect(url.pathname).toBe('/50376190612');
  expect(url.searchParams.get('text')).toContain(`${team}: 6 uniformes completos, Full sublimado`);
  expect(url.searchParams.get('text')).toContain('M × 2');
  expect(url.searchParams.get('text')).toContain('Total: 6 unidades.');
  await expect(quote).toHaveAttribute('target', '_blank');

  const nextDownload = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Descargar resumen completo', exact: true}).click();
  const file = await nextDownload;
  const contents = await readFile((await file.path())!, 'utf8');
  expect(file.suggestedFilename()).toBe('tony-carrito-cotizacion.txt');
  expect(contents).toContain(`Equipo: ${team}`);
  expect(contents).toContain('JUGADOR 6 | Talla 16 | Dorsal 6');
  expect(contents).toContain('Técnica solicitada: Full sublimado');
  // Do not click the external quote link or send anything to a branch.
});

test('the lizard deletion effect starts only after confirmation and ends with the saved item removed', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await readyCart(page);
  await page.getByRole('button', {name: `Eliminar ${team} del carrito`, exact: true}).click();
  await expect(page.locator('.cart-bite')).toHaveCount(0);
  expect(await savedCart(page)).toHaveLength(1);
  await page.getByRole('button', {name: 'Sí, eliminar', exact: true}).click();
  await expect(page.locator('.cart-bite')).toBeVisible();
  expect(await savedCart(page)).toHaveLength(0);
  await expect(page.locator('[data-cart-item]')).toHaveCount(0);
  await expect(page.locator('.cart-bite')).toHaveCount(0);
  await expect(page.locator('.cart-empty')).toBeVisible();
});

test('uploaded artwork remains in the cart after the editor draft and its files are reset', async ({page}) => {
  await page.goto('/configurador/archivo#paso-3');
  await expect(page.locator('svg[data-studio-artwork]')).toBeVisible();
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 80; canvas.height = 120;
    const context = canvas.getContext('2d')!; context.fillStyle = '#ff00dd'; context.fillRect(0, 0, 80, 120);
    return canvas.toDataURL('image/png');
  });
  await page.locator('#tds-file-crest').setInputFiles({name: 'escudo-prueba.png', mimeType: 'image/png', buffer: Buffer.from(data.split(',')[1], 'base64')});
  await expect(page.locator('[data-studio-artwork] [data-layer-kind="image"]')).toHaveCount(1);
  await page.getByRole('button', {name: 'Revisar mi pedido', exact: true}).click();
  await addCurrentReview(page);
  const before = await savedCart(page);
  expect(Object.keys(before[0].assets)).toHaveLength(1);
  const asset = Object.values(before[0].assets)[0];
  expect(asset).toMatch(/^data:image\/png;base64,/);

  await page.getByRole('button', {name: 'Borrar borrador y empezar de nuevo', exact: true}).click();
  await page.getByRole('button', {name: 'Sí, borrar borrador', exact: true}).click();
  await expect(page.locator('#cfg-quantity')).toHaveValue('12');
  await expect.poll(() => page.evaluate(() => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('tony-team-artwork-v1', 1);
    request.onsuccess = () => {
      const db = request.result, transaction = db.transaction('artwork', 'readonly');
      const read = transaction.objectStore('artwork').get('current');
      read.onsuccess = () => resolve(Object.keys(read.result || {}).length);
      read.onerror = () => reject(read.error);
      transaction.oncomplete = () => db.close();
    };
    request.onerror = () => reject(request.error);
  }))).toBe(0);
  await page.goto('/carrito');
  await expect(page.locator('[data-cart-item]')).toHaveCount(1);
  await expect(page.locator('[data-studio-artwork] [data-layer-kind="image"] image')).toHaveAttribute('href', asset);
  expect((await savedCart(page))[0].assets).toEqual(before[0].assets);
  await page.reload();
  await expect(page.locator('[data-studio-artwork] [data-layer-kind="image"] image')).toHaveAttribute('href', asset);

  const nextDownload = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Descargar frente', exact: true}).click();
  const file = await nextDownload;
  const png = await readFile((await file.path())!);
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  const coloredPixels = await page.evaluate(async base64 => {
    const image = new Image(); image.src = `data:image/png;base64,${base64}`; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let matches = 0;
    for (let index = 0; index < pixels.length; index += 4) if (pixels[index] > 210 && pixels[index + 1] < 60 && pixels[index + 2] > 180 && pixels[index + 3] > 200) matches++;
    return matches;
  }, png.toString('base64'));
  expect(coloredPixels).toBeGreaterThan(100);
});

test('a failed write explains the storage problem and leaves previous cart entries intact', async ({page}) => {
  await openReview(page);
  await addCurrentReview(page);
  const before = await savedCart(page);
  await page.getByRole('button', {name: 'Editar jugadores', exact: true}).click();
  await page.locator('#cfg-team').fill('No debe guardarse');
  await page.getByRole('button', {name: 'Ir al editor de diseño', exact: true}).click();
  await page.getByRole('button', {name: 'Revisar mi pedido', exact: true}).click();
  await page.evaluate(database => {
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (value, key) {
      if (this.transaction.db.name === database) throw new DOMException('Simulated full browser storage', 'QuotaExceededError');
      return original.call(this, value, key);
    };
  }, cartDatabase);
  await page.getByRole('button', {name: 'Añadir al carrito', exact: true}).click();
  await expect(page.locator('.cart-add-message[role="alert"]')).toContainText('No queda espacio');
  await expect(page.getByRole('button', {name: 'Añadir al carrito', exact: true})).toBeEnabled();
  expect(await savedCart(page)).toEqual(before);
  await page.goto('/carrito');
  await expect(page.locator('[data-cart-item]')).toHaveCount(1);
  await expect(page.locator('[data-cart-item]')).toContainText(team);
  await expect(page.locator('[data-cart-item]')).not.toContainText('No debe guardarse');
});

test('cart controls and confirmation remain accessible without horizontal overflow at phone and desktop widths', async ({page}) => {
  await readyCart(page);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({width, height: 900});
    await expect.poll(() => page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth))).toBeLessThanOrEqual(width);
    await expect(page.locator('#cart-branch')).toBeVisible();
    await page.getByRole('button', {name: `Eliminar ${team} del carrito`, exact: true}).click();
    await expect(page.getByRole('button', {name: 'Conservar diseño', exact: true})).toBeFocused();
    await expect.poll(() => page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth))).toBeLessThanOrEqual(width);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  }
  const pageResults = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(pageResults.violations.map(violation => ({id: violation.id, nodes: violation.nodes.map(node => node.target)}))).toEqual([]);
  await page.getByRole('button', {name: `Eliminar ${team} del carrito`, exact: true}).click();
  const modalResults = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(modalResults.violations.map(violation => ({id: violation.id, nodes: violation.nodes.map(node => node.target)}))).toEqual([]);
});
