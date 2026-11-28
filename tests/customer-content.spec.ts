import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// La burbuja de bienvenida del asistente (solo en la primera visita) se da por vista para que no tape el formulario.
test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>{try{localStorage.setItem('tony-assistant-hint-v1','1');}catch{/* Sin almacenamiento la burbuja no se programa. */}});
});

test('la reseña valida, conserva el borrador y prepara compartir sin inventar una publicación',async({page})=>{
  await page.goto('/resenas');
  await expect(page.getByText('Todavía no hay reseñas publicadas en esta web.',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Revisar mi reseña'}).click();
  await expect(page.locator('#review-alias')).toBeFocused();
  await expect(page.locator('#review-alias')).toHaveAttribute('aria-invalid','true');
  await page.locator('#review-alias').fill('Equipo Ciprés');
  await page.getByRole('button',{name:'Revisar mi reseña'}).click();
  await expect(page.locator('#review-rating')).toBeFocused();
  await page.getByRole('radio',{name:'5 estrellas',exact:true}).check();
  await page.locator('#review-text').fill('Nos ayudaron a preparar los colores y todas las tallas del equipo.');
  await page.reload();
  await expect(page.locator('#review-alias')).toHaveValue('Equipo Ciprés');
  await expect(page.getByRole('radio',{name:'5 estrellas',exact:true})).toBeChecked();
  await page.getByRole('button',{name:'Revisar mi reseña'}).click();
  await expect(page.getByRole('heading',{name:'Así la compartirás.'})).toBeFocused();
  await expect(page.locator('.review-prepared')).toContainText('Todavía no se ha enviado ni publicado.');
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  const url=new URL((await page.getByRole('link',{name:'Compartir reseña con Tony'}).getAttribute('href'))!);
  expect(url.origin).toBe('https://wa.me');
  expect(url.searchParams.get('text')).toContain('Equipo Ciprés');
  expect(url.searchParams.get('text')).toContain('Valoración: 5/5');
  await page.getByRole('button',{name:'Volver a editar'}).click();
  await expect(page.locator('#review-alias')).toBeFocused();
  await expect(page.locator('#review-text')).toHaveValue('Nos ayudaron a preparar los colores y todas las tallas del equipo.');
  await expect(page.locator('.published-reviews article')).toHaveCount(0);
});

test('fallo al guardar reseña permite continuar y error al copiar ofrece reintento',async({page})=>{
  await page.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='tony-review-draft-v1')throw new DOMException('Full','QuotaExceededError');return original.call(this,key,value);};Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('denied'))}});});
  await page.goto('/resenas');
  await expect(page.getByText('El navegador no pudo guardar el borrador.',{exact:false})).toBeVisible();
  await page.locator('#review-alias').fill('María');
  await page.getByRole('radio',{name:'4 estrellas',exact:true}).check();
  await page.locator('#review-text').fill('El equipo quedó satisfecho con sus uniformes.');
  await page.getByRole('button',{name:'Revisar mi reseña'}).click();
  await page.getByRole('button',{name:'Copiar reseña'}).click();
  await expect(page.getByText('No se pudo copiar.',{exact:false})).toBeVisible();
  await expect(page.getByRole('link',{name:'Compartir reseña con Tony'})).toBeVisible();
});

// /resenas sigue publicada (se llega por enlace directo), pero el rediseño la sacó de la navegación.
test('reseñas abre por enlace directo, pero ni el encabezado, ni el menú, ni el pie, ni la búsqueda la enlazan',async({page})=>{
  const response=await page.goto('/resenas');expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading',{level:1})).toContainText('TU EXPERIENCIA');
  const toReviews='a[href^="/resenas"]';
  const banner=page.getByRole('banner'),footer=page.getByRole('contentinfo');
  await expect(banner.getByRole('button',{name:'¿Qué buscas en específico?',exact:true})).toBeVisible();
  await expect(banner.locator(toReviews)).toHaveCount(0);
  await expect(page.getByRole('navigation',{name:'Accesos rápidos'})).toHaveCount(0);
  await expect(footer.getByRole('navigation',{name:'Ayuda',exact:true})).toBeVisible();
  await expect(footer.locator(toReviews)).toHaveCount(0);
  await expect(footer.getByRole('link',{name:/reseña/i})).toHaveCount(0);

  await page.getByRole('button',{name:'Abrir menú',exact:true}).click();
  const menu=page.getByRole('dialog',{name:'Menú de Tony Sportswear'});
  await expect(menu.getByRole('navigation',{name:'Navegación principal',exact:true})).toBeVisible();
  await expect(menu.getByRole('link',{name:'Tony News',exact:true})).toBeVisible();
  await expect(menu.locator(toReviews)).toHaveCount(0);
  await expect(menu.getByRole('link',{name:/reseña/i})).toHaveCount(0);
  await page.keyboard.press('Escape');await expect(menu).toBeHidden();

  await banner.getByRole('button',{name:'¿Qué buscas en específico?',exact:true}).click();
  const search=page.getByRole('dialog',{name:/QUÉ BUSCAS/});
  const field=search.getByLabel('Buscar una sección',{exact:true}),count=search.locator('.tony-search-count');
  await expect(search.locator(toReviews)).toHaveCount(0);
  for(const word of ['reseñas','reseña','opiniones','testimonios']){
    // Clearing first means the results read below belong to this word.
    await field.fill('');await expect(count).toHaveAttribute('data-state','initial');
    await field.fill(word);await expect(count).not.toHaveAttribute('data-state','initial');
    await expect(search.locator(toReviews),word).toHaveCount(0);
    await expect(search.getByRole('link',{name:/reseña/i}),word).toHaveCount(0);
  }
});

// Las cifras sociales de la portada (con su actualización manual) se retiraron; los perfiles oficiales quedan en el pie de cada página.
test('las cifras sociales salieron de la portada y el pie enlaza los perfiles oficiales en otra pestaña',async({page})=>{
  await page.goto('/');
  const main=page.getByRole('main');
  await expect(main.getByRole('heading',{level:1})).toHaveText('Crear mi pedido');
  await expect(main.locator('.social-community, .social-count')).toHaveCount(0);
  await expect(main).not.toContainText('Actualización manual');
  await expect(main.locator('a[href*="instagram.com"], a[href*="facebook.com"], a[href*="tiktok.com"]')).toHaveCount(0);
  const social=page.getByRole('contentinfo').getByRole('list',{name:'Redes de Tony',exact:true});
  await expect(social.getByRole('link')).toHaveCount(3);
  for(const [name,href] of [['Facebook: Tony Sportswear San Salvador','https://www.facebook.com/p/Tony-Sportswear-San-Salvador-61571308625133/'],['Instagram: @tonysportswearsv','https://www.instagram.com/tonysportswearsv/'],['TikTok: @tonysportswear','https://www.tiktok.com/@tonysportswear']]){
    const profile=social.getByRole('link',{name,exact:true});
    await expect(profile).toHaveAttribute('href',href);await expect(profile).toHaveAttribute('target','_blank');await expect(profile).toHaveAttribute('rel','noopener noreferrer');
  }
});
