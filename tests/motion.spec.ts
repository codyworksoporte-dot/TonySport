import { test, expect, devices, type Page } from '@playwright/test';

async function ready(page: Page, route = '/') {
  await page.addInitScript(() => sessionStorage.setItem('tony:intro:v2', 'seen'));
  await page.goto(route);
  await expect(page.locator('html')).toHaveAttribute('data-tony-effects', 'on');
}

async function scrollInstant(page: Page, top: number) {
  await page.evaluate(y => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, y); }, top);
}

test('el logo abre la intro inmediatamente y vuelve a Inicio desde una página interna', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await ready(page, '/contacto');
  const logo = page.locator('.tony-header-inner .brand');
  await logo.click();
  await expect(page.locator('.lagarto-intro[open]')).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.lagarto-intro .lagarto-head--reference')).toHaveCount(1);
  await expect(page.locator('.tribe-mascot .lagarto-head--reference')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('.lagarto-intro')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await logo.click();
  await expect(page.locator('.lagarto-intro[open]')).toBeVisible();
  await page.getByRole('button', { name: 'Saltar intro', exact: true }).click();
});

test('el brillo naranja usa la misma geometría y posición que las escamas', async ({ page, request }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await ready(page, '/contacto');
  const [base, joints] = await Promise.all(['/assets/escamas-tony-base.svg', '/assets/escamas-tony-uniones.svg'].map(async url => (await request.get(url)).text()));
  const signature = (svg: string) => svg.match(/<!-- scale-tile (\d+) (\d+) (\d+) -->/)?.slice(1);
  expect(signature(base)).toBeTruthy();
  expect(signature(joints)).toEqual(signature(base));
  const tile = `${signature(base)![0]}px`;
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--scale-tile').trim())).toBe(tile);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundSize)).toContain(`${tile} ${tile}`);
  // The page tiles a 2x bitmap of that same tile: far cheaper to draw than the vector original.
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundImage)).toContain('escamas-tony-base.webp');
  expect(await page.evaluate(() => new Promise<number>(resolve => { const image = new Image(); image.onload = () => resolve(image.naturalWidth); image.src = '/assets/escamas-tony-base.webp'; }))).toBe(parseFloat(tile) * 2);
  const glow = page.locator('.tony-scale-glow').first();
  expect(await glow.locator('.tony-scale-joints').evaluate(element => getComputedStyle(element).backgroundSize)).toBe(`${tile} ${tile}`);
  const layerOrigin = () => page.locator('.tony-scale-glow-layer').evaluate(element => { const box = element.getBoundingClientRect(); return [box.left + scrollX, box.top + scrollY]; });
  // The glow layer starts at the document origin, like the texture it lights.
  expect(await layerOrigin()).toEqual([0, 0]);
  for (const top of [0, 237]) {
    await scrollInstant(page, top);
    await page.mouse.move(420, 380);
    await page.mouse.move(436, 392, { steps: 4 });
    await expect.poll(() => glow.evaluate(element => Number(getComputedStyle(element).opacity))).toBeGreaterThan(.3);
    // Window position plus the joint layer's counter-shift must land on a whole tile: the seams stay put.
    const origin = await glow.evaluate((element, size) => {
      const outer = new DOMMatrix(getComputedStyle(element).transform);
      const inner = new DOMMatrix(getComputedStyle(element.firstElementChild!).transform);
      const [x, y] = getComputedStyle(element.firstElementChild!).backgroundPosition.split(' ').map(parseFloat);
      return [outer.m41 + inner.m41 + x, outer.m42 + inner.m42 + y].map(value => Math.abs(value - Math.round(value / size) * size));
    }, parseFloat(tile));
    expect(Math.max(...origin)).toBeLessThan(.01);
  }
  await page.setViewportSize({ width: 1180, height: 820 });
  expect(await layerOrigin()).toEqual([0, 0]);
});

test('cada clic deja un rasguño breve y limitado, nunca al arrastrar, con clic derecho ni sobre campos', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // Count scratches as they start: a 340 ms mark can finish before a slow assertion runs.
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    const log: number[] = [];
    (window as unknown as { __scratches: number[] }).__scratches = log;
    Element.prototype.animate = function (this: Element, ...args: Parameters<Element['animate']>) {
      const animation = animate.apply(this, args);
      if (this.closest('.tony-scratch-stage')) log.push(Number(animation.effect?.getComputedTiming().duration));
      return animation;
    };
  });
  await ready(page, '/contacto');
  const scratches = () => page.evaluate(() => (window as unknown as { __scratches: number[] }).__scratches.length);
  // Client-side navigation must not duplicate listeners: one click, one scratch.
  for (const name of ['Tony News', 'Inicio']) await page.locator('.tony-nav').getByRole('link', { name, exact: true }).click();
  await page.locator('.tony-utility').getByRole('link', { name: /Hablemos/ }).click();
  await expect(page).toHaveURL(/\/contacto$/);
  const stage = page.locator('.tony-scratch-stage');
  await expect(stage.locator('svg')).toHaveCount(4);
  const heading = page.locator('main h1').first();
  await expect(heading).toContainText('TÚ PONES LA IDEA');
  const before = await scratches();
  await heading.click({ position: { x: 20, y: 20 } });
  expect(await scratches()).toBe(before + 1);
  const duration = await page.evaluate(() => (window as unknown as { __scratches: number[] }).__scratches.at(-1)!);
  expect(duration).toBeGreaterThanOrEqual(250);
  expect(duration).toBeLessThanOrEqual(400);
  for (let index = 0; index < 9; index++) await heading.click({ position: { x: 30 + index * 9, y: 24 } });
  expect(await stage.evaluate(element => element.getAnimations({ subtree: true }).length)).toBeLessThanOrEqual(4);
  await expect.poll(() => stage.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
  await expect(stage.locator('svg')).toHaveCount(4);
  const settled = await scratches();
  const box = (await heading.boundingBox())!;
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + 160, box.y + 40, { steps: 6 });
  await page.mouse.up();
  await page.evaluate(() => getSelection()?.removeAllRanges());
  await heading.click({ position: { x: 20, y: 20 }, button: 'right' });
  await page.keyboard.press('Escape');
  expect(await scratches()).toBe(settled);
  await page.goto('/patrocinio');
  const field = page.locator('main input, main textarea').first();
  await field.scrollIntoViewIfNeeded();
  await field.click();
  expect(await scratches()).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});

test('cada 5,5 s sin tocar nada Tony asoma desde abajo, se queda mirando y huye al tocar o desplazarse', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // Freeze time before the page loads so a slow load can't let him in early.
  await page.clock.install();
  await page.clock.pauseAt(Date.now() + 1000);
  await ready(page, '/contacto');
  const peek = page.locator('.tony-peek');
  await page.clock.runFor(5000);
  await expect(peek).toHaveAttribute('data-state', 'off');
  await page.clock.runFor(700);
  await expect(peek).toHaveAttribute('data-state', 'enter');
  // Moving the pointer around is not an interaction that scares him.
  await page.mouse.move(400, 300);
  await page.mouse.move(640, 420, { steps: 5 });
  await page.clock.runFor(900);
  await expect(peek).toHaveAttribute('data-state', 'look');
  await page.clock.runFor(3000);
  await expect(peek).toHaveAttribute('data-state', 'look');
  const heading = (await page.locator('main h1').first().boundingBox())!;
  await page.mouse.click(heading.x + 30, heading.y + 30);
  await expect(peek).toHaveAttribute('data-state', 'flee');
  // He ducks out of sight, then waits another quiet 5.5 s before coming back.
  for (let step = 0; step < 40 && await peek.getAttribute('data-state') !== 'off'; step++) await page.clock.runFor(100);
  await expect(peek).toHaveAttribute('data-state', 'off');
  await page.clock.runFor(5000);
  await expect(peek).toHaveAttribute('data-state', 'off');
  await page.clock.runFor(800);
  await expect(peek).toHaveAttribute('data-state', 'enter');
  await page.clock.runFor(900);
  await expect(peek).toHaveAttribute('data-state', 'look');
  await scrollInstant(page, 180);
  await expect(peek).toHaveAttribute('data-state', 'flee');
  await expect(peek).toHaveCSS('pointer-events', 'none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});

test('al cambiar de apartado Tony se acerca, guiña y deja pasar sin bloquear clics', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    const phases: string[] = [];
    (window as unknown as { __phases: string[] }).__phases = phases;
    new MutationObserver(records => records.forEach(record => phases.push((record.target as HTMLElement).dataset.phase!)))
      .observe(document, { subtree: true, attributes: true, attributeFilter: ['data-phase'] });
  });
  await ready(page, '/contacto');
  const overlay = page.locator('.route-transition');
  await expect(overlay).toHaveCSS('pointer-events', 'none');
  await expect(overlay).toHaveAttribute('aria-hidden', 'true');
  // Armed once the page settles: its layers wait invisible, ready for the first frame.
  await expect(overlay).toHaveClass(/is-armed/, { timeout: 5000 });
  const phases = () => page.evaluate(() => (window as unknown as { __phases: string[] }).__phases.join(' '));
  expect(await phases()).toBe('');
  const link = (await page.locator('.tony-nav').getByRole('link', { name: 'Tony News', exact: true }).boundingBox())!;
  await page.mouse.click(link.x + link.width / 2, link.y + link.height / 2);
  await expect(overlay).toHaveAttribute('data-phase', 'cover');
  await expect(page.locator('html')).toHaveAttribute('data-route-cover', 'true');
  // Only transforms and opacity move, so the compositor keeps every frame while the page renders.
  const animated = await overlay.evaluate(element => [...new Set(element.getAnimations({ subtree: true }).flatMap(animation => (animation.effect as KeyframeEffect).getKeyframes().flatMap(frame => Object.keys(frame))))]);
  expect(animated.filter(property => !['offset', 'computedOffset', 'easing', 'composite'].includes(property)).sort()).toEqual(['opacity', 'transform']);
  await expect(page).toHaveURL(/\/tony-news$/);
  await expect.poll(phases, { timeout: 10000 }).toBe('cover wink reveal idle');
  await expect(page.locator('html')).not.toHaveAttribute('data-route-cover', /.*/);
  // The heading of the section arriving waits under the scales and rises as they open.
  const back = (await page.locator('.tony-nav').getByRole('link', { name: 'Inicio', exact: true }).boundingBox())!;
  await page.mouse.click(back.x + back.width / 2, back.y + back.height / 2);
  await expect(page).toHaveURL(/\/$/);
  await expect(overlay).toHaveAttribute('data-phase', /cover|wink/);
  expect(await page.locator('main h1').first().evaluate(heading => heading.getAnimations({ subtree: true }).length)).toBe(0);
  await expect.poll(() => page.locator('main h1').first().evaluate(heading => heading.getAnimations({ subtree: true }).length)).toBeGreaterThan(0);
  expect(await phases()).toMatch(/cover wink reveal idle cover wink reveal/);
  await expect.poll(phases, { timeout: 10000 }).toBe('cover wink reveal idle cover wink reveal idle');
  // The logo opens the intro instead of the section wink.
  await page.locator('.tony-header-inner .brand').click();
  await expect(page.locator('.lagarto-intro[open]')).toBeVisible();
  expect(await phases()).toBe('cover wink reveal idle cover wink reveal idle');
});

test('el control de pausa se recuerda y retira brillo, rasguños y lagartos', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await ready(page);
  await page.getByRole('button', { name: 'Pausar efectos', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-tony-effects', 'off');
  for (const layer of ['.tony-scale-glow-layer', '.tony-scratch-stage', '.tony-peek', '.route-transition']) await expect(page.locator(layer)).toBeHidden();
  await page.reload();
  const resume = page.getByRole('button', { name: 'Activar efectos', exact: true });
  await expect(resume).toHaveAttribute('aria-pressed', 'false');
  await resume.click();
  await expect(page.locator('html')).toHaveAttribute('data-tony-effects', 'on');
});

test('ninguna vista tiene un lagarto aferrado al borde ni se desplaza en horizontal', async ({ browser }) => {
  for (const settings of [
    { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } },
    { ...devices['iPhone SE'], viewport: { width: 320, height: 640 } },
    { ...devices['iPad Pro 11'], viewport: { width: 1366, height: 1024 } },
  ]) {
    const context = await browser.newContext({ ...settings, baseURL: 'http://127.0.0.1:3000', reducedMotion: 'no-preference' });
    const page = await context.newPage();
    try {
      await ready(page);
      await scrollInstant(page, 1400);
      await page.waitForTimeout(500);
      // Only the lizard that peeks after a quiet moment remains; none clings to the scroll edge.
      await expect(page.locator('.tony-mascot')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    } finally { await context.close(); }
  }
});

test('movimiento reducido conserva texto y navegación sin intro ni mascotas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-tony-effects', 'off');
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('.tony-peek')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Efectos en pausa' })).toBeDisabled();
  await page.goto('/contacto');
  await page.locator('.tony-header-inner .brand').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.lagarto-intro')).toHaveCount(0);
  const word = page.locator('main h1 .tony-reveal-word').first();
  await expect(word).toHaveCSS('opacity', '1');
  await expect(word).toHaveCSS('transform', 'none');
});
