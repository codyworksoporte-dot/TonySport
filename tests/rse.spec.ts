import {expect, test} from '@playwright/test';
import official from '../data/official-collections.json';
import store from '../data/tienda.json';

test('el acceso anterior de RSE abre la galería institucional y mantiene las fotos fuera de la tienda', async ({page}) => {
  expect(official.products.some(product => product.categories.includes('rse-tony'))).toBe(false);
  expect(store.pricesInCents.some(([id]) => id === 36922)).toBe(false);

  await page.setViewportSize({width:390, height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/colecciones?categoria=rse-tony');
  await expect(page).toHaveURL(/\/rse\/?$/);
  const gallery = page.locator('#galeria');
  await expect(gallery.getByText('102 fotos')).toBeVisible();
  await expect(gallery.locator('li')).toHaveCount(12);
  await gallery.getByRole('button', {name:'Ver más fotos'}).click();
  await expect(gallery.locator('li')).toHaveCount(24);
  await gallery.getByRole('button', {name:'Boxeo', exact:true}).click();
  await expect(gallery.locator('li')).toHaveCount(9);

  const first = gallery.locator('li a').first();
  await first.click();
  const viewer = page.getByRole('dialog', {name:'Fotografía ampliada'});
  await expect(viewer.getByText('1 de 9')).toBeVisible();
  await viewer.getByRole('button', {name:'Foto siguiente'}).click();
  await expect(viewer.getByText('2 de 9')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(viewer).not.toBeVisible();
  await expect(first).toBeFocused();
});
