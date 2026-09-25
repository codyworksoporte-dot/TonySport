import {test,expect} from '@playwright/test';
import stores from '../data/tony-stores.json';

test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});});

test('entregas exige una sucursal y nunca reutiliza el contacto de una selección anterior',async({page})=>{
  await page.goto('/entregas');
  const store=page.locator('#te-delivery-store');
  const prepare=page.getByRole('button',{name:'Preparar consulta'});
  const whatsapp=page.getByRole('link',{name:'Consultar entrega en WhatsApp'});
  await expect(store).toHaveValue('');
  await expect(whatsapp).toHaveCount(0);
  await prepare.click();
  await expect(store).toBeFocused();
  await expect(store).toHaveAttribute('aria-invalid','true');
  await page.locator('#te-delivery-zone').selectOption('Oriente');
  await expect(store.locator('option')).toHaveCount(stores.filter(item=>item.zone==='Oriente').length+1);
  await expect(page.locator('#te-delivery-error')).toHaveCount(0);
  await store.selectOption('San Miguel');
  await page.locator('#te-delivery-destination').fill('San Miguel, centro');
  await prepare.click();
  await expect(page.getByRole('heading',{name:'Tony San Miguel',exact:true})).toBeFocused();
  let url=new URL((await whatsapp.getAttribute('href'))!);
  expect(url.pathname).toBe('/50376565837');
  expect(url.searchParams.get('text')).toContain('San Miguel, centro');
  await store.selectOption('Usulután');
  await expect(whatsapp).toHaveCount(0);
  await prepare.click();
  url=new URL((await whatsapp.getAttribute('href'))!);
  expect(url.pathname).toBe('/50370083267');
  expect(url.searchParams.get('text')).toContain('Sucursal elegida: Usulután');
  await page.locator('#te-delivery-destination').fill('Usulután');
  await expect(whatsapp).toHaveCount(0);
  await prepare.click();
  url=new URL((await whatsapp.getAttribute('href'))!);
  expect(url.searchParams.get('text')).not.toContain('San Miguel');
  await page.locator('#te-delivery-zone').selectOption('Occidente');
  await expect(store).toHaveValue('');
  await expect(whatsapp).toHaveCount(0);
  await expect(page.locator('.te-section-label>span')).toHaveText(['01','02']);
});

test('las páginas internas y su búsqueda ya no duplican el acceso al creador',async({page})=>{
  for(const route of ['/lineas','/calidad','/tiendas','/entregas','/patrocinio','/comunidad','/actualidad','/tony-news','/catalogo','/nosotros','/contacto']){
    await page.goto(route);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('a[href^="/configurador"]'),route).toHaveCount(0);
    await expect(page.locator('.tony-footer-invitation'),route).toHaveCount(0);
  }
  await page.getByRole('button',{name:'Buscar en el sitio'}).click();
  await page.getByRole('searchbox').fill('uniforme');
  await expect(page.getByRole('dialog').locator('a[href^="/configurador"]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.goto('/comunidad');
  await expect(page.locator('#tonyplay')).toContainText('EN DESARROLLO');
  await expect(page.locator('#tonyplay').locator('a,button')).toHaveCount(0);
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByRole('img',{name:'Bandera de El Salvador'})).toBeVisible();
});

test('patrocinio permite corregir contacto y recuperarse de una copia bloqueada',async({page})=>{
  await page.goto('/patrocinio');
  await page.locator('#te-proposal-club').fill('Club del Oriente');
  await page.locator('#te-proposal-location').fill('San Miguel');
  await page.locator('#te-proposal-category').selectOption('Juvenil');
  await page.locator('#te-proposal-players').fill('18');
  await page.locator('#te-proposal-contact').fill('no-es-un-contacto');
  await page.locator('#te-proposal-idea').fill('Buscamos conversar sobre una colaboración con nuestro equipo.');
  await page.getByRole('button',{name:'Revisar mi propuesta'}).click();
  await expect(page.locator('#te-proposal-contact')).toBeFocused();
  await expect(page.locator('#te-proposal-contact')).toHaveAttribute('aria-invalid','true');
  await page.locator('#te-proposal-contact').fill('+503 7123-4567');
  await page.getByRole('button',{name:'Revisar mi propuesta'}).click();
  await expect(page.locator('.te-proposal-review')).toContainText('Tu propuesta está preparada.');
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new DOMException('blocked','NotAllowedError');}}});});
  await page.getByRole('button',{name:'Copiar propuesta',exact:true}).click();
  await expect(page.locator('.te-copy-status')).toContainText('No se pudo copiar');
  await expect(page.getByRole('link',{name:'Preparar correo'})).toBeVisible();
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{}}});});
  await page.getByRole('button',{name:'Copiar propuesta',exact:true}).click();
  await expect(page.locator('.te-copy-status')).toContainText('Propuesta copiada');
  await page.getByRole('button',{name:'Volver a editar'}).click();
  await expect(page.locator('#te-proposal-club')).toBeFocused();
  await expect(page.locator('#te-proposal-contact')).toHaveValue('+503 7123-4567');
});
