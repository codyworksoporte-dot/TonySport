import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import collections from '../data/official-collections.json';

test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});});
test('complete directory, nested options and contact anchor work on a narrow phone',async({page})=>{
  await page.setViewportSize({width:320,height:740});await page.goto('/');
  await page.getByRole('button',{name:'¿Qué buscas en específico?',exact:true}).click();
  const search=page.getByRole('dialog',{name:/QUÉ BUSCAS/});
  const destinations=await search.locator('.tony-search-results>a').evaluateAll(links=>links.map(link=>link.getAttribute('href')));
  for(const category of collections.categories)expect(destinations).toContain(`/colecciones?categoria=${encodeURIComponent(category.slug)}`);
  for(const destination of ['/configurador','/carrito','/recientes','/resenas','/tiendas','/cuenta?accion=recuperar','#contactos'])expect(destinations).toContain(destination);
  await page.getByLabel('Buscar una sección',{exact:true}).fill('mundial anime');
  await expect(search.getByRole('link',{name:'Uniformes Mundial Anime 2026',exact:true})).toBeVisible();
  await search.getByRole('link',{name:'Uniformes Mundial Anime 2026',exact:true}).click();
  await expect(page.getByLabel('Línea de producto')).toHaveValue('uniformes-mundial-anime-2026');await expect(page.locator('.collection-grid>li')).toHaveCount(1);
  await page.getByRole('button',{name:'¿Qué buscas en específico?',exact:true}).click();await page.getByLabel('Buscar una sección',{exact:true}).fill('diseños mundial');
  await search.getByRole('link',{name:'Diseños del Mundial 2026',exact:true}).click();await expect(page.getByLabel('Línea de producto')).toHaveValue('disenos-del-mundial-2026');await expect(page.locator('.collection-grid>li')).toHaveCount(1);
  const before=new URL(page.url()).pathname;
  await page.getByRole('navigation',{name:'Accesos rápidos'}).getByRole('link',{name:'Contactos',exact:true}).click();
  await expect(page.locator('.tony-footer-phone')).toBeInViewport();await expect(page.locator('.tony-footer-email')).toBeInViewport();expect(new URL(page.url()).pathname).toBe(before);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('all imported albums are indexed and a gallery loads on demand',async({page})=>{
  expect(collections.products).toHaveLength(240);expect(collections.products.reduce((n,p)=>n+p.imageCount,0)).toBe(4326);
  const albumRequests:string[]=[];page.on('request',r=>{if(/colecciones\/\d+\.json/.test(r.url()))albumRequests.push(r.url());});
  await page.goto('/colecciones?categoria=uniformes-mundial-anime-2026');
  await expect(page.locator('.collection-grid>li')).toHaveCount(1);expect(albumRequests).toHaveLength(0);
  await page.getByRole('button',{name:'Ver UNIFORMES MUNDIAL ANIME 2026',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'UNIFORMES MUNDIAL ANIME 2026',exact:true});await expect(dialog.getByRole('combobox',{name:'Elegir imagen del álbum'})).toBeVisible();
  expect(albumRequests).toHaveLength(1);await expect(dialog.getByRole('combobox').locator('option')).toHaveCount(34);
  await dialog.getByRole('button',{name:'Imagen siguiente',exact:true}).click();await expect(dialog.getByRole('combobox')).toHaveValue('1');await expect(dialog.getByRole('link',{name:'Consultar por WhatsApp'})).toHaveAttribute('href',/imagen%202/);
  await dialog.getByRole('combobox').selectOption('33');await expect(dialog.getByRole('button',{name:'Imagen siguiente',exact:true})).toBeDisabled();
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(page.getByRole('button',{name:'Ver UNIFORMES MUNDIAL ANIME 2026',exact:true})).toBeFocused();
});
for(const width of [320,390,768,1440])test(`collections and account layout at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  for(const route of ['/colecciones','/cuenta']){
    await page.goto(route);await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect((await new AxeBuilder({page}).include('main').withTags(['wcag2a','wcag2aa']).analyze()).violations).toEqual([]);
  }
  if(width===390){await page.goto('/colecciones?categoria=uniformes-mundial-anime-2026');await expect(page.getByLabel('Línea de producto')).toHaveValue('uniformes-mundial-anime-2026');await page.screenshot({path:'output/collections-mobile.png',fullPage:true,caret:'initial'});}
});
