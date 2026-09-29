import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// La entrada animada se prueba por separado; aquí se revisa el contenido estable.
test.beforeEach(async ({page}) => { await page.emulateMedia({reducedMotion:'reduce'}); });

test('páginas navegables sin errores de hidratación ni barreras WCAG detectadas',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  for(const route of ['/','/catalogo','/contacto','/nosotros','/configurador']){
    const response=await page.goto(route);expect(response?.status()).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
    await page.evaluate(()=>document.fonts.ready);
    const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    expect(scan.violations,`${route}: ${JSON.stringify(scan.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})))}`).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test('menú móvil, búsqueda, Escape y preguntas frecuentes',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');
  await page.getByRole('button',{name:'Abrir menú',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Menú de Tony Sportswear'}).getByRole('navigation',{name:'Navegación principal',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Abrir menú',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Buscar en el sitio',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('searchbox').fill('catalogo');
  await page.getByRole('dialog').getByRole('link',{name:'70 diseños para personalizar',exact:true}).click();
  await expect(page).toHaveURL(/\/catalogo$/);await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.goto('/');await page.getByText('¿Puedo crear el uniforme de mi equipo?',{exact:true}).click();
  await expect(page.locator('details').first()).toHaveAttribute('open','');
  await page.goto('/esta-pagina-no-existe');await expect(page.getByRole('heading',{level:1})).toContainText('SE NOS ESCAPÓ');
});

test('la portada ordena sus secciones y muestra la referencia del futuro tutorial',async({page})=>{
  await page.goto('/');
  await expect(page.locator('main .section-index')).toHaveText(['01','02','03','04','05','06','07','08']);
  await expect(page.locator('#lineas-tony')).toHaveCount(0);
  await expect(page.locator('#como-funciona .section-index')).toHaveText('01');
  await expect(page.locator('.hero').getByRole('link',{name:'Explora Producto'})).toHaveAttribute('href','/producto');
  await expect(page.locator('.process-step')).toHaveCount(3);
  await expect(page.locator('.process-step svg,.image-tag svg')).toHaveCount(0);
  const tutorial=page.locator('#tutorial');
  await expect(tutorial.getByRole('img')).toBeVisible();
  await expect(tutorial).toContainText('Imagen referencial. Aquí estará el video tutorial cuando esté disponible.');
  await expect(tutorial.locator('button,video,iframe,input')).toHaveCount(0);
  await expect(page.locator('.home-customizer')).toHaveCount(0);
  await expect(page.locator('.home-client-hub a[href="/recientes"]')).toBeVisible();
  await expect(page.locator('.home-client-hub a[href="/resenas"]')).toBeVisible();
  const social=page.locator('.social-community');
  await expect(social.locator('.social-count')).toHaveCount(3);
  await expect(social).toContainText('Actualización manual.');
  for(const destination of ['https://www.instagram.com/tonysportswearsv/','https://www.facebook.com/p/Tony-Sportswear-San-Salvador-61571308625133/','https://www.tiktok.com/@tonysportswear']){
    await expect(social.locator(`a[href="${destination}"]`)).toHaveAttribute('target','_blank');
  }
  await page.locator('.hero').getByRole('link',{name:'Crea tu uniforme'}).click();
  await expect(page.getByRole('button',{name:'CREAR MI PEDIDO ↗',exact:true})).toBeVisible();
});

test('sin desbordamiento horizontal en móvil y con movimiento reducido',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:900});
    for(const route of ['/','/catalogo','/contacto','/nosotros','/configurador']){
      await page.goto(route);await expect(page.locator('main')).toBeVisible();
      const sizes=await page.evaluate(()=>({content:document.documentElement.scrollWidth,screen:innerWidth}));
      expect(sizes.content,`${route} en ${width}px`).toBeLessThanOrEqual(sizes.screen);
    }
  }
});
