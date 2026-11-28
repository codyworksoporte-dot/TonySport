import {expect, test} from '@playwright/test';

test('los cuatro anuncios se cierran una vez por sesión y conservan su destino', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/');
  const dialog = page.getByRole('dialog', {name: 'Anuncios de Tony'});
  await expect(dialog).toBeVisible();
  const ads = new Set<string>();
  const posters = [];
  for (let i = 0; i < 4; i++) {
    const link = dialog.getByRole('link');
    await expect(link.locator('img')).toHaveJSProperty('complete', true);
    expect(await link.locator('img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    posters.push(await link.locator('img').evaluate(image => (image as HTMLImageElement).src.split('/').pop()));
    const href = await link.getAttribute('href');
    expect(href).toBeTruthy();
    ads.add(href!);
    if (i === 1) await page.keyboard.press('Escape');
    else await dialog.getByRole('button', {name: 'Cerrar anuncio'}).click();
  }
  expect(ads.size).toBe(4);
  expect(posters.sort()).toEqual(['black-friday.webp', 'personalizados.webp', 'portero.webp', 'premios.webp']);
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
  await expect(dialog.getByRole('link')).not.toHaveAccessibleName(/Black Friday/);
});

test('las franjas rotan cada siete segundos y se pueden recorrer con teclado', async ({page}) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.addInitScript(() => {
    sessionStorage.setItem('tony:inicio:carteles:v2','[]');
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
