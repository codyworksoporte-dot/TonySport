import {expect, test} from '@playwright/test';

test('los seis anuncios abren con Black Friday, pedidos y tiendas y se cierran una vez por sesión', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/');
  const dialog = page.getByRole('dialog', {name: 'Anuncios de Tony'});
  await expect(dialog).toBeVisible();
  const destinations: Record<string,string> = {
    'black-friday.webp':'/promociones#black-friday',
    'crea-tu-pedido.webp':'/configurador',
    'tiendas-nacional.webp':'/tiendas',
    'personalizados.webp':'/configurador',
    'portero.webp':'https://www.tonysportselsalvador.com/producto/26184/',
    'premios.webp':'/colecciones/premios-app',
  };
  const posters = [];
  for (let i = 0; i < 6; i++) {
    const link = dialog.getByRole('link');
    await expect(link.locator('img')).toHaveJSProperty('complete', true);
    expect(await link.locator('img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const poster = await link.locator('img').evaluate(image => (image as HTMLImageElement).src.split('/').pop()!);
    posters.push(poster);
    expect(await link.getAttribute('href')).toBe(destinations[poster]);
    if (i === 1) await page.keyboard.press('Escape');
    else await dialog.getByRole('button', {name: 'Cerrar anuncio'}).click();
  }
  expect(posters.slice(0,3)).toEqual(['black-friday.webp', 'crea-tu-pedido.webp', 'tiendas-nacional.webp']);
  expect(posters.slice(3).sort()).toEqual(['personalizados.webp', 'portero.webp', 'premios.webp']);
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#crear-mi-pedido')).toBeFocused();
  await page.reload();
  await expect(page.locator('#crear-mi-pedido')).toBeVisible();
  await expect(dialog).toHaveCount(0);
});

test('tocar el cartel abre la promoción y al volver aparece el siguiente', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  const dialog = page.getByRole('dialog', {name:'Anuncios de Tony'});
  await dialog.getByRole('link', {name:/Black Friday/}).click();
  await expect(page).toHaveURL(/promociones\/?#black-friday$/);
  await expect(page.locator('#black-friday')).toBeVisible();
  await page.goBack();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('link', {name:/Creá tu pedido/}).click();
  await expect(page).toHaveURL(/\/configurador\/?$/);
  await page.goBack();
  await dialog.getByRole('link', {name:/14 tiendas a nivel nacional/}).click();
  await expect(page).toHaveURL(/\/tiendas\/?$/);
});

test('las franjas rotan cada siete segundos y se pueden recorrer con teclado', async ({page}) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.addInitScript(() => {
    sessionStorage.setItem('tony:inicio:carteles:v3','[]');
    sessionStorage.setItem('tony:intro:wordmark:v1','seen');
  });
  await page.goto('/');
  const strip = page.getByRole('region',{name:'Promociones destacadas'});
  await strip.scrollIntoViewIfNeeded();
  const link = strip.getByRole('link');
  await expect(link).toHaveAccessibleName(/Black Friday/);
  await expect(link).toHaveAccessibleName(/portero/i,{timeout:10500});
  await link.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(link).toHaveAccessibleName(/Black Friday/);
  await expect(strip.getByRole('button',{name:/pausa|condiciones/i})).toHaveCount(0);
});
