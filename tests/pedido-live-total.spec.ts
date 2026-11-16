import {expect, test, type Page} from '@playwright/test';
import {continuePedido, mockPedidoApi, seedPedido} from './pedido/helpers';
import {completePedido} from './pedido/pricing.fixtures';

test.beforeEach(async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>localStorage.setItem('tony:pedido:quality:v1','low'));
  await mockPedidoApi(page);
});

const total = (page: Page) => page.locator('.pedido-aside .pedido-price-total dd');
async function choose(page: Page, group: string, option: string) {
  await page.getByRole('group',{name:group,exact:true}).getByRole('button',{name:new RegExp(`^${option}\\b`)}).click();
}
async function startUniform(page: Page) {
  await page.getByRole('button',{name:/CREAR MI PEDIDO/}).click();
  await page.getByRole('button',{name:/Uniformes Full Sublimados/}).click();
  await continuePedido(page);
  await page.getByRole('button',{name:/Uniforme para hombre/}).click();
  await continuePedido(page);
}

test('los recargos se suman inmediatamente para las seis prendas antes de elegir tallas', async ({page}) => {
  await page.goto('/configurador');
  await startUniform(page);
  await expect(page.locator('.pedido-aside .pedido-price-total dt')).toHaveText('Total estimado');
  // Six uniforms (77.94) plus the current own-design service (5.00).
  await expect(total(page)).toHaveText('$82.94');
  await choose(page,'Molde','Raglan'); // +6 × 1.50
  await expect(total(page)).toHaveText('$91.94');
  await choose(page,'Molde','Estándar');
  await expect(total(page)).toHaveText('$82.94');
  await choose(page,'Molde','Raglan');
  await continuePedido(page);
  await choose(page,'Tela','Dryfit'); // +6 × 1.75
  await expect(total(page)).toHaveText('$102.44');
  await choose(page,'Tela','Slim Pro'); // Replace Dryfit; do not accumulate both fees.
  await expect(total(page)).toHaveText('$96.44');
  await choose(page,'Tela','Dryfit');
  await page.getByRole('button',{name:/Anterior/}).click();
  await choose(page,'Molde','Estándar');
  await expect(total(page)).toHaveText('$93.44');
  await choose(page,'Molde','Raglan');
  await continuePedido(page);
  await continuePedido(page);
  await choose(page,'Cuello','Polo'); // +6 × 1.50
  await expect(total(page)).toHaveText('$111.44');
  await continuePedido(page);
  await choose(page,'Manga','Larga'); // +6 × 3.00
  await expect(total(page)).toHaveText('$129.44');
  await continuePedido(page);
  await page.getByRole('button',{name:/^Marca Tony/}).click(); // −6 × 0.50
  await expect(total(page)).toHaveText('$126.44');
  await continuePedido(page);
  await choose(page,'Acabado de la marca','Relieve 3D'); // +6 × 1.75
  await expect(total(page)).toHaveText('$136.94');
  await continuePedido(page);
  await choose(page,'Acabado del escudo','Relieve 3D');
  await expect(total(page)).toHaveText('$147.44');
  await expect(page.locator('.pedido-aside .pedido-prices')).toContainText('$73.72');
});

test('un pedido nuevo y una recarga no seleccionan las respuestas del borrador anterior', async ({page}) => {
  const saved=completePedido();
  saved.config.mold='Raglan'; saved.config.fabric='Dryfit';
  await seedPedido(page,saved);
  await page.goto('/configurador');
  await page.getByRole('button',{name:/CREAR MI PEDIDO/}).click();
  await expect(page.getByRole('button',{name:/Uniformes Full Sublimados/})).toHaveAttribute('aria-pressed','false');
  await expect(page.getByRole('button',{name:/Camisas Full Sublimadas/})).toHaveAttribute('aria-pressed','false');
  await page.getByRole('button',{name:/Uniformes Full Sublimados/}).click();
  await continuePedido(page);
  for(const label of [/Uniforme para hombre/,/Uniforme para mujer/]) await expect(page.getByRole('button',{name:label})).toHaveAttribute('aria-pressed','false');
  await page.getByRole('button',{name:/Uniforme para mujer/}).click();
  await continuePedido(page);
  for(const option of await page.getByRole('group',{name:'Molde',exact:true}).locator('.pedido-choice').all()) await expect(option).toHaveAttribute('aria-pressed','false');
  await choose(page,'Molde','Raglan');
  await continuePedido(page);
  for(const option of await page.getByRole('group',{name:'Tela',exact:true}).locator('.pedido-choice').all()) await expect(option).toHaveAttribute('aria-pressed','false');
  await choose(page,'Tela','Dryfit');
  await page.reload();
  await page.getByRole('button',{name:/CREAR MI PEDIDO/}).click();
  await expect(page.getByRole('button',{name:/Uniformes Full Sublimados/})).toHaveAttribute('aria-pressed','false');
  await expect(page.getByRole('button',{name:/Camisas Full Sublimadas/})).toHaveAttribute('aria-pressed','false');
  await continuePedido(page);
  await expect(page.getByRole('alert').first()).toContainText('Elige Uniformes o Camisas');
});

test('el borrador se recupera solamente al abrirlo explícitamente', async ({page}) => {
  const saved=completePedido(); saved.config.mold='Raglan';
  await seedPedido(page,saved);
  await page.goto('/configurador');
  const resume=page.getByRole('link',{name:'Retomar último borrador ↗',exact:true});
  await expect(resume).toBeVisible();
  // A blank visit must not overwrite the old draft when autosave would normally run.
  await page.waitForTimeout(900);
  await resume.click();
  await expect(page.getByText('Recuperamos tu diseño. Revisa los pasos para continuar.')).toBeVisible();
  await page.getByRole('button',{name:/CREAR MI PEDIDO/}).click();
  await expect(page.getByRole('button',{name:/Uniformes Full Sublimados/})).toHaveAttribute('aria-pressed','true');
  await continuePedido(page);
  await expect(page.getByRole('button',{name:/Uniforme para hombre/})).toHaveAttribute('aria-pressed','true');
  await continuePedido(page);
  await expect(page.getByRole('button',{name:/^Raglan/})).toHaveAttribute('aria-pressed','true');
});
