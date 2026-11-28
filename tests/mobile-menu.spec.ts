import {expect,test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import stores from '../data/tony-stores.json';
import {DISCIPLINES} from '../lib/disciplines';
import {HELP_WHATSAPP, ORDER_LOOKUP_URL, TONY_EMAIL} from '../lib/site-links';

test.use({isMobile:true,hasTouch:true,reducedMotion:'reduce'});
test.beforeEach(async ({page}) => {
  await page.addInitScript(() => sessionStorage.setItem('tony:inicio:carteles:v2','[]'));
});

const SEARCH='¿Qué buscas en específico?';
const NEW_TAB=' (se abre en otra pestaña)';
const MAIN_LABELS=['Inicio','Creá tu pedido','App Tony','Tienda en línea','Productos','Promociones','Patrocinio','Nuestras tiendas','Nuestra calidad','Servicio a domicilio','Contacto','Tony News','RSE-Tony'];

for (const viewport of [{width:320,height:568},{width:390,height:844},{width:768,height:1024},{width:844,height:390}]) {
  test(`text menu and its submenus work at ${viewport.width}x${viewport.height}`,async({page})=>{
    await page.setViewportSize(viewport);
    await page.goto('/');
    const strip=page.locator('.tony-contact-line');
    await expect(strip).toContainText('Si no te lo tenemos te lo hacemos');
    await expect(strip.getByRole('link',{name:TONY_EMAIL})).toHaveAttribute('href',`mailto:${TONY_EMAIL}`);
    const trigger=page.getByRole('button',{name:'Abrir menú',exact:true});
    await trigger.tap();
    const menu=page.getByRole('dialog',{name:'Menú de Tony Sportswear'});
    const close=menu.getByRole('button',{name:'Cerrar menú',exact:true});
    await expect(close).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded','true');
    const nav=menu.getByRole('navigation',{name:'Navegación principal'});
    await expect(nav.locator('.tony-menu-list > li > a, .tony-menu-list > li > details > summary')).toHaveText(MAIN_LABELS);
    await expect(nav.locator('img')).toHaveCount(0);
    await nav.getByText('App Tony',{exact:true}).tap();
    await expect(nav.getByRole('link',{name:'Descargá la App Tony'})).toHaveAttribute('href','/app-tony');
    await expect(nav.getByRole('link',{name:/^(Android|iOS)/})).toHaveCount(0);
    await nav.getByText('Productos',{exact:true}).tap();
    await expect(nav.getByRole('link',{name:'Descargá la App Tony'})).toBeHidden();
    await nav.getByText('Confección de uniformes de fútbol',{exact:true}).tap();
    await expect(nav.getByRole('link',{name:'Uniformes Mundial Anime 2026',exact:true})).toHaveAttribute('href','/producto#opcion-futbol-1');
    await nav.getByText('Tienda en línea',{exact:true}).tap();
    await expect(nav.getByRole('link',{name:'Ver toda la tienda',exact:true})).toHaveAttribute('href','/tienda');
    await expect(nav.getByRole('link',{name:'Implementos deportivos',exact:true})).toHaveAttribute('href','/tienda?categoria=implementos');
    const service=menu.getByRole('navigation',{name:'Pedidos y ayuda'});
    await expect(service.getByRole('link',{name:/Consulta tu pedido/})).toHaveAttribute('href',ORDER_LOOKUP_URL);
    await expect(service.getByRole('link',{name:/Ayuda por WhatsApp/})).toHaveAttribute('href',HELP_WHATSAPP);
    const content=menu.locator('.tony-mobile-body');
    const boxes=await content.locator('a,button,summary').evaluateAll(nodes=>nodes.filter(node=>node.checkVisibility()).map(node=>{
      const {x,y,width,height,right,bottom}=node.getBoundingClientRect();
      return {x,y,width,height,right,bottom,name:node.textContent};
    }));
    expect(boxes.filter(box=>box.width<44||box.height<44)).toEqual([]);
    expect(boxes.flatMap((a,i)=>boxes.slice(i+1).filter(b=>a.x<b.right-1&&a.right>b.x+1&&a.y<b.bottom-1&&a.bottom>b.y+1).map(b=>[a.name,b.name]))).toEqual([]);
    expect(await content.evaluate(element=>element.scrollWidth-element.clientWidth)).toBe(0);
    await content.evaluate(element=>{element.scrollTop=element.scrollHeight});
    await expect(close).toBeInViewport({ratio:1});
    await expect(service.getByRole('link',{name:'Somos Tony'})).toBeInViewport({ratio:1});
    if(viewport.width===390) expect((await new AxeBuilder({page}).include('#tony-mobile-menu').withTags(['wcag2a','wcag2aa']).analyze()).violations).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.tap();
    await expect(nav.getByRole('link',{name:'Ver toda la tienda',exact:true})).toBeHidden();
    await nav.getByRole('link',{name:'Nuestras tiendas',exact:true}).tap();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/\/tiendas\/?$/,{timeout:15000});
    await trigger.tap();
    await expect(nav.getByRole('link',{name:'Nuestras tiendas',exact:true})).toHaveAttribute('aria-current','page');
    await close.tap();
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}
test('phone search keeps the input and close button visible across its full directory',async({page})=>{
  await page.setViewportSize({width:320,height:568});await page.goto('/');
  await page.getByRole('button',{name:'Abrir menú',exact:true}).tap();
  const menu=page.getByRole('dialog',{name:'Menú de Tony Sportswear'});
  await menu.getByRole('button',{name:SEARCH,exact:true}).tap();
  const search=page.getByRole('dialog',{name:/QUÉ BUSCAS/});
  const input=page.getByLabel('Buscar una sección',{exact:true});
  const close=search.getByRole('button',{name:'Cerrar búsqueda'});
  const scroller=search.locator('.tony-search-body');
  const count=search.locator('.tony-search-count');
  await expect(input).toBeFocused();
  await expect(menu).toBeHidden();
  expect(await search.boundingBox()).toEqual({x:0,y:0,width:320,height:568});

  // Before typing: the quick accesses and the disciplines, not the whole directory.
  await expect(count).toHaveAttribute('data-state','initial');
  await expect(search.locator('.tony-search-quick').getByRole('link')).toHaveText(['Crear pedido','Promociones','Tiendas',`Consulta tu pedido${NEW_TAB}`,'Implementos','App Tony',`Ayuda${NEW_TAB}`]);
  await expect(search.locator('.tony-search-disc').getByRole('link')).toHaveText([...DISCIPLINES.map(discipline=>discipline.name),'Ver todas']);
  await expect(search.locator('.tony-search-results')).toHaveCount(0);
  await scroller.evaluate(element=>{element.scrollTop=element.scrollHeight;});
  expect(await scroller.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
  await expect(search.locator('.tony-search-disc').getByRole('link',{name:'Ver todas'})).toBeInViewport({ratio:1});
  await expect(input).toBeInViewport();
  await expect(close).toBeInViewport();

  // Every store at once: a list several screens long scrolls under the same field and close button.
  await input.fill('tienda');
  const results=search.locator('.tony-search-results>a');
  await expect(count).toHaveAttribute('data-state','found');
  const labels=await results.evaluateAll(links=>links.map(link=>link.getAttribute('aria-label')));
  expect(labels).toEqual(expect.arrayContaining(['Tiendas','Tienda en línea']));
  expect(labels).toEqual(expect.arrayContaining(stores.map(store=>`Tienda ${store.name}`)));
  await expect(count).toHaveText(`${labels.length} resultados`);
  await scroller.evaluate(element=>{element.scrollTop=element.scrollHeight;});
  expect(await scroller.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
  await expect(results.last()).toBeInViewport({ratio:1});
  await expect(input).toBeInViewport();
  await expect(close).toBeInViewport();

  await input.fill('mundial anime');
  await search.getByRole('link',{name:'Uniformes Mundial Anime 2026',exact:true}).tap();
  await expect(search).toBeHidden();
  await expect(page.getByLabel('Línea de producto')).toHaveValue('uniformes-mundial-anime-2026');
  await expect(page.locator('h1')).toBeVisible();
});

test('the menu search takes a phone to the footer contacts and releases the scroll lock',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');
  const trigger=page.getByRole('button',{name:'Abrir menú',exact:true});
  await trigger.tap();
  const menu=page.getByRole('dialog',{name:'Menú de Tony Sportswear'});
  await menu.getByRole('button',{name:SEARCH,exact:true}).tap();
  const search=page.getByRole('dialog',{name:/QUÉ BUSCAS/});
  await page.getByLabel('Buscar una sección',{exact:true}).fill('contactos');
  await search.getByRole('link',{name:'Contactos · WhatsApp y correo',exact:true}).tap();
  await expect(search).toBeHidden();
  await expect(menu).toBeHidden();
  await expect(page).toHaveURL(/\/#contactos$/);
  await expect(page.locator('.tony-footer-phone')).toBeInViewport();
  await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.documentElement).overflow)).not.toBe('hidden');
  await expect(trigger).toBeFocused();
});
