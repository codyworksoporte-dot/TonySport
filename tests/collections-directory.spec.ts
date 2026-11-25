import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import collections from '../data/official-collections.json';

const ORDER_LOOKUP='https://www.tonysportselsalvador.com/sistema/consulta_ts/';
// Some official album names carry an outdated price ("Replicas Sublimadas $8.99"); the search shows and finds them by name.
const albumQuery=(name:string)=>name.replace(/\s*(de\s+)?\$\s?\d+(?:[.,]\d+)?/gi,'').replace(/[–-]/g,' ').replace(/\s+/g,' ').trim();

// The assistant's first-visit bubble is marked as seen so it never sits over what the test touches.
test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>{try{localStorage.setItem('tony-assistant-hint-v1','1');}catch{/* Without storage the bubble is never scheduled. */}});
});
test('search finds every album and destination, nested options open their album and contact works on a narrow phone',async({page})=>{
  test.setTimeout(120_000);
  await page.setViewportSize({width:320,height:740});await page.goto('/');
  // The old "Contactos" quick link became the header's WhatsApp pill: it opens the chat in a new tab.
  const whatsapp=page.getByRole('banner').getByRole('link',{name:'Contáctanos por WhatsApp al 7015 5571',exact:true});
  await expect(whatsapp).toBeInViewport();
  await expect(whatsapp).toHaveAttribute('href','https://wa.me/50370155571');
  await expect(whatsapp).toHaveAttribute('target','_blank');
  await expect(whatsapp).toHaveAttribute('rel',/\bnoopener\b/);
  await expect(page.getByRole('link',{name:'Contactos',exact:true})).toHaveCount(0);

  const openSearch=()=>page.getByRole('button',{name:'¿Qué buscas en específico?',exact:true}).click();
  await openSearch();
  const search=page.getByRole('dialog',{name:/QUÉ BUSCAS/});
  const field=search.getByLabel('Buscar una sección',{exact:true});
  // Nothing typed yet: starting points (quick accesses and the 13 disciplines), not the whole directory.
  await expect(search.locator('.tony-search-count')).toHaveAttribute('data-state','initial');
  await expect(search.locator('.tony-search-results')).toHaveCount(0);
  expect(await search.locator('.tony-search-quick a').evaluateAll(links=>links.map(link=>link.getAttribute('href')))).toEqual(['/configurador','/promociones','/tiendas',ORDER_LOOKUP,'/implementos','/app-tony','https://wa.me/50370155571?text=Hola%2C%20Tony.%20Necesito%20ayuda.']);
  await expect(search.locator('.tony-search-disc a')).toHaveCount(14);

  // Every imported album is indexed: typing its name finds it.
  for(const category of collections.categories){
    await field.fill(albumQuery(category.name));
    await expect(search.locator(`.tony-search-results>a[href="/colecciones?categoria=${encodeURIComponent(category.slug)}"]`),category.name).toHaveCount(1);
  }
  const destinations:[string,string,string][]=[
    ['crear pedido','Crear mi pedido','/configurador'],['carrito','Mi carrito','/carrito'],['tiendas','Tiendas','/tiendas'],
    ['lourdes','Tienda Lourdes','/tiendas?tienda=Lourdes'],['recuperar contraseña','Recuperar contraseña','/cuenta?accion=recuperar'],
    ['promociones','Promociones','/promociones'],['app tony','Descarga la App Tony','/app-tony'],['guantes','Guantes de portero','/implementos#guantes'],
    ['contactos','Contactos · WhatsApp y correo','#contactos'],
  ];
  for(const [query,name,href] of destinations){
    await field.fill(query);
    await expect(search.locator('.tony-search-results').getByRole('link',{name,exact:true}),query).toHaveAttribute('href',href);
  }
  for(const [query,name,href] of [['consulta','Consulta tu pedido',ORDER_LOOKUP],['whatsapp','Ayuda por WhatsApp',/^https:\/\/wa\.me\/50370155571\?text=/]] as const){
    await field.fill(query);
    const link=search.locator('.tony-search-results').getByRole('link',{name,exact:true});
    await expect(link,query).toHaveAttribute('href',href);await expect(link,query).toHaveAttribute('target','_blank');
  }

  // A nested confection option opens its official album.
  await field.fill('mundial anime');
  await search.getByRole('link',{name:'Uniformes Mundial Anime 2026',exact:true}).click();
  await expect(search).toBeHidden();
  await expect(page.getByLabel('Línea de producto')).toHaveValue('uniformes-mundial-anime-2026');await expect(page.locator('.collection-grid>li')).toHaveCount(1);
  await openSearch();await expect(field).toHaveValue('');await field.fill('diseños mundial');
  await search.getByRole('link',{name:'Diseños del Mundial 2026',exact:true}).click();await expect(page.getByLabel('Línea de producto')).toHaveValue('disenos-del-mundial-2026');await expect(page.locator('.collection-grid>li')).toHaveCount(1);

  // "Contactos" in the search still takes the phone to the footer contacts, on the same page.
  const before=new URL(page.url());
  await openSearch();await field.fill('contactos');
  await search.getByRole('link',{name:'Contactos · WhatsApp y correo',exact:true}).click();
  await expect(search).toBeHidden();
  const footer=page.getByRole('contentinfo');
  await expect(footer.getByRole('link',{name:/^Escríbenos por WhatsApp/})).toBeInViewport();await expect(footer.getByRole('link',{name:'info@tonysportselsalvador.com',exact:true})).toBeInViewport();
  const after=new URL(page.url());expect(after.pathname+after.search).toBe(before.pathname+before.search);expect(after.hash).toBe('#contactos');
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
