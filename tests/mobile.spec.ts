import {expect, test} from '@playwright/test';
import {completePedido, layer} from './pedido/pricing.fixtures';
import {seedPedido, openSeededEditor, expectNoOverflow} from './pedido/helpers';

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
test('mobile editor keeps the chosen piece and its controls together', async ({page}) => {
  const order=completePedido();
  order.design.front='/assets/pedido/catalog/tony-010-front.webp';
  order.design.back='/assets/pedido/catalog/tony-010-back.webp';
  order.design.layers=[layer('Escudo','Escudo')];
  await seedPedido(page,order);
  await page.addInitScript(()=>localStorage.setItem('tony:pedido:asesora:v2',JSON.stringify({visible:true,voice:false})));
  await openSeededEditor(page);
  await page.locator('.pedido-design-layer').click();
  await page.getByRole('button',{name:'Más grande',exact:true}).click();
  await page.screenshot({path:`output/mobile-editor-${process.env.TONY_MOBILE_BASELINE?'before':'after'}.png`});
  const scene=await page.locator('.pedido-design-stage').boundingBox();
  const controls=await page.locator('.pedido-size-row').boundingBox();
  console.log('preview and controls',scene,controls);
  await expectNoOverflow(page,390);
  if(!process.env.TONY_MOBILE_BASELINE){
    expect(scene!.y).toBeGreaterThanOrEqual(60);
    expect(scene!.y+scene!.height).toBeLessThan(controls!.y);
    expect(controls!.y+controls!.height).toBeLessThan(844);
    await expect(page.locator('.pedido-advisor-dock')).toBeHidden();
  }
});

test('a mobile save confirms persistence, deduplicates repeated saves and opens the saved design', async ({page}) => {
  await seedPedido(page,completePedido());
  await page.goto('/configurador');
  await expect(page.getByText('Recuperamos tu diseño. Revisa los pasos para continuar.')).toBeVisible();
  await page.getByRole('button',{name:/CREAR MI PEDIDO/}).click();
  const save=page.locator('.pedido-step-footer .pedido-mobile-save');
  await save.tap();
  const notice=page.locator('.cart-feedback');
  await expect(notice).toContainText('Guardado en tu carrito');
  await expect(save).toContainText('Guardado');
  await expect(page.locator('.cart-link').first()).toHaveAttribute('aria-label','Carrito, 1 diseño');
  const box=await notice.boundingBox(); expect(box!.y).toBeGreaterThanOrEqual(64); expect(box!.y+box!.height).toBeLessThan(844);
  await page.screenshot({path:'output/mobile-cart-confirmation.png'});
  await save.tap(); await save.tap();
  await expect(notice).toHaveCount(1);
  await notice.getByRole('link',{name:/Ir al carrito/}).tap();
  await expect(page.locator('.pedido-saved-card')).toHaveCount(1);
  await page.reload(); await expect(page.locator('.pedido-saved-card')).toHaveCount(1);
  await expect(page.locator('.cart-feedback')).toHaveCount(0);
});

test('storage failure shows an error and never a false cart success', async ({page}) => {
  await seedPedido(page,completePedido());
  await page.goto('/configurador');
  await expect(page.getByText('Recuperamos tu diseño. Revisa los pasos para continuar.')).toBeVisible();
  await page.getByRole('button',{name:/CREAR MI PEDIDO/}).click();
  await page.evaluate(()=>{const original=IDBObjectStore.prototype.put; IDBObjectStore.prototype.put=function(...args: Parameters<IDBObjectStore['put']>){if(this.name==='cart')throw new DOMException('Espacio de prueba agotado','QuotaExceededError');return original.apply(this,args);};});
  await page.locator('.pedido-mobile-save').tap();
  await expect(page.locator('.cart-feedback')).toContainText('No se pudo guardar');
  await expect(page.locator('.cart-feedback a')).toHaveCount(0);
  await expect(page.locator('.pedido-mobile-save')).toContainText('Reintentar');
  await expect(page.locator('.cart-link').first()).toHaveAttribute('aria-label','Carrito, 0 diseños');
});

test('mobile navigation keeps close and search reachable, releases scroll and uses a full-screen transition', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('.lagarto-intro[open]')).toHaveCount(0);
  const menu=page.getByRole('dialog',{name:'Menú de Tony Sportswear'});
  await page.getByRole('button',{name:'Abrir menú'}).tap();
  await menu.getByRole('button',{name:/Producto/}).tap();
  await menu.getByRole('link',{name:'Fútbol',exact:true}).tap();
  await expect(page).toHaveURL(/\/producto#categoria-futbol$/);
  await expect(menu).not.toBeVisible();
  await expect(page.locator('.route-transition')).toHaveAttribute('data-phase','idle');
  await expect(page.locator('.route-transition')).toHaveAttribute('data-art','mobile');
  await expect(page.locator('.rt-panel')).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.documentElement).overflow)).not.toBe('hidden');
  await page.getByRole('button',{name:'Abrir menú'}).tap();
  await menu.getByRole('button',{name:/Busca un producto/}).tap();
  await expect(page.locator('#site-search')).toBeFocused();
  await page.locator('#site-search').fill('tiendas');
  await page.locator('.tony-search-results').getByRole('link',{name:'Tiendas',exact:true}).tap();
  await expect(page).toHaveURL(/\/tiendas$/);
  await page.goBack(); await expect(page).toHaveURL(/\/producto#categoria-futbol$/);
  await page.getByRole('button',{name:'Abrir menú'}).tap();
  await menu.getByRole('button',{name:/Producto/}).tap();
  await menu.locator('.tony-mobile-body').evaluate(el=>{el.scrollTop=el.scrollHeight;});
  const close=await menu.getByRole('button',{name:'Cerrar menú'}).boundingBox();
  expect(close!.y).toBeGreaterThanOrEqual(0); expect(close!.y).toBeLessThan(100);
  await menu.getByRole('button',{name:'Cerrar menú'}).tap();
  await expect(page.getByRole('button',{name:'Abrir menú'})).toBeFocused();
});

test('dragging on touch commits once and undoes as one action', async ({page,context}) => {
  const order=completePedido(); order.design.layers=[layer('Escudo','Escudo')];
  await seedPedido(page,order); await openSeededEditor(page);
  const piece=page.locator('.pedido-design-layer'); await piece.scrollIntoViewIfNeeded();
  const rect=await piece.boundingBox();
  const session=await context.newCDPSession(page);
  const x=rect!.x+rect!.width/2, y=rect!.y+rect!.height/2;
  const before=await piece.getAttribute('style');
  const version=await page.locator('.pedido-editor').getAttribute('data-history');
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=20;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*1.5,y:y+i}]});
  await expect(page.locator('.pedido-editor')).toHaveAttribute('data-history',version!);
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(piece).not.toHaveAttribute('style',before!);
  await expect(page.locator('.pedido-editor')).toHaveAttribute('data-history',String(Number(version)+1));
  await page.getByRole('button',{name:/Deshacer/}).click();
  await expect(piece).toHaveAttribute('style',before!);
  await session.detach();
});

for(const width of [320,768])test(`editor tools and framing stay usable at ${width}px`, async ({page})=>{
  await page.setViewportSize({width,height:800});
  const order=completePedido(); order.design.layers=[layer('Escudo','Escudo')];
  await seedPedido(page,order); await openSeededEditor(page);
  await page.locator('.pedido-design-layer').click();
  await page.getByRole('button',{name:'Más pequeño'}).click();
  await page.getByRole('button',{name:'Imagen',exact:true}).click();
  await page.getByRole('button',{name:/Encuadrar/}).click();
  await expect(page.getByRole('slider',{name:'Zoom',exact:true})).toBeVisible();
  await page.getByRole('slider',{name:'Zoom',exact:true}).fill('1.3');
  await page.getByRole('button',{name:'Aplicar encuadre'}).click();
  await expect(page.getByText('✓ Encuadre aplicado.')).toBeVisible();
  await expectNoOverflow(page,width);
  await page.screenshot({path:`output/mobile-editor-${width}.png`});
});

test('reduced motion preserves the cart confirmation without animation',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await seedPedido(page,completePedido()); await page.goto('/configurador');
  await expect(page.getByText('Recuperamos tu diseño. Revisa los pasos para continuar.')).toBeVisible();
  await page.getByRole('button',{name:/CREAR MI PEDIDO/}).click();
  await page.locator('.pedido-mobile-save').tap();
  await expect(page.locator('.cart-feedback')).toContainText('Guardado en tu carrito');
  expect(await page.locator('.cart-feedback').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});
