import {test,expect} from '@playwright/test';

// "Consulta tu pedido" always sends the customer to Tony's official order lookup.
const ORDER_LOOKUP='https://www.tonysportselsalvador.com/sistema/consulta_ts/';

test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});});

test('consulta y entregas abren la consulta oficial del pedido en otra pestaña; el antiguo formulario de entregas ya no existe',async({page})=>{
  // A stand-in for the official system: the test never reaches the live lookup.
  await page.context().route(ORDER_LOOKUP,route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Consulta simulada</title><h1>Consulta simulada</h1>'}));
  for(const route of ['/consulta','/entregas']){
    await page.goto(route);
    const main=page.getByRole('main');
    await expect(main.getByRole('heading',{level:1,name:'Consulta tu pedido',exact:true}),route).toBeVisible();
    const lookup=main.getByRole('link',{name:/^Consultar mi pedido/});
    await expect(lookup,route).toBeVisible();
    await expect(lookup,route).toHaveAttribute('href',ORDER_LOOKUP);
    await expect(lookup,route).toHaveAttribute('target','_blank');
    await expect(lookup,route).toHaveAttribute('rel',/(^|\s)noopener(\s|$)/);
    const noNumber=main.getByRole('link',{name:/No tienes tu número/});
    await expect(noNumber,route).toHaveAttribute('href',/^https:\/\/wa\.me\/50370155571\?text=/);
    await expect(noNumber,route).toHaveAttribute('target','_blank');
    // The delivery form (zone, branch and WhatsApp draft) was replaced by the lookup.
    await expect(page.locator('#te-delivery-zone, #te-delivery-store, #te-delivery-destination'),route).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Preparar consulta'}),route).toHaveCount(0);
  }
  // The lookup opens in its own tab without access back to the site, which stays where it was.
  const [popup]=await Promise.all([page.waitForEvent('popup'),page.getByRole('main').getByRole('link',{name:/^Consultar mi pedido/}).click()]);
  await expect(popup).toHaveURL(ORDER_LOOKUP);
  expect(await popup.evaluate(()=>window.opener)).toBeNull();
  await expect(page).toHaveURL(/\/entregas\/?$/);
  await popup.close();
});

test('las páginas internas no repiten el creador en su contenido y el encabezado lo ofrece en todas',async({page})=>{
  for(const route of ['/lineas','/calidad','/tiendas','/entregas','/consulta','/patrocinio','/comunidad','/actualidad','/tony-news','/catalogo','/nosotros','/contacto']){
    await page.goto(route);
    await expect(page.locator('main h1'),route).toBeVisible();
    await expect(page.locator('main a[href^="/configurador"]'),route).toHaveCount(0);
    const create=page.getByRole('banner').getByRole('link',{name:'Crear pedido',exact:true});
    await expect(create,route).toBeVisible();
    await expect(create,route).toHaveAttribute('href','/configurador');
    await expect(page.locator('.tony-footer-invitation'),route).toHaveCount(0);
  }
});

test('la búsqueda del sitio abre el creador, comunidad ya no muestra TonyPlay y el pie conserva la bandera',async({page})=>{
  await page.goto('/contacto');
  await page.getByRole('banner').getByRole('button',{name:'¿Qué buscas en específico?',exact:true}).click();
  const search=page.getByRole('dialog',{name:'¿QUÉ BUSCAS EN ESPECÍFICO?'});
  const field=search.getByRole('searchbox',{name:'Buscar una sección'});
  await expect(field).toBeFocused();
  await field.fill('uniforme');
  const create=search.getByRole('link',{name:'Crear mi pedido',exact:true});
  await expect(create).toHaveAttribute('href','/configurador');
  await create.click();
  await expect(page).toHaveURL(/\/configurador\/?$/);
  await expect(search).toBeHidden();
  await page.goto('/comunidad');
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('#tonyplay')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('TonyPlay',{ignoreCase:true});
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
