import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const draftKey = 'tony-team-order-v2';
const legacyKey = 'tony-uniform-draft-v1';
const roster = [
  { name: 'DIEGO', size: 'S', number: '01' },
  { name: 'GÓMEZ', size: 'M', number: '7' },
  { name: 'MARTÍNEZ', size: 'L', number: '12' },
  { name: 'SOFÍA', size: 'XL', number: '23' },
  { name: 'RODRÍGUEZ', size: '2XL', number: '88' },
  { name: 'ANDREA', size: '16', number: '99' },
];

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

async function openRoster(page: Page, quantity = 6) {
  await expect(page.getByRole('button', { name: 'Crear lista de jugadores' })).toBeEnabled();
  await page.locator('#cfg-quantity').fill(String(quantity));
  await page.getByRole('button', { name: 'Crear lista de jugadores' }).click();
  await expect(page.locator('.roster-list > li')).toHaveCount(quantity);
}

async function fillRoster(page: Page, team = 'Deportivo Oriente') {
  await page.locator('#cfg-team').fill(team);
  for (const [index, player] of roster.entries()) {
    await page.locator(`#player-${index}-name`).fill(player.name);
    await page.locator(`#player-${index}-size`).selectOption(player.size);
    await page.locator(`#player-${index}-number`).fill(player.number);
  }
}

async function openStudio(page: Page) {
  await page.getByRole('button', { name: 'Ir al editor de diseño' }).click();
  await expect(page.getByRole('region', { name: 'Editor de diseño del equipo' })).toBeVisible();
}

async function reviewOrder(page: Page) {
  await page.getByRole('button', { name: 'Revisar mi pedido' }).click();
  await expect(page.getByRole('table', { name: 'Nómina completa del equipo' })).toBeVisible();
}

async function expectNoOverflow(page: Page, width: number) {
  await expect.poll(() => page.evaluate(() => ({ document: document.documentElement.scrollWidth, body: document.body.scrollWidth })))
    .toEqual({ document: width, body: width });
}

test('quantity comes first and every missing player field blocks progress with focused errors', async ({ page }) => {
  await page.goto('/configurador');
  await expect(page.locator('#cfg-team')).toHaveCount(0);
  const steps = page.getByRole('navigation', { name: 'Pasos del pedido' });
  await expect(steps.getByRole('button', { name: /Diseño/ })).toBeDisabled();
  await page.locator('#cfg-quantity').fill('5');
  await page.getByRole('button', { name: 'Crear lista de jugadores' }).click();
  await expect(page.locator('#cfg-quantity')).toBeFocused();
  await expect(page.locator('#cfg-quantity')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#order-quantity-error')).toContainText('6 a 999');
  await expect(page.locator('.roster-list')).toHaveCount(0);

  await openRoster(page);
  const next = page.getByRole('button', { name: 'Ir al editor de diseño' });
  await next.click();
  await expect(page.locator('#cfg-team')).toBeFocused();
  await page.locator('#cfg-team').fill('Atlético San Miguel');
  await next.click();
  await expect(page.locator('#player-0-name')).toBeFocused();
  await expect(page.locator('#player-0-name-error')).toBeVisible();
  await page.locator('#player-0-name').fill('ANA');
  await next.click();
  await expect(page.locator('#player-0-size')).toBeFocused();
  await expect(page.locator('#player-0-size-error')).toBeVisible();
  await page.locator('#player-0-size').selectOption('M');
  await next.click();
  await expect(page.locator('#player-0-number')).toBeFocused();
  await expect(page.locator('#player-0-number-error')).toBeVisible();
  await page.locator('#player-0-number').fill('10');
  await next.click();
  await expect(page.locator('#player-1-name')).toBeFocused();
  await expect(page).toHaveURL(/#paso-2$/);
  await expect(page.getByRole('link', { name: 'Abrir WhatsApp para cotizar' })).toHaveCount(0);
});

test('six real players reach the editor, summary, WhatsApp draft and downloadable roster intact', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/configurador');
  await openRoster(page);
  await fillRoster(page);
  await page.locator('#player-5-role').selectOption('goalkeeper');
  await openStudio(page);
  await expect(page.getByRole('button', { name: 'Esencial Color limpio' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Franja Movimiento diagonal' }).click();
  await page.locator('#tds-player').selectOption({ label: '#99 · ANDREA · 16' });
  await expect(page.getByRole('button', { name: 'Espalda', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#cfg-notes').fill('Portera en naranja. Confirmar el escudo con el equipo.');
  await reviewOrder(page);
  await expect(page.locator('.cfg-summary-heading h3')).toHaveText('Deportivo Oriente');
  const rows = page.locator('.order-review-roster tbody tr');
  await expect(rows).toHaveCount(6);
  for (const [index, player] of roster.entries()) {
    await expect(rows.nth(index).locator('th')).toHaveText(player.name);
    await expect(rows.nth(index).locator('td').nth(1)).toHaveText(player.size);
    await expect(rows.nth(index).locator('td').nth(2)).toHaveText(player.number);
  }
  await expect(rows.last()).toContainText('Portero');
  const quote = page.getByRole('link', { name: 'Abrir WhatsApp para cotizar' });
  const url = new URL((await quote.getAttribute('href'))!);
  expect(url.hostname).toBe('wa.me');
  expect(url.pathname).toBe('/50370155571');
  const message = url.searchParams.get('text')!;
  for (const player of roster) expect(message).toContain(`${player.name} | Talla ${player.size} | Dorsal ${player.number}`);
  for (const detail of ['Cantidad: 6', 'Deportivo Oriente', 'Diseño: Franja', 'Portera en naranja.', 'Portero']) expect(message).toContain(detail);
  await expect(quote).toHaveAttribute('target', '_blank');
  await expect(page.getByText('Se abrirá un mensaje listo para revisar. Tú decides cuándo enviarlo.')).toBeVisible();
  // Inspect the prepared link without opening WhatsApp or sending anything.
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar lista para Excel' }).click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toBe('tony-lista-jugadores.csv');
  const csv = await readFile((await file.path())!, 'utf8');
  for (const player of roster) expect(csv).toContain(`"${player.name}","${player.size}","${player.number}"`);
  expect(csv.trim().split(/\r?\n/)).toHaveLength(7);
  expect(errors).toEqual([]);
});

test('reducing twelve uniforms to six retains hidden records and restores them when quantity grows', async ({ page }) => {
  await page.goto('/configurador');
  await openRoster(page, 12);
  await page.locator('#cfg-team').fill('Club Los Pinos');
  for (const index of [0, 11]) {
    await page.locator(`#player-${index}-name`).fill(index === 0 ? 'PRIMER JUGADOR' : 'ÚLTIMO JUGADOR');
    await page.locator(`#player-${index}-size`).selectOption(index === 0 ? 'S' : '4XL');
    await page.locator(`#player-${index}-number`).fill(String(index + 1));
  }
  await page.getByRole('button', { name: 'Cambiar cantidad' }).click();
  await openRoster(page, 6);
  await expect(page.locator('#player-0-name')).toHaveValue('PRIMER JUGADOR');
  await expect(page.locator('#player-11-name')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.cfg-draft-status')).toHaveText('Borrador recuperado');
  await expect(page.locator('.roster-list > li')).toHaveCount(6);
  await page.getByRole('button', { name: 'Cambiar cantidad' }).click();
  await openRoster(page, 12);
  await expect(page.locator('#cfg-team')).toHaveValue('Club Los Pinos');
  await expect(page.locator('#player-11-name')).toHaveValue('ÚLTIMO JUGADOR');
  await expect(page.locator('#player-11-size')).toHaveValue('4XL');
  await expect(page.locator('#player-11-number')).toHaveValue('12');
});

test('saved design survives reload and browser history cannot bypass an incomplete roster', async ({ page }) => {
  await page.goto('/configurador#paso-4');
  await expect(page).toHaveURL(/#paso-2$/);
  await expect(page.locator('.roster-list > li')).toHaveCount(12);
  await page.getByRole('button', { name: 'Cambiar cantidad' }).click();
  await openRoster(page);
  await fillRoster(page);
  await openStudio(page);
  await page.getByRole('button', { name: 'Franja Movimiento diagonal' }).click();
  await page.locator('#cfg-notes').fill('Conservar estas indicaciones al regresar.');
  await page.reload();
  await expect(page.locator('.cfg-draft-status')).toHaveText('Borrador recuperado');
  await expect(page.locator('#cfg-notes')).toHaveValue('Conservar estas indicaciones al regresar.');
  await expect(page.getByRole('button', { name: 'Franja Movimiento diagonal' })).toHaveAttribute('aria-pressed', 'true');
  await page.goBack();
  await expect(page.locator('#player-0-name')).toHaveValue('DIEGO');
  await page.locator('#player-0-name').fill('');
  await page.goForward();
  await expect(page).toHaveURL(/#paso-2$/);
  await expect(page.locator('#player-0-name')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Revisar mi pedido' })).toHaveCount(0);
  await page.locator('#player-0-name').fill('DIEGO RENOVADO');
  await openStudio(page);
  await reviewOrder(page);
  await expect(page.locator('.order-review-roster tbody tr').first()).toContainText('DIEGO RENOVADO');
});

test('broken JSON and invalid draft shapes recover to an editable clean order', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/configurador');
  await expect(page.getByRole('button', { name: 'Crear lista de jugadores' })).toBeEnabled();
  for (const saved of ['{broken', JSON.stringify({ version: 2, quantity: '6', players: 'not-a-list', design: {} })]) {
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: draftKey, value: saved });
    await page.reload();
    await expect(page.locator('#cfg-quantity')).toHaveValue('12');
    await expect(page.getByRole('button', { name: 'Crear lista de jugadores' })).toBeEnabled();
    await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).design.variant, draftKey)).toBe('clean');
  }
  await openRoster(page);
  await expect(page.locator('#cfg-team')).toHaveValue('');
  await expect(page.locator('#player-0-name')).toHaveValue('');
  expect(errors).toEqual([]);
});

test('blocked local storage is explained and does not stop an accurate quote', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', {
    get() { throw new Error('Storage disabled by the test browser'); },
  }));
  await page.goto('/configurador');
  await expect(page.locator('.cfg-draft-status')).toHaveText('Sin guardado en este dispositivo');
  await openRoster(page);
  await fillRoster(page, 'Equipo sin guardado');
  await openStudio(page);
  await reviewOrder(page);
  await expect(page.locator('.cfg-summary-heading h3')).toHaveText('Equipo sin guardado');
  const url = new URL((await page.getByRole('link', { name: 'Abrir WhatsApp para cotizar' }).getAttribute('href'))!);
  expect(url.searchParams.get('text')).toContain('ANDREA | Talla 16 | Dorsal 99');
  expect(errors).toEqual([]);
});

test('legacy and home sample dorsals never become actual player records', async ({ page }) => {
  await page.addInitScript(({ key }) => localStorage.setItem(key, JSON.stringify({
    team: 'Club anterior', quantity: '6', number: '23', color: '#E63946', style: 'stripe', notes: 'Nota conservada',
  })), { key: legacyKey });
  await page.goto('/configurador?name=F%C3%A9nix%20FC&number=77&color=%232264E8&utm_source=home#paso-3');
  await expect(page).toHaveURL(/#paso-2$/);
  await expect(page.locator('#cfg-team')).toHaveValue('Fénix FC');
  await expect(page.locator('.roster-list > li')).toHaveCount(6);
  for (let index = 0; index < 6; index++) {
    await expect(page.locator(`#player-${index}-name`)).toHaveValue('');
    await expect(page.locator(`#player-${index}-size`)).toHaveValue('');
    await expect(page.locator(`#player-${index}-number`)).toHaveValue('');
  }
  const url = new URL(page.url());
  expect(url.searchParams.get('utm_source')).toBe('home');
  for (const parameter of ['name', 'number', 'color']) expect(url.searchParams.has(parameter)).toBe(false);
  await page.locator('#player-0-number').fill('8');
  await page.locator('#cfg-team').fill('Fénix Renovado');
  await page.reload();
  await expect(page.locator('#player-0-number')).toHaveValue('8');
  await expect(page.locator('#cfg-team')).toHaveValue('Fénix Renovado');
});

for (const width of [320, 390]) {
  test(`all four order steps fit a ${width}px phone`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/configurador');
    await expect(page.getByRole('button', { name: 'Crear lista de jugadores' })).toBeEnabled();
    await expectNoOverflow(page, width);
    await openRoster(page);
    await fillRoster(page);
    await expectNoOverflow(page, width);
    await openStudio(page);
    await expectNoOverflow(page, width);
    await page.getByRole('button', { name: 'Prenda', exact: true }).click();
    await expectNoOverflow(page, width);
    await reviewOrder(page);
    await expect(page.locator('.order-review-roster tbody tr')).toHaveCount(6);
    await expectNoOverflow(page, width);
    await expect(page.getByRole('link', { name: 'Abrir WhatsApp para cotizar' })).toBeVisible();
  });
}
