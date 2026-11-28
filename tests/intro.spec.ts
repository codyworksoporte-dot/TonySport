import {test,expect} from '@playwright/test';

test('la primera pantalla queda cubierta antes de hidratar aunque el JavaScript tarde',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  let releaseScripts!: () => void;
  const scriptsReady = new Promise<void>(resolve=>{releaseScripts=resolve;});
  await page.route('**/_next/static/**',async route=>{
    if(route.request().resourceType()==='script') await scriptsReady;
    await route.continue();
  });
  try {
    await page.goto('/',{waitUntil:'domcontentloaded'});
    await expect(page.locator('main h1')).toBeAttached();
    // The server content exists, but the boot curtain must own the first paint.
    const curtain=await page.evaluate(()=>{
      const style=getComputedStyle(document.documentElement,'::before');
      return {content:style.content,position:style.position,visibility:style.visibility};
    });
    expect(curtain).toEqual({content:'""',position:'fixed',visibility:'visible'});
    await expect(page.locator('.brand-intro[open]')).toHaveCount(0);
  } finally {
    releaseScripts();
  }
  const skip=page.getByRole('button',{name:'Saltar intro',exact:true});
  await expect(skip).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.documentElement,'::before').content)).toBe('none');
  await skip.click();
  await expect(skip).toBeHidden();
  await expect(page.locator('body')).not.toHaveCSS('overflow','hidden');
});

test('la entrada del logo se reproduce una vez por sesión y se puede repetir',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/',{waitUntil:'commit'});
  const skip=page.getByRole('button',{name:'Saltar intro',exact:true});
  await expect(skip).toBeVisible();
  await expect(skip).toBeHidden({timeout:8000});
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('main h1')).toBeVisible();
  await expect(skip).toBeHidden();
  await page.getByRole('button',{name:'Repetir animación del logo',exact:true}).click();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(skip).toBeHidden();
  // The page is usable right after: the header's search pill opens the site search.
  await page.getByRole('banner').getByRole('button',{name:'¿Qué buscas en específico?',exact:true}).click();
  await expect(page.getByRole('searchbox')).toBeVisible();
});

test('en móvil se puede saltar la animación y acceder al menú',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.clock.install();
  await page.clock.pauseAt(Date.now() + 250);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/',{waitUntil:'commit'});
  await expect(page.getByRole('button',{name:'Saltar intro',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');
  await page.clock.resume();
  await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.documentElement,'::before').content)).toBe('none');
  await expect(page.locator('html')).toHaveAttribute('data-tony-effects','on');
  await page.getByRole('button',{name:'Abrir menú',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Menú de Tony Sportswear'}).getByRole('navigation',{name:'Navegación principal',exact:true})).toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow','hidden');
});

test('movimiento reducido y las páginas internas no muestran la intro',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Saltar intro',exact:true})).toBeHidden();
  await page.goto('/configurador');
  await expect(page.getByRole('button',{name:'Saltar intro',exact:true})).toBeHidden();
});

test('la entrada mantiene el nombre aunque falle la imagen del logo',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.route('**/assets/brand/tony-wordmark*.webp',route=>route.abort('failed'));
  await page.goto('/',{waitUntil:'commit'});
  const intro=page.locator('.brand-intro');
  await expect(intro).toBeVisible();
  await expect(intro.locator('.intro-wordmark-fallback')).toContainText('TONY');
  await expect(intro.locator('.intro-wordmark-fallback')).toBeAttached();
  await page.getByRole('button',{name:'Saltar intro',exact:true}).click();
  await expect(intro).toBeHidden();
});

test('la entrada muestra el logo también cuando la imagen ya está en caché',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/',{waitUntil:'commit'});
  const intro=page.locator('.brand-intro');
  const logo=intro.locator('.intro-wordmark img');
  await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Saltar intro',exact:true}).click();
  await expect(intro).toHaveCount(0);
  // Second entrance: the logo now comes from the cache and must still count as drawn, never as the fallback.
  await page.getByRole('button',{name:'Repetir animación del logo',exact:true}).click();
  await expect(intro).toBeVisible();
  await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(intro.locator('.intro-wordmark-fallback')).toHaveCount(0);
});
