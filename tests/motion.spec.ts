import { test, expect, devices, type Page } from '@playwright/test';

async function ready(page: Page, route = '/') {
  await page.addInitScript(() => {
    sessionStorage.setItem('tony:intro:wordmark:v1','seen');
    sessionStorage.setItem('tony:inicio:carteles:v3','[]');
  });
  await page.goto(route);
}

async function scrollInstant(page: Page, top: number) {
  await page.evaluate(y => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, y); }, top);
}

async function menuLink(page: Page, label: 'Tony News' | 'Promociones') {
  await page.getByRole('button',{name:'Abrir menú'}).click();
  const menu=page.getByRole('dialog',{name:'Menú de Tony Sportswear'});
  if (label==='Promociones') await menu.getByText('Promociones',{exact:true}).click();
  const link=menu.getByRole('link',{name:label==='Promociones'?'Ver todas las promociones':label,exact:true});
  await link.scrollIntoViewIfNeeded();
  return link;
}

test('las uniones de las escamas siguen el cursor y el pie cierra la página', async ({page}) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  await ready(page, '/contacto');
  await expect(page.locator('body')).toHaveCSS('background-image', /escamas-tony-base/);
  await expect(page.locator('main')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await expect(page.locator('.scale-backdrop')).toHaveCSS('pointer-events','none');
  const spot = page.locator('.scale-spot');
  await expect(spot).toBeVisible();
  await page.mouse.move(180,280);
  await expect(spot).toHaveCSS('opacity','0.92');
  await page.mouse.move(250,340);
  await scrollInstant(page,250);
  await expect.poll(() => spot.evaluate(light => {
    const bounds = light.getBoundingClientRect();
    return [Math.round(bounds.x + bounds.width / 2), Math.round(bounds.y + bounds.height / 2)];
  })).toEqual([250,340]);
  await expect(page.locator('.tony-peek, .tony-scratch-stage, .replay-intro')).toHaveCount(0);
  await expect(page.getByRole('button', {name:/Pausar efectos|Repetir animación/})).toHaveCount(0);
  expect(await page.locator('footer').last().evaluate(el=>Math.abs(document.documentElement.scrollHeight - (el.getBoundingClientRect().bottom + scrollY)))).toBeLessThanOrEqual(1);
});

test('la franja de contacto, el menú y el asistente funcionan con teclado en móvil', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await ready(page);
  const band=page.locator('.tony-contact-line');
  await expect(band).toContainText(/Si no te lo tenemos\s*te lo hacemos/i);
  await expect(band.getByRole('link',{name:'info@tonysportselsalvador.com'})).toHaveAttribute('href','mailto:info@tonysportselsalvador.com');
  await expect(band.getByRole('link',{name:/Instagram de Tony/})).toHaveAttribute('href',/instagram\.com\/tonysportswearsv/);
  const assist=page.getByRole('button',{name:'Abrir asistente Tony'});
  await expect(assist).toHaveCSS('position','fixed');
  await assist.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog',{name:'Asistente Tony'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(assist).toBeFocused();
  const menu=page.getByRole('button',{name:'Abrir menú'});
  await menu.focus();
  await page.keyboard.press('Enter');
  const panel=page.getByRole('dialog',{name:'Menú de Tony Sportswear'});
  const app=panel.locator('summary').filter({hasText:'App Tony'});
  await app.focus();
  await page.keyboard.press('Enter');
  await expect(panel.getByRole('link',{name:'Descargá la App Tony'})).toBeVisible();
  await expect(panel.getByRole('link',{name:/^(Android|iOS)$/})).toHaveCount(0);
  await expect(panel.getByRole('link',{name:'RSE-Tony'})).toHaveAttribute('href',/\/rse\/?$/);
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
});

test('al cambiar de apartado aparece el logo y la transición permite seguir navegando', async ({ page, request }) => {
  for (const route of ['/tony-news','/promociones']) expect((await request.get(route)).ok()).toBe(true);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    const phases: string[] = [];
    (window as unknown as { __phases: string[] }).__phases = phases;
    new MutationObserver(records => records.forEach(record => {
      if (record.target instanceof HTMLElement && record.target.matches('.route-transition')) phases.push(record.target.dataset.phase!);
    }))
      .observe(document, { subtree: true, attributes: true, attributeFilter: ['data-phase'] });
  });
  await ready(page, '/contacto');
  const overlay = page.locator('.route-transition');
  await expect(overlay).toHaveCSS('pointer-events', 'none');
  await expect(overlay).toHaveAttribute('aria-hidden', 'true');
  await expect(overlay.locator('.brand-screen-art img')).toHaveAttribute('src', /\/tony-piel\.webp$/);
  await expect(overlay).toBeHidden();
  const phases = () => page.evaluate(() => (window as unknown as { __phases: string[] }).__phases.join(' '));
  expect(await phases()).toBe('');
  const link = (await (await menuLink(page,'Tony News')).boundingBox())!;
  await page.mouse.click(link.x + link.width / 2, link.y + link.height / 2);
  await expect(overlay).toHaveAttribute('data-phase', 'cover');
  await expect(page.locator('html')).toHaveAttribute('data-route-cover', 'true');
  // The desktop transition only fades the full artwork.
  const animated = await overlay.evaluate(element => [...new Set(element.getAnimations({ subtree: true }).flatMap(animation => (animation.effect as KeyframeEffect).getKeyframes().flatMap(frame => Object.keys(frame))))]);
  expect(animated.filter(property => !['offset', 'computedOffset', 'easing', 'composite'].includes(property)).sort()).toEqual(['opacity']);
  await expect(page).toHaveURL(/\/tony-news$/);
  await expect.poll(phases, { timeout: 10000 }).toBe('cover wink reveal idle');
  await expect(page.locator('html')).not.toHaveAttribute('data-route-cover', /.*/);
  const next = (await (await menuLink(page,'Promociones')).boundingBox())!;
  await page.mouse.click(next.x + next.width / 2, next.y + next.height / 2);
  await expect(page).toHaveURL(/\/promociones$/);
  await expect.poll(phases, { timeout: 10000 }).toBe('cover wink reveal idle cover wink reveal idle');
  await expect(page.locator('html')).not.toHaveAttribute('data-route-cover', /.*/);
  await page.locator('.tony-header-inner .brand').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.brand-intro')).toHaveCount(0);
});

test('el título del apartado que llega espera a que termine la transición', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await ready(page, '/contacto');
  // Observe at the moment the scales lift. Separate Playwright round trips can outlast the
  // short cover/wink and incorrectly inspect a heading that is already revealed.
  // Any entrance counts (a CSS animation or a script one, on the heading or on the block that carries it).
  await page.evaluate(() => {
    const reveals: { heading: string; progressed: number[] }[] = [];
    (window as unknown as { __reveals: typeof reveals }).__reveals = reveals;
    new MutationObserver(() => {
      if (document.documentElement.dataset.routeCover) return;
      const heading = document.querySelector('main h1'), main = heading?.closest('main');
      if (!heading || !main) return;
      const progressed = document.getAnimations().filter(animation => {
        const target = (animation.effect as KeyframeEffect | null)?.target;
        return !!target && main.contains(target) && (target.contains(heading) || heading.contains(target));
      }).map(animation => Number(animation.currentTime ?? 0));
      reveals.push({ heading: heading.textContent!.trim(), progressed });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-route-cover'] });
  });
  const link = (await (await menuLink(page,'Promociones')).boundingBox())!;
  await page.mouse.click(link.x + link.width / 2, link.y + link.height / 2);
  await expect(page).toHaveURL(/\/promociones$/);
  await expect(page.locator('.route-transition')).toHaveAttribute('data-phase', 'idle');
  await expect(page.locator('html')).not.toHaveAttribute('data-route-cover', /.*/);
  const reveals = await page.evaluate(() => (window as unknown as { __reveals: { heading: string; progressed: number[] }[] }).__reveals);
  const arrival = reveals.find(reveal => reveal.heading === 'Promociones');
  // The section's heading was in place when the scales opened, and it has an entrance...
  expect(arrival, JSON.stringify(reveals)).toBeTruthy();
  expect(arrival!.progressed.length).toBeGreaterThan(0);
  // ...that had not played yet: it starts as they open instead of finishing out of sight.
  expect(Math.max(...arrival!.progressed), JSON.stringify(reveals)).toBeLessThan(50);
});

test('ninguna vista tiene un lagarto aferrado al borde ni se desplaza en horizontal', async ({ browser, baseURL }) => {
  for (const settings of [
    { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } },
    { ...devices['iPhone SE'], viewport: { width: 320, height: 640 } },
    { ...devices['iPad Pro 11'], viewport: { width: 1366, height: 1024 } },
  ]) {
    const context = await browser.newContext({ ...settings, baseURL, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    try {
      await ready(page);
      await scrollInstant(page, 1400);
      await page.waitForTimeout(500);
      await expect(page.locator('.tony-mascot,.tony-peek')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    } finally { await context.close(); }
  }
});

test('movimiento reducido conserva texto y navegación sin intro ni mascotas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.brand-intro')).toHaveCount(0);
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('.tony-peek')).toBeHidden();
  await expect(page.locator('body')).toHaveCSS('background-image', /escamas-tony-base/);
  await expect(page.locator('.scale-backdrop')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Efectos en pausa' })).toHaveCount(0);
  await page.goto('/contacto');
  await page.locator('.tony-header-inner .brand').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.brand-intro')).toHaveCount(0);
  // The home heading arrives already in place: no entrance, fully opaque, untransformed.
  const heading = page.locator('main h1');
  await expect(heading).toBeVisible();
  await expect(heading).toHaveCSS('opacity', '1');
  await expect(heading).toHaveCSS('transform', 'none');
  expect(await heading.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
});
