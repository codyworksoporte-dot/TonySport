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
  await page.getByRole('button',{name:'Buscar en el sitio',exact:true}).click();
  await expect(page.getByRole('searchbox')).toBeVisible();
});

test('saltar la intro permite usar la página inmediatamente en móvil',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Saltar intro',exact:true}).click();
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
  await page.route('**/assets/tony-wordmark.webp',route=>route.abort('failed'));
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const intro=page.locator('.lagarto-intro');
  await expect(intro).toBeVisible();
  await expect(intro.locator('[data-wordmark-status]')).toHaveAttribute('data-wordmark-status','fallback');
  await expect(intro.locator('[data-wordmark-fallback]')).toContainText('TONY');
  await expect(intro.locator('[data-wordmark-fallback]')).toBeAttached();
  await page.getByRole('button',{name:'Saltar intro',exact:true}).click();
  await expect(intro).toBeHidden();
});

test('el emblema de la portada muestra el logo aunque la imagen llegue antes de hidratar',async({page})=>{
  await page.addInitScript(()=>sessionStorage.setItem('tony:intro:v2','seen'));
  await page.goto('/');
  // Second visit: the wordmark now comes from the cache, before React can hear its load event.
  await page.reload();
  const emblem=page.locator('.tribe-mascot');
  await emblem.scrollIntoViewIfNeeded();
  await expect(emblem.locator('[data-wordmark-status]')).toHaveAttribute('data-wordmark-status','loaded');
  await expect(emblem.locator('[data-wordmark-fallback]')).toHaveCount(0);
});
