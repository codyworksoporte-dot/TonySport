import {test, expect} from '@playwright/test';
import {albumNotes, orderAlbum} from '../lib/pedido/album-design';
import {calculatePedido} from '../lib/pedido/pricing';
import {readPedido, validateStep} from '../lib/pedido/order';
import {completePedido} from './pedido/pricing.fixtures';
import {continuePedido, seedPedido} from './pedido/helpers';
import mundial from '../public/assets/colecciones/37167.json';

const ref = {albumId:37167, number:2, name:'DISEÑOS DEL MUNDIAL 2026', image:mundial.images[1].src};
function selectedOrder() {
  const order = completePedido();
  order.notes = albumNotes(ref, 'Cuello en verde.');
  order.design = {...order.design, catalogCode:'', front:null, back:null, finalFront:null, finalBack:null, approved:false};
  return order;
}
test('el álbum se conserva en el borrador y el precio del catálogo, con aprobación y tallas obligatorias', () => {
  const order = selectedOrder();
  expect(orderAlbum(readPedido(order)!)).toEqual(ref);
  expect(calculatePedido(order).creationDesignCents).toBe(0);
  expect(validateStep(order,'design')).toEqual({});
  expect(validateStep(order,'approval')['design.approved']).toBeTruthy();
  order.design.approved = true;
  expect(validateStep(order,'summary')).toEqual({});
  order.players[0].size = '';
  expect(validateStep(order,'summary')['players.0.size']).toBeTruthy();
  const own = completePedido();
  own.design.finalFront = null;
  expect(validateStep(own,'approval')['design.final']).toBeTruthy();
});

test('la imagen ampliada del Mundial llega al carrito y solo se recupera al retomar ese pedido', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/colecciones/disenos-del-mundial-2026');
  await page.locator('.scope-grid a').nth(1).click();
  const choose = page.getByRole('link',{name:'Crear pedido con este diseño'});
  await expect(choose).toHaveAttribute('href', /configurador\?album=37167&imagen=2$/);
  await choose.click();
  await expect(page.getByRole('heading',{name:'Escoge tu producto'})).toBeVisible();
  const selected = page.getByRole('link',{name:/Ver el diseño elegido:/});
  await expect(selected).toHaveAttribute('href', ref.image);
  await page.getByRole('button',{name:/Camisas Full Sublimadas/}).click();
  await continuePedido(page);
  await page.getByRole('button',{name:/Guardar en mi carrito/}).filter({visible:true}).first().click();
  await expect(page.getByRole('button',{name:/Guardado en mi carrito/}).filter({visible:true}).first()).toBeVisible();
  await page.goto('/carrito');
  await expect(selected).toHaveAttribute('href', ref.image);
  await page.getByRole('link',{name:/Continuar este pedido/}).click();
  await expect(selected).toHaveAttribute('href', ref.image);
  await page.goto('/configurador');
  await expect(page.getByRole('button',{name:/CREAR MI PEDIDO/})).toBeEnabled();
  await expect(selected).toHaveCount(0);
});

test('visitar y recargar una imagen elegida conserva el borrador previo hasta elegir la prenda', async ({page}) => {
  const previous = completePedido();
  await seedPedido(page, previous);
  await page.emulateMedia({reducedMotion:'reduce'});
  const saved = () => page.evaluate(() => new Promise<{id:string; notes:string}>((resolve, reject) => {
    const request = indexedDB.open('tony-pedido-v279', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const read = db.transaction('drafts').objectStore('drafts').get('current');
      read.onsuccess = () => {db.close(); resolve(read.result);};
    };
  }));
  const url = '/configurador?album=37167&imagen=2';
  await page.goto('/colecciones/disenos-del-mundial-2026');
  await page.goto(url);
  const selected = page.getByRole('link',{name:/Ver el diseño elegido:/});
  await expect(selected).toHaveAttribute('href',ref.image);
  // Give the debounced IndexedDB writer time to run before checking exclusion.
  await page.waitForTimeout(1100);
  expect((await saved()).id).toBe(previous.id);
  await expect(page).toHaveURL(/album=37167&imagen=2/);
  await page.reload();
  await expect(selected).toHaveAttribute('href',ref.image);
  await page.waitForTimeout(1100);
  await page.goBack();
  expect((await saved()).id).toBe(previous.id);
  await page.goForward();
  await expect(selected).toHaveAttribute('href',ref.image);
  await page.getByRole('button',{name:/Camisas Full Sublimadas/}).click();
  await expect.poll(async () => (await saved()).notes).toContain(ref.image);
  await expect(page).toHaveURL(/\/configurador\/?$/);
});

test('el cliente aprueba la referencia y llega al resumen sin elegir otra camiseta ni generar un mockup', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await seedPedido(page, selectedOrder());
  await page.goto('/configurador?borrador=actual');
  await expect(page.getByText('Recuperamos tu diseño. Revisa los pasos para continuar.')).toBeVisible();
  await page.getByRole('button',{name:/CREAR MI PEDIDO/}).click();
  for (let i=0;i<24 && !await page.getByRole('heading',{name:'Tu diseño del catálogo'}).isVisible();i++) {
    if (await page.getByRole('textbox',{name:/Indicaciones adicionales/}).isVisible()) {
      await expect(page.getByRole('textbox',{name:/Indicaciones adicionales/})).toHaveValue('Cuello en verde.');
    }
    await continuePedido(page);
  }
  await expect(page.getByRole('heading',{name:'Tu diseño del catálogo'})).toBeVisible();
  await expect(page.getByRole('region',{name:'Editor de tu uniforme'})).toHaveCount(0);
  await continuePedido(page);
  await continuePedido(page);
  await expect(page.getByRole('checkbox',{name:/apruebo este diseño/})).not.toBeChecked();
  await page.getByRole('checkbox',{name:/apruebo este diseño/}).check();
  await continuePedido(page);
  await expect(page.getByRole('heading',{name:'EQUIPO DE PRUEBA'}).first()).toBeVisible();
  await expect(page.getByRole('link',{name:/Ver el diseño elegido/})).toHaveAttribute('href', ref.image);
  const quote = page.getByRole('link',{name:'Cotizar este diseño por WhatsApp'});
  if (process.env.TONY_TEST_QUOTE_ONLY === 'true') await expect(quote).toBeVisible();
  if (await quote.count()) {
    const url = new URL((await quote.getAttribute('href'))!);
    expect(url.host).toBe('wa.me');
    expect(url.searchParams.get('text')).toContain(ref.image);
    expect(url.searchParams.get('text')).toContain('M × 6');
    expect(url.searchParams.get('text')).not.toContain('JUGADOR');
    await expect(page.locator('.pedido-step-footer button').filter({hasText:'Continuar'})).toHaveCount(0);
  }
});
