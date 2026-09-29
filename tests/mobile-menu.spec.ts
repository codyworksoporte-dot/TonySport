import {expect,test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({isMobile:true,hasTouch:true,reducedMotion:'reduce'});

for(const viewport of [{width:320,height:568},{width:390,height:844},{width:768,height:1024},{width:844,height:390}]){
  test(`menu keeps its header and quick actions reachable at ${viewport.width}x${viewport.height}`,async({page})=>{
    await page.setViewportSize(viewport);
    await page.goto('/');
    const trigger=page.getByRole('button',{name:'Abrir menú',exact:true});
    await trigger.tap();
    const menu=page.getByRole('dialog',{name:'Menú de Tony Sportswear'});
    const body=menu.locator('.tony-mobile-body');
    const close=menu.getByRole('button',{name:'Cerrar menú',exact:true});
    const header=await menu.locator('.tony-mobile-top').boundingBox();
    const footer=await menu.locator('.tony-mobile-support').boundingBox();
    const content=await body.boundingBox();
    expect(header!.y).toBe(0);
    expect(content!.y).toBeGreaterThanOrEqual(header!.y+header!.height);
    expect(content!.y+content!.height).toBeLessThanOrEqual(footer!.y);
    expect(footer!.y+footer!.height).toBeCloseTo(viewport.height,0);
    expect((await close.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(close).toBeFocused();
    await expect(menu.getByRole('link',{name:'Inicio',exact:true})).toHaveAttribute('aria-current','page');
    expect(await menu.locator('.tony-mobile-nav>a').allTextContents()).toEqual(['Inicio ','Tony News ']);
    if(viewport.width===390)await page.screenshot({path:'output/mobile-menu-after.png'});
    await menu.getByRole('button',{name:'Somos Tony',exact:true}).tap();
    const links=await menu.locator('#tony-mobile-company>a').evaluateAll(els=>els.map(el=>{
      const r=el.getBoundingClientRect();return {x:r.x,y:r.y,height:r.height,width:r.width};
    }));
    expect(links).toHaveLength(3);
    for(let i=0;i<links.length;i++){
      expect(links[i].height).toBeGreaterThanOrEqual(48);
      expect(links[i].x).toBe(links[0].x);
      if(i)expect(links[i].y).toBeGreaterThanOrEqual(links[i-1].y+links[i-1].height);
    }
    await menu.getByRole('button',{name:'Producto',exact:true}).tap();
    await expect(menu.locator('#tony-mobile-company')).toBeHidden();
    await expect(menu.getByRole('link',{name:'Mundial, Anime y colecciones',exact:true})).toBeVisible();
    await body.evaluate(el=>{el.scrollTop=el.scrollHeight;});
    expect(await body.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
    await expect(close).toBeInViewport();
    for(const link of await menu.locator('.tony-mobile-support>a').all())await expect(link).toBeInViewport();
    expect(await menu.locator('.tony-mobile-top').boundingBox()).toEqual(header);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();await expect(trigger).toBeFocused();
    await trigger.tap();
    expect(await body.evaluate(el=>el.scrollTop)).toBe(0);
    await expect(menu.getByRole('button',{name:'Producto',exact:true})).toHaveAttribute('aria-expanded','false');
    if(viewport.width===390)expect((await new AxeBuilder({page}).include('#tony-mobile-menu').withTags(['wcag2a','wcag2aa']).analyze()).violations).toEqual([]);
    await menu.getByRole('link',{name:'Contactos',exact:true}).tap();
    await expect(menu).toBeHidden();
    await expect(page.locator('.tony-footer-phone')).toBeInViewport();
    await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.documentElement).overflow)).not.toBe('hidden');
  });
}

test('phone search keeps the input and close button visible across its full directory',async({page})=>{
  await page.setViewportSize({width:320,height:568});await page.goto('/');
  await page.getByRole('button',{name:'Abrir menú',exact:true}).tap();
  await page.getByRole('button',{name:/Busca un producto/}).tap();
  const search=page.getByRole('dialog',{name:/QUÉ BUSCAS/});
  const input=page.getByLabel('Buscar una sección',{exact:true});
  await expect(input).toBeFocused();
  await expect(page.locator('.tony-mobile')).toBeHidden();
  expect(await search.boundingBox()).toEqual({x:0,y:0,width:320,height:568});
  await search.locator('.tony-search-results').evaluate(el=>{el.scrollTop=el.scrollHeight;});
  await expect(input).toBeInViewport();
  await expect(search.getByRole('button',{name:'Cerrar búsqueda'})).toBeInViewport();
  await input.fill('mundial anime');
  await search.getByRole('link',{name:'Uniformes Mundial Anime 2026',exact:true}).tap();
  await expect(search).toBeHidden();
  await expect(page.getByLabel('Línea de producto')).toHaveValue('uniformes-mundial-anime-2026');
  await expect(page.locator('h1')).toBeVisible();
});
