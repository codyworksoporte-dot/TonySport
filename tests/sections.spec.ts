import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const ORDER_LOOKUP = 'https://www.tonysportselsalvador.com/sistema/consulta_ts/';
const SEARCH_LABEL = '¿Qué buscas en específico?';

// /resenas, /recientes and /carrito left the navigation but still serve the order flow, so they keep rendering.
const sectionRoutes = ['/producto', '/lineas', '/implementos', '/promociones', '/consulta', '/entregas', '/app-tony', '/calidad', '/tiendas', '/patrocinio', '/comunidad', '/actualidad', '/tony-news', '/resenas', '/recientes', '/carrito'];
// Main heading of each public section.
const headings: Record<string, string> = {
  '/producto': 'Escoge tu disciplina deportiva', '/lineas': 'Escoge tu disciplina deportiva', '/implementos': 'Implementos deportivos',
  '/promociones': 'Promociones', '/consulta': 'Consulta tu pedido', '/entregas': 'Servicio a domicilio', '/app-tony': 'App Tony', '/tiendas': 'Tiendas',
};
// "Escoge tu disciplina deportiva": the 13 lines, in the order of every discipline grid and of the /producto sections.
const disciplines = [
  ['futbol', 'Fútbol'], ['bkb', 'Baloncesto'], ['voleibol', 'Voleibol'], ['ciclismo', 'Ciclismo'], ['runners', 'Running'],
  ['racing', 'Racing'], ['empresarial', 'Empresarial'], ['camisas-polos', 'Camisas y polos'], ['replicas', 'Réplicas'],
  ['hoddies', 'Hoddies'], ['implementos', 'Implementos'], ['moldes', 'Moldes'], ['logos-3d', 'Logos 3D'],
] as const;
const disciplineNames = disciplines.map(([, name]) => name);
const disciplineHrefs = disciplines.map(([id]) => id === 'implementos' ? '/implementos' : `/producto/${id}`);
const implementFamilies = [
  ['balones', 'Balones de fútbol'], ['futsal', 'Fútbol sala'], ['baloncesto', 'Baloncesto'], ['guantes', 'Guantes de portero'],
  ['espinilleras', 'Espinilleras'], ['beisbol', 'Béisbol'], ['mallas', 'Mallas'], ['accesorios', 'Accesorios'],
] as const;

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => sessionStorage.setItem('tony:inicio:carteles:v2', '[]'));
});

async function expectScope(page: Page, path: string, title: string | RegExp) {
  await expect(page).toHaveURL(new URL(path, page.url()).href);
  await expect(page.getByRole('heading', { name: title, exact: true, level: 1 })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Disciplinas', exact: true })).toHaveCount(0);
}

/** Every picture inside `scope` is a real image served by the site. */
async function expectImagesServed(page: Page, scope: Locator) {
  const sources = await scope.locator('img').evaluateAll(images => [...new Set(images.map(image => (image as HTMLImageElement).src))]);
  expect(sources.length).toBeGreaterThan(0);
  for (const source of sources) {
    const response = await page.request.get(source);
    expect(response.status(), source).toBe(200);
    expect(response.headers()['content-type'], source).toMatch(/^image\//);
  }
}

async function expectNoAxeViolations(page: Page, label: string, include?: string) {
  const builder = new AxeBuilder({ page }).withTags(WCAG);
  if (include) builder.include(include);
  const scan = await builder.analyze();
  expect.soft(scan.violations, `${label}: ${JSON.stringify(scan.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })))}`).toEqual([]);
}

async function expectFits(page: Page, label: string) {
  const size = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, screen: innerWidth }));
  expect(size.content, label).toBeLessThanOrEqual(size.screen);
}

test('las secciones cargan, tienen enlaces internos válidos y no presentan barreras WCAG detectadas', async ({ page, request }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  const destinations = new Set<string>();
  page.on('pageerror', error => errors.push(error.message));
  for (const route of sectionRoutes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
    if (headings[route]) await expect(page.locator('main h1'), route).toHaveText(headings[route]);
    // TonyPlay left Comunidad with the redesign.
    if (route === '/comunidad') await expect(page.locator('main')).not.toContainText(/TonyPlay/i);
    await page.evaluate(() => document.fonts.ready);
    const links = await page.locator('a[href]').evaluateAll(anchors => anchors.flatMap(anchor => {
      const url = new URL((anchor as HTMLAnchorElement).href);
      return url.origin === location.origin && !url.pathname.startsWith('/_next/') ? [url.pathname] : [];
    }));
    links.forEach(path => destinations.add(path));
    // /resenas, /recientes and /catalogo still render, but the site chrome (header, menu, search, footer) no longer offers them.
    const retired = await page.locator('a[href]:not([href^="#"])').evaluateAll(anchors => anchors
      .filter(anchor => !anchor.closest('main'))
      .map(anchor => new URL((anchor as HTMLAnchorElement).href).pathname)
      .filter(path => ['/resenas', '/recientes', '/catalogo'].includes(path)));
    expect(retired, `${route}: la navegación no enlaza rutas retiradas`).toEqual([]);
    await expectNoAxeViolations(page, route);
  }
  for (const destination of destinations) {
    const response = await request.get(destination);
    expect(response.status(), `Destino interno ${destination}`).toBe(200);
  }
  expect(errors).toEqual([]);
});

test('Líneas muestra las 13 disciplinas como botones con foto que abren su sección de Producto', async ({ page }) => {
  await page.goto('/lineas');
  const main = page.locator('main');
  // The old LineExplorer tabs are gone: one grid of picture buttons replaces them.
  await expect(page.getByRole('tablist')).toHaveCount(0);
  const grid = main.getByRole('list', { name: 'Disciplinas', exact: true });
  const tiles = grid.getByRole('link');
  await expect(tiles).toHaveText(disciplineNames);
  for (const [index, href] of disciplineHrefs.entries()) await expect(tiles.nth(index)).toHaveAttribute('href', href);
  await expect(grid.locator('img[alt=""]')).toHaveCount(13);
  await expectImagesServed(page, grid);
  // The keyboard follows the grid order and Enter opens the chosen section.
  await tiles.first().focus();
  await page.keyboard.press('Tab');
  await expect(tiles.nth(1)).toBeFocused();
  await page.keyboard.press('Enter');
  await expectScope(page, '/producto/bkb', 'Baloncesto');
  await page.goBack();
  await grid.getByRole('link', { name: 'Racing', exact: true }).click();
  await expectScope(page, '/producto/racing', 'Racing');
});

test('Producto ordena 13 secciones de tarjetas con foto, sin precios ni botones del catálogo anterior', async ({ page }) => {
  await page.goto('/producto');
  const main = page.locator('main');
  const sections = main.locator('section[id^="categoria-"]');
  await expect(sections).toHaveCount(13);
  expect(await sections.evaluateAll(list => list.map(section => section.id))).toEqual(disciplines.map(([id]) => `categoria-${id}`));
  await expect(sections.locator('h2')).toHaveText(disciplineNames);
  await expect(page.getByRole('region', { name: 'Logos 3D', exact: true })).toHaveAttribute('id', 'categoria-logos-3d');
  // Every card leads directly to a collection or equipment family.
  await expect(main.locator('.pd-card')).toHaveCount(43);
  const summary = await sections.evaluateAll(list => list.map(section => ({
    line: section.id.replace('categoria-', ''),
    cards: Array.from(section.querySelectorAll('.pd-card')).map(card => ({
      id: card.id, name: card.querySelector('.tc-card-name')?.textContent?.trim(), pictures: card.querySelectorAll('img[alt=""]').length,
      href: card.getAttribute('href') ?? '', target: card.getAttribute('target'),
    })),
  })));
  for (const { line, cards } of summary) {
    expect(cards.length, line).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.id).toMatch(new RegExp(`^opcion-${line}-(?:\\d+|factory|prestige)$`));
      expect(card.name, card.id).toBeTruthy();
      expect(card.pictures, card.id).toBe(1);
      expect(card.href, card.id).toMatch(/^\/(colecciones|implementos|empresarial)\/[\w-]+$/);
      expect(card.target, card.id).toBeNull();
    }
  }
  await expectImagesServed(page, page.locator('.pd-sections'));
  await expect(page.locator('#categoria-futbol')).toContainText('Uniformes Mundial Anime 2026');
  await expect(page.locator('#categoria-futbol')).toContainText('Uniformes Juveniles');
  const fullSublimadas = page.locator('#opcion-camisas-polos-4');
  await expect(fullSublimadas).toHaveAccessibleName('Full sublimadas');
  await expect(fullSublimadas).toHaveAttribute('href', '/colecciones/camisa-full-sublimada');
  // No prices, and none of the old catalogue's extra buttons.
  await expect(main).not.toContainText('$');
  for (const name of ['Ver diseños', 'Explorar esta línea', 'Consultar con Tony', 'Consultar esta línea']) {
    await expect(main.getByRole('link', { name })).toHaveCount(0);
    await expect(main.getByRole('button', { name })).toHaveCount(0);
  }
  await expect(page.locator('.pd-sections a[href^="https://wa.me/"]:not(.pd-card)')).toHaveCount(0);
  // The help box opens the site search.
  const searchHelp = main.getByRole('button', { name: 'Buscar en Tony', exact: true });
  await searchHelp.click();
  await expect(page.getByRole('dialog', { name: '¿QUÉ BUSCAS EN ESPECÍFICO?' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '¿QUÉ BUSCAS EN ESPECÍFICO?' })).toBeHidden();
  await expect(searchHelp).toBeFocused();
  await page.goto('/producto#opcion-racing-2');
  await expectScope(page, '/colecciones/racing-motorcycle', /racing motorcycle/i);
});

test('los enlaces antiguos de líneas y los círculos de Inicio llegan a su sección de Producto', async ({ page }) => {
  // LineExplorer anchors (/producto#baloncesto…) keep working and become the section's address.
  await page.goto('/producto#baloncesto');
  await expectScope(page, '/producto/bkb', 'Baloncesto');
  // The legacy Racing address remains usable in bookmarks.
  await page.goto('/producto#racing');
  await expectScope(page, '/producto/racing', 'Racing');
  // Inicio: "Escoge tu disciplina deportiva" as round picture buttons (13 lines + Ver todas).
  await page.goto('/');
  await expect(page.getByRole('tablist')).toHaveCount(0);
  const region = page.getByRole('region', { name: 'Escoge tu disciplina deportiva', exact: true });
  const chips = region.getByRole('list').getByRole('link');
  await expect(chips).toHaveText([...disciplineNames, 'Ver todas las disciplinas']);
  for (const [index, href] of [...disciplineHrefs, '/producto'].entries()) await expect(chips.nth(index)).toHaveAttribute('href', href);
  await chips.filter({ hasText: 'Empresarial' }).click();
  await expectScope(page, '/producto/empresarial', 'Empresarial');
  await page.reload();
  await expectScope(page, '/producto/empresarial', 'Empresarial');
});

test('crear pedido se ofrece en el encabezado y en Inicio, no dentro de las secciones', async ({ page }) => {
  test.setTimeout(90_000); // eight pages, the order editor among them
  for (const route of ['/producto', '/lineas', '/implementos', '/tiendas', '/calidad', '/promociones']) {
    await page.goto(route);
    await expect(page.locator('main a[href^="/configurador"]'), route).toHaveCount(0);
    await expect(page.locator('.site-header').getByRole('link', { name: 'Crear pedido', exact: true }), route).toHaveAttribute('href', '/configurador');
  }
  await page.goto('/');
  await page.getByRole('region', {name:'Crear mi pedido'}).getByRole('link', {name:'Empezar mi pedido'}).click();
  await expect(page).toHaveURL(/\/configurador$/);
  await expect(page.getByRole('button', { name: 'CREAR MI PEDIDO ↗', exact: true })).toBeVisible();
  await expect(page.locator('.site-header').getByRole('link', { name: 'Crear pedido' })).toHaveCount(0);
});

test('la franja de contacto y el menú textual permiten abrir los destinos oficiales en escritorio', async ({ page }) => {
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/');
  const strip=page.locator('.tony-contact-line');
  await expect(strip).toContainText('Si no te lo tenemos te lo hacemos');
  await expect(strip.getByRole('link',{name:'info@tonysportselsalvador.com'})).toHaveAttribute('href','mailto:info@tonysportselsalvador.com');
  await expect(page.getByRole('navigation',{name:'Accesos rápidos'})).toHaveCount(0);
  const open=page.getByRole('button',{name:'Abrir menú'});
  await open.click();
  const menu=page.getByRole('dialog',{name:'Menú de Tony Sportswear'});
  await menu.getByText('App Tony',{exact:true}).click();
  await expect(menu.getByRole('link',{name:'Descargá la App Tony'})).toHaveAttribute('href','/app-tony');
  await menu.getByText('Productos',{exact:true}).click();
  await expect(menu.getByRole('link',{name:'Ver todos los productos',exact:true})).toHaveAttribute('href','/producto');
  await expectNoAxeViolations(page,'menú textual de productos','#tony-mobile-menu');
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(open).toBeFocused();
  await open.click();
  await menu.getByText('Productos',{exact:true}).click();
  await menu.getByRole('link',{name:'Logos 3D Alto Relieve',exact:true}).click();
  await expectScope(page, '/producto/logos-3d', 'Logos 3D');
  await expect(menu).toBeHidden();
  await page.setViewportSize({width:1099,height:1000});
  await expect(page.locator('.tony-subbar-search').getByRole('button',{name:SEARCH_LABEL,exact:true})).toBeVisible();
});
test('la búsqueda del encabezado parte de accesos y disciplinas, se recupera sin resultados y lleva a la sección elegida', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/tiendas');
  await page.getByRole('button', { name: SEARCH_LABEL, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '¿QUÉ BUSCAS EN ESPECÍFICO?' });
  const field = dialog.getByRole('searchbox', { name: 'Buscar una sección', exact: true });
  const count = dialog.locator('.tony-search-count');
  await expect(field).toBeFocused();
  await expect(count).toHaveAttribute('data-state', 'initial');
  // Before typing: quick accesses and the disciplines, not the whole directory.
  await expect(dialog.locator('.tony-search-results')).toHaveCount(0);
  await expect(dialog.locator('.tony-search-quick a')).toHaveText(['Crear pedido', 'Promociones', 'Tiendas', 'Consulta tu pedido (se abre en otra pestaña)', 'Implementos', 'App Tony', 'Ayuda (se abre en otra pestaña)']);
  await expect(dialog.locator('.tony-search-disc a')).toHaveText([...disciplineNames, 'Ver todas']);
  await field.fill('noexistexyz');
  await expect(count).toHaveAttribute('data-state', 'empty');
  await dialog.getByRole('button', { name: 'Ver puntos de partida' }).click();
  await expect(field).toBeFocused();
  await expect(field).toHaveValue('');
  await expect(count).toHaveAttribute('data-state', 'initial');
  await field.fill('baloncesto');
  await expect(count).toHaveAttribute('data-state', 'found');
  // The discipline comes before the implements family of the same name.
  const results = dialog.locator('.tony-search-results > a');
  await expect(results.first()).toHaveAccessibleName('Baloncesto');
  await expect(results.first()).toHaveAttribute('href', '/producto/bkb');
  await expect(results.nth(1)).toHaveAttribute('href', '/implementos/baloncesto');
  await page.keyboard.press('ArrowDown');
  await expect(results.first()).toBeFocused();
  await page.keyboard.press('Enter');
  await expectScope(page, '/producto/bkb', 'Baloncesto');
  await expect(dialog).toBeHidden();
  await page.goBack();
  await expect(page).toHaveURL(/\/tiendas$/);
});

test('Implementos agrupa 46 productos en 8 familias con foto que abren la tienda oficial', async ({ page }) => {
  await page.goto('/producto');
  await page.locator('#opcion-implementos-4').click();
  await expectScope(page, '/implementos/guantes', 'Guantes de portero');
  await page.goto('/implementos');
  const main = page.locator('main');
  const families = main.locator('section.im-sec');
  expect(await families.evaluateAll(list => list.map(section => section.id))).toEqual(implementFamilies.map(([id]) => id));
  await expect(families.locator('h2')).toHaveText(implementFamilies.map(([, name]) => name));
  const products = families.getByRole('link');
  await expect(products).toHaveCount(46);
  const cards = await products.evaluateAll(links => links.map(link => ({
    href: link.getAttribute('href') ?? '', target: link.getAttribute('target'), label: link.getAttribute('aria-label') ?? '',
    name: link.querySelector('.tc-card-name')?.textContent?.trim() ?? '', pictures: link.querySelectorAll('img[alt=""]').length,
  })));
  for (const card of cards) {
    expect(card.href, card.name).toMatch(/^https:\/\/www\.tonysportselsalvador\.com\/producto\/[\w-]+\/$/);
    expect(card.target, card.name).toBe('_blank');
    // The visible name keeps "N.º" and its number together with a no-break space; the label reads the same words.
    expect(card.label.replace(/\s+/g, ' ')).toBe(`${card.name.replace(/\s+/g, ' ')} en la tienda oficial de Tony`);
    expect(card.pictures, card.name).toBe(1);
  }
  await expectImagesServed(page, families);
  await expect(main).not.toContainText('$');
  // The family links open only the matching products.
  const chips = page.getByRole('navigation', { name: 'Familias de implementos', exact: true });
  await expect(chips.getByRole('link')).toHaveText(implementFamilies.map(([, name]) => name));
  await chips.getByRole('link', { name: 'Mallas', exact: true }).click();
  await expectScope(page, '/implementos/mallas', 'Mallas');
  await expect(main.locator('.pd-card')).toHaveCount(2);
});

test('el directorio de tiendas busca sin tildes, combina filtros e incluye Lourdes en la zona Centro', async ({ page }) => {
  await page.goto('/tiendas');
  await expect(page.locator('.tp-stores-count')).toHaveText(/^14\s*tiendas en El Salvador$/);
  const search = page.getByRole('searchbox', { name: 'Encuentra tu tienda', exact: true });
  const filters = page.getByRole('group', { name: 'Filtrar tiendas por zona' });
  const stores = page.locator('.te-store-list article');
  await expect(filters.getByRole('button')).toHaveText(['Todas', 'Centro', 'Occidente', 'Oriente', 'Paracentral']);
  await expect(stores).toHaveCount(14);
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
  await expect(stores).toHaveCount(14);
  await search.fill('SAN MIGUEL');
  // Search includes the address: Chapeltique also publishes "San Miguel".
  await expect(stores).toHaveCount(2);
  const sanMiguel = stores.filter({ has: page.getByRole('heading', { name: 'San Miguel', exact: true }) });
  await expect(sanMiguel.getByRole('link', { name: /7656-5837/ })).toHaveAttribute('href', 'tel:+50376565837');
  await expect(sanMiguel.getByRole('link', { name: 'Ver ubicación' })).toHaveAttribute('href', 'https://goo.gl/maps/sSw5AVgG7pWfXYTz5');
  const message = new URL((await sanMiguel.getByRole('link', { name: 'Consultar por WhatsApp' }).getAttribute('href'))!);
  expect(message.pathname).toBe('/50376565837');
  expect(message.searchParams.get('text')).toContain('San Miguel');
  // Lourdes, the newest store, belongs to the Centro zone.
  await search.fill('');
  await filters.getByRole('button', { name: 'Centro', exact: true }).click();
  await expect(stores.getByRole('heading', { level: 3 })).toHaveText(['San Salvador', 'Santa Tecla', 'Chalatenango', 'Lourdes']);
  const lourdes = stores.filter({ has: page.getByRole('heading', { name: 'Lourdes', exact: true }) });
  await expect(lourdes).toContainText('Plaza Lourdes');
  await expect(lourdes.getByRole('link', { name: /7015-5571/ })).toHaveAttribute('href', 'tel:+50370155571');
  await expect(lourdes.getByRole('link', { name: 'Ver ubicación' })).toHaveAttribute('href', /^https:\/\/www\.google\.com\/maps\//);
  // The site search links to /tiendas?tienda=<name>: the directory opens on that store.
  await page.goto('/tiendas?tienda=Lourdes');
  await expect(search).toHaveValue('Lourdes');
  await expect(stores).toHaveCount(1);
  await expect(page.locator('.te-result-count')).toHaveText('1 tienda encontrada');
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
  // The header always offers "Crear pedido"; the guide itself does not send to the editor.
  await expect(page.locator('main a[href^="/configurador"]')).toHaveCount(0);
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
  test.setTimeout(240_000);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of sectionRoutes) {
      await page.goto(route);
      await expect(page.locator('main h1')).toBeVisible();
      if (route === '/producto') {
        await page.getByRole('list', { name: 'Disciplinas', exact: true }).getByRole('link', { name: 'Camisas y polos', exact: true }).click();
        await expectScope(page, '/producto/camisas-polos', 'Camisas y polos');
      }
      if (route === '/implementos') {
        await page.getByRole('navigation', { name: 'Familias de implementos', exact: true }).getByRole('link', { name: 'Accesorios', exact: true }).click();
        await expectScope(page, '/implementos/accesorios', 'Accesorios');
      }
      if (route === '/calidad') await page.getByRole('group', { name: 'Explorar técnicas de personalización' }).getByRole('button', { name: /Bordado/ }).click();
      if (route === '/tiendas') await page.getByRole('searchbox', { name: 'Encuentra tu tienda', exact: true }).fill('Santa Ana');
      if (route === '/patrocinio') await page.getByRole('button', { name: 'Revisar mi propuesta' }).click();
      if (route === '/resenas') await page.getByRole('button', { name: 'Revisar mi reseña' }).click();
      await expectFits(page, `${route} en ${width}px`);
    }
    // The same product directory is reachable from the menu at any viewport width.
    await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
    const menu = page.getByRole('dialog', { name: 'Menú de Tony Sportswear' });
    await expect(menu.getByRole('button', { name: 'Cerrar menú' })).toBeFocused();
    for (const name of ['Líneas', 'Universo Tony', 'Producto', 'Somos Tony', 'Para ti']) await expect(menu.getByRole('button', { name })).toHaveCount(0);
    const nav = menu.getByRole('navigation', { name: 'Navegación principal' });
    await nav.getByText('Productos',{exact:true}).click();
    await nav.getByRole('link', { name: 'Logos 3D Alto Relieve', exact: true }).click();
    await expectScope(page, '/producto/logos-3d', 'Logos 3D');
    await expect(menu).toBeHidden();
    await expectFits(page, `Producto abierto desde el menú en ${width}px`);
  }
});
