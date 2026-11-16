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

test('muestra precio por prenda y suma el total solo al confirmar la cantidad', async ({page}) => {
  await page.goto('/configurador');
  await startUniform(page);
  const unit=page.locator('.pedido-aside .pedido-unit-price dd');
  await expect(page.locator('.pedido-aside .pedido-price-total dt')).toHaveText('Total pendiente');
  await expect(total(page)).toHaveText('Elige la cantidad');
  await expect(unit).toHaveText('$12.99');
  await expect(page.locator('.pedido-aside .pedido-prices')).not.toContainText('Anticipo');
  await expect(page.locator('.pedido-aside .pedido-prices')).not.toContainText('Creación del diseño');
  await choose(page,'Molde','Raglan'); // +1.50 per garment, with no assumed quantity.
  await expect(unit).toHaveText('$14.49');
  await choose(page,'Molde','Estándar');
  await expect(unit).toHaveText('$12.99');
  await choose(page,'Molde','Raglan');
  await continuePedido(page);
  await choose(page,'Tela','Dryfit');
  await expect(unit).toHaveText('$16.24');
  await choose(page,'Tela','Slim Pro'); // Replace Dryfit; do not accumulate both fees.
  await expect(unit).toHaveText('$15.24');
  await choose(page,'Tela','Dryfit');
  await page.getByRole('button',{name:/Anterior/}).click();
  await choose(page,'Molde','Estándar');
  await expect(unit).toHaveText('$14.74');
  await choose(page,'Molde','Raglan');
  await continuePedido(page);
  await continuePedido(page);
  await choose(page,'Cuello','Polo');
  await expect(unit).toHaveText('$17.74');
  await continuePedido(page);
  await choose(page,'Manga','Larga');
  await expect(unit).toHaveText('$20.74');
  await continuePedido(page);
  await page.getByRole('button',{name:/^Marca Tony/}).click();
  await expect(unit).toHaveText('$20.24');
  await continuePedido(page);
  await choose(page,'Acabado de la marca','Relieve 3D');
  await expect(unit).toHaveText('$21.99');
  await continuePedido(page);
  await choose(page,'Acabado del escudo','Relieve 3D');
  await expect(unit).toHaveText('$23.74');
  await expect(total(page)).toHaveText('Elige la cantidad');
  await continuePedido(page);
  await page.getByLabel('Nombre de equipo',{exact:true}).fill('EQUIPO DE PRUEBA');
  await continuePedido(page);
  await expect(page.getByRole('heading',{name:'¿Cuántas prendas necesitas?',exact:true})).toBeVisible();
  const quantity=page.getByRole('spinbutton');
  await expect(quantity).toHaveValue('');
  await continuePedido(page);
  await expect(page.getByRole('alert').first()).toContainText('El pedido es de 6 a 99 prendas de campo.');
  await expect(total(page)).toHaveText('Elige la cantidad');
  await quantity.fill('6');
  await continuePedido(page);
  await expect(page.getByRole('heading',{name:'Jugador 1 de 6',exact:true})).toBeVisible();
  await expect(total(page)).toHaveText('$142.44');
  await expect(page.locator('.pedido-aside .pedido-prices')).toContainText('$71.22');
  await expect(page.locator('.pedido-aside .pedido-prices')).not.toContainText('Creación del diseño');
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
