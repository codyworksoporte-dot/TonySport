import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import stores from '../data/tony-stores.json';

// La entrada animada se prueba por separado (intro.spec.ts); aquí se revisa el contenido estable.
// La burbuja de bienvenida del asistente (solo en la primera visita) se da por vista para que no tape lo que se toca.
test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>{try{localStorage.setItem('tony-assistant-hint-v1','1');}catch{/* Sin almacenamiento la burbuja no se programa. */}});
});

const WCAG=['wcag2a','wcag2aa','wcag21aa','wcag22aa'];
// La portada, Preguntas frecuentes y Contáctanos del rediseño, y rutas que siguen activas: el catálogo (fuera de la
// navegación, lo usa el pedido) y el configurador. Las páginas nuevas del brief se revisan en redesign.spec.ts.
const ROUTES=['/','/ayuda','/contacto','/nosotros','/catalogo','/configurador'];
const ORDER_LOOKUP='https://www.tonysportselsalvador.com/sistema/consulta_ts/';
const DISCIPLINES=[['futbol','Fútbol'],['bkb','Baloncesto'],['voleibol','Voleibol'],['ciclismo','Ciclismo'],['runners','Running'],['racing','Racing'],['empresarial','Empresarial'],['camisas-polos','Camisas y polos'],['replicas','Réplicas'],['hoddies','Hoddies'],['implementos','Implementos'],['moldes','Moldes'],['logos-3d','Logos 3D']] as const;

test('páginas navegables sin errores de hidratación ni barreras WCAG detectadas',async({page})=>{
  test.setTimeout(90_000);
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'&&/hydrat/i.test(message.text()))errors.push(message.text());});
  for(const route of ROUTES){
    const response=await page.goto(route);expect(response?.status(),route).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
    // Cada página lleva el encabezado nuevo: la búsqueda grande y el contacto por WhatsApp.
    const banner=page.getByRole('banner');
    await expect(banner.getByRole('button',{name:'¿Qué buscas en específico?',exact:true}),route).toBeVisible();
    await expect(banner.getByRole('link',{name:'Contáctanos por WhatsApp al 7015 5571',exact:true}),route).toBeVisible();
    await page.evaluate(()=>document.fonts.ready);
    const scan=await new AxeBuilder({page}).withTags(WCAG).analyze();
    expect(scan.violations,`${route}: ${JSON.stringify(scan.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})))}`).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test('menú móvil, búsqueda, Escape, preguntas frecuentes y página no encontrada',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');
  const menuButton=page.getByRole('button',{name:'Abrir menú',exact:true});
  await menuButton.click();
  const menu=page.getByRole('dialog',{name:'Menú de Tony Sportswear'});
  await expect(menu.getByRole('navigation',{name:'Navegación principal',exact:true})).toBeVisible();
  await expect(menuButton).toHaveAttribute('aria-expanded','true');
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(menuButton).toBeFocused();await expect(menuButton).toHaveAttribute('aria-expanded','false');

  // "Buscar en el sitio" dio paso a la píldora "¿Qué buscas en específico?", que en el teléfono ocupa la fila bajo el encabezado.
  await expect(page.getByRole('button',{name:'Buscar en el sitio'})).toHaveCount(0);
  await page.getByRole('button',{name:'¿Qué buscas en específico?',exact:true}).click();
  const search=page.getByRole('dialog',{name:'¿QUÉ BUSCAS EN ESPECÍFICO?',exact:true});
  const field=search.getByRole('searchbox',{name:'Buscar una sección',exact:true});
  const count=search.locator('.tony-search-count');
  await expect(field).toBeFocused();
  // Una palabra sin resultados lo dice y ofrece volver a los puntos de partida.
  await field.fill('zzz');
  await expect(count).toHaveAttribute('data-state','empty');
  await expect(search).toContainText('No encontramos “zzz”');
  await search.getByRole('button',{name:'Ver puntos de partida'}).click();
  await expect(field).toHaveValue('');await expect(field).toBeFocused();
  await expect(count).toHaveAttribute('data-state','initial');
  await expect(search.getByRole('heading',{name:'Accesos rápidos',exact:true})).toBeVisible();
  await field.fill('preguntas');
  await expect(count).toHaveAttribute('data-state','found');
  await search.getByRole('link',{name:'Preguntas frecuentes',exact:true}).click();
  await expect(page).toHaveURL(/\/ayuda$/);await expect(search).toBeHidden();

  // Las preguntas frecuentes ya no están en la portada: viven en /ayuda.
  await expect(page.getByRole('heading',{level:1})).toContainText('Preguntas');
  const sizes=page.locator('details').filter({hasText:'¿Cómo elijo la talla y el molde?'});
  await expect(sizes).not.toHaveAttribute('open');
  await sizes.getByText('¿Cómo elijo la talla y el molde?',{exact:true}).click();
  await expect(sizes).toHaveAttribute('open','');
  await expect(sizes.getByRole('link',{name:/telas, técnicas/})).toBeVisible();

  const missing=await page.goto('/esta-pagina-no-existe');expect(missing?.status()).toBe(404);
  await expect(page.getByRole('heading',{level:1})).toContainText('SE NOS ESCAPÓ');
});

test('la portada prioriza el pedido y reúne tienda, promociones y descargas', async ({page}) => {
  await page.goto('/');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', {level: 1})).toHaveText('Crear mi pedido');
  await expect(main.getByRole('link', {name: 'Empezar mi pedido'})).toHaveAttribute('href', '/configurador');
  const ways = main.getByRole('region', {name: 'Tres formas de hacer tu pedido'});
  expect(await ways.getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href'))))
    .toEqual(['/configurador', '/tienda', '/promociones']);
  const disciplines = main.getByRole('region', {name: 'Escoge tu disciplina deportiva'});
  for (const [id,name] of DISCIPLINES) await expect(disciplines.getByRole('link',{name,exact:true})).toHaveAttribute('href', '/producto#categoria-' + id);
  await expect(main.getByRole('heading', {name: /Diseños para tu equipo|Implementos deportivos/})).toHaveCount(0);
  await expect(main.getByRole('link', {name: 'Android'})).toHaveAttribute('href', /^https:\/\/play\.google\.com\//);
  await expect(main.getByRole('link', {name: 'iOS', exact: true})).toHaveAttribute('href', /^https:\/\/apps\.apple\.com\//);
  const strip = main.getByRole('region', {name: 'Promociones destacadas'});
  await expect(strip.getByRole('heading')).toContainText('Black Friday');
  await strip.getByRole('button', {name: 'Promoción siguiente'}).click();
  await expect(strip).toContainText('12 uniformes de la línea Slim Fit');
  await strip.getByRole('button', {name: 'Promoción anterior'}).click();
  await expect(strip.getByRole('heading')).toContainText('Black Friday');
});

test('una sesión anterior conserva únicamente sus anuncios pendientes vigentes', async ({page}) => {
  await page.addInitScript(() => {
    const key = 'tony:inicio:carteles:v2';
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, JSON.stringify(['replicas', 'personalizados', 'domicilio', 'premios', 'tiendas']));
    }
  });
  await page.goto('/');
  const ad = page.getByRole('dialog', {name: 'Anuncios de Tony'});
  await expect(ad.getByRole('link')).toHaveAccessibleName(/personalizá el uniforme/i);
  await ad.getByRole('button', {name: 'Cerrar anuncio'}).click();
  await page.reload();
  await expect(ad.getByRole('link')).toHaveAccessibleName(/canjeá tus puntos/i);
  await ad.getByRole('button', {name: 'Cerrar anuncio'}).click();
  await expect(ad).toHaveCount(0);
  await expect(page.getByRole('link', {name: 'Empezar mi pedido'})).toBeFocused();
  await page.reload();
  await expect(page.getByRole('region', {name: 'Promociones destacadas'})).toBeVisible();
  await expect(ad).toHaveCount(0);
});

test('el pie reúne el contacto, tres columnas cortas y la línea legal',async({page})=>{
  await page.goto('/');
  const footer=page.getByRole('contentinfo');
  const contact=footer.locator('#contactos');
  await expect(contact.getByRole('link',{name:/^Escríbenos por WhatsApp 7015-5571/})).toHaveAttribute('href','https://wa.me/50370155571');
  await expect(contact.getByRole('link',{name:'info@tonysportselsalvador.com',exact:true})).toHaveAttribute('href','mailto:info@tonysportselsalvador.com');
  const columns:[string,[string|RegExp,string][]][]=[
    ['Tienda',[['Escoge tu disciplina','/producto'],['Implementos','/implementos'],['Promociones','/promociones'],['Crear pedido','/configurador']]],
    ['Tony',[['Nuestra historia','/nosotros'],['Patrocinios','/patrocinio'],['Calidad','/calidad'],['Tony News','/tony-news'],['App Tony','/app-tony']]],
    ['Ayuda',[[/^Consulta tu pedido/,ORDER_LOOKUP],['Tiendas','/tiendas'],['Preguntas frecuentes','/ayuda'],['Contacto','/contacto'],['Mi cuenta','/cuenta']]],
  ];
  for(const [title,links] of columns){
    const column=footer.getByRole('navigation',{name:title,exact:true});
    await expect(column.getByRole('heading',{name:title,exact:true})).toBeVisible();
    await expect(column.getByRole('link')).toHaveCount(links.length);
    for(const [name,href] of links)await expect(column.getByRole('link',{name,exact:typeof name==='string'})).toHaveAttribute('href',href);
  }
  await expect(footer.getByRole('navigation',{name:'Ayuda',exact:true}).getByRole('link',{name:/^Consulta tu pedido/})).toHaveAttribute('target','_blank');
  const legal=footer.getByRole('navigation',{name:'Información y condiciones'});
  await expect(legal.getByRole('link')).toHaveText(['Privacidad','Términos','Cookies']);
  expect(await legal.getByRole('link').evaluateAll(links=>links.map(link=>link.getAttribute('href')))).toEqual(['/privacidad','/terminos','/cookies']);
  await expect(footer.getByRole('img',{name:'Bandera de El Salvador'})).toBeVisible();
  await expect(page.locator('.tony-footer-invitation')).toHaveCount(0);
});

test('sin desbordamiento horizontal en móvil y con movimiento reducido',async({page})=>{
  test.setTimeout(150_000);
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:900});
    for(const route of ROUTES){
      await page.goto(route);await expect(page.locator('main')).toBeVisible();
      // La fila del encabezado cabe completa: el botón del menú nunca queda fuera de la pantalla.
      await expect(page.getByRole('button',{name:'Abrir menú',exact:true}),`${route} en ${width}px`).toBeInViewport({ratio:1});
      const sizes=await page.evaluate(()=>({content:document.documentElement.scrollWidth,screen:innerWidth}));
      expect(sizes.content,`${route} en ${width}px`).toBeLessThanOrEqual(sizes.screen);
    }
  }
});
