import {expect, test, type Locator, type Page} from '@playwright/test';
import {completePedido, DEMO_IMAGE} from './pedido/pricing.fixtures';
import {mockPedidoApi, openSeededEditor, seedPedido} from './pedido/helpers';

test.beforeEach(async ({page}) => {await page.emulateMedia({reducedMotion: 'reduce'}); await seedPedido(page, completePedido());});

/** A crest photographed crooked (16°) on white paper, as a JPEG. */
async function crookedCrest(page: Page) {
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 560;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, 640, 560);
    context.translate(320, 280); context.rotate(16 * Math.PI / 180);
    context.fillStyle = '#0b2d6b'; context.fillRect(-150, -180, 300, 360);
    context.fillStyle = '#ffd23f'; context.fillRect(-150, -40, 300, 26);
    context.fillStyle = '#ffffff'; context.font = 'bold 90px Arial'; context.textAlign = 'center'; context.fillText('CD', 0, 110);
    return canvas.toDataURL('image/jpeg', .85);
  });
  return Buffer.from(data.split(',')[1], 'base64');
}

/** Alpha of the top-left pixel of the layer artwork: 0 once the background is gone. */
const cornerAlpha = (layer: Locator) => layer.locator('img').evaluate(async node => {
  const img = node as HTMLImageElement; await img.decode();
  const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  const context = canvas.getContext('2d')!; context.drawImage(img, 0, 0);
  return context.getImageData(1, 1, 1, 1).data[3];
});
const geometry = (layer: Locator) => layer.evaluate(node => {
  const style = (node as HTMLElement).style;
  return {x: parseFloat(style.left), y: parseFloat(style.top), ratio: parseFloat(style.width) * 800 / (parseFloat(style.height) * 1000)};
});

test('un escudo torcido sobre papel queda sin fondo, recto y centrado en el pecho; Deshacer recupera el original', async ({page}) => {
  await mockPedidoApi(page); await openSeededEditor(page);
  await page.getByRole('button', {name: /Subir escudo/}).click();
  await page.getByLabel('Subir elemento personalizado').setInputFiles({name: 'escudo-torcido.jpg', mimeType: 'image/jpeg', buffer: await crookedCrest(page)});
  await expect(page.getByRole('status').filter({hasText: /ajustado automáticamente: quitamos el fondo, lo enderezamos 1[56]°/})).toBeVisible();
  const layer = page.getByRole('button', {name: /^Mover Escudo/});
  expect(await cornerAlpha(layer)).toBe(0);
  const fitted = await geometry(layer);
  expect([fitted.x, fitted.y]).toEqual([58, 25]);
  // The straightened crest is taller than wide (300×360), unlike the 640×560 photo.
  expect(fitted.ratio).toBeGreaterThan(.72); expect(fitted.ratio).toBeLessThan(.95);
  await page.getByRole('button', {name: /Deshacer/}).click();
  await expect.poll(() => cornerAlpha(layer)).toBe(255);
  expect((await geometry(layer)).ratio).toBeGreaterThan(1.05);
});

test('con el ajuste apagado el logo entra tal cual y «Ajustar automáticamente» lo corrige después', async ({page}) => {
  await mockPedidoApi(page); await openSeededEditor(page);
  const toggle = page.getByRole('checkbox', {name: /Ajuste automático/});
  await expect(toggle).toBeChecked(); await toggle.uncheck();
  await page.getByRole('button', {name: /Subir escudo/}).click();
  await page.getByLabel('Subir elemento personalizado').setInputFiles({name: 'escudo-torcido.jpg', mimeType: 'image/jpeg', buffer: await crookedCrest(page)});
  const layer = page.getByRole('button', {name: /^Mover Escudo/});
  await expect(page.getByRole('status').filter({hasText: 'Escudo colocado en el frente'})).toBeVisible();
  expect(await cornerAlpha(layer)).toBe(255);
  await page.getByRole('button', {name: 'Ajustar automáticamente', exact: true}).click();
  await expect(page.getByRole('status').filter({hasText: /Escudo ajustado: quitamos el fondo/})).toBeVisible();
  await expect.poll(() => cornerAlpha(layer)).toBe(0);
  expect((await geometry(layer)).ratio).toBeLessThan(.95);
});

test('el mockup con IA envía imágenes comprimidas y la configuración obligatoria, sin datos del comprador', async ({page}) => {
  test.skip(process.env.TONY_MOCKUP_TEST === 'true', 'Este caso cubre el servicio de pedidos con sesión.');
  const bodies: Buffer[] = [];
  await mockPedidoApi(page);
  await page.route('**/pedido-api/generate.php', async route => {bodies.push(route.request().postDataBuffer() ?? Buffer.alloc(0)); await route.fallback();});
  await openSeededEditor(page);
  await page.locator('.pedido-image-tools summary').click();
  const button = page.getByRole('button', {name: 'Generar mockup con IA', exact: true});
  test.skip(!(await button.isEnabled()), 'Este servidor de desarrollo se inició sin NEXT_PUBLIC_TONY_API_BASE.');
  await button.click();
  await expect.poll(() => bodies.length).toBe(2);
  for (const body of bodies) {
    expect(body.length).toBeLessThan(4 * 1024 * 1024);
    const text = body.toString('utf8');
    expect(text).toMatch(/name="image"; filename="design\.(webp|jpg|png)"/);
    for (const rule of ['CONFIGURACIÓN OBLIGATORIA DEL PEDIDO', '- Molde: Estándar', '- Cuello: V (cuello en V).', '- Manga: Corta', '- Tela: Slim Fit.', '- Corte: Hombre.', 'catálogo Tony TONY-001', '"catalogCode":"TONY-001"']) expect(text).toContain(rule);
    for (const privateData of ['EQUIPO DE PRUEBA', 'JUGADOR 1']) expect(text).not.toContain(privateData);
  }
});

test.describe('generador oficial independiente', () => {
  test.skip(process.env.TONY_MOCKUP_TEST !== 'true', 'Ejecutar con TONY_MOCKUP_TEST=true para probar sin API de pedidos.');

  test('prepara las dos vistas sin iniciar sesión, compartir credenciales ni llamar a pagos', async ({page, context}) => {
    const pedido = await mockPedidoApi(page);
    const paths: string[] = [], sides: string[] = [];
    await context.addCookies([{name: 'sesion_de_prueba', value: 'solo-prueba', domain: '127.0.0.1', path: '/mockup-prueba'}]);
    await page.addInitScript(() => sessionStorage.setItem('tony:pedido:session:v279', 'a'.repeat(64)));
    await page.route('http://127.0.0.1:8791/mockup-prueba/**', async route => {
      const request = route.request();
      paths.push(new URL(request.url()).pathname);
      const headers = await request.allHeaders();
      expect(headers).not.toHaveProperty('authorization');
      expect(headers).not.toHaveProperty('cookie');
      const bytes = request.postDataBuffer();
      expect(request.method()).toBe('POST');
      expect(bytes).toBeTruthy();
      const form = await new Response(new Uint8Array(bytes!), {headers: {'Content-Type': headers['content-type']}}).formData();
      sides.push(String(form.get('side')));
      expect(form.get('image')).toBeInstanceOf(File);
      expect(String(form.get('placementRules'))).toContain('Cuello: V');
      expect(bytes!.toString('utf8')).not.toMatch(/EQUIPO DE PRUEBA|JUGADOR 1/);
      await route.fulfill({json: {success: true, image: DEMO_IMAGE, mime: 'image/png'}});
    });

    await openSeededEditor(page);
    await page.locator('.pedido-image-tools summary').click();
    const generate = page.getByRole('button', {name: 'Generar mockup con IA', exact: true});
    await expect(generate).toBeEnabled();
    expect(paths).toEqual([]);
    await generate.click();
    await expect(page.getByRole('status').filter({hasText: 'Mockup listo.'})).toBeVisible();
    expect(sides.sort()).toEqual(['back', 'front']);
    expect(paths).toEqual(['/mockup-prueba/generate.php', '/mockup-prueba/generate.php']);
    expect(pedido.calls).toEqual([]);
    await page.goto('/cuenta');
    await expect(page.getByText(/El acceso con correo estará disponible/)).toBeVisible();
  });
});
