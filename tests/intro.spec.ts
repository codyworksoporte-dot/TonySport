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
    await page.goto('/',{waitUntil:'commit'});
    await expect(page.locator('main h1')).toBeAttached();
    // The server content exists, but the boot curtain must own the first paint.
    const curtain=await page.evaluate(()=>{
      const style=getComputedStyle(document.documentElement,'::before');
      return {content:style.content,position:style.position,visibility:style.visibility};
    });
    expect(curtain).toEqual({content:'""',position:'fixed',visibility:'visible'});
    await expect(page.locator('.lagarto-intro[open]')).toHaveCount(0);
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

test('la entrada del lagarto se reproduce una vez por sesión y se puede repetir',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const skip=page.getByRole('button',{name:'Saltar intro',exact:true});
  await expect(skip).toBeVisible();
  await expect(skip).toBeHidden({timeout:8000});
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('main h1')).toBeVisible();
  await expect(skip).toBeHidden();
  await page.getByRole('button',{name:'Repetir entrada del lagarto',exact:true}).click();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(skip).toBeHidden();
  // The page is usable right after: the header's search pill opens the site search.
  await page.getByRole('banner').getByRole('button',{name:'¿Qué buscas en específico?',exact:true}).click();
  await expect(page.getByRole('searchbox')).toBeVisible();
});

test('móvil permite usar la página inmediatamente sin esperar la intro',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.getByRole('button',{name:'Saltar intro',exact:true})).toBeHidden();
  await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.documentElement,'::before').content)).toBe('none');
  // No curtain on phones, so the poll passes before React hydrates; the menu button only works once it has.
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

test('el escudo mantiene el nombre aunque falle la imagen del logo',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  // The emblem is the logo file (srcset: tony-logo-240/640/960.webp and tony-logo.webp); losing it must still show the name.
  await page.route('**/assets/brand/tony-logo*.webp',route=>route.abort('failed'));
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const intro=page.locator('.lagarto-intro');
  await expect(intro).toBeVisible();
  await expect(intro.locator('[data-wordmark-status]')).toHaveAttribute('data-wordmark-status','fallback');
  await expect(intro.locator('[data-wordmark-fallback]')).toContainText('TONY');
  await expect(intro.locator('[data-wordmark-fallback]')).toBeAttached();
  await page.getByRole('button',{name:'Saltar intro',exact:true}).click();
  await expect(intro).toBeHidden();
});

test('el escudo de la intro muestra el logo también cuando la imagen ya está en caché',async({page})=>{
  // The home no longer renders the emblem: it only lives in the intro, so the cached logo is met on a replay.
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const intro=page.locator('.lagarto-intro');
  const logo=intro.locator('[data-wordmark-status]');
  await expect(logo).toHaveAttribute('data-wordmark-status','loaded');
  await page.getByRole('button',{name:'Saltar intro',exact:true}).click();
  await expect(intro).toHaveCount(0);
  // Second entrance: the logo now comes from the cache and must still count as drawn, never as the fallback.
  await page.getByRole('button',{name:'Repetir entrada del lagarto',exact:true}).click();
  await expect(intro).toBeVisible();
  await expect(logo).toHaveAttribute('data-wordmark-status','loaded');
  await expect(intro.locator('[data-wordmark-fallback]')).toHaveCount(0);
});
