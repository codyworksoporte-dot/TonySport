import {expect,test,type Locator} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import stores from '../data/tony-stores.json';
import {DISCIPLINES,DISCIPLINES_TITLE,disciplineHref} from '../lib/disciplines';
import {HELP_WHATSAPP,ORDER_LOOKUP_URL,TONY_WHATSAPP,TONY_WHATSAPP_NUMBER} from '../lib/site-links';

test.use({isMobile:true,hasTouch:true,reducedMotion:'reduce'});

const SEARCH='¿Qué buscas en específico?';
const NEW_TAB=' (se abre en otra pestaña)';
const TILES=['Promociones','Implementos','Tiendas','Consulta tu pedido','Descarga la App Tony','Ayuda por WhatsApp','Tony News'];
const MORE=['Somos Tony','Patrocinios','Calidad','Preguntas frecuentes','Mi cuenta','Mi carrito'];

/** The boxes of every visible link and button inside `scope` (closed nested dialogs are left out). */
const boxesOf=(scope:Locator)=>scope.locator('a,button').evaluateAll(elements=>elements.filter(element=>element.checkVisibility()).map(element=>{
  const box=element.getBoundingClientRect();
  return {name:(element.getAttribute('aria-label')||element.textContent||'').trim(),left:box.left,top:box.top,width:box.width,height:box.height,right:box.right,bottom:box.bottom};
}));

for(const viewport of [{width:320,height:568},{width:390,height:844},{width:768,height:1024},{width:844,height:390}]){
  test(`menu keeps its header and quick actions reachable at ${viewport.width}x${viewport.height}`,async({page})=>{
    await page.setViewportSize(viewport);
    await page.goto('/');
    const trigger=page.getByRole('button',{name:'Abrir menú',exact:true});
    await trigger.tap();
    const menu=page.getByRole('dialog',{name:'Menú de Tony Sportswear'});
    const body=menu.locator('.tony-mobile-body');
    const close=menu.getByRole('button',{name:'Cerrar menú',exact:true});
    await expect(close).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded','true');
    const header=await menu.locator('.tony-mobile-top').boundingBox();
    const footer=await menu.locator('.tony-mobile-support').boundingBox();
    const content=await body.boundingBox();
    expect(header!.y).toBe(0);
    expect(content!.y).toBeGreaterThanOrEqual(header!.y+header!.height);
    expect(content!.y+content!.height).toBeLessThanOrEqual(footer!.y);
    expect(footer!.y+footer!.height).toBeCloseTo(viewport.height,0);
    expect((await close.boundingBox())!.height).toBeGreaterThanOrEqual(44);

    // Search, the main action, the 13 disciplines, the picture tiles and the short links; no accordions left.
    await expect(menu.getByRole('button',{name:SEARCH,exact:true})).toHaveAttribute('aria-haspopup','dialog');
    await expect(menu.getByRole('link',{name:'Crear mi pedido',exact:true})).toHaveAttribute('href','/configurador');
    const nav=menu.getByRole('navigation',{name:'Navegación principal'});
    const disciplines=nav.getByRole('region',{name:DISCIPLINES_TITLE}).getByRole('link');
    await expect(disciplines).toHaveText([...DISCIPLINES.map(discipline=>discipline.name),'Ver todas']);
    expect(await disciplines.evaluateAll(links=>links.map(link=>link.getAttribute('href')))).toEqual([...DISCIPLINES.map(discipline=>disciplineHref(discipline.id)),'/producto']);
    const tiles=nav.locator('.tony-menu-tiles');
    await expect(tiles.locator('.tc-tile-label b')).toHaveText(TILES);
    await expect(tiles.getByRole('link',{name:/Promociones/})).toHaveAttribute('href','/promociones');
    await expect(tiles.getByRole('link',{name:'Implementos',exact:true})).toHaveAttribute('href','/implementos');
    const storesTile=tiles.getByRole('link',{name:/^Tiendas/});
    await expect(storesTile).toHaveAttribute('href','/tiendas');
    await expect(storesTile).toContainText(`${stores.length} tiendas`);
    await expect(tiles.getByRole('link',{name:'Tony News',exact:true})).toHaveAttribute('href','/tony-news');
    for(const [name,href] of [[/^Consulta tu pedido/,ORDER_LOOKUP_URL],[/^Ayuda por WhatsApp/,HELP_WHATSAPP]] as const){
      const external=tiles.getByRole('link',{name});
      await expect(external).toHaveAttribute('href',href);
      await expect(external).toHaveAttribute('target','_blank');
      await expect(external).toContainText(NEW_TAB.trim());
    }
    await expect(tiles.getByRole('button',{name:'Descarga la App Tony',exact:true})).toHaveAttribute('aria-haspopup','dialog');
    await expect(nav.locator('.tony-menu-more').getByRole('link')).toHaveText(MORE);
    await expect(menu.locator('[aria-expanded]')).toHaveCount(0);
    const whatsapp=menu.locator('.tony-mobile-support').getByRole('link',{name:`Contáctanos por WhatsApp al ${TONY_WHATSAPP_NUMBER}`,exact:true});
    await expect(whatsapp).toHaveAttribute('href',TONY_WHATSAPP);
    await expect(whatsapp).toHaveAttribute('target','_blank');

    // Every control is a comfortable tap target, and the picture buttons never overlap or spill sideways.
    // Body: search, Crear mi pedido, the chips, the tiles and the short links; around it the logo, Cerrar and WhatsApp.
    const pieces=await boxesOf(body);
    expect(pieces).toHaveLength(2+DISCIPLINES.length+1+TILES.length+MORE.length);
    const controls=await boxesOf(menu);
    expect(controls).toHaveLength(pieces.length+3);
    expect(controls.filter(box=>box.width<44||box.height<44)).toEqual([]);
    expect(pieces.flatMap((a,index)=>pieces.slice(index+1).filter(b=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1).map(b=>`${a.name} / ${b.name}`))).toEqual([]);
    expect(await body.evaluate(element=>element.scrollWidth-element.clientWidth)).toBe(0);
    if(viewport.width===390)await page.screenshot({path:'output/mobile-menu-after.png'});

    await body.evaluate(element=>{element.scrollTop=element.scrollHeight;});
    expect(await body.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
    await expect(nav.locator('.tony-menu-more').getByRole('link',{name:'Mi carrito'})).toBeInViewport({ratio:1});
    await expect(close).toBeInViewport();
    await expect(whatsapp).toBeInViewport({ratio:1});
    expect(await menu.locator('.tony-mobile-top').boundingBox()).toEqual(header);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded','false');
    await trigger.tap();
    await expect(close).toBeFocused();
    expect(await body.evaluate(element=>element.scrollTop)).toBe(0);
    if(viewport.width===390)expect((await new AxeBuilder({page}).include('#tony-mobile-menu').withTags(['wcag2a','wcag2aa']).analyze()).violations).toEqual([]);

    // A tile leaves for its page, the scroll lock goes with the menu, and there the tile is the current page.
    await storesTile.tap();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/\/tiendas$/);
    await expect(page.getByRole('heading',{level:1,name:'Tiendas',exact:true})).toBeVisible();
    await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.documentElement).overflow)).not.toBe('hidden');
    await trigger.tap();
    await expect(storesTile).toHaveAttribute('aria-current','page');
    await expect(menu.locator('[aria-current]')).toHaveCount(1);
    await close.tap();
    await expect(menu).toBeHidden();await expect(trigger).toBeFocused();
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
  expect(labels[0]).toBe('Tiendas');
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
