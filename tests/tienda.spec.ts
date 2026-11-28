import {test, expect} from '@playwright/test';

test('los enlaces históricos de RSE abren la galería institucional', async ({page}) => {
  for (const path of ['/tienda?categoria=rse-tony', '/colecciones?categoria=rse-tony']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/rse\/?$/);
    await expect(page.getByRole('heading', {level: 1})).toContainText(/responsabilidad/i);
  }
});

test('tienda combina la categoría y ambos límites, conserva el enlace y limpia la selección', async ({page}) => {
  await page.setViewportSize({width:1280, height:800});
  await page.goto('/tienda?categoria=implementos');
  const results = page.getByRole('region', {name:'Resultados de la tienda'});
  await expect(page.getByLabel('Categorías', {exact:true})).toHaveValue('implementos');
  await page.getByRole('spinbutton', {name:'Precio mínimo'}).fill('70');
  await page.getByRole('spinbutton', {name:'Precio máximo'}).fill('80');
  await page.getByRole('button', {name:'Filtrar', exact:true}).click();
  await expect(results.getByRole('link')).toHaveCount(1);
  await expect(results.getByRole('link')).toContainText('Malla de fútbol sala');
  await expect(results.getByRole('link')).toContainText('$74.99');
  await page.reload();
  await expect(results.getByRole('link')).toHaveCount(1);
  await page.getByRole('button', {name:'Limpiar filtros'}).click();
  await expect(results.getByRole('link')).toHaveCount(12);
  await page.getByRole('button', {name:'Ver más productos'}).click();
  await expect(results.getByRole('link')).toHaveCount(24);
  await expect(page.getByRole('complementary', {name:'Últimos productos añadidos'}).getByRole('link')).toHaveCount(5);
});

test('la búsqueda móvil devuelve la ficha correcta y retrae los controles', async ({page}) => {
  await page.setViewportSize({width:390, height:844});
  await page.goto('/tienda');
  const toggle = page.getByRole('button', {name:'Buscar y filtrar'});
  await toggle.click();
  await page.getByRole('searchbox', {name:'Buscar', exact:true}).fill('aguja');
  await page.getByRole('button', {name:'Buscar', exact:true}).click();
  const link = page.getByRole('region', {name:'Resultados de la tienda'}).getByRole('link');
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute('href', 'https://www.tonysportselsalvador.com/producto/aguja-para-inflar-balones-unidad/');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
