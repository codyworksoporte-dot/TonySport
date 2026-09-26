import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const sectionRoutes = ['/producto', '/lineas', '/calidad', '/tiendas', '/entregas', '/patrocinio', '/comunidad', '/actualidad', '/tony-news', '/resenas', '/recientes', '/carrito'];
const lines = [
  ['futbol', 'Fútbol'], ['baloncesto', 'Baloncesto'], ['voleibol', 'Voleibol'],
  ['running', 'Running'], ['ciclismo', 'Ciclismo'], ['racing', 'Racing'],
  ['empresarial', 'Empresarial'], ['casual', 'Camisas y polos'], ['implementos', 'Implementos'],
] as const;

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

function lineTab(page: Page, name: string) {
  return page.getByRole('tablist', { name: 'Líneas Tony', exact: true }).getByRole('tab', { name: new RegExp(name) });
}

test('las nuevas secciones cargan, tienen enlaces internos válidos y no presentan barreras WCAG detectadas', async ({ page, request }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  const destinations = new Set<string>();
  page.on('pageerror', error => errors.push(error.message));
  for (const route of sectionRoutes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const links = await page.locator('a[href]').evaluateAll(anchors => anchors.flatMap(anchor => {
      const url = new URL((anchor as HTMLAnchorElement).href);
      return url.origin === location.origin && !url.pathname.startsWith('/_next/') ? [url.pathname] : [];
    }));
    links.forEach(path => destinations.add(path));
    const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect.soft(scan.violations, `${route}: ${JSON.stringify(scan.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })))}`).toEqual([]);
  }
  for (const destination of destinations) {
    const response = await request.get(destination);
    expect(response.status(), `Destino interno ${destination}`).toBe(200);
  }
  expect(errors).toEqual([]);
});

test('el explorador conserva la línea del enlace y permite recorrer las pestañas con teclado', async ({ page }) => {
  await page.goto('/lineas#baloncesto');
  const basketball = lineTab(page, 'Baloncesto');
  await expect(basketball).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toHaveAccessibleName(/Baloncesto/);
  await page.reload();
  await expect(basketball).toHaveAttribute('aria-selected', 'true');
  await basketball.focus();
  await page.keyboard.press('ArrowDown');
  await expect(lineTab(page, 'Voleibol')).toBeFocused();
  await expect(lineTab(page, 'Voleibol')).toHaveAttribute('aria-selected', 'true');
  await expect(page).toHaveURL(/\/lineas#voleibol$/);
  await page.keyboard.press('End');
  await expect(lineTab(page, 'Implementos')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(lineTab(page, 'Fútbol')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(lineTab(page, 'Implementos')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(lineTab(page, 'Fútbol')).toBeFocused();
  await expect(page.getByRole('tab', { selected: true })).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Conoce los acabados' })).toBeFocused();
  await page.evaluate(() => { window.location.hash = 'ciclismo'; });
  await expect(lineTab(page, 'Ciclismo')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toHaveAccessibleName(/Ciclismo/);
  await page.goto('/lineas#una-linea-inexistente');
  await expect(lineTab(page, 'Fútbol')).toHaveAttribute('aria-selected', 'true');
});

test('las líneas preparan consultas específicas y la entrada al editor se concentra en Inicio', async ({ page }) => {
  await page.goto('/lineas');
  const panel = page.getByRole('tabpanel');
  for (const [id, name] of lines) {
    await lineTab(page, name).click();
    await expect(page).toHaveURL(new RegExp(`/lineas#${id}$`));
    await expect(panel).toHaveAccessibleName(new RegExp(name));
    const consultation = panel.getByRole('link', { name: 'Consultar esta línea' });
    const url = new URL((await consultation.getAttribute('href'))!);
    expect(url.origin).toBe('https://wa.me');
    expect(url.pathname).toBe('/50370155571');
    expect(url.searchParams.get('text')).toContain(`línea ${name}`);
    await expect(consultation).toHaveAttribute('target', '_blank');
    await expect(page.locator('a[href^="/configurador"]')).toHaveCount(0);
  }
  await page.goto('/');
  await page.locator('.hero').getByRole('link', { name: 'Crea tu uniforme' }).click();
  await expect(page.getByRole('button', {name: 'CREAR MI PEDIDO ↗', exact: true})).toBeVisible();
});

test('Producto concentra el explorador que antes estaba en Inicio y conserva los enlaces por línea', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#lineas-tony')).toHaveCount(0);
  await page.locator('.hero').getByRole('link',{name:'Explora Producto'}).click();
  await expect(page).toHaveURL(/\/producto$/);
  const explorer = page.locator('#lineas-tony');
  await explorer.getByRole('tab', { name: /Empresarial/ }).click();
  await expect(explorer.getByRole('tabpanel')).toHaveAccessibleName(/Empresarial/);
  await expect(page).toHaveURL(/\/producto#empresarial$/);
  const consultation = explorer.getByRole('link', { name: 'Consultar esta línea' });
  expect(new URL((await consultation.getAttribute('href'))!).searchParams.get('text')).toContain('Empresarial');
  await page.reload();
  await expect(explorer.getByRole('tab', { name: /Empresarial/ })).toHaveAttribute('aria-selected','true');
  await expect(page.locator('a[href^="/configurador"]')).toHaveCount(0);
});

test('los menús separan Producto, Somos Tony y Para ti y mantienen búsqueda y teclado', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const nav = page.locator('.tony-nav');
  await expect(nav.getByRole('button', { name: 'Líneas', exact: true })).toHaveCount(0);
  await expect(nav.getByRole('button', { name: 'Universo Tony', exact: true })).toHaveCount(0);
  await expect(nav.getByRole('link',{name:'Tony News'})).toHaveAttribute('href','/tony-news');
  for(const [label,id] of [['Producto','product'],['Somos Tony','company'],['Para ti','customer']]){
    const trigger=nav.getByRole('button',{name:label,exact:true});
    await trigger.focus();await page.keyboard.press('ArrowDown');
    const menu=page.locator(`#tony-${id}-menu`);
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('link').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();await expect(menu).toBeHidden();
  }
  await nav.getByRole('button',{name:'Producto',exact:true}).click();
  const product=page.locator('#tony-product-menu');
  await expect(product.locator('.tony-product-menu-links a')).toHaveCount(13);
  await product.getByRole('link',{name:'Logos 3D',exact:false}).click();
  await expect(page).toHaveURL(/\/producto#categoria-logos-3d$/);
  await expect(page.locator('#categoria-logos-3d')).toHaveAttribute('open','');
  await expect(product).toBeHidden();
  await nav.getByRole('button',{name:'Somos Tony',exact:true}).click();
  const company=page.locator('#tony-company-menu');
  for(const route of ['/nosotros','/patrocinio','/comunidad'])await expect(company.locator(`a[href="${route}"]`).first()).toBeVisible();
  await expect(company).toContainText('TonyPlay');
  await expect(company.locator('a[href="/tiendas"],a[href="/contacto"]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await nav.getByRole('button',{name:'Para ti',exact:true}).click();
  const customer=page.locator('#tony-customer-menu');
  for(const route of ['/calidad','/actualidad','/tiendas','/entregas','/contacto','/resenas','/recientes'])await expect(customer.locator(`a[href="${route}"]`).first()).toBeVisible();
  await expect(customer).not.toContainText('7015');
  await customer.locator('a[href="/tiendas"]').click();
  await expect(page).toHaveURL(/\/tiendas$/);
  await expect(customer).toBeHidden();
  await page.getByRole('button', { name: 'Buscar en el sitio' }).click();
  await page.getByRole('searchbox',{name:'Buscar una sección',exact:true}).fill('noexistexyz');
  await expect(page.locator('.tony-search-count')).toHaveAttribute('data-state','empty');
  await page.getByRole('button',{name:'Ver puntos de partida'}).click();
  await expect(page.getByRole('searchbox',{name:'Buscar una sección',exact:true})).toBeFocused();
  await page.getByRole('searchbox',{name:'Buscar una sección',exact:true}).fill('baloncesto');
  await expect(page.locator('.tony-search-count')).toHaveAttribute('data-state','found');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('dialog').getByRole('link',{name:'Baloncesto',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/producto#baloncesto$/);
  await expect(lineTab(page, 'Baloncesto')).toHaveAttribute('aria-selected','true');
  // Same-page fragments must update both illustration and address.
  await page.locator('footer').getByRole('link', { name:'Fútbol',exact:true }).click();
  await expect(lineTab(page, 'Fútbol')).toHaveAttribute('aria-selected','true');
  await page.goBack();
  await expect(lineTab(page, 'Baloncesto')).toHaveAttribute('aria-selected','true');
});

test('el directorio de Producto mantiene categorías, variantes y consultas sin precios del catálogo anterior',async({page})=>{
  await page.goto('/producto#categoria-futbol');
  const categories=page.locator('.product-category');
  await expect(categories).toHaveCount(13);
  await expect(page.locator('.product-category summary h3')).toHaveText([
    'Confección de uniformes de fútbol','Camisas deportivas y tipo polo','Línea Ciclismo','Diferentes réplicas','Uniformes BKB','Uniformes de Voleibol','Línea Racing','Línea Empresarial','Línea Runners','Moldes de fútbol','Logos 3D Alto Relieve','Implementos Deportivos','Hoddies',
  ]);
  await expect(page.locator('.product-category-body li')).toHaveCount(24);
  await expect(page.locator('#categoria-futbol')).toHaveAttribute('open','');
  await expect(page.locator('#categoria-futbol')).toContainText('Uniformes Juveniles');
  await expect(page.locator('#categoria-futbol')).toContainText('Mundial Anime 2026');
  const polos=page.locator('#categoria-camisas-polos');
  await polos.locator('summary').click();
  const premium=polos.getByRole('link',{name:'Consultar Camisas Línea Premium por WhatsApp',exact:true});
  const inquiry=new URL((await premium.getAttribute('href'))!);
  expect(inquiry.origin).toBe('https://wa.me');
  expect(inquiry.searchParams.get('text')).toContain('Camisas Línea Premium');
  await expect(premium).toHaveAttribute('target','_blank');
  await expect(page.locator('#directorio-producto')).not.toContainText('$');
  await page.evaluate(()=>{location.hash='opcion-racing-2';});
  await expect(page.locator('#categoria-racing')).toHaveAttribute('open','');
  await expect(page.locator('#opcion-racing-2')).toBeVisible();
  await expect(page.locator('#opcion-racing-2')).toContainText('Racing Motorcycle');
});

test('el directorio busca sin tildes, combina filtros y ofrece contactos de la tienda encontrada', async ({ page }) => {
  await page.goto('/tiendas');
  const search = page.getByRole('searchbox', { name: 'Encuentra tu tienda', exact: true });
  const filters = page.getByRole('group', { name: 'Filtrar tiendas por zona' });
  const stores = page.locator('.te-store-list article');
  await expect(stores).toHaveCount(13);
  await search.fill('usulutan');
  await expect(stores).toHaveCount(1);
  await expect(stores.getByRole('heading', { level: 3 })).toHaveText('Usulután');
  await search.fill('');
  await filters.getByRole('button', { name: 'Occidente', exact: true }).click();
  await expect(stores).toHaveCount(2);
  await search.fill('san miguel');
  await expect(stores).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Prueba con otra ciudad.' })).toBeVisible();
  await page.getByRole('button', { name: 'Mostrar todas las tiendas' }).click();
  await expect(search).toHaveValue('');
  await expect(filters.getByRole('button', { name: 'Todas', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(stores).toHaveCount(13);
  await search.fill('SAN MIGUEL');
  // Search includes the address: Chapeltique also publishes "San Miguel".
  await expect(stores).toHaveCount(2);
  const sanMiguel = stores.filter({has:page.getByRole('heading',{name:'San Miguel',exact:true})});
  await expect(sanMiguel.getByRole('link', { name: /7656-5837/ })).toHaveAttribute('href', 'tel:+50376565837');
  await expect(sanMiguel.getByRole('link', { name: 'Ver ubicación' })).toHaveAttribute('href', 'https://goo.gl/maps/sSw5AVgG7pWfXYTz5');
  const message = new URL((await sanMiguel.getByRole('link', { name: 'Consultar por WhatsApp' }).getAttribute('href'))!);
  expect(message.pathname).toBe('/50376565837');
  expect(message.searchParams.get('text')).toContain('San Miguel');
});

test('la guía permite comparar técnicas manteniendo la confirmación previa a producción', async ({ page }) => {
  await page.goto('/calidad');
  const techniques = page.getByRole('group', { name: 'Explorar técnicas de personalización' });
  await techniques.getByRole('button', { name: /Bordado/ }).click();
  await expect(techniques.getByRole('button', { name: /Bordado/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(techniques.getByRole('button', { name: /Full sublimado/ })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('heading', { name: 'Un relieve que se reconoce.' })).toBeVisible();
  await expect(page.locator('.te-technique-copy')).toContainText('colores de hilo');
  await techniques.getByRole('button', { name: /Full sublimado/ }).click();
  await expect(page.getByRole('heading', { name: 'La prenda como lienzo.' })).toBeVisible();
  await expect(page.locator('.te-technique-copy')).toContainText('antes de aprobar el arte');
  await expect(page.locator('a[href^="/configurador"]')).toHaveCount(0);
});

test('la propuesta de patrocinio valida, enfoca el error y prepara los datos antes de compartir', async ({ page }) => {
  await page.goto('/patrocinio');
  const review = page.getByRole('button', { name: 'Revisar mi propuesta' });
  await review.click();
  await expect(page.locator('#te-proposal-club')).toBeFocused();
  await expect(page.locator('#te-proposal-club')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#te-proposal-club').fill('Academia Ñandú');
  await page.locator('#te-proposal-sport').selectOption('Voleibol');
  await page.locator('#te-proposal-location').fill('Santa Ana');
  await page.locator('#te-proposal-category').selectOption('Juvenil');
  await page.locator('#te-proposal-players').fill('0');
  await page.locator('#te-proposal-contact').fill('academia@example.test');
  await page.locator('#te-proposal-idea').fill('Queremos presentar el proyecto del equipo juvenil y consultar una colaboración.');
  await review.click();
  await expect(page.locator('#te-proposal-players')).toBeFocused();
  await expect(page.getByRole('link', { name: 'Abrir propuesta en WhatsApp' })).toHaveCount(0);
  await page.locator('#te-proposal-players').fill('18');
  await review.click();
  await expect(page.getByRole('heading', { name: 'Revísala. Después, conversemos.' })).toBeFocused();
  await expect(page.getByText('Todavía no se ha enviado.', { exact: false })).toBeVisible();
  const proposal = page.locator('.te-proposal-review');
  const whatsapp = new URL((await proposal.getByRole('link', { name: 'Abrir propuesta en WhatsApp' }).getAttribute('href'))!);
  const email = new URL((await proposal.getByRole('link', { name: 'Preparar correo' }).getAttribute('href'))!);
  expect(whatsapp.origin).toBe('https://wa.me');
  expect(whatsapp.pathname).toBe('/50370155571');
  expect(email.protocol).toBe('mailto:');
  expect(email.pathname).toBe('info@tonysportselsalvador.com');
  for (const value of ['Academia Ñandú', 'Voleibol', 'Santa Ana', 'Juvenil', '18', 'academia@example.test', 'equipo juvenil']) {
    await expect(proposal).toContainText(value);
    expect(whatsapp.searchParams.get('text')).toContain(value);
    expect(email.searchParams.get('body')).toContain(value);
  }
  await proposal.getByRole('button', { name: 'Volver a editar' }).click();
  await expect(page.locator('#te-proposal-club')).toHaveValue('Academia Ñandú');
  await expect(page.locator('#te-proposal-players')).toHaveValue('18');
  await expect(page.locator('#te-proposal-idea')).toHaveValue('Queremos presentar el proyecto del equipo juvenil y consultar una colaboración.');
});

test('todas las secciones y sus estados móviles caben a 320 y 390 píxeles', async ({ page }) => {
  test.setTimeout(120_000);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of sectionRoutes) {
      await page.goto(route);
      await expect(page.locator('main h1')).toBeVisible();
      if (route === '/lineas') await lineTab(page, 'Camisas y polos').click();
      if (route === '/producto') {await lineTab(page, 'Camisas y polos').click();await page.locator('#categoria-futbol summary').click();}
      if (route === '/calidad') await page.getByRole('group', { name: 'Explorar técnicas de personalización' }).getByRole('button', { name: /Bordado/ }).click();
      if (route === '/tiendas') await page.getByRole('searchbox', { name: 'Encuentra tu tienda', exact: true }).fill('Santa Ana');
      if (route === '/patrocinio') await page.getByRole('button', { name: 'Revisar mi propuesta' }).click();
      if (route === '/resenas') await page.getByRole('button', { name: 'Revisar mi reseña' }).click();
      const size = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, screen: innerWidth }));
      expect(size.content, `${route} en ${width}px`).toBeLessThanOrEqual(size.screen);
    }
    await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
    const menu = page.getByRole('dialog', { name: 'Menú de Tony Sportswear' });
    await expect(menu.getByRole('button', { name: /Líneas/ })).toHaveCount(0);
    await expect(menu.getByRole('button',{name:/Universo Tony/})).toHaveCount(0);
    await menu.getByRole('button',{name:/Producto/}).click();
    await expect(menu.getByRole('link',{name:'Explorar Producto',exact:false})).toBeVisible();
    await expect(menu.getByRole('link',{name:'Logos 3D',exact:true})).toBeVisible();
    await menu.getByRole('button',{name:/Para ti/}).click();
    await expect(menu.getByRole('link',{name:'Reseñas',exact:true})).toBeVisible();
    await expect(menu.locator('#tony-mobile-customer').getByRole('link',{name:'Recientes',exact:true})).toBeVisible();
    await menu.getByRole('button',{name:/Somos Tony/}).click();
    await menu.getByRole('link',{name:'Comunidad, App y TonyPlay',exact:true}).click();
    await expect(page).toHaveURL(/\/comunidad$/);
    await expect(menu).toBeHidden();
    await expect(page.locator('#tonyplay')).toContainText('EN DESARROLLO');
    const size = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, screen: innerWidth }));
    expect(size.content, `Comunidad abierta desde menú en ${width}px`).toBeLessThanOrEqual(size.screen);
  }
});
