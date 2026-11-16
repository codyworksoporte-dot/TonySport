import {expect, test} from '@playwright/test';
import {expectNoOverflow, mockPedidoApi} from './pedido/helpers';

test('modo ligero no descarga el modelo, alta lo carga y la preferencia persiste', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await mockPedidoApi(page);
  const models: string[] = [], errors: string[] = [];
  page.on('request',request=>{if(request.url().endsWith('.glb')) models.push(request.url());});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/configurador');
  await expect(page.getByRole('button',{name:/Gama baja/})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.advisor-stage')).toHaveCount(0);
  await page.getByRole('button',{name:/CREAR MI PEDIDO/}).click();
  await expect(page.getByRole('heading',{name:'Escoge tu producto',exact:true})).toBeVisible();
  expect(models).toEqual([]);
  await page.getByRole('button',{name:/Gama alta/}).click();
  await expect(page.locator('.advisor-stage')).toHaveAttribute('data-state','ready',{timeout:30000});
  await expect(page.getByRole('img',{name:/Asesora Tony en tres dimensiones/})).toBeVisible();
  await expect(page.getByRole('button',{name:'Activar voz',exact:true})).toHaveAttribute('aria-pressed','false');
  expect(models.length).toBeGreaterThan(0);
  await expectNoOverflow(page,390);
  await page.screenshot({path:'output/advisor-mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  await expectNoOverflow(page,1440);
  await page.screenshot({path:'output/advisor-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Usar versión ligera',exact:true}).click();
  await expect(page.locator('.advisor-stage')).toHaveCount(0);
  const loaded = models.length;
  await page.reload();
  await expect(page.getByRole('button',{name:/Gama baja/})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.advisor-stage')).toHaveCount(0);
  expect(models).toHaveLength(loaded);
  expect(errors).toEqual([]);
});

test('un modelo que falla permite seguir y regresar a la versión ligera', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await mockPedidoApi(page);
  await page.route('**/tony-advisor.glb',route=>route.abort());
  await page.goto('/configurador');
  await page.getByRole('button',{name:/Gama alta/}).click();
  await expect(page.locator('.advisor-stage')).toHaveAttribute('data-state','error');
  await page.getByRole('button',{name:/CREAR MI PEDIDO/}).click();
  await expect(page.getByRole('heading',{name:'Escoge tu producto',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Usar versión ligera',exact:true}).click();
  await expect(page.locator('.advisor-text-guide')).toBeVisible();
});
