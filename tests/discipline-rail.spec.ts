import {expect, test, type CDPSession, type Locator, type Page} from '@playwright/test';

async function openRail(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('tony:inicio:carteles:v3','[]');
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

async function swipe(session: CDPSession, x: number, y: number, dx: number, dy: number) {
  await session.send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[{x,y}]});
  for (let step=1;step<=8;step++) {
    await session.send('Input.dispatchTouchEvent', {type:'touchMove',touchPoints:[{x:x+dx*step/8,y:y+dy*step/8}]});
  }
  // End a deliberate drag with the finger still, rather than a fling.
  await new Promise(resolve => setTimeout(resolve,180));
  await session.send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]});
}

for (const [width,reduced] of [[390,false],[390,true],[768,false],[768,true],[1280,true]] as const) {
  test.describe(`pantalla táctil de ${width}px ${reduced?'en reposo':'en movimiento'}`, () => {
    test.use({viewport:{width,height:850},isMobile:true,hasTouch:true,reducedMotion:reduced?'reduce':'no-preference'});
    test('las dos filas siguen el dedo, permiten bajar la página y abrir una línea', async ({page}) => {
      await openRail(page);
      const session = await page.context().newCDPSession(page);
      const rows = page.locator('.home-marquee');
      for (const [index,dx] of [[0,-135],[1,135]] as const) {
        const row = rows.nth(index);
        await row.evaluate(el => el.scrollIntoView({block:'center',behavior:'instant'}));
        const box = (await row.boundingBox())!;
        const x = box.x+box.width/2, y = box.y+box.height/2;
        const period = await row.locator('li').first().evaluate(el =>
          el.parentElement!.children[7].getBoundingClientRect().left - el.getBoundingClientRect().left);
        if (reduced && width>=768) expect(Math.abs(period-box.width)).toBeLessThan(1);
        const before = await scroll(row);
        await swipe(session,x,y,dx,4);
        const after = await scroll(row);
        const distance = (after-before+period*1.5)%period-period/2;
        expect(Math.sign(distance)).toBe(-Math.sign(dx));
        expect(Math.abs(distance)).toBeGreaterThan(80);
        await expect(page).toHaveURL(/\/$/);
        if (reduced) {
          await page.waitForTimeout(320);
          const drift = (await scroll(row)-after+period*1.5)%period-period/2;
          expect(Math.abs(drift)).toBeLessThan(1);
        } else {
          await expect.poll(async () => {
            const offset = (await scroll(row)-after+period*1.5)%period-period/2;
            return index===0 ? -offset : offset;
          }).toBeGreaterThan(7);
        }
      }
      const rail = rows.last();
      const target = await rail.evaluate(el => {
        el.scrollIntoView({block:'center',behavior:'instant'});
        const b=el.getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2};
      });
      const beforeY = await page.evaluate(()=>scrollY);
      await swipe(session,target.x,target.y,6,-115);
      await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(beforeY+50);
      const anchor = await rail.evaluate(el => {
        el.scrollIntoView({block:'center',behavior:'instant'});
        const b=el.getBoundingClientRect(), x=b.x+b.width/2, y=b.y+b.height/2;
        return {x,y,href:document.elementFromPoint(x,y)?.closest('a')?.href};
      });
      expect(anchor.href).toBeTruthy();
      await page.touchscreen.tap(anchor.x,anchor.y);
      await expect(page).toHaveURL(anchor.href!);
    });
  });
}
