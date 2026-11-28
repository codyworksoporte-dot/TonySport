import {expect, test, type Locator, type Page} from '@playwright/test';

async function openRail(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('tony:inicio:carteles:v2','[]');
    sessionStorage.setItem('tony:intro:wordmark:v1','seen');
  });
  await page.goto('/');
  const rail = page.locator('.home-marquee').first();
  await expect(rail).toHaveAttribute('data-interactive','');
  await rail.scrollIntoViewIfNeeded();
  return rail;
}

const scroll = (rail: Locator) => rail.evaluate(element => element.scrollLeft);

test('arrastrar las disciplinas desplaza la fila y al soltar se recupera su marcha', async ({page}) => {
  await page.setViewportSize({width:1200, height:900});
  const rail = await openRail(page);
  const box = (await rail.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x,y);
  await page.mouse.down();
  const before = await scroll(rail);
  await page.mouse.move(x - 165,y,{steps:10});
  await expect(rail).toHaveAttribute('data-dragging','');
  // The rail may wrap to an identical copy of the list in the middle of the drag.
  const cycle = await rail.locator('li').first().evaluate(item => item.getBoundingClientRect().width * item.parentElement!.querySelectorAll('li:not([data-copy])').length);
  const travelled = ((await scroll(rail)) - before + cycle) % cycle;
  expect(travelled).toBeGreaterThan(155);
  expect(travelled).toBeLessThan(175);
  // Hold the pointer still, then release. The first row's resting direction is to the right.
  await page.waitForTimeout(150);
  await page.mouse.up();
  await expect(rail).not.toHaveAttribute('data-dragging','');
  const after = await scroll(rail);
  await expect.poll(() => scroll(rail)).toBeLessThan(after - 4);
  await expect(page).toHaveURL(/\/$/);
});

test('con movimiento reducido se puede explorar con el teclado sin desplazamiento automático', async ({page}) => {
  await page.setViewportSize({width:320,height:740});
  await page.emulateMedia({reducedMotion:'reduce'});
  const rail = await openRail(page);
  const first = rail.locator('li:not([data-copy]) a').first();
  const second = rail.locator('li:not([data-copy]) a').nth(1);
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(second).toBeFocused();
  const after = await scroll(rail);
  await page.waitForTimeout(240);
  expect(await scroll(rail)).toBe(after);
  const url = await second.getAttribute('href');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new URL(url!,page.url()).href);
});
