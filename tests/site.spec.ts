import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import stores from '../data/tony-stores.json';
import catalog from '../data/pedido/catalog.json';

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
const WHATSAPP=/^https:\/\/wa\.me\/50370155571(\?.*)?$/;
const DISCIPLINES=[['futbol','Fútbol'],['bkb','Baloncesto'],['voleibol','Voleibol'],['ciclismo','Ciclismo'],['runners','Running'],['racing','Racing'],['empresarial','Empresarial'],['camisas-polos','Camisas y polos'],['replicas','Réplicas'],['hoddies','Hoddies'],['implementos','Implementos'],['moldes','Moldes'],['logos-3d','Logos 3D']] as const;
const FAMILIES=[['balones','Balones de fútbol'],['futsal','Fútbol sala'],['baloncesto','Baloncesto'],['guantes','Guantes de portero'],['espinilleras','Espinilleras'],['beisbol','Béisbol'],['mallas','Mallas'],['accesorios','Accesorios']] as const;

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

test('la portada pregunta «¿Qué necesitas hoy?» y responde con botones gigantes que llevan a crear el pedido',async({page})=>{
  await page.goto('/');
  const main=page.getByRole('main');
  await expect(main.getByRole('heading',{level:1})).toHaveCount(1);
  await expect(main.getByRole('heading',{level:1})).toHaveText('¿Qué necesitas hoy?');

  // Los botones gigantes con foto.
  const bento=main.getByRole('navigation',{name:'Opciones principales'});
  await expect(bento.getByRole('link')).toHaveCount(8);
  await expect(bento.getByRole('button')).toHaveCount(1);
  const tiles:[RegExp,string][]=[[/^Crear mi pedido/,'/configurador'],[/^Promociones/,'/promociones'],[/^Uniformes/,'/producto#categoria-futbol'],[/^Camisas/,'/producto#categoria-camisas-polos'],[/^Implementos/,'/implementos'],[new RegExp(`^Tiendas ${stores.length} tiendas$`),'/tiendas']];
  for(const [name,href] of tiles)await expect(bento.getByRole('link',{name})).toHaveAttribute('href',href);
  for(const [name,href] of [[/^Consulta tu pedido/,ORDER_LOOKUP],[/^Ayuda por WhatsApp/,WHATSAPP]] as const){
    const tile=bento.getByRole('link',{name});
    await expect(tile).toHaveAttribute('href',href);await expect(tile).toHaveAttribute('target','_blank');
  }
  const appTile=bento.getByRole('button',{name:'Descarga la App Tony',exact:true});
  await appTile.click();
  const app=page.getByRole('dialog',{name:'Descarga la App Tony',exact:true});
  await expect(app.getByRole('link',{name:/Google Play/})).toHaveAttribute('href',/^https:\/\/play\.google\.com\//);
  await expect(app.getByRole('link',{name:/App Store/})).toHaveAttribute('href',/^https:\/\/apps\.apple\.com\//);
  await page.keyboard.press('Escape');await expect(app).toBeHidden();await expect(appTile).toBeFocused();

  // Las 13 disciplinas en círculos y "Ver todas".
  const disciplines=main.getByRole('region',{name:'Escoge tu disciplina deportiva'});
  await expect(disciplines.getByRole('listitem').getByRole('link')).toHaveText([...DISCIPLINES.map(([,name])=>name),'Ver todas las disciplinas']);
  for(const [id,name] of DISCIPLINES)await expect(disciplines.getByRole('link',{name,exact:true})).toHaveAttribute('href',`/producto#categoria-${id}`);
  expect(await disciplines.getByRole('link',{name:'Ver todas las disciplinas',exact:true}).evaluateAll(links=>links.map(link=>link.getAttribute('href')))).toEqual(['/producto','/producto']);

  // Siete diseños reales que abren el pedido con ese diseño elegido: cuatro de fútbol y luego uno de voleibol, uno de
  // baloncesto y uno empresarial. La octava tarjeta completa la rejilla y lleva al catálogo completo.
  const designCards=main.getByRole('region',{name:'Diseños para tu equipo'}).getByRole('listitem').getByRole('link');
  await expect(designCards).toHaveCount(8);
  const picked=await designCards.evaluateAll(links=>links.map(link=>({href:link.getAttribute('href'),name:link.textContent?.replace(/\s+/g,' ').trim()??'',image:link.querySelector('img')?.getAttribute('src')??''})));
  const lines=picked.slice(0,7).map(design=>{
    const code=/^Personalizar el diseño (TONY-(\d{3})) (Fútbol|Voleibol|Baloncesto|Empresarial)$/.exec(design.name);
    expect(code,design.name).not.toBeNull();
    expect(design.href).toBe(`/configurador?diseno=${code![1]}`);
    expect(design.image).toContain(`tony-${code![2]}`);
    expect(catalog.designs.find(item=>item.code===code![1])?.category).toBe(code![3]);
    return code![3];
  });
  expect(lines).toEqual(['Fútbol','Fútbol','Fútbol','Fútbol','Voleibol','Baloncesto','Empresarial']);
  expect(new Set(picked.slice(0,7).map(design=>design.href)).size).toBe(7);
  expect(picked[7].href).toBe('/configurador');
  expect(picked[7].name).toBe(`Ver los ${catalog.designs.length} diseños 4 líneas: Fútbol, Voleibol, Baloncesto, Empresarial`);

  // Las ocho familias de implementos, cada una en su sección de /implementos.
  const implementsRegion=main.getByRole('region',{name:'Implementos deportivos'});
  await expect(implementsRegion.getByRole('listitem').getByRole('link')).toHaveText(FAMILIES.map(([,name])=>name));
  for(const [id,name] of FAMILIES)await expect(implementsRegion.getByRole('link',{name,exact:true})).toHaveAttribute('href',`/implementos#${id}`);
  await expect(main.getByRole('region',{name:'Promociones Tony'}).getByRole('link')).toHaveAttribute('href','/promociones');

  // La portada anterior (hero, índices 01–08, tutorial, preguntas, cifras sociales, accesos a reseñas y recientes) ya no existe.
  await expect(main.locator('.hero, .section-index, #como-funciona, #tutorial, #preguntas, details, .social-community, .home-client-hub')).toHaveCount(0);
  await expect(main.locator('a[href="/catalogo"], a[href="/recientes"], a[href="/resenas"]')).toHaveCount(0);

  const create=page.getByRole('banner').getByRole('link',{name:'Crear pedido',exact:true});
  await expect(create).toBeVisible();await expect(create).toHaveAttribute('href','/configurador');
  await bento.getByRole('link',{name:/^Crear mi pedido/}).click();
  // El servidor de desarrollo puede estar compilando el pedido: espera automática acotada, no una pausa.
  await expect(page).toHaveURL(/\/configurador$/,{timeout:15_000});
  await expect(page.getByRole('button',{name:'CREAR MI PEDIDO ↗',exact:true})).toBeVisible();
  // Dentro del configurador el encabezado no repite "Crear pedido".
  await expect(create).toHaveCount(0);
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
