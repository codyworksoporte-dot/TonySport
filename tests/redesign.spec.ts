import {test, expect, type Locator, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Acceptance tests for the client brief of the "Opción C – Botones gigantes" redesign.
// Expected values are written out on purpose (not imported from lib/): the brief fixes them.
// The intro (intro.spec.ts) and the assistant's first-visit bubble are switched off so neither covers the page.

const DESKTOP = {width: 1440, height: 900};
const PHONE = {width: 390, height: 844};

const WHATSAPP = 'https://wa.me/50370155571';
const WHATSAPP_ANY = /^https:\/\/wa\.me\/50370155571(?:\?.*)?$/;
const ORDER_LOOKUP = 'https://www.tonysportselsalvador.com/sistema/consulta_ts/';
const GOOGLE_PLAY = 'https://play.google.com/store/apps/details?id=com.tonysports.customer';
const APP_STORE = 'https://apps.apple.com/us/app/tony/id1528399939';
const WA_PILL = 'Contáctanos por WhatsApp al 7015 5571';
const SEARCH_LABEL = '¿Qué buscas en específico?';
const SEARCH_TITLE = '¿QUÉ BUSCAS EN ESPECÍFICO?';
const HOME_SEARCH = 'Busca un uniforme, un balón o una tienda';
const DISCIPLINES_TITLE = 'Escoge tu disciplina deportiva';
const DISCIPLINES: [id: string, name: string][] = [
  ['futbol', 'Fútbol'], ['bkb', 'Baloncesto'], ['voleibol', 'Voleibol'], ['ciclismo', 'Ciclismo'], ['runners', 'Running'],
  ['racing', 'Racing'], ['empresarial', 'Empresarial'], ['camisas-polos', 'Camisas y polos'], ['replicas', 'Réplicas'],
  ['hoddies', 'Hoddies'], ['implementos', 'Implementos'], ['moldes', 'Moldes'], ['logos-3d', 'Logos 3D'],
];
const IMPLEMENT_FAMILIES = ['balones', 'futsal', 'baloncesto', 'guantes', 'espinilleras', 'beisbol', 'mallas', 'accesorios'];
const LOURDES_ADDRESS = 'Carretera Panamericana, Plaza Lourdes, segundo nivel, a un costado de Café Lourdes.';
const LOURDES_MAP = 'https://www.google.com/maps/search/13.723901,+-89.369489';

// Sections the brief removed from the site chrome. Patterns run on accent-free, lower-case text.
const REMOVED: [label: string, pattern: RegExp][] = [
  ['Catálogo y diseños', /catalogo y disenos/],
  ['TonyPlay', /tony ?play/],
  ['Reseñas', /\bresenas?\b/],
  ['Recientes', /\brecientes\b/],
  ['Guía', /\bguias?\b/],

];
// Their routes still exist (the order flow uses some), but nothing in the chrome may lead there.
const REMOVED_ROUTE = /^\/(catalogo|resenas|recientes)(\/|$)|tonyplay/i;

// Accent-free, lower case, single spaces: "Reseñas" → "resenas" (NFD splits ñ into n + U+0303, then the marks go).
const ACCENTS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g');
const normalize = (text: string) => text.normalize('NFD').replace(ACCENTS, '').toLowerCase().replace(/\s+/g, ' ');

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => {
    try { sessionStorage.setItem('tony:intro:wordmark:v1', 'seen'); } catch { /* Storage blocked: nothing to skip. */ }
    try { localStorage.setItem('tony-assistant-hint-v1', '1'); } catch { /* Idem. */ }
  });
});

async function expectNewTab(link: Locator, href: string | RegExp) {
  await expect(link).toHaveAttribute('href', href);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /\bnoopener\b/);
}


const searchDialog = (page: Page) => page.getByRole('dialog', {name: SEARCH_TITLE, exact: true});
const searchBox = (page: Page) => searchDialog(page).getByRole('searchbox', {name: 'Buscar una sección', exact: true});

/** Opens the site search some way, checks it is ready to type in, closes it with Escape. */
async function expectSearchOpens(page: Page, open: () => Promise<void>, focusReturnsTo: Locator) {
  await expect(searchDialog(page)).toBeHidden();
  await open();
  await expect(searchDialog(page)).toBeVisible();
  await expect(searchBox(page)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(searchDialog(page)).toBeHidden();
  await expect(focusReturnsTo).toBeFocused();
}

async function expectNoAxeViolations(page: Page, label: string, include?: string) {
  const builder = new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']);
  if (include) builder.include(include);
  const scan = await builder.analyze();
  const summary = scan.violations.map(violation => ({id: violation.id, targets: violation.nodes.map(node => node.target.join(' '))}));
  expect(scan.violations, `${label}: ${JSON.stringify(summary)}`).toEqual([]);
}

/** Page width against the viewport, with the elements that stick out (for the failure message). */
function measureOverflow(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement, width = root.clientWidth;
    const scrollWidth = Math.max(root.scrollWidth, document.body.scrollWidth);
    const offenders: string[] = [];
    if (scrollWidth > width) {
      for (const element of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
        const box = element.getBoundingClientRect();
        if (!box.width || (box.right <= width + 1 && box.left >= -1)) continue;
        offenders.push(`${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.classList.length ? `.${Array.from(element.classList).join('.')}` : ''} [${Math.round(box.left)}→${Math.round(box.right)}]`);
        if (offenders.length === 8) break;
      }
    }
    return {scrollWidth, width, offenders};
  });
}

test.describe('encabezado en escritorio (≥1100 px)', () => {
  test.use({viewport: DESKTOP});

  test('la píldora de WhatsApp muestra 7015 5571 y abre wa.me/50370155571 en otra pestaña', async ({page}) => {
    await page.goto('/');
    const pill = page.getByRole('banner').getByRole('link', {name: WA_PILL, exact: true});
    await expect(pill).toBeVisible();
    await expect(pill.getByText('7015 5571', {exact: true})).toBeVisible();
    await expectNewTab(pill, WHATSAPP);
  });

  test('la búsqueda se abre desde el encabezado y con Ctrl+K', async ({page}) => {
    await page.goto('/');
    const headerPill = page.getByRole('banner').getByRole('button', {name: SEARCH_LABEL, exact: true});
    await expect(headerPill).toBeVisible();

    await headerPill.click();
    const dialog = searchDialog(page);
    await expect(dialog).toBeVisible();
    await expect(searchBox(page)).toBeFocused();
    // Nothing typed yet: quick accesses and the disciplines, not the whole directory.
    await expect(dialog.locator('.tony-search-count')).toHaveAttribute('data-state', 'initial');
    await expect(dialog.getByRole('heading', {name: 'Accesos rápidos', exact: true})).toBeVisible();
    await expect(dialog.getByRole('heading', {name: DISCIPLINES_TITLE, exact: true})).toBeVisible();
    await expect(dialog.locator('.tony-search-results')).toHaveCount(0);
    await expect(dialog.getByRole('link', {name: /^Consulta tu pedido/})).toHaveAttribute('href', ORDER_LOOKUP);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(headerPill).toBeFocused();

    await expectSearchOpens(page, () => page.keyboard.press('Control+k'), headerPill);

    await expect(page.getByRole('main').getByRole('button', {name: HOME_SEARCH, exact: true})).toHaveCount(0);
  });

  test('el menú concentra los accesos a pedidos, tienda, disciplinas y ayuda', async ({page}) => {
    await page.goto('/');
    await expect(page.getByRole('navigation',{name:'Accesos rápidos'})).toHaveCount(0);
    const trigger=page.getByRole('button',{name:'Abrir menú'});
    await trigger.click();
    const menu=page.getByRole('dialog',{name:'Menú de Tony Sportswear'});
    await expectNewTab(menu.getByRole('link',{name:/^Consulta tu pedido/}),ORDER_LOOKUP);
    await expectNewTab(menu.getByRole('link',{name:/^Ayuda por WhatsApp/}),WHATSAPP_ANY);
    await menu.getByText('Tienda en línea',{exact:true}).click();
    await expect(menu.getByRole('link',{name:'Ver toda la tienda'})).toHaveAttribute('href','/tienda');
    await menu.getByText('Productos',{exact:true}).click();
    await expect(menu.getByRole('link',{name:'Ver todos los productos'})).toHaveAttribute('href','/producto');
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('el menú conserva solo las secciones vigentes', async ({page}) => {
    await page.goto('/');
    await page.getByRole('button',{name:'Abrir menú'}).click();
    const chrome = await page.evaluate(() => {
      const roots = Array.from(document.querySelectorAll('header.tony-header, .tony-subbar, #tony-mobile-menu, dialog.tony-search, footer.tony-footer'));
      const texts: string[] = [], paths: string[] = [];
      for (const root of roots) {
        texts.push(root.textContent ?? '');
        for (const element of Array.from(root.querySelectorAll('[aria-label], [title], img[alt]'))) {
          for (const name of ['aria-label', 'title', 'alt']) texts.push(element.getAttribute(name) ?? '');
        }
        for (const anchor of Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href]'))) {
          const url = new URL(anchor.href);
          paths.push(url.origin === location.origin ? url.pathname : url.href);
        }
      }
      return {roots: roots.length, text: texts.join(' | '), paths};
    });
    expect(chrome.roots).toBe(5);
    expect(chrome.paths.length).toBeGreaterThan(40);
    const text = normalize(chrome.text);
    for (const [label, pattern] of REMOVED) expect(text, `"${label}" sigue en el encabezado, el menú, la búsqueda o el pie`).not.toMatch(pattern);
    expect(chrome.paths.filter(path => REMOVED_ROUTE.test(path))).toEqual([]);
  });

  test('buscar las secciones retiradas no las devuelve y Entregas ofrece domicilio y seguimiento', async ({page}) => {
    await page.goto('/');
    await page.getByRole('banner').getByRole('button', {name: SEARCH_LABEL, exact: true}).click();
    const dialog = searchDialog(page), input = searchBox(page), count = dialog.locator('.tony-search-count');
    for (const [word, pattern] of REMOVED) {
      // Clearing first means every result read below belongs to this word.
      await input.fill('');
      await expect(count).toHaveAttribute('data-state', 'initial');
      await input.fill(word);
      await expect(count).not.toHaveAttribute('data-state', 'initial');
      const results = await dialog.locator('.tony-search-results > a').evaluateAll(links => links.map(link => ({
        label: link.getAttribute('aria-label') ?? '', path: new URL((link as HTMLAnchorElement).href).pathname,
      })));
      for (const result of results) {
        expect(normalize(result.label), `buscar "${word}" devolvió "${result.label}"`).not.toMatch(pattern);
        expect(result.path, `buscar "${word}" devolvió ${result.path}`).not.toMatch(REMOVED_ROUTE);
      }
    }
    await input.fill('Entregas');
    await expect(dialog.getByRole('link',{name:'Servicio a domicilio',exact:true})).toHaveAttribute('href','/entregas');
    await expect(input).toHaveValue('Entregas');
    await expectNewTab(dialog.locator('.tony-search-results').getByRole('link', {name: 'Consulta tu pedido', exact: true}), ORDER_LOOKUP);

    // A word with no match offers WhatsApp and a way back to the starting points.
    await input.fill('TonyPlay');
    await expect(count).toHaveAttribute('data-state', 'empty');
    await expect(dialog).toContainText('No encontramos “TonyPlay”');
    await expectNewTab(dialog.getByRole('link', {name: /^Pregúntale a Tony/}), WHATSAPP_ANY);
    await dialog.getByRole('button', {name: 'Ver puntos de partida', exact: true}).click();
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    await expect(count).toHaveAttribute('data-state', 'initial');
    await expect(dialog.getByRole('heading', {name: 'Accesos rápidos', exact: true})).toBeVisible();
  });
});

test.describe('encabezado y menú en el teléfono', () => {
  test('a 360 px el número de WhatsApp sigue visible y la búsqueda ocupa la fila bajo el encabezado', async ({page}) => {
    await page.setViewportSize({width: 360, height: 780});
    await page.goto('/');
    const banner = page.getByRole('banner');
    const pill = banner.getByRole('link', {name: WA_PILL, exact: true});
    await expect(pill.getByText('7015 5571', {exact: true})).toBeVisible();
    await expectNewTab(pill, WHATSAPP);

    await expect(page.locator('nav[aria-label="Accesos rápidos"]')).toBeHidden();
    await expect(page.getByRole('main').getByRole('button', {name: HOME_SEARCH, exact: true})).toBeHidden();
    await expect(banner.getByRole('button', {name: SEARCH_LABEL, exact: true})).toHaveCount(0);
    const rowPill = page.getByRole('button', {name: SEARCH_LABEL, exact: true});
    await expect(rowPill).toBeVisible();
    const header = (await banner.boundingBox())!, row = (await rowPill.boundingBox())!;
    expect(row.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
    expect(row.width).toBeGreaterThan(360 * 0.85);
    await expectSearchOpens(page, () => rowPill.click(), rowPill);
  });

  test('el menú tiene las 13 disciplinas, Promociones, Consulta tu pedido, la App Tony y la ayuda por WhatsApp', async ({page}) => {
    await page.setViewportSize(PHONE);
    await page.goto('/');
    const trigger = page.getByRole('button', {name: 'Abrir menú', exact: true});
    await trigger.click();
    const menu = page.getByRole('dialog', {name: 'Menú de Tony Sportswear', exact: true});
    await expect(menu).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.getByRole('button', {name: 'Cerrar menú', exact: true})).toBeFocused();

    const nav=menu.getByRole('navigation',{name:'Navegación principal',exact:true});
    await nav.getByText('Productos',{exact:true}).click();
    await expect(nav.locator('.tony-menu-list > li > details[open] > ul > li')).toHaveCount(DISCIPLINES.length + 1);
    await nav.getByText('Promociones',{exact:true}).click();
    await expect(nav.getByRole('link',{name:'Ver todas las promociones'})).toHaveAttribute('href','/promociones');
    await nav.getByText('App Tony',{exact:true}).click();
    await expectNewTab(nav.getByRole('link',{name:/^Android/}),GOOGLE_PLAY);
    await expectNewTab(nav.getByRole('link',{name:/^iOS/}),APP_STORE);
    await expectNewTab(menu.getByRole('link',{name:/^Consulta tu pedido/}),ORDER_LOOKUP);
    await expectNewTab(menu.getByRole('link',{name:/^Ayuda por WhatsApp/}),WHATSAPP_ANY);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

type PageCheck = (main: Locator) => Promise<void>;
const PAGES: [route: string, h1: string, check: PageCheck][] = [
  ['/promociones', 'Promociones', async main => {
    await expectNewTab(main.getByRole('link', {name: /^Preguntar por WhatsApp/}), WHATSAPP_ANY);
    await expect(main.getByRole('heading', {name: 'Campañas recientes', exact: true})).toBeVisible();
  }],
  ['/consulta', 'Consulta tu pedido', async main => {
    await expectNewTab(main.getByRole('link', {name: /^Consultar mi pedido/}), ORDER_LOOKUP);
  }],
  ['/app-tony', 'App Tony', async main => {
    await expectNewTab(main.getByRole('link', {name: /Google Play/}), GOOGLE_PLAY);
    await expectNewTab(main.getByRole('link', {name: /App Store/}), APP_STORE);
  }],
  ['/implementos', 'Implementos deportivos', async main => {
    const sections = main.locator('section[id]');
    await expect(sections).toHaveCount(IMPLEMENT_FAMILIES.length);
    expect(await sections.evaluateAll(list => list.map(section => section.id))).toEqual(IMPLEMENT_FAMILIES);
    const cards = sections.getByRole('link');
    await expect(cards).toHaveCount(46);
    for (const card of await cards.evaluateAll(links => links.map(link => ({href: link.getAttribute('href'), target: link.getAttribute('target')})))) {
      expect(card.href).toMatch(/^https:\/\/www\.tonysportselsalvador\.com\/producto\/[\w-]+\/$/);
      expect(card.target).toBe('_blank');
    }
  }],
  ['/producto', DISCIPLINES_TITLE, async main => {
    await expect(main.getByRole('list', {name: 'Disciplinas', exact: true}).getByRole('link')).toHaveCount(DISCIPLINES.length);
    const sections = main.locator('section[id^="categoria-"]');
    await expect(sections).toHaveCount(DISCIPLINES.length);
    expect(await sections.evaluateAll(list => list.map(section => section.id))).toEqual(DISCIPLINES.map(([id]) => `categoria-${id}`));
    for (const [id] of DISCIPLINES) await expect(main.locator(`#categoria-${id} [id^="opcion-${id}-"]`).first()).toBeVisible();
    await expect(main).not.toContainText('$');
    for (const gone of ['Ver diseños', 'Explorar esta línea', 'Consultar con Tony']) await expect(main).not.toContainText(gone);
  }],
  ['/tiendas', 'Tiendas', async main => {
    const stores = main.getByRole('article');
    await expect(stores).toHaveCount(14);
    const lourdes = stores.filter({has: main.page().getByRole('heading', {name: 'Lourdes', exact: true})});
    await expect(lourdes).toHaveCount(1);
    await expect(lourdes).toContainText(LOURDES_ADDRESS);
  }],
];

test.describe('páginas nuevas del brief', () => {
  for (const [route, h1, check] of PAGES) {
    for (const [device, viewport] of [['escritorio', DESKTOP], ['teléfono', PHONE]] as const) {
      test(`${route} (${device}) tiene un solo h1, su contenido y pasa axe`, async ({page}) => {
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setViewportSize(viewport);
        // Fade-ins would hand axe half-transparent text.
        await page.emulateMedia({reducedMotion: 'reduce'});
        const response = await page.goto(route);
        expect(response?.status()).toBe(200);
        const main = page.getByRole('main');
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(main.getByRole('heading', {level: 1})).toHaveText(h1);
        await check(main);
        await page.evaluate(() => document.fonts.ready);
        await expectNoAxeViolations(page, `${route} (${device})`);
        expect(errors).toEqual([]);
      });
    }
  }

  test('/entregas ofrece coordinación y seguimiento del pedido', async ({page}) => {
    await page.goto('/entregas');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', {level: 1})).toHaveText('Servicio a domicilio');
    await expect(main.getByRole('link', {name: /^Coordinar entrega/})).toHaveAttribute('href', /^https:\/\/wa\.me\/50370155571/);
    await expectNewTab(main.getByRole('link', {name: /^Consultar mi pedido/}), ORDER_LOOKUP);
  });
});

test.describe('asistente Tony', () => {
  test.use({viewport: DESKTOP});

  test('responde por Lourdes, ofrece balones, pasa a WhatsApp y Escape lo cierra devolviendo el foco', async ({page}) => {
    await page.goto('/');
    const launcher = page.locator('button.ta-launcher');
    await expect(launcher).toHaveAccessibleName('Abrir asistente Tony');
    await expect(launcher).toHaveAttribute('aria-expanded', 'false');
    await launcher.click();
    const panel = page.getByRole('dialog', {name: 'Asistente Tony', exact: true});
    await expect(panel).toBeVisible();
    await expect(launcher).toHaveAttribute('aria-expanded', 'true');
    await expect(launcher).toHaveAccessibleName('Cerrar asistente Tony');
    await expectNewTab(panel.getByRole('link', {name: /^Hablar con una persona por WhatsApp/}), WHATSAPP_ANY);

    const input = panel.getByRole('textbox', {name: 'Escribe tu pregunta', exact: true});
    await expect(input).toBeFocused();
    const log = panel.getByRole('log', {name: 'Conversación con el asistente', exact: true});

    await input.fill('¿dónde queda la tienda de Lourdes?');
    await input.press('Enter');
    await expect(log).toContainText(LOURDES_ADDRESS);
    await expectNewTab(log.getByRole('link', {name: /^Cómo llegar/}), LOURDES_MAP);

    await input.fill('quiero un balón');
    await input.press('Enter');
    const answer = log.locator('.ta-msg--bot').last();
    await expect(answer.getByRole('link', {name: 'Ver balones de fútbol', exact: true})).toHaveAttribute('href', '/implementos#balones');
    // The handoff carries the visitor's own question to the person on WhatsApp.
    const handoff = answer.getByRole('link', {name: /^WhatsApp 7015 5571/});
    await expectNewTab(handoff, WHATSAPP_ANY);
    expect(new URL((await handoff.getAttribute('href'))!).searchParams.get('text')).toContain('Quiero un balón');

    await expect(input).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(launcher).toBeFocused();
    await expect(launcher).toHaveAttribute('aria-expanded', 'false');
    await expect(launcher).toHaveAccessibleName('Abrir asistente Tony');
  });

  test('el lanzador no existe en /configurador', async ({page}) => {
    await page.goto('/');
    const launcher = page.getByRole('button', {name: 'Abrir asistente Tony', exact: true});
    await expect(launcher).toBeVisible();
    const create = page.getByRole('banner').getByRole('link', {name: 'Crear pedido', exact: true});
    await create.click();
    await expect(page).toHaveURL(/\/configurador$/, {timeout: 30_000});
    await expect(create).toHaveCount(0);
    await expect(page.locator('.ta-root')).toHaveCount(0);

    await page.goto('/configurador');
    // The cart link names its count only once the page is hydrated, so the absence below is not a server-only view.
    await expect(page.getByRole('banner').getByRole('link', {name: /^Carrito, \d+ diseños?$/})).toBeVisible();
    await expect(page.locator('.ta-root')).toHaveCount(0);
    await expect(launcher).toHaveCount(0);
  });
});

test.describe('accesibilidad de los diálogos nuevos', () => {
  // Opening animations would hand axe half-transparent text.
  test.beforeEach(async ({page}) => { await page.emulateMedia({reducedMotion: 'reduce'}); });

  test('escritorio: la búsqueda (vacía, con resultados y sin resultados), la App Tony, las disciplinas y el asistente pasan axe', async ({page}) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    await page.getByRole('banner').getByRole('button', {name: SEARCH_LABEL, exact: true}).click();
    const dialog = searchDialog(page);
    await expect(dialog).toBeVisible();
    await expectNoAxeViolations(page, 'búsqueda vacía', 'dialog.tony-search');
    await searchBox(page).fill('balones');
    await expect(dialog.locator('.tony-search-results > a').first()).toBeVisible();
    await expectNoAxeViolations(page, 'búsqueda con resultados', 'dialog.tony-search');
    await searchBox(page).fill('xyzw');
    await expect(dialog.getByRole('button', {name: 'Ver puntos de partida', exact: true})).toBeVisible();
    await expectNoAxeViolations(page, 'búsqueda sin resultados', 'dialog.tony-search');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await page.getByRole('button',{name:'Abrir menú'}).click();
    const nav=page.getByRole('dialog',{name:'Menú de Tony Sportswear'});
    await nav.getByText('App Tony',{exact:true}).click();
    await expectNoAxeViolations(page,'submenú de descargas','#tony-mobile-menu');
    await nav.getByText('Productos',{exact:true}).click();
    await expectNoAxeViolations(page,'submenú de productos','#tony-mobile-menu');
    await page.keyboard.press('Escape');

    await page.getByRole('button', {name: 'Abrir asistente Tony', exact: true}).click();
    const panel = page.getByRole('dialog', {name: 'Asistente Tony', exact: true});
    await expect(panel).toBeVisible();
    await expectNoAxeViolations(page, 'asistente (bienvenida)', '.ta-root');
    const input = panel.getByRole('textbox', {name: 'Escribe tu pregunta', exact: true});
    await input.fill('quiero un balón');
    await input.press('Enter');
    await expect(panel.getByRole('link', {name: 'Ver balones de fútbol', exact: true})).toBeVisible();
    await expectNoAxeViolations(page, 'asistente (respuesta)', '.ta-root');
  });

  test('teléfono: el menú, la búsqueda a pantalla completa y el asistente pasan axe', async ({page}) => {
    await page.setViewportSize(PHONE);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    await page.getByRole('button', {name: 'Abrir menú', exact: true}).click();
    await expect(page.getByRole('dialog', {name: 'Menú de Tony Sportswear', exact: true})).toBeVisible();
    await expectNoAxeViolations(page, 'menú', '#tony-mobile-menu');
    await page.keyboard.press('Escape');

    await page.getByRole('button', {name: SEARCH_LABEL, exact: true}).click();
    await expect(searchDialog(page)).toBeVisible();
    await searchBox(page).fill('tienda');
    await expect(searchDialog(page).locator('.tony-search-results > a').first()).toBeVisible();
    await expectNoAxeViolations(page, 'búsqueda en el teléfono', 'dialog.tony-search');
    await page.keyboard.press('Escape');

    await page.getByRole('button', {name: 'Abrir asistente Tony', exact: true}).click();
    const panel = page.getByRole('dialog', {name: 'Asistente Tony', exact: true});
    await expect(panel).toBeVisible();
    await panel.getByRole('button', {name: 'Tiendas cerca', exact: true}).click();
    await expect(panel.getByRole('button', {name: 'Lourdes', exact: true})).toBeVisible();
    await expectNoAxeViolations(page, 'asistente en el teléfono', '.ta-root');
  });
});

test.describe('sin desbordamiento horizontal', () => {
  for (const width of [360, 1440]) {
    for (const route of ['/', '/producto', '/promociones', '/implementos']) {
      test(`${route} a ${width} px`, async ({page}) => {
        await page.setViewportSize({width, height: width < 600 ? 780 : 900});
        await page.goto(route);
        await expect(page.getByRole('main').getByRole('heading', {level: 1})).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const top = await measureOverflow(page);
        expect(top.scrollWidth, `${route} a ${width} px: ${top.offenders.join(' · ')}`).toBeLessThanOrEqual(top.width);
        // Scrolled to the end (the header's scrolled state, late sections).
        await page.evaluate(() => window.scrollTo({top: document.documentElement.scrollHeight, behavior: 'instant'}));
        const end = await measureOverflow(page);
        expect(end.scrollWidth, `${route} a ${width} px, al final: ${end.offenders.join(' · ')}`).toBeLessThanOrEqual(end.width);
      });
    }
  }
});
