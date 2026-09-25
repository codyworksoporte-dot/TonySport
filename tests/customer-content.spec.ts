import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});});

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

test('las cifras sociales enlazan los perfiles oficiales con fecha y precisión visible',async({page})=>{
  await page.goto('/');
  const social=page.locator('.social-community');
  await expect(social).toContainText('152');
  await expect(social).toContainText('29,3 mil');
  await expect(social).toContainText('1.194');
  await expect(social).toContainText('Actualización manual');
  await expect(social.locator('a[href="https://www.instagram.com/tonysportswearsv/"]')).toHaveCount(1);
  await expect(social.locator('a[href="https://www.tiktok.com/@tonysportswear"]')).toHaveCount(1);
  await expect(social.locator('a[href="https://www.facebook.com/p/Tony-Sportswear-San-Salvador-61571308625133/"]')).toHaveCount(1);
});
