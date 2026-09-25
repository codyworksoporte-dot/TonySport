import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { createOrder, withQuantity, ORDER_STORAGE_KEY } from '../lib/order';

test.beforeEach(async ({ page }) => {
  const order = withQuantity(createOrder(), '6');
  order.team = 'Club de prueba';
  order.players = order.players.slice(0, 6).map((player, index) => ({
    ...player, name: `JUGADOR ${index + 1}`, size: 'M', number: String(index + 1),
  }));
  await page.addInitScript(({ key, value }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
  }, { key: ORDER_STORAGE_KEY, value: order });
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

async function openEditor(page: Page) {
  await page.goto('/configurador#paso-3');
  await expect(page.locator('svg[data-studio-artwork]')).toBeVisible();
}

async function pngFixture(page: Page, color = '#ff00dd') {
  const data = await page.evaluate(fill => {
    const canvas = document.createElement('canvas');
    canvas.width = 80; canvas.height = 120;
    const context = canvas.getContext('2d')!;
    context.fillStyle = fill;
    context.fillRect(0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  }, color);
  return Buffer.from(data.split(',')[1], 'base64');
}

async function addImage(page: Page, kind: 'design' | 'crest', name: string, color?: string) {
  await page.getByRole('button', { name: 'Diseño', exact: true }).click();
  const before = await page.locator('[data-studio-artwork] [data-layer-kind="image"]').count();
  await page.locator(`#tds-file-${kind}`).setInputFiles({
    name: `${name}.png`, mimeType: 'image/png', buffer: await pngFixture(page, color),
  });
  await expect(page.locator('[data-studio-artwork] [data-layer-kind="image"]')).toHaveCount(before + 1);
  await page.getByRole('button', { name: /^Capas/ }).click();
  await page.locator('#tds-layer-name').fill(name);
  await expect(page.getByRole('button', { name: `Seleccionar capa ${name}`, exact: true })).toBeVisible();
}

async function waitForSavedArtwork(page: Page, minimum: number) {
  await expect.poll(() => page.evaluate(count => new Promise<boolean>(resolve => {
    const request = indexedDB.open('tony-team-artwork-v1', 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('artwork', 'readonly');
      const read = transaction.objectStore('artwork').get('current');
      read.onsuccess = () => resolve(Object.values(read.result || {}).filter(Boolean).length >= count);
      read.onerror = () => resolve(false);
      transaction.oncomplete = () => db.close();
    };
    request.onerror = () => resolve(false);
  }), minimum)).toBe(true);
}

async function downloadPNG(page: Page) {
  const nextDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar PNG', exact: true }).click();
  const file = await nextDownload;
  const bytes = await readFile((await file.path())!);
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(bytes.readUInt32BE(16)).toBeGreaterThan(300);
  expect(bytes.readUInt32BE(20)).toBeGreaterThan(300);
  return { name: file.suggestedFilename(), bytes };
}

async function magentaPixels(page: Page, bytes: Buffer) {
  return page.evaluate(async data => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let matches = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index] > 210 && pixels[index + 1] < 60 && pixels[index + 2] > 180 && pixels[index + 3] > 200) matches++;
    }
    return matches;
  }, bytes.toString('base64'));
}

async function expectNoOverflow(page: Page, width: number) {
  await expect.poll(() => page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)))
    .toBeLessThanOrEqual(width);
}

test('typing keeps focus and the player, design and review steps expose accessible controls', async ({ page }) => {
  await page.goto('/configurador#paso-2');
  await page.locator('#player-0-name').fill('');
  await page.locator('#player-0-name').pressSequentially('MARÍA LÓPEZ');
  await expect(page.locator('#player-0-name')).toBeFocused();
  await expect(page.locator('#player-0-name')).toHaveValue('MARÍA LÓPEZ');
  for (const step of [2, 3, 4]) {
    if (step === 3) await page.getByRole('button', { name: 'Ir al editor de diseño' }).click();
    if (step === 4) await page.getByRole('button', { name: 'Revisar mi pedido' }).click();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) })), `paso ${step}`).toEqual([]);
  }
});

test('own PNG artwork and crest are clipped to the garment with independent sides and persistent transforms', async ({ page }) => {
  await openEditor(page);
  await addImage(page, 'design', 'Diseño frontal');
  await page.locator('#tds-layer-rotation').fill('23');
  await page.locator('#tds-layer-opacity').fill('57');
  await page.locator('#tds-layer-width').fill('160');
  await page.locator('#tds-layer-x').fill('15');
  const frontLayer = page.locator('[data-studio-artwork] [data-layer-kind="image"]').first();
  const frontId = await frontLayer.getAttribute('data-layer-id');
  await expect(frontLayer.locator('image')).toHaveCount(1);
  expect(await frontLayer.locator('image').evaluate(element => {
    let ancestor: Element | null = element;
    while (ancestor && ancestor.tagName.toLowerCase() !== 'svg') {
      if (ancestor.hasAttribute('clip-path')) return true;
      ancestor = ancestor.parentElement;
    }
    return false;
  })).toBe(true);
  await addImage(page, 'crest', 'Escudo frontal', '#12bfee');
  await page.getByRole('button', { name: 'Espalda', exact: true }).click();
  await expect(page.locator('svg[data-studio-artwork]')).toHaveAttribute('data-studio-side', 'back');
  await expect(page.locator('[data-studio-artwork] [data-layer-kind="image"]')).toHaveCount(0);
  await addImage(page, 'design', 'Diseño dorsal', '#ff8421');
  await waitForSavedArtwork(page, 3);
  await page.reload();
  await expect(page.locator('svg[data-studio-artwork]')).toBeVisible();
  await page.getByRole('button', { name: 'Frente', exact: true }).click();
  await expect(page.locator('[data-studio-artwork] [data-layer-kind="image"]')).toHaveCount(2);
  await page.getByRole('button', { name: /^Capas/ }).click();
  await page.getByRole('button', { name: 'Seleccionar capa Diseño frontal', exact: true }).click();
  await expect(page.locator('#tds-layer-rotation')).toHaveValue('23');
  await expect(page.locator('#tds-layer-opacity')).toHaveValue('57');
  await expect(page.locator('#tds-layer-width')).toHaveValue('160');
  await expect(page.locator('#tds-layer-x')).toHaveValue('15');
  const restored = page.locator(`[data-studio-artwork] [data-layer-id="${frontId}"]`);
  await expect(restored).toHaveAttribute('transform', /rotate\(23(?:[ ,)]|$)/);
  expect(await restored.evaluate(element => Number(getComputedStyle(element).opacity))).toBeCloseTo(0.57, 2);
  await page.getByRole('button', { name: 'Espalda', exact: true }).click();
  await expect(page.locator('[data-studio-artwork] [data-layer-kind="image"]')).toHaveCount(1);
});

test('template marks and layers can be changed, locked, hidden, duplicated and removed with undo and redo', async ({ page }) => {
  await openEditor(page);
  await page.getByRole('checkbox', { name: 'Marcas Tony', exact: true }).uncheck();
  await expect(page.getByRole('checkbox', { name: 'Marcas Tony', exact: true })).not.toBeChecked();
  await expect(page.locator('[data-studio-artwork] [data-template-element="brand"]')).toHaveCount(0);
  await addImage(page, 'crest', 'Escudo del club');
  await page.getByRole('button', { name: 'Bloquear capa Escudo del club', exact: true }).click();
  const lockedLayer = page.locator('[data-studio-artwork] [data-layer-kind="image"]');
  await expect(lockedLayer).toHaveAttribute('data-layer-locked', 'true');
  await expect(page.locator('#tds-layer-x')).toBeDisabled();
  const lockedTransform = await lockedLayer.getAttribute('transform');
  await lockedLayer.focus();
  await lockedLayer.press('ArrowRight');
  await expect(lockedLayer).toHaveAttribute('transform', lockedTransform!);
  await page.getByRole('button', { name: 'Desbloquear capa Escudo del club', exact: true }).click();
  await expect(page.locator('#tds-layer-x')).toBeEnabled();
  await page.getByRole('button', { name: 'Ocultar capa Escudo del club', exact: true }).click();
  await expect(page.locator('[data-studio-artwork] [data-layer-kind="image"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Mostrar capa Escudo del club', exact: true }).click();
  await page.getByRole('button', { name: 'Duplicar capa', exact: true }).click();
  await expect(page.locator('[data-studio-artwork] [data-layer-kind="image"]')).toHaveCount(2);
  await page.locator('#tds-layer-name').fill('Escudo duplicado');
  await page.getByRole('button', { name: 'Eliminar capa', exact: true }).click();
  await expect(page.locator('[data-studio-artwork] [data-layer-kind="image"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect(page.locator('[data-studio-artwork] [data-layer-kind="image"]')).toHaveCount(2);
  await page.getByRole('button', { name: 'Seleccionar capa Escudo duplicado', exact: true }).click();
  await page.getByRole('button', { name: 'Rehacer', exact: true }).click();
  await expect(page.locator('[data-studio-artwork] [data-layer-kind="image"]')).toHaveCount(1);
  await expect(page.locator('.order-design-step')).toBeVisible();
  await waitForSavedArtwork(page, 1);
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Marcas Tony', exact: true })).not.toBeChecked();
  await expect(page.locator('[data-studio-artwork] [data-template-element="brand"]')).toHaveCount(0);
  await page.getByRole('button', { name: /^Agregar texto/ }).click();
  await page.locator('#tds-sponsor').fill('MI PATROCINADOR');
  await expect(page.locator('#tds-sponsor')).toBeFocused();
  const textLayer = page.locator('[data-studio-artwork] [data-layer-kind="text"]');
  await expect(textLayer.locator('text')).toHaveText('MI PATROCINADOR');
  const textId = await textLayer.getAttribute('data-layer-id');
  await page.getByRole('button', { name: 'Bajar capa', exact: true }).click();
  await expect(page.locator('[data-studio-artwork] [data-layer-id]').first()).toHaveAttribute('data-layer-id', textId!);
  await page.getByRole('button', { name: 'Subir capa', exact: true }).click();
  await expect(page.locator('[data-studio-artwork] [data-layer-id]').last()).toHaveAttribute('data-layer-id', textId!);
});

for (const technique of ['Full sublimado', 'Estampado', 'Bordado']) {
  test(`${technique} is carried from the editor into the review and full TXT request`, async ({ page }) => {
    await openEditor(page);
    await page.getByRole('button', { name: 'Prenda', exact: true }).click();
    await page.getByRole('button', { name: technique, exact: true }).click();
    await expect(page.getByRole('button', { name: technique, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Revisar mi pedido' }).click();
    await expect(page.locator('.order-specs')).toContainText(technique);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar resumen completo' }).click();
    const file = await download;
    const text = await readFile((await file.path())!, 'utf8');
    expect(text).toContain(`Técnica solicitada: ${technique}`);
    expect(text).toContain('JUGADOR 6 | Talla M | Dorsal 6');
    const url = new URL((await page.getByRole('link', { name: 'Abrir WhatsApp para cotizar' }).getAttribute('href'))!);
    expect(url.searchParams.get('text')).toContain(`Técnica solicitada: ${technique}`);
  });
}

test('the downloaded PNG matches visible layers and omits artwork hidden in the editor', async ({ page }) => {
  await openEditor(page);
  await addImage(page, 'design', 'Arte magenta');
  await page.locator('#tds-layer-x').fill('50');
  await page.locator('#tds-layer-y').fill('45');
  await page.locator('#tds-layer-width').fill('60');
  await page.locator('#tds-layer-height').fill('50');
  const shown = await downloadPNG(page);
  expect(shown.name).toMatch(/frente|frontal/);
  expect(await magentaPixels(page, shown.bytes)).toBeGreaterThan(1000);
  await page.getByRole('button', { name: 'Ocultar capa Arte magenta', exact: true }).click();
  const hidden = await downloadPNG(page);
  expect(await magentaPixels(page, hidden.bytes)).toBe(0);
  await page.getByRole('button', { name: 'Mostrar capa Arte magenta', exact: true }).click();
  await page.getByRole('button', { name: 'Espalda', exact: true }).click();
  const back = await downloadPNG(page);
  expect(back.name).toMatch(/espalda|posterior/);
  expect(await magentaPixels(page, back.bytes)).toBe(0);
});

test('unsupported, corrupt and oversized uploads report an error and preserve existing artwork', async ({ page }) => {
  await openEditor(page);
  await addImage(page, 'crest', 'Escudo conservado');
  await page.getByRole('button', { name: 'Diseño', exact: true }).click();
  await page.locator('.tds-reference-options summary').click();
  await page.getByRole('button', { name: 'Referencia plana', exact: true }).click();
  await page.getByRole('button', { name: 'Revisar mi pedido' }).click();
  await expect(page.locator('#order-design-error')).toContainText('referencia frontal');
  await page.locator('#tds-file-front').setInputFiles({ name: 'referencia.png', mimeType: 'image/png', buffer: await pngFixture(page) });
  await expect(page.locator('svg[data-studio-artwork] > image')).toHaveCount(1);
  await page.getByRole('button', { name: 'Editar sobre la camisa', exact: true }).click();
  const input = page.locator('#tds-file-design');
  await input.setInputFiles({ name: 'instrucciones.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') });
  await expect(page.locator('#tds-error-design')).toContainText(/PNG.*JPG.*WebP/);
  await input.setInputFiles({ name: 'roto.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
  await expect(page.locator('#tds-error-design')).toContainText(/No se pudo abrir|no se pudo abrir/);
  await input.setInputFiles({ name: 'enorme.png', mimeType: 'image/png', buffer: Buffer.alloc(4 * 1024 * 1024 + 1) });
  await expect(page.locator('#tds-error-design')).toContainText('4 MB');
  await expect(page.locator('[data-studio-artwork] [data-layer-kind="image"]')).toHaveCount(1);
  await page.getByRole('button', { name: /^Capas/ }).click();
  await expect(page.getByRole('button', { name: 'Seleccionar capa Escudo conservado', exact: true })).toBeVisible();
});

test('a missing saved image blocks the review until its broken layer is removed', async ({ page }) => {
  await openEditor(page);
  await addImage(page, 'design', 'Archivo perdido');
  await waitForSavedArtwork(page, 1);
  // Reproduce clearing only local artwork while the text draft still exists.
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('tony-team-artwork-v1', 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('artwork', 'readwrite');
      transaction.objectStore('artwork').clear();
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => { db.close(); reject(transaction.error); };
    };
    request.onerror = () => reject(request.error);
  }));
  await page.reload();
  await expect(page.locator('svg[data-studio-artwork]')).toBeVisible();
  await page.getByRole('button', { name: 'Revisar mi pedido' }).click();
  await expect(page.locator('#order-design-error')).toContainText('Falta el archivo');
  await expect(page.locator('#order-design-error')).toBeFocused();
  await expect(page).toHaveURL(/#paso-3$/);
  await page.getByRole('button', { name: /^Capas/ }).click();
  await page.getByRole('button', { name: 'Seleccionar capa Archivo perdido', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar capa', exact: true }).click();
  await page.getByRole('button', { name: 'Revisar mi pedido' }).click();
  await expect(page.locator('.order-review-roster tbody tr')).toHaveCount(6);
});

for (const width of [320, 390]) {
  test(`layer controls work with the keyboard and fit a ${width}px phone`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await openEditor(page);
    await expectNoOverflow(page, width);
    await addImage(page, 'crest', 'Escudo móvil');
    await page.locator('#tds-layer-x').fill('40');
    const canvasLayer = page.locator('[data-studio-artwork] [data-layer-kind="image"]');
    await canvasLayer.focus();
    await canvasLayer.press('ArrowRight');
    await expect(page.locator('#tds-layer-x')).toHaveValue('41');
    await page.locator('#tds-layer-rotation').fill('15');
    await page.locator('#tds-layer-opacity').fill('75');
    await expectNoOverflow(page, width);
    await page.getByRole('button', { name: 'Ocultar capa Escudo móvil', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-studio-artwork] [data-layer-kind="image"]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Mostrar capa Escudo móvil', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-studio-artwork] [data-layer-kind="image"]')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
    await page.getByRole('button', { name: 'Prenda', exact: true }).click();
    await expectNoOverflow(page, width);
    await page.getByRole('button', { name: 'Revisar mi pedido' }).click();
    await expectNoOverflow(page, width);
  });
}

test('numeric fields accept fresh negative input and production changes support undo and redo', async ({page}) => {
  await openEditor(page);
  await page.getByRole('button', {name:'Agregar texto',exact:true}).click();
  const rotation=page.locator('#tds-layer-rotation');
  await rotation.fill('');
  await expect(rotation).toHaveValue('');
  await rotation.pressSequentially('-30');
  await rotation.press('Tab');
  await expect(rotation).toHaveValue('-30');
  await expect(page.locator('[data-studio-artwork] [data-layer-kind="text"]')).toHaveAttribute('transform',/rotate\(-30\)/);
  await page.getByRole('button', {name:'Prenda',exact:true}).click();
  await page.getByRole('button', {name:'Estampado',exact:true}).click();
  await expect(page.getByRole('button', {name:'Estampado',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button', {name:'Deshacer',exact:true}).click();
  await expect(page.getByRole('button', {name:'Asesorarme con Tony',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button', {name:'Rehacer',exact:true}).click();
  await expect(page.getByRole('button', {name:'Estampado',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('reset confirmation preserves a draft on cancel and clears its players and artwork on confirmation', async ({ page }) => {
  await openEditor(page);
  await addImage(page, 'crest', 'Escudo temporal');
  await waitForSavedArtwork(page, 1);
  const reset = page.getByRole('button', { name: 'Borrar borrador y empezar de nuevo' });
  await reset.click();
  await expect(page.getByRole('button', { name: 'Conservar mi borrador' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(reset).toBeFocused();
  await expect(page.locator('[data-studio-artwork] [data-layer-kind="image"]')).toHaveCount(1);
  await reset.click();
  await page.getByRole('button', { name: 'Sí, borrar borrador' }).click();
  await expect(page.locator('#cfg-quantity')).toHaveValue('12');
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).players.every((player: { name: string }) => !player.name), ORDER_STORAGE_KEY)).toBe(true);
  await expect.poll(() => page.evaluate(() => new Promise<boolean>(resolve => {
    const request = indexedDB.open('tony-team-artwork-v1', 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('artwork', 'readonly');
      const read = transaction.objectStore('artwork').get('current');
      read.onsuccess = () => resolve(Object.keys(read.result || {}).length === 0);
      transaction.oncomplete = () => db.close();
    };
    request.onerror = () => resolve(false);
  }))).toBe(true);
  await page.reload();
  await page.getByRole('button', { name: 'Crear lista de jugadores' }).click();
  await expect(page.locator('#player-0-name')).toHaveValue('');
  await expect(page.locator('#cfg-team')).toHaveValue('');
});

