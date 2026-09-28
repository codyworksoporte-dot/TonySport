import {expect,test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import {completePedido} from './pedido/pricing.fixtures';
import {expectNoOverflow,mockPedidoApi,openSeededEditor,pngFixture,seedPedido} from './pedido/helpers';

test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});await seedPedido(page,completePedido());});

test('los 70 diseños oficiales tienen búsqueda, vista completa y frontal/dorsal propios',async({page})=>{
  await mockPedidoApi(page);await openSeededEditor(page);
  await page.getByRole('button',{name:/Explorar 70 diseños/}).click();
  await expect(page.getByRole('button',{name:/^Ver TONY-/})).toHaveCount(70);
  await page.getByRole('searchbox',{name:'Buscar por código o nombre'}).fill('TONY-070');
  await expect(page.getByRole('button',{name:/^Ver TONY-/})).toHaveCount(1);
  await page.getByRole('button',{name:'Ver TONY-070',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Vista completa TONY-070'});
  await expect(dialog).toBeVisible();await dialog.getByRole('button',{name:/Usar TONY-070/}).click();
  const front=page.getByRole('img',{name:'Base frontal TONY-070'});await expect(front).toBeVisible();
  await expect.poll(()=>front.evaluate(img=>(img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const first=await front.getAttribute('src');await page.getByRole('button',{name:/^Dorsal/}).click();
  const back=page.getByRole('img',{name:'Base dorsal TONY-070'});await expect(back).toBeVisible();expect(await back.getAttribute('src')).not.toBe(first);
});

test('el escudo se coloca solo en el pecho; se agranda, vuelve a su lugar y se copia atrás sin escribir números',async({page})=>{
  await mockPedidoApi(page);await openSeededEditor(page);
  const image=await pngFixture(page);
  await page.getByRole('button',{name:/Subir escudo/}).click();
  await page.getByLabel('Subir elemento personalizado').setInputFiles({name:'escudo-prueba.png',mimeType:'image/png',buffer:image.buffer});
  const element=page.getByRole('button',{name:/^Mover Escudo/});await expect(element).toBeVisible();
  // Catalogue sheets: the crest lands on the chest, no coordinates to type.
  const place=()=>element.evaluate(node=>[parseFloat((node as HTMLElement).style.left),parseFloat((node as HTMLElement).style.top),parseFloat((node as HTMLElement).style.width)]);
  expect(await place()).toEqual([58,25,expect.any(Number)]);
  await expect(page.getByLabel('Posición X')).toHaveCount(0);
  const [, , width]=await place();
  await page.getByRole('button',{name:'Más grande',exact:true}).click();
  expect((await place())[2]).toBeGreaterThan(width);
  await element.focus();await element.press('ArrowRight');expect((await place())[0]).toBe(59);
  await page.getByRole('button',{name:'↺ Volver a su lugar',exact:true}).click();
  expect(await place()).toEqual([58,25,width]);
  await page.getByRole('button',{name:'Poner también atrás',exact:true}).click();await page.getByRole('button',{name:/^Dorsal/}).click();
  const copied=page.getByRole('button',{name:/^Mover Escudo/});await expect(copied).toBeVisible();
  await expect(page.locator('.pedido-aside .pedido-price-total dd')).toHaveText('$82.94');
  await copied.click();await copied.press('Delete');await expect(copied).toHaveCount(0);
  await page.getByRole('button',{name:/Deshacer/}).click();await expect(copied).toBeVisible();
  await page.getByRole('button',{name:/^Frontal/}).click();await expect(page.getByRole('button',{name:/^Mover Escudo/})).toBeVisible();
  await expect(page.getByText('Borrador guardado en este navegador.',{exact:true})).toBeVisible();
});

test('al elegir un diseño del catálogo el nombre y el número grande quedan atrás solos',async({page})=>{
  await mockPedidoApi(page);await openSeededEditor(page);
  await page.getByRole('button',{name:/Explorar 70 diseños/}).click();
  await page.getByRole('button',{name:'Ver TONY-012',exact:true}).click();
  await page.getByRole('dialog',{name:'Vista completa TONY-012'}).getByRole('button',{name:/Usar TONY-012/}).click();
  await page.getByRole('button',{name:/^Dorsal/}).click();
  const name=page.getByRole('button',{name:/^Mover Nombre/}),number=page.getByRole('button',{name:/^Mover Número/});
  await expect(name).toBeVisible();await expect(number).toBeVisible();
  // The example is the first player of the roster; the number is the biggest piece on the back.
  await expect(name.locator('text')).toHaveText('JUGADOR 1');await expect(number.locator('text')).toHaveText('1');
  const height=(locator:typeof name)=>locator.evaluate(node=>parseFloat((node as HTMLElement).style.height));
  expect(await height(number)).toBeGreaterThan(await height(name)*2);
});

test('PNG exportado conserva las capas y un archivo falso no reemplaza el diseño',async({page})=>{
  await mockPedidoApi(page);await openSeededEditor(page);const image=await pngFixture(page);
  await page.getByRole('button',{name:/Subir escudo/}).click();
  await page.getByLabel('Subir elemento personalizado').setInputFiles({name:'escudo.png',mimeType:'image/png',buffer:image.buffer});
  await expect(page.getByRole('button',{name:/^Mover Escudo/})).toBeVisible();
  const event=page.waitForEvent('download');await page.getByRole('button',{name:'↓ PNG',exact:true}).click();
  const download=await event,bytes=fs.readFileSync(await download.path());expect(bytes.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(bytes.readUInt32BE(16)).toBe(800);expect(bytes.readUInt32BE(20)).toBe(1000);
  await page.getByLabel('Cargar imagen del uniforme').setInputFiles({name:'falso.png',mimeType:'image/png',buffer:Buffer.from('Esto no es una imagen')});
  await expect(page.getByRole('alert').filter({hasText:'El archivo no contiene una imagen'})).toBeVisible();
  await expect(page.getByRole('button',{name:/^Mover Escudo/})).toBeVisible();
});

test('un fallo de IA conserva la imagen y comunica un reintento sin perder capas',async({page})=>{
  const api=await mockPedidoApi(page,{failAI:true});await openSeededEditor(page);
  const before=await page.locator('.pedido-design-base').getAttribute('src');
  await page.locator('.pedido-image-tools summary').click();await page.getByRole('button',{name:'Generar mockup con IA',exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:/Conservamos tu diseño/})).toBeVisible();
  await expect(page.locator('.pedido-design-base')).toHaveAttribute('src',before!);
  expect(api.calls.some(call=>call.endpoint==='generate.php')).toBe(true);
});

for(const width of [320,390,1440])test(`editor sin desbordamiento a ${width}px y con controles accesibles`,async({page})=>{
  await page.setViewportSize({width,height:900});await mockPedidoApi(page);await openSeededEditor(page);
  await expectNoOverflow(page,width);
  const results=await new AxeBuilder({page}).include('.pedido-page').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(results.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)}))).toEqual([]);
});
